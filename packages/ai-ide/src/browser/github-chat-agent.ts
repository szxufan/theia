// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
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

import { AbstractStreamParsingChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { ErrorChatResponseContentImpl, MarkdownChatResponseContentImpl, MutableChatRequestModel, QuestionResponseContentImpl } from '@theia/ai-chat/lib/common/chat-model';
import { LanguageModelRequirement } from '@theia/ai-core/lib/common';
import { MCPFrontendService, MCPServerDescription } from '@theia/ai-mcp/lib/common/mcp-server-manager';
import { CommandService, ILogger, nls } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { MCP_SERVERS_PREF } from '@theia/ai-mcp/lib/common/mcp-preferences';
import { PreferenceScope, PreferenceService } from '@theia/core/lib/common';
import { PreferencesCommands } from '@theia/preferences/lib/browser/util/preference-types';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { githubTemplate, REQUIRED_GITHUB_MCP_SERVERS } from './github-prompt-template';

export const GitHubChatAgentId = 'GitHub';

@injectable()
export class GitHubChatAgent extends AbstractStreamParsingChatAgent {

    @inject(ILogger) @named('ai-ide:GitHubChatAgent')
    protected override readonly logger: ILogger;

    @inject(MCPFrontendService)
    protected readonly mcpService: MCPFrontendService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(FileService)
    protected readonly fileService: FileService;

    id: string = GitHubChatAgentId;
    name = GitHubChatAgentId;
    displayName = nls.localize('theia/ai/ide/githubAgent/displayName', 'GitHub');
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/fast',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';
    override description = nls.localize('theia/ai/ide/github/description', '此代理通过 GitHub MCP 服务器帮助您与 GitHub 仓库、议题、拉取请求及其他 GitHub '
        + '功能交互。'
        + '它可以帮助您管理仓库、创建议题、处理拉取请求以及执行各种 GitHub 操作。');

    override iconClass: string = 'codicon codicon-github';
    protected override systemPromptId: string = 'github-system';
    override prompts = [{ id: 'github-system', defaultVariant: githubTemplate, variants: [] }];

    /**
     * Override invoke to check if the GitHub MCP server is configured and running,
     * and if not, offer to configure or start it.
     */
    override async invoke(request: MutableChatRequestModel): Promise<void> {
        try {
            if (await this.requiresConfiguration()) {
                // Ask the user if they want to configure the GitHub server
                request.response.response.addContent(new QuestionResponseContentImpl(nls.localize('theia/ai/ide/github/configureGitHubServer/question',
                    'GitHub MCP 服务器尚未配置。要现在配置它吗？'
                    + '这将打开 settings.json 文件，您可以在其中添加 GitHub 访问令牌。'),
                    [
                        { text: nls.localize('theia/ai/ide/github/configureGitHubServer/yes', '是，配置 GitHub 服务器'), value: 'configure' },
                        { text: nls.localize('theia/ai/ide/github/configureGitHubServer/no', '否，取消'), value: 'cancel' }
                    ],
                    request,
                    async selectedOption => {
                        request.response.stopWaitingForInput();
                        if (selectedOption.value === 'configure') {
                            await this.offerConfiguration();
                            request.response.response.addContent(new MarkdownChatResponseContentImpl(nls.localize('theia/ai/ide/github/configureGitHubServer/followup',
                                '设置文件已打开。请在 GitHub 服务器配置的 `serverAuthToken` 属性中添加您的 GitHub 个人访问令牌，然后'
                                + ' 保存并重试。\n\n' +
                                '您可以在以下位置创建个人访问令牌：https://github.com/settings/tokens'
                            )));
                            request.response.complete();
                        } else {
                            request.response.response.addContent(new MarkdownChatResponseContentImpl(nls.localize('theia/ai/ide/github/configureGitHubServer/canceled',
                                'GitHub 服务器配置已取消。请配置 GitHub MCP 服务器以使用此代理。')));
                            request.response.complete();
                        }
                    }
                ));
                request.response.waitForInput();
                return;
            }

            if (await this.requiresStartingServer()) {
                // Ask the user if they want to start the server
                request.response.response.addContent(new QuestionResponseContentImpl(nls.localize('theia/ai/ide/github/startGitHubServer/question',
                    'GitHub MCP 服务器已配置但未运行。要现在启动它吗？'),
                    [
                        { text: nls.localize('theia/ai/ide/github/startGitHubServer/yes', '是，启动服务器'), value: 'yes' },
                        { text: nls.localize('theia/ai/ide/github/startGitHubServer/no', '否，取消'), value: 'no' }
                    ],
                    request,
                    async selectedOption => {
                        request.response.stopWaitingForInput();
                        if (selectedOption.value === 'yes') {
                            const progress = request.response.addProgressMessage({
                                content: nls.localize('theia/ai/ide/github/startGitHubServer/progress', '正在启动 GitHub MCP 服务器。'),
                                show: 'whileIncomplete'
                            });
                            try {
                                await this.startServer();
                                request.response.updateProgressMessage({ ...progress, show: 'whileIncomplete', status: 'completed' });
                                await super.invoke(request);
                            } catch (error) {
                                request.response.response.addContent(new ErrorChatResponseContentImpl(
                                    new Error(nls.localize('theia/ai/ide/github/startGitHubServer/error', '启动 GitHub MCP 服务器失败：{0}',
                                        error instanceof Error ? error.message : String(error)))
                                ));
                                request.response.complete();
                            }
                        } else {
                            request.response.response.addContent(new MarkdownChatResponseContentImpl(nls.localize('theia/ai/ide/github/startGitHubServer/canceled',
                                '请启动 GitHub MCP 服务器以使用此代理。')));
                            request.response.complete();
                        }
                    }
                ));
                request.response.waitForInput();
                return;
            }

            // If already configured and running, continue as normal
            await super.invoke(request);
        } catch (error) {
            request.response.response.addContent(new ErrorChatResponseContentImpl(
                new Error(nls.localize('theia/ai/ide/github/errorCheckingGitHubServerStatus', '检查 GitHub MCP 服务器状态时出错：{0}',
                    error instanceof Error ? error.message : String(error)))
            ));
            request.response.complete();
        }
    }

    protected async requiresConfiguration(): Promise<boolean> {
        const serverConfigured = await this.mcpService.hasServer(REQUIRED_GITHUB_MCP_SERVERS[0].name);
        return !serverConfigured;
    }

    protected async requiresStartingServer(): Promise<boolean> {
        const serverStarted = await this.mcpService.isServerStarted(REQUIRED_GITHUB_MCP_SERVERS[0].name);
        return !serverStarted;
    }

    protected async startServer(): Promise<void> {
        await this.ensureServerStarted(REQUIRED_GITHUB_MCP_SERVERS[0]);
    }

    protected async offerConfiguration(): Promise<void> {
        const currentServers = this.preferenceService.get<Record<string, MCPServerDescription>>(MCP_SERVERS_PREF, {});
        const githubServer = REQUIRED_GITHUB_MCP_SERVERS[0];

        const { name, ...serverWithoutName } = githubServer;
        await this.preferenceService.set(MCP_SERVERS_PREF, {
            ...currentServers,
            [name]: serverWithoutName
        }, PreferenceScope.User);

        await this.openAndFocusOnGitHubConfig(name);
    }

    /**
     * Opens the user preferences JSON file and attempts to focus on the GitHub server configuration.
     */
    protected async openAndFocusOnGitHubConfig(serverName: string): Promise<void> {
        try {
            const configUri = this.preferenceService.getConfigUri(PreferenceScope.User);
            if (!configUri) {
                this.logger.debug('Could not get config URI for user preferences');
                return;
            }

            if (!await this.fileService.exists(configUri)) {
                await this.fileService.create(configUri);
            }

            const content = await this.fileService.read(configUri);
            const text = content.value;

            const preferencePattern = `"${MCP_SERVERS_PREF}"`;
            const preferenceMatch = text.indexOf(preferencePattern);

            let selection: { start: { line: number; character: number } } | undefined;

            if (preferenceMatch !== -1) {
                const serverPattern = `"${serverName}"`;
                const serverMatch = text.indexOf(serverPattern, preferenceMatch);

                if (serverMatch !== -1) {
                    const lines = text.substring(0, serverMatch).split('\n');
                    const line = lines.length - 1;
                    const character = lines[lines.length - 1].length;

                    selection = {
                        start: { line, character }
                    };
                }
            }

            await this.editorManager.open(configUri, {
                selection
            });
        } catch (error) {
            this.logger.debug('Failed to open and focus on GitHub configuration:', error);
            // Fallback to just opening the preferences file
            await this.commandService.executeCommand(PreferencesCommands.OPEN_USER_PREFERENCES_JSON.id);
        }
    }

    /**
     * Starts the GitHub MCP server if it doesn't exist or isn't running.
     *
     * @returns A promise that resolves when the server is started
     */
    async ensureServerStarted(server: MCPServerDescription): Promise<void> {
        try {
            if (!(await this.mcpService.hasServer(server.name))) {
                const currentServers = this.preferenceService.get<Record<string, MCPServerDescription>>(MCP_SERVERS_PREF, {});
                const { name, ...serverWithoutName } = server;
                await this.preferenceService.set(MCP_SERVERS_PREF, { ...currentServers, [name]: serverWithoutName }, PreferenceScope.User);
                await this.mcpService.addOrUpdateServer(server);
            }

            if (!(await this.mcpService.isServerStarted(server.name))) {
                await this.mcpService.startServer(server.name);
            }
        } catch (error) {
            this.logger.error(`Error starting GitHub MCP server ${server.name}: ${error}`);
            throw error;
        }
    }
}
