// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-v2.0.
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
import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
enableJSDOM();
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { URI, MessageService } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { MutableChatModel } from '@theia/ai-chat';
import { ChangeSetElement, ChangeSetImpl } from '@theia/ai-chat/lib/common/change-set';
import { ChatRequest } from '@theia/ai-chat/lib/common/chat-model';
import { ChatService } from '@theia/ai-chat/lib/common/chat-service';
import { ParsedChatRequest, ParsedChatRequestTextPart } from '@theia/ai-chat/lib/common/parsed-chat-request';
import { SessionRollbackService } from '@theia/ai-chat/lib/browser/session-rollback-service';
import { ResponseNode } from './chat-tree-view';
import { RollbackChatNodeToolbarContribution } from './rollback-chat-node-toolbar-contribution';

function createParsedRequest(text: string): ParsedChatRequest {
    return {
        request: { text } as ChatRequest,
        parts: [new ParsedChatRequestTextPart({ start: 0, endExclusive: text.length }, text)],
        toolRequests: new Map(),
        variables: []
    };
}

function element(path: string): ChangeSetElement {
    return { uri: new URI('file:///workspace/' + path), type: 'modify', state: 'applied' } as unknown as ChangeSetElement;
}

describe('RollbackChatNodeToolbarContribution', () => {

    let contribution: RollbackChatNodeToolbarContribution;
    let model: MutableChatModel;
    let requestId: string;

    beforeEach(() => {
        model = new MutableChatModel();
        const container = new Container();
        container.bind(ChatService).toConstantValue({
            getSession: (id: string) => id === 'session-1' ? { model } : undefined
        } as unknown as ChatService);
        container.bind(SessionRollbackService).toConstantValue({} as unknown as SessionRollbackService);
        container.bind(MessageService).toConstantValue({ info: () => { }, warn: () => { } } as unknown as MessageService);
        container.bind(RollbackChatNodeToolbarContribution).toSelf();
        contribution = container.get(RollbackChatNodeToolbarContribution);
    });

    function responseNode(): ResponseNode {
        return { response: { requestId }, sessionId: 'session-1' } as unknown as ResponseNode;
    }

    it('shows the rollback action for a response whose request recorded file changes', () => {
        const request = model.addRequest(createParsedRequest('r1'));
        request.changeSet = new ChangeSetImpl([element('a.txt')]);
        requestId = request.id;

        const actions = contribution.getToolbarActions(responseNode());
        expect(actions).to.have.lengthOf(1);
        expect(actions[0].commandId).to.equal('chat:rollbackToBeforeRequest');
    });

    it('shows the rollback action when a later request in the session recorded file changes', () => {
        const request = model.addRequest(createParsedRequest('r1'));
        model.addRequest(createParsedRequest('r2')).changeSet = new ChangeSetImpl([element('b.txt')]);
        requestId = request.id;

        expect(contribution.getToolbarActions(responseNode())).to.have.lengthOf(1);
    });

    it('hides the rollback action for requests without any recorded file changes', () => {
        const request = model.addRequest(createParsedRequest('r1'));
        requestId = request.id;

        expect(contribution.getToolbarActions(responseNode())).to.be.empty;
    });

    it('hides the rollback action for unknown sessions', () => {
        const request = model.addRequest(createParsedRequest('r1'));
        request.changeSet = new ChangeSetImpl([element('a.txt')]);

        const node = { response: { requestId: request.id }, sessionId: 'unknown' } as unknown as ResponseNode;
        expect(contribution.getToolbarActions(node)).to.be.empty;
    });

    it('never contributes actions for request nodes', () => {
        const request = model.addRequest(createParsedRequest('r1'));
        request.changeSet = new ChangeSetImpl([element('a.txt')]);

        expect(contribution.getToolbarActions({ request } as never)).to.be.empty;
    });
});
