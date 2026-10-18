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

import { Command, CommandContribution, CommandRegistry, MessageService, nls } from '@theia/core';
import { AICommandHandlerFactory } from '@theia/ai-core/lib/browser';
import { ChatAgentLocation, ChatService } from '@theia/ai-chat/lib/common';
import { ScmRepository } from '@theia/scm/lib/browser/scm-repository';
import { ScmService } from '@theia/scm/lib/browser/scm-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { GetGitChangesTool } from './git-changes-tool';
import { WorkingChangesReviewerAgent } from './working-changes-reviewer-agent';

/** 超过该长度（字符）的 diff 会截断后发送，并附中文说明。 */
const MAX_REVIEW_DIFF_CHARS = 100 * 1024;

export const AI_REVIEW_WORKING_CHANGES: Command = {
    id: 'ai-ide.reviewWorkingChanges',
    label: 'AI 代码审查：审查未提交变更'
};

/**
 * One-shot entry into the working-changes review: gathers `git diff HEAD` of the selected
 * repository and sends it to a fresh chat session pinned to the 变更审查 agent.
 */
@injectable()
export class WorkingChangesReviewCommandContribution implements CommandContribution {

    @inject(GetGitChangesTool)
    protected readonly gitChangesTool: GetGitChangesTool;

    @inject(ScmService)
    protected readonly scmService: ScmService;

    @inject(ChatService)
    protected readonly chatService: ChatService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(WorkingChangesReviewerAgent)
    protected readonly reviewerAgent: WorkingChangesReviewerAgent;

    @inject(AICommandHandlerFactory)
    protected readonly commandHandlerFactory: AICommandHandlerFactory;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(AI_REVIEW_WORKING_CHANGES, this.commandHandlerFactory({
            execute: async () => {
                const repository = this.scmService.selectedRepository;
                if (!repository) {
                    this.messageService.warn(nls.localize('theia/ai-ide/review/noRepository', '未选择源代码管理仓库。'));
                    return;
                }
                let diff: string;
                try {
                    diff = await this.gitChangesTool.getWorkingTreeChanges(repository);
                } catch (error) {
                    this.messageService.error(nls.localize('theia/ai-ide/review/diffFailed',
                        '读取变更失败：{0}', error instanceof Error ? error.message : String(error)));
                    return;
                }
                if (!diff.trim()) {
                    this.messageService.info(nls.localize('theia/ai-ide/review/noChanges',
                        '没有未提交的变更（未跟踪的新文件不在审查范围内）。'));
                    return;
                }
                const session = this.chatService.createSession(ChatAgentLocation.Panel, { focus: true }, this.reviewerAgent);
                await this.chatService.sendRequest(session.id, {
                    text: this.buildRequest(diff, repository)
                });
            }
        }));
    }

    protected buildRequest(diff: string, repository: ScmRepository): string {
        const rootName = repository.provider.rootUri.split('/').pop() ?? repository.provider.rootUri;
        const truncated = diff.length > MAX_REVIEW_DIFF_CHARS;
        const body = truncated ? diff.slice(0, MAX_REVIEW_DIFF_CHARS) : diff;
        const note = truncated
            ? '\n\n（diff 超过 100K 字符已截断，请说明仅审查了前半部分，并提示用户分批审查。）'
            : '';
        return `请审查仓库「${rootName}」的以下未提交变更（git diff HEAD，不含未跟踪文件）：\n\n\`\`\`diff\n${body}\n\`\`\`${note}`;
    }
}
