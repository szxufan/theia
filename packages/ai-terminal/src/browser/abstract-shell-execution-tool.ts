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
import { generateUuid } from '@theia/core';
import * as path from 'path';
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import {
    OutputTruncationOptions,
    ShellExecutionCanceledResult,
    ShellExecutionServer,
    ShellExecutionToolResult,
    combineAndTruncate
} from '../common/shell-execution-server';

/** A single shell command to run through {@link AbstractShellExecutionTool.runShellCommand}. */
export interface ShellCommandExecution {
    command: string;
    /** Absolute working directory. If omitted the command runs in the backend process' cwd. */
    cwd?: string;
    /** Timeout in milliseconds. Falls back to the backend default when omitted. */
    timeout?: number;
    /**
     * The invocation context, if any. Its tool call id makes the execution cancellable via
     * {@link AbstractShellExecutionTool.cancelExecution}, and its cancellation token kills the
     * underlying process when fired. Typed as `unknown` because tool handlers receive the context
     * untyped; {@link ToolInvocationContext} narrows it.
     */
    ctx?: unknown;
    /** Overrides the default output truncation budget. */
    truncation?: OutputTruncationOptions;
}

/**
 * Resolves a user- or model-provided cwd (undefined, absolute, root-relative, or a root name)
 * to an absolute path. Throws a descriptive error when it cannot be resolved.
 */
export function resolveShellCwd(workspaceService: WorkspaceService, cwd: string | undefined): string {
    const roots = workspaceService.tryGetRoots();

    const rootNames = roots.map(r => r.resource.path.base);
    if (!cwd) {
        if (roots.length === 1) {
            return roots[0].resource.path.fsPath();
        }
        throw new Error(
            'A working directory (cwd) is required in a multi-root workspace. ' +
            `Available workspace roots: ${rootNames.join(', ')}. ` +
            'Provide one as cwd (e.g., "backend") or use a sub-path (e.g., "backend/src").'
        );
    }

    const normalized = cwd.replace(/\\/g, '/');

    if (path.isAbsolute(normalized)) {
        return normalized;
    }

    const segments = normalized.split('/');
    for (const root of roots) {
        if (root.resource.path.base === segments[0]) {
            const rest = segments.slice(1).join('/');
            const resolved = rest ? root.resource.resolve(rest) : root.resource;
            return resolved.path.fsPath();
        }
    }

    if (roots.length === 1) {
        return roots[0].resource.resolve(normalized).path.fsPath();
    }

    throw new Error(
        `Could not resolve working directory '${cwd}' to a workspace root. ` +
        'In a multi-root workspace, prefix paths with the workspace root name ' +
        `(e.g., '${rootNames[0]}/path'). Available roots: ${rootNames.join(', ')}.`
    );
}

/**
 * Shared plumbing for tools that run a shell command through the {@link ShellExecutionServer}:
 * execution-id bookkeeping, cancellation wiring, the canceled-result branch and output truncation.
 *
 * Subclasses only decide *which* command runs and how it is exposed to the LLM.
 */
@injectable()
export abstract class AbstractShellExecutionTool implements ToolProvider {

    @inject(ShellExecutionServer)
    protected readonly shellServer: ShellExecutionServer;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    /** Maps tool call ids to the execution ids of their in-flight shell commands. */
    protected readonly runningExecutions = new Map<string, string>();

    abstract getTool(): ToolRequest;

    async cancelExecution(toolCallId: string): Promise<boolean> {
        const executionId = this.runningExecutions.get(toolCallId);
        if (executionId) {
            const canceled = await this.shellServer.cancel(executionId);
            if (canceled) {
                this.runningExecutions.delete(toolCallId);
            }
            return canceled;
        }
        return false;
    }

    isExecutionRunning(toolCallId: string): boolean {
        return this.runningExecutions.has(toolCallId);
    }

    /** Runs `execution` and maps the raw server result onto the tool result shape. */
    protected async runShellCommand(execution: ShellCommandExecution): Promise<ShellExecutionToolResult | ShellExecutionCanceledResult> {
        const { command, cwd, timeout, ctx, truncation } = execution;
        const toolCallId = ToolInvocationContext.getToolCallId(ctx);
        const cancellationToken = ToolInvocationContext.getCancellationToken(ctx);

        const executionId = generateUuid();
        if (toolCallId) {
            this.runningExecutions.set(toolCallId, executionId);
        }
        const cancellationListener = cancellationToken?.onCancellationRequested(() => {
            this.shellServer.cancel(executionId);
        });

        try {
            const result = await this.shellServer.execute({ command, cwd, timeout, executionId });

            if (result.canceled) {
                return {
                    canceled: true,
                    output: this.combineAndTruncate(result.stdout, result.stderr, truncation) || undefined,
                    duration: result.duration,
                    resultId: executionId,
                    totalLines: result.totalLines,
                    truncated: result.truncated
                };
            }

            return {
                success: result.success,
                exitCode: result.exitCode,
                output: this.combineAndTruncate(result.stdout, result.stderr, truncation),
                error: result.error,
                duration: result.duration,
                cwd: result.resolvedCwd,
                resultId: executionId,
                totalLines: result.totalLines,
                truncated: result.truncated
            };
        } finally {
            cancellationListener?.dispose();
            if (toolCallId) {
                this.runningExecutions.delete(toolCallId);
            }
        }
    }

    protected combineAndTruncate(stdout: string, stderr: string, options?: OutputTruncationOptions): string {
        return combineAndTruncate(stdout, stderr, options);
    }
}
