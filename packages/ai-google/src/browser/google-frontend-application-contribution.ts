// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
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

import { inject, injectable } from '@theia/core/shared/inversify';
import { GoogleLanguageModelsManager, GoogleModelDescription } from '../common';
import { ALLOW_ENV_API_KEY_PREF, API_KEY_PREF, MODEL_OVERRIDES_PREF, MAX_RETRIES, RETRY_DELAY_OTHER_ERRORS, RETRY_DELAY_RATE_LIMIT } from '../common/google-preferences';
import { nls, PreferenceChange } from '@theia/core';
import { DiscoveringProviderContribution, ModelDiscoveryMessages } from '@theia/ai-core/lib/browser';
import { DiscoveredModel } from '@theia/ai-core/lib/common';

const GOOGLE_PROVIDER_ID = 'google';

@injectable()
export class GoogleFrontendApplicationContribution extends DiscoveringProviderContribution<GoogleModelDescription> {

    @inject(GoogleLanguageModelsManager)
    protected readonly manager: GoogleLanguageModelsManager;

    protected readonly providerId = GOOGLE_PROVIDER_ID;
    protected readonly providerLabel = 'Google Gemini';
    protected readonly modelOverridesPreference = MODEL_OVERRIDES_PREF;
    protected readonly allowEnvironmentApiKeyPreference = ALLOW_ENV_API_KEY_PREF;

    protected get discoveryMessages(): ModelDiscoveryMessages {
        return {
            noCredentials: nls.localize('theia/ai/google/discovery/noKey', '未设置 Google AI API 密钥。添加密钥后即可发现模型。'),
            consentRequired: nls.localize('theia/ai/google/discovery/consentRequired',
                '在环境中发现了 Google AI API 密钥。确认使用它以发现模型。'),
            consentPrompt: nls.localize('theia/ai/google/discovery/consentPrompt',
                '在环境中发现了 Google AI API 密钥（GOOGLE_API_KEY / GEMINI_API_KEY）。允许 Theia 使用它来发现和调用 Gemini 模型吗？'),
            useEnvironmentKey: nls.localize('theia/ai/google/discovery/useEnvKey', '使用密钥'),
            overridden: nls.localize('theia/ai/google/discovery/overridden',
                '模型列表已手动配置。清除模型覆盖后即可重新从提供程序发现模型。'),
            cached: error => nls.localize('theia/ai/google/discovery/cached', '正在显示缓存的模型；上次刷新失败：{0}', error)
        };
    }

    protected override initializeProvider(): void {
        this.manager.setApiKey(this.preferenceService.get<string>(API_KEY_PREF, undefined));
        this.manager.setMaxRetriesOnErrors(this.preferenceService.get<number>(MAX_RETRIES, 3));
        this.manager.setRetryDelayOnRateLimitError(this.preferenceService.get<number>(RETRY_DELAY_RATE_LIMIT, 60));
        this.manager.setRetryDelayOnOtherErrors(this.preferenceService.get<number>(RETRY_DELAY_OTHER_ERRORS, -1));
    }

    protected override handlePreferenceChange(event: PreferenceChange): void {
        if (event.preferenceName === API_KEY_PREF) {
            this.manager.setApiKey(this.preferenceService.get<string>(API_KEY_PREF, undefined));
            this.discoverAndRegisterModels();
        } else if (event.preferenceName === MAX_RETRIES) {
            this.manager.setMaxRetriesOnErrors(this.preferenceService.get<number>(MAX_RETRIES, 3));
        } else if (event.preferenceName === RETRY_DELAY_RATE_LIMIT) {
            this.manager.setRetryDelayOnRateLimitError(this.preferenceService.get<number>(RETRY_DELAY_RATE_LIMIT, 60));
        } else if (event.preferenceName === RETRY_DELAY_OTHER_ERRORS) {
            this.manager.setRetryDelayOnOtherErrors(this.preferenceService.get<number>(RETRY_DELAY_OTHER_ERRORS, -1));
        }
    }

    /** Reasoning capabilities are resolved by the backend from the Gemini /v1beta/models response. */
    protected createModelDescription(model: DiscoveredModel): GoogleModelDescription {
        return {
            id: `${GOOGLE_PROVIDER_ID}/${model.id}`,
            model: model.id,
            apiKey: true,
            enableStreaming: true
        };
    }
}
