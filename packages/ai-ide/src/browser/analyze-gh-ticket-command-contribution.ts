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
import { ArchitectAgentId } from './architect-agent';
import { CoderAgentId } from './coder-agent';

@injectable()
export class AnalyzesGhTicketCommandContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.registerGitHubTicketCommand();
    }

    protected registerGitHubTicketCommand(): void {
        const commandTemplate = this.buildCommandTemplate();

        this.promptService.addBuiltInPromptFragment({
            id: 'analyze-gh-ticket',
            template: commandTemplate,
            isCommand: true,
            commandName: 'analyze-gh-ticket',
            commandDescription: nls.localize(
                'theia/ai-ide/ticketCommand/description',
                '分析 GitHub 工单并制定实现计划'
            ),
            commandArgumentHint: nls.localize(
                'theia/ai-ide/ticketCommand/argumentHint',
                '<工单编号>'
            ),
            commandAgents: [ArchitectAgentId]
        });
    }

    protected buildCommandTemplate(): string {
        return `你被要求分析一个 GitHub 工单并制定实现计划。

## 工单编号
$ARGUMENTS

## 任务概述
你需要获取指定 GitHub 工单的详情，并分析它能否由 AI 编码代理实现。

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

这是为了分析该 issue 能否被实现，因此完整性至关重要。
\`\`\`

## 步骤 2：分析 AI 可解决性
收到工单信息后，分析该工单能否由 AI 编码代理解决。考虑：

### AI 可解决工单的标准：
- **需求清晰**：工单清楚描述了要做的事
- **范围明确**：变更范围定义清晰且有边界
- **技术可行**：任务涉及的代码变更可以推理把握
- **上下文充分**：提供的信息足以理解问题与方案
- **可复现**：对缺陷而言，信息足以理解和复现问题

### AI 不可解决工单的标准：
- **需求含糊**：工单表述模糊或可有多种解读
- **上下文缺失**：缺少关键信息（如环境详情、复现步骤）
- **外部依赖**：需要访问外部系统、凭据或人工介入
- **需要设计决策**：需要人类判断的架构决策
- **信息不足**：无法确定怎样才算完成

## 步骤 3：根据分析结果回应

### 如果该工单无法由 AI 解决：
给出清晰的说明：
1. **原因**：具体说明该工单为何无法由 AI 解决
2. **缺失信息**：列出缺失或不明确的信息
3. **澄清问题**：提出具体问题，若得到回答，可能使工单变得可解决

回复格式示例：
\`\`\`
## 分析结果：无法由 AI 解决

### 原因
[说明原因]

### 缺失信息
- [条目 1]
- [条目 2]

### 澄清问题
1. [问题 1]
2. [问题 2]
\`\`\`

### 如果该工单可以由 AI 解决：
制定详细的实现计划：

1. **摘要**：简要概括工单的请求内容
2. **分析**：你对问题的理解与拟定的解决思路
3. **实现计划**：编码代理可逐步执行的计划，包括：
   - 可能需要修改或创建的文件
   - 每个文件中要做的具体修改
   - 操作顺序
   - 测试方面的考虑
4. **潜在挑战**：需要留意的挑战或边界情况
5. **成功标准**：如何验证实现正确

回复格式示例：
\`\`\`
## 分析结果：可以由 AI 解决

### 摘要
[工单的简要概括]

### 分析
[你对问题与解决思路的理解]

### 实现计划

#### 步骤 1：[第一步]
- 文件：\`path/to/file\`
- 修改：[修改内容说明]

#### 步骤 2：[第二步]
- 文件：\`path/to/file\`
- 修改：[修改内容说明]

[按需继续更多步骤...]

### 潜在挑战
- [挑战 1]
- [挑战 2]

### 成功标准
- [标准 1]
- [标准 2]

### 后续步骤
要让该计划落地，可以请求 @${CoderAgentId} 来执行。
\`\`\`

记住：分析要全面。宁可请求澄清，也不要制定不完整或错误的实现计划。`;
    }
}
