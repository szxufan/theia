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

import { nls, PreferenceSchema } from '@theia/core';

export const PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE = 'ai-features.codeCompletion.automaticCodeCompletion';
export const PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY = 'ai-features.codeCompletion.debounceDelay';
export const PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS = 'ai-features.codeCompletion.excludedFileExtensions';
export const PREF_AI_INLINE_COMPLETION_MAX_CONTEXT_LINES = 'ai-features.codeCompletion.maxContextLines';
export const PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS = 'ai-features.codeCompletion.stripBackticks';
export const PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY = 'ai-features.codeCompletion.cacheCapacity';

export const AICodeCompletionPreferencesSchema: PreferenceSchema = {
    properties: {
        [PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE]: {
            title: nls.localize('theia/ai/completion/automaticEnable/title', '自动代码补全'),
            type: 'boolean',
            description: nls.localize('theia/ai/completion/automaticEnable/description',
                '编辑时在任何（Monaco）编辑器中自动内联触发 AI 补全。\
            \n\
            或者，您可以通过命令"触发内联建议"或默认快捷键"Ctrl+Alt+Space"手动触发补全。'),
            default: false
        },
        [PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY]: {
            title: nls.localize('theia/ai/completion/debounceDelay/title', '防抖延迟'),
            type: 'number',
            description: nls.localize('theia/ai/completion/debounceDelay/description',
                '控制检测到编辑器更改后触发 AI 补全之前的延迟时间（毫秒）。\
                需要启用`自动代码补全`。输入 0 可禁用防抖延迟。'),
            default: 300
        },
        [PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS]: {
            title: nls.localize('theia/ai/completion/excludedFileExts/title', '排除的文件扩展名'),
            type: 'array',
            description: nls.localize('theia/ai/completion/excludedFileExts/description', '指定应禁用 AI 补全的文件扩展名（例如 .md、.txt）。'),
            items: {
                type: 'string'
            },
            default: []
        },
        [PREF_AI_INLINE_COMPLETION_MAX_CONTEXT_LINES]: {
            title: nls.localize('theia/ai/completion/maxContextLines/title', '最大上下文行数'),
            type: 'number',
            description: nls.localize('theia/ai/completion/maxContextLines/description',
                '用作上下文的最大行数，分布在光标位置前后（前缀和后缀）的行之间。\
            将此值设置为 -1 表示使用完整文件作为上下文且不限制行数，设置为 0 表示仅使用当前行。'),
            default: -1,
            minimum: -1
        },
        [PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS]: {
            title: nls.localize('theia/ai/completion/stripBackticks/title', '从内联补全中去除反引号'),
            type: 'boolean',
            description: nls.localize('theia/ai/completion/stripBackticks/description',
                '从某些 LLM 返回的代码中去除周围的反引号。如果检测到反引号，结束反引号之后的\
             所有内容也会被去除。当语言模型使用类似 Markdown 的格式时，此设置有助于确保返回纯代码。'),
            default: true
        },
        [PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY]: {
            title: nls.localize('theia/ai/completion/cacheCapacity/title', '代码补全缓存容量'),
            type: 'number',
            description: nls.localize('theia/ai/completion/cacheCapacity/description',
                '缓存中存储的代码补全最大数量。更大的数值可以提升性能，但会消耗更多内存。\
                最小值为 10，建议范围为 50-200。'),
            default: 100,
            minimum: 10
        }
    }
};
