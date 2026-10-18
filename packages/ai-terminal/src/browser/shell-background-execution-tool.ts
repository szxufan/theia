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

import { inject, injectable } from '@theia/core/shared/inversify';
import { AutoActionResult, ToolRequest } from '@theia/ai-core';
import { ShellCommandPermissionService } from './shell-command-permission-service';
import { AbstractShellExecutionTool, resolveShellCwd } from './abstract-shell-execution-tool';
import { SHELL_EXECUTE_BACKGROUND_FUNCTION_ID } from '../common/shell-execution-server';

/**
 * Parameterized tool for shell work that outlives a single tool call: long builds, watch modes,
 * dev servers. One `start` returns a task id immediately; the model polls incremental output
 * with `read` and terminates the process with `stop`. The same confirmation rules as
 * `shellExecute` apply to starting a command.
 */
@injectable()
export class ShellBackgroundExecutionTool extends AbstractShellExecutionTool {

    @inject(ShellCommandPermissionService)
    protected readonly shellCommandPermissionService: ShellCommandPermissionService;

    getTool(): ToolRequest {
        return {
            id: SHELL_EXECUTE_BACKGROUND_FUNCTION_ID,
            name: SHELL_EXECUTE_BACKGROUND_FUNCTION_ID,
            providerName: 'ai-terminal',
            confirmAlwaysAllow: 'This tool starts background processes on the host system with full system access.',
            description: `Run a shell command as a managed background task and read its output incrementally.
Use this instead of shellExecute whenever the command runs long or keeps running (builds, watch modes, dev servers, test suites that take minutes).

Actions:
- start: launch \`command\` in the background; returns a taskId at once. \`cwd\` works like in shellExecute.
- status: report whether the task is still running, its exit code, and timing.
- read: return the output written since the offset you pass (start at 0); the response contains the next offset and \`eof\`. Poll every few seconds rather than in a tight loop.
- stop: terminate the task's process tree. Always stop tasks you no longer need.

Starting a command requires user approval, subject to the same allow/deny patterns as shellExecute.`,
            parameters: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['start', 'status', 'read', 'stop'],
                        description: 'The operation to perform on a background task.'
                    },
                    command: {
                        type: 'string',
                        description: 'The shell command to run (action "start" only). Describe it in `description`.'
                    },
                    description: {
                        type: 'string',
                        description: 'What the command does, in active voice (action "start" only), so the user can verify it.'
                    },
                    cwd: {
                        type: 'string',
                        description: 'Working directory for the command (action "start" only): workspace-relative or absolute.'
                    },
                    taskId: {
                        type: 'string',
                        description: 'The task handle returned by start (actions "status", "read", "stop").'
                    },
                    fromOffset: {
                        type: 'number',
                        description: 'Character offset to read output from (action "read"); use the offset of the previous read, 0 for the first.'
                    }
                },
                required: ['action']
            },
            handler: (argString: string) => this.executeAction(JSON.parse(argString)),
            checkAutoAction: (argString: string): AutoActionResult | undefined => {
                try {
                    const args = JSON.parse(argString);
                    if (args.action !== 'start') {
                        // Managing an already-approved task does not start anything new.
                        return { action: 'allow' };
                    }
                    const result = this.shellCommandPermissionService.checkCommand(args.command);
                    if (result.reason === 'denied') {
                        return {
                            action: 'deny',
                            reason: `Command denied because it matched deny pattern: ${result.matchedPattern}`
                        };
                    }
                    if (result.allowed) {
                        return { action: 'allow' };
                    }
                    return undefined; // Show confirmation UI
                } catch {
                    return undefined; // Show confirmation UI
                }
            },
            getArgumentsShortLabel: (args: string): { label: string; hasMore: boolean } | undefined => {
                try {
                    const parsed = JSON.parse(args);
                    if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                        const label = parsed.action === 'start'
                            ? `start: ${String(parsed.command ?? '')}`
                            : `${parsed.action}: ${String(parsed.taskId ?? '')}`;
                        return { label, hasMore: true };
                    }
                } catch {
                    // fall through
                }
                return undefined;
            }
        };
    }

    protected async executeAction(args: {
        action: 'start' | 'status' | 'read' | 'stop';
        command?: string;
        cwd?: string;
        taskId?: string;
        fromOffset?: number;
    }): Promise<object> {
        switch (args.action) {
            case 'start': {
                if (!args.command) {
                    return { error: 'action "start" requires a command.' };
                }
                const { taskId } = await this.shellServer.start({
                    command: args.command,
                    cwd: args.cwd !== undefined ? resolveShellCwd(this.workspaceService, args.cwd) : undefined
                });
                return { taskId, hint: 'Poll with action "read" using fromOffset 0; call "stop" when done.' };
            }
            case 'status': {
                if (!args.taskId) {
                    return { error: 'action "status" requires a taskId.' };
                }
                const status = await this.shellServer.getStatus(args.taskId);
                return status ?? { error: `No task with id '${args.taskId}'.` };
            }
            case 'read': {
                if (!args.taskId) {
                    return { error: 'action "read" requires a taskId.' };
                }
                return await this.shellServer.readOutput(args.taskId, args.fromOffset ?? 0);
            }
            case 'stop': {
                if (!args.taskId) {
                    return { error: 'action "stop" requires a taskId.' };
                }
                const stopped = await this.shellServer.stop(args.taskId);
                return stopped
                    ? { stopped: true }
                    : { stopped: false, note: 'The task was not running (unknown id or already finished).' };
            }
            default:
                return { error: `Unknown action '${(args as { action?: string }).action}'.` };
        }
    }
}
