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

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import {
    LanguageModel, LanguageModelRegistry, LanguageModelResponse, LanguageModelService
} from '@theia/ai-core/lib/common';
import { PreferenceService } from '@theia/core/lib/common/preferences';
import { ILogger } from '@theia/core/lib/common/logger';
import { ChatAgentLocation } from './chat-agents';
import { MutableChatModel } from './chat-model';
import { ParsedChatRequest, ParsedChatRequestTextPart } from './parsed-chat-request';
import { ClientCompactionService, clientCompactionToMessage } from './client-compaction';

describe('ClientCompactionService', () => {

    let service: ClientCompactionService;
    let model: MutableChatModel;
    let preferences: Map<string, unknown>;
    let summaryModelRequests: Array<{ text: string }>;

    const languageModel = {
        id: 'local-model',
        vendor: 'ollama',
        maxInputTokens: 1000,
        status: { status: 'ready' },
        request: async () => { throw new Error('not expected'); }
    } as unknown as LanguageModel;

    function createParsedRequest(text: string): ParsedChatRequest {
        return {
            request: { text },
            parts: [new ParsedChatRequestTextPart({ start: 0, endExclusive: text.length }, text)],
            toolRequests: new Map(),
            variables: []
        };
    }

    function addTurn(userText: string, aiText: string, inputTokens: number, outputTokens: number): void {
        const request = model.addRequest(createParsedRequest(userText));
        request.response.response.addContent({
            asString: () => aiText,
            kind: 'text'
        } as never);
        request.response.setTokenUsage({ inputTokens, outputTokens });
        request.response.complete();
    }

    beforeEach(() => {
        model = new MutableChatModel(ChatAgentLocation.Panel);
        preferences = new Map();
        summaryModelRequests = [];

        const summaryModel = {
            id: 'summary-model',
            vendor: 'openai',
            status: { status: 'ready' },
            request: async () => { throw new Error('not expected'); }
        } as unknown as LanguageModel;

        const container = new Container();
        container.bind(LanguageModelService).toConstantValue({
            sendRequest: async (_m: LanguageModel, request: { messages: Array<{ text: string }> }) => {
                summaryModelRequests.push({ text: request.messages[0].text });
                return { text: '这是压缩后的摘要。' } as unknown as LanguageModelResponse;
            }
        } as unknown as LanguageModelService);
        container.bind(LanguageModelRegistry).toConstantValue({
            getReadyLanguageModel: (id: string) => id === 'default/summarize' ? summaryModel : undefined
        } as unknown as LanguageModelRegistry);
        container.bind(PreferenceService).toConstantValue({
            get: (name: string, defaultValue: unknown) => preferences.get(name) ?? defaultValue
        } as unknown as PreferenceService);
        container.bind(ILogger).toConstantValue({
            debug: () => { }, info: () => { }, warn: () => { }, error: () => { }
        } as unknown as ILogger);
        container.bind(ClientCompactionService).toSelf();
        service = container.get(ClientCompactionService);
    });

    it('does not compact below the threshold', async () => {
        addTurn('hello', 'hi', 100, 20);
        expect(service.shouldCompact(model, languageModel)).to.be.false;
        expect(await service.maybeCompact(model, languageModel)).to.be.false;
        expect(model.clientCompaction).to.be.undefined;
    });

    it('compacts when the estimated context exceeds the threshold', async () => {
        for (let i = 0; i < 8; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 900, 50);
        }
        expect(service.shouldCompact(model, languageModel)).to.be.true;
        expect(await service.maybeCompact(model, languageModel)).to.be.true;

        const record = model.clientCompaction;
        expect(record).to.not.be.undefined;
        // 8 requests, keep last 4: the boundary is request index 3.
        expect(record!.upToRequestId).to.equal(model.getRequests()[3].id);
        expect(summaryModelRequests).to.have.lengthOf(1);
        // The transcript contains the compacted turns but not the kept ones.
        expect(summaryModelRequests[0].text).to.contain('question 0');
        expect(summaryModelRequests[0].text).to.contain('question 3');
        expect(summaryModelRequests[0].text).to.not.contain('question 4');
    });

    it('does not compact twice without new turns in between', async () => {
        for (let i = 0; i < 8; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 900, 50);
        }
        await service.maybeCompact(model, languageModel);
        await service.maybeCompact(model, languageModel);
        expect(summaryModelRequests).to.have.lengthOf(1);
    });

    it('compacts incrementally, merging the previous summary', async () => {
        for (let i = 0; i < 8; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 900, 50);
        }
        await service.maybeCompact(model, languageModel);
        for (let i = 8; i < 12; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 900, 50);
        }
        expect(await service.maybeCompact(model, languageModel)).to.be.true;
        expect(summaryModelRequests).to.have.lengthOf(2);
        // The second summarization starts from the previous summary and only covers new turns.
        expect(summaryModelRequests[1].text).to.contain('这是压缩后的摘要');
        expect(summaryModelRequests[1].text).to.not.contain('question 0');
        expect(model.clientCompaction!.upToRequestId).to.equal(model.getRequests()[7].id);
    });

    it('steps aside when the vendor has native server-side compaction enabled', async () => {
        const openaiModel = { ...languageModel, vendor: 'openai' } as LanguageModel;
        for (let i = 0; i < 8; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 90000, 50);
        }
        expect(await service.maybeCompact(model, openaiModel)).to.be.false;
        // Explicitly disabling server compaction in the session re-enables client compaction.
        expect(await service.maybeCompact(model, openaiModel, { compaction: { enabled: false } })).to.be.true;
    });

    it('can be disabled via preference', async () => {
        preferences.set('ai-features.chat.clientCompaction', false);
        for (let i = 0; i < 8; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 900, 50);
        }
        expect(await service.maybeCompact(model, languageModel)).to.be.false;
    });

    it('survives serialization round-trips', async () => {
        for (let i = 0; i < 8; i++) {
            addTurn(`question ${i}`, `answer ${i}`, 900, 50);
        }
        await service.maybeCompact(model, languageModel);
        const restored = new MutableChatModel(model.toSerializable());
        expect(restored.clientCompaction).to.deep.equal(model.clientCompaction);
    });

    it('renders the compaction record as a single user message', () => {
        const message = clientCompactionToMessage({
            upToRequestId: 'r1',
            summary: '早期对话的摘要内容',
            createdAt: '2026-10-18T00:00:00.000Z'
        });
        expect(message.actor).to.equal('user');
        expect(message.type).to.equal('text');
        expect((message as { text: string }).text).to.contain('早期对话的摘要内容');
    });
});
