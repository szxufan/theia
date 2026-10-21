// *****************************************************************************
// Copyright (C) 2024 TypeFox GmbH.
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

import { MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail } from '@theia/ai-core/lib/common/ai-core-preferences';
import { nls, PreferenceSchema } from '@theia/core';

export const HOST_PREF = 'ai-features.ollama.ollamaHost';
export const MODELS_PREF = 'ai-features.ollama.ollamaModels';

export const OllamaPreferencesSchema: PreferenceSchema = {
    properties: {
        [HOST_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Ollama' } satisfies ModelProviderTypeDetail },
            title: nls.localize('theia/ai/ollama/host/title', '主机地址'),
            markdownDescription: nls.localize('theia/ai/ollama/host/mdDescription',
                '本机 Ollama 服务的主机地址。'),
            default: 'http://localhost:11434'
        },
        [MODELS_PREF]: {
            type: 'array',
            title: nls.localize('theia/ai/ollama/models/title', '模型'),
            markdownDescription: nls.localize('theia/ai/ollama/models/mdDescription',
                '要使用的 Ollama 模型 ID 列表（例如 `llama3.2`）。'),
            default: [],
            items: {
                type: 'string'
            }
        }
    }
};
