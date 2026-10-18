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

import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter, Event, nls } from '@theia/core';
import { AiTaskInfo, AiTaskProvider } from '@theia/ai-chat/lib/browser/ai-task-provider';
import { ShellExecutionServer, ShellTaskStatus } from '../common/shell-execution-server';

/** Matches local development server URLs, e.g. `http://localhost:5173/`. */
const LOCAL_URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?[^\s"'<>）)]*/g;

/** Panel view length for the「查看输出」action. */
const OUTPUT_TAIL_LENGTH = 8192;

/**
 * Feeds the AI task panel with background shell tasks started via `shellExecuteBackground`,
 * including detection of local preview URLs in the task output.
 */
@injectable()
export class ShellTaskProvider implements AiTaskProvider {

    readonly id = 'background-shell';
    readonly label = nls.localize('theia/ai/terminal/taskPanel/shell', '后台命令');

    @inject(ShellExecutionServer)
    protected readonly shellServer: ShellExecutionServer;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    async listTasks(): Promise<AiTaskInfo[]> {
        const statuses = await this.shellServer.listTasks();
        return Promise.all(statuses.map(status => this.toTaskInfo(status)));
    }

    async stopTask(taskId: string): Promise<boolean> {
        const stopped = await this.shellServer.stop(taskId);
        if (stopped) {
            this.onDidChangeEmitter.fire();
        }
        return stopped;
    }

    async readOutput(taskId: string): Promise<string | undefined> {
        const output = await this.shellServer.readOutput(taskId, 0).catch(() => undefined);
        return output?.output.slice(-OUTPUT_TAIL_LENGTH);
    }

    protected async toTaskInfo(status: ShellTaskStatus): Promise<AiTaskInfo> {
        const previewUrl = await this.detectPreviewUrl(status);
        const detail = status.error
            ?? (status.finishedAt !== undefined && status.exitCode !== undefined
                ? nls.localize('theia/ai/terminal/taskPanel/exitCode', '退出码 {0}', String(status.exitCode))
                : undefined);
        return {
            taskId: status.taskId,
            title: status.command ?? status.taskId,
            kind: 'shell',
            state: this.toState(status),
            startedAt: status.startedAt,
            detail,
            previewUrl
        };
    }

    protected toState(status: ShellTaskStatus): AiTaskInfo['state'] {
        if (status.running) {
            return 'running';
        }
        if (status.error !== undefined) {
            return 'error';
        }
        return status.exitCode === 0 ? 'completed' : 'error';
    }

    protected async detectPreviewUrl(status: ShellTaskStatus): Promise<string | undefined> {
        const output = await this.shellServer.readOutput(status.taskId, 0).catch(() => undefined);
        const matches = output?.output.match(LOCAL_URL_PATTERN);
        return matches?.[0];
    }
}
