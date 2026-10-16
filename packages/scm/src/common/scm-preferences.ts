// *****************************************************************************
// Copyright (C) 2020 Ericsson and others.
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
    PreferenceContribution,
    PreferenceProxy,
    PreferenceSchema,
    PreferenceService,
} from '@theia/core/lib/common/preferences';
import { nls } from '@theia/core/lib/common/nls';

export const scmPreferenceSchema: PreferenceSchema = {
    properties: {
        'scm.defaultViewMode': {
            type: 'string',
            enum: ['tree', 'list'],
            enumDescriptions: [
                nls.localizeByDefault('以树形结构显示存储库更改。'),
                nls.localizeByDefault('以列表形式显示存储库更改。')
            ],
            description: nls.localizeByDefault('控制源代码管理存储库视图的默认模式。'),
            default: 'list'
        },
        'scm.graph.badges': {
            type: 'string',
            enum: ['all', 'filter'],
            enumDescriptions: [
                nls.localizeByDefault('在源代码管理关系图视图中显示所有历史项目组的其他指示。'),
                nls.localizeByDefault('仅在源代码管理关系图视图中显示用作筛选器的历史项目组的指示。')
            ],
            description: nls.localizeByDefault(
                // eslint-disable-next-line max-len
                '控制源代码管理关系图视图中显示哪些指示。指示显示在关系图右侧，指示历史项目组的名称。'),
            default: 'filter'
        },
        'scm.graph.pageOnScroll': {
            type: 'boolean',
            description: nls.localizeByDefault('控制当滚动到列表末尾时，源代码管理关系图视图是否加载下一页项目。'),
            default: true
        },
        'scm.graph.pageSize': {
            type: 'number',
            minimum: 1,
            maximum: 1000,
            description: nls.localizeByDefault('源代码管理关系图视图默认以及加载更多项目时显示的项目数。'),
            default: 50
        }
    }
};

export interface ScmConfiguration {
    'scm.defaultViewMode': 'tree' | 'list'
    'scm.graph.badges': 'all' | 'filter'
    'scm.graph.pageOnScroll': boolean
    'scm.graph.pageSize': number
}

export const ScmPreferenceContribution = Symbol('ScmPreferenceContribution');
export const ScmPreferences = Symbol('ScmPreferences');
export type ScmPreferences = PreferenceProxy<ScmConfiguration>;

export function createScmPreferences(preferences: PreferenceService, schema: PreferenceSchema = scmPreferenceSchema): ScmPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindScmPreferences(bind: interfaces.Bind): void {
    bind(ScmPreferences).toDynamicValue((ctx: interfaces.Context) => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(ScmPreferenceContribution);
        return createScmPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(ScmPreferenceContribution).toConstantValue({ schema: scmPreferenceSchema });
    bind(PreferenceContribution).toService(ScmPreferenceContribution);
}
