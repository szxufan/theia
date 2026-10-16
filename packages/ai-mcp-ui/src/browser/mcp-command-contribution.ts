// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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
import { AICommandHandlerFactory } from '@theia/ai-core/lib/browser/ai-command-handler-factory';
import { CommandContribution, CommandRegistry, MessageService, nls, ILogger } from '@theia/core';
import { QuickInputService } from '@theia/core/lib/browser';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { isRemoteMCPServerDescription, MCPFrontendService, MCPOAuthFrontendDelegate, MCPServerDescription, MCPServerStatus } from '@theia/ai-mcp';

export const StartMCPServer = {
    id: 'mcp.startserver',
    label: nls.localize('theia/ai/mcp/start/label', 'MCP: 启动 MCP 服务器'),
};
export const StopMCPServer = {
    id: 'mcp.stopserver',
    label: nls.localize('theia/ai/mcp/stop/label', 'MCP: 停止 MCP 服务器'),
};
export const SignOutMCPServer = {
    id: 'mcp.signout',
    label: nls.localize('theia/ai/mcp/signout/label', 'MCP: 从 MCP 服务器登出'),
};
export const SignInMCPServer = {
    id: 'mcp.signin',
    label: nls.localize('theia/ai/mcp/signin/label', 'MCP: 登录 MCP 服务器'),
};
export const GetMCPOAuthRedirectUrl = {
    id: 'mcp.oauth.getRedirectUrl',
    label: nls.localize('theia/ai/mcp/getRedirectUrl/label', 'MCP: 获取 MCP OAuth 重定向 URL'),
};

@injectable()
export class MCPCommandContribution implements CommandContribution {
    @inject(AICommandHandlerFactory)
    protected readonly commandHandlerFactory: AICommandHandlerFactory;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(MCPFrontendService)
    protected readonly mcpFrontendService: MCPFrontendService;

    @inject(ILogger) @named('ai-mcp-ui:MCPCommandContribution')
    protected readonly logger: ILogger;

    @inject(MCPOAuthFrontendDelegate)
    protected readonly oauthFrontendDelegate: MCPOAuthFrontendDelegate;

    private async getMCPServerSelection(serverNames: string[]): Promise<string | undefined> {
        if (!serverNames || serverNames.length === 0) {
            return undefined;
        }
        const options = serverNames.map(mcpServerName => ({ label: mcpServerName }));
        const result = await this.quickInputService.showQuickPick(options);
        return result?.label;
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(StopMCPServer, this.commandHandlerFactory({
            execute: async () => {
                try {
                    // Include `AuthenticationRequired` servers: stopping cancels a pending OAuth
                    // authorization, which is the only way out of an abandoned sign-in attempt.
                    const servers = await this.mcpFrontendService.getServerNames();
                    const descriptions = await Promise.all(servers.map(server => this.mcpFrontendService.getServerDescription(server)));
                    const stoppableServers = descriptions
                        .filter((description): description is MCPServerDescription => !!description && this.isStoppableStatus(description.status))
                        .map(description => description.name);
                    if (stoppableServers.length === 0) {
                        this.messageService.error(nls.localize('theia/ai/mcp/error/noRunningServers', '没有正在运行的 MCP 服务器。'));
                        return;
                    }
                    const selection = await this.getMCPServerSelection(stoppableServers);
                    if (!selection) {
                        return;
                    }
                    await this.mcpFrontendService.stopServer(selection);
                } catch (error) {
                    this.messageService.error(nls.localize('theia/ai/mcp/error/stopFailed', '停止 MCP 服务器时发生错误。'));
                    this.logger.error('Error while stopping MCP server:', error);
                }
            }
        }));

        commandRegistry.registerCommand(SignOutMCPServer, this.commandHandlerFactory({
            execute: async () => {
                try {
                    // List all OAuth-enabled servers without a `hasStoredOAuthCredentials` filter: the command
                    // palette is the recovery surface for stale-scope credentials, and signing out a server
                    // with no stored credentials is a harmless no-op.
                    const oauthEnabledServers = await this.getOAuthEnabledServerNames();
                    if (oauthEnabledServers.length === 0) {
                        this.messageService.info(nls.localize('theia/ai/mcp/error/noOAuthServersConfigured', '未配置启用 OAuth 的 MCP 服务器。'));
                        return;
                    }
                    const selection = await this.getMCPServerSelection(oauthEnabledServers);
                    if (!selection) {
                        return;
                    }
                    await this.mcpFrontendService.signOut(selection);
                    this.messageService.info(nls.localize('theia/ai/mcp/info/serverSignedOut', '已从 MCP 服务器“{0}”登出。', selection));
                } catch (error) {
                    this.messageService.error(nls.localize('theia/ai/mcp/error/signOutFailed', '从 MCP 服务器登出时发生错误。'));
                    this.logger.error('Error while signing out from MCP server:', error);
                }
            }
        }));

        commandRegistry.registerCommand(SignInMCPServer, this.commandHandlerFactory({
            execute: async () => {
                try {
                    const oauthEnabledServers = await this.getOAuthEnabledServerNames();
                    if (oauthEnabledServers.length === 0) {
                        this.messageService.info(nls.localize('theia/ai/mcp/error/noOAuthServersConfigured', '未配置启用 OAuth 的 MCP 服务器。'));
                        return;
                    }
                    const selection = await this.getMCPServerSelection(oauthEnabledServers);
                    if (!selection) {
                        return;
                    }
                    const signedIn = await this.mcpFrontendService.signIn(selection);
                    if (signedIn) {
                        this.messageService.info(nls.localize('theia/ai/mcp/info/serverSignedIn', '已登录 MCP 服务器“{0}”。', selection));
                    } else {
                        this.messageService.warn(nls.localize('theia/ai/mcp/warn/signInNotCompleted', '对 MCP 服务器“{0}”的登录未完成。', selection));
                    }
                } catch (error) {
                    this.messageService.error(nls.localize('theia/ai/mcp/error/signInFailed', '登录 MCP 服务器时发生错误。'));
                    this.logger.error('Error while signing in to MCP server:', error);
                }
            }
        }));

        commandRegistry.registerCommand(GetMCPOAuthRedirectUrl, this.commandHandlerFactory({
            execute: async () => {
                try {
                    const redirectUrl = await this.oauthFrontendDelegate.getEffectiveRedirectUrl();
                    const copyAction = nls.localizeByDefault('复制');
                    const action = await this.messageService.info(
                        nls.localize('theia/ai/mcp/info/oauthRedirectUrl', 'MCP OAuth 重定向 URL：{0}', redirectUrl), copyAction);
                    if (action === copyAction) {
                        await navigator.clipboard.writeText(redirectUrl);
                    }
                } catch (error) {
                    this.messageService.error(nls.localize('theia/ai/mcp/error/getRedirectUrlFailed', '确定 MCP OAuth 重定向 URL 时发生错误。'));
                    this.logger.error('Error while determining the MCP OAuth redirect URL:', error);
                }
            }
        }));

        commandRegistry.registerCommand(StartMCPServer, this.commandHandlerFactory({
            execute: async () => {
                try {
                    const servers = await this.mcpFrontendService.getServerNames();
                    const startedServers = await this.mcpFrontendService.getStartedServers();
                    const startableServers = servers.filter(server => !startedServers.includes(server));
                    if (!startableServers || startableServers.length === 0) {
                        if (startedServers && startedServers.length > 0) {
                            this.messageService.error(nls.localize('theia/ai/mcp/error/allServersRunning', '所有 MCP 服务器都已在运行中。'));
                        } else {
                            this.messageService.error(nls.localize('theia/ai/mcp/error/noServersConfigured', '尚未配置任何 MCP 服务器。'));
                        }
                        return;
                    }

                    const selection = await this.getMCPServerSelection(startableServers);
                    if (!selection) {
                        return;
                    }
                    const selectedDescription = await this.mcpFrontendService.getServerDescription(selection);
                    if (selectedDescription?.status === MCPServerStatus.AuthenticationRequired) {
                        // Starting in `AuthenticationRequired` would join the pending OAuth flow and change
                        // nothing; stop first so the start below begins a fresh authorization attempt.
                        await this.mcpFrontendService.stopServer(selection);
                    }
                    // OAuth gating happens in the backend: `startServerInteractive` sets the manager's
                    // `interactive` flag, which is what permits the OAuth provider to launch the browser.
                    // No popup preparation or OAuth-flag inspection is needed at this layer.
                    const startAttempted = await this.mcpFrontendService.startServerInteractive(selection);
                    if (!startAttempted) {
                        // A pre-flight check (untrusted workspace) already surfaced its own toast. Skip
                        // outcome reporting; the status is still NotConnected/NotRunning from before the
                        // attempt, which `reportStartOutcome` would otherwise treat as cancellation.
                        return;
                    }
                    const serverDescription = await this.mcpFrontendService.getServerDescription(selection);
                    this.reportStartOutcome(selection, serverDescription);
                } catch (error) {
                    this.messageService.error(nls.localize('theia/ai/mcp/error/startFailed', '启动 MCP 服务器时发生错误。'));
                    this.logger.error('Error while starting MCP server:', error);
                }
            }
        }));
    }

    protected isStoppableStatus(status: MCPServerStatus | undefined): boolean {
        return status === MCPServerStatus.Running
            || status === MCPServerStatus.Connected
            || status === MCPServerStatus.AuthenticationRequired;
    }

    protected async getOAuthEnabledServerNames(): Promise<string[]> {
        const servers = await this.mcpFrontendService.getServerNames();
        const descriptions = await Promise.all(servers.map(server => this.mcpFrontendService.getServerDescription(server)));
        return descriptions
            .filter((description): description is MCPServerDescription =>
                !!description && isRemoteMCPServerDescription(description) && !!description.oauth)
            .map(description => description.name);
    }

    /**
     * The command-palette flow has no other UI surface, so the toast must match the terminal status:
     * a generic 'start failed' for every non-success state would contradict cancellation
     * (status=NotConnected/NotRunning, error cleared) and authorization-server denial
     * (status=AuthenticationRequired with a localized diagnostic in `error`).
     */
    protected reportStartOutcome(serverName: string, serverDescription: MCPServerDescription | undefined): void {
        if (!serverDescription || !serverDescription.status) {
            this.messageService.error(nls.localize('theia/ai/mcp/error/startFailed', '启动 MCP 服务器时发生错误。'));
            return;
        }
        const { status, error, tools } = serverDescription;
        if (status === MCPServerStatus.Running || status === MCPServerStatus.Connected) {
            const toolNames = tools && tools.length > 0
                ? tools.map(tool => tool.name).join(',')
                : nls.localize('theia/ai/mcp/info/noToolsAvailable', '没有可用的工具。');
            this.messageService.info(
                nls.localize('theia/ai/mcp/info/serverStarted', 'MCP 服务器“{0}”已成功启动。已注册的工具：{1}', serverName, toolNames)
            );
            return;
        }
        if (status === MCPServerStatus.NotConnected || status === MCPServerStatus.NotRunning) {
            // `handleStartupError` clears `error` on the cancel path; a generic failure toast would
            // contradict the user's cancellation. Surface as info so the command flow has a positive signal.
            this.messageService.info(
                nls.localize('theia/ai/mcp/info/signInCancelled', 'MCP 服务器“{0}”的登录已取消。', serverName)
            );
            return;
        }
        if (status === MCPServerStatus.AuthenticationRequired) {
            // Authorization-server denial populates `error` with the localized diagnostic; reuse it so the
            // toast matches the status-badge hover. Fall back to a re-auth prompt when missing.
            this.messageService.error(error ?? nls.localize('theia/ai/mcp/error/authenticationRequired',
                'MCP 服务器“{0}”需要身份验证。请再次启动服务器以登录。', serverName));
            return;
        }
        if (status === MCPServerStatus.Starting || status === MCPServerStatus.Connecting) {
            // `startServer` is awaited, so a transient status should not be observable today. Log-only rather
            // than a generic failure toast in case the async lifecycle is widened later; the status badge
            // will surface the eventual terminal state via the `onDidUpdateStatus` subscription.
            this.logger.warn(`MCP server "${serverName}" returned from startServerInteractive while still ${status}; the UI will update when the server reaches a terminal state.`);
            return;
        }
        if (error) {
            this.logger.error('Error while starting MCP server:', error);
        }
        this.messageService.error(nls.localize('theia/ai/mcp/error/startFailed', '启动 MCP 服务器时发生错误。'));
    }
}
