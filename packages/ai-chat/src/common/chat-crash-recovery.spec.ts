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
import { ILogger } from '@theia/core';
import { ChatAgentService } from './chat-agent-service';
import { ChatSessionStore } from './chat-session-store';
import { ChatContentDeserializerRegistry } from './chat-content-deserializer';
import { ChangeSetElementDeserializerRegistry } from './change-set-element-deserializer';
import { ToolInvocationRegistry, AIVariableService } from '@theia/ai-core';
import { ChatRequestParser } from './chat-request-parser';
import { MarkdownChatResponseContentImpl, MutableChatModel } from './chat-model';
import { ChatServiceImpl } from './chat-service';

disableJSDOM();

describe('ChatServiceImpl crash recovery', () => {

    let chatService: ChatServiceImpl;
    let stored: Array<{ hasInterrupted?: boolean; title?: string; model: MutableChatModel }>;

    beforeEach(() => {
        stored = [];

        const container = new Container();
        container.bind(ChatServiceImpl).toSelf().inSingletonScope();
        container.bind(ChatAgentService).toConstantValue({
            getAgent: sinon.stub().returns(undefined),
            getAgents: sinon.stub().returns([]),
            resolveAgent: sinon.stub().returns(undefined)
        } as unknown as ChatAgentService);
        container.bind(ChatSessionStore).toConstantValue({
            storeSessions: async (...sessions: Array<{ hasInterrupted?: boolean; title?: string; model: MutableChatModel }>) => {
                stored.push(...sessions);
            },
            readSession: sinon.stub().resolves(undefined),
            deleteSession: sinon.stub().resolves(),
            getSessionIndex: sinon.stub().resolves({}),
            hasPersistedSessions: sinon.stub().resolves(false)
        } as unknown as ChatSessionStore);
        container.bind(ChatContentDeserializerRegistry).toConstantValue({
            deserialize: sinon.stub().callsFake(async () => new MarkdownChatResponseContentImpl('部分回答'))
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
        container.bind(ChatRequestParser).toConstantValue({
            parseChatRequest: sinon.stub().resolves({ parts: [], toolRequests: [], variables: [] })
        } as unknown as ChatRequestParser);
        container.bind(ILogger).toConstantValue({
            debug: () => { }, info: () => { }, warn: () => { }, error: () => { }
        } as unknown as ILogger);

        chatService = container.get(ChatServiceImpl);
    });

    function addRequest(sessionId: string, text: string): ReturnType<MutableChatModel['getRequest']> {
        const session = chatService.getSession(sessionId)!;
        const request = session.model.addRequest({
            request: { text },
            parts: [],
            toolRequests: new Map(),
            variables: []
        });
        request.response.response.addContent(new MarkdownChatResponseContentImpl('部分回答'));
        return request;
    }

    it('flags a session saved while a request is running as interrupted', async () => {
        const sessionId = chatService.createSession().id;
        const request = addRequest(sessionId, '进行中的问题')!;
        // Response left incomplete, like a crash mid-stream.

        await chatService['saveSession'](sessionId);
        expect(stored).to.have.lengthOf(1);
        expect(stored[0].hasInterrupted).to.be.true;
        request.response.complete();
    });

    it('does not flag sessions whose last request completed', async () => {
        const sessionId = chatService.createSession().id;
        addRequest(sessionId, '已完成的问题')!.response.complete();

        await chatService['saveSession'](sessionId);
        expect(stored[0].hasInterrupted).to.be.false;
    });

    it('marks interrupted responses when restoring a crashed session', async () => {
        const sessionId = chatService.createSession().id;
        const request = addRequest(sessionId, '被中断的问题')!;
        await chatService['saveSession'](sessionId);
        expect(stored).to.have.lengthOf(1);

        // Serialize while the response is still running, as the crash-time auto-save would have.
        const serialized = {
            version: 1,
            title: stored[0]!.title,
            saveDate: Date.now(),
            hasInterrupted: true,
            model: stored[0]!.model.toSerializable()
        };

        // Drop the in-memory session so the restore path reads from the store, as after a crash.
        // (Deleting also cancels the in-flight request, so the serialized data was taken above.)
        await chatService.deleteSession(sessionId);
        (chatService as unknown as { sessionStore: ChatSessionStore }).sessionStore = {
            storeSessions: sinon.stub().resolves(),
            readSession: sinon.stub().resolves(serialized),
            deleteSession: sinon.stub().resolves(),
            getSessionIndex: sinon.stub().resolves({}),
            hasPersistedSessions: sinon.stub().resolves(false)
        } as unknown as ChatSessionStore;

        const restored = await chatService.getOrRestoreSession(sessionId);
        expect(restored).to.not.be.undefined;
        const restoredRequest = restored!.model.getRequests().at(-1)!;
        expect(restoredRequest.response.isComplete).to.be.true;
        const text = restoredRequest.response.response.content
            .map(content => (content as { asDisplayString?: () => string }).asDisplayString?.()
                ?? (content as { content?: { value: string } }).content?.value ?? '')
            .join('\n');
        expect(text).to.contain('部分回答');
        expect(text).to.contain('会话在此处被中断');
        expect(text).to.contain('重新发送');
        request.response.complete();
    });

    it('does not mark anything when the session ended cleanly', async () => {
        const sessionId = chatService.createSession().id;
        addRequest(sessionId, '已完成的问题')!.response.complete();
        await chatService['saveSession'](sessionId);
        expect(stored).to.have.lengthOf(1);
        // Drop the in-memory session so the restore path reads from the store.
        await chatService.deleteSession(sessionId);

        const serialized = {
            version: 1,
            title: stored[0]!.title,
            saveDate: Date.now(),
            hasInterrupted: false,
            model: stored[0]!.model.toSerializable()
        };
        (chatService as unknown as { sessionStore: ChatSessionStore }).sessionStore = {
            storeSessions: sinon.stub().resolves(),
            readSession: sinon.stub().resolves(serialized),
            deleteSession: sinon.stub().resolves(),
            getSessionIndex: sinon.stub().resolves({}),
            hasPersistedSessions: sinon.stub().resolves(false)
        } as unknown as ChatSessionStore;

        const restored = await chatService.getOrRestoreSession(sessionId);
        const text = restored!.model.getRequests().at(-1)!.response.response.content
            .map(content => (content as { asDisplayString?: () => string }).asDisplayString?.()
                ?? (content as { content?: { value: string } }).content?.value ?? '')
            .join('\n');
        expect(text).to.not.contain('中断');
    });
});
