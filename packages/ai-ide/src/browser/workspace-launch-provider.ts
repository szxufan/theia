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

import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { CancellationToken } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { DebugConfigurationManager } from '@theia/debug/lib/browser/debug-configuration-manager';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import {
    LIST_LAUNCH_CONFIGURATIONS_FUNCTION_ID,
    RUN_LAUNCH_CONFIGURATION_FUNCTION_ID,
    STOP_LAUNCH_CONFIGURATION_FUNCTION_ID
} from '../common/workspace-functions';
import { WorkspaceFunctionScope } from './workspace-functions';

/**
 * Sentinel value returned (and accepted) as `workspaceRoot` for launch
 * configurations defined in the `.code-workspace` file rather than in a
 * specific folder's `.vscode/launch.json`.
 */
const WORKSPACE_SCOPE_TOKEN = '(workspace)';

export interface LaunchConfigurationInfo {
    name: string;
    running: boolean;
    /**
     * Identifies where the configuration is defined:
     * - A root folder name (e.g. `"frontend"`) for folder-scoped configs.
     * - `"(workspace)"` for configs defined in the `.code-workspace` file.
     *
     * Pass this value back to `runLaunchConfiguration`'s or
     * `stopLaunchConfiguration`'s `workspaceRoot` parameter to disambiguate
     * when multiple configurations share the same name.
     */
    workspaceRoot?: string;
}

@injectable()
export class LaunchListProvider implements ToolProvider {

    @inject(DebugConfigurationManager)
    protected readonly debugConfigurationManager: DebugConfigurationManager;

    @inject(DebugSessionManager)
    protected readonly debugSessionManager: DebugSessionManager;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    getTool(): ToolRequest {
        return {
            id: LIST_LAUNCH_CONFIGURATIONS_FUNCTION_ID,
            name: LIST_LAUNCH_CONFIGURATIONS_FUNCTION_ID,
            description: '列出工作区中可用的启动配置。每个结果包含配置名称、当前是否正在运行，' +
                '以及 "workspaceRoot"（标识配置定义的位置）。' +
                '可选择提供过滤子串以按名称缩小结果范围。省略时返回所有配置。' +
                '运行 runLaunchConfiguration 前务必先调用它以获取准确的配置名称。',
            parameters: {
                type: 'object',
                properties: {
                    filter: {
                        type: 'string',
                        description: '应用于启动配置名称的过滤器（空字符串表示获取全部配置）。'
                    }
                },
                required: []
            },
            handler: async (argString: string) => {
                const filterArgs: { filter?: string } = JSON.parse(argString);
                const configurations = await this.getAvailableLaunchConfigurations(filterArgs.filter);
                return JSON.stringify(configurations);
            }
        };
    }

    private async getAvailableLaunchConfigurations(filter: string = ''): Promise<LaunchConfigurationInfo[]> {
        await this.debugConfigurationManager.load();
        const configurations: LaunchConfigurationInfo[] = [];
        for (const options of this.debugConfigurationManager.all) {
            const name = this.getDisplayName(options);
            if (name.toLowerCase().includes(filter.toLowerCase())) {
                const folderToken = this.resolveFolderToken(options.workspaceFolderUri);
                const entry: LaunchConfigurationInfo = {
                    name,
                    running: this.debugSessionManager.sessions.some(
                        session => session.configuration.name === name
                            && this.resolveFolderToken(session.options.workspaceFolderUri) === folderToken
                    ),
                    workspaceRoot: folderToken
                };
                configurations.push(entry);
            }
        }

        return configurations;
    }

    /**
     * Maps a `workspaceFolderUri` to the addressing token an agent should use.
     *
     * - Folder URI → the workspace root name (e.g. `"frontend"`).
     * - `undefined` (workspace-level config) → `"(workspace)"`.
     */
    private resolveFolderToken(workspaceFolderUri: string | undefined): string {
        if (!workspaceFolderUri) {
            return WORKSPACE_SCOPE_TOKEN;
        }
        try {
            const uri = new URI(workspaceFolderUri);
            return this.workspaceScope.getRootName(uri) ?? WORKSPACE_SCOPE_TOKEN;
        } catch {
            return WORKSPACE_SCOPE_TOKEN;
        }
    }

    private getDisplayName(options: DebugSessionOptions): string {
        if (DebugSessionOptions.isConfiguration(options)) {
            return options.configuration.name;
        } else if (DebugSessionOptions.isCompound(options)) {
            return options.compound.name;
        }
        return 'Unnamed Configuration';
    }
}

@injectable()
export class LaunchRunnerProvider implements ToolProvider {

    @inject(DebugConfigurationManager)
    protected readonly debugConfigurationManager: DebugConfigurationManager;

    @inject(DebugSessionManager)
    protected readonly debugSessionManager: DebugSessionManager;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    getTool(): ToolRequest {
        return {
            id: RUN_LAUNCH_CONFIGURATION_FUNCTION_ID,
            name: RUN_LAUNCH_CONFIGURATION_FUNCTION_ID,
            description: '启动一个启动配置并立即返回——应用程序会在后台继续运行。' +
                '先用 listLaunchConfigurations 发现可用的配置名称并检查是否已在运行。' +
                '如果多个配置同名，请指定 workspaceRoot 参数加以区分。' +
                '成功时响应中包含调试会话 ID。如果配置名称与任何可用配置都不匹配，则返回错误。',
            parameters: {
                type: 'object',
                properties: {
                    configurationName: {
                        type: 'string',
                        description: '要启动的启动配置的确切名称，与 listLaunchConfigurations 返回的一致。'
                    },
                    workspaceRoot: {
                        type: 'string',
                        description: 'listLaunchConfigurations 返回的 workspaceRoot 值。' +
                            '当多个配置同名时必填。'
                    }
                },
                required: ['configurationName']
            },
            handler: async (argString: string, ctx?: ToolInvocationContext) => this.handleRunLaunchConfiguration(argString, ctx?.cancellationToken)
        };
    }

    private async handleRunLaunchConfiguration(argString: string, cancellationToken?: CancellationToken): Promise<string> {
        try {
            const args: { configurationName: string; workspaceRoot?: string } = JSON.parse(argString);

            await this.debugConfigurationManager.load();

            const allMatches = this.findAllConfigurationsByName(args.configurationName);

            if (allMatches.length === 0) {
                return `Did not find a launch configuration for the name: '${args.configurationName}'`;
            }

            let options: DebugSessionOptions;

            if (allMatches.length === 1) {
                options = allMatches[0];
            } else if (args.workspaceRoot) {
                const filtered = this.filterByWorkspaceRoot(allMatches, args.workspaceRoot);
                if (typeof filtered === 'string') {
                    return filtered; // error message
                }
                if (filtered.length === 0) {
                    return `No launch configuration '${args.configurationName}' found in workspace root '${args.workspaceRoot}'. `
                        + 'The configuration may be defined in a different root. Use listLaunchConfigurations to check.';
                }
                options = filtered[0];
            } else {
                const scopeTokens = allMatches.map(opt => this.resolveFolderToken(opt.workspaceFolderUri));
                return `Ambiguous launch configuration name '${args.configurationName}' — found in multiple scopes: ${scopeTokens.join(', ')}. `
                    + 'Please specify the workspaceRoot parameter to disambiguate.';
            }

            const session = await this.debugSessionManager.start(options);

            if (!session) {
                return `Failed to start launch configuration '${args.configurationName}'`;
            }

            if (cancellationToken && typeof session !== 'boolean') {
                cancellationToken.onCancellationRequested(() => {
                    this.debugSessionManager.terminateSession(session);
                });
            }

            const sessionInfo = typeof session === 'boolean'
                ? `Compound launch configuration '${args.configurationName}' started successfully`
                : `Launch configuration '${args.configurationName}' started with session ID: ${session.id}`;

            return sessionInfo;

        } catch (error) {
            return JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to run launch configuration'
            });
        }
    }

    private findAllConfigurationsByName(name: string): DebugSessionOptions[] {
        const results: DebugSessionOptions[] = [];
        for (const options of this.debugConfigurationManager.all) {
            const displayName = this.getDisplayName(options);
            if (displayName === name) {
                results.push(options);
            }
        }
        return results;
    }

    /**
     * Filters debug session options by the `workspaceRoot` addressing token the
     * agent provided.
     *
     * Handles the sentinel value `(workspace)` for configs without a folder URI,
     * as well as normal folder-root names.
     *
     * @returns the filtered options array, or an error string if the root is unknown.
     */
    private filterByWorkspaceRoot(options: DebugSessionOptions[], workspaceRoot: string): DebugSessionOptions[] | string {
        if (workspaceRoot === WORKSPACE_SCOPE_TOKEN) {
            return options.filter(opt => !opt.workspaceFolderUri);
        }
        const rootMapping = this.workspaceScope.getRootMapping();
        const rootUri = rootMapping.get(workspaceRoot);
        if (!rootUri) {
            const availableRoots = Array.from(rootMapping.keys()).join(', ');
            return `Unknown workspace root '${workspaceRoot}'. Available roots: ${availableRoots}`;
        }
        const rootUriStr = rootUri.toString();
        return options.filter(opt => opt.workspaceFolderUri === rootUriStr);
    }

    /**
     * Maps a `workspaceFolderUri` to the addressing token an agent should use.
     * Shared between run and list operations in this class.
     */
    private resolveFolderToken(workspaceFolderUri: string | undefined): string {
        if (!workspaceFolderUri) {
            return WORKSPACE_SCOPE_TOKEN;
        }
        try {
            const uri = new URI(workspaceFolderUri);
            return this.workspaceScope.getRootName(uri) ?? WORKSPACE_SCOPE_TOKEN;
        } catch {
            return WORKSPACE_SCOPE_TOKEN;
        }
    }

    private getDisplayName(options: DebugSessionOptions): string {
        if (DebugSessionOptions.isConfiguration(options)) {
            return options.configuration.name;
        } else if (DebugSessionOptions.isCompound(options)) {
            return options.compound.name;
        }
        return 'Unnamed Configuration';
    }
}

@injectable()
export class LaunchStopProvider implements ToolProvider {

    @inject(DebugSessionManager)
    protected readonly debugSessionManager: DebugSessionManager;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    getTool(): ToolRequest {
        return {
            id: STOP_LAUNCH_CONFIGURATION_FUNCTION_ID,
            name: STOP_LAUNCH_CONFIGURATION_FUNCTION_ID,
            description: '停止活动的启动配置或调试会话。如果提供了配置名称，停止匹配该名称的会话。' +
                '未提供名称时，停止当前活动的会话。' +
                '如果多个会话共用同一配置名称，请指定 workspaceRoot 参数加以区分。' +
                '找不到匹配的活动会话时返回错误。',
            parameters: {
                type: 'object',
                properties: {
                    configurationName: {
                        type: 'string',
                        description: '要停止的启动配置名称。省略时停止当前活动的调试会话。'
                    },
                    workspaceRoot: {
                        type: 'string',
                        description: 'listLaunchConfigurations 返回的 workspaceRoot 值。' +
                            '当多个会话共用同一配置名称时必填。'
                    }
                },
                required: []
            },
            handler: async (argString: string) => this.handleStopLaunchConfiguration(argString)
        };
    }

    private async handleStopLaunchConfiguration(argString: string): Promise<string> {
        try {
            const args: { configurationName?: string; workspaceRoot?: string } = JSON.parse(argString);

            if (args.configurationName) {
                const matchingSessions = this.findSessionsByConfigurationName(args.configurationName);

                if (matchingSessions.length === 0) {
                    return `No active session found for launch configuration: '${args.configurationName}'`;
                }

                let session: DebugSession;

                if (matchingSessions.length === 1) {
                    session = matchingSessions[0];
                } else if (args.workspaceRoot) {
                    const filtered = this.filterSessionsByWorkspaceRoot(matchingSessions, args.workspaceRoot);
                    if (typeof filtered === 'string') {
                        return filtered; // error message
                    }
                    if (filtered.length === 0) {
                        return `No active session for '${args.configurationName}' in workspace root '${args.workspaceRoot}'.`;
                    }
                    session = filtered[0];
                } else {
                    const scopeTokens = matchingSessions.map(s => this.resolveSessionFolderToken(s));
                    return `Ambiguous: multiple active sessions for '${args.configurationName}' in scopes: ${scopeTokens.join(', ')}. `
                        + 'Please specify the workspaceRoot parameter to disambiguate.';
                }

                await this.debugSessionManager.terminateSession(session);
                return `Successfully stopped launch configuration: '${args.configurationName}'`;
            } else {
                // Stop current active session
                const currentSession = this.debugSessionManager.currentSession;
                if (!currentSession) {
                    return 'No active debug session to stop';
                }

                await this.debugSessionManager.terminateSession(currentSession);
                return `Successfully stopped current debug session: '${currentSession.configuration.name}'`;
            }

        } catch (error) {
            return JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to stop launch configuration'
            });
        }
    }

    private findSessionsByConfigurationName(configurationName: string): DebugSession[] {
        return this.debugSessionManager.sessions.filter(
            session => session.configuration.name === configurationName
        );
    }

    /**
     * Filters debug sessions by the `workspaceRoot` addressing token the agent provided.
     */
    private filterSessionsByWorkspaceRoot(sessions: DebugSession[], workspaceRoot: string): DebugSession[] | string {
        if (workspaceRoot === WORKSPACE_SCOPE_TOKEN) {
            return sessions.filter(s => !s.options.workspaceFolderUri);
        }
        const rootMapping = this.workspaceScope.getRootMapping();
        const rootUri = rootMapping.get(workspaceRoot);
        if (!rootUri) {
            const availableRoots = Array.from(rootMapping.keys()).join(', ');
            return `Unknown workspace root '${workspaceRoot}'. Available roots: ${availableRoots}`;
        }
        const rootUriStr = rootUri.toString();
        return sessions.filter(s => s.options.workspaceFolderUri === rootUriStr);
    }

    /**
     * Resolves the addressing token for a debug session based on its folder URI.
     */
    private resolveSessionFolderToken(session: DebugSession): string {
        if (!session.options.workspaceFolderUri) {
            return WORKSPACE_SCOPE_TOKEN;
        }
        try {
            const uri = new URI(session.options.workspaceFolderUri);
            return this.workspaceScope.getRootName(uri) ?? WORKSPACE_SCOPE_TOKEN;
        } catch {
            return WORKSPACE_SCOPE_TOKEN;
        }
    }
}
