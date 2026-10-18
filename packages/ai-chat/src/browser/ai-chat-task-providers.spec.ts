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
import { Container } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core';
import { ChatRequestInvocation, ChatService } from '../common';
import { BackgroundDelegationRegistry } from './background-delegation-registry';
import { DelegationTaskProvider, QueuedMessageTaskProvider } from './ai-chat-task-providers';

function invocation(): ChatRequestInvocation {
    return {
        requestCompleted: Promise.resolve({ id: 'req-1', session: { id: 'session-1' } } as never),
        responseCreated: Promise.resolve({} as never),
        responseCompleted: Promise.resolve({} as never)
    };
}

describe('AI 任务面板数据源', () => {

    describe('DelegationTaskProvider', () => {

        let provider: DelegationTaskProvider;
        let registry: BackgroundDelegationRegistry;
        let cancelled: { sessionId: string, requestId: string } | undefined;

        beforeEach(() => {
            registry = new BackgroundDelegationRegistry();
            cancelled = undefined;
            const container = new Container();
            container.bind(BackgroundDelegationRegistry).toConstantValue(registry);
            container.bind(ChatService).toConstantValue({
                cancelRequest: async (sessionId: string, requestId: string) => {
                    cancelled = { sessionId, requestId };
                }
            } as unknown as ChatService);
            container.bind(DelegationTaskProvider).toSelf();
            provider = container.get(DelegationTaskProvider);
        });

        it('lists delegations with state and result excerpt', () => {
            const entry = registry.create({ agentId: 'coder', sessionId: 'session-1', invocation: invocation() });
            registry.updateState(entry.taskId, 'completed', 'x'.repeat(300));

            const tasks = provider.listTasks();
            expect(tasks).to.have.lengthOf(1);
            expect(tasks[0].taskId).to.equal(entry.taskId);
            expect(tasks[0].kind).to.equal('delegation');
            expect(tasks[0].state).to.equal('completed');
            expect(tasks[0].detail).to.have.lengthOf(200);
        });

        it('stops a running delegation by cancelling its request', async () => {
            const entry = registry.create({ agentId: 'coder', sessionId: 'session-1', invocation: invocation() });
            expect(await provider.stopTask(entry.taskId)).to.be.true;
            expect(cancelled).to.deep.equal({ sessionId: 'session-1', requestId: 'req-1' });
            expect(registry.get(entry.taskId)!.state).to.equal('cancelled');
        });

        it('refuses to stop finished delegations', async () => {
            const entry = registry.create({ agentId: 'coder', sessionId: 'session-1', invocation: invocation() });
            registry.updateState(entry.taskId, 'completed');
            expect(await provider.stopTask(entry.taskId)).to.be.false;
        });

        it('exposes onDidChange from the registry', async () => {
            let fired = false;
            provider.onDidChange(() => { fired = true; });
            registry.create({ agentId: 'a', sessionId: 's', invocation: invocation() });
            expect(fired).to.be.true;
        });
    });

    describe('QueuedMessageTaskProvider', () => {

        let provider: QueuedMessageTaskProvider;
        let queue: { id: string, request: { text: string } }[];
        let cancelledEntry: string | undefined;
        let fireQueueChange: () => void;

        beforeEach(() => {
            queue = [{ id: 'q1', request: { text: '第二条消息' } }];
            cancelledEntry = undefined;
            const emitter = new Emitter<{ sessionId: string }>();
            fireQueueChange = () => emitter.fire({ sessionId: 'session-1' });
            const container = new Container();
            container.bind(ChatService).toConstantValue({
                getSessions: () => [{ id: 'session-1', title: '会话一' }],
                getQueuedRequests: () => queue,
                cancelQueuedRequest: (_sessionId: string, entryId: string) => {
                    cancelledEntry = entryId;
                    return queue.some(q => q.id === entryId);
                },
                onDidChangeQueuedRequests: emitter.event
            } as unknown as ChatService);
            container.bind(QueuedMessageTaskProvider).toSelf();
            provider = container.get(QueuedMessageTaskProvider);
        });

        it('lists queued messages with session title as detail', () => {
            const tasks = provider.listTasks();
            expect(tasks).to.have.lengthOf(1);
            expect(tasks[0].taskId).to.equal('session-1:q1');
            expect(tasks[0].title).to.equal('第二条消息');
            expect(tasks[0].kind).to.equal('queued-message');
            expect(tasks[0].state).to.equal('queued');
            expect(tasks[0].detail).to.equal('会话一');
        });

        it('cancels a queued message via its composite task id', () => {
            expect(provider.stopTask('session-1:q1')).to.be.true;
            expect(cancelledEntry).to.equal('q1');
            expect(provider.stopTask('not-a-composite-id')).to.be.false;
        });

        it('fires onDidChange when the queue changes', () => {
            let fired = false;
            provider.onDidChange(() => { fired = true; });
            fireQueueChange();
            expect(fired).to.be.true;
        });
    });
});
