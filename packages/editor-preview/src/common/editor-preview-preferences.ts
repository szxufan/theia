// *****************************************************************************
// Copyright (C) 2018 Google and others.
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

import { interfaces } from '@theia/core/shared/inversify';
import { createPreferenceProxy, PreferenceContribution, PreferenceProxy, PreferenceSchema, PreferenceService } from '@theia/core/lib/common';
import { nls } from '@theia/core/lib/common/nls';

export const ENABLE_PREVIEW_PREFERENCE = 'editor.enablePreview';

export const EditorPreviewConfigSchema: PreferenceSchema = {
    properties: {
        [ENABLE_PREVIEW_PREFERENCE]: {
            type: 'boolean',
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault("控制打开编辑器时是否使用预览模式。每个编辑器组最多只有一个预览模式的编辑器。此编辑器的文件名在其标签页或标题标签以及“打开的编辑器”视图中以斜体显示。其内容将被下一个以预览模式打开的编辑器替换。在预览模式的编辑器中进行更改将使其持久化，双击其标签或在标签上下文菜单中选择“保持打开”也会使其持久化。在资源管理器中双击打开文件会立即持久化其编辑器。"),
            default: true
        },
    }
};

export interface EditorPreviewConfiguration {
    'editor.enablePreview': boolean;
}

export const EditorPreviewPreferenceContribution = Symbol('EditorPreviewPreferenceContribution');
export const EditorPreviewPreferences = Symbol('EditorPreviewPreferences');
export type EditorPreviewPreferences = PreferenceProxy<EditorPreviewConfiguration>;

export function createEditorPreviewPreferences(preferences: PreferenceService, schema: PreferenceSchema = EditorPreviewConfigSchema): EditorPreviewPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindEditorPreviewPreferences(bind: interfaces.Bind): void {
    bind(EditorPreviewPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(EditorPreviewPreferenceContribution);
        return createEditorPreviewPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(EditorPreviewPreferenceContribution).toConstantValue({ schema: EditorPreviewConfigSchema });
    bind(PreferenceContribution).toService(EditorPreviewPreferenceContribution);
}
