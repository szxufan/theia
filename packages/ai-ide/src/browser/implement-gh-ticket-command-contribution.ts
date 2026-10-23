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
import { GitHubChatAgentId } from './github-chat-agent';

@injectable()
export class FixGitHubTicketCommandContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.registerFixGitHubTicketCommand();
    }

    protected registerFixGitHubTicketCommand(): void {
        const commandTemplate = this.buildCommandTemplate();

        this.promptService.addBuiltInPromptFragment({
            id: 'fix-gh-ticket',
            template: commandTemplate,
            isCommand: true,
            commandName: 'fix-gh-ticket',
            commandDescription: nls.localize(
                'theia/ai-ide/fixGhTicketCommand/description',
                '分析 GitHub 工单并实现解决方案'
            ),
            commandArgumentHint: nls.localize(
                'theia/ai-ide/fixGhTicketCommand/argumentHint',
                '<工单编号>'
            ),
            commandAgents: ['Coder']
        });
    }

    protected buildCommandTemplate(): string {
        return `你被要求分析一个 GitHub 工单并实现解决方案。

## 工单编号
$ARGUMENTS

## 任务概述
你需要获取指定 GitHub 工单的详情，分析它能否被实现，若能，则实现该解决方案。

## 步骤 1：获取工单信息
使用 ~{${AGENT_DELEGATION_FUNCTION_ID}} 工具委派 GitHub 代理，获取该工单的全面信息。

**代理 ID：**'${GitHubChatAgentId}'
**提示词：** 让 GitHub 代理获取 issue/工单 #$ARGUMENTS 的全部详情，具体要求获取：
- 完整的 issue 标题和描述/正文
- issue 的所有评论（这对理解完整上下文至关重要）
- 标签和负责人
- issue 状态（开放/关闭）
- 描述或评论中提到的任何被引用的 issue 或拉取请求
- 如果引用了其他 issue，也获取其详情

委派示例提示词：
\`\`\`
请获取 issue #$ARGUMENTS 的全面信息。我需要：
1. 完整的 issue 标题、正文/描述、标签、状态和负责人
2. 该 issue 的所有评论——每一条评论对理解上下文都很重要
3. 描述或评论中被引用或链接的任何 issue 或 PR
4. 对每个被引用的 issue，也请获取其标题和描述

这是为了实现该 issue，因此完整性至关重要。
\`\`\`

## 步骤 2：分析 AI 可实现性
收到工单信息后，分析该工单能否由你实现。考虑：

### 可实现工单的标准：
- **需求清晰**：工单清楚描述了要做的事
- **范围明确**：变更范围定义清晰且有边界
- **技术可行**：任务涉及的代码变更可以推理把握
- **上下文充分**：提供的信息足以理解问题与方案
- **可复现**：对缺陷而言，信息足以理解和复现问题

### 不可实现工单的标准：
- **需求含糊**：工单表述模糊或可有多种解读
- **上下文缺失**：缺少关键信息（如环境详情、复现步骤）
- **外部依赖**：需要访问外部系统、凭据或人工介入
- **需要设计决策**：需要人类判断的架构决策
- **信息不足**：无法确定怎样才算完成

## 步骤 3：根据分析结果回应

### 如果该工单无法实现：
给出清晰的说明：
1. **原因**：具体说明该工单为何无法由 AI 实现
2. **缺失信息**：列出缺失或不明确的信息
3. **澄清问题**：提出具体问题，若得到回答，可能使工单变得可实现

回复格式示例：
\`\`\`
## 分析结果：无法实现

### 原因
[说明原因]

### 缺失信息
- [条目 1]
- [条目 2]

### 澄清问题
1. [问题 1]
2. [问题 2]

请提供缺失的信息，我将继续实施。
\`\`\`

### 如果该工单可以实现：
开始实施：

1. **简要概括**工单的请求内容和你的实现思路
2. **探索代码库**，理解现有代码结构并找到相关文件
3. **实现解决方案**：使用你的文件修改工具进行必要的代码修改
4. 边修改**边解释你的变更**
5. **考虑边界情况**并妥善处理
6. **建议测试步骤**，供用户验证实现

回复格式示例：
\`\`\`
## 分析结果：可以实现

### 摘要
[工单内容与你的思路的简要概括]

### 实现
[开始探索代码库并实现变更，边做边解释]
\`\`\`

## 实现阶段的重要准则
- 始终先探索代码库，理解现有的模式与约定
- 遵循项目中现有的代码风格与模式
- 渐进式修改并解释每一步
- 实现过程中遇到意外问题时，说明情况并寻求指导
- 实现完成后，总结修改内容并建议如何测试

记住：如果在实现过程中你意识到需要更多信息，或任务比最初评估的更复杂，请停下来请求澄清，而不是凭假设行事。`;
    }
}
