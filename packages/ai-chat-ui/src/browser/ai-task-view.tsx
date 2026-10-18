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

import { CommandRegistry, ContributionProvider, nls } from '@theia/core';
import { codicon } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/lib/browser/widgets/widget';
import { inject, injectable, named, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { AiTaskInfo, AiTaskProvider } from '@theia/ai-chat/lib/browser/ai-task-provider';
import { Spinner } from './chat-response-renderer/spinner';

/** Command id of the AI preview widget (contributed by ai-ide); the button only shows when it exists. */
const AI_PREVIEW_OPEN_COMMAND_ID = 'ai-ide.openPreview';
/** Background tasks change server-side without events; poll while the panel is visible. */
const REFRESH_INTERVAL_MS = 5000;

interface TaskRow {
    provider: AiTaskProvider;
    task: AiTaskInfo;
    output?: string;
}

/**
 * Bottom-panel view aggregating background AI work: delegated agents, queued chat messages and
 * background shell tasks. Data comes from {@link AiTaskProvider} contributions so this widget
 * stays independent of where the tasks actually run.
 */
@injectable()
export class AiTaskView extends ReactWidget {

    static readonly ID = 'ai-task-view';
    static readonly LABEL = nls.localize('theia/ai/chat-ui/taskPanel/label', 'AI 任务');

    @inject(ContributionProvider) @named(AiTaskProvider)
    protected readonly taskProviders: ContributionProvider<AiTaskProvider>;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    protected rows: TaskRow[] = [];
    protected expanded = new Set<string>();
    protected refreshTimer: NodeJS.Timeout | undefined;

    @postConstruct()
    protected init(): void {
        this.id = AiTaskView.ID;
        this.title.label = AiTaskView.LABEL;
        this.title.caption = AiTaskView.LABEL;
        this.title.iconClass = codicon('remote'); // codicon('layers') 在部分主题缺失，remote 稳定
        this.title.closable = true;
        this.toDispose.pushAll(this.taskProviders.getContributions().map(provider =>
            provider.onDidChange(() => this.refresh())));
    }

    protected override onActivateRequest(message: Message): void {
        super.onActivateRequest(message);
        this.refresh();
        this.refreshTimer ??= setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
    }

    protected override onAfterHide(msg: Message): void {
        super.onAfterHide(msg);
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    }

    protected async refresh(): Promise<void> {
        const rows: TaskRow[] = [];
        for (const provider of this.taskProviders.getContributions()) {
            const tasks = await provider.listTasks();
            for (const task of tasks) {
                rows.push({ provider, task });
            }
        }
        this.rows = rows;
        this.update();
    }

    protected render(): React.ReactNode {
        if (this.rows.length === 0) {
            return <div className='theia-ai-task-view theia-ai-task-view-empty'>
                {nls.localize('theia/ai/chat-ui/taskPanel/empty', '当前没有后台 AI 任务。')}
            </div>;
        }
        const byProvider = new Map<string, TaskRow[]>();
        for (const row of this.rows) {
            const group = byProvider.get(row.provider.label) ?? [];
            group.push(row);
            byProvider.set(row.provider.label, group);
        }
        return <div className='theia-ai-task-view'>
            {[...byProvider.entries()].map(([label, group]) => <div key={label} className='theia-ai-task-section'>
                <div className='theia-ai-task-section-title'>{label}（{group.length}）</div>
                {group.map(row => this.renderTask(row))}
            </div>)}
        </div>;
    }

    protected renderTask(row: TaskRow): React.ReactNode {
        const { task } = row;
        const output = this.expanded.has(task.taskId) ? row.output : undefined;
        const canStop = task.state === 'running' || task.state === 'queued';
        const canPreview = !!task.previewUrl && !!this.commandRegistry.getCommand(AI_PREVIEW_OPEN_COMMAND_ID);
        return <div key={task.taskId} className='theia-ai-task-row'>
            <span className='theia-ai-task-state'>{this.renderState(task)}</span>
            <span className='theia-ai-task-title' title={task.title}>{task.title}</span>
            <span className='theia-ai-task-detail'>{task.detail}</span>
            <span className='theia-ai-task-actions'>
                {canPreview && <button
                    className={`theia-ai-task-action ${codicon('open-preview')}`}
                    title={nls.localize('theia/ai/chat-ui/taskPanel/openPreview', '打开预览')}
                    onClick={() => this.commandRegistry.executeCommand(AI_PREVIEW_OPEN_COMMAND_ID, task.previewUrl)} />}
                {row.provider.readOutput && <button
                    className={`theia-ai-task-action ${codicon('output')}`}
                    title={nls.localize('theia/ai/chat-ui/taskPanel/showOutput', '查看输出')}
                    onClick={() => this.toggleOutput(row)} />}
                {canStop && <button
                    className={`theia-ai-task-action ${codicon('debug-stop')}`}
                    title={nls.localize('theia/ai/chat-ui/taskPanel/stop', '停止')}
                    onClick={() => this.stopTask(row)} />}
            </span>
            {output !== undefined && <pre className='theia-ai-task-output'>{output || nls.localizeByDefault('（暂无输出）')}</pre>}
        </div>;
    }

    protected renderState(task: AiTaskInfo): React.ReactNode {
        switch (task.state) {
            case 'running':
                return <Spinner />;
            case 'completed':
                return <span className={`theia-ai-task-state-icon ${codicon('pass-filled')}`}
                    title={nls.localizeByDefault('已完成')} />;
            case 'error':
                return <span className={`theia-ai-task-state-icon is-error ${codicon('error')}`}
                    title={nls.localizeByDefault('出错')} />;
            case 'cancelled':
                return <span className={`theia-ai-task-state-icon ${codicon('circle-slash')}`}
                    title={nls.localizeByDefault('已取消')} />;
            default:
                return <span className={`theia-ai-task-state-icon ${codicon('clock')}`}
                    title={nls.localizeByDefault('排队中')} />;
        }
    }

    protected async toggleOutput(row: TaskRow): Promise<void> {
        if (this.expanded.has(row.task.taskId)) {
            this.expanded.delete(row.task.taskId);
            this.update();
            return;
        }
        row.output = await row.provider.readOutput?.(row.task.taskId);
        this.expanded.add(row.task.taskId);
        this.update();
    }

    protected async stopTask(row: TaskRow): Promise<void> {
        await row.provider.stopTask(row.task.taskId);
        await this.refresh();
    }
}
