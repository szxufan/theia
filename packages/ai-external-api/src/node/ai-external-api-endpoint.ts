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

import { IJSONSchema } from '@theia/core/lib/common/json-schema';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ExternalApiContribution, ExternalApiContributionDocumentation } from '@theia/external-api/lib/node/external-api-contribution';
import { ExternalApiRouter, RestParamDocumentation } from '@theia/external-api/lib/node/external-api-router';
import { RestResult } from '@theia/external-api/lib/node/rest-result';
import {
    AI_SESSIONS_API_PATH, ExternalChatPrompt, ExternalChatSessionCreateRequest, ExternalChatSessionDetail, ExternalChatSessionSummary
} from '../common/external-chat-session-provider';
import { ExternalChatSessionRegistry } from './external-chat-session-registry';

const SESSION_ID_PARAM: RestParamDocumentation = { description: '会话 id。' };

const SESSION_LIST_SCHEMA: IJSONSchema = {
    type: 'object',
    required: ['sessions'],
    properties: {
        sessions: { type: 'array', items: ExternalChatSessionSummary.SCHEMA, description: '会话列表，按最近使用排序。' }
    }
};

const SESSION_CREATED_SCHEMA: IJSONSchema = {
    type: 'object',
    required: ['session'],
    properties: {
        session: ExternalChatSessionSummary.SCHEMA,
        requestId: { type: 'string', description: '为初始提示词创建的请求 id；未发送提示词时省略。' }
    }
};

const PROMPT_ACCEPTED_SCHEMA: IJSONSchema = {
    type: 'object',
    required: ['sessionId', 'requestId'],
    properties: {
        sessionId: { type: 'string', description: '收到提示词的会话 id。' },
        requestId: { type: 'string', description: '创建的请求 id。' }
    }
};

/**
 * Contributes the AI session API to the external API server:
 * - `GET /api/ai/sessions` lists all sessions (restored and persisted) with id, title, status,
 *   agent, workspace, last interaction time, and a short plain-text preview of the conversation.
 * - `POST /api/ai/sessions` creates a session in a frontend matching the requested workspace,
 *   optionally pinning an agent and sending an initial prompt.
 * - `GET /api/ai/sessions/events` streams the session list as server-sent events, pushing an
 *   updated list whenever sessions change.
 * - `GET /api/ai/sessions/:id` returns a single session including its conversation reduced to
 *   plain-text messages (persisted sessions report metadata only until restored).
 * - `POST /api/ai/sessions/:id/open` shows the session in the chat view of a connected frontend.
 * - `POST /api/ai/sessions/:id/restore` restores a persisted session and returns its detail.
 * - `POST /api/ai/sessions/:id/prompt` sends a prompt to the session.
 *
 * The endpoints are served on the external API port and are token-protected when an
 * external API token is configured (see `@theia/external-api`).
 */
@injectable()
export class AIExternalApiEndpoint implements ExternalApiContribution {

    readonly path = AI_SESSIONS_API_PATH;

    readonly documentation: ExternalApiContributionDocumentation = {
        title: 'AI 聊天会话',
        description: '查看、跟踪、打开、提示并创建该 Theia 实例的 AI 聊天会话。'
    };

    @inject(ExternalChatSessionRegistry)
    protected readonly registry: ExternalChatSessionRegistry;

    configure(router: ExternalApiRouter): void {
        router.get('/', {
            operationId: 'listChatSessions',
            summary: '列出全部 AI 聊天会话，按最近使用排序。',
            responses: {
                200: { description: '所有已连接前端的当前会话。', schema: SESSION_LIST_SCHEMA }
            }
        }, async () => RestResult.ok({ sessions: await this.registry.getSessions() }));
        // register before '/:id' so that 'events' is not treated as a session id
        const events = router.eventStream('/events', {
            event: 'sessions',
            operationId: 'streamChatSessions',
            summary: '以服务器推送事件（SSE）流式传输会话列表。',
            description: '连接时立即推送当前会话列表；此后每当会话变化都会推送完整的更新列表。'
                + '每个事件都是完整替换而非增量。',
            dataSchema: SESSION_LIST_SCHEMA,
            snapshot: async () => ({ sessions: await this.registry.getSessions() })
        });
        router.toDispose.push(this.registry.onDidChangeSessions(() => events.notifyChanged()));
        router.get('/:id', {
            operationId: 'getChatSession',
            summary: '获取单个会话，含简化为纯文本消息的对话。',
            params: { id: SESSION_ID_PARAM },
            responses: {
                200: {
                    description: '会话详情。未恢复的持久化会话不含消息。',
                    schema: ExternalChatSessionDetail.SCHEMA
                },
                404: { description: '所有已连接前端均不认识该会话。' }
            }
        }, async ({ params }) => {
            const session = await this.registry.getSession(params.id);
            return session ? RestResult.ok(session) : RestResult.notFound();
        });
        router.post('/', {
            operationId: 'createChatSession',
            summary: '在已连接的前端中创建聊天会话，可选发送初始提示词。',
            bodySchema: ExternalChatSessionCreateRequest.SCHEMA,
            responses: {
                201: { description: '创建的会话；若发送了初始提示词，还含创建的请求 id。', schema: SESSION_CREATED_SCHEMA },
                400: { description: '请求的代理未注册。' },
                404: { description: '没有已连接前端匹配所请求的工作区。' },
                409: { description: '工作区不明确，或没有代理能处理初始提示词。' },
                503: { description: '没有已连接的前端。' }
            }
        }, ({ body }) => this.createSession(body));
        router.post('/:id/open', {
            operationId: 'openChatSession',
            summary: '在已连接前端的聊天视图中显示该会话，必要时先恢复。',
            params: { id: SESSION_ID_PARAM },
            responses: {
                204: { description: '会话已在前端中显示。' },
                404: { description: '所有已连接前端均不认识该会话。' }
            }
        }, async ({ params }) =>
            await this.registry.openSession(params.id) ? RestResult.noContent() : RestResult.notFound());
        router.post('/:id/restore', {
            operationId: 'restoreChatSession',
            summary: '在已连接前端中恢复该会话（不聚焦），并返回其详情。',
            params: { id: SESSION_ID_PARAM },
            responses: {
                200: { description: '已恢复会话的详情。', schema: ExternalChatSessionDetail.SCHEMA },
                404: { description: '所有已连接前端均不认识该会话。' }
            }
        }, async ({ params }) => {
            const session = await this.registry.restoreSession(params.id);
            return session ? RestResult.ok(session) : RestResult.notFound();
        });
        router.post('/:id/prompt', {
            operationId: 'promptChatSession',
            summary: '向该会话发送提示词，必要时先恢复。',
            bodySchema: ExternalChatPrompt.SCHEMA,
            params: { id: SESSION_ID_PARAM },
            responses: {
                202: { description: '提示词已提交；可通过事件流或读取端点跟踪进度。', schema: PROMPT_ACCEPTED_SCHEMA },
                404: { description: '所有已连接前端均不认识该会话。' },
                409: { description: '有请求进行中且未设置 `interrupt`，或没有可用代理。' }
            }
        }, ({ params, body }) => this.sendPrompt(params.id, body));
    }

    protected async createSession(request: ExternalChatSessionCreateRequest): Promise<RestResult> {
        const result = await this.registry.createSession(request);
        if ('created' in result) {
            return RestResult.created(result.created);
        }
        switch (result.failure) {
            case 'unknownAgent':
                return RestResult.badRequest('unknown agent');
            case 'noAgent':
                return RestResult.conflict('no agent available');
            case 'noFrontend':
                return RestResult.error(503, 'no frontend connected');
            case 'workspaceNotFound':
                return RestResult.notFound('workspace not found');
            case 'ambiguousWorkspace':
                return RestResult.conflict('ambiguous workspace');
        }
    }

    protected async sendPrompt(sessionId: string, prompt: ExternalChatPrompt): Promise<RestResult> {
        const result = await this.registry.sendPrompt(sessionId, prompt);
        if (!result) {
            return RestResult.notFound();
        }
        if ('sent' in result) {
            return RestResult.accepted(result.sent);
        }
        return RestResult.conflict(result.failure === 'busy' ? 'busy' : 'no agent available');
    }
}
