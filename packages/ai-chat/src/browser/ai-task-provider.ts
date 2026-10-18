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

import { Event } from '@theia/core';

/** Aggregated task state across all providers; queued applies to chat messages waiting to be sent. */
export type AiTaskState = 'queued' | 'running' | 'completed' | 'error' | 'cancelled';

export interface AiTaskInfo {
    taskId: string;
    /** Human-readable summary, e.g. the delegated prompt or the shell command line. */
    title: string;
    kind: 'delegation' | 'queued-message' | 'shell';
    state: AiTaskState;
    /** Epoch milliseconds. */
    startedAt: number;
    /** Optional extra line, e.g. the exit code or an excerpt of the result. */
    detail?: string;
    /** A local preview URL detected for this task, if any (see the AI preview widget). */
    previewUrl?: string;
}

/**
 * Contribution feeding the AI task panel. Implementations live close to their data source
 * (delegations and queued messages in ai-chat, background shell tasks in ai-terminal) so the
 * panel itself stays free of package-specific dependencies.
 */
export const AiTaskProvider = Symbol('AiTaskProvider');
export interface AiTaskProvider {
    readonly id: string;
    readonly label: string;
    /** Current tasks; may be async for providers polling a backend. */
    listTasks(): Promise<AiTaskInfo[]> | AiTaskInfo[];
    /** Fired whenever the task list or a task state may have changed. */
    readonly onDidChange: Event<void>;
    /** Stops/cancels the task; returns whether the task was found and stoppable. */
    stopTask(taskId: string): Promise<boolean> | boolean;
    /** Returns the task's recent output for the panel's「查看输出」action, if available. */
    readOutput?(taskId: string): Promise<string | undefined>;
}
