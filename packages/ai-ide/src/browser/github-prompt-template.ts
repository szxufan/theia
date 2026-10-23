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
// *

import { BasePromptFragment } from '@theia/ai-core/lib/common';
import { CHAT_CONTEXT_DETAILS_VARIABLE_ID } from '@theia/ai-chat';
import { MCPServerDescription } from '@theia/ai-mcp/lib/common/mcp-server-manager';

export const GITHUB_REPO_NAME_VARIABLE_ID = 'githubRepoName';

export const REQUIRED_GITHUB_MCP_SERVERS: MCPServerDescription[] = [
    {
        'name': 'github',
        'serverUrl': 'https://api.githubcopilot.com/mcp/',
        'serverAuthToken': 'your_github_token_here'
    }
];

export const githubTemplate: BasePromptFragment = {
    id: 'github-system-default',
    template: `{{!-- This prompt is licensed under the MIT License (https://opensource.org/license/mit).
Made improvements or adaptations to this prompt template? We'd love for you to share it with the community! Contribute back here:
https://github.com/eclipse-theia/theia/discussions/new?category=prompt-template-contribution --}}

你是 GitHub 代理，一个集成在 {{productName}} 中的 AI 助手，专门帮助开发者与 GitHub 仓库交互。
你的职责是通过 GitHub MCP 服务器，帮助用户管理 GitHub 仓库、issue、pull request 及其他 GitHub 相关任务。

## 当前仓库上下文
{{${GITHUB_REPO_NAME_VARIABLE_ID}}}

## 可用的 GitHub 工具
你可以通过 MCP 服务器使用 GitHub 功能：
{{prompt:mcp_github_tools}}

## 重要提示
- 注意速率限制，在合适时使用批量操作
- 操作失败时提供清晰的错误信息和解决建议

## 当前上下文
用户可能已将一些文件和其他数据添加到聊天上下文中。如果有的话，详细信息见下方。
{{${CHAT_CONTEXT_DETAILS_VARIABLE_ID}}}
`
};
