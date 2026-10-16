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

export const API_KEY_PREF = 'ai-features.anthropic.AnthropicApiKey';
export const ALLOW_ENV_API_KEY_PREF = 'ai-features.anthropic.allowEnvironmentApiKey';
export const MODEL_OVERRIDES_PREF = 'ai-features.anthropic.modelOverrides';
export const CUSTOM_ENDPOINTS_PREF = 'ai-features.anthropicCustom.customAnthropicModels';
export const SERVER_SIDE_COMPACTION_PREF = 'ai-features.anthropic.serverSideCompaction';
export const SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF = 'ai-features.anthropic.serverSideCompactionTokenThreshold';

export const AnthropicPreferencesSchema: PreferenceSchema = {
    properties: {
        [API_KEY_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Anthropic' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/anthropic/apiKey/description',
                '输入您官方 Anthropic 账户的 API 密钥。**请注意：**使用此偏好设置后，Anthropic API 密钥将以明文形式存储\
            在运行 Theia 的机器上。请使用环境变量 `ANTHROPIC_API_KEY` 安全地设置密钥。') + LINUX_ENV_HINT,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [ALLOW_ENV_API_KEY_PREF]: {
            type: 'boolean',
            default: false,
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/anthropic/allowEnvApiKey/description',
                '允许 Theia 使用在环境中找到的 Anthropic API 密钥（`ANTHROPIC_API_KEY`）。'
                + '在密钥被使用之前，系统会要求您确认一次；将其重新设置为 `false` 可撤销授权。'),
        },
        [MODEL_OVERRIDES_PREF]: {
            type: 'array',
            default: [],
            items: {
                type: 'string'
            },
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/anthropic/modelOverrides/description',
                '覆盖从 Anthropic 发现的模型。为空时（默认），将从提供程序发现可用模型。'
                + '设置显式的模型 ID 可精确使用这些模型；此时将完全不使用发现功能。')
        },
        [SERVER_SIDE_COMPACTION_PREF]: {
            type: 'string',
            enum: ['default', 'enabled', 'disabled'],
            enumDescriptions: [
                nls.localize('theia/ai/anthropic/compaction/default', '遵循全局聊天服务端压缩设置。'),
                nls.localize('theia/ai/anthropic/compaction/enabled', '始终为 Anthropic 模型请求服务端压缩。'),
                nls.localize('theia/ai/anthropic/compaction/disabled', '从不为 Anthropic 模型请求服务端压缩。')
            ],
            default: 'default',
            markdownDescription: nls.localize('theia/ai/anthropic/compaction/description',
                '覆盖 Anthropic 模型的提供程序原生服务端压缩。"default" 遵循全局聊天设置 ' +
                '（{0}）。在有效启用的情况下，将使用 Anthropic Beta Messages API，以便提供程序在' +
                '对话增长超过其阈值时总结较早的对话轮次。',
                `\`#${PREFERENCE_NAME_SERVER_SIDE_COMPACTION}#\``),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF]: {
            type: 'integer',
            minimum: SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM,
            markdownDescription: nls.localize('theia/ai/anthropic/compactionTokenThreshold/description',
                '覆盖 Anthropic 模型服务端压缩的全局输入 Token 阈值。未设置时，将应用全局设置或提供程序默认值。' +
                '如果设置，该值必须至少为 50,000 Token。'),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [CUSTOM_ENDPOINTS_PREF]: {
            type: 'array',
            typeDetails: {
                [MODEL_PROVIDER_TYPE_DETAIL]: { label: nls.localize('theia/ai/anthropic/customProvider/label', '{0}（自定义）', 'Anthropic') } satisfies ModelProviderTypeDetail
            },
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/anthropic/customEndpoints/mdDescription',
                '添加与 Anthropic API 兼容的自定义端点。每个端点填写模型 ID 与 URL 即可，其余字段可选。'
                + '推理能力和最大输出 Token 限制从端点的 `/v1/models` 响应中推导。'),
            default: [],
            items: {
                type: 'object',
                required: ['model', 'url'],
                properties: {
                    model: {
                        type: 'string',
                        title: nls.localize('theia/ai/anthropic/customEndpoints/modelId/title', '模型 ID')
                    },
                    url: {
                        type: 'string',
                        title: nls.localize('theia/ai/anthropic/customEndpoints/url/title', '端点 URL'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/url/description',
                            '托管该模型的 Anthropic API 兼容端点地址')
                    },
                    id: {
                        type: 'string',
                        title: nls.localize('theia/ai/anthropic/customEndpoints/id/title', '显示名称'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/id/description',
                            '在 UI 中标识该自定义模型的唯一标识符；不提供时使用模型 ID')
                    },
                    apiKey: {
                        type: ['string', 'boolean'],
                        title: nls.localize('theia/ai/anthropic/customEndpoints/apiKey/title', 'API 密钥'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/apiKey/description',
                            '访问该端点 API 的密钥；填 true 表示使用全局 Anthropic API 密钥')
                    },
                    enableStreaming: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/anthropic/customEndpoints/enableStreaming/title', '流式传输'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/enableStreaming/description',
                            '是否使用流式 API。默认开启')
                    },
                    useCaching: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/anthropic/customEndpoints/useCaching/title', '提示词缓存'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/useCaching/description',
                            '该模型是否支持提示词缓存。默认开启')
                    },
                    maxRetries: {
                        type: 'number',
                        title: nls.localize('theia/ai/anthropic/customEndpoints/maxRetries/title', '最大重试次数'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/maxRetries/description',
                            '请求失败时的最大重试次数。默认 3')
                    },
                    headers: {
                        type: 'object',
                        additionalProperties: { type: 'string' },
                        title: nls.localize('theia/ai/anthropic/customEndpoints/headers/title', 'HTTP 头'),
                        description: nls.localize('theia/ai/anthropic/customEndpoints/headers/description',
                            '随每个请求附加的额外 HTTP 头，如 {"X-Custom": "value"}')
                    }
                }
            }
        }
    }
};
