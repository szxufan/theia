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

import { AI_CORE_PREFERENCES_TITLE } from '@theia/ai-core/lib/common';
import { nls, PreferenceSchema, PreferenceScope } from '@theia/core';

// We reuse the context key for the preference name
export const PREFERENCE_NAME_ENABLE_AI = 'ai-features.AiEnable.enableAI';
export const PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST = 'ai-features.orchestrator.excludedAgents';
export const PREFERENCE_NAME_AGENT_MODE_ENABLED = 'ai-features.agentMode.enabled';
export const aiIdePreferenceSchema: PreferenceSchema = {
    properties: {
        [PREFERENCE_NAME_ENABLE_AI]: {
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: '❗ ' + nls.localize('theia/ai/ide/enableAI/mdDescription',
                '此设置允许你访问 Theia IDE 的 AI 功能。\
            \n\
            请注意，AI 功能可能会向你授权的语言模型 (LLM) \
            持续发起请求。这可能产生需要你密切关注的成本。启用此选项即表示你知晓这些风险。\
            \n\
            **请注意！只有在启用主功能设置后，本节中的以下设置才会生效。\
            启用该功能后，你需要在下方至少配置一个\
            LLM 提供商。另请参阅[文档](https://theia-ide.org/docs/user_ai/)**。'),
            type: 'boolean',
            default: false,
        },
        [PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST]: {
            title: AI_CORE_PREFERENCES_TITLE,
            markdownDescription: nls.localize('theia/ai/ide/orchestrator/excludedAgents/mdDescription',
                '编排器不允许委派给它的代理 ID 列表。' +
                '在选择处理请求的代理时，这些代理将对编排器不可见。'),
            type: 'array',
            items: {
                type: 'string'
            },
            default: ['ClaudeCode', 'Codex'],
        },
        [PREFERENCE_NAME_AGENT_MODE_ENABLED]: {
            title: AI_CORE_PREFERENCES_TITLE,
            description: nls.localize('theia/ai/ide/agentMode/enabled/mdDescription',
                '为 Coder 代理启用代理模式。代理模式允许在不经进一步确认的情况下自主修改文件。\
                 在将其设置为 `true` 之前，使用代理模式时会显示首次使用确认对话框。'),
            type: 'boolean',
            default: false,
            scope: PreferenceScope.User
        }
    }
};
