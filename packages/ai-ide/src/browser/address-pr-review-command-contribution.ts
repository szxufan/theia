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
export class AddressGhReviewCommandContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.registerAddressGhReviewCommand();
    }

    protected registerAddressGhReviewCommand(): void {
        const commandTemplate = this.buildCommandTemplate();

        this.promptService.addBuiltInPromptFragment({
            id: 'address-gh-review',
            template: commandTemplate,
            isCommand: true,
            commandName: 'address-gh-review',
            commandDescription: nls.localize(
                'theia/ai-ide/addressGhReviewCommand/description',
                '处理 GitHub 拉取请求上的审查评论'
            ),
            commandArgumentHint: nls.localize(
                'theia/ai-ide/addressGhReviewCommand/argumentHint',
                '<PR 编号>'
            ),
            commandAgents: ['Coder']
        });
    }

    protected buildCommandTemplate(): string {
        return `你被要求处理一个 GitHub 拉取请求上的审查评论。

## 拉取请求编号
$ARGUMENTS

## 任务概述
你需要获取指定拉取请求的全部详情（尤其是审查评论），评估你是否能安全地处理所有评论，若能，则实现所要求的变更。

## 步骤 1：获取拉取请求信息
使用 ~{${AGENT_DELEGATION_FUNCTION_ID}} 工具委派 GitHub 代理，获取该拉取请求的全面信息。

**代理 ID：**'${GitHubChatAgentId}'
**提示词：** 让 GitHub 代理获取 PR #$ARGUMENTS 的全部详情，具体要求获取：
- PR 标题和描述
- PR 的当前状态（开放、关闭、已合并）
- 所有审查评论——这一点至关重要，每一条审查评论都必须获取
- PR 的一般评论（对话区）
- PR 中变更文件的列表
- 任何被引用的 issue
- 审查状态（已批准、要求修改等）

委派示例提示词：
\`\`\`
请获取拉取请求 #$ARGUMENTS 的全面信息。我需要：
1. PR 标题、描述和当前状态
2. 该 PR 的所有审查评论——每一条行内审查评论都至关重要
3. PR 对话区的所有一般评论
4. 该 PR 变更文件的列表
5. 当前审查状态（已批准、要求修改、等待中）
6. 任何被链接或引用的 issue

这是为了处理审查评论，因此完整性绝对至关重要。务必获取每一条审查评论。
\`\`\`

## 步骤 2：分析并归类审查评论
收到 PR 信息后，逐条分析审查评论并归类：

### 审查评论的类别：
1. **明确的代码修改**：要求具体、无歧义代码变更的评论（例如“重命名这个变量”“这里加个空值检查”“修正这个拼写错误”）
2. **风格/格式修正**：关于代码风格、格式或约定的评论
3. **缺陷修复**：指出需要修复的缺陷或问题的评论
4. **澄清性问题**：审查者提出的是需要回答的问题，而非代码变更
5. **设计讨论**：关于需要人类判断的架构或设计决策的评论
6. **含糊的请求**：不明确或可有多种解读的评论

### 可安全处理评论的标准：
- 所要求的变更表述明确
- 变更局部且范围清晰
- 无需做架构或设计决策
- 变更与其他审查评论不冲突
- 你有足够的上下文正确完成变更

### 需要澄清的评论的标准：
- 评论含糊或模糊
- 存在多种合理解读
- 评论涉及设计决策
- 评论之间相互冲突
- 审查者是在提问而非要求变更

## 步骤 3：根据分析结果回应

### 如果有任何评论无法安全处理：
列出所有评论及其状态，然后就有问题的评论请求澄清：

回复格式示例：
\`\`\`
## PR 审查分析

### 我能处理的评论：
1. [文件：path/to/file.ts，第 X 行] - “[评论摘要]” - 将[动作]
2. [文件：path/to/file.ts，第 Y 行] - “[评论摘要]” - 将[动作]

### 需要澄清的评论：
1. [文件：path/to/file.ts，第 Z 行] - “[评论摘要]”
   - **症结**：[为何需要澄清]
   - **提问**：[消除歧义的具体问题]

2. [文件：path/to/other.ts，第 W 行] - “[评论摘要]”
   - **症结**：[为何需要澄清]
   - **提问**：[消除歧义的具体问题]

### 相互冲突的评论：
- [描述审查评论之间的冲突]

请对以上各项予以澄清。澄清后，我就可以继续处理所有审查评论。

或者，如果你希望我只处理可以安全应对的那些评论，请确认。
\`\`\`

### 如果所有评论都可以安全处理：
开始实现所有要求的变更：

1. **列出所有评论**以及你将如何逐条处理
2. **逐个文件实现变更**，处理每条审查评论
3. 边修改**边解释每个变更**，并引用对应的原始审查评论
4. 最后**总结**所有已完成的变更

回复格式示例：
\`\`\`
## PR 审查分析

所有审查评论均可安全处理。开始实施。

### 待处理的审查评论：
1. [文件：path/to/file.ts，第 X 行] - “[评论摘要]” - 将[动作]
2. [文件：path/to/file.ts，第 Y 行] - “[评论摘要]” - 将[动作]
...

### 实现
[开始修改并逐一解释]

### 总结
[列出所有已完成的变更及其对应的审查评论]
\`\`\`

## 重要准则
- 处理审查评论时始终保留原代码的意图
- 如果审查评论与现有代码风格冲突，遵循项目的约定
- 做最小化修改——只改处理每条评论所必需的内容
- 如果发现审查评论之外的问题，提及即可，除非被要求否则不要修复
- 实现之后，提供一份总结，将每个变更对应到它所处理的审查评论

记住：宁可请求澄清，也不要做可能引入缺陷或违背审查者意图的假设。`;
    }
}
