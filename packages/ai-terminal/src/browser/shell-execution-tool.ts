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
            confirmAlwaysAllow: 'This tool has full system access and can execute any command, ' +
                'modify files outside the workspace, and access network resources.',
            description: `Execute a shell command on the host system and read its output, via two actions.

Action "execute" runs \`command\` in a shell (bash on Linux/macOS, cmd/PowerShell on Windows) and returns
a truncated preview plus a \`resultId\`. Use it for build/test/git commands, bulk operations, system
diagnostics, installing dependencies, and running scripts (bash, python, node, etc.).

Action "read" re-reads any portion of a previous execution's output using its \`resultId\` — no
re-execution, reads are repeatable and paginated.

KEEP COMMANDS SIMPLE: do NOT pipe through grep/head/tail/wc/sed merely to shape or limit output.
Run the plain command, then use the tool's native read options to inspect it:
- filter: regex; keeps only matching lines, preserving original line numbers (grep -n style)
- head / tail: first / last N lines of the filtered view (pick one)
- fromLine / toLine: 1-based inclusive range on original line numbers; after a maxLines cutoff,
  continue with fromLine = endLine + 1
- maxLines: caps lines per read (default 200, max 2000); hasMore tells you more remain
- stream: "combined" (default), "stdout", or "stderr"
Command-side filtering is only needed when output exceeds the 1MB-per-stream retention cap.

The execute preview keeps the first and last 50 lines; when \`truncated\` is true, follow up with
"read" (using the returned \`resultId\`) instead of re-running the command with different flags.

USER INTERACTION:
- "execute" requires user approval - the user sees the exact command and can approve or deny,
  cancel while it's running, or configure "Always Allow"
- "read" is auto-approved; it executes nothing

Do not run long-lived or endless processes (servers, watchers) with this tool; use
shellExecuteBackground instead. TIMEOUT (execute only): default 2 minutes, max 10 minutes.`,
            parameters: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['execute', 'read'],
                        description: '"execute" runs a shell command; "read" reads portions of a previous execution\'s output. ' +
                            'Defaults to "execute" when a command is given, "read" when a resultId is given.'
                    },
                    command: {
                        type: 'string',
                        description: 'The shell command to execute (action "execute"). Can include pipes, redirects, and shell ' +
                            'features - but keep it free of output-shaping filters (grep/head/tail/wc); use the read action instead.'
                    },
                    description: {
                        type: 'string',
                        description: 'Describe what this command actually does in active voice (action "execute"), ' +
                            'so the user can verify the command matches their intent without ' +
                            'parsing flags or shell syntax themselves. ' +
                            'Never use words like "complex" or "risk".\n\n' +
                            'Reflect the actual mechanics of the command: significant flags, ' +
                            'filters, pipes, and output limits. When a less obvious tool or ' +
                            'flag is chosen (e.g. `find` instead of `ls`, `-type f`, `head`, ' +
                            '`sort`), state its effect rather than only the high-level goal.\n\n' +
                            'For simple commands (git, npm, standard CLI tools), keep it brief (5-10 words):\n' +
                            '- cat README.md -> "Print README file contents"\n' +
                            '- git diff HEAD~1 -> "Show changes from last commit"\n' +
                            '- npm test -> "Run project test suite"\n\n' +
                            'For longer or piped commands, add enough context to clarify intent and behavior:\n' +
                            '- grep -rn "TODO" src/ --include="*.ts" -> "Search TypeScript files in src for TODO comments"\n' +
                            '- git log --oneline --since="1 week" | wc -l -> "Count commits from the past week"\n' +
                            '- du -sh node_modules/* | sort -rh | head -5 -> "Show 5 largest packages in node_modules by size"\n' +
                            '- find . -type f | head -100 -> "Recursively list up to the first 100 files (excluding directories) under the current directory"\n\n' +
                            'Avoid descriptions that state only the intent and hide the mechanics ' +
                            '(e.g. "List all files in the workspace" for `find . -type f | head -100` ' +
                            'is too vague — it omits the recursion, file-only filter, and 100-entry limit).'
                    },
                    cwd: {
                        type: 'string',
                        description: 'Working directory for command execution (action "execute"). ' +
                            'Use a workspace-relative path (e.g., "backend", "frontend/src") ' +
                            'or an absolute filesystem path. ' +
                            'If omitted, defaults to the workspace root (single-root workspaces only).'
                    },
                    timeout: {
                        type: 'number',
                        description: 'Timeout in milliseconds (action "execute"). Default: 120000 (2 minutes). Max: 600000 (10 minutes).'
                    },
                    resultId: {
                        type: 'string',
                        description: 'Result handle returned by a previous "execute" (action "read").'
                    },
                    filter: {
                        type: 'string',
                        description: 'Regex keeping only matching lines, preserving original line numbers (action "read").'
                    },
                    stream: {
                        type: 'string',
                        enum: ['combined', 'stdout', 'stderr'],
                        description: 'Which stream to read (action "read"). Default "combined".'
                    },
                    head: {
                        type: 'number',
                        description: 'First N lines of the filtered view (action "read").'
                    },
                    tail: {
                        type: 'number',
                        description: 'Last N lines of the filtered view (action "read").'
                    },
                    fromLine: {
                        type: 'number',
                        description: 'Start of a 1-based inclusive line range on original line numbers (action "read").'
                    },
                    toLine: {
                        type: 'number',
                        description: 'End of a 1-based inclusive line range on original line numbers (action "read").'
                    },
                    maxLines: {
                        type: 'number',
                        description: 'Maximum lines returned per read (action "read"). Default 200, max 2000.'
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
