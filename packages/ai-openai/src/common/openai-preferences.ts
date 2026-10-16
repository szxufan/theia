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

import {
    AI_CORE_PREFERENCES_TITLE, MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail, PREFERENCE_NAME_SERVER_SIDE_COMPACTION
} from '@theia/ai-core/lib/common/ai-core-preferences';
import { SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM } from '@theia/ai-core/lib/common/language-model';
import { LINUX_ENV_HINT, nls, PreferenceSchema } from '@theia/core';

export const API_KEY_PREF = 'ai-features.openAiOfficial.openAiApiKey';
export const ALLOW_ENV_API_KEY_PREF = 'ai-features.openAiOfficial.allowEnvironmentApiKey';
export const MODEL_OVERRIDES_PREF = 'ai-features.openAiOfficial.modelOverrides';
export const USE_RESPONSE_API_PREF = 'ai-features.openAiOfficial.useResponseApi';
export const SERVER_SIDE_COMPACTION_PREF = 'ai-features.openAiOfficial.serverSideCompaction';
export const SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF = 'ai-features.openAiOfficial.serverSideCompactionTokenThreshold';
export const CUSTOM_ENDPOINTS_PREF = 'ai-features.openAiCustom.customOpenAiModels';

export const OpenAiPreferencesSchema: PreferenceSchema = {
    properties: {
        [API_KEY_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'OpenAI' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/openai/apiKey/mdDescription',
                '输入您官方 OpenAI 账户的 API 密钥。**请注意：**使用此偏好设置后，Open AI API 密钥将以明文形式存储 \
在运行 Theia 的机器上。请使用环境变量 `OPENAI_API_KEY` 安全地设置密钥。') + LINUX_ENV_HINT,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [ALLOW_ENV_API_KEY_PREF]: {
            type: 'boolean',
            default: false,
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/openai/allowEnvApiKey/description',
                '允许 Theia 使用在环境中找到的 OpenAI API 密钥（`OPENAI_API_KEY`）。'
                + '在密钥被使用之前，系统会要求您确认一次；将其重新设置为 `false` 可撤销授权。'),
        },
        [MODEL_OVERRIDES_PREF]: {
            type: 'array',
            default: [],
            items: {
                type: 'string'
            },
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/openai/modelOverrides/description',
                '覆盖从 OpenAI 发现的模型。为空时（默认），将从提供程序发现可用模型。'
                + '设置显式的模型 ID 可精确使用这些模型；此时将完全不使用发现功能。')
        },
        [USE_RESPONSE_API_PREF]: {
            type: 'boolean',
            default: true,
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/openai/useResponseApi/mdDescription',
                '对官方 OpenAI 模型使用较新的 OpenAI Response API 而不是 Chat Completion API。' +
                '此设置仅适用于官方 OpenAI 模型——自定义提供程序必须单独配置此项。')
        },
        [SERVER_SIDE_COMPACTION_PREF]: {
            type: 'string',
            enum: ['default', 'enabled', 'disabled'],
            enumDescriptions: [
                nls.localize('theia/ai/openai/compaction/default', '遵循全局聊天服务端压缩设置。'),
                nls.localize('theia/ai/openai/compaction/enabled', '始终为官方 OpenAI 模型请求服务端压缩。'),
                nls.localize('theia/ai/openai/compaction/disabled', '从不为官方 OpenAI 模型请求服务端压缩。')
            ],
            default: 'default',
            markdownDescription: nls.localize('theia/ai/openai/compaction/description',
                '覆盖官方 OpenAI 模型的提供程序原生服务端压缩。此设置仅适用于 OpenAI Response API；' +
                'Chat Completions API 会忽略它。"default" 遵循全局聊天设置（{0}）。在有效启用的情况下，' +
                '当对话增长超过提供程序的阈值时，将要求 Response API 总结较早的对话轮次。',
                `\`#${PREFERENCE_NAME_SERVER_SIDE_COMPACTION}#\``),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF]: {
            type: 'integer',
            minimum: SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM,
            markdownDescription: nls.localize('theia/ai/openai/compactionTokenThreshold/description',
                '覆盖官方 OpenAI 模型服务端压缩的全局输入 Token 阈值。未设置时，将应用全局设置或提供程序默认值。' +
                '如果设置，该值必须至少为 50,000 Token。'),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [CUSTOM_ENDPOINTS_PREF]: {
            type: 'array',
            typeDetails: {
                [MODEL_PROVIDER_TYPE_DETAIL]: { label: nls.localize('theia/ai/openai/customProvider/label', '{0}（自定义）', 'OpenAI') } satisfies ModelProviderTypeDetail
            },
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/openai/customEndpoints/mdDescription',
                '集成与 OpenAI API 兼容的自定义模型，例如通过 `vllm`。必需的属性是 `model` 和 `url`。\
            \n\
            可选地，您可以\
            \n\
            - 指定唯一的 `id` 以在 UI 中标识该自定义模型。如果不提供，将使用 `model` 作为 `id`。\
            \n\
            - 提供 `apiKey` 以访问给定 URL 上的 API。使用 `true` 表示使用全局 OpenAI API 密钥。\
            \n\
            - 提供 `apiVersion` 以在 Azure 中访问给定 URL 上的 API。使用 `true` 表示使用全局 OpenAI API 版本。\
            \n\
            - 为您的 Azure 部署提供 `deployment` 名称。\
            \n\
            - 将 `developerMessageSettings` 设置为 `user`、`system`、`developer`、`mergeWithFollowingUserMessage` 或 `skip`，以控制 developer 消息的\
            包含方式（其中 `user`、`system` 和 `developer` 将用作角色；`mergeWithFollowingUserMessage` 会将系统消息作为后续用户消息的前缀，\
            或在下一条消息不是用户消息时将系统消息转换为用户消息；`skip` 将直接移除系统消息）。\
            默认为 `developer`。\
            \n\
            - 指定 `supportsStructuredOutput: false` 表示不使用结构化输出。\
            \n\
            - 指定 `enableStreaming: false` 表示不使用流式传输。\
            \n\
            - 指定 `useResponseApi: true` 以使用较新的 OpenAI Response API 而不是 Chat Completion API（需要兼容的端点）。\
            \n\
            - 指定 `reasoningSupport` 以启用聊天推理选择器。提供一个包含\
            `supportedLevels`（可选值：`off`、`none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`、`auto`）和可选 `defaultLevel` 的对象。\
            `none` 发送显式的无推理指令；`off` 省略生成的推理设置；`auto` 使用提供程序的默认推理力度。\
            仅声明您的端点支持的级别。\
            \n\
            - 指定 `headers` 以随每个发送到端点的请求附加额外的 HTTP 头，例如 API 前置网关所需的头。\
            \n\
            有关更多信息，请参阅[我们的文档](https://theia-ide.org/docs/user_ai/#openai-compatible-models-eg-via-vllm)。'),
            default: [],
            items: {
                type: 'object',
                required: ['model', 'url'],
                properties: {
                    model: {
                        type: 'string',
                        title: nls.localize('theia/ai/openai/customEndpoints/modelId/title', '模型 ID')
                    },
                    url: {
                        type: 'string',
                        title: nls.localize('theia/ai/openai/customEndpoints/url/title', '托管该模型的 Open AI API 兼容端点')
                    },
                    id: {
                        type: 'string',
                        title: nls.localize('theia/ai/openai/customEndpoints/id/title', '用于在 UI 中标识自定义模型的唯一标识符'),
                    },
                    apiKey: {
                        type: ['string', 'boolean'],
                        title: nls.localize('theia/ai/openai/customEndpoints/apiKey/title',
                            '访问给定 URL 上 API 的密钥，或使用 `true` 表示使用全局 OpenAI API 密钥'),
                    },
                    apiVersion: {
                        type: ['string', 'boolean'],
                        title: nls.localize('theia/ai/openai/customEndpoints/apiVersion/title',
                            '在 Azure 中访问给定 URL 上 API 的版本，或使用 `true` 表示使用全局 OpenAI API 版本'),
                    },
                    deployment: {
                        type: 'string',
                        title: nls.localize('theia/ai/openai/customEndpoints/deployment/title',
                            '在 Azure 中访问给定 URL 上 API 的部署名称'),
                    },
                    developerMessageSettings: {
                        type: 'string',
                        enum: ['user', 'system', 'developer', 'mergeWithFollowingUserMessage', 'skip'],
                        default: 'developer',
                        title: nls.localize('theia/ai/openai/customEndpoints/developerMessageSettings/title',
                            '控制系统消息的处理方式：`user`、`system` 和 `developer` 将用作角色；`mergeWithFollowingUserMessage` 会将系统消息作为后续用户消息的前缀，\
                         或在下一条消息不是用户消息时将系统消息转换为用户消息。\
                         `skip` 将直接移除系统消息。默认为 `developer`。')
                    },
                    supportsStructuredOutput: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/openai/customEndpoints/supportsStructuredOutput/title',
                            '指示模型是否支持结构化输出。默认为 `true`。'),
                    },
                    enableStreaming: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/openai/customEndpoints/enableStreaming/title',
                            '指示是否使用流式 API。默认为 `true`。'),
                    },
                    useResponseApi: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/openai/customEndpoints/useResponseApi/title',
                            '使用较新的 OpenAI Response API 而不是 Chat Completion API。对于自定义提供程序默认为 `false`。'
                            + '注意：使用工具时会自动回退到 Chat Completions API。'),
                    },
                    reasoningSupport: {
                        type: 'object',
                        title: nls.localize('theia/ai/openai/customEndpoints/reasoningSupport/title',
                            '声明模型的推理能力。设置后，聊天界面将为此模型显示推理选择器。'),
                        properties: {
                            supportedLevels: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: ['off', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']
                                }
                            },
                            defaultLevel: {
                                type: 'string',
                                enum: ['off', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']
                            }
                        }
                    },
                    headers: {
                        type: 'object',
                        additionalProperties: { type: 'string' },
                        title: nls.localize('theia/ai/openai/customEndpoints/headers/title',
                            '随每个发送到端点的请求一起发送的额外 HTTP 头'),
                    }
                }
            }
        }
    }
};
