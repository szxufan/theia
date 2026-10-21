// *****************************************************************************
// Copyright (C) 2023 TypeFox and others.
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

import { OS } from '@theia/core';
import { interfaces } from '@theia/core/shared/inversify';
import { PreferenceProxy } from '@theia/core/lib/common/preferences/preference-proxy';
import { nls } from '@theia/core/lib/common/nls';
import { PreferenceProxyFactory } from '@theia/core/lib/common/preferences/injectable-preference-proxy';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

const nodeDownloadTemplateParts = [
    nls.localize('theia/remote/nodeDownloadTemplateVersion', '`{version}`：使用的 node 版本'),
    nls.localize('theia/remote/nodeDownloadTemplateOS', '`{os}`：远程操作系统，取值为 `win`、`linux` 或 `darwin`。'),
    nls.localize('theia/remote/nodeDownloadTemplateArch', '`{arch}`：远程系统架构。'),
    nls.localize('theia/remote/nodeDownloadTemplateExt', '`{ext}`：文件扩展名，取决于操作系统（`zip`、`tar.xz` 等）。')
];

export const RemotePreferenceSchema: PreferenceSchema = {
    properties: {
        'remote.nodeDownloadTemplate': {
            type: 'string',
            default: '',
            markdownDescription: nls.localize(
                'theia/remote/nodeDownloadTemplate',
                '控制为远程后端下载 node.js 二进制文件所用的模板。默认指向 node.js 官网。可使用以下占位符：'
            ) + '\n- ' + nodeDownloadTemplateParts.join('\n- ')
        },
        'remote.ssh.configFile': {
            type: 'string',
            default: OS.backend.isWindows ? '${env:USERPROFILE}\\.ssh\\config' : '${env:HOME}/.ssh/config',
            markdownDescription: nls.localize(
                'theia/remote/ssh/configFile',
                '远程 SSH 的配置文件路径。'
            )
        },
    }
};

export interface RemoteConfiguration {
    'remote.nodeDownloadTemplate': string;
    'remote.ssh.configFile': string;
}

export const RemotePreferenceContribution = Symbol('RemotePreferenceContribution');
export const RemotePreferences = Symbol('GettingStartedPreferences');
export type RemotePreferences = PreferenceProxy<RemoteConfiguration>;

export function bindRemotePreferences(bind: interfaces.Bind): void {
    bind(RemotePreferences).toDynamicValue(ctx => {
        const factory = ctx.container.get<PreferenceProxyFactory>(PreferenceProxyFactory);
        return factory(RemotePreferenceSchema);
    }).inSingletonScope();
    bind(RemotePreferenceContribution).toConstantValue({ schema: RemotePreferenceSchema });
    bind(PreferenceContribution).toService(RemotePreferenceContribution);
}
