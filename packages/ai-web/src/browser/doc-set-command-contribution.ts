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
import { Command, CommandContribution, CommandRegistry, MessageService, nls, QuickInputService, QuickPickItem } from '@theia/core';
import { DocSetService } from './doc-set-service';

export const DocSetCommands = {
    ADD: {
        id: 'ai-web.docSet.add',
        label: 'AI 文档集：添加文档'
    } as Command,
    REMOVE: {
        id: 'ai-web.docSet.remove',
        label: 'AI 文档集：管理文档'
    } as Command
};

@injectable()
export class DocSetCommandContribution implements CommandContribution {

    @inject(DocSetService)
    protected readonly docSetService: DocSetService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(DocSetCommands.ADD, {
            execute: async () => {
                const source = await this.quickInputService.input({
                    placeHolder: nls.localize('theia/ai/web/docSet/addPlaceholder',
                        '输入文档的 URL 或工作区内的文件路径'),
                    prompt: nls.localize('theia/ai/web/docSet/addPrompt',
                        'URL 会被抓取并转为 Markdown 存储；本地文件按原文本存储。')
                });
                if (!source?.trim()) {
                    return;
                }
                try {
                    const entry = await this.docSetService.add(source);
                    this.messageService.info(nls.localize('theia/ai/web/docSet/added',
                        '已添加文档「{0}」（{1} 字符）。在聊天中可用 #docs:{0} 引用。', entry.title, String(entry.charCount)));
                } catch (error) {
                    this.messageService.error(error instanceof Error ? error.message : String(error));
                }
            }
        });
        registry.registerCommand(DocSetCommands.REMOVE, {
            execute: async () => {
                const entries = await this.docSetService.list();
                if (entries.length === 0) {
                    this.messageService.info(nls.localize('theia/ai/web/docSet/empty', '文档集为空。'));
                    return;
                }
                const items: (QuickPickItem & { title: string })[] = entries.map(entry => ({
                    label: entry.title,
                    description: `${entry.source} · ${entry.charCount} 字符`,
                    title: entry.title
                }));
                const selection = await this.quickInputService.showQuickPick(items, {
                    placeholder: nls.localize('theia/ai/web/docSet/removePlaceholder', '选择要删除的文档')
                });
                const title = (selection as { title: string } | undefined)?.title;
                if (title && await this.docSetService.remove(title)) {
                    this.messageService.info(nls.localize('theia/ai/web/docSet/removed', '已删除文档「{0}」。', title));
                }
            }
        });
    }
}
