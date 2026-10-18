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

import { Command, CommandContribution, CommandRegistry, nls, QuickInputService } from '@theia/core';
import { ApplicationShell, WidgetManager } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { AiPreviewWidget } from './ai-preview-widget';

/** 任务面板的「打开预览」按钮通过该命令 id 调起（带 url 参数）。 */
export const AI_PREVIEW_OPEN_COMMAND: Command = {
    id: 'ai-ide.openPreview',
    label: 'AI 预览：打开 URL'
};

@injectable()
export class AiPreviewCommandContribution implements CommandContribution {

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(AI_PREVIEW_OPEN_COMMAND, {
            execute: async (url?: string) => {
                const target = url?.trim() || await this.quickInputService.input({
                    placeHolder: nls.localize('theia/ai/ide/preview/urlPlaceholder', '输入开发服务器地址，如 localhost:5173')
                });
                if (!target?.trim()) {
                    return;
                }
                const widget = await this.widgetManager.getOrCreateWidget(AiPreviewWidget.ID);
                if (!widget.isAttached) {
                    await this.shell.addWidget(widget, { area: 'main' });
                }
                await this.shell.revealWidget(widget.id);
                (widget as AiPreviewWidget).openUrl(target);
            }
        });
    }
}
