// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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
import { AnthropicLanguageModelsManager, AnthropicModelDescription } from '../common';
import {
    ALLOW_ENV_API_KEY_PREF, API_KEY_PREF, MODEL_OVERRIDES_PREF, SERVER_SIDE_COMPACTION_PREF, SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF
} from '../common/anthropic-preferences';
import {
    AICorePreferences, PREFERENCE_NAME_MAX_RETRIES, PREFERENCE_NAME_SERVER_SIDE_COMPACTION,
    PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD
} from '@theia/ai-core/lib/common/ai-core-preferences';
import { nls, PreferenceChange } from '@theia/core';
import { resolveCompactionDefault, resolveCompactionTokenThresholdDefault, ServerSideCompactionSetting } from '@theia/ai-core';
import { DiscoveringProviderContribution, ModelDiscoveryMessages } from '@theia/ai-core/lib/browser';
import { DiscoveredModel } from '@theia/ai-core/lib/common';

const ANTHROPIC_PROVIDER_ID = 'anthropic';

@injectable()
export class AnthropicFrontendApplicationContribution extends DiscoveringProviderContribution<AnthropicModelDescription> {

    @inject(AnthropicLanguageModelsManager)
    protected readonly manager: AnthropicLanguageModelsManager;

    @inject(AICorePreferences)
    protected aiCorePreferences: AICorePreferences;

    protected readonly providerId = ANTHROPIC_PROVIDER_ID;
    protected readonly providerLabel = 'Anthropic';
    protected readonly modelOverridesPreference = MODEL_OVERRIDES_PREF;
    protected readonly allowEnvironmentApiKeyPreference = ALLOW_ENV_API_KEY_PREF;

    protected get discoveryMessages(): ModelDiscoveryMessages {
        return {
            noCredentials: nls.localize('theia/ai/anthropic/discovery/noKey', '未设置 Anthropic API 密钥。添加密钥后即可发现模型。'),
            consentRequired: nls.localize('theia/ai/anthropic/discovery/consentRequired',
                '在环境中发现了 Anthropic API 密钥。确认使用它以发现模型。'),
            consentPrompt: nls.localize('theia/ai/anthropic/discovery/consentPrompt',
                '在环境中发现了 Anthropic API 密钥（ANTHROPIC_API_KEY）。允许 Theia 使用它来发现和调用 Anthropic 模型吗？'),
            useEnvironmentKey: nls.localize('theia/ai/anthropic/discovery/useEnvKey', '使用密钥'),
            overridden: nls.localize('theia/ai/anthropic/discovery/overridden',
                '模型列表已手动配置。清除模型覆盖后即可重新从提供程序发现模型。'),
            cached: error => nls.localize('theia/ai/anthropic/discovery/cached', '正在显示缓存的模型；上次刷新失败：{0}', error)
        };
    }

    protected override initializeProvider(): void {
        this.manager.setApiKey(this.preferenceService.get<string>(API_KEY_PREF, undefined));
        this.manager.setProxyUrl(this.preferenceService.get<string>('http.proxy', undefined));

        this.aiCorePreferences.onPreferenceChanged(event => {
            if (event.preferenceName === PREFERENCE_NAME_MAX_RETRIES) {
                this.updateDiscoveredModels();
            }
        });
    }

    protected override handlePreferenceChange(event: PreferenceChange): void {
        if (event.preferenceName === API_KEY_PREF) {
            this.manager.setApiKey(this.preferenceService.get<string>(API_KEY_PREF, undefined));
            this.discoverAndRegisterModels();
        } else if (event.preferenceName === 'http.proxy') {
            this.manager.setProxyUrl(this.preferenceService.get<string>('http.proxy', undefined));
            this.discoverAndRegisterModels();
        } else if (event.preferenceName === SERVER_SIDE_COMPACTION_PREF ||
            event.preferenceName === PREFERENCE_NAME_SERVER_SIDE_COMPACTION ||
            event.preferenceName === SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF ||
            event.preferenceName === PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD) {
            this.updateDiscoveredModels();
        }
    }

    /** Per-model details are resolved by the backend from the Anthropic /v1/models endpoint. */
    protected createModelDescription(model: DiscoveredModel): AnthropicModelDescription {
        const id = `${ANTHROPIC_PROVIDER_ID}/${model.id}`;
        const maxRetries = this.aiCorePreferences.get(PREFERENCE_NAME_MAX_RETRIES) ?? 3;
        const globalCompaction = this.preferenceService.get<boolean>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION, true);
        const compactionOverride = this.preferenceService.get<ServerSideCompactionSetting>(SERVER_SIDE_COMPACTION_PREF, 'default');
        const serverSideCompactionEnabledByDefault = resolveCompactionDefault(globalCompaction, compactionOverride);
        const globalThreshold = this.preferenceService.get<number>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD, undefined);
        const providerThreshold = this.preferenceService.get<number>(SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF, undefined);
        const serverSideCompactionTokenThresholdByDefault = resolveCompactionTokenThresholdDefault(globalThreshold, providerThreshold);

        return {
            id: id,
            model: model.id,
            apiKey: true,
            enableStreaming: true,
            useCaching: true,
            maxRetries: maxRetries,
            serverSideCompactionEnabledByDefault,
            serverSideCompactionTokenThresholdByDefault,
            released: model.released
        };
    }

}
