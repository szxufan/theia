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
import {
    ReasoningSupport, resolveCompactionDefault, resolveCompactionTokenThresholdDefault, resolveCustomModelHeaders, ServerSideCompactionSetting
} from '@theia/ai-core';
import { DiscoveringProviderContribution, ModelDiscoveryMessages } from '@theia/ai-core/lib/browser';
import { DiscoveredModel } from '@theia/ai-core/lib/common';
import { OpenAiCustomEndpointDescription, OpenAiLanguageModelsManager, OpenAiModelDescription, OPENAI_PROVIDER_ID } from '../common';
import {
    ALLOW_ENV_API_KEY_PREF, API_KEY_PREF, CUSTOM_ENDPOINTS_PREF, MODEL_OVERRIDES_PREF, SERVER_SIDE_COMPACTION_PREF, SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF,
    USE_RESPONSE_API_PREF
} from '../common/openai-preferences';
import {
    AICorePreferences, PREFERENCE_NAME_MAX_RETRIES, PREFERENCE_NAME_SERVER_SIDE_COMPACTION,
    PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD
} from '@theia/ai-core/lib/common/ai-core-preferences';
import { nls, PreferenceChange } from '@theia/core';

/** Provider node id (matches the `ai-features.openAiOfficial.*` configuration segment). */
const OPENAI_OFFICIAL_PROVIDER_ID = 'openAiOfficial';

@injectable()
export class OpenAiFrontendApplicationContribution extends DiscoveringProviderContribution<OpenAiModelDescription> {

    @inject(OpenAiLanguageModelsManager)
    protected readonly manager: OpenAiLanguageModelsManager;

    @inject(AICorePreferences)
    protected aiCorePreferences: AICorePreferences;

    protected readonly providerId = OPENAI_OFFICIAL_PROVIDER_ID;
    protected readonly providerLabel = 'OpenAI';
    protected readonly modelOverridesPreference = MODEL_OVERRIDES_PREF;
    protected readonly allowEnvironmentApiKeyPreference = ALLOW_ENV_API_KEY_PREF;

    /** The registered ids carry the `openai/` prefix, while the provider node is `openAiOfficial`. */
    protected override get modelIdPrefix(): string {
        return OPENAI_PROVIDER_ID;
    }

    protected prevCustomModels: Partial<OpenAiCustomEndpointDescription>[] = [];

    protected get discoveryMessages(): ModelDiscoveryMessages {
        return {
            noCredentials: nls.localize('theia/ai/openai/discovery/noKey', '未设置 OpenAI API 密钥。添加密钥后即可发现模型。'),
            consentRequired: nls.localize('theia/ai/openai/discovery/consentRequired',
                '在环境中发现了 OpenAI API 密钥。确认使用它以发现模型。'),
            consentPrompt: nls.localize('theia/ai/openai/discovery/consentPrompt',
                '在环境中发现了 OpenAI API 密钥（OPENAI_API_KEY）。允许 Theia 使用它来发现和调用 OpenAI 模型吗？'),
            useEnvironmentKey: nls.localize('theia/ai/openai/discovery/useEnvKey', '使用密钥'),
            overridden: nls.localize('theia/ai/openai/discovery/overridden',
                '模型列表已手动配置。清除模型覆盖后即可重新从提供程序发现模型。'),
            cached: error => nls.localize('theia/ai/openai/discovery/cached', '正在显示缓存的模型；上次刷新失败：{0}', error)
        };
    }

    protected override initializeProvider(): void {
        this.manager.setApiKey(this.preferenceService.get<string>(API_KEY_PREF, undefined));
        this.manager.setProxyUrl(this.preferenceService.get<string>('http.proxy', undefined));

        const customModels = this.preferenceService.get<Partial<OpenAiCustomEndpointDescription>[]>(CUSTOM_ENDPOINTS_PREF, []);
        this.manager.createOrUpdateLanguageModels(...this.createCustomModelDescriptionsFromPreferences(customModels));
        this.prevCustomModels = [...customModels];

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
        } else if (event.preferenceName === CUSTOM_ENDPOINTS_PREF) {
            this.handleCustomModelChanges(this.preferenceService.get<Partial<OpenAiCustomEndpointDescription>[]>(CUSTOM_ENDPOINTS_PREF, []));
        } else if (event.preferenceName === USE_RESPONSE_API_PREF ||
            event.preferenceName === SERVER_SIDE_COMPACTION_PREF ||
            event.preferenceName === PREFERENCE_NAME_SERVER_SIDE_COMPACTION ||
            event.preferenceName === SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF ||
            event.preferenceName === PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD) {
            this.updateDiscoveredModels();
        } else if (event.preferenceName === 'http.proxy') {
            this.manager.setProxyUrl(this.preferenceService.get<string>('http.proxy', undefined));
            // A model keeps the proxy it was registered with, so the custom endpoints have to be
            // re-registered as well: discovery only covers the models it registers itself.
            this.updateCustomModels();
            this.discoverAndRegisterModels();
        }
    }

    protected handleCustomModelChanges(newCustomModels: Partial<OpenAiCustomEndpointDescription>[]): void {
        const oldModels = this.createCustomModelDescriptionsFromPreferences(this.prevCustomModels);
        const newModels = this.createCustomModelDescriptionsFromPreferences(newCustomModels);

        // Canonical JSON comparison: preference reads yield fresh objects, and a field-by-field
        // comparison silently misses newly introduced description fields.
        const fingerprints = new Map(newModels.map(model => [model.id, JSON.stringify(model)]));
        const modelsToRemove = oldModels.filter(model => fingerprints.get(model.id) !== JSON.stringify(model));

        this.manager.removeLanguageModels(...modelsToRemove.map(model => model.id));
        this.manager.createOrUpdateLanguageModels(...newModels.filter(model =>
            JSON.stringify(oldModels.find(old => old.id === model.id)) !== JSON.stringify(model)));
        this.prevCustomModels = [...newCustomModels];
    }

    protected override updateDiscoveredModels(): void {
        super.updateDiscoveredModels();
        this.updateCustomModels();
    }

    /** Re-applies the model descriptions of the configured custom endpoints. */
    protected updateCustomModels(): void {
        const customModels = this.preferenceService.get<Partial<OpenAiCustomEndpointDescription>[]>(CUSTOM_ENDPOINTS_PREF, []);
        this.manager.createOrUpdateLanguageModels(...this.createCustomModelDescriptionsFromPreferences(customModels));
    }

    /** Per-model capabilities are resolved by the backend from the model id; see `openai-model-defaults.ts`. */
    protected createModelDescription(model: DiscoveredModel): OpenAiModelDescription {
        const modelId = model.id;
        const id = `${OPENAI_PROVIDER_ID}/${modelId}`;
        const maxRetries = this.aiCorePreferences.get(PREFERENCE_NAME_MAX_RETRIES) ?? 3;
        const useResponseApi = this.preferenceService.get<boolean>(USE_RESPONSE_API_PREF, true);
        const globalCompaction = this.preferenceService.get<boolean>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION, true);
        const compactionOverride = this.preferenceService.get<ServerSideCompactionSetting>(SERVER_SIDE_COMPACTION_PREF, 'default');
        const serverSideCompactionEnabledByDefault = resolveCompactionDefault(globalCompaction, compactionOverride);
        const globalThreshold = this.preferenceService.get<number>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD, undefined);
        const providerThreshold = this.preferenceService.get<number>(SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF, undefined);
        const serverSideCompactionTokenThresholdByDefault = resolveCompactionTokenThresholdDefault(globalThreshold, providerThreshold);
        return {
            id: id,
            model: modelId,
            apiKey: true,
            apiVersion: true,
            maxRetries: maxRetries,
            useResponseApi: useResponseApi,
            serverSideCompactionEnabledByDefault,
            serverSideCompactionTokenThresholdByDefault,
            released: model.released
        };
    }

    /**
     * Flattens the two-level endpoint preference ({@link OpenAiCustomEndpointDescription}) into one
     * description per model, inheriting the endpoint-level connection settings. A custom endpoint only
     * ever uses its **own** key: the global OpenAI key is never applied here, so a `true` (or any
     * non-string) endpoint key is dropped — the official key must not leak to a third-party endpoint.
     */
    protected createCustomModelDescriptionsFromPreferences(
        preferences: Partial<OpenAiCustomEndpointDescription>[]
    ): OpenAiModelDescription[] {
        const maxRetries = this.aiCorePreferences.get(PREFERENCE_NAME_MAX_RETRIES) ?? 3;
        const globalCompaction = this.preferenceService.get<boolean>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION, true);
        const compactionOverride = this.preferenceService.get<ServerSideCompactionSetting>(SERVER_SIDE_COMPACTION_PREF, 'default');
        const serverSideCompactionEnabledByDefault = resolveCompactionDefault(globalCompaction, compactionOverride);
        const globalThreshold = this.preferenceService.get<number>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD, undefined);
        const providerThreshold = this.preferenceService.get<number>(SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF, undefined);
        const serverSideCompactionTokenThresholdByDefault = resolveCompactionTokenThresholdDefault(globalThreshold, providerThreshold);

        const descriptions: OpenAiModelDescription[] = [];
        // First pass: collect usable endpoints, then count how often each model id appears as a
        // *default* id across all of them, so duplicates can be disambiguated with a positional
        // suffix (`model@2` = second endpoint).
        const usableEndpoints: Array<{ url: string; apiKey: string | undefined; useResponseApi: boolean; headers: Record<string, string> | undefined; models: (Partial<OpenAiModelDescription> & { model: string })[] }> = [];
        for (const endpoint of preferences) {
            const url = typeof endpoint?.url === 'string' && endpoint.url ? endpoint.url : undefined;
            if (!url) {
                continue;
            }
            const models = Array.isArray(endpoint.models) ? endpoint.models.filter(isModelPreference) : [];
            if (!models.length) {
                continue;
            }
            // SECURITY: never fall back to the global OpenAI key (`true`) for a custom endpoint —
            // it would be sent to a third-party server. Only an endpoint-specific string is used.
            usableEndpoints.push({
                url,
                apiKey: typeof endpoint.apiKey === 'string' && endpoint.apiKey ? endpoint.apiKey : undefined,
                useResponseApi: endpoint.useResponseApi === true,
                headers: resolveCustomModelHeaders(endpoint.headers),
                models
            });
        }
        const defaultIdCounts = new Map<string, number>();
        for (const endpoint of usableEndpoints) {
            for (const model of endpoint.models) {
                defaultIdCounts.set(model.model, (defaultIdCounts.get(model.model) ?? 0) + 1);
            }
        }
        usableEndpoints.forEach((endpoint, index) => {
            for (const modelPref of endpoint.models) {
                // A model id duplicated across endpoints gets a positional suffix; an explicit `id` wins.
                const defaultId = (defaultIdCounts.get(modelPref.model) ?? 0) > 1 ? `${modelPref.model}@${index + 1}` : modelPref.model;
                descriptions.push({
                    id: typeof modelPref.id === 'string' && modelPref.id ? modelPref.id : defaultId,
                    model: modelPref.model,
                    url: endpoint.url,
                    apiKey: endpoint.apiKey,
                    maxRetries,
                    useResponseApi: endpoint.useResponseApi,
                    headers: endpoint.headers,
                    enableStreaming: modelPref.enableStreaming,
                    supportsStructuredOutput: modelPref.supportsStructuredOutput,
                    contextWindow: typeof modelPref.contextWindow === 'number' ? modelPref.contextWindow : undefined,
                    maxOutputTokens: typeof modelPref.maxOutputTokens === 'number' ? modelPref.maxOutputTokens : undefined,
                    supportsImages: typeof modelPref.supportsImages === 'boolean' ? modelPref.supportsImages : undefined,
                    developerMessageSettings: modelPref.developerMessageSettings,
                    reasoningSupport: isReasoningSupport(modelPref.reasoningSupport) ? modelPref.reasoningSupport : undefined,
                    serverSideCompactionEnabledByDefault,
                    serverSideCompactionTokenThresholdByDefault
                });
            }
        });
        return descriptions;
    }
}

function isReasoningSupport(value: unknown): value is ReasoningSupport {
    return !!value && typeof value === 'object' && Array.isArray((value as ReasoningSupport).supportedLevels);
}

/** A `models[]` entry usable for registration: carries the mandatory API model id. */
function isModelPreference(model: Partial<OpenAiModelDescription> | undefined): model is Partial<OpenAiModelDescription> & { model: string } {
    return !!model && typeof model.model === 'string';
}
