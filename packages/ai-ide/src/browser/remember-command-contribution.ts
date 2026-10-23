// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
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

import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PromptService } from '@theia/ai-core/lib/common';
import { nls } from '@theia/core';
import { AGENT_DELEGATION_FUNCTION_ID } from '@theia/ai-core';
import { ArchitectAgentId } from './architect-agent';
import { CoderAgentId } from './coder-agent';

/**
 * Contribution that registers the `/remember` slash command for AI chat agents.
 *
 * This command allows Architect and Coder agents to extract important topics
 * from the current conversation and delegate to the ProjectInfo agent to update
 * the persistent project context file.
 */
@injectable()
export class RememberCommandContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.registerRememberCommand();
    }

    protected registerRememberCommand(): void {
        const commandTemplate = this.buildCommandTemplate();

        this.promptService.addBuiltInPromptFragment({
            id: 'remember-conversation-context',
            template: commandTemplate,
            isCommand: true,
            commandName: 'remember',
            commandDescription: nls.localize(
                'theia/ai-ide/rememberCommand/description',
                '从对话中提取主题并更新项目信息'
            ),
            commandArgumentHint: nls.localize(
                'theia/ai-ide/rememberCommand/argumentHint',
                '[主题提示]'
            ),
            commandAgents: [ArchitectAgentId, CoderAgentId]
        });
    }

    protected buildCommandTemplate(): string {
        return `你被要求从当前对话中提取并记住重要信息。

    ## 任务概述
    回顾对话历史，找出应添加到持久化项目上下文中的具体信息。

    ## 关注领域
    $ARGUMENTS

    ## 提取什么
    **如果上面提供了关注领域**：只提取与该关注领域相关的信息，忽略其他所有主题。

    **如果未提供关注领域**：专门寻找用户不得不纠正你或提供澄清的信息：
    - **用户纠正**：用户纠正了你对代码库、架构或流程的假设
    - **用户提供的上下文**：用户明确提供、而你自己无法发现的信息
    - **项目特有知识**：在你做出错误假设时用户分享的项目细节

    **不要提取**：
    - 你通过代码分析自行发现的常规信息
    - 你自己识别出的标准编码实践
    - 你通过探索代码库得到的信息
    - 常识或广为人知的模式
    - 代码中已有完善文档的细节

    ## 指令
    1. **分析对话**：按上面的具体标准审查消息
    2. **只提取相关信息**：为每个符合条件的条目准备清晰的描述，涵盖：
    - 用户纠正或澄清了什么
    - 你最初的理解为何不完整
    - 提供了哪些具体的项目上下文
    3. **委派 ProjectInfo 代理**：使用 ~{${AGENT_DELEGATION_FUNCTION_ID}} 工具将提取的信息发送给 ProjectInfo 代理：
    - 代理 ID：'ProjectInfo'
    - 提示词：让 ProjectInfo 代理审查提取的信息并更新项目信息文件

    ## 委派示例
    \`\`\`
    请审查以下用户纠正/澄清内容，并将其纳入项目上下文：

    [此处填写你提取的纠正与用户提供的上下文]

    更新 /.prompts/project-info.prompttemplate，将此信息添加到合适的章节。重点放在能避免未来误解的信息上。
    \`\`\`

    记住：只提取那些能避免未来 AI 代理重蹈你被用户纠正过的错误或假设的信息。`;
    }
}
