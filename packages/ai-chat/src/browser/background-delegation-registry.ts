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

import { injectable } from '@theia/core/shared/inversify';
import { generateUuid } from '@theia/core';
import { ChatRequestInvocation } from '../common';

export type BackgroundDelegationState = 'running' | 'completed' | 'error' | 'cancelled';

export interface BackgroundDelegationEntry {
    taskId: string;
    agentId: string;
    sessionId: string;
    /** The delegation session's request invocation; resolves when the sub-agent finishes. */
    invocation: ChatRequestInvocation;
    state: BackgroundDelegationState;
    /** Final result text, once the state is no longer `running`. */
    result?: string;
    /** Called when the entry is removed (stop, session delete). */
    onDispose?: () => void;
}

/**
 * Tracks delegations started with `background: true`: the parent conversation gets a task id
 * immediately and can poll or stop the sub-agent later, while the delegation keeps running in
 * its own child session.
 */
@injectable()
export class BackgroundDelegationRegistry {

    protected readonly entries = new Map<string, BackgroundDelegationEntry>();

    create(init: Omit<BackgroundDelegationEntry, 'taskId' | 'state'>): BackgroundDelegationEntry {
        const entry: BackgroundDelegationEntry = {
            taskId: generateUuid(),
            state: 'running',
            ...init
        };
        this.entries.set(entry.taskId, entry);
        return entry;
    }

    get(taskId: string): BackgroundDelegationEntry | undefined {
        return this.entries.get(taskId);
    }

    list(): BackgroundDelegationEntry[] {
        return [...this.entries.values()];
    }

    /** Removes the entry, invoking its cleanup callback. Returns whether it existed. */
    remove(taskId: string): boolean {
        const entry = this.entries.get(taskId);
        if (!entry) {
            return false;
        }
        this.entries.delete(taskId);
        entry.onDispose?.();
        return true;
    }
}
