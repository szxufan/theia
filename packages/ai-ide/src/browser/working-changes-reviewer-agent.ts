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

import { AbstractStreamParsingChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { LanguageModelRequirement } from '@theia/ai-core/lib/common';
import { ILogger, nls } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import {
    workingChangesReviewerSystemPrompt,
    WORKING_CHANGES_REVIEWER_SYSTEM_PROMPT_ID
} from './working-changes-reviewer-prompt-template';

export const WorkingChangesReviewerAgentId = 'working-changes-reviewer';

/**
 * Reviews the user's uncommitted working-tree changes (fed by the
 * 「AI 代码审查：审查未提交变更」command) and reports findings in Chinese.
 * Read-only: its prompt forbids file modifications.
 */
@injectable()
export class WorkingChangesReviewerAgent extends AbstractStreamParsingChatAgent {
    @inject(ILogger) @named('ai-ide:WorkingChangesReviewerAgent')
    protected override readonly logger: ILogger;

    name = 'WorkingChangesReviewer';
    id = WorkingChangesReviewerAgentId;
    displayName = nls.localize('theia/ai/ide/workingChangesReviewerAgent/displayName', '变更审查');
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';
    override description = nls.localize('theia/ai/ide/workingChangesReviewerAgent/description',
        '审查工作区未提交变更（git diff）的只读评审助手：输出变更摘要、按严重度排序的问题列表与结论。' +
        '通过命令「AI 代码审查：审查未提交变更」一键发起，也可在对话中直接粘贴 diff 请求评审。');

    override prompts = [{ id: WORKING_CHANGES_REVIEWER_SYSTEM_PROMPT_ID, defaultVariant: workingChangesReviewerSystemPrompt, variants: [] }];
    protected override systemPromptId: string = WORKING_CHANGES_REVIEWER_SYSTEM_PROMPT_ID;
    override iconClass: string = 'codicon codicon-git-pull-request';
}
