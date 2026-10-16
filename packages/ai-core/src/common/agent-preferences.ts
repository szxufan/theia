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

import { nls, PreferenceSchema } from '@theia/core';
import {
    NOTIFICATION_TYPES
} from './notification-types';

export const AGENT_SETTINGS_PREF = 'ai-features.agentSettings';

export const AgentSettingsPreferenceSchema: PreferenceSchema = {
    properties: {
        [AGENT_SETTINGS_PREF]: {
            type: 'object',
            title: nls.localize('theia/ai/agents/title', '代理设置'),
            hidden: true,
            markdownDescription: nls.localize('theia/ai/agents/mdDescription', '配置代理设置，例如启用或禁用特定代理、配置提示词以及选择 LLM。'),
            additionalProperties: {
                type: 'object',
                properties: {
                    enable: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/agents/enable/title', '启用代理'),
                        markdownDescription: nls.localize('theia/ai/agents/enable/mdDescription', '指定应启用（true）还是禁用（false）该代理。'),
                        default: true
                    },
                    showInChat: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/agents/showInChat/title', '在聊天中显示'),
                        markdownDescription: nls.localize('theia/ai/agents/showInChat/mdDescription',
                            '指定该代理应在聊天界面中显示（true）还是隐藏（false）。'),
                        default: true
                    },
                    languageModelRequirements: {
                        type: 'array',
                        title: nls.localize('theia/ai/agents/languageModelRequirements/title', '语言模型要求'),
                        markdownDescription: nls.localize('theia/ai/agents/languageModelRequirements/mdDescription', '指定该代理使用的语言模型。'),
                        items: {
                            type: 'object',
                            properties: {
                                purpose: {
                                    type: 'string',
                                    title: nls.localize('theia/ai/agents/languageModelRequirements/purpose/title', '用途'),
                                    markdownDescription: nls.localize('theia/ai/agents/languageModelRequirements/purpose/mdDescription',
                                        '此语言模型的用途。')
                                },
                                identifier: {
                                    type: 'string',
                                    title: nls.localizeByDefault('标识符'),
                                    markdownDescription: nls.localize('theia/ai/agents/languageModelRequirements/identifier/mdDescription',
                                        '要使用的语言模型的标识符。')
                                }
                            },
                            required: ['purpose', 'identifier']
                        }
                    },
                    selectedVariants: {
                        type: 'object',
                        title: nls.localize('theia/ai/agents/selectedVariants/title', '已选变体'),
                        markdownDescription: nls.localize('theia/ai/agents/selectedVariants/mdDescription', '指定该代理当前选中的提示词变体。'),
                        additionalProperties: {
                            type: 'string'
                        }
                    },
                    completionNotification: {
                        type: 'string',
                        enum: [...NOTIFICATION_TYPES],
                        title: nls.localize('theia/ai/agents/completionNotification/title', '通知'),
                        markdownDescription: nls.localize('theia/ai/agents/completionNotification/mdDescription',
                            '当该代理需要你的关注（例如完成任务或请求输入）时的通知行为。\
                    如果未设置，将使用全局默认通知设置。\n\
                    - `os-notification`: 显示操作系统/系统通知\n\
                    - `message`: 在状态栏/消息区域显示通知\n\
                    - `blink`: 闪烁或高亮界面\n\
                    - `off`: 禁用该代理的通知')
                    },
                    capabilityOverrides: {
                        type: 'object',
                        title: nls.localize('theia/ai/agents/capabilityOverrides/title', '能力覆盖'),
                        markdownDescription: nls.localize('theia/ai/agents/capabilityOverrides/mdDescription',
                            '用户对基于模板的能力的覆盖设置。键为能力片段 ID，值为启用（true）或禁用（false）。'),
                        additionalProperties: {
                            type: 'boolean'
                        }
                    },
                    genericCapabilitySelections: {
                        type: 'object',
                        title: nls.localize('theia/ai/agents/genericCapabilitySelections/title', '通用能力选择'),
                        markdownDescription: nls.localize('theia/ai/agents/genericCapabilitySelections/mdDescription',
                            '用户对通用能力（如技能、函数和 MCP 工具）的选择。'),
                        properties: {
                            skills: {
                                type: 'array',
                                items: { type: 'string' },
                                description: nls.localize('theia/ai/agents/genericCapabilitySelections/skills', '已选技能 ID')
                            },
                            mcpFunctions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: nls.localize('theia/ai/agents/genericCapabilitySelections/mcpFunctions', '已选 MCP 函数 ID')
                            },
                            functions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: nls.localize('theia/ai/agents/genericCapabilitySelections/functions', '已选函数 ID')
                            },
                            promptFragments: {
                                type: 'array',
                                items: { type: 'string' },
                                description: nls.localize('theia/ai/agents/genericCapabilitySelections/promptFragments', '已选提示词片段 ID')
                            },
                            agentDelegation: {
                                type: 'array',
                                items: { type: 'string' },
                                description: nls.localize('theia/ai/agents/genericCapabilitySelections/agentDelegation', '已选用于委派的代理 ID')
                            },
                            variables: {
                                type: 'array',
                                items: { type: 'string' },
                                description: nls.localize('theia/ai/agents/genericCapabilitySelections/variables', '已选变量名')
                            }
                        }
                    },
                    serverToolSelections: {
                        type: 'object',
                        title: nls.localize('theia/ai/agents/serverToolSelections/title', '服务器工具选择'),
                        markdownDescription: nls.localize('theia/ai/agents/serverToolSelections/mdDescription',
                            '用户对提供商服务器工具的选择，按模型供应商分组。每个值包含该供应商已启用的服务器工具 ID。'),
                        additionalProperties: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                },
                required: ['languageModelRequirements']
            }
        }
    }
};
