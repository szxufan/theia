// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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

import { AI_CORE_PREFERENCES_TITLE } from '@theia/ai-core/lib/common/ai-core-preferences';
import { nls, PreferenceSchema } from '@theia/core';

export const DEFAULT_CHAT_AGENT_PREF = 'ai-features.chat.defaultChatAgent';
export const PIN_CHAT_AGENT_PREF = 'ai-features.chat.pinChatAgent';
export const BYPASS_MODEL_REQUIREMENT_PREF = 'ai-features.chat.bypassModelRequirement';
export const PERSISTED_SESSION_LIMIT_PREF = 'ai-features.chat.persistedSessionLimit';
export const SESSION_STORAGE_PREF = 'ai-features.chat.sessionStorageScope';
export const WELCOME_SCREEN_SESSIONS_PREF = 'ai-features.chat.welcomeScreenSessions';
export const CLIENT_COMPACTION_ENABLED_PREFERENCE = 'ai-features.chat.clientCompaction';
export const CLIENT_COMPACTION_THRESHOLD_PREFERENCE = 'ai-features.chat.clientCompactionThreshold';
export const CLIENT_COMPACTION_KEEP_TURNS_PREFERENCE = 'ai-features.chat.clientCompactionKeepTurns';

export type SessionStorageScope = 'workspace' | 'global';

export const aiChatPreferences: PreferenceSchema = {
    properties: {
        [DEFAULT_CHAT_AGENT_PREF]: {
            type: 'string',
            description: nls.localize('theia/ai/chat/defaultAgent/description',
                '可选：当用户查询中没有通过 @<代理名> 显式指定代理时，要调用的聊天代理的标识符（ID）。 \
        如果未配置默认代理，将应用 Theia 的默认设置。'),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [PIN_CHAT_AGENT_PREF]: {
            type: 'boolean',
            description: nls.localize('theia/ai/chat/pinChatAgent/description',
                '启用代理固定以在多个提示间自动保持已提及的聊天代理处于激活状态，减少重复提及的需要。\
        您可以随时手动取消固定或切换代理。'),
            default: true,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [BYPASS_MODEL_REQUIREMENT_PREF]: {
            type: 'boolean',
            description: nls.localize('theia/ai/chat/bypassModelRequirement/description',
                '绕过语言模型要求检查。如果您使用的是不需要 Theia 语言模型的外部代理（例如 Claude Code），请启用此项。'),
            default: false,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [PERSISTED_SESSION_LIMIT_PREF]: {
            type: 'number',
            description: nls.localize('theia/ai/chat/persistedSessionLimit/description',
                '要持久化的聊天会话最大数量。使用 -1 表示不限制会话数量，0 表示禁用会话持久化。' +
                '当减少限制后，超过新限制的最旧会话将在下次保存时被自动移除。'),
            default: -1,
            minimum: -1,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [WELCOME_SCREEN_SESSIONS_PREF]: {
            type: 'number',
            description: nls.localize('theia/ai/chat/welcomeScreenSessions/description',
                '聊天概览（主页视图）上显示的聊天会话最大数量。优先填充活动会话；' +
                '溢出的会话可通过"浏览所有聊天..."链接访问。如果更高的编辑器缩放导致出现滚动条，请降低此值。' +
                '设置为 0 可完全隐藏内联列表；会话仍可通过"浏览所有聊天..."链接访问。'),
            default: 20,
            minimum: 0,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [SESSION_STORAGE_PREF]: {
            type: 'string',
            enum: ['workspace', 'global'] satisfies SessionStorageScope[],
            enumItemLabels: [
                nls.localizeByDefault('工作区'),
                nls.localizeByDefault('全局')
            ],
            enumDescriptions: [
                nls.localize('theia/ai/chat/sessionStorageScope/workspace',
                    '将聊天会话存储在工作区特定的元数据存储中。会话与工作区关联，但存储在工作区目录之外。'),
                nls.localize('theia/ai/chat/sessionStorageScope/global',
                    '将聊天会话存储在一个单一的存储中，跨所有工作区共享。')
            ],
            default: 'workspace' as SessionStorageScope,
            description: nls.localize('theia/ai/chat/sessionStorageScope/description',
                '选择是将聊天会话持久化到按工作区划分的独立存储中，还是持久化到单一的全局存储中。' +
                '如果未打开工作区，会话将回退到全局存储。'),
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [CLIENT_COMPACTION_ENABLED_PREFERENCE]: {
            type: 'boolean',
            description: nls.localize('theia/ai/chat/clientCompaction/enabled/description',
                '当会话历史接近模型上下文窗口上限时，自动把较早的对话压缩为摘要（在客户端完成，' +
                '适用于任何模型，包括本地与自定义端点模型）。完整历史仍保留在界面中。'),
            default: true,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [CLIENT_COMPACTION_THRESHOLD_PREFERENCE]: {
            type: 'number',
            description: nls.localize('theia/ai/chat/clientCompaction/threshold/description',
                '触发客户端压缩的上下文占用比例（0-1，默认 0.8）。以最近一次请求的 token 用量估算当前上下文大小。'),
            default: 0.8,
            minimum: 0.1,
            maximum: 1,
            title: AI_CORE_PREFERENCES_TITLE,
        },
        [CLIENT_COMPACTION_KEEP_TURNS_PREFERENCE]: {
            type: 'number',
            description: nls.localize('theia/ai/chat/clientCompaction/keepTurns/description',
                '客户端压缩时保留最近多少轮对话不压缩（默认 4）。'),
            default: 4,
            minimum: 1,
            title: AI_CORE_PREFERENCES_TITLE,
        }
    }
};
