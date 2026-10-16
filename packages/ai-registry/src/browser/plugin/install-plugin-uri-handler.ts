// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH and others.
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

import { MessageService, nls } from '@theia/core';
import { OpenHandler } from '@theia/core/lib/browser/opener-service';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { RegistryFetchService } from '../../common/registry-fetch-service';
import { ResolvedPluginEntry } from '../../common/plugin/plugin-registry-types';
import { InstallPluginUriConfiguration } from './install-plugin-uri-configuration';
import { PluginInstaller } from './plugin-installer';

const ID_PARAM = 'id';

/**
 * Handles `theia://install-plugin?id=<pluginId>`. Minimal on purpose: everything else is read from the
 * registry by id, so a link can name a plugin but never describe one. An id the registry does not
 * list is refused rather than installed from the link's own data.
 */
@injectable()
export class InstallPluginUriHandler implements OpenHandler {

    readonly id = 'install-plugin-uri-handler';

    @inject(InstallPluginUriConfiguration)
    protected readonly configuration: InstallPluginUriConfiguration;

    @inject(RegistryFetchService)
    protected readonly fetchService: RegistryFetchService;

    @inject(PluginInstaller)
    protected readonly installer: PluginInstaller;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    canHandle(uri: URI): number {
        return uri.scheme === this.configuration.getScheme()
            && uri.authority === this.configuration.getAuthority()
            ? 500
            : 0;
    }

    async open(uri: URI): Promise<object | undefined> {
        const pluginId = this.extractPluginId(uri);
        if (!pluginId) {
            this.messageService.error(nls.localize(
                'theia/ai-registry/plugin/installUri/missingId',
                '安装链接缺少必需的 "id" 参数。'
            ));
            return undefined;
        }
        let entries: ResolvedPluginEntry[];
        try {
            entries = await this.fetchService.getPluginEntries();
        } catch {
            this.messageService.error(nls.localize(
                'theia/ai-registry/plugin/installUri/fetchFailed',
                '无法加载 AI 注册表以安装代理插件“{0}”。',
                pluginId
            ));
            return undefined;
        }
        const entry = entries.find(candidate => candidate.pluginId === pluginId);
        if (!entry) {
            this.messageService.error(nls.localize(
                'theia/ai-registry/plugin/installUri/unknownId',
                '代理插件“{0}”未列在你的 AI 注册表中。',
                pluginId
            ));
            return undefined;
        }
        try {
            if (await this.installer.install(entry, { replaceExisting: false, confirm: true })) {
                this.messageService.info(nls.localize(
                    'theia/ai-registry/plugin/installUri/success',
                    '已从 AI 注册表安装代理插件“{0}”。',
                    entry.name
                ));
            }
        } catch (error) {
            this.messageService.error(error instanceof Error ? error.message : String(error));
        }
        return undefined;
    }

    protected extractPluginId(uri: URI): string | undefined {
        return new URLSearchParams(uri.query).get(ID_PARAM)?.trim() || undefined;
    }
}
