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

import { nls, PreferenceContribution, PreferenceSchema } from '@theia/core';
import { MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail } from '@theia/ai-core/lib/common/ai-core-preferences';
import { interfaces } from '@theia/core/shared/inversify';

export const AI_LLAMAFILE_PREFERENCES_TITLE = nls.localize('theia/ai/llamaFile/prefs/title', 'AI LlamaFile');
export const PREFERENCE_LLAMAFILE = 'ai-features.llamafile.llamafiles';

export const aiLlamafilePreferencesSchema: PreferenceSchema = {
    properties: {
        [PREFERENCE_LLAMAFILE]: {
            title: AI_LLAMAFILE_PREFERENCES_TITLE,
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Llamafile' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/llamaFile/prefs/mdDescription', '此设置允许您在 Theia IDE 中配置和管理 LlamaFile 模型。\
            \n\
            每个条目都需要一个易于识别的 `name`、指向您的 LlamaFile 的文件 `uri`，以及它将运行的 `port`。\
            \n\
            要启动 LlamaFile，请使用"启动 LlamaFile"命令，该命令允许您选择所需的模型。\
            \n\
            如果您编辑某个条目（例如更改端口），任何正在运行的实例都将停止，您需要手动重新启动它。\
            \n\
            [在 Theia IDE 文档中了解有关配置和管理 LlamaFile 的更多信息](https://theia-ide.org/docs/user_ai/#llamafile-models)。'),
            type: 'array',
            default: [],
            items: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: nls.localize('theia/ai/llamaFile/prefs/name/description', '此 Llamafile 要使用的模型名称。')
                    },
                    uri: {
                        type: 'string',
                        description: nls.localize('theia/ai/llamaFile/prefs/uri/description', 'Llamafile 的文件 URI。')
                    },
                    port: {
                        type: 'number',
                        description: nls.localize('theia/ai/llamaFile/prefs/port/description', '启动服务器时使用的端口。')
                    }
                }
            },
            tags: ['experimental']
        }
    }
};

export function bindAILlamafilePreferences(bind: interfaces.Bind): void {
    bind(PreferenceContribution).toConstantValue({ schema: aiLlamafilePreferencesSchema });
}
