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
import * as sinon from 'sinon';
import { Container } from '@theia/core/shared/inversify';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { ChatAgentService } from './chat-agent-service';
import { ChatSessionStore } from './chat-session-store';
import { ChatContentDeserializerRegistry } from './chat-content-deserializer';
import { ChangeSetElementDeserializerRegistry } from './change-set-element-deserializer';
import { ToolInvocationRegistry, AIVariableService } from '@theia/ai-core';
import { ILogger } from '@theia/core';
import { ChatRequestParser } from './chat-request-parser';
import { ChatAgent, ChatAgentLocation } from './chat-agents';
import { MutableChatRequestModel } from './chat-model';
import { ChatServiceImpl } from './chat-service';

disableJSDOM();

describe('ChatServiceImpl request queue', () => {

    let chatService: ChatServiceImpl;
    let invokeCount: number;
    /** One gate per agent invocation; resolve gates[i] to let the i-th request finish. */
    let gates: Deferred<void>[];
    let queueEvents: string[];

    beforeEach(() => {
        invokeCount = 0;
        gates = [];
        queueEvents = [];

        const agent = {
            id: 'queue-test-agent',
            name: 'QueueTestAgent',
            description: '',
            variables: [],
            prompts: [],
            languageModelRequirements: [],
            tags: [],
            functions: [],
            locations: [ChatAgentLocation.Panel],
            invoke: async (request: MutableChatRequestModel) => {
                const gate = gates[invokeCount] ?? (gates[invokeCount] = new Deferred<void>());
                invokeCount++;
                await gate.promise;
                request.response.response.addContent({
                    kind: 'text',
                    asString: () => 'done'
                } as never);
                request.response.complete();
            }
        } as unknown as ChatAgent;

        const mockAgentService = {
            getAgent: sinon.stub().returns(agent),
            getAgents: sinon.stub().returns([agent]),
            resolveAgent: sinon.stub().returns(agent)
        } as unknown as sinon.SinonStubbedInstance<ChatAgentService>;

        const mockRequestParser = {
            parseChatRequest: sinon.stub().callsFake(async (request: { text: string }) => ({
                request,
                parts: [],
                toolRequests: new Map(),
                variables: []
            }))
        } as unknown as sinon.SinonStubbedInstance<ChatRequestParser>;

        const container = new Container();
        container.bind(ChatServiceImpl).toSelf().inSingletonScope();
        container.bind(ChatAgentService).toConstantValue(mockAgentService);
        container.bind(ChatSessionStore).toConstantValue({
            storeSessions: sinon.stub().resolves(),
            readSession: sinon.stub().resolves(undefined),
            deleteSession: sinon.stub().resolves(),
            getSessionIndex: sinon.stub().resolves({}),
            hasPersistedSessions: sinon.stub().resolves(false)
        } as unknown as ChatSessionStore);
        container.bind(ChatContentDeserializerRegistry).toConstantValue({
            deserialize: sinon.stub().resolves([])
        } as unknown as ChatContentDeserializerRegistry);
        container.bind(ChangeSetElementDeserializerRegistry).toConstantValue({
            deserialize: sinon.stub().resolves([])
        } as unknown as ChangeSetElementDeserializerRegistry);
        container.bind(ToolInvocationRegistry).toConstantValue({
            getFunction: sinon.stub().returns(undefined)
        } as unknown as ToolInvocationRegistry);
        container.bind(AIVariableService).toConstantValue({
            resolveVariable: sinon.stub().resolves(undefined)
        } as unknown as AIVariableService);
        container.bind(ChatRequestParser).toConstantValue(mockRequestParser);
        container.bind(ILogger).toConstantValue({
            debug: () => { }, info: () => { }, warn: () => { }, error: () => { }
        } as unknown as ILogger);

        chatService = container.get(ChatServiceImpl);
        chatService.onDidChangeQueuedRequests(({ sessionId }) => queueEvents.push(sessionId));
    });

    function newSession(): string {
        return chatService.createSession().id;
    }

    it('sends directly when the session is idle', async () => {
        const sessionId = newSession();
        await chatService.sendRequest(sessionId, { text: 'first' });
        expect(invokeCount).to.equal(1);
        expect(chatService.getQueuedRequests(sessionId)).to.be.empty;
    });

    it('queues a second message while one is in progress instead of cancelling it', async () => {
        const sessionId = newSession();
        await chatService.sendRequest(sessionId, { text: 'first' });
        await chatService.sendRequest(sessionId, { text: 'second' });

        expect(invokeCount).to.equal(1);
        const queued = chatService.getQueuedRequests(sessionId);
        expect(queued).to.have.lengthOf(1);
        expect(queued[0].request.text).to.equal('second');
        // The first request is still in progress, not cancelled.
        expect(chatService.getSession(sessionId)!.model.getRequests()[0].response.isCanceled).to.be.false;
    });

    it('drains the queue in FIFO order when the running request completes', async () => {
        const sessionId = newSession();
        const firstInvocation = await chatService.sendRequest(sessionId, { text: 'first' });
        await chatService.sendRequest(sessionId, { text: 'second' });
        await chatService.sendRequest(sessionId, { text: 'third' });
        expect(invokeCount).to.equal(1);

        gates[0].resolve();
        await firstInvocation!.responseCompleted;
        // Drain is asynchronous; let the microtask queue settle.
        await new Promise(resolve => setTimeout(resolve, 20));

        expect(invokeCount).to.equal(2);
        expect(chatService.getQueuedRequests(sessionId)).to.have.lengthOf(1);

        gates[1].resolve();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(invokeCount).to.equal(3);
        expect(chatService.getQueuedRequests(sessionId)).to.be.empty;
    });

    it('removes a cancelled queue entry without sending it', async () => {
        const sessionId = newSession();
        const firstInvocation = await chatService.sendRequest(sessionId, { text: 'first' });
        await chatService.sendRequest(sessionId, { text: 'to-be-cancelled' });
        const entryId = chatService.getQueuedRequests(sessionId)[0].id;

        expect(chatService.cancelQueuedRequest(sessionId, entryId)).to.be.true;
        expect(chatService.getQueuedRequests(sessionId)).to.be.empty;

        gates[0].resolve();
        await firstInvocation!.responseCompleted;
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(invokeCount).to.equal(1);
    });

    it('caps the queue and drops messages beyond the limit', async () => {
        const sessionId = newSession();
        await chatService.sendRequest(sessionId, { text: 'first' });
        for (let i = 0; i < 12; i++) {
            await chatService.sendRequest(sessionId, { text: `overflow ${i}` });
        }
        expect(chatService.getQueuedRequests(sessionId)).to.have.lengthOf(10);
    });

    it('clears queued messages when the session is deleted', async () => {
        const sessionId = newSession();
        await chatService.sendRequest(sessionId, { text: 'first' });
        await chatService.sendRequest(sessionId, { text: 'second' });
        expect(chatService.getQueuedRequests(sessionId)).to.have.lengthOf(1);

        await chatService.deleteSession(sessionId);
        expect(chatService.getQueuedRequests(sessionId)).to.be.empty;
    });
});
