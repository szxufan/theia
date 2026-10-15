// *****************************************************************************
// Copyright (C) 2023 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { PreloadContribution } from './preloader';
import { FrontendApplicationConfigProvider } from '../frontend-application-config-provider';
import { nls } from '../../common/nls';
import { inject, injectable, named } from 'inversify';
import { Localization } from '../../common/i18n/localization';
import { LocalizationServer } from '../../common/i18n/localization-server';
import { ContributionProvider } from '../../common/contribution-provider';
import { TextReplacementContribution } from './text-replacement-contribution';

@injectable()
export class I18nPreloadContribution implements PreloadContribution {

    @inject(LocalizationServer)
    protected readonly localizationServer: LocalizationServer;

    @inject(ContributionProvider) @named(TextReplacementContribution)
    protected readonly replacementContributions: ContributionProvider<TextReplacementContribution>;

    /**
     * Maximum time in milliseconds to wait for localization data from the backend
     * before falling back to the default locale.
     *
     * Without a timeout a backend that never answers (e.g. its localization cache is
     * locked by another running instance) would block the preload phase forever,
     * leaving the application window blank.
     */
    protected readonly localizationLoadTimeout: number = 10000;

    async initialize(): Promise<void> {
        const defaultLocale = FrontendApplicationConfigProvider.get().defaultLocale;
        if (!nls.locale && !defaultLocale) {
            // No persisted user choice and no configured default: follow the system language for Chinese
            const systemLanguage = navigator.language.toLowerCase();
            if (systemLanguage.startsWith('zh')) {
                Object.assign(nls, {
                    locale: systemLanguage.startsWith('zh-tw') || systemLanguage.startsWith('zh-hant') ? 'zh-tw' : 'zh-cn'
                });
            }
        }
        if (defaultLocale && !nls.locale) {
            Object.assign(nls, {
                locale: defaultLocale
            });
        }
        let locale = nls.locale ?? nls.defaultLocale;
        if (nls.locale) {
            try {
                const localization = await this.loadLocalization(locale);
                if (localization.languagePack) {
                    nls.localization = localization;
                } else if (locale !== nls.defaultLocale) {
                    // In case the localization that we've loaded doesn't localize Theia completely (languagePack is false)
                    // We simply reset the locale to the default again
                    Object.assign(nls, {
                        locale: defaultLocale || undefined
                    });
                    locale = defaultLocale;
                }
            } catch (error) {
                // Never block application startup on localization loading failures:
                // fall back to the default locale instead.
                console.error(`Failed to load localization data for locale '${locale}'. Falling back to the default locale.`, error);
                Object.assign(nls, {
                    locale: defaultLocale || undefined
                });
                locale = defaultLocale;
            }
        }
        const replacements = this.getReplacements(locale);
        if (Object.keys(replacements).length > 0) {
            nls.localization ??= { translations: {}, languageId: locale };
            nls.localization.replacements = replacements;
        }
    }

    protected async loadLocalization(locale: string): Promise<Localization> {
        let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_resolve, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(`Timed out after ${this.localizationLoadTimeout} ms.`)), this.localizationLoadTimeout);
        });
        try {
            return await Promise.race([this.localizationServer.loadLocalization(locale), timeout]);
        } finally {
            clearTimeout(timeoutHandle);
        }
    }

    protected getReplacements(locale: string): Record<string, string> {
        const replacements: Record<string, string> = {};
        for (const contribution of this.replacementContributions.getContributions()) {
            Object.assign(replacements, contribution.getReplacement(locale));
        }
        return replacements;
    }

}
