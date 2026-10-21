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
    MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail, PREFERENCE_NAME_SERVER_SIDE_COMPACTION
} from '@theia/ai-core/lib/common/ai-core-preferences';
import { SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM } from '@theia/ai-core/lib/common/language-model';
import { LINUX_ENV_HINT, nls, PreferenceSchema } from '@theia/core';

export const API_KEY_PREF = 'ai-features.anthropic.AnthropicApiKey';
export const ALLOW_ENV_API_KEY_PREF = 'ai-features.anthropic.allowEnvironmentApiKey';
export const MODEL_OVERRIDES_PREF = 'ai-features.anthropic.modelOverrides';
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
            title: nls.localize('theia/ai/anthropic/apiKey/title', 'API 密钥'),
        },
        [ALLOW_ENV_API_KEY_PREF]: {
            type: 'boolean',
            default: false,
            title: nls.localize('theia/ai/anthropic/allowEnvApiKey/title', '允许使用环境变量中的 API 密钥'),
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
            title: nls.localize('theia/ai/anthropic/modelOverrides/title', '模型覆盖'),
            markdownDescription: nls.localize('theia/ai/anthropic/modelOverrides/description',
                '覆盖从 Anthropic 发现的模型。为空时（默认），将从提供程序发现可用模型。'
                + '设置显式的模型 ID 可精确使用这些模型；此时将完全不使用发现功能。'),
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
            title: nls.localize('theia/ai/anthropic/compaction/title', '服务端压缩'),
        },
        [SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_PREF]: {
            type: 'integer',
            minimum: SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM,
            markdownDescription: nls.localize('theia/ai/anthropic/compactionTokenThreshold/description',
                '覆盖 Anthropic 模型服务端压缩的全局输入 Token 阈值。未设置时，将应用全局设置或提供程序默认值。' +
                '如果设置，该值必须至少为 50,000 Token。'),
            title: nls.localize('theia/ai/anthropic/compactionTokenThreshold/title', '服务端压缩 Token 阈值'),
        }
    }
};
