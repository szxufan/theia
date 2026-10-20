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

import { nls } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences';
import { AI_CORE_PREFERENCES_TITLE } from '@theia/ai-core/lib/common/ai-core-preferences';

export const SHELL_COMMAND_ALLOWLIST_PREFERENCE = 'ai-features.terminal.shellCommandAllowlist';
export const SHELL_COMMAND_DENYLIST_PREFERENCE = 'ai-features.terminal.shellCommandDenylist';
export const AI_COMMAND_REVIEW_ENABLED_PREFERENCE = 'ai-features.terminal.aiCommandReview.enabled';
export const AI_COMMAND_REVIEW_AUTO_APPROVE_PREFERENCE = 'ai-features.terminal.aiCommandReview.autoApprove';

export const shellCommandPreferences: PreferenceSchema = {
    properties: {
        [AI_COMMAND_REVIEW_ENABLED_PREFERENCE]: {
            type: 'boolean',
            default: true,
            description: nls.localize(
                'theia/ai-terminal/aiCommandReviewEnabled/description',
                '启用「命令审查」代理：shell 命令等待确认时由 AI 审查，'
                + '在确认界面上显示命令作用与风险点；判定完全无风险的只读命令可自动放行。'
            ),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [AI_COMMAND_REVIEW_AUTO_APPROVE_PREFERENCE]: {
            type: 'boolean',
            default: true,
            description: nls.localize(
                'theia/ai-terminal/aiCommandReviewAutoApprove/description',
                '允许 AI 审查判定为完全无风险的只读命令免确认直接执行。'
                + '关闭后审查结果仅用于展示，所有命令仍需人工确认。'
                + '包含危险 shell 模式（$()、反引号、-exec 等）的命令永远不会被自动放行。'
            ),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [SHELL_COMMAND_ALLOWLIST_PREFERENCE]: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: nls.localize(
                'theia/ai-terminal/shellCommandAllowlist/description',
                'Shell 命令模式列表。使用 * 作为通配符："git log"（精确匹配）、' +
                '"git log *"（可带任意参数）、"* --version"（任何以 --version 结尾的命令）。' +
                '通配符前必须有空格。包含危险模式（$、反引号）的命令永远不会被自动允许。'
            ),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [SHELL_COMMAND_DENYLIST_PREFERENCE]: {
            type: 'array',
            items: { type: 'string' },
            default: [
                // Shell execution control — these commands can execute arbitrary code,
                // bypass static analysis, or alter the shell's execution environment
                'eval *',
                'exec *',
                'source *',
                '. *',
                'trap *',
                // Indirect execution — can bypass denylist pattern matching
                // e.g., "command eval ..." or "env sudo ..."
                'command *',
                'builtin *',
                'env *',
                // Privilege escalation
                'sudo *',
                'su *',
                // Destructive operations
                'rm -rf /',
                'mkfs *',
                'dd *',
                // System control
                'shutdown *',
                'reboot *',
                'halt *',
                'poweroff *',
                // Command wrappers — execute their arguments as commands
                'xargs *',
                'nohup *',
                'timeout *',
                'nice *',
                // Remote/repeated execution
                'ssh *',
                'watch *',
                // Shell re-invocation
                'bash -c *',
                'sh -c *',
                'zsh -c *',
                'dash -c *',
                'ksh -c *',
                // Interpreter execution
                'python -c *',
                'python3 -c *',
                'node -e *',
                'perl -e *',
                'ruby -e *',
            ],
            description: nls.localize(
                'theia/ai-terminal/shellCommandDenylist/description',
                '应始终被拒绝的 Shell 命令模式列表。匹配这些模式的命令将在不经确认的情况下被自动拒绝。' +
                '使用模式语法："git push"（精确匹配）或 "git push *"（可带任意参数）。' +
                '内置了危险命令（eval、exec、sudo、rm -rf 等）的默认模式。'
            ),
            title: AI_CORE_PREFERENCES_TITLE,
        }
    }
};
