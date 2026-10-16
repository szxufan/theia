// *****************************************************************************
// Copyright (C) 2018 Ericsson and others.
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
import {
    createPreferenceProxy,
    PreferenceProxy,
    PreferenceService,
    PreferenceChangeEvent,
    PreferenceScope,
    PreferenceContribution,
    PreferenceProxyFactory,
    PreferenceSchema,
} from '@theia/core/lib/common/preferences';
import { nls } from '@theia/core/lib/common/nls';
import { environment } from '@theia/core';
import { editorGeneratedPreferenceProperties, GeneratedEditorPreferences } from './editor-generated-preference-schema';

/* eslint-disable max-len,no-null/no-null */
// #region src/vs/workbench/contrib/codeActions/browser/codeActionsContribution.ts

const codeActionsContributionSchema: PreferenceSchema['properties'] = {
    'editor.codeActionsOnSave': {
        oneOf: [
            {
                type: 'object',
                properties: {
                    'source.fixAll': {
                        type: 'boolean',
                        description: nls.localizeByDefault('控制是否在保存文件时运行 \'{0}\' 操作。', 'quickfix')
                    }
                },
                additionalProperties: {
                    type: 'boolean'
                },
            },
            {
                type: 'array',
                items: { type: 'string' }
            }
        ],
        default: {},
        markdownDescription: nls.localizeByDefault('保存时为编辑器运行代码操作。必须指定代码操作，且编辑器不能正在关闭。当 {0} 设置为 `afterDelay` 时，只有在显式保存文件时才会运行代码操作。示例：`"source.organizeImports": "explicit" `'),
        scope: PreferenceScope.Folder,
        overridable: true
    }
};

interface CodeActionsContributionProperties {
    'editor.codeActionsOnSave': string[] | ({ 'source.fixAll': boolean } & Record<string, boolean>)
}

// #endregion

// #region src/vs/workbench/contrib/files/browser/files.contribution.ts
const fileContributionSchema: PreferenceSchema['properties'] = {
    'editor.formatOnSave': {
        'type': 'boolean',
        'description': nls.localizeByDefault('保存时格式化文件。必须有可用的格式化程序，且编辑器不能正在关闭。当 {0} 设置为 `afterDelay` 时，只有在显式保存时才会格式化文件。', '`#files.autoSave#`'),
        'scope': PreferenceScope.Folder,
        overridable: true
    },
    'editor.formatOnSaveMode': {
        'type': 'string',
        'default': 'file',
        'enum': [
            'file',
            'modifications',
            'modificationsIfAvailable'
        ],
        'enumDescriptions': [
            nls.localizeByDefault('格式化整个文件。'),
            nls.localizeByDefault("格式化修改部分。需要源代码管理以及支持“格式化选定内容”的格式化程序。"),
            nls.localizeByDefault('将尝试仅格式化修改部分（需要源代码管理以及支持“格式化选定内容”的格式化程序）。如果无法使用源代码管理，则格式化整个文件。'),
        ],
        'markdownDescription': nls.localizeByDefault('控制保存时是格式化整个文件还是仅格式化修改部分。仅在启用 `#editor.formatOnSave#` 时适用。'),
        'scope': PreferenceScope.Folder,
        overridable: true
    },
    // Include this, even though it is not strictly an `editor`preference.
    'files.eol': {
        'type': 'string',
        'enum': [
            '\n',
            '\r\n',
            'auto'
        ],
        'enumDescriptions': [
            nls.localizeByDefault('LF'),
            nls.localizeByDefault('CRLF'),
            nls.localizeByDefault('使用特定于操作系统的行尾字符。')
        ],
        'default': 'auto',
        'description': nls.localizeByDefault('默认的行尾字符。'),
        scope: PreferenceScope.Folder,
        overridable: true
    },
    // We used to call these `editor.autoSave` and `editor.autoSaveDelay`.
    'files.autoSave': {
        'type': 'string',
        'enum': ['off', 'afterDelay', 'onFocusChange', 'onWindowChange'],
        'markdownEnumDescriptions': [
            nls.localizeByDefault('有更改的编辑器从不自动保存。'),
            nls.localizeByDefault('有更改的编辑器会在配置的 `#files.autoSaveDelay#` 后自动保存。'),
            nls.localizeByDefault('有更改的编辑器会在失去焦点时自动保存。'),
            nls.localizeByDefault('有更改的编辑器会在窗口失去焦点时自动保存。')
        ],
        'default': environment.electron.is() ? 'off' : 'afterDelay',
        'markdownDescription': nls.localizeByDefault('控制有未保存更改的编辑器的[自动保存](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save)。')
    },
    'files.autoSaveDelay': {
        'type': 'number',
        'default': 1000,
        'minimum': 0,
        'markdownDescription': nls.localizeByDefault('控制在毫秒数之后自动保存具有未保存更改的编辑器。仅当 `#files.autoSave#` 设置为 `{0}` 时适用。', 'afterDelay')
    },
    'files.autoSaveWhenNoErrors': {
        'type': 'boolean',
        'default': false,
        'markdownDescription': nls.localize('theia/editor/autoSaveWhenNoErrors',
            'When enabled, will limit auto save of editors to files that have no errors reported in them at the time the auto save is triggered. Only applies when {0} is enabled.', '`#files.autoSave#`')
    },
    'files.refactoring.autoSave': {
        'type': 'boolean',
        'default': true,
        'description': nls.localizeByDefault('控制是否自动保存属于重构一部分的文件')
    }
};

interface FileContributionEditorPreferences {
    'editor.formatOnSave': boolean;
    'editor.formatOnSaveMode': 'file' | 'modifications' | 'modificationsIfAvailable';
    'files.eol': '\n' | '\r\n' | 'auto';
    'files.autoSave': 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
    'files.autoSaveDelay': number;
    'files.autoSaveWhenNoErrors': boolean;
    'files.refactoring.autoSave': boolean
}
// #endregion

// #region src/vs/workbench/contrib/format/browser/formatActionsMultiple.ts
// This schema depends on a lot of private stuff in the file, so this is a stripped down version.
const formatActionsMultipleSchema: PreferenceSchema['properties'] = {
    'editor.defaultFormatter': {
        description: nls.localizeByDefault('定义默认格式化程序，其优先级高于所有其他格式化程序设置。必须是提供了格式化程序的扩展的标识符。'),
        type: ['string', 'null'],
        default: null,
    }
};
interface FormatActionsMultipleProperties {
    'editor.defaultFormatter': string | null;
}
// #endregion

// #region Custom Theia extensions to editor preferences

const theiaEditorSchema: PreferenceSchema['properties'] = {
    'editor.formatOnSaveTimeout': {
        'type': 'number',
        'default': 750,
        'description': nls.localize('theia/editor/formatOnSaveTimeout', '超时时间（毫秒），超过该时间后，文件保存时运行的格式化将被取消。')
    },
    'editor.history.persistClosedEditors': {
        'type': 'boolean',
        'default': false,
        'description': nls.localize('theia/editor/persistClosedEditors', '控制是否在窗口重新加载后为工作区保留已关闭编辑器的历史记录。')
    },
};

interface TheiaEditorProperties {
    'editor.formatOnSaveTimeout': number;
    'editor.history.persistClosedEditors': boolean;
}

// #endregion

const combinedProperties = {
    ...editorGeneratedPreferenceProperties,
    ...codeActionsContributionSchema,
    ...fileContributionSchema,
    ...formatActionsMultipleSchema,
    ...theiaEditorSchema
};

export const editorPreferenceSchema: PreferenceSchema = {
    scope: PreferenceScope.Folder,
    defaultOverridable: true,
    properties: combinedProperties,
};

export interface EditorConfiguration extends GeneratedEditorPreferences,
    CodeActionsContributionProperties,
    FileContributionEditorPreferences,
    FormatActionsMultipleProperties,
    TheiaEditorProperties { }

export type EndOfLinePreference = '\n' | '\r\n' | 'auto';

export type EditorPreferenceChange = PreferenceChangeEvent<EditorConfiguration>;

export const EditorPreferenceContribution = Symbol('EditorPreferenceContribution');
export const EditorPreferences = Symbol('EditorPreferences');
export type EditorPreferences = PreferenceProxy<EditorConfiguration>;

/**
 * @deprecated @since 1.23.0
 *
 * By default, editor preferences now use a validated preference proxy created by the PreferenceProxyFactory binding.
 * This function will create an unvalidated preference proxy.
 * See {@link bindEditorPreferences}
 */
export function createEditorPreferences(preferences: PreferenceService, schema: PreferenceSchema = editorPreferenceSchema): EditorPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindEditorPreferences(bind: interfaces.Bind): void {
    bind(EditorPreferences).toDynamicValue(ctx => {
        const factory = ctx.container.get<PreferenceProxyFactory>(PreferenceProxyFactory);
        return factory(editorPreferenceSchema);
    }).inSingletonScope();
    bind(EditorPreferenceContribution).toConstantValue({ schema: editorPreferenceSchema });
    bind(PreferenceContribution).toService(EditorPreferenceContribution);
}
