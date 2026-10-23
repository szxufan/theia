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

import { injectable, inject } from '@theia/core/shared/inversify';
import { ToolRequest, AutoActionResult } from '@theia/ai-core';
import { ShellCommandPermissionService } from './shell-command-permission-service';
import { AbstractShellExecutionTool, resolveShellCwd } from './abstract-shell-execution-tool';
import {
    SHELL_EXECUTION_FUNCTION_ID,
    OutputReadOptions,
    ShellExecutionToolResult,
    ShellExecutionCanceledResult,
    ShellOutputReadError,
    ShellOutputReadResult
} from '../common/shell-execution-server';

interface ShellExecuteArgs extends Partial<OutputReadOptions> {
    action?: 'execute' | 'read';
    command?: string;
    description?: string;
    cwd?: string;
    timeout?: number;
    resultId?: string;
}

/**
 * Parameterized tool for running a one-shot shell command ("execute") and re-reading portions of
 * a previous execution's retained output ("read"). Execute is blocking and subject to the
 * allow/deny pattern confirmation; read only reads buffered output and is auto-approved.
 */
@injectable()
export class ShellExecutionTool extends AbstractShellExecutionTool {

    @inject(ShellCommandPermissionService)
    protected readonly shellCommandPermissionService: ShellCommandPermissionService;

    getTool(): ToolRequest {
        return {
            id: SHELL_EXECUTION_FUNCTION_ID,
            name: SHELL_EXECUTION_FUNCTION_ID,
            providerName: 'ai-terminal',
            confirmAlwaysAllow: '此工具拥有完整的系统访问权限，可执行任意命令、' +
                '修改工作区之外的文件并访问网络资源。',
            description: `在主机系统上执行 shell 命令并读取其输出，通过两个动作完成。

动作 "execute" 在 shell（Linux/macOS 上为 bash，Windows 上为 cmd/PowerShell）中运行 \`command\`，
返回截断的预览和一个 \`resultId\`。适用于构建/测试/git 命令、批量操作、系统诊断、
安装依赖以及运行脚本（bash、python、node 等）。

动作 "read" 使用先前执行的 \`resultId\` 重新读取其输出的任意部分——不会重新执行，读取可重复且支持分页。

保持命令简单：不要仅为整形或限制输出而通过 grep/head/tail/wc/sed 管道过滤。
直接运行原始命令，再用工具原生的读取选项查看结果：
- filter：正则表达式；只保留匹配行，保留原始行号（类似 grep -n）
- head / tail：过滤后视图的前 / 后 N 行（二选一）
- fromLine / toLine：基于原始行号的、从 1 开始的闭区间范围；达到 maxLines 上限后，
  用 fromLine = endLine + 1 继续
- maxLines：每次读取的最大行数（默认 200，最大 2000）；hasMore 表示还有剩余内容
- stream："combined"（默认）、"stdout" 或 "stderr"
仅当输出超过每个流 1MB 的保留上限时，才需要在命令侧过滤。

execute 的预览保留前 50 行和后 50 行；当 \`truncated\` 为 true 时，请改用 "read"
（使用返回的 \`resultId\`）继续查看，而不是换参数重新运行命令。

用户交互：
- "execute" 需要用户批准——用户会看到确切的命令，可以批准或拒绝、在运行期间取消，
  或配置“始终允许”
- "read" 自动批准；它不执行任何内容

不要用此工具运行长期存续或无止境的进程（服务器、监视器）；请改用 shellExecuteBackground。
超时（仅 execute）：默认 2 分钟，最大 10 分钟。`,
            parameters: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['execute', 'read'],
                        description: '"execute" 运行 shell 命令；"read" 读取先前执行输出的部分内容。' +
                            '给出 command 时默认为 "execute"，给出 resultId 时默认为 "read"。'
                    },
                    command: {
                        type: 'string',
                        description: '要执行的 shell 命令（动作 "execute"）。可包含管道、重定向及其他 shell 特性，' +
                            '但不要加入整形输出的过滤器（grep/head/tail/wc）；请改用 read 动作。'
                    },
                    description: {
                        type: 'string',
                        description: '用主动语态描述这条命令实际做什么（动作 "execute"），' +
                            '让用户无需自己解析标志或 shell 语法即可核对命令是否符合其意图。' +
                            '不要使用“复杂”或“风险”之类的词语。\n\n' +
                            '体现命令的实际机制：重要的标志、过滤器、管道和输出限制。' +
                            '当选用了不直观的工具或标志时（例如用 `find` 而非 `ls`、`-type f`、`head`、' +
                            '`sort`），要说明其作用，而不仅是高层目标。\n\n' +
                            '对于简单命令（git、npm、标准 CLI 工具），保持简短（5-10 个词）：\n' +
                            '- cat README.md -> "打印 README 文件内容"\n' +
                            '- git diff HEAD~1 -> "显示上一次提交的更改"\n' +
                            '- npm test -> "运行项目测试套件"\n\n' +
                            '对于较长的或带管道的命令，补充足够的上下文以说明意图和行为：\n' +
                            '- grep -rn "TODO" src/ --include="*.ts" -> "在 src 的 TypeScript 文件中搜索 TODO 注释"\n' +
                            '- git log --oneline --since="1 week" | wc -l -> "统计过去一周的提交数"\n' +
                            '- du -sh node_modules/* | sort -rh | head -5 -> "按大小显示 node_modules 中最大的 5 个包"\n' +
                            '- find . -type f | head -100 -> "递归列出当前目录下（不含目录）最多前 100 个文件"\n\n' +
                            '避免只陈述意图而隐藏机制的描述（例如对 `find . -type f | head -100` ' +
                            '写“列出工作区中的所有文件”过于含糊——遗漏了递归、仅文件的过滤器和 100 条的上限）。'
                    },
                    cwd: {
                        type: 'string',
                        description: '命令执行的工作目录（动作 "execute"）。' +
                            '使用工作区相对路径（如 "backend"、"frontend/src"）' +
                            '或绝对文件系统路径。' +
                            '省略时默认为工作区根目录（仅限单根工作区）。'
                    },
                    timeout: {
                        type: 'number',
                        description: '超时时间（毫秒）（动作 "execute"）。默认 120000（2 分钟），最大 600000（10 分钟）。'
                    },
                    resultId: {
                        type: 'string',
                        description: '先前 "execute" 返回的结果句柄（动作 "read"）。'
                    },
                    filter: {
                        type: 'string',
                        description: '正则表达式，只保留匹配的行并保留原始行号（动作 "read"）。'
                    },
                    stream: {
                        type: 'string',
                        enum: ['combined', 'stdout', 'stderr'],
                        description: '要读取的流（动作 "read"）。默认 "combined"。'
                    },
                    head: {
                        type: 'number',
                        description: '过滤后视图的前 N 行（动作 "read"）。'
                    },
                    tail: {
                        type: 'number',
                        description: '过滤后视图的后 N 行（动作 "read"）。'
                    },
                    fromLine: {
                        type: 'number',
                        description: '基于原始行号的、从 1 开始的闭区间行范围的起始行（动作 "read"）。'
                    },
                    toLine: {
                        type: 'number',
                        description: '基于原始行号的、从 1 开始的闭区间行范围的结束行（动作 "read"）。'
                    },
                    maxLines: {
                        type: 'number',
                        description: '每次读取返回的最大行数（动作 "read"）。默认 200，最大 2000。'
                    }
                },
                required: ['action']
            },
            handler: (argString: string, ctx?: unknown) => this.executeAction(JSON.parse(argString), ctx),
            checkAutoAction: (argString: string): AutoActionResult | undefined => {
                try {
                    const args = JSON.parse(argString) as ShellExecuteArgs;
                    if (this.resolveAction(args) === 'read') {
                        // Reading buffered output starts nothing new.
                        return { action: 'allow' };
                    }
                    const result = this.shellCommandPermissionService.checkCommand(args.command ?? '');

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
                    const parsed = JSON.parse(args) as ShellExecuteArgs;
                    if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                        if (this.resolveAction(parsed) === 'read') {
                            const options = ['filter', 'head', 'tail', 'fromLine', 'toLine']
                                .filter(key => parsed[key as keyof ShellExecuteArgs] !== undefined);
                            return {
                                label: `read: ${String(parsed.resultId ?? '')}${options.length > 0 ? ` (${options.join(', ')})` : ''}`,
                                hasMore: true
                            };
                        }
                        return { label: `execute: ${String(parsed.command ?? '')}`, hasMore: true };
                    }
                } catch {
                    // fall through
                }
                return undefined;
            }
        };
    }

    /** Infers the action when the model omits it: a resultId means read, anything else execute. */
    protected resolveAction(args: ShellExecuteArgs): 'execute' | 'read' {
        if (args.action) {
            return args.action;
        }
        return args.resultId !== undefined ? 'read' : 'execute';
    }

    protected async executeAction(
        args: ShellExecuteArgs,
        ctx?: unknown
    ): Promise<ShellExecutionToolResult | ShellExecutionCanceledResult | ShellOutputReadResult | ShellOutputReadError> {
        if (this.resolveAction(args) === 'read') {
            if (!args.resultId) {
                return { error: 'action "read" requires a resultId.' };
            }
            const { filter, stream, head, tail, fromLine, toLine, maxLines } = args;
            return this.shellServer.readResult(args.resultId, { filter, stream, head, tail, fromLine, toLine, maxLines });
        }

        if (!args.command) {
            return { error: 'action "execute" requires a command.' };
        }
        const result = await this.runShellCommand({
            command: args.command,
            cwd: resolveShellCwd(this.workspaceService, args.cwd),
            timeout: args.timeout,
            ctx
        });
        if (!ShellExecutionCanceledResult.is(result) && result.truncated) {
            result.hint = `Preview truncated (${result.totalLines} lines total). Use action "read" with resultId ` +
                `'${result.resultId}' and filter/head/tail/fromLine/toLine/maxLines to inspect the full output.`;
        }
        return result;
    }

}
