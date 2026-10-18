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
import { Command, CommandContribution, CommandRegistry, MessageService, nls } from '@theia/core';
import { codicon, ConfirmDialog } from '@theia/core/lib/browser';
import { TreeNode } from '@theia/core/lib/browser/tree';
import { ChatService, MutableChatModel } from '@theia/ai-chat';
import { RollbackPlanEntry, SessionRollbackService } from '@theia/ai-chat/lib/browser/session-rollback-service';
import { ChatNodeToolbarAction, ChatNodeToolbarActionContribution } from './chat-node-toolbar-action-contribution';
import { isResponseNode, RequestNode, ResponseNode } from './chat-tree-view';

/**
 * Contributes a per-response toolbar action that rolls the workspace back to the state
 * before the AI file changes of that request (and every later request in the session).
 * Only covers changes recorded in chat change sets; shell-side edits stay untouched.
 */
@injectable()
export class RollbackChatNodeToolbarContribution implements ChatNodeToolbarActionContribution, CommandContribution {

    protected static readonly ROLLBACK_COMMAND: Command = {
        id: 'chat:rollbackToBeforeRequest',
        label: '回滚到此轮修改之前'
    };

    @inject(ChatService)
    protected readonly chatService: ChatService;

    @inject(SessionRollbackService)
    protected readonly rollbackService: SessionRollbackService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    getToolbarActions(node: RequestNode | ResponseNode): ChatNodeToolbarAction[] {
        if (!isResponseNode(node) || !this.hasRollbackData(node)) {
            return [];
        }
        return [{
            commandId: RollbackChatNodeToolbarContribution.ROLLBACK_COMMAND.id,
            icon: codicon('discard'),
            tooltip: nls.localize('theia/ai/chat-ui/rollbackTooltip', '回滚到此轮 AI 修改之前'),
            priority: 10
        }];
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(RollbackChatNodeToolbarContribution.ROLLBACK_COMMAND, {
            execute: async (node: unknown) => {
                const responseNode = node && typeof node === 'object' && isResponseNode(node as TreeNode)
                    ? node as ResponseNode
                    : undefined;
                if (!responseNode) {
                    return;
                }
                await this.rollback(responseNode);
            }
        });
    }

    protected hasRollbackData(node: ResponseNode): boolean {
        const model = this.chatService.getSession(node.sessionId)?.model as MutableChatModel | undefined;
        if (!model) {
            return false;
        }
        const requests = model.getRequests();
        const index = requests.findIndex(request => request.id === node.response.requestId);
        if (index < 0) {
            return false;
        }
        for (let i = index; i < requests.length; i++) {
            if ((requests[i].changeSet?.getElements().length ?? 0) > 0) {
                return true;
            }
        }
        return false;
    }

    protected async rollback(node: ResponseNode): Promise<void> {
        const plan = await this.rollbackService.createPlan(node.sessionId, node.response.requestId);
        if (!plan || plan.entries.length === 0) {
            this.messageService.info(nls.localize('theia/ai/chat-ui/rollbackNothingToDo',
                '该轮请求没有可回滚的 AI 文件变更。'));
            return;
        }
        const confirmed = await new ConfirmDialog({
            title: nls.localize('theia/ai/chat-ui/rollbackConfirmTitle', '回滚到此轮修改之前'),
            msg: this.buildConfirmationMessage(plan.entries)
        }).open(true);
        if (!confirmed) {
            return;
        }
        const result = await this.rollbackService.executePlan(plan);
        const rolledBack = result.restored + result.deleted;
        const problems = [...plan.skipped, ...result.failed];
        if (problems.length === 0) {
            this.messageService.info(nls.localize('theia/ai/chat-ui/rollbackDone',
                '已回滚 {0} 个文件到该轮修改之前。', String(rolledBack)));
        } else {
            this.messageService.warn(nls.localize('theia/ai/chat-ui/rollbackPartial',
                '已回滚 {0} 个文件；{1} 个文件无法恢复（缺少修改前内容）。',
                String(rolledBack), String(problems.length)));
        }
    }

    protected buildConfirmationMessage(entries: RollbackPlanEntry[]): string {
        const lines = entries.slice(0, 10).map(entry => {
            const action = entry.type === 'add'
                ? nls.localize('theia/ai/chat-ui/rollbackDeleteNew', '删除新建文件')
                : nls.localize('theia/ai/chat-ui/rollbackRestore', '恢复原内容');
            return `• ${entry.uri.path.base}（${action}）`;
        });
        if (entries.length > 10) {
            lines.push(`… ${nls.localize('theia/ai/chat-ui/rollbackMoreFiles', '等共 {0} 个文件', String(entries.length))}`);
        }
        return nls.localize('theia/ai/chat-ui/rollbackConfirmBody',
            '将把以下文件恢复到该轮 AI 修改之前的状态（包括之后各轮的修改）：\n{0}',
            lines.join('\n'));
    }
}
