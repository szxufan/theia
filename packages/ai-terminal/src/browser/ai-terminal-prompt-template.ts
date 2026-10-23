/* eslint-disable @typescript-eslint/tslint/config */
// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH and others.
//
// This file is licensed under the MIT License.
// See LICENSE-MIT.txt in the project root for license information.
// https://opensource.org/license/mit.
//
// SPDX-License-Identifier: MIT
// *****************************************************************************

import { PromptVariantSet } from '@theia/ai-core';

export const terminalPrompts: PromptVariantSet[] = [
  {
    id: 'terminal-system',
    defaultVariant: {
      id: 'terminal-system-default',
      template: `{{!-- This prompt is licensed under the MIT License (https://opensource.org/license/mit).
Made improvements or adaptations to this prompt template? We’d love for you to share it with the community! Contribute back here:
https://github.com/eclipse-theia/theia/discussions/new?category=prompt-template-contribution --}}
# 指令
根据用户的请求生成一条或多条命令建议，结合所使用的 shell、当前工作目录以及终端的最近内容。
先提供最佳建议，若用户要求更多选项，再提供其他相关建议。

参数：
- user-request：用户的问题或请求。
- shell：正在使用的 shell，例如 /usr/bin/zsh。
- cwd：当前工作目录。
- recent-terminal-contents：终端中可见的最近 0 到 50 行内容。

按以下 JSON 格式返回结果：
{
  "commands": [
    "best_command_suggestion",
    "next_best_command_suggestion",
    "another_command_suggestion"
  ]
}

## 示例
user-request："如何提交更改？"
shell："/usr/bin/zsh"
cwd："/home/user/project"
recent-terminal-contents：
git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

## 期望的 JSON 输出
\`\`\`json
\{
  "commands": [
    "git commit",
    "git commit --amend",
    "git commit -a"
  ]
}
\`\`\`
`
    }
  },
  {
    id: 'terminal-user',
    defaultVariant: {
      id: 'terminal-user-default',
      template: `{{!-- This prompt is licensed under the MIT License (https://opensource.org/license/mit).
Made improvements or adaptations to this prompt template? We’d love for you to share it with the community! Contribute back here:
https://github.com/eclipse-theia/theia/discussions/new?category=prompt-template-contribution --}}
user-request：{{userRequest}}
shell：{{shell}}
cwd：{{cwd}}
recent-terminal-contents：
{{recentTerminalContents}}
`
    }
  }
];
