// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************
import { ChatMode } from '@theia/ai-chat';
import { LanguageModelRequirement } from '@theia/ai-core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import {
    createSkillSystemVariants,
    CREATE_SKILL_SYSTEM_PROMPT_TEMPLATE_ID,
    CREATE_SKILL_SYSTEM_DEFAULT_TEMPLATE_ID,
    CREATE_SKILL_SYSTEM_AGENT_MODE_TEMPLATE_ID,
} from '../common/create-skill-prompt-template';
import { AbstractModeAwareChatAgent } from './mode-aware-chat-agent';
import { ILogger, nls } from '@theia/core';

@injectable()
export class CreateSkillAgent extends AbstractModeAwareChatAgent {

    @inject(ILogger) @named('ai-ide:CreateSkillAgent')
    protected override readonly logger: ILogger;

    name = 'CreateSkill';
    id = 'CreateSkill';
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/universal',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';
    override iconClass: string = 'codicon codicon-wand';

    override description = nls.localize('theia/ai/workspace/createSkillAgent/description',
        '用于创建新技能的 AI 助手。技能为 AI 代理提供可复用的指令与领域知识。' +
        '此代理帮助您在 .agents/skills 或 .prompts/skills 目录中创建结构良好、带正确 YAML frontmatter 与 markdown 内容的技能。' +
        '此功能仍处于早期阶段，可能会发生变更。');

    override tags: string[] = [...this.tags, 'Alpha'];

    protected readonly modeDefinitions: Omit<ChatMode, 'isDefault'>[] = [
        {
            id: CREATE_SKILL_SYSTEM_DEFAULT_TEMPLATE_ID,
            name: nls.localize('theia/ai/ide/createSkillAgent/mode/edit', '默认模式')
        },
        {
            id: CREATE_SKILL_SYSTEM_AGENT_MODE_TEMPLATE_ID,
            name: nls.localizeByDefault('代理模式')
        }
    ];

    override prompts = [createSkillSystemVariants];
    protected override systemPromptId: string | undefined = CREATE_SKILL_SYSTEM_PROMPT_TEMPLATE_ID;

}
