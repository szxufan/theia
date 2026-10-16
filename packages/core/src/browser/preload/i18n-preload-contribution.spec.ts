// *****************************************************************************
// Copyright (C) 2026 the fork maintainers and others.
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

import { enableJSDOM } from '../test/jsdom';
let disableJSDOM = enableJSDOM();

import { expect } from 'chai';
import { nls } from '../../common/nls';
import { Localization } from '../../common/i18n/localization';
import { LocalizationServer } from '../../common/i18n/localization-server';
import { ContributionProvider } from '../../common/contribution-provider';
import { TextReplacementContribution } from './text-replacement-contribution';
import { I18nPreloadContribution } from './i18n-preload-contribution';

disableJSDOM();

/** Shortens the localization load timeout so that tests do not wait for the production value. */
class TestI18nPreloadContribution extends I18nPreloadContribution {
    protected override readonly localizationLoadTimeout = 50;
}

describe('I18nPreloadContribution', function (): void {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    function createContribution(
        loadLocalization: LocalizationServer['loadLocalization'],
        replacementContributions: TextReplacementContribution[] = []
    ): I18nPreloadContribution {
        const contribution = new TestI18nPreloadContribution();
        Object.assign(contribution, {
            localizationServer: <LocalizationServer>{ loadLocalization },
            replacementContributions: <ContributionProvider<TextReplacementContribution>><unknown>{
                getContributions: () => replacementContributions
            }
        });
        return contribution;
    }

    let originalConsoleError: typeof console.error;

    beforeEach(() => {
        nls.localization = undefined;
        originalConsoleError = console.error;
        console.error = () => { };
    });

    afterEach(() => {
        console.error = originalConsoleError;
        nls.localization = undefined;
    });

    it('is pinned to zh-cn', () => {
        expect(nls.defaultLocale).to.equal('zh-cn');
        expect(nls.locale).to.equal('zh-cn');
    });

    it('always loads the zh-cn localization data when the backend answers', async () => {
        const localization: Localization = { languageId: 'zh-cn', languagePack: true, translations: { key: 'value' } };
        const requestedLocales: string[] = [];
        const contribution = createContribution(locale => {
            requestedLocales.push(locale);
            return Promise.resolve(localization);
        });

        await contribution.initialize();

        expect(requestedLocales).to.deep.equal(['zh-cn']);
        expect(nls.localization).to.deep.equal(localization);
    });

    it('keeps the default values when the loaded localization is not a language pack', async () => {
        const contribution = createContribution(() => Promise.resolve({ languageId: 'zh-cn', languagePack: false, translations: {} }));

        await contribution.initialize();

        expect(nls.locale).to.equal('zh-cn');
        expect(nls.localization).to.be.undefined;
    });

    it('does not block startup when the backend request fails', async () => {
        const contribution = createContribution(() => Promise.reject(new Error('backend unavailable')));

        await contribution.initialize();

        expect(nls.locale).to.equal('zh-cn');
        expect(nls.localization).to.be.undefined;
    });

    it('does not block startup when the backend never answers', async () => {
        // Regression test: a backend that never resolves must not block the preload phase forever.
        const contribution = createContribution(() => new Promise<Localization>(() => { }));

        await contribution.initialize();

        expect(nls.locale).to.equal('zh-cn');
        expect(nls.localization).to.be.undefined;
    });

    it('applies text replacements even when the backend request fails', async () => {
        const contribution = createContribution(() => Promise.reject(new Error('backend unavailable')), [
            <TextReplacementContribution><unknown>{ getReplacement: () => ({ 'some.key': '替换文本' }) }
        ]);

        await contribution.initialize();

        expect(nls.localization?.replacements).to.deep.equal({ 'some.key': '替换文本' });
    });
});
