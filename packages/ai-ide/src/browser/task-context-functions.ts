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

import { assertChatContext } from '@theia/ai-chat';
import { Summary, TaskContextStorageService } from '@theia/ai-chat/lib/browser/task-context-service';
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { generateUuid } from '@theia/core';
import { ContentReplacer, Replacement } from '@theia/core/lib/common/content-replacer';
import { ContentReplacerV2Impl } from '@theia/core/lib/common/content-replacer-v2-impl';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
    CREATE_TASK_CONTEXT_FUNCTION_ID,
    GET_TASK_CONTEXT_FUNCTION_ID,
    EDIT_TASK_CONTEXT_FUNCTION_ID,
    LIST_TASK_CONTEXTS_FUNCTION_ID,
    REWRITE_TASK_CONTEXT_FUNCTION_ID
} from '../common/task-context-function-ids';

@injectable()
export class CreateTaskContextFunction implements ToolProvider {
    static ID = CREATE_TASK_CONTEXT_FUNCTION_ID;

    @inject(TaskContextStorageService)
    protected readonly storageService: TaskContextStorageService;

    getTool(): ToolRequest {
        return {
            id: CreateTaskContextFunction.ID,
            name: CreateTaskContextFunction.ID,
            description: '为当前会话创建新的任务上下文（实施计划）。' +
                '计划会被存储并在编辑器中打开，让用户可以看到。' +
                '探索完代码库后，用它记录实施计划。',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: '任务上下文的标题（例如 "添加用户认证功能"）'
                    },
                    content: {
                        type: 'string',
                        description: 'markdown 格式的计划内容。应包含：目标、设计、实施步骤（含文件路径）、' +
                            '参考示例和验证方式。'
                    }
                },
                required: ['title', 'content']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                try {
                    const { title, content } = JSON.parse(args);
                    const summaryId = generateUuid();
                    // Store task context in root session if this is a delegated session,
                    // so it's accessible across the entire delegation chain
                    const targetSessionId = ctx.rootSessionId || ctx.request.session.id;
                    const summary: Summary = {
                        id: summaryId,
                        label: title,
                        summary: content,
                        sessionId: targetSessionId
                    };

                    await this.storageService.store(summary);
                    await this.storageService.open(summaryId);

                    return `Created task context "${title}" (id: ${summaryId}) - now visible in editor. The user can review and edit the plan directly.`;
                } catch (error) {
                    return JSON.stringify({ error: `Failed to create task context: ${error.message}` });
                }
            }
        };
    }
}

@injectable()
export class GetTaskContextFunction implements ToolProvider {
    static ID = GET_TASK_CONTEXT_FUNCTION_ID;

    @inject(TaskContextStorageService)
    protected readonly storageService: TaskContextStorageService;

    getTool(): ToolRequest {
        return {
            id: GetTaskContextFunction.ID,
            name: GetTaskContextFunction.ID,
            description: '读取当前的任务上下文（实施计划）。' +
                '在规划或探索任务前调用它。如果存在匹配的计划，直接将其用作路线图，无需重新探索，' +
                '但要把它当作起点而非硬性要求：当某个步骤有误（假设过时、存在冲突）或存在更简单的替代方案时可以偏离。' +
                '执行偏离操作前先解释原因，并在最终报告中列出所有偏离之处。' +
                '当子代理报告 taskContextId 时，用此工具读取并将其作为你的计划。' +
                '编辑或恢复工作前务必先调用它以获取最新版本，' +
                '因为用户可能直接在编辑器中修改过计划。',
            parameters: {
                type: 'object',
                properties: {
                    taskContextId: {
                        type: 'string',
                        description: '可选的任务上下文 ID。未提供时返回当前会话的任务上下文。'
                    }
                },
                required: []
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                try {
                    const parsed = args ? JSON.parse(args) : {};
                    const taskContextId: string | undefined = parsed.taskContextId;

                    let summary: Summary | undefined;
                    if (taskContextId) {
                        summary = await this.storageService.get(taskContextId);
                    } else {
                        const allSummaries = this.storageService.getAll();
                        // Use root session if this is a delegated session, otherwise use current session
                        const targetSessionId = ctx.rootSessionId || ctx.request.session.id;
                        const sessionSummaries = allSummaries.filter(s => s.sessionId === targetSessionId);
                        summary = sessionSummaries[sessionSummaries.length - 1];
                    }

                    if (!summary) {
                        return 'No task context found for this session. Use createTaskContext to create one.';
                    }

                    return summary.summary;
                } catch (error) {
                    return JSON.stringify({ error: `Failed to get task context: ${error.message}` });
                }
            }
        };
    }
}

@injectable()
export class EditTaskContextFunction implements ToolProvider {
    static ID = EDIT_TASK_CONTEXT_FUNCTION_ID;

    @inject(TaskContextStorageService)
    protected readonly storageService: TaskContextStorageService;

    protected readonly contentReplacer: ContentReplacer = new ContentReplacerV2Impl();

    getTool(): ToolRequest {
        return {
            id: EditTaskContextFunction.ID,
            name: EditTaskContextFunction.ID,
            description: '通过替换特定内容来编辑当前任务上下文。' +
                '计划会被更新并在编辑器中打开，让用户可以看到变更。' +
                'oldContent 必须在计划中恰好出现一次。' +
                '重要：编辑前务必先调用 getTaskContext 读取最新版本，' +
                '因为用户可能直接修改过计划。' +
                '如果看到 "not found" 错误：内容不存在、空白字符不同或计划已变化。请先用 getTaskContext 重新读取。' +
                '如果看到 "multiple occurrences" 错误：在 oldContent 中加入更多上下文行使其唯一。' +
                '常见错误：缺少/多余的行尾换行、缩进错误、内容过时。' +
                '如果编辑持续失败，用 rewriteTaskContext 替换整个内容。',
            parameters: {
                type: 'object',
                properties: {
                    oldContent: {
                        type: 'string',
                        description: '要被替换的确切内容。必须完全匹配，包括空白字符和缩进。'
                    },
                    newContent: {
                        type: 'string',
                        description: '替换后的文本。删除内容时请使用空字符串。'
                    },
                    taskContextId: {
                        type: 'string',
                        description: '可选的任务上下文 ID。未提供时编辑当前会话的任务上下文。'
                    }
                },
                required: ['oldContent', 'newContent']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                try {
                    const { oldContent, newContent, taskContextId } = JSON.parse(args);

                    let summary: Summary | undefined;
                    if (taskContextId) {
                        summary = await this.storageService.get(taskContextId);
                    } else {
                        const allSummaries = this.storageService.getAll();
                        // Use root session if this is a delegated session, otherwise use current session
                        const targetSessionId = ctx.rootSessionId || ctx.request.session.id;
                        const sessionSummaries = allSummaries.filter(s => s.sessionId === targetSessionId);
                        summary = sessionSummaries[sessionSummaries.length - 1];
                    }

                    if (!summary) {
                        return 'No task context found for this session. Use createTaskContext to create one first.';
                    }

                    const replacement: Replacement = { oldContent, newContent };
                    const { updatedContent, errors } = this.contentReplacer.applyReplacements(summary.summary, [replacement]);

                    if (errors.length > 0) {
                        return 'Edit failed: ' + errors.join('; ') + '. ' +
                            'The user may have edited the plan directly. ' +
                            'Use getTaskContext to read the current content and try again. ' +
                            'If edits continue to fail, use rewriteTaskContext to replace the entire content.';
                    }

                    const updatedSummary: Summary = {
                        ...summary,
                        summary: updatedContent
                    };
                    await this.storageService.store(updatedSummary);

                    await this.storageService.open(summary.id);

                    return 'Task context updated successfully - changes visible in editor.';
                } catch (error) {
                    return JSON.stringify({ error: `Failed to edit task context: ${error.message}` });
                }
            }
        };
    }
}

@injectable()
export class ListTaskContextsFunction implements ToolProvider {
    static ID = LIST_TASK_CONTEXTS_FUNCTION_ID;

    @inject(TaskContextStorageService)
    protected readonly storageService: TaskContextStorageService;

    getTool(): ToolRequest {
        return {
            id: ListTaskContextsFunction.ID,
            name: ListTaskContextsFunction.ID,
            description: '列出当前会话的所有任务上下文（计划）。' +
                '用它查看现有哪些计划及其 ID。',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                try {
                    const allSummaries = this.storageService.getAll();
                    // Use root session if this is a delegated session, otherwise use current session
                    const targetSessionId = ctx.rootSessionId || ctx.request.session.id;
                    const sessionSummaries = allSummaries.filter(s => s.sessionId === targetSessionId);

                    if (sessionSummaries.length === 0) {
                        return 'No task contexts found for this session.';
                    }

                    const list = sessionSummaries.map((s, i) =>
                        `${i + 1}. "${s.label}" (id: ${s.id})`
                    ).join('\n');

                    return `Task contexts for this session:\n${list}\n\nMost recent: "${sessionSummaries[sessionSummaries.length - 1].label}"`;
                } catch (error) {
                    return JSON.stringify({ error: `Failed to list task contexts: ${error.message}` });
                }
            }
        };
    }
}

@injectable()
export class RewriteTaskContextFunction implements ToolProvider {
    static ID = REWRITE_TASK_CONTEXT_FUNCTION_ID;

    @inject(TaskContextStorageService)
    protected readonly storageService: TaskContextStorageService;

    getTool(): ToolRequest {
        return {
            id: RewriteTaskContextFunction.ID,
            name: RewriteTaskContextFunction.ID,
            description: '用新内容完全重写任务上下文。' +
                '当 editTaskContext 反复失败时作为兜底使用，' +
                '例如用户对计划做了大幅修改的情况。' +
                '计划会被更新并在编辑器中打开，让用户可以看到变更。',
            parameters: {
                type: 'object',
                properties: {
                    content: {
                        type: 'string',
                        description: '任务上下文的完整新内容，markdown 格式。'
                    },
                    taskContextId: {
                        type: 'string',
                        description: '可选的任务上下文 ID。未提供时重写当前会话的任务上下文。'
                    }
                },
                required: ['content']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                try {
                    const { content, taskContextId } = JSON.parse(args);

                    let summary: Summary | undefined;
                    if (taskContextId) {
                        summary = await this.storageService.get(taskContextId);
                    } else {
                        const allSummaries = this.storageService.getAll();
                        // Use root session if this is a delegated session, otherwise use current session
                        const targetSessionId = ctx.rootSessionId || ctx.request.session.id;
                        const sessionSummaries = allSummaries.filter(s => s.sessionId === targetSessionId);
                        summary = sessionSummaries[sessionSummaries.length - 1];
                    }

                    if (!summary) {
                        return 'No task context found for this session. Use createTaskContext to create one first.';
                    }

                    const updatedSummary: Summary = {
                        ...summary,
                        summary: content
                    };
                    await this.storageService.store(updatedSummary);

                    await this.storageService.open(summary.id);

                    return 'Task context rewritten successfully - changes visible in editor.';
                } catch (error) {
                    return JSON.stringify({ error: `Failed to rewrite task context: ${error.message}` });
                }
            }
        };
    }
}
