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
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { inject, injectable, optional } from '@theia/core/shared/inversify';
import { LIST_CHAT_CONTEXT_FUNCTION_ID, RESOLVE_CHAT_CONTEXT_FUNCTION_ID, UPDATE_CONTEXT_FILES_FUNCTION_ID } from '../common/context-functions';
import { FILE_VARIABLE } from '@theia/ai-core/lib/browser/file-variable-contribution';
import { ContextFileValidationService, FileValidationState } from '@theia/ai-chat/lib/browser/context-file-validation-service';

@injectable()
export class ListChatContext implements ToolProvider {
    static ID = LIST_CHAT_CONTEXT_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: ListChatContext.ID,
            name: ListChatContext.ID,
            description: '返回用户在聊天请求中手动指定的上下文元素（如文件）的列表。',
            handler: async (_: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const result = ctx.request.context.variables.map(contextElement => ({
                    id: contextElement.variable.id + contextElement.arg,
                    type: contextElement.variable.name
                }));
                return JSON.stringify(result, undefined, 2);
            },
            parameters: {
                type: 'object',
                properties: {}
            },
        };
    }
}

@injectable()
export class ResolveChatContext implements ToolProvider {
    static ID = RESOLVE_CHAT_CONTEXT_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: ResolveChatContext.ID,
            name: ResolveChatContext.ID,
            description: '返回用户在聊天请求中手动指定的某个上下文元素（如文件）的内容。',
            parameters: {
                type: 'object',
                properties: {
                    contextElementId: {
                        type: 'string',
                        description: '要解析的上下文元素的 id。'
                    }
                },
                required: ['contextElementId']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                const { contextElementId } = JSON.parse(args) as { contextElementId: string };
                const variable = ctx.request.context.variables.find(contextElement => contextElement.variable.id + contextElement.arg === contextElementId);
                if (variable) {
                    const result = {
                        type: variable.variable.name,
                        ref: variable.value,
                        content: variable.contextValue
                    };
                    return JSON.stringify(result, undefined, 2);
                }
                return JSON.stringify({ error: 'Context element not found' }, undefined, 2);
            }
        };
    }
}

@injectable()
export class AddFileToChatContext implements ToolProvider {
    static ID = UPDATE_CONTEXT_FILES_FUNCTION_ID;

    @inject(ContextFileValidationService) @optional()
    protected readonly validationService: ContextFileValidationService | undefined;

    getTool(): ToolRequest {
        return {
            id: AddFileToChatContext.ID,
            name: AddFileToChatContext.ID,
            parameters: {
                type: 'object',
                properties: {
                    filesToAdd: {
                        type: 'array',
                        description: '要收藏的文件路径数组 ' +
                            '（例如 ["my-project/src/index.ts", "backend/package.json"]）。',
                        items: { type: 'string' }
                    }
                },
                required: ['filesToAdd']
            },
            description: '将一个或多个文件添加到当前聊天会话的上下文中，供后续引用。' +
                '用它收藏对话中需要多次引用的重要文件——' +
                '这比反复重新读取文件更高效。' +
                '只有位于工作区边界内的文件才会被添加。' +
                '工作区之外的文件或不存在的文件会被拒绝。' +
                '返回每个文件的详细状态，包括成功添加的文件，以及被拒绝的文件及原因。' +
                '注意：将文件添加到上下文不会读取其内容——请用 getFileContent 读取实际内容。',
            handler: async (arg: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }

                const { filesToAdd } = JSON.parse(arg) as { filesToAdd: string[] };

                const added: string[] = [];
                const rejected: Array<{ file: string; reason: string; state: string }> = [];

                for (const file of filesToAdd) {
                    if (this.validationService) {
                        const validationResult = await this.validationService.validateFile(file);

                        if (validationResult.state === FileValidationState.VALID) {
                            ctx.request.session.context.addVariables({ arg: file, variable: FILE_VARIABLE });
                            added.push(file);
                        } else {
                            rejected.push({
                                file,
                                reason: validationResult.message || 'File validation failed',
                                state: validationResult.state
                            });
                        }
                    } else {
                        ctx.request.session.context.addVariables({ arg: file, variable: FILE_VARIABLE });
                        added.push(file);
                    }
                }

                return JSON.stringify({
                    added,
                    rejected,
                    summary: {
                        totalRequested: filesToAdd.length,
                        added: added.length,
                        rejected: rejected.length
                    }
                });
            }
        };
    }
}
