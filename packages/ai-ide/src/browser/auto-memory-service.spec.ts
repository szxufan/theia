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

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { expect } from 'chai';
import { URI, Emitter } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { PreferenceService } from '@theia/core/lib/common/preferences';
import { ILogger } from '@theia/core';
import {
    LanguageModel, LanguageModelRegistry, LanguageModelResponse, LanguageModelService
} from '@theia/ai-core/lib/common';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceMetadataStorageService } from '@theia/workspace/lib/browser/metadata-storage';
import { ChatService } from '@theia/ai-chat/lib/common/chat-service';
import { ChatSessionStatus } from '@theia/ai-chat/lib/common/chat-model';
import { ChatSession } from '@theia/ai-chat/lib/common/chat-service';
import { AutoMemoryService } from './auto-memory-service';

disableJSDOM();

describe('AutoMemoryService', () => {

    let service: AutoMemoryService;
    let files: Map<string, string>;
    let modelResponses: string[];
    let enabled: boolean;
    let session: {
        id: string;
        model: {
            status: ChatSessionStatus;
            getRequests: () => Array<{ message: { parts: Array<{ promptText: string }> }; response: { isComplete: boolean; response: { content: Array<{ asString?: () => string }> } } }>;
            onDidChange: (listener: (event: { kind: string }) => void) => { dispose: () => void };
        };
    };

    beforeEach(() => {
        files = new Map();
        modelResponses = [];
        enabled = true;

        const summaryModel = {
            id: 'summary-model', vendor: 'openai', status: { status: 'ready' },
            request: async () => { throw new Error('not expected'); }
        } as unknown as LanguageModel;

        const modelChangeEmitter = new Emitter<{ kind: string }>();

        session = {
            id: 'session-id-1',
            model: {
                status: 'idle',
                getRequests: () => [{
                    message: { parts: [{ promptText: '请始终使用 pnpm' }] },
                    response: { isComplete: true, response: { content: [{ asString: () => '好的，记住了。' }] } }
                }],
                onDidChange: modelChangeEmitter.event as never
            }
        };

        const chatService = {
            getSessions: () => [session],
            getSession: (id: string) => id === session.id ? session as unknown as ChatSession : undefined,
            onSessionEvent: () => ({ dispose: () => { } })
        } as unknown as ChatService;

        const container = new Container();
        container.bind(ChatService).toConstantValue(chatService);
        container.bind(LanguageModelService).toConstantValue({
            sendRequest: async (_m: LanguageModel, request: { messages: Array<{ text: string }> }) => {
                modelResponses.push(request.messages[0].text);
                return { text: '- 本项目一律使用 pnpm\n- 嗯\n- x\n' } as unknown as LanguageModelResponse;
            }
        } as unknown as LanguageModelService);
        container.bind(LanguageModelRegistry).toConstantValue({
            getReadyLanguageModel: (id: string) => id === 'default/summarize' ? summaryModel : undefined
        } as unknown as LanguageModelRegistry);
        container.bind(FileService).toConstantValue({
            writeFile: async (uri: URI, buffer: { toString: () => string }) => {
                files.set(uri.toString(), buffer.toString());
            },
            readFile: async (uri: URI) => {
                if (!files.has(uri.toString())) {
                    throw new Error('not found: ' + uri.toString());
                }
                return { value: Buffer.from(files.get(uri.toString())!, 'utf8') };
            }
        } as unknown as FileService);
        container.bind(WorkspaceMetadataStorageService).toConstantValue({
            getOrCreateStore: async () => ({
                location: new URI('file:///metadata/memory'),
                ensureExists: async () => { }
            })
        } as unknown as WorkspaceMetadataStorageService);
        container.bind(PreferenceService).toConstantValue({
            get: (name: string, defaultValue: unknown) => name === 'ai-features.autoMemory.enabled' ? enabled : defaultValue
        } as unknown as PreferenceService);
        container.bind(ILogger).toConstantValue({
            debug: () => { }, info: () => { }, warn: () => { }, error: () => { }
        } as unknown as ILogger);
        container.bind(AutoMemoryService).toSelf();

        service = container.get(AutoMemoryService);
        // Short delay so the tests do not wait 30 seconds.
        (service as unknown as { idleDelayMs: number }).idleDelayMs = 5;
    });

    const factsUri = new URI('file:///metadata/memory').resolve('wiki/自动记忆.md').toString();
    const indexUri = new URI('file:///metadata/memory').resolve('wiki/index.md').toString();

    async function settle(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 25));
    }

    it('extracts facts on idle and writes them to the wiki with an index link', async () => {
        (session.model as unknown as { status: string }).status = 'running';
        (session.model.onDidChange as unknown as (l: (e: { kind: string }) => void) => void)(() => { });
        // Simulate the status change to idle through the tracked listener: re-init tracking is
        // done in init(); instead call the handler directly.
        service['trackSession'](session.id);
        (session.model as unknown as { status: string }).status = 'idle';
        service['onModelChanged'](session.id, { kind: 'statusChanged' } as never);

        await settle();
        await service.extractFromSession(session.id); // directly for determinism
        await settle();

        expect(modelResponses.length).to.be.at.least(1);
        expect(files.get(factsUri)).to.contain('本项目一律使用 pnpm');
        expect(files.get(factsUri)).to.not.contain('- 嗯');
        expect(files.get(indexUri)).to.contain('[自动记忆](自动记忆.md)');
    });

    it('skips extraction while disabled', async () => {
        enabled = false;
        await service.extractFromSession(session.id);
        expect(modelResponses).to.be.empty;
        expect(files.size).to.equal(0);
    });

    it('deduplicates facts across extractions', async () => {
        await service.extractFromSession(session.id);
        // A second session with the same facts must not append them again.
        (service as unknown as { extractedSessions: Set<string> }).extractedSessions.clear();
        await service.extractFromSession(session.id);
        const content = files.get(factsUri)!;
        expect(content.match(/本项目一律使用 pnpm/g)?.length).to.equal(1);
    });

    it('parses only plausible fact lines', () => {
        const facts = service['parseFacts']('- 合理长度的事实\n* 也支持星号\n太短\n' + 'x'.repeat(400) + '\n- 另一条事实\n');
        expect(facts).to.deep.equal(['合理长度的事实', '也支持星号', '另一条事实']);
    });
});
