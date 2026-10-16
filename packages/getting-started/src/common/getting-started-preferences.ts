// *****************************************************************************
// Copyright (C) 2023 Ericsson and others.
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

export const GettingStartedPreferenceSchema: PreferenceSchema = {
    properties: {
        'workbench.startupEditor': {
            type: 'string',
            enum: ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench'],
            enumDescriptions: [
                nls.localizeByDefault('启动时不打开编辑器。'),
                nls.localize('theia/getting-started/startup-editor/welcomePage', '打开欢迎页，其中包含帮助您开始使用 {0} 和扩展的内容。',
                    'Theia'),
                // eslint-disable-next-line max-len
                nls.localizeByDefault("打开包含 README 的文件夹时打开 README，否则回退到 'welcomePage'。注意：此项仅作为全局配置生效，在工作区或文件夹配置中设置时将被忽略。"),
                nls.localizeByDefault('打开新的无标题文本文件（仅在打开空窗口时适用）。'),
                nls.localizeByDefault('打开空工作台时打开欢迎页。'),
            ],
            default: 'welcomePage',
            description: nls.localizeByDefault('控制启动时显示哪个编辑器（如果上一个会话没有恢复任何编辑器）。')
        },
        'workbench.welcomePage.walkthroughs.openOnInstall': {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('启用后，安装扩展时将打开该扩展的向导。')
        },
    }
};

export interface GettingStartedConfiguration {
    'workbench.startupEditor': string;
    'workbench.welcomePage.walkthroughs.openOnInstall': boolean;
}

export const GettingStartedPreferenceContribution = Symbol('GettingStartedPreferenceContribution');
export const GettingStartedPreferences = Symbol('GettingStartedPreferences');
export type GettingStartedPreferences = PreferenceProxy<GettingStartedConfiguration>;

export function createGettingStartedPreferences(preferences: PreferenceService, schema: PreferenceSchema = GettingStartedPreferenceSchema): GettingStartedPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindGettingStartedPreferences(bind: interfaces.Bind): void {
    bind(GettingStartedPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(GettingStartedPreferenceContribution);
        return createGettingStartedPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(GettingStartedPreferenceContribution).toConstantValue({ schema: GettingStartedPreferenceSchema });
    bind(PreferenceContribution).toService(GettingStartedPreferenceContribution);
}
