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
import { nls, PreferenceSchema } from '@theia/core';

export const CODEX_API_KEY_PREF = 'ai-features.codex.apiKey';

export const CodexPreferencesSchema: PreferenceSchema = {
    properties: {
        [CODEX_API_KEY_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Codex' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/codex/apiKey/description',
                'Codex 的 OpenAI API 密钥。如果未设置，将回退到共享的 OpenAI API 密钥（`ai-features.openAiOfficial.openAiApiKey`）。' +
                '也可以通过 `OPENAI_API_KEY` 环境变量设置。'),
            title: AI_CORE_PREFERENCES_TITLE,
        },
    }
};
