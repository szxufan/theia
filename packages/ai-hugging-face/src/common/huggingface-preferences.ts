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

import { AI_CORE_PREFERENCES_TITLE, MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail } from '@theia/ai-core/lib/common/ai-core-preferences';
import { LINUX_ENV_HINT, nls, PreferenceSchema } from '@theia/core';

export const API_KEY_PREF = 'ai-features.huggingFace.apiKey';
export const MODELS_PREF = 'ai-features.huggingFace.models';

export const HuggingFacePreferencesSchema: PreferenceSchema = {
    properties: {
        [API_KEY_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Hugging Face' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/huggingFace/apiKey/mdDescription',
                '输入您的 Hugging Face 账户的 API 密钥。**请注意：**使用此偏好设置后，Hugging Face API 密钥将以明文形式存储\
            在运行 Theia 的机器上。请使用环境变量 `HUGGINGFACE_API_KEY` 安全地设置密钥。') + LINUX_ENV_HINT,
            title: AI_CORE_PREFERENCES_TITLE,
            tags: ['experimental']
        },
        [MODELS_PREF]: {
            type: 'array',
            markdownDescription: nls.localize('theia/ai/huggingFace/models/mdDescription',
                '要使用的 Hugging Face 模型。**请注意：**目前仅支持支持聊天补全 API 的模型\
            （如 `*-Instruct` 等指令微调模型）。部分模型可能需要先在 Hugging Face 网站上接受许可条款。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: ['meta-llama/Llama-3.2-3B-Instruct', 'meta-llama/Llama-3.1-8B-Instruct'],
            items: {
                type: 'string'
            },
            tags: ['experimental']
        }
    }
};
