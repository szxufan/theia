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

import { inject, injectable, named } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core';
import {
    FrontendLanguageModelRegistry,
    isLanguageModelParsedResponse,
    isLanguageModelTextResponse,
    isTextResponsePart,
    LanguageModel,
    LanguageModelMessage,
    LanguageModelRegistry,
    LanguageModelService,
    UserRequest
} from '@theia/ai-core/lib/common';
import { ChatModel, ClientCompactionRecord, CommonChatSessionSettings, MutableChatModel } from './chat-model';
import {
    CLIENT_COMPACTION_ENABLED_PREFERENCE, CLIENT_COMPACTION_KEEP_TURNS_PREFERENCE, CLIENT_COMPACTION_THRESHOLD_PREFERENCE
} from './ai-chat-preferences';
import { PreferenceService } from '@theia/core/lib/common/preferences';
import { PREFERENCE_NAME_SERVER_SIDE_COMPACTION } from '@theia/ai-core/lib/common/ai-core-preferences';

/** Model alias used for generating compaction summaries; small and cheap is ideal. */
export const COMPACTION_SUMMARY_MODEL_ALIAS = 'default/summarize';

/** Vendors whose models come with native server-side compaction; client compaction defers to them. */
const SERVER_SIDE_COMPACTION_VENDORS = new Set(['openai', 'anthropic']);

/**
 * Estimates whether the session history outgrew the model's context window and, if so,
 * summarizes the older part of the conversation into a persistent {@link ClientCompactionRecord}.
 *
 * Unlike the server-side compaction of OpenAI/Anthropic, this works with every language model,
 * including self-hosted ones (Ollama, llamafile, custom OpenAI-compatible endpoints). The full
 * history remains visible in the UI; only what is sent to the model is replaced by the summary.
 */
@injectable()
export class ClientCompactionService {

    @inject(LanguageModelService)
    protected readonly languageModelService: LanguageModelService;

    @inject(LanguageModelRegistry)
    protected readonly languageModelRegistry: LanguageModelRegistry;

    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    @inject(ILogger) @named('ai-chat:ClientCompactionService')
    protected readonly logger: ILogger;

    /**
     * Entry point called before each request: compacts when enabled, due, and not already covered
     * by the provider's native server-side compaction. Never throws — compaction is advisory and
     * a failed compaction must not fail the chat request.
     */
    async maybeCompact(model: MutableChatModel, languageModel: LanguageModel, sessionSettings?: CommonChatSessionSettings): Promise<boolean> {
        try {
            if (!this.preferences.get<boolean>(CLIENT_COMPACTION_ENABLED_PREFERENCE, true)) {
                return false;
            }
            if (this.deferToServerSideCompaction(languageModel, sessionSettings)) {
                return false;
            }
            if (!this.shouldCompact(model, languageModel)) {
                return false;
            }
            return await this.compact(model);
        } catch (error) {
            this.logger.warn('Client-side compaction failed; continuing with the full history.', error);
            return false;
        }
    }

    /**
     * OpenAI and Anthropic compact server-side when the session asks for it. When that mechanism
     * is active, client compaction would only duplicate the effort, so it steps aside. An explicit
     * `compaction.enabled: false` in the session settings opts back into client compaction.
     */
    protected deferToServerSideCompaction(languageModel: LanguageModel, sessionSettings?: CommonChatSessionSettings): boolean {
        const sessionEnabled = sessionSettings?.compaction?.enabled;
        if (sessionEnabled === false) {
            return false;
        }
        if (sessionEnabled === true) {
            return SERVER_SIDE_COMPACTION_VENDORS.has(languageModel.vendor ?? '');
        }
        const globalEnabled = this.preferences.get<boolean>(PREFERENCE_NAME_SERVER_SIDE_COMPACTION, true);
        return globalEnabled && SERVER_SIDE_COMPACTION_VENDORS.has(languageModel.vendor ?? '');
    }

    /**
     * Whether the session's estimated context usage exceeds the compaction threshold.
     * The estimate is the accumulated token usage of the last completed response — its input
     * tokens are the size of the context as the model last saw it.
     */
    shouldCompact(model: ChatModel, languageModel: LanguageModel): boolean {
        if (model.clientCompaction && !this.hasNewTurnsSinceCompaction(model)) {
            // Already compacted and nothing new accumulated since: no need to compact again.
            return false;
        }
        const maxInputTokens = languageModel.maxInputTokens;
        if (!maxInputTokens) {
            return false;
        }
        const threshold = this.preferences.get<number>(CLIENT_COMPACTION_THRESHOLD_PREFERENCE, 0.8);
        const estimate = this.estimateContextTokens(model as MutableChatModel);
        return estimate >= maxInputTokens * threshold;
    }

    /**
     * Whether more than {@link keepTurns} further requests accumulated after the compaction
     * boundary — enough that a new compaction would actually advance the boundary and free a
     * meaningful amount of context.
     */
    protected hasNewTurnsSinceCompaction(model: ChatModel): boolean {
        const requests = model.getRequests();
        const boundary = requests.findIndex(request => request.id === model.clientCompaction?.upToRequestId);
        if (boundary === -1) {
            // Boundary request no longer on the active branch (e.g. edited away): treat as not compacted.
            return false;
        }
        return requests.length - 1 - boundary > this.keepTurns();
    }

    protected estimateContextTokens(model: MutableChatModel): number {
        const requests = model.getRequests();
        for (let i = requests.length - 1; i >= 0; i--) {
            const response = requests[i].response;
            const entries = response.tokenUsageEntries;
            if (response.isComplete && entries.length > 0) {
                const last = entries[entries.length - 1];
                return (last.inputTokens ?? 0) + (last.outputTokens ?? 0);
            }
        }
        return 0;
    }

    /**
     * Performs a compaction: summarizes all requests except the most recent
     * {@link keepTurns} ones and records the result on the model.
     * Returns `true` when a new compaction record was stored.
     */
    async compact(model: MutableChatModel): Promise<boolean> {
        const requests = model.getRequests();
        const keepTurns = this.keepTurns();
        if (requests.length <= keepTurns) {
            return false;
        }
        const boundaryIndex = requests.length - 1 - keepTurns;
        // Already-covered requests must not be summarized again: resume from the previous boundary.
        const previous = model.clientCompaction;
        const previousBoundary = previous
            ? requests.findIndex(request => request.id === previous.upToRequestId)
            : -1;
        if (previousBoundary >= boundaryIndex) {
            // The boundary cannot advance: nothing new to compact.
            return false;
        }
        const startIndex = previousBoundary >= 0 ? previousBoundary + 1 : 0;

        const toCompact = requests.slice(startIndex, boundaryIndex + 1);
        if (toCompact.length === 0) {
            return false;
        }
        const summaryModel = await this.resolveSummaryModel();
        if (!summaryModel) {
            this.logger.warn('Client compaction skipped: no language model resolves for alias '
                + `'${COMPACTION_SUMMARY_MODEL_ALIAS}'.`);
            return false;
        }
        const previousSummary = startIndex > 0 && previous ? previous.summary : undefined;
        const summary = await this.summarize(summaryModel, toCompact.map(r => r.id), previousSummary, model);
        if (!summary.trim()) {
            this.logger.warn('Client compaction skipped: the summary model returned no text.');
            return false;
        }
        model.setClientCompaction({
            upToRequestId: toCompact[toCompact.length - 1].id,
            summary,
            createdAt: new Date().toISOString()
        });
        return true;
    }

    protected async resolveSummaryModel(): Promise<LanguageModel | undefined> {
        const registry = this.languageModelRegistry as LanguageModelRegistry & Partial<FrontendLanguageModelRegistry>;
        if (typeof registry.getReadyLanguageModel === 'function') {
            return registry.getReadyLanguageModel(COMPACTION_SUMMARY_MODEL_ALIAS);
        }
        const model = await registry.getLanguageModel(COMPACTION_SUMMARY_MODEL_ALIAS);
        return model?.status.status === 'ready' ? model : undefined;
    }

    protected async summarize(
        summaryModel: LanguageModel,
        requestIds: string[],
        previousSummary: string | undefined,
        model: ChatModel
    ): Promise<string> {
        const transcript = this.renderTranscript(model, requestIds, previousSummary);
        const request: UserRequest = {
            sessionId: `client-compaction-${model.id}`,
            requestId: crypto.randomUUID(),
            messages: [{
                actor: 'user',
                type: 'text',
                text: '请把下面的对话历史压缩成一份后续工作所需的交接摘要。用中文，按这些小节组织：'
                    + '\n1. 目标：用户想要完成什么'
                    + '\n2. 已完成：已经做了哪些修改（含文件路径）'
                    + '\n3. 关键决策与约定：技术选型、命名、用户偏好'
                    + '\n4. 未完成与下一步：还欠什么、被什么阻塞'
                    + '\n5. 重要上下文：错误信息、命令输出等继续工作必须知道的事实'
                    + '\n只保留对继续对话有用的信息，省略寒暄与重复。如果之前已有摘要，把新对话合并进各小节，输出完整的合并版。'
                    + '\n\n对话历史：\n' + transcript
            }]
        };
        const response = await this.languageModelService.sendRequest(summaryModel, request);
        if (isLanguageModelTextResponse(response)) {
            return response.text;
        }
        if (isLanguageModelParsedResponse(response)) {
            return response.content;
        }
        let text = '';
        for await (const part of response.stream) {
            if (isTextResponsePart(part)) {
                text += part.content;
            }
        }
        return text;
    }

    /** Renders the requests to compact as a plain-text transcript for the summarizer. */
    protected renderTranscript(model: ChatModel, requestIds: string[], previousSummary: string | undefined): string {
        const parts: string[] = [];
        if (previousSummary) {
            parts.push('[此前对话的摘要]\n' + previousSummary);
        }
        for (const request of model.getRequests()) {
            if (!requestIds.includes(request.id)) {
                continue;
            }
            const userText = request.message.parts.map(part => part.promptText).join('').trim();
            if (userText) {
                parts.push(`用户：${userText}`);
            }
            const responseText = request.response.response.content
                .map(content => content.asString?.() ?? content.asDisplayString?.() ?? '')
                .filter(text => text.trim().length > 0)
                .join('\n')
                .trim();
            if (responseText) {
                parts.push(`助手：${responseText}`);
            }
        }
        return parts.join('\n\n');
    }

    protected keepTurns(): number {
        return this.preferences.get<number>(CLIENT_COMPACTION_KEEP_TURNS_PREFERENCE, 4);
    }
}

/**
 * The message representing a compaction record when history is sent to a language model.
 * Kept as an ordinary text message so every provider works without special handling.
 */
export function clientCompactionToMessage(record: ClientCompactionRecord): LanguageModelMessage {
    return {
        actor: 'user',
        type: 'text',
        text: `[此前的对话已压缩为摘要（截至 ${record.createdAt}）]\n${record.summary}`
    };
}
