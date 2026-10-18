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

import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { Emitter, Event, ILogger, URI } from '@theia/core';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { PreferenceService } from '@theia/core/lib/common/preferences';
import { inject, injectable, named, postConstruct } from '@theia/core/shared/inversify';
import {
    FrontendLanguageModelRegistry, isLanguageModelParsedResponse, isLanguageModelTextResponse, isTextResponsePart,
    LanguageModel, LanguageModelRegistry, LanguageModelService, UserRequest
} from '@theia/ai-core/lib/common';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceMetadataStorageService } from '@theia/workspace/lib/browser/metadata-storage';
import { ChatService } from '@theia/ai-chat/lib/common/chat-service';
import { ChatChangeEvent } from '@theia/ai-chat/lib/common/chat-model';
import { MEMORY_METADATA_STORE_KEY } from './memory-directory-variable-contribution';
import { AUTO_MEMORY_ENABLED_PREFERENCE } from '../common/ai-ide-preferences';

/** Model alias used for fact extraction; the same small model as session summaries. */
export const AUTO_MEMORY_MODEL_ALIAS = 'default/summarize';

const FACTS_FILE = 'wiki/自动记忆.md';
const INDEX_FILE = 'wiki/index.md';
const HASHES_FILE = 'wiki/.auto-memory-hashes.json';
const INDEX_LINK = '* [自动记忆](自动记忆.md)';

/**
 * Compiles durable knowledge out of finished chat sessions into the workspace's memory
 * directory (the same wiki the interactive memory capability maintains): once a session has
 * been idle for a while, one extraction request asks the summary model for durable facts,
 * which are appended (hash-deduplicated) to `wiki/自动记忆.md` and linked from `wiki/index.md`.
 *
 * Disabled by default; enable through `ai-features.autoMemory.enabled`.
 */
@injectable()
export class AutoMemoryService implements FrontendApplicationContribution {

    /** Waiting period after a session goes idle before extraction starts. Overridable for tests. */
    protected idleDelayMs = 30_000;

    protected readonly extractedSessions = new Set<string>();
    protected readonly scheduled = new Map<string, ReturnType<typeof setTimeout>>();
    protected readonly onDidExtractEmitter = new Emitter<{ sessionId: string; newFacts: string[] }>();
    readonly onDidExtract: Event<{ sessionId: string; newFacts: string[] }> = this.onDidExtractEmitter.event;

    @inject(ChatService)
    protected readonly chatService: ChatService;

    @inject(LanguageModelService)
    protected readonly languageModelService: LanguageModelService;

    @inject(LanguageModelRegistry)
    protected readonly languageModelRegistry: LanguageModelRegistry;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(WorkspaceMetadataStorageService)
    protected readonly metadataStorageService: WorkspaceMetadataStorageService;

    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    @inject(ILogger) @named('ai-ide:AutoMemoryService')
    protected readonly logger: ILogger;

    onStart(): void {
        // Wiring happens in @postConstruct; the contribution is only the registration vehicle.
    }

    @postConstruct()
    protected init(): void {
        this.chatService.onSessionEvent(event => {
            if (event.type === 'created') {
                this.trackSession(event.sessionId);
            }
        });
        for (const session of this.chatService.getSessions()) {
            this.trackSession(session.id);
        }
    }

    protected trackSession(sessionId: string): void {
        const session = this.chatService.getSession(sessionId);
        if (!session || session.parentSessionId !== undefined) {
            // Delegated child sessions carry fragments of the parent's task; the parent is
            // tracked as a whole.
            return;
        }
        session.model.onDidChange(change => this.onModelChanged(sessionId, change));
    }

    protected onModelChanged(sessionId: string, change: ChatChangeEvent): void {
        if (change.kind !== 'statusChanged') {
            return;
        }
        if (!this.isEnabled() || this.extractedSessions.has(sessionId)) {
            return;
        }
        const session = this.chatService.getSession(sessionId);
        if (!session || session.model.status !== 'idle') {
            return;
        }
        this.scheduleExtraction(sessionId);
    }

    protected scheduleExtraction(sessionId: string): void {
        if (this.scheduled.has(sessionId)) {
            return;
        }
        const handle = setTimeout(() => {
            this.scheduled.delete(sessionId);
            this.extractFromSession(sessionId).catch(error =>
                this.logger.warn('Auto memory extraction failed.', error));
        }, this.idleDelayMs);
        this.scheduled.set(sessionId, handle);
    }

    protected isEnabled(): boolean {
        return this.preferences.get<boolean>(AUTO_MEMORY_ENABLED_PREFERENCE, false);
    }

    async extractFromSession(sessionId: string): Promise<void> {
        if (!this.isEnabled()) {
            return;
        }
        const session = this.chatService.getSession(sessionId);
        if (!session || this.extractedSessions.has(sessionId)) {
            return;
        }
        this.extractedSessions.add(sessionId);
        const transcript = this.renderTranscript(session);
        if (!transcript) {
            return;
        }
        const model = await this.resolveModel();
        if (!model) {
            this.logger.warn(`Auto memory skipped: no model resolves for '${AUTO_MEMORY_MODEL_ALIAS}'.`);
            return;
        }
        const raw = await this.requestFacts(model, transcript);
        const facts = this.parseFacts(raw);
        const newFacts = await this.persistFacts(sessionId, facts);
        if (newFacts.length > 0) {
            this.onDidExtractEmitter.fire({ sessionId, newFacts });
        }
    }

    protected renderTranscript(session: { model: { getRequests(): Array<{ message: { parts: Array<{ promptText: string }> }; response: { isComplete: boolean; response: { content: Array<{ asString?: () => string | undefined }> } } }> } }): string {
        const parts: string[] = [];
        for (const request of session.model.getRequests()) {
            if (!request.response.isComplete) {
                continue;
            }
            const userText = request.message.parts.map(part => part.promptText).join('').trim();
            const assistantText = request.response.response.content
                .map(content => content.asString?.() ?? '')
                .filter(text => text.trim().length > 0)
                .join('\n')
                .trim();
            if (userText) {
                parts.push(`用户：${userText}`);
            }
            if (assistantText) {
                parts.push(`助手：${assistantText}`);
            }
        }
        // Cap the transcript so a very long session cannot blow up the extraction request.
        return parts.join('\n\n').substring(0, 20_000);
    }

    protected async resolveModel(): Promise<LanguageModel | undefined> {
        const registry = this.languageModelRegistry as LanguageModelRegistry & Partial<FrontendLanguageModelRegistry>;
        if (typeof registry.getReadyLanguageModel === 'function') {
            return registry.getReadyLanguageModel(AUTO_MEMORY_MODEL_ALIAS);
        }
        const model = await registry.getLanguageModel(AUTO_MEMORY_MODEL_ALIAS);
        return model?.status.status === 'ready' ? model : undefined;
    }

    protected async requestFacts(model: LanguageModel, transcript: string): Promise<string> {
        const request: UserRequest = {
            sessionId: 'auto-memory',
            requestId: crypto.randomUUID(),
            messages: [{
                actor: 'user',
                type: 'text',
                text: '从下面的对话中提取“值得长期记住的事实”：关于这个项目的工作方式、用户偏好、约定、环境特性、明确的技术决策。' +
                    '每条事实一行，以 "- " 开头，用中文，直接了当，不要客套。' +
                    '只输出对未来任务有用的事实；没有可提取的内容就输出空。忽略一次性细节、报错原文、与项目无关的闲聊。\n\n' +
                    transcript
            }]
        };
        const response = await this.languageModelService.sendRequest(model, request);
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

    /** Parses the model output into fact lines, dropping empties and over-long lines. */
    protected parseFacts(raw: string): string[] {
        return raw.split('\n')
            .map(line => line.replace(/^\s*[-*]\s*/, '').trim())
            .filter(line => line.length >= 4 && line.length <= 300);
    }

    protected hashFact(fact: string): string {
        let hash = 5381;
        for (let i = 0; i < fact.length; i++) {
            hash = ((hash << 5) + hash + fact.charCodeAt(i)) | 0;
        }
        return (hash >>> 0).toString(36);
    }

    protected async persistFacts(sessionId: string, facts: string[]): Promise<string[]> {
        if (facts.length === 0) {
            return [];
        }
        const root = await this.memoryDirectory();
        if (!root) {
            return [];
        }
        const hashes = await this.readHashes(root);
        const fresh = facts.filter(fact => !hashes.includes(this.hashFact(fact)));
        if (fresh.length === 0) {
            return [];
        }
        for (const fact of fresh) {
            hashes.push(this.hashFact(fact));
        }
        const factsFile = root.resolve(FACTS_FILE);
        const previous = await this.readText(factsFile);
        const section = `\n\n## ${new Date().toISOString().substring(0, 10)}（会话 ${sessionId.substring(0, 8)}）\n\n`
            + fresh.map(fact => `- ${fact}`).join('\n') + '\n';
        const content = (previous?.trim()
            ? previous.trimEnd() + section
            : '# 自动记忆\n\n由 AutoMemoryService 在会话结束后自动提取。' + section);
        await this.fileService.writeFile(factsFile, BinaryBuffer.fromString(content));
        await this.fileService.writeFile(root.resolve(HASHES_FILE), BinaryBuffer.fromString(JSON.stringify(hashes)));

        // Keep the wiki index aware of the auto-memory article so the interactive memory
        // capability's "read wiki/index.md first" flow finds it.
        const indexFile = root.resolve(INDEX_FILE);
        const index = await this.readText(indexFile);
        if (index === undefined) {
            await this.fileService.writeFile(indexFile, BinaryBuffer.fromString('# 记忆索引\n\n' + INDEX_LINK + '\n'));
        } else if (!index.includes(INDEX_LINK)) {
            await this.fileService.writeFile(indexFile, BinaryBuffer.fromString(index.trimEnd() + '\n' + INDEX_LINK + '\n'));
        }
        return fresh;
    }

    protected async memoryDirectory(): Promise<URI | undefined> {
        try {
            const store = await this.metadataStorageService.getOrCreateStore(MEMORY_METADATA_STORE_KEY);
            await store.ensureExists();
            return store.location;
        } catch {
            return undefined;
        }
    }

    protected async readText(uri: URI): Promise<string | undefined> {
        try {
            return (await this.fileService.readFile(uri)).value.toString();
        } catch {
            return undefined;
        }
    }

    protected async readHashes(root: URI): Promise<string[]> {
        const raw = await this.readText(root.resolve(HASHES_FILE));
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(hash => typeof hash === 'string') : [];
        } catch {
            return [];
        }
    }
}
