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

import { codicon } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { nls } from '@theia/core/lib/common/nls';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

/** 文件变化后的刷新防抖间隔（毫秒）。 */
export const PREVIEW_REFRESH_DEBOUNCE_MS = 800;

/**
 * Embedded live preview of a local development server: an address bar, a manual refresh button
 * and an optional auto-refresh that reloads the iframe shortly after workspace files change.
 *
 * Known limitation: the previewed server must not forbid embedding via `X-Frame-Options` /
 * `Content-Security-Policy: frame-ancestors`. Vite, webpack-dev-server and friends don't set
 * those by default.
 */
@injectable()
export class AiPreviewWidget extends ReactWidget {

    static readonly ID = 'ai-preview-widget';
    static readonly LABEL = nls.localize('theia/ai/ide/preview/label', 'AI 预览');

    @inject(FileService)
    protected readonly fileService: FileService;

    protected url: string | undefined;
    /** 递增以强制重新挂载 iframe，实现刷新。 */
    protected reloadCount = 0;
    protected autoRefresh = true;
    protected reloadTimer: NodeJS.Timeout | undefined;
    protected readonly toDisposeOnFiles = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.id = AiPreviewWidget.ID;
        this.title.label = AiPreviewWidget.LABEL;
        this.title.caption = AiPreviewWidget.LABEL;
        this.title.iconClass = codicon('browser');
        this.title.closable = true;
        this.toDispose.push(this.toDisposeOnFiles);
        this.node.classList.add('theia-ai-preview');
    }

    /** Loads (and normalizes) a URL into the preview. */
    openUrl(url: string): void {
        const trimmed = url.trim();
        if (!trimmed) {
            return;
        }
        // `localhost:5173` 形如 scheme 但不是，只把明确的 web 协议视为完整地址
        this.url = /^(https?|file):/i.test(trimmed) ? trimmed : `http://${trimmed}`;
        this.reloadCount++;
        this.listenForFileChanges();
        this.update();
    }

    reload(): void {
        if (this.url) {
            this.reloadCount++;
            this.update();
        }
    }

    protected listenForFileChanges(): void {
        this.toDisposeOnFiles.dispose();
        this.toDisposeOnFiles.push(this.fileService.onDidFilesChange(() => this.scheduleReload()));
    }

    protected scheduleReload(): void {
        if (!this.autoRefresh || !this.url) {
            return;
        }
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
        }
        this.reloadTimer = setTimeout(() => this.reload(), PREVIEW_REFRESH_DEBOUNCE_MS);
    }

    protected toggleAutoRefresh = (): void => {
        this.autoRefresh = !this.autoRefresh;
        this.update();
    };

    protected handleAddressSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        const input = (event.currentTarget.elements.namedItem('ai-preview-address') as HTMLInputElement | null)?.value;
        if (input) {
            this.openUrl(input);
        }
    };

    protected render(): React.ReactNode {
        return <div className='theia-ai-preview'>
            <div className='theia-ai-preview-toolbar'>
                <form className='theia-ai-preview-address-form' onSubmit={this.handleAddressSubmit}>
                    <input
                        name='ai-preview-address'
                        type='text'
                        className='theia-ai-preview-address'
                        placeholder={nls.localize('theia/ai/ide/preview/addressPlaceholder', '输入开发服务器地址，如 localhost:5173')}
                        defaultValue={this.url}
                        key={this.url}
                        spellCheck={false}
                    />
                </form>
                <button
                    type='button'
                    className={`theia-ai-preview-refresh ${codicon('refresh')}`}
                    title={nls.localize('theia/ai/ide/preview/refresh', '刷新预览')}
                    onClick={() => this.reload()}
                    disabled={!this.url}
                />
                <label className='theia-ai-preview-auto' title={nls.localize('theia/ai/ide/preview/autoTooltip', '工作区文件变化后自动刷新预览')}>
                    <input
                        type='checkbox'
                        checked={this.autoRefresh}
                        onChange={this.toggleAutoRefresh}
                    />
                    {nls.localize('theia/ai/ide/preview/autoRefresh', '自动刷新')}
                </label>
            </div>
            <div className='theia-ai-preview-content'>
                {this.url
                    ? <iframe key={this.reloadCount} src={this.url} className='theia-ai-preview-frame' title={AiPreviewWidget.LABEL} />
                    : <div className='theia-ai-preview-empty'>
                        {nls.localize('theia/ai/ide/preview/empty', '尚无预览地址。输入开发服务器地址，或在 AI 任务面板中点击「打开预览」。')}
                    </div>}
            </div>
        </div>;
    }
}
