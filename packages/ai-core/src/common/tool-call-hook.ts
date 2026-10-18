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

import { Emitter, Event, MaybePromise } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { AutoActionResult } from './language-model';
import { ExecutableTool, ToolCallOutcome, ToolInvocation } from './tool-call-execution';

/**
 * Extension point around every tool execution, regardless of which agent or language model
 * issued the call. Implementations are collected via a root contribution provider and run
 * before/after each call. A `beforeToolCall` hook can block a call by returning a deny verdict.
 */
export const ToolCallHook = Symbol('ToolCallHook');
export interface ToolCallHook {

    /**
     * Called before a tool handler runs. Return `{ action: 'deny', reason }` to block the call
     * (the model receives the reason as the tool result), `{ action: 'allow' }` to proceed, or
     * `undefined` to let the other hooks and the regular confirmation flow decide.
     */
    beforeToolCall?(call: ToolInvocation, tool: ExecutableTool | undefined): MaybePromise<AutoActionResult | undefined>;

    /** Called after a tool call settled — success, handler error, not-found, or hook denial. */
    afterToolCall?(outcome: ToolCallOutcome): MaybePromise<void>;
}

export type ToolCallEvent =
    | { phase: 'before'; call: ToolInvocation }
    | { phase: 'after'; outcome: ToolCallOutcome };

/**
 * Broadcasts every tool call transition to arbitrary listeners (UI indicators, the external
 * HTTP API, telemetry). Purely observational; use {@link ToolCallHook} to influence execution.
 */
@injectable()
export class ToolCallEventBus {

    protected readonly onToolCallEventEmitter = new Emitter<ToolCallEvent>();
    readonly onToolCallEvent: Event<ToolCallEvent> = this.onToolCallEventEmitter.event;

    fire(event: ToolCallEvent): void {
        this.onToolCallEventEmitter.fire(event);
    }

    dispose(): void {
        this.onToolCallEventEmitter.dispose();
    }
}
