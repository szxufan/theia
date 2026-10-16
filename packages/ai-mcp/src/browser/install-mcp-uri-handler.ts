// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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

import { MessageService, nls, PreferenceService } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { ConfirmDialog } from '@theia/core/lib/browser/dialogs';
import { OpenHandler } from '@theia/core/lib/browser/opener-service';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { inject, injectable, optional } from '@theia/core/shared/inversify';
import { MCP_SERVERS_PREF } from '../common/mcp-preferences';
import { MCPServerEditor } from './mcp-server-editor';
import { MCPInstallUriConfiguration } from './mcp-install-uri-configuration';
import { MCPRegistryUiBridge } from './mcp-registry-ui-bridge';
import { MCPServerInstallDialogFactory, MCPServerInstallTrust } from './mcp-server-install-dialog';

const ID_PARAM = 'id';

/**
 * Handles `theia://install-mcp?id=<serverId>` deep links. The URL is intentionally
 * minimal: the install configuration, version, display name and content hash are all
 * read from the configured AI registry by id. This guarantees the user installs exactly
 * what the registry currently publishes and keeps install links short and stable.
 *
 * Opening such a link brings the IDE window to the foreground, reveals the AI registry
 * (Extensions) view with the `serverId` searched so the entry is in focus, and then opens
 * the install dialog for that entry.
 *
 * Lives in `@theia/ai-mcp` so products without the registry package still receive the
 * URL - but installation only succeeds when an `MCPRegistryUiBridge` is bound and the
 * id exists in the registry. The bridge is consulted via `@optional()`.
 */
@injectable()
export class InstallMcpUriHandler implements OpenHandler {

    readonly id = 'install-mcp-uri-handler';

    @inject(MCPInstallUriConfiguration)
    protected readonly configuration: MCPInstallUriConfiguration;

    @inject(MCPServerEditor)
    protected readonly editor: MCPServerEditor;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(MCPRegistryUiBridge) @optional()
    protected readonly registryBridge?: MCPRegistryUiBridge;

    @inject(MCPServerInstallDialogFactory)
    protected readonly installDialogFactory: MCPServerInstallDialogFactory;

    canHandle(uri: URI): number {
        // Validate both scheme (must match the product's electron URI scheme) and authority
        // so we don't accidentally claim URIs from unrelated protocols.
        return uri.scheme === this.configuration.getScheme()
            && uri.authority === this.configuration.getAuthority()
            ? 500
            : 0;
    }

    async open(uri: URI): Promise<object | undefined> {
        const serverId = this.extractServerId(uri);
        this.windowService.focus();
        if (!serverId) {
            this.messageService.error(nls.localize(
                'theia/ai-mcp/installUri/missingId',
                '安装链接缺少必需的 "id" 参数。'
            ));
            return undefined;
        }
        if (!this.registryBridge) {
            this.messageService.error(nls.localize(
                'theia/ai-mcp/installUri/noRegistry',
                '无法安装 MCP 服务器“{0}”——此产品未配置 AI 注册表。',
                serverId
            ));
            return undefined;
        }
        // Wait for the bridge's first fetch so an id click immediately after startup
        // doesn't race the registry load and produce a false "not found".
        await this.registryBridge.ready();
        const entry = this.registryBridge.getInstallEntry(serverId);
        if (!entry) {
            this.messageService.error(nls.localize(
                'theia/ai-mcp/installUri/unknownId',
                'MCP 服务器“{0}”未列在你的 AI 注册表中。',
                serverId
            ));
            return undefined;
        }
        await this.registryBridge.openRegistry(serverId);
        if (this.isAlreadyInstalled(entry.localName) && !await this.confirmOverwrite(entry.localName)) {
            return undefined;
        }
        const dialog = this.installDialogFactory({
            name: entry.localName,
            autostart: true,
            requireAuthToken: 'serverAuthToken' in entry.config,
            requireOAuth: 'oauth' in entry.config,
            // Bridge already resolved this id, so trust is always "verified" here.
            trust: { status: 'verified', serverId } satisfies MCPServerInstallTrust
        });
        const result = await dialog.open();
        if (!result) {
            return undefined;
        }
        await this.editor.installFromEntry(entry, result);
        // Deep-link installs may originate from a browser tab the user has since switched
        // away from; close success can otherwise be silent because the dialog dismisses on
        // confirm. A confirmation toast makes the outcome explicit.
        this.messageService.info(nls.localize(
            'theia/ai-mcp/installUri/success',
            '已从 AI 注册表安装 MCP 服务器“{0}”。',
            entry.localName
        ));
        return undefined;
    }

    /** True if a server with this name is already in `ai-features.mcp.mcpServers`. */
    protected isAlreadyInstalled(localName: string): boolean {
        const stored = this.preferenceService.get<Record<string, unknown>>(MCP_SERVERS_PREF, {}) ?? {};
        return Object.prototype.hasOwnProperty.call(stored, localName);
    }

    /**
     * Acknowledge prompt for already-installed servers. We don't try to be clever about
     * "is this the same registry entry?" - the user may have edited the local config
     * and any overwrite should be an explicit decision.
     */
    protected async confirmOverwrite(localName: string): Promise<boolean> {
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai-mcp/installUri/alreadyInstalled/title', 'MCP 服务器已安装'),
            msg: nls.localize(
                'theia/ai-mcp/installUri/alreadyInstalled/msg',
                '名为“{0}”的 MCP 服务器已配置。继续操作将使用注册表中的配置覆盖现有条目。',
                localName
            ),
            ok: nls.localizeByDefault('继续'),
            cancel: nls.localizeByDefault('取消')
        });
        return !!await dialog.open();
    }

    protected extractServerId(uri: URI): string | undefined {
        return new URLSearchParams(uri.query).get(ID_PARAM)?.trim() || undefined;
    }
}
