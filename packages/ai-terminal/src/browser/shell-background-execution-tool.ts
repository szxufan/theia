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
import {
    SHELL_EXECUTE_BACKGROUND_FUNCTION_ID,
    OutputReadOptions
} from '../common/shell-execution-server';

interface ShellBackgroundArgs extends Partial<OutputReadOptions> {
    action: 'start' | 'status' | 'read' | 'stop';
    command?: string;
    description?: string;
    cwd?: string;
    taskId?: string;
    fromOffset?: number;
}

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
            confirmAlwaysAllow: '此工具在主机系统上启动后台进程，拥有完整的系统访问权限。',
            description: `将 shell 命令作为受管理的后台任务运行，并增量读取其输出。
当命令运行时间长或持续运行时（构建、监视模式、开发服务器、耗时数分钟的测试套件），请用此工具代替 shellExecute。

动作：
- start：在后台启动 \`command\`；立即返回 taskId。\`cwd\` 的用法与 shellExecute 相同。
- status：报告任务是否仍在运行、退出码及耗时。
- read：返回输出，有两种模式（见下）。
- stop：终止任务的进程树。不再需要的任务请务必停止。

读取模式：
- 增量轮询：传入 \`fromOffset\`（从 0 开始）；响应中包含下一个偏移量和 \`eof\`。
  这是跟踪实时输出的低成本方式。每隔几秒轮询一次，不要紧密循环。
- 按行选取：传入 filter/head/tail/fromLine/toLine/maxLines/stream 中的任意项，对目前已累积的全部输出切片——
  filter 用正则保留匹配行并保留原始行号，head/tail 取前/后 N 行，fromLine/toLine 定位原始的从 1 开始的行号，
  maxLines 限制响应行数（默认 200，最大 2000；hasMore + fromLine = endLine + 1 翻页）。任务结束后 \`eof\` 为 true。

保持启动的命令简单：不要仅为整形或限制输出而通过 grep/head/tail/wc/sed 管道过滤；
请改用原生的读取选项。仅当超过每个流 1MB 的上限时，才需要在命令侧过滤。

启动命令需要用户批准，遵循与 shellExecute 相同的允许/拒绝模式。`,
            parameters: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['start', 'status', 'read', 'stop'],
                        description: '要对后台任务执行的操作。'
                    },
                    command: {
                        type: 'string',
                        description: '要运行的 shell 命令（仅动作 "start"）。请在 `description` 中描述它。' +
                            '不要加入整形输出的过滤器；请用读取选项查看输出。'
                    },
                    description: {
                        type: 'string',
                        description: '命令的作用，使用主动语态（仅动作 "start"），便于用户核对。'
                    },
                    cwd: {
                        type: 'string',
                        description: '命令的工作目录（仅动作 "start"）：工作区相对路径或绝对路径。'
                    },
                    taskId: {
                        type: 'string',
                        description: 'start 返回的任务句柄（动作 "status"、"read"、"stop"）。'
                    },
                    fromOffset: {
                        type: 'number',
                        description: '读取输出的起始字符偏移（动作 "read"，增量模式）；使用上次读取返回的偏移，首次传 0。'
                    },
                    filter: {
                        type: 'string',
                        description: '正则表达式，只保留匹配的行并保留原始行号（动作 "read"，按行模式）。'
                    },
                    stream: {
                        type: 'string',
                        enum: ['combined', 'stdout', 'stderr'],
                        description: '要读取的流（动作 "read"，按行模式）。默认 "combined"。'
                    },
                    head: {
                        type: 'number',
                        description: '过滤后视图的前 N 行（动作 "read"，按行模式）。'
                    },
                    tail: {
                        type: 'number',
                        description: '过滤后视图的后 N 行（动作 "read"，按行模式）。'
                    },
                    fromLine: {
                        type: 'number',
                        description: '基于原始行号的、从 1 开始的闭区间行范围的起始行（动作 "read"，按行模式）。'
                    },
                    toLine: {
                        type: 'number',
                        description: '基于原始行号的、从 1 开始的闭区间行范围的结束行（动作 "read"，按行模式）。'
                    },
                    maxLines: {
                        type: 'number',
                        description: '每次读取返回的最大行数（动作 "read"，按行模式）。默认 200，最大 2000。'
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

    protected async executeAction(args: ShellBackgroundArgs): Promise<object> {
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
                const { filter, stream, head, tail, fromLine, toLine, maxLines } = args;
                const hasLineOptions = filter !== undefined || stream !== undefined || head !== undefined
                    || tail !== undefined || fromLine !== undefined || toLine !== undefined || maxLines !== undefined;
                if (hasLineOptions) {
                    return await this.shellServer.readTaskOutputLines(args.taskId, { filter, stream, head, tail, fromLine, toLine, maxLines });
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
