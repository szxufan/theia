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

import { createPreferenceProxy, PreferenceContribution, PreferenceProxy, PreferenceScope, PreferenceSchema, PreferenceService } from '@theia/core/lib/common/preferences';
import { nls } from '@theia/core/lib/common/nls';
import { interfaces } from '@theia/core/shared/inversify';

export const CHAT_VIEW_TOKEN_USAGE_ENABLED = 'ai-features.chat.tokenUsageIndicator.enabled';
export const CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED = 'ai-features.chat.tokenUsageWarning.enabled';
export const CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE = 'ai-features.chat.tokenUsageWarning.defaultThresholdPercentage';
export const CHAT_VIEW_ALLOWED_RESOURCE_URLS = 'ai-features.chat.allowedResourceUrls';
export const CHAT_VIEW_FULL_ACCESS_ACKNOWLEDGED = 'ai-features.chat.fullAccessAcknowledged';

export const CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT = 80;

export const chatViewPreferenceSchema: PreferenceSchema = {
    properties: {
        [CHAT_VIEW_TOKEN_USAGE_ENABLED]: {
            type: 'boolean',
            default: false,
            description: nls.localize(
                'theia/ai/chat-ui/tokenUsageIndicatorEnabled',
                '控制是否在聊天视图中显示实验性的令牌用量指示器。' +
                '此功能仍处于实验阶段，令牌计数可能因模型和提供商的不同而不准确。'
            ),
            tags: ['experimental']
        },
        [CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED]: {
            type: 'boolean',
            default: false,
            description: nls.localize(
                'theia/ai/chat-ui/tokenUsageWarningEnabled',
                '控制当聊天会话的令牌用量超过配置的阈值时是否显示通知。' +
                '需要语言模型提供商报告令牌用量。'
            ),
            tags: ['experimental']
        },
        [CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE]: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT,
            description: nls.localize(
                'theia/ai/chat-ui/tokenUsageWarningThresholdPercentage',
                '触发令牌用量警告的模型上下文窗口百分比。' +
                '此值同时决定令牌用量指示器的警告/错误色带。' +
                '目前按假定的 200k 上下文窗口计算；待每个模型的真实上下文大小可用后将改用真实值。'
            ),
            tags: ['experimental']
        },
        [CHAT_VIEW_ALLOWED_RESOURCE_URLS]: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: [],
            description: nls.localize(
                'theia/ai/chat-ui/allowedResourceUrls',
                'AI 聊天回复中引用的外部资源（图片、样式表、媒体等）默认会被阻止，' +
                '并在被明确允许之前替换为占位符。URL 以所配置前缀之一开头的资源将直接渲染而不被阻止。' +
                '请包含以斜杠结尾的完整源（例如 "https://example.com/"），以避免意外匹配。仅添加你完全信任的来源。'
            )
        },
        [CHAT_VIEW_FULL_ACCESS_ACKNOWLEDGED]: {
            type: 'boolean',
            default: false,
            scope: PreferenceScope.User,
            description: nls.localize(
                'theia/ai/chat-ui/fullAccessAcknowledged',
                '确认已知晓「完全访问」权限模式的风险。完全访问模式下，AI 修改文件、执行命令均自动放行，' +
                '不再弹确认。在将其设置为 `true` 之前，首次切换到完全访问模式时会显示确认对话框。'
            )
        }
    }
};

export interface ChatViewConfiguration {
    [CHAT_VIEW_TOKEN_USAGE_ENABLED]: boolean;
    [CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED]: boolean;
    [CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE]: number;
    [CHAT_VIEW_ALLOWED_RESOURCE_URLS]: string[];
}

export const ChatViewPreferenceContribution = Symbol('ChatViewPreferenceContribution');
export const ChatViewPreferences = Symbol('ChatViewPreferences');
export type ChatViewPreferences = PreferenceProxy<ChatViewConfiguration>;

export function createChatViewPreferences(preferences: PreferenceService, schema: PreferenceSchema = chatViewPreferenceSchema): ChatViewPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindChatViewPreferences(bind: interfaces.Bind): void {
    bind(ChatViewPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(ChatViewPreferenceContribution);
        return createChatViewPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(ChatViewPreferenceContribution).toConstantValue({ schema: chatViewPreferenceSchema });
    bind(PreferenceContribution).toService(ChatViewPreferenceContribution);
}
