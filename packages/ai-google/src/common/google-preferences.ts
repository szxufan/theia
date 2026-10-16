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

import { AI_CORE_PREFERENCES_TITLE, MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail } from '@theia/ai-core/lib/common/ai-core-preferences';
import { LINUX_ENV_HINT, nls, PreferenceSchema } from '@theia/core';

export const API_KEY_PREF = 'ai-features.google.apiKey';
export const ALLOW_ENV_API_KEY_PREF = 'ai-features.google.allowEnvironmentApiKey';
export const MODEL_OVERRIDES_PREF = 'ai-features.google.modelOverrides';
export const MAX_RETRIES = 'ai-features.google.maxRetriesOnErrors';
export const RETRY_DELAY_RATE_LIMIT = 'ai-features.google.retryDelayOnRateLimitError';
export const RETRY_DELAY_OTHER_ERRORS = 'ai-features.google.retryDelayOnOtherErrors';

export const GooglePreferencesSchema: PreferenceSchema = {
    properties: {
        [API_KEY_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Google' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/google/apiKey/description',
                '输入您官方 Google AI (Gemini) 账户的 API 密钥。**请注意：**使用此偏好设置后，GOOGLE AI API 密钥将以明文形式存储\
            在运行 Theia 的机器上。请使用环境变量 `GOOGLE_API_KEY` 安全地设置密钥。') + LINUX_ENV_HINT,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [ALLOW_ENV_API_KEY_PREF]: {
            type: 'boolean',
            default: false,
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/google/allowEnvApiKey/description',
                '允许 Theia 使用在环境中找到的 Google AI (Gemini) API 密钥（`GOOGLE_API_KEY` / `GEMINI_API_KEY`）。'
                + '在密钥被使用之前，系统会要求您确认一次；将其重新设置为 `false` 可撤销授权。'),
        },
        [MODEL_OVERRIDES_PREF]: {
            type: 'array',
            default: [],
            items: {
                type: 'string'
            },
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/google/modelOverrides/description',
                '覆盖从 Google Gemini 发现的模型。为空时（默认），将从提供程序发现可用模型。'
                + '设置显式的模型 ID 可精确使用这些模型；此时将完全不使用发现功能。')
        },
        [MAX_RETRIES]: {
            type: 'integer',
            description: nls.localize('theia/ai/google/maxRetriesOnErrors/description',
                '发生错误时的最大重试次数。如果小于 1，则禁用重试逻辑。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: 3,
            minimum: 0
        },
        [RETRY_DELAY_RATE_LIMIT]: {
            type: 'number',
            description: nls.localize('theia/ai/google/retryDelayOnRateLimitError/description',
                '发生速率限制错误时重试之间的延迟时间（秒）。参见 https://ai.google.dev/gemini-api/docs/rate-limits'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: 60,
            minimum: 0
        },
        [RETRY_DELAY_OTHER_ERRORS]: {
            type: 'number',
            description: nls.localize('theia/ai/google/retryDelayOnOtherErrors/description',
                '发生其他错误时重试之间的延迟时间（秒）（有时 Google GenAI 会报告错误，例如模型返回不完整的 JSON 语法 \
                或 500 内部服务器错误）。将其设置为 -1 可防止在这些情况下重试。否则，重试要么立即进行（设置为 0 时），要么在 \
                此延迟时间（秒）之后进行（设置为正数时）。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: -1,
            minimum: -1
        }
    }
};
