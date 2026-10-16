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
     * before starting with untranslated default values.
     *
     * Without a timeout a backend that never answers (e.g. its localization cache is
     * locked by another running instance) would block the preload phase forever,
     * leaving the application window blank.
     */
    protected readonly localizationLoadTimeout: number = 10000;

    /**
     * Fork customization: this build is Chinese-only (zh-cn). System language detection,
     * the `defaultLocale` frontend configuration and any fallback to other languages
     * have been removed; the zh-cn localization is always loaded.
     */
    async initialize(): Promise<void> {
        const locale = nls.defaultLocale;
        try {
            const localization = await this.loadLocalization(locale);
            if (localization.languagePack) {
                nls.localization = localization;
            }
        } catch (error) {
            // Never block application startup on localization loading failures:
            // the source strings are already Chinese in this build.
            console.error(`Failed to load localization data for locale '${locale}'. Falling back to the default values.`, error);
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
