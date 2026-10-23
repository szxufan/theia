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
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { ChatService } from '../common';
import { BackgroundDelegationRegistry } from './background-delegation-registry';

export const GET_DELEGATION_RESULT_FUNCTION_ID = 'getDelegationResult';
export const STOP_DELEGATION_FUNCTION_ID = 'stopDelegation';

/** Polls the state and, once available, the result of a background delegation. */
@injectable()
export class GetDelegationResultTool implements ToolProvider {

    @inject(BackgroundDelegationRegistry)
    protected readonly registry: BackgroundDelegationRegistry;

    getTool(): ToolRequest {
        return {
            id: GET_DELEGATION_RESULT_FUNCTION_ID,
            name: GET_DELEGATION_RESULT_FUNCTION_ID,
            providerName: 'ai-chat',
            description: '获取通过 delegateToAgent(background: true) 启动的后台代理委派的状态和结果。' +
                '任务完成时也会向会话中追加一条提示。只需偶尔轮询；任务仍在运行时，请继续其他工作而不是等待。',
            parameters: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: '启动委派时返回的 taskId。'
                    }
                },
                required: ['taskId']
            },
            handler: (argString: string) => {
                const { taskId } = JSON.parse(argString) as { taskId: string };
                const entry = this.registry.get(taskId);
                if (!entry) {
                    return Promise.resolve({ status: 'unknown', note: `No background delegation with taskId '${taskId}'.` });
                }
                if (entry.state === 'running') {
                    return Promise.resolve({ status: 'running', note: 'The delegation is still in progress.' });
                }
                return Promise.resolve({ status: entry.state, result: entry.result ?? '' });
            },
            getArgumentsShortLabel: (args: string): { label: string; hasMore: boolean } | undefined => {
                try {
                    const parsed = JSON.parse(args);
                    if (parsed && typeof parsed === 'object' && 'taskId' in parsed) {
                        return { label: String(parsed.taskId), hasMore: false };
                    }
                } catch {
                    // fall through
                }
                return undefined;
            }
        };
    }
}

/** Cancels a running background delegation. */
@injectable()
export class StopDelegationTool implements ToolProvider {

    @inject(BackgroundDelegationRegistry)
    protected readonly registry: BackgroundDelegationRegistry;

    @inject(ChatService)
    protected readonly chatService: ChatService;

    getTool(): ToolRequest {
        return {
            id: STOP_DELEGATION_FUNCTION_ID,
            name: STOP_DELEGATION_FUNCTION_ID,
            providerName: 'ai-chat',
            description: '停止通过 delegateToAgent(background: true) 启动的后台代理委派。' +
                '子代理会话会被取消，其部分结果仍可获取。',
            parameters: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: '启动委派时返回的 taskId。'
                    }
                },
                required: ['taskId']
            },
            handler: (argString: string) => this.stop(JSON.parse(argString) as { taskId: string }),
            getArgumentsShortLabel: (args: string): { label: string; hasMore: boolean } | undefined => {
                try {
                    const parsed = JSON.parse(args);
                    if (parsed && typeof parsed === 'object' && 'taskId' in parsed) {
                        return { label: String(parsed.taskId), hasMore: false };
                    }
                } catch {
                    // fall through
                }
                return undefined;
            }
        };
    }

    protected async stop(args: { taskId: string }): Promise<object> {
        const entry = this.registry.get(args.taskId);
        if (!entry) {
            return { stopped: false, note: `No background delegation with taskId '${args.taskId}'.` };
        }
        if (entry.state !== 'running') {
            return { stopped: false, note: `The delegation already finished with state '${entry.state}'.` };
        }
        const request = await entry.invocation.requestCompleted;
        await this.chatService.cancelRequest(request.session.id, request.id);
        this.registry.updateState(args.taskId, 'cancelled');
        return { stopped: true };
    }
}
