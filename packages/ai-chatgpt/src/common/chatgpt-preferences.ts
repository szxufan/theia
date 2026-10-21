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

import {
    MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail, PREFERENCE_NAME_SERVER_SIDE_COMPACTION
} from '@theia/ai-core/lib/common/ai-core-preferences';
import { SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM } from '@theia/ai-core/lib/common/language-model';
import { nls, PreferenceSchema } from '@theia/core';

export const CHATGPT_ENABLED_PREF = 'ai-features.chatGpt.enabled';
export const MODELS_PREF = 'ai-features.chatGpt.modelOverrides';
export const SERVER_SIDE_COMPACTION_PREF = 'ai-features.chatGpt.serverSideCompaction';
export const SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF = 'ai-features.chatGpt.serverSideCompactionTokenThreshold';

/**
 * Models offered when discovery for an authenticated account fails.
 */
export const CHATGPT_FALLBACK_MODELS = [
    'gpt-5.6-sol',
    'gpt-5.6-terra',
    'gpt-5.6-luna',
    'gpt-5.5',
    'gpt-5.5-pro'
];

const MODELS_DESCRIPTION = nls.localize('theia/ai/chatgpt/models/mdDescription',
    '要通过您的 ChatGPT 订阅提供的模型。仅在您已登录时可用。 \
留空即可提供您的 ChatGPT 套餐实际授予的模型，登录后会自动查询这些模型。');

export const ChatGptPreferencesSchema: PreferenceSchema = {
    properties: {
        [CHATGPT_ENABLED_PREF]: {
            type: 'boolean',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'ChatGPT' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/chatgpt/enabled/mdDescription',
                '启用 ChatGPT 提供程序。启用后，状态栏将出现用于身份验证的条目，'
                + '并会从您的 ChatGPT 订阅中发现可用模型。'),
            tags: ['experimental'],
            title: nls.localize('theia/ai/chatgpt/enabled/title', '启用 ChatGPT 提供程序'),
            default: true
        },
        [SERVER_SIDE_COMPACTION_PREF]: {
            type: 'string',
            enum: ['default', 'enabled', 'disabled'],
            enumItemLabels: [
                nls.localizeByDefault('默认'),
                nls.localizeByDefault('启用'),
                nls.localizeByDefault('禁用')
            ],
            enumDescriptions: [
                nls.localize('theia/ai/chatgpt/compaction/default', '遵循全局聊天服务端压缩设置。'),
                nls.localize('theia/ai/chatgpt/compaction/enabled', '始终为 ChatGPT 模型请求服务端压缩。'),
                nls.localize('theia/ai/chatgpt/compaction/disabled', '从不为 ChatGPT 模型请求服务端压缩。')
            ],
            default: 'default',
            markdownDescription: nls.localize('theia/ai/chatgpt/compaction/description',
                '覆盖 ChatGPT 模型的提供程序原生服务端压缩。"default" 遵循全局聊天设置（{0}）。' +
                '在有效启用的情况下，当对话增长超过提供程序的阈值时，将要求 Response API 总结较早的对话轮次。',
                `\`#${PREFERENCE_NAME_SERVER_SIDE_COMPACTION}#\``),
            tags: ['experimental'],
            title: nls.localize('theia/ai/chatgpt/compaction/title', '服务端压缩')
        },
        [SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF]: {
            type: 'integer',
            minimum: SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM,
            markdownDescription: nls.localize('theia/ai/chatgpt/compactionTokenThreshold/description',
                '覆盖 ChatGPT 模型服务端压缩的全局输入 Token 阈值。未设置时，将应用全局设置或提供程序默认值。' +
                '如果设置，该值必须至少为 50,000 Token。'),
            tags: ['experimental'],
            title: nls.localize('theia/ai/chatgpt/compactionTokenThreshold/title', '服务端压缩 Token 阈值')
        },
        [MODELS_PREF]: {
            type: 'array',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'ChatGPT' } satisfies ModelProviderTypeDetail },
            markdownDescription: MODELS_DESCRIPTION,
            tags: ['experimental'],
            title: nls.localize('theia/ai/chatgpt/models/title', '模型'),
            default: [],
            items: {
                type: 'string'
            }
        }
    }
};
