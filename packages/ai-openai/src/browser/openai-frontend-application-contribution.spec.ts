// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { expect } from 'chai';
import { PreferenceService } from '@theia/core';
import { AICorePreferences } from '@theia/ai-core/lib/common/ai-core-preferences';
import { DiscoveredModel } from '@theia/ai-core/lib/common';
import { OpenAiCustomEndpointDescription, OpenAiModelDescription } from '../common';
import { CUSTOM_ENDPOINTS_PREF, OpenAiPreferencesSchema, USE_RESPONSE_API_PREF } from '../common/openai-preferences';
import { OpenAiFrontendApplicationContribution } from './openai-frontend-application-contribution';

disableJSDOM();

class TestOpenAiFrontendApplicationContribution extends OpenAiFrontendApplicationContribution {
    protected override readonly preferenceService = {
        get: <T>(name: string, defaultValue: T): T =>
            name === USE_RESPONSE_API_PREF && this.officialUseResponseApi !== undefined ? this.officialUseResponseApi as T : defaultValue
    } as PreferenceService;

    protected override aiCorePreferences = { get: () => undefined } as unknown as AICorePreferences;

    constructor(protected readonly officialUseResponseApi: boolean | undefined) {
        super();
    }

    override createModelDescription(model: DiscoveredModel): OpenAiModelDescription {
        return super.createModelDescription(model);
    }

    override createCustomModelDescriptionsFromPreferences(
        preferences: Partial<OpenAiCustomEndpointDescription>[]
    ): OpenAiModelDescription[] {
        return super.createCustomModelDescriptionsFromPreferences(preferences);
    }
}

describe('OpenAiFrontendApplicationContribution Responses API defaults', () => {
    it('defaults the official preference schema to true', () => {
        expect(OpenAiPreferencesSchema.properties[USE_RESPONSE_API_PREF].default).to.equal(true);
    });

    for (const officialSetting of [undefined, true, false]) {
        it(`uses ${officialSetting ?? true} for official models when the preference is ${officialSetting}`, () => {
            const contribution = new TestOpenAiFrontendApplicationContribution(officialSetting);
            const description = contribution.createModelDescription({ id: 'gpt-4o' });
            expect(description.useResponseApi).to.equal(officialSetting ?? true);
        });

        for (const customSetting of [undefined, false, true]) {
            it(`uses ${customSetting ?? false} for custom setting ${customSetting} independently of official setting ${officialSetting}`, () => {
                const contribution = new TestOpenAiFrontendApplicationContribution(officialSetting);
                // `useResponseApi` is an endpoint-level setting of the two-level preference.
                const endpoint: Partial<OpenAiCustomEndpointDescription> = {
                    url: 'https://example.com/v1',
                    useResponseApi: customSetting,
                    models: [{ model: 'custom-model' }]
                };
                const descriptions = contribution.createCustomModelDescriptionsFromPreferences([endpoint]);
                expect(descriptions).to.have.lengthOf(1);
                expect(descriptions[0].useResponseApi).to.equal(customSetting ?? false);
            });
        }
    }
});

describe('OpenAiFrontendApplicationContribution custom endpoint flattening', () => {

    it('uses the new two-level preference schema key and requires url + models', () => {
        const schema = OpenAiPreferencesSchema.properties[CUSTOM_ENDPOINTS_PREF];
        const itemSchema = schema.items as { required?: string[]; properties?: Record<string, { type?: unknown }> };
        expect(schema.type).to.equal('array');
        expect(itemSchema.required).to.deep.equal(['url', 'models']);
        // SECURITY: the endpoint key must be a plain string — no `true` (use the global key) option.
        expect(itemSchema.properties?.apiKey?.type).to.equal('string');
    });

    it('flattens one endpoint with several models into one description per model', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([{
            url: 'https://gw.example.com/v1',
            apiKey: 'gw-key',
            models: [{ model: 'qwen-max' }, { model: 'deepseek-v4' }]
        }]);
        expect(descriptions.map(d => d.model)).to.deep.equal(['qwen-max', 'deepseek-v4']);
        expect(descriptions.every(d => d.url === 'https://gw.example.com/v1' && d.apiKey === 'gw-key')).to.be.true;
    });

    it('inherits endpoint-level settings and forwards per-model capabilities', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([{
            url: 'https://gw.example.com/v1',
            apiKey: 'k',
            useResponseApi: true,
            headers: { 'X-Gateway': 'yes' },
            models: [{
                model: 'm1',
                id: 'My Model',
                contextWindow: 900000,
                maxOutputTokens: 131072,
                supportsImages: false,
                enableStreaming: false,
                supportsStructuredOutput: false
            }]
        }]);
        expect(descriptions).to.have.lengthOf(1);
        const d = descriptions[0];
        expect(d.id).to.equal('My Model');
        expect(d.useResponseApi).to.be.true;
        expect(d.headers).to.deep.equal({ 'X-Gateway': 'yes' });
        expect(d.contextWindow).to.equal(900000);
        expect(d.maxOutputTokens).to.equal(131072);
        expect(d.supportsImages).to.be.false;
        expect(d.enableStreaming).to.be.false;
        expect(d.supportsStructuredOutput).to.be.false;
    });

    it('drops legacy flat entries (no `models` array) instead of migrating them', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([
            { model: 'old-model', url: 'https://old.example.com/v1' } as unknown as Partial<OpenAiCustomEndpointDescription>
        ]);
        expect(descriptions).to.be.empty;
    });

    it('SECURITY: never applies the global key (apiKey `true`) to a custom endpoint', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([{
            url: 'https://third-party.example.com/v1',
            apiKey: true as unknown as string,
            models: [{ model: 'm1' }]
        }]);
        expect(descriptions).to.have.lengthOf(1);
        expect(descriptions[0].apiKey).to.be.undefined;
    });

    it('omits the key entirely when the endpoint declares none', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([{
            url: 'https://local.example.com/v1',
            models: [{ model: 'm1' }]
        }]);
        expect(descriptions[0].apiKey).to.be.undefined;
    });

    it('disambiguates duplicate default model ids across endpoints with a positional suffix', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([
            { url: 'https://a.example.com/v1', models: [{ model: 'shared' }] },
            { url: 'https://b.example.com/v1', models: [{ model: 'shared', id: 'explicit' }] },
            { url: 'https://c.example.com/v1', models: [{ model: 'shared' }] }
        ]);
        expect(descriptions.map(d => d.id)).to.deep.equal(['shared@1', 'explicit', 'shared@3']);
    });

    it('skips endpoints without a usable url or an empty model list', () => {
        const contribution = new TestOpenAiFrontendApplicationContribution(undefined);
        const descriptions = contribution.createCustomModelDescriptionsFromPreferences([
            { models: [{ model: 'm1' }] },
            { url: '' , models: [{ model: 'm1' }] },
            { url: 'https://x.example.com/v1', models: [] },
            { url: 'https://y.example.com/v1', models: [{ model: 'ok' }] }
        ]);
        expect(descriptions).to.have.lengthOf(1);
        expect(descriptions[0].model).to.equal('ok');
    });
});
