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

import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { CancellationToken } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { TaskService } from '@theia/task/lib/browser/task-service';
import { TaskConfiguration, TaskScope } from '@theia/task/lib/common/task-protocol';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import { LIST_TASKS_FUNCTION_ID, RUN_TASK_FUNCTION_ID } from '../common/workspace-functions';
import { WorkspaceFunctionScope } from './workspace-functions';

import URI from '@theia/core/lib/common/uri';

/**
 * Sentinel value returned (and accepted) as `workspaceRoot` for tasks defined
 * in the `.code-workspace` file rather than in a specific folder's `tasks.json`.
 */
export const WORKSPACE_SCOPE_TOKEN = '(workspace)';

/**
 * Sentinel value returned (and accepted) as `workspaceRoot` for user-level
 * global tasks that are not associated with any workspace or folder.
 */
export const GLOBAL_SCOPE_TOKEN = '(global)';

export interface TaskListEntry {
    /** The task label as defined in tasks.json or by a task provider */
    label: string;
    /**
     * Identifies where the task is defined:
     * - A root folder name (e.g. `"frontend"`) for folder-scoped tasks.
     * - `"(workspace)"` for tasks defined in the `.code-workspace` file.
     * - `"(global)"` for user-level global tasks.
     *
     * Pass this value back to `runTask`'s `workspaceRoot` parameter to
     * disambiguate when multiple tasks share the same label.
     */
    workspaceRoot?: string;
}

/**
 * Maps a task scope to the addressing token an agent should use.
 *
 * - Folder URI string → the workspace root name (e.g. `"frontend"`).
 * - `TaskScope.Workspace` → `"(workspace)"`.
 * - `TaskScope.Global` → `"(global)"`.
 *
 * If a folder URI cannot be resolved to a known root name, falls back to
 * `"(workspace)"` so the task remains addressable.
 */
export function resolveScopeToken(scope: string | TaskScope.Workspace | TaskScope.Global, workspaceScope: WorkspaceFunctionScope): string {
    if (scope === TaskScope.Workspace) {
        return WORKSPACE_SCOPE_TOKEN;
    }
    if (scope === TaskScope.Global) {
        return GLOBAL_SCOPE_TOKEN;
    }
    try {
        const uri = new URI(scope);
        return workspaceScope.getRootName(uri) ?? WORKSPACE_SCOPE_TOKEN;
    } catch {
        return WORKSPACE_SCOPE_TOKEN;
    }
}

@injectable()
export class TaskListProvider implements ToolProvider {

    @inject(TaskService)
    protected readonly taskService: TaskService;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    getTool(): ToolRequest {
        return {
            id: LIST_TASKS_FUNCTION_ID,
            name: LIST_TASKS_FUNCTION_ID,
            description: '列出工作区中可用 runTask 执行的任务。返回一个对象数组，' +
                '每个对象包含 "label"（任务名称）和 "workspaceRoot"（标识任务定义的位置）。' +
                'filter 参数传空字符串 "" 可获取所有任务，也可以提供子串' +
                '进行过滤（例如 "test" 返回名称中含 "test" 的任务）。' +
                '运行 runTask 前务必先调用它以获取准确的任务名称及其工作区根。',
            parameters: {
                type: 'object',
                properties: {
                    filter: {
                        type: 'string',
                        description: '任务名称的子串过滤器。使用 ""（空字符串）获取所有任务，' +
                            '或用 "build"、"test"、"lint" 等关键字过滤结果。'
                    }
                },
                required: ['filter']
            },
            handler: async (argString: string, ctx?: ToolInvocationContext) => {
                if (ctx?.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const filterArgs: { filter: string } = JSON.parse(argString);
                const tasks = await this.getAvailableTasks(filterArgs.filter);
                return JSON.stringify(tasks);
            }
        };
    }

    private async getAvailableTasks(filter: string = ''): Promise<TaskListEntry[]> {
        const userActionToken = this.taskService.startUserAction();
        const tasks = await this.taskService.getTasks(userActionToken);
        const filteredTasks = tasks.filter(task => task.label.toLowerCase().includes(filter.toLowerCase()));
        return filteredTasks.map(task => this.toTaskListEntry(task));
    }

    private toTaskListEntry(task: TaskConfiguration): TaskListEntry {
        const entry: TaskListEntry = { label: task.label };
        entry.workspaceRoot = resolveScopeToken(task._scope, this.workspaceScope);
        return entry;
    }
}

@injectable()
export class TaskRunnerProvider implements ToolProvider {

    @inject(TaskService)
    protected readonly taskService: TaskService;

    @inject(TerminalService)
    protected readonly terminalService: TerminalService;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    getTool(): ToolRequest {
        return {
            id: RUN_TASK_FUNCTION_ID,
            name: RUN_TASK_FUNCTION_ID,
            description: '按名称执行指定任务并等待完成。返回终端输出' +
                '（输出超过限制时返回前 50 行和后 50 行）。任务必须存在于工作区中' +
                '（用 listTasks 发现可用任务）。常见任务类型包括：构建任务' +
                '（例如 "npm: build"）、测试任务（例如 "npm: test"）和 lint 任务（例如 "npm: lint"）。' +
                '任务失败时，响应中会包含错误输出。任务可能需要较长时间完成' +
                '（构建可能耗时数分钟）。该操作可被用户取消。' +
                '由于它会阻塞到任务结束，不要用于长期运行的进程（开发服务器、watch 任务、' +
                '被测应用）——那些请用 runLaunchConfiguration。' +
                '如果多个任务使用同一标签，请指定 workspaceRoot 参数加以区分。' +
                '未先通过 listTasks 发现的任务不要用它执行。',
            parameters: {
                type: 'object',
                properties: {
                    taskName: {
                        type: 'string',
                        description: '要执行的任务的确切名称/标签，与 listTasks 返回的一致。'
                    },
                    workspaceRoot: {
                        type: 'string',
                        description: 'listTasks 返回的 workspaceRoot 值。' +
                            '当多个任务使用同一标签时必填。'
                    }
                },
                required: ['taskName']
            },
            handler: async (argString: string, ctx?: ToolInvocationContext) => this.handleRunTask(argString, ctx?.cancellationToken)

        };
    }

    private async handleRunTask(argString: string, cancellationToken?: CancellationToken): Promise<string> {
        try {
            const args: { taskName: string; workspaceRoot?: string } = JSON.parse(argString);

            const token = this.taskService.startUserAction();
            const allTasks = await this.taskService.getTasks(token);

            const matchingTasks = allTasks.filter(task => task.label === args.taskName);

            if (matchingTasks.length === 0) {
                return `Did not find a task for the label: '${args.taskName}'`;
            }

            let taskToRun: TaskConfiguration;

            if (matchingTasks.length === 1) {
                taskToRun = matchingTasks[0];
            } else if (args.workspaceRoot) {
                const filtered = this.filterByWorkspaceRoot(matchingTasks, args.workspaceRoot);
                if (typeof filtered === 'string') {
                    return filtered; // error message
                }
                if (filtered.length === 0) {
                    return `No task '${args.taskName}' found in workspace root '${args.workspaceRoot}'. `
                        + 'The task may be defined in a different root. Use listTasks to check.';
                }
                taskToRun = filtered[0];
            } else {
                const scopeTokens = matchingTasks.map(task => resolveScopeToken(task._scope, this.workspaceScope));
                return `Ambiguous task name '${args.taskName}' — found in multiple scopes: ${scopeTokens.join(', ')}. `
                    + 'Please specify the workspaceRoot parameter to disambiguate.';
            }

            const taskInfo = await this.taskService.runTask(taskToRun);
            if (!taskInfo) {
                return `Did not find a task for the label: '${args.taskName}'`;
            }
            cancellationToken?.onCancellationRequested(() => {
                // Only terminate if the task is still running
                if (this.taskService.isTaskRunning(taskInfo.taskId)) {
                    this.taskService.terminateTask(taskInfo);
                }
            });
            if (cancellationToken?.isCancellationRequested) {
                return JSON.stringify({ error: 'Operation cancelled by user' });
            }
            const signal = await this.taskService.getTerminateSignal(taskInfo.taskId);
            if (taskInfo.terminalId) {
                const terminal = this.terminalService.getByTerminalId(taskInfo.terminalId!);

                const length = terminal?.buffer.length ?? 0;
                const numberOfLines = Math.min(length, 50);
                const result: string[] = [];
                const allLines = terminal?.buffer.getLines(0, length) ?? [];

                // collect the first 50 lines:
                const firstLines = allLines.slice(0, numberOfLines);
                result.push(...firstLines);
                // collect the last 50 lines:
                if (length > numberOfLines) {
                    const lastLines = allLines.slice(length - numberOfLines);
                    result.push(...lastLines);
                }
                terminal?.clearOutput();
                return result.join('\n');
            }
            return `No terminal output available. The terminate signal was :${signal}.`;

        } catch (error) {
            return JSON.stringify({ success: false, message: error.message || 'Failed to run task' });
        }
    }

    /**
     * Filters tasks by the `workspaceRoot` addressing token the agent provided.
     *
     * Handles the sentinel values `(workspace)` and `(global)` as well as
     * normal folder-root names.
     *
     * @returns the filtered task array, or an error string if the root is unknown.
     */
    private filterByWorkspaceRoot(tasks: TaskConfiguration[], workspaceRoot: string): TaskConfiguration[] | string {
        if (workspaceRoot === WORKSPACE_SCOPE_TOKEN) {
            return tasks.filter(task => task._scope === TaskScope.Workspace);
        }
        if (workspaceRoot === GLOBAL_SCOPE_TOKEN) {
            return tasks.filter(task => task._scope === TaskScope.Global);
        }
        const rootMapping = this.workspaceScope.getRootMapping();
        const rootUri = rootMapping.get(workspaceRoot);
        if (!rootUri) {
            const availableRoots = Array.from(rootMapping.keys()).join(', ');
            return `Unknown workspace root '${workspaceRoot}'. Available roots: ${availableRoots}`;
        }
        const rootUriStr = rootUri.toString();
        return tasks.filter(
            task => typeof task._scope === 'string' && task._scope === rootUriStr
        );
    }
}
