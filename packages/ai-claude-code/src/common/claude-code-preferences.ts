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

import { AI_CORE_PREFERENCES_TITLE, MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail } from '@theia/ai-core/lib/common/ai-core-preferences';
import { LINUX_ENV_HINT, nls, PreferenceSchema } from '@theia/core';

export const CLAUDE_CODE_EXECUTABLE_PATH_PREF = 'ai-features.claudeCode.executablePath';
export const CLAUDE_CODE_API_KEY_PREF = 'ai-features.claudeCode.apiKey';

export const ClaudeCodePreferencesSchema: PreferenceSchema = {
    properties: {
        [CLAUDE_CODE_EXECUTABLE_PATH_PREF]: {
            type: 'string',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Claude Code' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/claude-code/executablePath/description',
                '`@anthropic-ai/claude-agent-sdk` 的 Claude Code 可执行文件（cli.js）的路径。' +
                '如果未指定，系统将尝试自动从全局 npm 安装中解析该路径。'),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [CLAUDE_CODE_API_KEY_PREF]: {
            type: 'string',
            markdownDescription: nls.localize('theia/ai/claude-code/apiKey/description',
                '输入 Claude Code 的 API 密钥。**请注意：**使用此偏好设置后，API 密钥将以明文形式存储' +
                '在运行 Theia 的机器上。请使用环境变量 `ANTHROPIC_API_KEY` 安全地设置密钥。') + LINUX_ENV_HINT,
            title: AI_CORE_PREFERENCES_TITLE,
        },
    }
};
