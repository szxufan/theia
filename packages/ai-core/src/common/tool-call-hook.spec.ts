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
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { ILogger } from '@theia/core';
import { ToolCallEventBus, ToolCallHook } from './tool-call-hook';
import { ExecutableTool, ToolCallExecutorImpl, ToolInvocation } from './tool-call-execution';

describe('ToolCallExecutorImpl hooks', () => {

    let executor: ToolCallExecutorImpl;
    let eventBus: ToolCallEventBus;
    let container: Container;
    let handlerCalls: string[];
    let events: string[];

    const tool: ExecutableTool = {
        name: 'echoTool',
        handler: async (args: string) => {
            handlerCalls.push(args);
            return { echoed: args };
        }
    };

    function bindHook(hook: ToolCallHook): void {
        container.bind(ToolCallHook).toConstantValue(hook);
    }

    beforeEach(() => {
        handlerCalls = [];
        events = [];
        container = new Container();
        container.bind(ILogger).toConstantValue({
            debug: () => { }, info: () => { }, warn: () => { }, error: () => { }
        } as unknown as ILogger);
        eventBus = new ToolCallEventBus();
        eventBus.onToolCallEvent(event => events.push(event.phase));
        container.bind(ToolCallEventBus).toConstantValue(eventBus);
        bindContributionProvider(container, ToolCallHook);
        container.bind(ToolCallExecutorImpl).toSelf();
    });

    const call: ToolInvocation = { id: 'call-1', name: 'echoTool', arguments: '{"x": 1}' };

    it('executes normally and notifies before/after on the event bus', async () => {
        executor = container.get(ToolCallExecutorImpl);
        const [outcome] = await executor.executeToolCalls([call], [tool]);
        expect(handlerCalls).to.deep.equal(['{"x": 1}']);
        expect(outcome.notFound).to.be.false;
        expect(events).to.deep.equal(['before', 'after']);
    });

    it('lets a before-hook deny the call with a reason', async () => {
        bindHook({
            beforeToolCall: invocation => invocation.name === 'echoTool'
                ? { action: 'deny', reason: 'not allowed here' }
                : undefined
        });
        executor = container.get(ToolCallExecutorImpl);
        const [outcome] = await executor.executeToolCalls([call], [tool]);
        expect(handlerCalls).to.be.empty;
        expect(outcome.result).to.deep.equal({ denied: true, reason: 'not allowed here' });
        expect(events).to.deep.equal(['before', 'after']);
    });

    it('lets a before-hook explicitly allow and short-circuit other hooks', async () => {
        let denyHookSeen = false;
        bindHook({
            beforeToolCall: () => {
                denyHookSeen = true;
                return { action: 'deny', reason: 'second hook must not run' };
            }
        });
        // The first registered hook allows; the denying one never takes effect.
        container.rebind(ToolCallHook).toConstantValue({
            beforeToolCall: () => ({ action: 'allow' })
        });
        // Re-add the deny hook as a second contribution.
        const secondDeny = {
            beforeToolCall: () => {
                denyHookSeen = true;
                return { action: 'deny', reason: 'should not matter' };
            }
        };
        container.bind(ToolCallHook).toConstantValue(secondDeny);
        executor = container.get(ToolCallExecutorImpl);
        const [outcome] = await executor.executeToolCalls([call], [tool]);
        expect(handlerCalls).to.have.lengthOf(1);
        expect(outcome.notFound).to.be.false;
        expect(denyHookSeen).to.be.false;
    });

    it('notifies after-hooks with the outcome', async () => {
        const seen: string[] = [];
        bindHook({ afterToolCall: outcome => { seen.push(outcome.name); } });
        executor = container.get(ToolCallExecutorImpl);
        await executor.executeToolCalls([call], [tool]);
        expect(seen).to.deep.equal(['echoTool']);
    });

    it('survives a throwing hook', async () => {
        bindHook({
            beforeToolCall: () => { throw new Error('hook bug'); },
            afterToolCall: () => { throw new Error('hook bug after'); }
        });
        executor = container.get(ToolCallExecutorImpl);
        const [outcome] = await executor.executeToolCalls([call], [tool]);
        expect(handlerCalls).to.have.lengthOf(1);
        expect(outcome.notFound).to.be.false;
    });

    it('denies an unknown tool as not-found regardless of hooks', async () => {
        bindHook({ beforeToolCall: () => undefined });
        executor = container.get(ToolCallExecutorImpl);
        const [outcome] = await executor.executeToolCalls(
            [{ id: 'c2', name: 'missing', arguments: '{}' }], [tool]);
        expect(outcome.notFound).to.be.true;
    });
});
