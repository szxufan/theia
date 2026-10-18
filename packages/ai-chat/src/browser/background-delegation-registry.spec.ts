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
import { ChatRequestInvocation } from '../common';
import { BackgroundDelegationRegistry } from './background-delegation-registry';

function invocation(): ChatRequestInvocation {
    return {
        requestCompleted: Promise.resolve({ id: 'req-1', session: { id: 'session-1' } } as never),
        responseCreated: Promise.resolve({} as never),
        responseCompleted: Promise.resolve({} as never)
    };
}

describe('BackgroundDelegationRegistry', () => {

    let registry: BackgroundDelegationRegistry;
    let changeCount: number;

    beforeEach(() => {
        registry = new BackgroundDelegationRegistry();
        changeCount = 0;
        registry.onDidChange(() => changeCount++);
    });

    it('fires on create, updateState and remove', () => {
        const entry = registry.create({ agentId: 'coder', sessionId: 'session-1', invocation: invocation() });
        expect(changeCount).to.equal(1);
        expect(entry.createdAt).to.be.greaterThan(0);

        expect(registry.updateState(entry.taskId, 'completed', '完成文本')).to.be.true;
        expect(changeCount).to.equal(2);
        expect(registry.get(entry.taskId)!.state).to.equal('completed');
        expect(registry.get(entry.taskId)!.result).to.equal('完成文本');

        let disposed = false;
        const second = registry.create({ agentId: 'coder', sessionId: 'session-1', invocation: invocation(), onDispose: () => { disposed = true; } });
        expect(registry.remove(second.taskId)).to.be.true;
        expect(disposed).to.be.true;
        expect(changeCount).to.equal(4);

        expect(registry.updateState('missing', 'error')).to.be.false;
        expect(registry.remove('missing')).to.be.false;
    });

    it('lists entries in creation order', () => {
        registry.create({ agentId: 'a', sessionId: 's', invocation: invocation() });
        registry.create({ agentId: 'b', sessionId: 's', invocation: invocation() });
        expect(registry.list().map(entry => entry.agentId)).to.deep.equal(['a', 'b']);
    });
});
