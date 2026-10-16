// *****************************************************************************
// Copyright (C) 2018 TypeFox and others.
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
import { createPreferenceProxy, PreferenceContribution, PreferenceProxy, PreferenceSchema, PreferenceService } from '@theia/core';
import { nls } from '@theia/core/lib/common/nls';

export const EXPLORER_COMPACT_FOLDERS = 'explorer.compactFolders';

export const FileNavigatorConfigSchema: PreferenceSchema = {
    properties: {
        'explorer.autoReveal': {
            type: 'boolean',
            description: nls.localizeByDefault('控制资源管理器在打开文件时是否自动显示并选中该文件。'),
            default: true
        },
        'explorer.decorations.colors': {
            type: 'boolean',
            description: nls.localizeByDefault('控制文件装饰是否使用颜色。'),
            default: true
        },
        [EXPLORER_COMPACT_FOLDERS]: {
            type: 'boolean',
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault('控制资源管理器是否以紧凑形式显示文件夹。在紧凑形式下，只有一个子文件夹的文件夹会被压缩为一个组合树元素。例如对 Java 包结构很有用。'),
            default: true,
        }
    },
};

export interface FileNavigatorConfiguration {
    'explorer.autoReveal': boolean;
    'explorer.decorations.colors': boolean;
    [EXPLORER_COMPACT_FOLDERS]: boolean;
}

export const FileNavigatorPreferenceContribution = Symbol('FileNavigatorPreferenceContribution');
export const FileNavigatorPreferences = Symbol('NavigatorPreferences');
export type FileNavigatorPreferences = PreferenceProxy<FileNavigatorConfiguration>;

export function createNavigatorPreferences(preferences: PreferenceService, schema: PreferenceSchema = FileNavigatorConfigSchema): FileNavigatorPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindFileNavigatorPreferences(bind: interfaces.Bind): void {
    bind(FileNavigatorPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(FileNavigatorPreferenceContribution);
        return createNavigatorPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(FileNavigatorPreferenceContribution).toConstantValue({ schema: FileNavigatorConfigSchema });
    bind(PreferenceContribution).toService(FileNavigatorPreferenceContribution);
}
