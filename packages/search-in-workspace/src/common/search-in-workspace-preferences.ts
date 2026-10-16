// *****************************************************************************
// Copyright (C) 2019 Ericsson and others.
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

import { nls } from '@theia/core/lib/common/nls';
import { PreferenceProxy, PreferenceScope, PreferenceService, createPreferenceProxy } from '@theia/core/lib/common/preferences';
import { interfaces } from '@theia/core/shared/inversify';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export const searchInWorkspacePreferencesSchema: PreferenceSchema = {
    scope: PreferenceScope.Folder,
    properties: {
        'search.lineNumbers': {
            description: nls.localizeByDefault('控制是否显示搜索结果的行号。'),
            default: false,
            type: 'boolean',
        },
        'search.collapseResults': {
            description: nls.localizeByDefault('控制搜索结果是折叠还是展开。'),
            default: 'auto',
            type: 'string',
            enum: ['auto', 'alwaysCollapse', 'alwaysExpand'],
        },
        'search.quickOpen.includeHistory': {
            description: nls.localizeByDefault('控制是否在 Quick Open 的文件结果中包含最近打开文件的结果。'),
            default: true,
            type: 'boolean',
        },
        'search.searchOnType': {
            description: nls.localizeByDefault('在键入时搜索所有文件。'),
            default: true,
            type: 'boolean',
        },
        'search.searchOnTypeDebouncePeriod': {
            // eslint-disable-next-line max-len
            markdownDescription: nls.localizeByDefault('启用 {0} 时，控制从键入字符到开始搜索之间的超时时间（毫秒）。禁用 {0} 时此设置无效。', '`#search.searchOnType#`'),
            default: 300,
            type: 'number',
        },
        'search.searchOnEditorModification': {
            description: nls.localize('theia/search-in-workspace/searchOnEditorModification', '在活动编辑器被修改时进行搜索。'),
            default: true,
            type: 'boolean',
        },
        'search.smartCase': {
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault('如果模式全部为小写，则按不区分大小写的方式搜索，否则按区分大小写的方式搜索。'),
            default: false,
            type: 'boolean',
        },
        'search.followSymlinks': {
            description: nls.localizeByDefault('控制搜索时是否跟随符号链接。'),
            default: true,
            type: 'boolean',
        },
        'search.exclude': {
            type: 'object',
            // eslint-disable-next-line max-len
            markdownDescription: nls.localize('theia/search-in-workspace/searchExclude', '配置 [glob 模式](https://aka.ms/vscode-glob-patterns)，用于在全文搜索和 quick open 文件搜索中排除文件和文件夹。继承 `#files.exclude#` 设置中的所有 glob 模式。'),
            default: {
                '**/node_modules': true
            }
        }
    }
};

export class SearchInWorkspaceConfiguration {
    'search.lineNumbers': boolean;
    'search.collapseResults': string;
    'search.searchOnType': boolean;
    'search.searchOnTypeDebouncePeriod': number;
    'search.searchOnEditorModification': boolean;
    'search.smartCase': boolean;
    'search.followSymlinks': boolean;
    'search.exclude': { [key: string]: boolean };
}

export const SearchInWorkspacePreferenceContribution = Symbol('SearchInWorkspacePreferenceContribution');
export const SearchInWorkspacePreferences = Symbol('SearchInWorkspacePreferences');
export type SearchInWorkspacePreferences = PreferenceProxy<SearchInWorkspaceConfiguration>;

export function createSearchInWorkspacePreferences(preferences: PreferenceService, schema: PreferenceSchema = searchInWorkspacePreferencesSchema): SearchInWorkspacePreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindSearchInWorkspacePreferences(bind: interfaces.Bind): void {
    bind(SearchInWorkspacePreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(SearchInWorkspacePreferenceContribution);
        return createSearchInWorkspacePreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(SearchInWorkspacePreferenceContribution).toConstantValue({ schema: searchInWorkspacePreferencesSchema });
    bind(PreferenceContribution).toService(SearchInWorkspacePreferenceContribution);
}
