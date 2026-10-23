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

import { inject, injectable, named } from '@theia/core/shared/inversify';
import { AGENT_DELEGATION_FUNCTION_ID, ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { Disposable, ILogger, nls } from '@theia/core';
import {
    assertChatContext,
    ChatAgentService,
    ChatAgentServiceFactory,
    ChatChangeEvent,
    ChatRequest,
    ChatResponseContent,
    ChatContextManager,
    ChatService,
    ChatServiceFactory,
    ChatSession,
    ChatSessionStatus,
    ChatToolContext,
    InformationalChatResponseContentImpl,
    MutableChatModel,
    MutableChatRequestModel,
    MutableChatResponseModel,
    ChatRequestInvocation,
    ThinkingChatResponseContent,
    ToolCallChatResponseContent,
    resolvePermissionSettings,
} from '../common';
import { BackgroundDelegationRegistry } from './background-delegation-registry';
import { TASK_CONTEXT_VARIABLE } from './task-context-variable';

@injectable()
export class AgentDelegationTool implements ToolProvider {
    static ID = AGENT_DELEGATION_FUNCTION_ID;

    protected readonly pendingDelegations = new Map<string, { prompt: string; invocation: ChatRequestInvocation }>();

    @inject(ChatAgentServiceFactory)
    protected readonly getChatAgentService: () => ChatAgentService;

    @inject(ChatServiceFactory)
    protected readonly getChatService: () => ChatService;

    @inject(BackgroundDelegationRegistry)
    protected readonly backgroundDelegations: BackgroundDelegationRegistry;

    @inject(ILogger) @named('ai-chat:AgentDelegationTool')
    protected readonly logger: ILogger;

    getTool(): ToolRequest {
        return {
            id: AgentDelegationTool.ID,
            name: AgentDelegationTool.ID,
            description:
                '将任务或问题委派给指定的 AI 代理。重要：使用此工具向指定 AI 代理委派任务或问题时，' +
                '请记住：每个子代理只能在其专属能力与工具范围内工作，并且除非通过 sessionId 恢复先前的委派，' +
                '否则它无法访问此前的对话上下文或外部系统。因此，必须在请求中直接提供所有必要的上下文和详细信息，' +
                '以确保任务准确、有效地完成。' +
                '每个结果都以一行 "[delegation sessionId: <id>]" 结尾。要向同一代理发送后续请求并保留其先前的对话' +
                '（例如审查其结果后要求修复），请将该 id 作为 sessionId 传入。同一任务的后续请求优先选择恢复会话；' +
                '不相关的任务请开启新会话（省略 sessionId），因为恢复的会话会随着每轮交互不断变长。' +
                '还可选择传入 taskContextId，将特定任务上下文（例如计划）通过系统提示词提供给被委派的代理。',
            parameters: {
                type: 'object',
                properties: {
                    agentId: {
                        type: 'string',
                        description:
                            '要委派任务的 AI 代理的 ID。',
                    },
                    prompt: {
                        type: 'string',
                        description:
                            '传递给指定代理的任务、问题或提示词。包含总体目标、具体问题及相关文件路径。' +
                            '问题要聚焦（例如“列出 X 的所有调用点及上下文行”）；含糊的提示词只会得到缓慢而空泛的报告。',
                    },
                    taskContextId: {
                        type: 'string',
                        description: '可选的任务上下文 ID，提供给被委派的代理。代理会在其系统提示词中看到该任务上下文。',
                    },
                    sessionId: {
                        type: 'string',
                        description: '可选的先前委派会话的 ID，用于继续该会话，即先前结果中 "[delegation sessionId: <id>]" 一行报告的 id。' +
                            '被委派的代理会保留其先前的对话上下文，因此无需重复已发送过的上下文。' +
                            '只能恢复由你自己委派的会话，且 agentId 必须与原始委派一致。',
                    },
                    background: {
                        type: 'boolean',
                        description: '在后台运行委派并立即返回 taskId。' +
                            '用于想要并行的独立长耗时子任务。用 getDelegationResult(taskId) 轮询结果；' +
                            '任务完成时会向当前会话追加一条提示。可用 stopDelegation(taskId) 提前停止。',
                    },
                },
                required: ['agentId', 'prompt'],
            },
            handler: (arg_string: string, ctx?: ToolInvocationContext) => {
                assertChatContext(ctx);
                return this.delegateToAgent(arg_string, ctx);
            },
        };
    }

    getDelegation(toolCallId: string): { prompt: string; invocation: ChatRequestInvocation } | undefined {
        return this.pendingDelegations.get(toolCallId);
    }

    cancelDelegation(toolCallId: string): void {
        const delegation = this.pendingDelegations.get(toolCallId);
        if (delegation) {
            delegation.invocation.requestCompleted.then(request =>
                this.getChatService().cancelRequest(request.session.id, request.id)
            ).catch(error => this.logger.error('Failed to cancel delegation', error));
        }
    }

    private async delegateToAgent(
        arg_string: string,
        ctx: ChatToolContext
    ): Promise<string> {
        if (ctx.cancellationToken?.isCancellationRequested) {
            return 'Operation cancelled by user';
        }

        try {
            const args = JSON.parse(arg_string);
            const { agentId, prompt, taskContextId, sessionId, background } = args;

            if (!agentId || !prompt) {
                const errorMsg = 'Both agentId and prompt parameters are required.';
                this.logger.error(errorMsg, { agentId, prompt });
                return errorMsg;
            }

            // Check if the specified agent exists
            const agent = this.getChatAgentService().getAgent(agentId, true);
            if (!agent) {
                const availableAgents = this.getChatAgentService()
                    .getAgents(true)
                    .map(a => a.id);
                const errorMsg = `Agent '${agentId}' not found or not enabled. Available agents: ${availableAgents.join(', ')}`;
                this.logger.error(errorMsg);
                return errorMsg;
            }

            let session: ChatSession;
            let childModelDisposable: Disposable | undefined;
            if (sessionId) {
                const chatService = this.getChatService();
                // Restore from storage if necessary: delegated sessions are auto-saved, so after a reload the
                // delegating session's history still carries the id while the session itself is no longer in memory.
                const existingSession = await chatService.getOrRestoreSession(sessionId);
                if (!existingSession) {
                    const errorMsg = `Delegation session '${sessionId}' not found. It may have been deleted. ` +
                        'Send the request again without sessionId to start a fresh session — the agent will not have any prior context.';
                    // warn, not error: a stale session id is expected in a normal agentic loop (e.g. the user deleted the session)
                    this.logger.warn(errorMsg);
                    return errorMsg;
                }
                if (existingSession.parentSessionId !== ctx.request.session.id) {
                    // Without this, any session id would be accepted, including an unrelated top-level user chat,
                    // and the delegated request would be injected into it.
                    const errorMsg = `Delegation session '${sessionId}' was not delegated by this session and cannot be resumed here. ` +
                        'Only pass a sessionId reported by one of your own earlier delegations, or omit it to start a fresh session.';
                    this.logger.error(errorMsg);
                    return errorMsg;
                }
                if (ChatSessionStatus.isInProgress(existingSession.model.status)) {
                    const errorMsg = `Delegation session '${sessionId}' is still processing a previous request. ` +
                        'Wait for its result before sending a follow-up, or omit sessionId to start a fresh session.';
                    // warn, not error: expected when the caller issues parallel requests against the same session
                    this.logger.warn(errorMsg);
                    return errorMsg;
                }
                if (existingSession.pinnedAgent && existingSession.pinnedAgent.id !== agentId) {
                    const errorMsg = `Delegation session '${sessionId}' belongs to agent '${existingSession.pinnedAgent.id}', not '${agentId}'. ` +
                        'Pass the matching agentId, or omit sessionId to start a fresh session.';
                    this.logger.error(errorMsg);
                    return errorMsg;
                }

                // Deliberately keep rootSessionId/parentSessionId as set at creation time; a resumed
                // session stays attached to its original delegation hierarchy.
                if (taskContextId) {
                    this.setTaskContext(existingSession.model.context, taskContextId);
                }

                session = existingSession;
                // Re-establish bubbling for this request; the previous disposable was disposed when the
                // original delegation completed, and the parent request/response are new objects now.
                childModelDisposable = this.setupChildSessionBubbling(existingSession.model as MutableChatModel, ctx.request.session, ctx.response);
            } else {
                try {
                    const chatService = this.getChatService();

                    // Store the current active session to restore it after delegation
                    const currentActiveSession = chatService.getActiveSession();

                    const newSession = chatService.createSession(
                        undefined,
                        { focus: false },
                        agent
                    );

                    // Set root session ID to enable task context sharing across delegation chains
                    // Root is either the current root (for nested delegation) or current session (for first-level delegation)
                    const rootId = ctx.rootSessionId || ctx.request.session.id;
                    newSession.rootSessionId = rootId;
                    newSession.model.rootSessionId = rootId;

                    // Track the immediate parent (the delegating session) so the UI can render the full
                    // delegation hierarchy, not just a flat list under the root.
                    const parentId = ctx.request.session.id;
                    newSession.parentSessionId = parentId;
                    newSession.model.parentSessionId = parentId;

                    // Inherit the parent's permission settings so delegated sub-agents run under the
                    // same permission mode and plan-mode restrictions as the delegating session.
                    const parentCommon = ctx.request.session.settings?.commonSettings;
                    if (parentCommon) {
                        const inherited = resolvePermissionSettings(parentCommon);
                        if (inherited.permissionMode !== 'confirm' || inherited.planMode) {
                            (newSession.model as MutableChatModel).setSettings({
                                ...newSession.model.settings,
                                commonSettings: {
                                    ...newSession.model.settings?.commonSettings,
                                    permissionMode: inherited.permissionMode,
                                    planMode: inherited.planMode || undefined
                                }
                            });
                        }
                    }

                    if (taskContextId) {
                        newSession.model.context.addVariables({
                            variable: TASK_CONTEXT_VARIABLE,
                            arg: taskContextId
                        });
                    }

                    // Immediately restore the original active session to avoid confusing the user
                    if (currentActiveSession) {
                        chatService.setActiveSession(currentActiveSession.id, { focus: false });
                    }

                    // Setup bubbling of child session events to parent session
                    childModelDisposable = this.setupChildSessionBubbling(newSession.model as MutableChatModel, ctx.request.session, ctx.response);
                    session = newSession;
                } catch (sessionError) {
                    const errorMsg = `Failed to create chat session for agent '${agentId}': ${sessionError instanceof Error ? sessionError.message : sessionError}`;
                    this.logger.error(errorMsg, sessionError);
                    return errorMsg;
                }
            }

            const sessionIdSuffix = `[delegation sessionId: ${session.id}]`;

            // Send the request. The `finally` releases the event bubbling on every outcome: a resumed
            // session is long-lived, so leaking a listener per failed round would forward its events
            // into stale parent responses.
            try {
                const chatRequest: ChatRequest = {
                    text: `@${agentId} ${prompt}`,
                };

                let response: ChatRequestInvocation | undefined;
                try {
                    if (ctx.cancellationToken?.isCancellationRequested) {
                        return `Operation cancelled by user\n\n${sessionIdSuffix}`;
                    }

                    const chatService = this.getChatService();
                    response = await chatService.sendRequest(
                        session.id,
                        chatRequest
                    );

                    if (ctx.cancellationToken) {
                        ctx.cancellationToken.onCancellationRequested(
                            async () => {
                                if (response) {
                                    ((await response?.requestCompleted) as MutableChatRequestModel).cancel();
                                }
                            }
                        );
                    }
                } catch (sendError) {
                    const errorMsg = `Failed to send request to agent '${agentId}': ${sendError instanceof Error ? sendError.message : sendError}`;
                    this.logger.error(errorMsg, sendError);
                    return errorMsg;
                }

                if (response) {
                    if (background) {
                        // The delegation keeps running in its child session; the parent
                        // conversation continues immediately with a task handle. Event bubbling
                        // lives as long as the background task, so the finally below must not
                        // dispose it.
                        const bubbling = childModelDisposable;
                        childModelDisposable = undefined;
                        const entry = this.backgroundDelegations.create({
                            agentId,
                            sessionId: session.id,
                            invocation: response,
                            onDispose: () => bubbling?.dispose()
                        });
                        const parentResponse = ctx.response;
                        response.responseCompleted.then(result => {
                            this.backgroundDelegations.updateState(entry.taskId,
                                result.isCanceled ? 'cancelled' : 'completed',
                                this.renderDelegationResult(result.response.content,
                                    result.isCanceled ? `Delegation to agent '${agentId}' was cancelled by the user.` : '',
                                    sessionIdSuffix));
                            parentResponse.response.addContent(new InformationalChatResponseContentImpl(
                                nls.localize('theia/ai/chat/delegation/backgroundFinished',
                                    '后台委派任务 {0}（代理 {1}）已完成，可调用 getDelegationResult 获取结果。',
                                    entry.taskId, agentId)));
                        }).catch(completionError => {
                            this.backgroundDelegations.updateState(entry.taskId, 'error',
                                `Failed to complete response from agent '${agentId}': ${completionError instanceof Error ? completionError.message : completionError}`);
                        });
                        return [
                            `Delegation to agent '${agentId}' started in the background.`,
                            `Do not wait for it; continue with other work. The conversation will be notified when it finishes.`,
                            `[delegation taskId: ${entry.taskId}, sessionId: ${session.id}]`
                        ].join('\n\n');
                    }

                    // Store the invocation in the registry so the renderer can access it
                    if (ctx.toolCallId) {
                        this.pendingDelegations.set(ctx.toolCallId, {
                            prompt,
                            invocation: response
                        });
                        // Clean up when the delegated session is deleted
                        const chatService = this.getChatService();
                        const toolCallId = ctx.toolCallId;
                        const sessionEventListener = chatService.onSessionEvent(event => {
                            if (event.type === 'deleted' && event.sessionId === session.id) {
                                this.pendingDelegations.delete(toolCallId);
                                sessionEventListener.dispose();
                            }
                        });
                    }

                    try {
                        // Wait for completion to return the final result as tool output
                        const result = await response.responseCompleted;
                        return this.renderDelegationResult(result.response.content,
                            result.isCanceled ? `Delegation to agent '${agentId}' was cancelled by the user.` : '',
                            sessionIdSuffix);
                    } catch (completionError) {
                        if (
                            completionError instanceof Error &&
                            completionError.message.includes('cancelled')
                        ) {
                            return `Operation cancelled by user\n\n${sessionIdSuffix}`;
                        }
                        const errorMsg = `Failed to complete response from agent '${agentId}': ${completionError instanceof Error ? completionError.message : completionError}`;
                        this.logger.error(errorMsg, completionError);
                        return errorMsg;
                    }
                } else {
                    const errorMsg = `Delegation to agent '${agentId}' has failed: no response returned.`;
                    this.logger.error(errorMsg);
                    return errorMsg;
                }
            } finally {
                childModelDisposable?.dispose();
            }
        } catch (error) {
            this.logger.error('Failed to delegate to agent', error);
            return JSON.stringify({
                error: `Failed to parse arguments or delegate to agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Renders a delegation session's response content as tool result text. Thinking and tool
     * call parts are dropped; a session id suffix enables follow-ups into the same session.
     */
    private renderDelegationResult(content: ChatResponseContent[], cancellationNotice = '', sessionIdSuffix = ''): string {
        const filteredContent = content.filter(c => !ThinkingChatResponseContent.is(c) && !ToolCallChatResponseContent.is(c));
        const stringResult = filteredContent
            .map(c => ChatResponseContent.hasAsString(c) ? c.asString() : undefined)
            .filter((text): text is string => text !== undefined && text !== '')
            .join('\n\n');
        return [stringResult, cancellationNotice, sessionIdSuffix].filter(text => text !== '').join('\n\n');
    }

    /**
     * Makes the given task context the session's task context, replacing a previously set one.
     * `addVariables` deduplicates on variable id *and* argument, so adding a different task context
     * id would otherwise leave the session with both in its system prompt.
     */
    private setTaskContext(context: ChatContextManager, taskContextId: string): void {
        const staleIndices = context.getVariables().reduce<number[]>((indices, variable, index) => {
            if (variable.variable.id === TASK_CONTEXT_VARIABLE.id && variable.arg !== taskContextId) {
                indices.push(index);
            }
            return indices;
        }, []);
        if (staleIndices.length > 0) {
            context.deleteVariables(...staleIndices);
        }
        context.addVariables({ variable: TASK_CONTEXT_VARIABLE, arg: taskContextId });
    }

    /**
     * Sets up all event bubbling from a delegated child session to the parent session:
     * - Interaction forwarding: child interactionNeeded events are forwarded to the parent response
     * - ChangeSet bubbling: child changeset changes are forwarded to the parent model
     */
    private setupChildSessionBubbling(
        childModel: MutableChatModel,
        parentModel: MutableChatModel,
        parentResponse: MutableChatResponseModel
    ): Disposable {

        // Forward interactionNeeded events to the parent response model
        // so the UI (which subscribes to response.onInteractionNeeded) can display them.
        // Also watch for each forwarded interaction's resolution to trigger cleanup.
        const eventForwarding = childModel.onDidChange(event => {
            if (ChatChangeEvent.isInteractionNeededEvent(event)) {
                parentResponse.fireInteractionNeeded(event.contentPart);
                event.contentPart.whenResolved.then(() => parentResponse.notifyChanged());
                // A tool call's confirmation settles long before the call resolves (the
                // tool may run for minutes after being confirmed); notify the parent at
                // settle time so its UI re-derives pending interactions immediately.
                if (ToolCallChatResponseContent.is(event.contentPart)) {
                    event.contentPart.confirmed.then(
                        () => parentResponse.notifyChanged(),
                        () => parentResponse.notifyChanged()
                    );
                }
            }
        });

        // Bubble ChangeSet changes to the parent model
        const changeSetForwarding = childModel.changeSet.onDidChange(() => {
            const delegatedElements = childModel.changeSet.getElements();
            if (delegatedElements.length > 0) {
                parentModel.changeSet.setTitle(childModel.changeSet.title);
                parentModel.changeSet.addElements(...delegatedElements);
            }
        });

        return {
            dispose: () => {
                eventForwarding.dispose();
                changeSetForwarding.dispose();
            }
        };
    }
}
