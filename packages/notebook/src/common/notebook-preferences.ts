// *****************************************************************************
// Copyright (C) 2024 TypeFox and others.
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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nls } from '@theia/core';
import { interfaces } from '@theia/core/shared/inversify';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace NotebookPreferences {
    export const NOTEBOOK_LINE_NUMBERS = 'notebook.lineNumbers';
    export const OUTPUT_LINE_HEIGHT = 'notebook.output.lineHeight';
    export const OUTPUT_FONT_SIZE = 'notebook.output.fontSize';
    export const OUTPUT_FONT_FAMILY = 'notebook.output.fontFamily';
    export const OUTPUT_SCROLLING = 'notebook.output.scrolling';
    export const OUTPUT_WORD_WRAP = 'notebook.output.wordWrap';
    export const OUTPUT_LINE_LIMIT = 'notebook.output.textLineLimit';
}

export const notebookPreferenceSchema: PreferenceSchema = {
    properties: {
        [NotebookPreferences.NOTEBOOK_LINE_NUMBERS]: {
            type: 'string',
            enum: ['on', 'off'],
            default: 'off',
            description: nls.localizeByDefault('控制单元格编辑器中行号的显示。')
        },
        [NotebookPreferences.OUTPUT_LINE_HEIGHT]: {
            // eslint-disable-next-line max-len
            markdownDescription: nls.localizeByDefault('笔记本单元格中输出文本的行高。\n - 设置为 0 时，使用编辑器行高。\n - 0 到 8 之间的值将作为字体大小的倍数使用。\n - 大于等于 8 的值将作为有效值使用。'),
            type: 'number',
            default: 0,
            tags: ['notebookLayout', 'notebookOutputLayout']
        },
        [NotebookPreferences.OUTPUT_FONT_SIZE]: {
            markdownDescription: nls.localizeByDefault('笔记本单元格中输出文本的字体大小。设置为 0 时，使用 {0}。', '`#editor.fontSize#`'),
            type: 'number',
            default: 0,
            tags: ['notebookLayout', 'notebookOutputLayout']
        },
        [NotebookPreferences.OUTPUT_FONT_FAMILY]: {
            markdownDescription: nls.localizeByDefault('笔记本单元格中输出文本的字体系列。设置为空时，使用 {0}。', '`#editor.fontFamily#`'),
            type: 'string',
            tags: ['notebookLayout', 'notebookOutputLayout']
        },
        [NotebookPreferences.OUTPUT_SCROLLING]: {
            markdownDescription: nls.localizeByDefault('超过限制时，最初在可滚动区域中呈现笔记本输出。'),
            type: 'boolean',
            tags: ['notebookLayout', 'notebookOutputLayout'],
            default: false
        },
        [NotebookPreferences.OUTPUT_WORD_WRAP]: {
            markdownDescription: nls.localizeByDefault('控制输出中的行是否换行。'),
            type: 'boolean',
            tags: ['notebookLayout', 'notebookOutputLayout'],
            default: false
        },
        [NotebookPreferences.OUTPUT_LINE_LIMIT]: {
            markdownDescription: nls.localizeByDefault(
                'Controls how many lines of text are displayed in a text output. If {0} is enabled, this setting is used to determine the scroll height of the output.',
                '`#notebook.output.scrolling#`'),
            type: 'number',
            default: 30,
            tags: ['notebookLayout', 'notebookOutputLayout'],
            minimum: 1,
        },

    }
};

export const NotebookPreferenceContribution = Symbol('NotebookPreferenceContribution');

export function bindNotebookPreferences(bind: interfaces.Bind): void {
    // We don't need a NotebookPreferenceConfiguration class, so there's no preference proxy to bind
    bind(NotebookPreferenceContribution).toConstantValue({ schema: notebookPreferenceSchema });
    bind(PreferenceContribution).toService(NotebookPreferenceContribution);
}
