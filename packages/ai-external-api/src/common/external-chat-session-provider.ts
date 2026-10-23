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

import { ChatSessionStatus } from '@theia/ai-chat/lib/common/chat-model';
import { IJSONSchema } from '@theia/core/lib/common/json-schema';
import { RestBodySchema } from '@theia/external-api/lib/common/rest-body-schema';

/** Base path of the external AI session HTTP API. */
export const AI_SESSIONS_API_PATH = '/api/ai/sessions';

/** RPC path on which each frontend registers its {@link ExternalChatSessionProvider} with the backend. */
export const EXTERNAL_CHAT_SESSION_PROVIDER_PATH = '/services/ai-external-api/session-provider';

/**
 * Chat session summary as exposed by the external session list endpoint.
 */
export interface ExternalChatSessionSummary {
    id: string;
    title?: string;
    status: ChatSessionStatus;
    /** Timestamp in milliseconds since epoch of the last interaction with the session. */
    lastInteraction?: number;
    /**
     * URI of the workspace the session belongs to, or `undefined` if its frontend has no open
     * workspace. Also `undefined` for not-restored sessions when sessions are persisted
     * globally, as the global session store holds sessions saved from any workspace.
     */
    workspace?: string;
    /** The last few lines of the conversation as plain text, or `undefined` for an empty conversation. */
    preview?: string;
    /** ID of the agent driving the session, or `undefined` if no agent is pinned to the session. */
    agentId?: string;
    /** Human-readable name of the agent driving the session, or `undefined` if no agent is pinned or the agent is not registered. */
    agentName?: string;
    /**
     * ID of the session that delegated this one, or `undefined` for a top-level session.
     * Delegated sessions are listed alongside top-level ones; use this to group them.
     */
    parentSessionId?: string;
    /** ID of the topmost session of the delegation chain, or `undefined` for a top-level session. */
    rootSessionId?: string;
    /**
     * Whether the session is restored (live) in a connected frontend. Sessions that are only
     * persisted report metadata only: their status is reduced to `idle` or `failed` and they
     * carry neither a preview nor messages until they are restored.
     */
    restored: boolean;
}

export namespace ExternalChatSessionSummary {
    /** JSON Schema of {@link ExternalChatSessionSummary}, published in the OpenAPI document. */
    export const SCHEMA: IJSONSchema = {
        type: 'object',
        required: ['id', 'status', 'restored'],
        properties: {
            id: { type: 'string', description: '唯一的会话 id。' },
            title: { type: 'string', description: '会话标题（如已设置或生成）。' },
            status: {
                type: 'string',
                enum: [...ChatSessionStatus.VALUES],
                description: '会话的聚合状态，由最后一个请求的状态推导。'
                    + "'awaitingApproval' 和 'awaitingInput' 表示会话正等待用户处理。"
            },
            lastInteraction: { type: 'number', description: '与该会话最后一次交互的时间戳（自纪元起的毫秒数）。' },
            workspace: {
                type: 'string',
                description: '会话所属工作区的 URI；会话所在前端没有打开工作区时省略，'
                    + '会话全局持久化时未恢复的会话也省略。'
            },
            preview: {
                type: 'string',
                description: '对话最后几行的纯文本；空对话与未恢复的会话省略。'
            },
            agentId: { type: 'string', description: '驱动该会话的代理 ID；未固定代理时省略。' },
            agentName: { type: 'string', description: '驱动该会话的代理的可读名称。' },
            parentSessionId: {
                type: 'string',
                description: '委派产生该会话的父会话 ID；顶级会话省略。'
                    + '被委派的会话与顶级会话一起列出；可用它分组。'
            },
            rootSessionId: {
                type: 'string',
                description: '委派链最顶层会话的 ID；顶级会话省略。'
            },
            restored: {
                type: 'boolean',
                description: '会话是否已在某个已连接前端中恢复。未恢复的会话仅报告持久化的元数据。'
            }
        }
    };
}

/**
 * A single entry of the simplified conversation exposed by the external session detail endpoint.
 *
 * The conversation is reduced to plain text, similar to the message history sent to the language
 * model for the next request: tool calls, thinking, and errors are rendered as text, while
 * internal details such as content ids, branches, or serialization metadata are not exposed.
 */
export interface ExternalChatMessage {
    /** Author of the entry. */
    actor: 'user' | 'ai';
    /** Plain-text representation of the entry. */
    text: string;
}

export namespace ExternalChatMessage {
    /** JSON Schema of {@link ExternalChatMessage}, published in the OpenAPI document. */
    export const SCHEMA: IJSONSchema = {
        type: 'object',
        required: ['actor', 'text'],
        properties: {
            actor: { type: 'string', enum: ['user', 'ai'], description: '条目的作者。' },
            text: { type: 'string', description: '条目的纯文本表示。' }
        }
    };
}

/**
 * Chat session detail as exposed by the external session detail endpoint.
 */
export interface ExternalChatSessionDetail extends ExternalChatSessionSummary {
    /**
     * The session's conversation reduced to plain-text messages, oldest first.
     * Absent when the session is not restored (see {@link ExternalChatSessionSummary.restored}).
     */
    messages?: ExternalChatMessage[];
}

export namespace ExternalChatSessionDetail {
    /** JSON Schema of {@link ExternalChatSessionDetail}, published in the OpenAPI document. */
    export const SCHEMA: IJSONSchema = {
        ...ExternalChatSessionSummary.SCHEMA,
        properties: {
            ...ExternalChatSessionSummary.SCHEMA.properties,
            messages: {
                type: 'array',
                items: ExternalChatMessage.SCHEMA,
                description: '会话对话的纯文本消息（按时间先后排序）。会话未恢复时省略。'
            }
        }
    };
}

/**
 * Prompt sent to an existing session through the external API.
 */
export interface ExternalChatPrompt {
    /** The prompt text, including optional `@agent` mentions and variable references. */
    text: string;
    /**
     * Cancel an in-progress request (including pending tool calls) before sending.
     * Without this flag, prompting a session whose status is in progress is rejected as busy.
     */
    interrupt?: boolean;
}

export namespace ExternalChatPrompt {
    /** JSON Schema of {@link ExternalChatPrompt}; bodies of the prompt endpoint are validated against it. */
    export const SCHEMA: RestBodySchema<ExternalChatPrompt> = {
        type: 'object',
        required: ['text'],
        additionalProperties: false,
        properties: {
            text: {
                type: 'string',
                pattern: '\\S',
                description: '提示词文本，可包含可选的 `@agent` 提及与变量引用。不能为空白。'
            },
            interrupt: {
                type: 'boolean',
                description: '发送前取消进行中的请求（含待处理的工具调用）。'
                    + '不设置该标志时，对进行中状态的会话发提示词会被拒绝（busy）。'
            }
        }
    };
}

/**
 * Result of sending a prompt: the created request, or the reason the prompt was rejected.
 *
 * `busy` means a request was in progress and `interrupt` was not set; `noAgent` means no
 * agent was available to handle the prompt (none mentioned, none pinned, no default configured).
 */
export type ExternalChatPromptResult =
    | { sent: { sessionId: string; requestId: string } }
    | { failure: 'busy' | 'noAgent' };

/**
 * Session creation request as accepted by the external session creation endpoint.
 */
export interface ExternalChatSessionCreateRequest {
    /**
     * URI of the workspace in which to create the session. The session is created in a
     * frontend that has this workspace open. May be omitted when all connected frontends
     * share the same workspace.
     */
    workspace?: string;
    /** ID of the agent to pin to the session. When omitted, the default agent handles prompts. */
    agentId?: string;
    /** Initial prompt to send right after creation. */
    prompt?: string;
    /**
     * Raise the chat view in the IDE. Note that the created session becomes the active
     * session of its frontend in any case.
     */
    focus?: boolean;
}

export namespace ExternalChatSessionCreateRequest {
    /** JSON Schema of {@link ExternalChatSessionCreateRequest}; bodies of the creation endpoint are validated against it. */
    export const SCHEMA: RestBodySchema<ExternalChatSessionCreateRequest> = {
        type: 'object',
        additionalProperties: false,
        properties: {
            workspace: {
                type: 'string',
                pattern: '\\S',
                description: '创建会话的工作区 URI。会话在打开了该工作区的某个前端中创建。'
                    + '所有已连接前端共享同一工作区时可省略。'
            },
            agentId: {
                type: 'string',
                pattern: '\\S',
                description: '固定到该会话的代理 ID。省略时由默认代理处理提示词。'
            },
            prompt: {
                type: 'string',
                pattern: '\\S',
                description: '创建后立即发送的初始提示词。给定该字段时不能为空白。'
            },
            focus: {
                type: 'boolean',
                description: '在 IDE 中打开聊天视图。无论是否设置，创建的会话都会成为其前端的活动会话。'
            }
        }
    };
}

/**
 * Result of a session creation: the created session, or the reason creation was rejected.
 *
 * `unknownAgent` means the requested agent id is not registered. `noAgent` means the initial
 * prompt could not be handled because no agent was available (the session is not kept in that
 * case). `noFrontend` means no connected frontend is available to create the session.
 * `workspaceNotFound` means no connected frontend matches the requested workspace.
 * `ambiguousWorkspace` means no workspace was given and the connected frontends have
 * different workspaces open.
 */
export type ExternalChatSessionCreateResult =
    | { created: { session: ExternalChatSessionSummary; requestId?: string } }
    | { failure: 'unknownAgent' | 'noAgent' | 'noFrontend' | 'workspaceNotFound' | 'ambiguousWorkspace' };

export const ExternalChatSessionProvider = Symbol('ExternalChatSessionProvider');
/**
 * Provides chat session information and session actions for the external API.
 *
 * Implemented by each frontend and registered with the backend over RPC. The backend
 * queries the registered providers on demand when external clients call the HTTP API.
 */
export interface ExternalChatSessionProvider {
    /** Returns the URI of the workspace this frontend has opened, or `undefined` if none. */
    getWorkspace(): Promise<string | undefined>;
    /**
     * Returns summaries of all sessions known to this frontend: sessions restored in memory
     * as well as persisted sessions that have not been restored (reported with their
     * persisted metadata and `restored: false`).
     */
    getSessions(): Promise<ExternalChatSessionSummary[]>;
    /**
     * Returns the summary of the given session, or `undefined` if the session is unknown to this
     * frontend. Used to pick the frontend a session action is routed to, so it must stay cheap:
     * unlike {@link getSession} it does not carry the conversation.
     */
    getSessionSummary(sessionId: string): Promise<ExternalChatSessionSummary | undefined>;
    /**
     * Returns the detail of the given session, or `undefined` if the session is unknown to this
     * frontend. For persisted sessions that are not restored, the detail carries no messages.
     */
    getSession(sessionId: string): Promise<ExternalChatSessionDetail | undefined>;
    /**
     * Restores the given session if necessary and shows it in this frontend's chat view.
     * Returns `false` if the session is unknown to this frontend.
     */
    openSession(sessionId: string): Promise<boolean>;
    /**
     * Restores the given session in this frontend without focusing it. Returns the detail of
     * the restored session, or `undefined` if the session is unknown to this frontend.
     */
    restoreSession(sessionId: string): Promise<ExternalChatSessionDetail | undefined>;
    /**
     * Sends a prompt to the given session, restoring it first if necessary. Returns `undefined`
     * if the session is unknown to this frontend.
     */
    sendPrompt(sessionId: string, prompt: ExternalChatPrompt): Promise<ExternalChatPromptResult | undefined>;
    /**
     * Creates a new session in this frontend and sends the initial prompt, if one is given.
     * The created session becomes the frontend's active session. The request's `workspace` is
     * ignored; routing to a matching frontend is the backend's responsibility.
     */
    createSession(request: ExternalChatSessionCreateRequest): Promise<ExternalChatSessionCreateResult>;
}

export const ExternalChatSessionBackendService = Symbol('ExternalChatSessionBackendService');
/**
 * Backend side of the {@link ExternalChatSessionProvider} connection.
 *
 * Invoked by each frontend to inform the backend about session changes so that the backend
 * can push updates to external event stream clients.
 */
export interface ExternalChatSessionBackendService {
    /**
     * Notifies the backend that the sessions of the calling frontend changed in a way visible
     * to the external API (session created/deleted/renamed or session status changed).
     */
    notifySessionsChanged(): void;
}
