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

import { ToolInvocationContext, ToolRequest } from '@theia/ai-core';
import { Disposable, ILogger } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { ChatToolRequestService, normalizeToolArgs } from '../common/chat-tool-request-service';
import { raceConfirmationWithTimeout } from '../common/chat-tool-confirmation-timeout';
import { ToolCallReview, ToolCallReviewer } from '../common/tool-call-reviewer';
import { MutableChatRequestModel, ToolCallChatResponseContent } from '../common/chat-model';
import { ToolConfirmationMode, ChatToolPreferences, TOOL_CONFIRMATION_TIMEOUT_PREFERENCE } from '../common/chat-tool-preferences';
import { resolvePermissionConfirmationMode } from '../common/chat-permission';
import { resolvePermissionSettings } from '../common/chat-model';
import { ToolConfirmationManager } from './chat-tool-preference-bindings';

/**
 * Upper bound for an AI tool call review; on expiry the plain confirmation flow continues.
 * Generous on purpose: remote or reasoning models can take a while, and the confirmation card
 * stays interactive throughout, so a slow review never blocks the user.
 */
const TOOL_CALL_REVIEW_TIMEOUT_MS = 30_000;

/**
 * Frontend-specific implementation of ChatToolRequestService that handles tool confirmation
 */
@injectable()
export class FrontendChatToolRequestService extends ChatToolRequestService {

    @inject(ILogger) @named('ai-chat:FrontendChatToolRequestService')
    protected readonly logger: ILogger;

    @inject(ToolConfirmationManager)
    protected readonly confirmationManager: ToolConfirmationManager;

    @inject(ChatToolPreferences)
    protected readonly preferences: ChatToolPreferences;

    @inject(ContributionProvider) @named(ToolCallReviewer)
    protected readonly toolCallReviewers: ContributionProvider<ToolCallReviewer>;

    protected override toChatToolRequest(toolRequest: ToolRequest, request: MutableChatRequestModel): ToolRequest {
        return {
            ...toolRequest,
            handler: async (arg_string: string, ctx?: ToolInvocationContext) => {
                const toolCallId = ctx?.toolCallId;
                const sessionId = request.session.rootSessionId ?? request.session.id;
                const preferenceMode = this.confirmationManager.getConfirmationMode(toolRequest.id, sessionId, toolRequest);
                const resolution = resolvePermissionConfirmationMode(
                    preferenceMode,
                    request.session.settings?.commonSettings,
                    { id: toolRequest.id, confirmAlwaysAllow: toolRequest.confirmAlwaysAllow, arguments: arg_string }
                );

                if (typeof resolution === 'object' && 'deny' in resolution) {
                    // Deny before any confirmation UI: the tool call content is recorded with the
                    // denial reason so the model learns why and can plan instead of act.
                    const toolCallContent = this.findToolCallContent(toolRequest, arg_string, request, toolCallId);
                    toolCallContent.deny(resolution.deny);
                    return toolCallContent.result;
                }
                const confirmationMode = resolution;

                switch (confirmationMode) {
                    case ToolConfirmationMode.DISABLED:
                        return { denied: true, message: `Tool ${toolRequest.id} is disabled` };

                    case ToolConfirmationMode.ALWAYS_ALLOW: {
                        const toolCallContentAlwaysAllow = this.findToolCallContent(toolRequest, arg_string, request, toolCallId);
                        toolCallContentAlwaysAllow.confirm();
                        const result = await toolRequest.handler(arg_string, this.createToolContext(request, ToolInvocationContext.create(toolCallContentAlwaysAllow.id)));
                        // Signal completion for immediate UI update. The language model uses Promise.all
                        // for parallel tools, so without this the UI wouldn't update until all tools finish.
                        // The result will be overwritten with the same value when the LLM stream yields it.
                        toolCallContentAlwaysAllow.complete(result);
                        return result;
                    }

                    case ToolConfirmationMode.CONFIRM:
                    default: {
                        const toolCallContent = this.findToolCallContent(toolRequest, arg_string, request, toolCallId);

                        // Check for auto-action hook
                        const autoAction = toolRequest.checkAutoAction?.(arg_string);

                        let confirmed: boolean;
                        if (autoAction?.action === 'allow') {
                            toolCallContent.confirm();
                            confirmed = await toolCallContent.confirmed;
                        } else if (autoAction?.action === 'deny') {
                            toolCallContent.deny(autoAction.reason);
                            return toolCallContent.result;
                        } else {
                            // No auto-action — needs user confirmation
                            // Session setting overrides global preference
                            const sessionTimeout = request.session.settings?.commonSettings?.confirmationTimeout;
                            const timeoutSeconds = sessionTimeout !== undefined && sessionTimeout > 0
                                ? sessionTimeout
                                : this.preferences[TOOL_CONFIRMATION_TIMEOUT_PREFERENCE];
                            toolCallContent.confirmationTimeout = timeoutSeconds;
                            toolCallContent.requestUserConfirmation();
                            request.response.fireInteractionNeeded(toolCallContent);
                            // Mark the response as waiting for input so the pending confirmation is
                            // surfaced consistently with agent questions (e.g. in the session overview).
                            request.response.waitForInput();
                            try {
                                // The confirmation card is visible already; give an AI reviewer a
                                // bounded chance to auto-approve or annotate it before racing the
                                // user decision (so the confirmation timeout does not eat into review time).
                                await this.runToolCallReview(toolRequest, arg_string, request, toolCallContent);
                                confirmed = await raceConfirmationWithTimeout(toolCallContent, timeoutSeconds);
                            } finally {
                                request.response.stopWaitingForInput();
                            }
                        }

                        if (confirmed) {
                            const result = await toolRequest.handler(arg_string, this.createToolContext(request, ToolInvocationContext.create(toolCallContent.id)));
                            // Signal completion for immediate UI update (see ALWAYS_ALLOW case for details)
                            toolCallContent.complete(result);
                            return result;
                        } else {
                            return toolCallContent.result;
                        }
                    }
                }
            }
        };
    }

    /**
     * Runs an AI review of a tool call that is awaiting user confirmation. A reviewer whose
     * `canReview` matches annotates the tool call content (`aiReview` payload) so confirmation
     * UIs can render the verdict. A `safe` verdict with `autoApprove` confirms without a user
     * click, but only in the `autonomous` permission mode — in `confirm` mode every mutating
     * action needs an explicit user click and the review is annotation-only. Review failures,
     * timeouts, and cancellation leave the plain confirmation unchanged.
     */
    protected async runToolCallReview(
        toolRequest: ToolRequest,
        argString: string,
        request: MutableChatRequestModel,
        toolCallContent: ToolCallChatResponseContent
    ): Promise<void> {
        let reviewer: ToolCallReviewer | undefined;
        try {
            reviewer = this.toolCallReviewers.getContributions().find(r => r.canReview(toolRequest.id, argString));
        } catch (error) {
            this.logger.warn(`Failed to determine tool call reviewer for ${toolRequest.id}.`, error);
            return;
        }
        if (!reviewer) {
            return;
        }

        toolCallContent.updateResult({ aiReview: { status: 'pending' } });
        const review = await this.raceToolCallReview(reviewer, toolRequest.id, argString, request);

        if (toolCallContent.finished) {
            return; // The user already decided or the request was canceled — never confirm on top.
        }
        if (!review) {
            // Review unavailable (disabled, failed, or timed out): drop the pending indicator again.
            toolCallContent.updateResult(undefined);
            return;
        }
        const { permissionMode } = resolvePermissionSettings(request.session?.settings?.commonSettings);
        if (permissionMode === 'autonomous'
            && review.verdict === 'safe' && review.autoApprove && toolCallContent.isAwaitingUserConfirmation) {
            toolCallContent.confirm();
            return;
        }
        toolCallContent.updateResult({
            aiReview: { status: 'done', verdict: review.verdict, purpose: review.purpose, risks: review.risks }
        });
    }

    /** Races the review against a timeout and the request's cancellation; never rejects. */
    protected async raceToolCallReview(
        reviewer: ToolCallReviewer,
        toolId: string,
        argString: string,
        request: MutableChatRequestModel
    ): Promise<ToolCallReview | undefined> {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let cancelListener: Disposable | undefined;
        const timeoutPromise = new Promise<undefined>(resolve => {
            timeout = setTimeout(() => resolve(undefined), TOOL_CALL_REVIEW_TIMEOUT_MS);
        });
        const cancellationPromise = request.response.cancellationToken.isCancellationRequested
            ? Promise.resolve(undefined)
            : new Promise<undefined>(resolve => {
                cancelListener = request.response.cancellationToken.onCancellationRequested(() => resolve(undefined));
            });
        try {
            return await Promise.race([
                reviewer.review(toolId, argString, request.response.cancellationToken),
                timeoutPromise,
                cancellationPromise
            ]);
        } catch (error) {
            this.logger.warn(`Tool call review for ${toolId} failed.`, error);
            return undefined;
        } finally {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            cancelListener?.dispose();
        }
    }

    /**
     * Finds the matching ToolCallChatResponseContent for a tool invocation.
     *
     * Matches by: 1) toolCallId, 2) tool name + normalized arguments, 3) fallback by name only.
     */
    protected findToolCallContent(
        toolRequest: ToolRequest,
        arguments_: string,
        request: MutableChatRequestModel,
        toolCallId?: string
    ): ToolCallChatResponseContent {
        const response = request.response.response;
        const contentArray = response.content;

        // Match on toolCallId first if LLM made it available
        if (toolCallId !== undefined) {
            for (let i = contentArray.length - 1; i >= 0; i--) {
                const content = contentArray[i];
                if (ToolCallChatResponseContent.is(content) && content.id === toolCallId) {
                    return content;
                }
            }
        }

        // Normalize arguments for comparison to handle differences in empty argument representation
        const normalizedArguments = normalizeToolArgs(arguments_);

        // Fall back to matching on tool name and normalized arguments
        for (let i = contentArray.length - 1; i >= 0; i--) {
            const content = contentArray[i];
            if (ToolCallChatResponseContent.is(content) &&
                content.name === toolRequest.id &&
                normalizeToolArgs(content.arguments) === normalizedArguments) {
                return content;
            }
        }

        // Fallback: match on tool name only
        for (let i = contentArray.length - 1; i >= 0; i--) {
            const content = contentArray[i];
            if (ToolCallChatResponseContent.is(content) &&
                content.name === toolRequest.id &&
                !content.finished) {
                this.logger.warn(`Tool call content for tool ${toolRequest.id} matched by incomplete status fallback. ` +
                    `Expected toolCallId: ${toolCallId}, arguments: ${arguments_}`);
                return content;
            }
        }

        throw new Error(`Tool call content for tool ${toolRequest.id} not found in the response`);
    }
}
