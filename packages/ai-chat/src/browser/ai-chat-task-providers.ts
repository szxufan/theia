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

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event, nls } from '@theia/core';
import { ChatService } from '../common/chat-service';
import { AiTaskInfo, AiTaskProvider } from './ai-task-provider';
import { BackgroundDelegationRegistry } from './background-delegation-registry';

/** Feeds the AI task panel with background agent delegations. */
@injectable()
export class DelegationTaskProvider implements AiTaskProvider {

    readonly id = 'background-delegation';
    readonly label = nls.localize('theia/ai/chat/taskPanel/delegations', '后台代理任务');

    @inject(BackgroundDelegationRegistry)
    protected readonly registry: BackgroundDelegationRegistry;

    @inject(ChatService)
    protected readonly chatService: ChatService;

    get onDidChange(): BackgroundDelegationRegistry['onDidChange'] {
        return this.registry.onDidChange;
    }

    listTasks(): AiTaskInfo[] {
        return this.registry.list().map(entry => ({
            taskId: entry.taskId,
            title: nls.localize('theia/ai/chat/taskPanel/delegationTitle', '委派代理 {0}', entry.agentId),
            kind: 'delegation' as const,
            state: entry.state,
            startedAt: entry.createdAt,
            detail: entry.result ? entry.result.slice(0, 200) : undefined
        }));
    }

    async stopTask(taskId: string): Promise<boolean> {
        const entry = this.registry.get(taskId);
        if (!entry || entry.state !== 'running') {
            return false;
        }
        const request = await entry.invocation.requestCompleted;
        await this.chatService.cancelRequest(request.session.id, request.id);
        this.registry.updateState(taskId, 'cancelled');
        return true;
    }

    async readOutput(taskId: string): Promise<string | undefined> {
        return this.registry.get(taskId)?.result;
    }
}

/** Feeds the AI task panel with chat messages queued behind a running request. */
@injectable()
export class QueuedMessageTaskProvider implements AiTaskProvider {

    readonly id = 'queued-messages';
    readonly label = nls.localize('theia/ai/chat/taskPanel/queued', '排队中的消息');

    @inject(ChatService)
    protected readonly chatService: ChatService;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    @postConstruct()
    protected init(): void {
        this.chatService.onDidChangeQueuedRequests(() => this.onDidChangeEmitter.fire());
    }

    listTasks(): AiTaskInfo[] {
        const tasks: AiTaskInfo[] = [];
        for (const session of this.chatService.getSessions()) {
            for (const queued of this.chatService.getQueuedRequests(session.id)) {
                tasks.push({
                    taskId: `${session.id}:${queued.id}`,
                    title: queued.request.text.slice(0, 120),
                    kind: 'queued-message',
                    state: 'queued',
                    startedAt: Date.now(),
                    detail: session.title
                });
            }
        }
        return tasks;
    }

    stopTask(taskId: string): boolean {
        const separator = taskId.indexOf(':');
        if (separator < 0) {
            return false;
        }
        const sessionId = taskId.substring(0, separator);
        const entryId = taskId.substring(separator + 1);
        return this.chatService.cancelQueuedRequest(sessionId, entryId);
    }
}
