// *****************************************************************************
// Copyright (C) 2018 Red Hat, Inc. and others.
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
import { PluginDebugPort } from './plugin-dev-protocol';

export const HostedPluginConfigSchema: PreferenceSchema = {
    properties: {
        'hosted-plugin.watchMode': {
            type: 'boolean',
            description: nls.localize('theia/plugin-dev/watchMode', '对正在开发的插件运行监视器'),
            default: true
        },
        'hosted-plugin.debugMode': {
            type: 'string',
            description: nls.localize('theia/plugin-dev/debugMode', '使用 inspect 或 inspect-brk 进行 Node.js 调试'),
            default: 'inspect',
            enum: ['inspect', 'inspect-brk']
        },
        'hosted-plugin.launchOutFiles': {
            type: 'array',
            items: {
                type: 'string'
            },
            markdownDescription: nls.localize(
                'theia/plugin-dev/launchOutFiles',
                '用于查找生成的 JavaScript 文件的 glob 模式数组（`${pluginPath}` 将被替换为插件的实际路径）。'
            ),
            default: ['${pluginPath}/out/**/*.js']
        },
        'hosted-plugin.debugPorts': {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    'serverName': {
                        type: 'string',
                        description: nls.localize('theia/plugin-dev/debugPorts/serverName',
                            '插件宿主服务器名称，如 "--hosted-plugin-inspect=" 中的 "hosted-plugin"，'
                            + '或 "--headless-hosted-plugin-inspect=" 中的 "headless-hosted-plugin"'),
                    },
                    'debugPort': {
                        type: 'number',
                        minimum: 0,
                        maximum: 65535,
                        description: nls.localize('theia/plugin-dev/debugPorts/debugPort', '用于此服务器 Node.js 调试的端口'),
                    }
                },
            },
            default: [],
            description: nls.localize('theia/plugin-dev/debugPorts', '每个服务器的 Node.js 调试端口配置'),
        }
    }
};

export interface HostedPluginConfiguration {
    'hosted-plugin.watchMode': boolean;
    'hosted-plugin.debugMode': string;
    'hosted-plugin.launchOutFiles': string[];
    'hosted-plugin.debugPorts': PluginDebugPort[];
}

export const HostedPluginPreferenceContribution = Symbol('HostedPluginPreferenceContribution');
export const HostedPluginPreferences = Symbol('HostedPluginPreferences');
export type HostedPluginPreferences = PreferenceProxy<HostedPluginConfiguration>;

export function createNavigatorPreferences(preferences: PreferenceService, schema: PreferenceSchema = HostedPluginConfigSchema): HostedPluginPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindHostedPluginPreferences(bind: interfaces.Bind): void {
    bind(HostedPluginPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(HostedPluginPreferenceContribution);
        return createNavigatorPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(HostedPluginPreferenceContribution).toConstantValue({ schema: HostedPluginConfigSchema });
    bind(PreferenceContribution).toService(HostedPluginPreferenceContribution);
}
