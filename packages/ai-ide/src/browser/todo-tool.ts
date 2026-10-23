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

import { injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import { TODO_WRITE_FUNCTION_ID, isValidTodoItem } from '../common/todo-tool';

@injectable()
export class TodoWriteTool implements ToolProvider {
    static ID = TODO_WRITE_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: TodoWriteTool.ID,
            name: TodoWriteTool.ID,
            providerName: 'ai-ide',
            description: '为当前会话创建或替换结构化的任务列表。' +
                '这有助于你跟踪进度、组织复杂任务，并向用户展示工作的周全性。' +
                '同时也能帮助用户了解其请求的进展和整体状态。\n\n' +
                '使用时机：\n' +
                '- 需要 3 个以上步骤或仔细规划的任务\n' +
                '- 用户提出多个任务或明确要求使用任务列表\n' +
                '- 收到新指令后——立即将需求记为待办\n' +
                '单一、琐碎的任务，或无需跟踪的对话式/信息类请求可跳过。\n' +
                '拿不准时，就使用此工具。\n\n' +
                '任务状态：\n' +
                '- pending：任务尚未开始\n' +
                '- in_progress：正在进行（同一时间只保留一个任务）\n' +
                '- completed：任务已成功完成\n\n' +
                '任务管理：\n' +
                '- 开始工作前先将任务标记为 in_progress（一次一个）\n' +
                '- 完成当前任务后再开始新任务\n' +
                '- 任务完成后立即标记为 completed——不要攒着批量标记\n' +
                '- 仅在完全达成时才标记为 completed（没有失败的测试、没有部分实现、没有未解决的错误）\n' +
                '- 如遇阻塞，新增一个描述需要解决什么问题的任务\n' +
                '- 补充实现过程中发现的后续任务\n' +
                '- 移除不再相关的任务\n\n' +
                '任务拆分：\n' +
                '- 创建具体、可执行的事项\n' +
                '- 将复杂任务拆分为更小、可控的步骤\n' +
                '- 使用清晰、有描述性的任务名称\n\n' +
                '积极主动的任务管理体现了你的细致，也能确保你成功完成所有需求。',
            parameters: {
                type: 'object',
                properties: {
                    todos: {
                        type: 'array',
                        description: '更新后的待办列表。',
                        items: {
                            type: 'object',
                            properties: {
                                content: { type: 'string', description: '清晰、可执行的任务描述（例如 "从 AuthService 中提取 TokenValidator"）。' },
                                activeForm: { type: 'string', description: '执行过程中显示的进行时表述（例如 "正在从 AuthService 中提取 TokenValidator"）。' },
                                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] }
                            },
                            required: ['content', 'activeForm', 'status']
                        }
                    }
                },
                required: ['todos']
            },
            handler: async (arg_string: string) => {
                try {
                    const { todos } = JSON.parse(arg_string);
                    if (!Array.isArray(todos)) {
                        return JSON.stringify({ error: 'todos must be an array' });
                    }
                    const validTodos = todos.filter(isValidTodoItem);
                    const invalidCount = todos.length - validTodos.length;
                    const response: Record<string, unknown> = {
                        success: true,
                        count: validTodos.length,
                    };
                    if (invalidCount > 0) {
                        response.warning = `${invalidCount} invalid todo item(s) were filtered out`;
                    }
                    return JSON.stringify(response);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    return JSON.stringify({ error: `Failed to parse todos: ${message}` });
                }
            }
        };
    }
}
