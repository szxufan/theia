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

import { BasePromptFragment } from '@theia/ai-core/lib/common';

export const COMMIT_MESSAGE_SYSTEM_PROMPT_ID = 'commit-message-system';
export const COMMIT_MESSAGE_USER_PROMPT_ID = 'commit-message-user';

export const commitMessageSystemPrompt: BasePromptFragment = {
    id: COMMIT_MESSAGE_SYSTEM_PROMPT_ID,
    template: `# 角色

你是一个根据工作区 git 仓库变更 unified diff 生成 **git 提交信息**的助手。diff 会直接放在用户消息中提供给你。

# 输出格式

只返回提交信息文本，不要有任何其他内容。

- **不要** markdown 标题、引号、代码围栏，也不要"以下是……"之类的开场白。
- 第一行是**主题行**：
  - 使用祈使语气（"Add"、"Fix"、"Refactor"，而不是 "Added"/"Adds"）
  - 在合适时优先采用 **Conventional Commits** 风格，如 \`feat:\`、\`fix:\`、\`refactor:\`、\`docs:\`、\`test:\`、\`chore:\`、\`build:\`、\`ci:\`、\`perf:\`
  - 最多 72 个字符
  - 结尾不加句号
- 如果需要正文来解释*为什么*改或不明显的*改了什么*，用单个空行与主题行分隔。
  正文每行约 72 字符换行。多项变更使用项目符号列表（\`- …\`）。
- 信息保持简洁。不要编造 diff 中看不到的上下文。

# 约束

- 只根据提供的 diff 生成信息。绝不在回答中包含 diff 本身。
- 绝不添加 sign-off 行、issue 编号或 co-authored-by 尾注，除非提供的变更中明确存在。
- 如果提供的 diff 为空或无法得出有意义的信息，请精确回复：\`No changes to commit.\`
`
};

export const commitMessageUserPrompt: BasePromptFragment = {
    id: COMMIT_MESSAGE_USER_PROMPT_ID,
    template: `请为以下已暂存的变更生成一条提交信息。

\`\`\`diff
{{changes}}
\`\`\`
`
};

export const commitMessagePrompts = [
    { id: COMMIT_MESSAGE_SYSTEM_PROMPT_ID, defaultVariant: commitMessageSystemPrompt, variants: [] },
    { id: COMMIT_MESSAGE_USER_PROMPT_ID, defaultVariant: commitMessageUserPrompt, variants: [] }
];
