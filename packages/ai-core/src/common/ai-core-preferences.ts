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

import { nls, PreferenceProxyFactory } from '@theia/core';
import { PreferenceProxy } from '@theia/core/lib/common';
import { interfaces } from '@theia/core/shared/inversify';
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_OFF,
    NOTIFICATION_TYPE_LABELS,
    NOTIFICATION_TYPE_DESCRIPTIONS,
    NotificationType
} from './notification-types';
import { ReasoningSettings, SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM } from './language-model';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export const AI_CORE_PREFERENCES_TITLE = nls.localize('theia/ai-core/preferences/title', 'AI 功能');

/**
 * Key under a preference's schema `typeDetails` where a language-model provider declares the
 * human-readable name of its provider block. The AI Configuration view's Models page reads this to
 * label the provider node (discovered from the `ai-features.<provider>.*` preferences) without
 * having to hard-code provider names. Declare it on any one preference of the provider's block, e.g.
 * `typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: 'Anthropic' }`.
 */
export const MODEL_PROVIDER_TYPE_DETAIL = 'aiModelProvider';

/**
 * Key under a preference's schema `typeDetails` marking a preference that the AI Configuration view
 * edits through a dedicated control of its own, so it should not also appear as a raw settings row.
 * The value stays a plain preference, editable in `settings.json` like any other; it is only the
 * duplicate, less legible editor that is left out. Declare it as
 * `typeDetails: { [DEDICATED_EDITOR_TYPE_DETAIL]: true }`.
 */
export const DEDICATED_EDITOR_TYPE_DETAIL = 'aiDedicatedEditor';

/**
 * Shape a language-model provider stores under a preference's `typeDetails[MODEL_PROVIDER_TYPE_DETAIL]`
 * to describe its `ai-features.<provider>.*` block to the AI Configuration view's Models page. Declared
 * on any one preference of the block, e.g. `typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'Anthropic' } }`.
 */
export interface ModelProviderTypeDetail {
    /** Human-readable provider name shown as the provider node/card label. */
    label: string;
}
export const PREFERENCE_NAME_PROMPT_TEMPLATES = 'ai-features.promptTemplates.promptTemplatesFolder';
export const PREFERENCE_NAME_REQUEST_SETTINGS = 'ai-features.modelSettings.requestSettings';
export const PREFERENCE_NAME_REASONING = 'ai-features.reasoning.defaults';
export const PREFERENCE_NAME_MAX_RETRIES = 'ai-features.modelSettings.maxRetries';
export const PREFERENCE_NAME_FAVORITE_MODELS = 'ai-features.modelSettings.favoriteModels';
export const PREFERENCE_NAME_HIDDEN_MODELS = 'ai-features.modelSettings.hiddenModels';
export const PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE = 'ai-features.notifications.default';
export const PREFERENCE_NAME_SKILL_DIRECTORIES = 'ai-features.skills.skillDirectories';
export const PREFERENCE_NAME_SERVER_SIDE_COMPACTION = 'ai-features.chat.serverSideCompaction';
export const PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD = 'ai-features.chat.serverSideCompactionTokenThreshold';
export const PREFERENCE_NAME_COLLAPSE_TOOL_CALLS = 'ai-features.chat.collapseToolCalls';

export const LANGUAGE_MODEL_ALIASES_PREFERENCE = 'ai-features.languageModelAliases';

export const aiCorePreferenceSchema: PreferenceSchema = {
    properties: {
        [PREFERENCE_NAME_SERVER_SIDE_COMPACTION]: {
            title: nls.localize('theia/ai/core/serverSideCompaction/title', '服务端压缩'),
            type: 'boolean',
            description: nls.localize('theia/ai/core/serverSideCompaction/description',
                '默认为聊天请求启用提供商原生的服务端压缩。启用后，支持的模型会在对话超出其自身阈值时自动总结较早的轮次，' +
                '让长会话能够突破上下文限制继续进行。每个提供商均可单独覆盖此设置，单个聊天会话也可在其会话设置中覆盖。不支持该功能的模型会忽略此设置。'),
            default: true,
        },
        [PREFERENCE_NAME_COLLAPSE_TOOL_CALLS]: {
            title: nls.localize('theia/ai/core/collapseToolCalls/title', '折叠工具调用'),
            type: 'boolean',
            description: nls.localize('theia/ai/core/collapseToolCalls/description',
                '将聊天回复中连续多次已完成的工具调用折叠为一行摘要，点击可展开查看每次调用的参数与结果。' +
                '进行中的调用始终保持展开显示。'),
            default: true,
        },
        [PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD]: {
            title: nls.localize('theia/ai/core/serverSideCompactionTokenThreshold/title', '服务端压缩 Token 阈值'),
            type: 'integer',
            minimum: SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD_MINIMUM,
            description: nls.localize('theia/ai/core/serverSideCompactionTokenThreshold/description',
                '提供商原生服务端压缩的默认输入 token 阈值。提供商和单个聊天会话可以覆盖此值。未设置时，提供商使用其默认阈值。若设置，该值必须至少为 50,000 个 token。'),
        },
        [PREFERENCE_NAME_PROMPT_TEMPLATES]: {
            title: nls.localize('theia/ai/core/promptTemplates/title', '提示词模板文件夹'),
            description: nls.localize('theia/ai/core/promptTemplates/description',
                '用于存储自定义提示词模板的文件夹。未自定义时使用用户配置目录。建议使用纳入版本控制的文件夹来管理你的提示词模板变体。'),
            type: 'string',
            default: '',
            typeDetails: {
                isFilepath: true,
                selectionProps: {
                    openLabel: nls.localizeByDefault('选择文件夹'),
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false
                }
            },
        },
        [PREFERENCE_NAME_REQUEST_SETTINGS]: {
            title: nls.localize('theia/ai/core/requestSettings/title', '自定义请求设置'),
            markdownDescription: nls.localize('theia/ai/core/requestSettings/mdDescription', '允许为多个模型指定自定义请求设置。\n\
            每个设置包含：\n\
            - `scope`：定义设置何时生效：\n\
              - `modelId`（可选）：要匹配的模型 ID\n\
              - `providerId`（可选）：要匹配的提供商 ID（例如 huggingface、openai、ollama、llamafile）\n\
              - `agentId`（可选）：要匹配的代理 ID\n\
            - `requestSettings`：以键值对形式表示的模型特定设置\n\
            - `clientSettings`：客户端消息处理设置：\n\
              - `keepToolCalls`（布尔值）：是否在上下文中保留工具调用\n\
              - `keepThinking`（布尔值）：是否保留思考消息\n\
            设置按特异度匹配（agent: 100 分，model: 10 分，provider: 1 分）。\n\
            更多信息请参阅[我们的文档](https://theia-ide.org/docs/user_ai/#custom-request-settings)。'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    scope: {
                        type: 'object',
                        properties: {
                            modelId: {
                                type: 'string',
                                description: nls.localize('theia/ai/core/requestSettings/scope/modelId/description', '（可选的）模型 ID')
                            },
                            providerId: {
                                type: 'string',
                                description: nls.localize('theia/ai/core/requestSettings/scope/providerId/description', '（可选的）应用此设置的提供商 ID。'),
                            },
                            agentId: {
                                type: 'string',
                                description: nls.localize('theia/ai/core/requestSettings/scope/agentId/description', '（可选的）应用此设置的代理 ID。'),
                            },
                        }
                    },
                    requestSettings: {
                        type: 'object',
                        additionalProperties: true,
                        description: nls.localize('theia/ai/core/requestSettings/modelSpecificSettings/description', '针对特定模型 ID 的设置。'),
                    },
                    clientSettings: {
                        type: 'object',
                        additionalProperties: false,
                        description: nls.localize('theia/ai/core/requestSettings/clientSettings/description',
                            '客户端设置，用于控制如何处理发回 LLM 的消息。'),
                        properties: {
                            keepToolCalls: {
                                type: 'boolean',
                                default: true,
                                description: nls.localize('theia/ai/core/requestSettings/clientSettings/keepToolCalls/description',
                                    '若设为 false，在多轮对话中发送下一条用户请求之前，所有工具请求和工具响应都将被过滤掉。')
                            },
                            keepThinking: {
                                type: 'boolean',
                                default: true,
                                description: nls.localize('theia/ai/core/requestSettings/clientSettings/keepThinking/description',
                                    '若设为 false，在多轮对话中发送下一条用户请求之前，所有思考输出都将被过滤掉。')
                            }
                        }
                    },
                },
                additionalProperties: false
            },
            default: [],
        },
        [PREFERENCE_NAME_MAX_RETRIES]: {
            title: nls.localize('theia/ai/core/maxRetries/title', '最大重试次数'),
            markdownDescription: nls.localize('theia/ai/core/maxRetries/mdDescription',
                '对 AI 提供商的请求失败时的最大重试次数。设为 0 表示不重试。'),
            type: 'number',
            minimum: 0,
            default: 3
        },
        [PREFERENCE_NAME_FAVORITE_MODELS]: {
            title: nls.localize('theia/ai/core/favoriteModels/title', '收藏的模型'),
            markdownDescription: nls.localize('theia/ai/core/favoriteModels/mdDescription',
                '除了每个提供商最新的模型之外，AI 聊天输入的模型选择器还会显示这些模型，以完全限定 ID 表示 '
                + '（例如 `anthropic/claude-opus-5`）。这用于保留旧版本或锁定版本的模型。在 AI 配置视图中该模型的提供商页面上勾选它即可添加。'),
            type: 'array',
            // The provider pages check models one by one; a second, raw editor for the same ids would
            // invite typos and disagree with what the checks say.
            typeDetails: { [DEDICATED_EDITOR_TYPE_DETAIL]: true },
            items: {
                type: 'string'
            },
            default: []
        },
        [PREFERENCE_NAME_HIDDEN_MODELS]: {
            title: nls.localizeByDefault('隐藏的模型'),
            markdownDescription: nls.localize('theia/ai/core/hiddenModels/mdDescription',
                'AI 聊天输入的模型选择器默认本会显示、但不予显示的模型，以完全限定 ID 表示 '
                + '（例如 `google/gemini-flash-lite-latest`）。只有未经列为收藏即显示的模型（即各提供商最新的模型）会出现在此处。在 AI 配置视图中该模型的提供商页面上取消勾选它即可添加。'),
            type: 'array',
            typeDetails: { [DEDICATED_EDITOR_TYPE_DETAIL]: true },
            items: {
                type: 'string'
            },
            default: []
        },
        [PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE]: {
            title: nls.localize('theia/ai/core/defaultNotification/title', '默认通知类型'),
            markdownDescription: nls.localize('theia/ai/core/defaultNotification/mdDescription',
                '当 AI 代理需要你的关注（例如完成任务或请求输入）时使用的默认通知方式。'
                + '单个代理可以覆盖此设置。'),
            type: 'string',
            enum: [...NOTIFICATION_TYPES],
            enumItemLabels: NOTIFICATION_TYPES.map(type => NOTIFICATION_TYPE_LABELS[type]),
            enumDescriptions: NOTIFICATION_TYPES.map(type => NOTIFICATION_TYPE_DESCRIPTIONS[type]),
            default: NOTIFICATION_TYPE_OFF
        },
        [PREFERENCE_NAME_SKILL_DIRECTORIES]: {
            title: nls.localize('theia/ai/core/skillDirectories/title', '技能目录'),
            description: nls.localize('theia/ai/core/skillDirectories/description',
                '包含技能定义（SKILL.md 文件）的其他目录。技能提供可被 AI 代理引用的可复用指令。' +
                '工作区中的 .prompts/skills 和 .agents/skills 目录、主目录中的 .agents/skills 目录，' +
                '以及产品配置文件夹中的 skills 目录始终会被包含。'),
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
        },
        [PREFERENCE_NAME_REASONING]: {
            title: nls.localize('theia/ai/core/reasoning/title', '推理默认设置'),
            markdownDescription: nls.localize('theia/ai/core/reasoning/mdDescription',
                '聊天输入推理选择器的默认值，应用于支持推理的模型。\n\n'
                + '这是一个 UI 层设置：所选级别会在请求时转换为提供商的原生 API 参数'
                + '（例如 Anthropic 的 `thinking` / `output_config.effort`、OpenAI 的 `reasoning.effort`、'
                + ' Gemini 的 `thinkingConfig`），并且优先于通过 `#ai-features.modelSettings.requestSettings#` '
                + '为相同字段提供的原始值。\n\n'
                + '每个条目包含：\n'
                + '- `scope`：定义设置何时生效（`modelId`、`providerId`、`agentId`）。\n'
                + '- `reasoning.level`：`off`、`none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`、`auto` 之一。\n'
                + '支持的级别取决于模型。`none` 明确请求不进行推理；`off` 在 Ollama 上禁用思考。'
                + '对于其他提供商，`off` 会省略显式推理力度，允许使用提供商默认值或原始请求设置。`auto` 使用提供商默认值。\n\n'
                + '运行时优先级（从高到低）：通过选择器进行的会话覆盖 → 此首选项 → 模型声明的默认值。选择器显示的即是发送的内容。'
                + '要通过 `#ai-features.modelSettings.requestSettings#` 手动覆盖提供商的推理字段，请在此处将 '
                + ' `reasoning.level` 设为 `off`，以禁用基于级别的转换（Ollama 除外）。\n\n'
                + '条目按作用域特异度匹配（agent: 100 分，model: 10 分，provider: 1 分）。\n\n'
                + '示例：\n'
                + '```json\n'
                + '[\n'
                + '  { "scope": { "providerId": "anthropic" }, "reasoning": { "level": "medium" } },\n'
                + '  { "scope": { "modelId": "openai/gpt-5" }, "reasoning": { "level": "high" } },\n'
                + '  { "scope": { "agentId": "Coder" }, "reasoning": { "level": "off" } }\n'
                + ']\n'
                + '```'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    scope: {
                        type: 'object',
                        properties: {
                            modelId: { type: 'string' },
                            providerId: { type: 'string' },
                            agentId: { type: 'string' }
                        }
                    },
                    reasoning: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            level: {
                                type: 'string',
                                enum: ['off', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto'],
                                default: 'auto'
                            }
                        },
                        required: ['level']
                    }
                },
                additionalProperties: false
            },
            default: []
        },
        [LANGUAGE_MODEL_ALIASES_PREFERENCE]: {
            title: nls.localize('theia/ai/core/preference/languageModelAliases/title', '语言模型别名'),
            markdownDescription: nls.localize('theia/ai/core/preference/languageModelAliases/description', '在\
[AI 配置视图]({0})中为每个语言模型别名配置模型。也可以在 settings.json 中手动设置：\n\
```\n\
"default/code": {\n\
  "selectedModel": "anthropic/claude-opus-4-20250514"\n\
}\n\```',
                'command:aiConfiguration:open'
            ),
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    selectedModel: {
                        type: 'string',
                        description: nls.localize('theia/ai/core/preference/languageModelAliases/selectedModel', '用户为此别名选择的模型。')
                    }
                },
                required: ['selectedModel'],
                additionalProperties: false
            },
            default: {},
        }
    }
};

export interface AICoreConfiguration {
    [PREFERENCE_NAME_PROMPT_TEMPLATES]: string | undefined;
    [PREFERENCE_NAME_REQUEST_SETTINGS]: Array<RequestSetting> | undefined;
    [PREFERENCE_NAME_REASONING]: Array<ReasoningPreferenceEntry> | undefined;
    [PREFERENCE_NAME_MAX_RETRIES]: number | undefined;
    [PREFERENCE_NAME_FAVORITE_MODELS]: string[] | undefined;
    [PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE]: NotificationType | undefined;
    [PREFERENCE_NAME_SKILL_DIRECTORIES]: string[] | undefined;
    [PREFERENCE_NAME_SERVER_SIDE_COMPACTION]: boolean | undefined;
    [PREFERENCE_NAME_SERVER_SIDE_COMPACTION_TOKEN_THRESHOLD]: number | undefined;
}

export interface RequestSetting {
    scope?: Scope;
    clientSettings?: { keepToolCalls: boolean; keepThinking: boolean };
    requestSettings?: { [key: string]: unknown };
}

export interface Scope {
    modelId?: string;
    providerId?: string;
    agentId?: string;
}

export interface ReasoningPreferenceEntry {
    scope?: Scope;
    reasoning?: ReasoningSettings;
}

export const AICorePreferences = Symbol('AICorePreferences');
export type AICorePreferences = PreferenceProxy<AICoreConfiguration>;

export function bindAICorePreferences(bind: interfaces.Bind): void {
    bind(AICorePreferences).toDynamicValue(ctx => {
        const factory = ctx.container.get<PreferenceProxyFactory>(PreferenceProxyFactory);
        return factory(aiCorePreferenceSchema);
    }).inSingletonScope();
}

/**
 * Calculates the specificity score of a RequestSetting for a given scope.
 * The score is calculated based on matching criteria:
 * - Agent match: 100 points
 * - Model match: 10 points
 * - Provider match: 1 point
 *
 * @param setting RequestSetting object to check against
 * @param scope Optional scope object containing modelId, providerId, and agentId
 * @returns Specificity score (-1 for non-match, or sum of matching criteria points)
 */
export const getRequestSettingSpecificity = (setting: RequestSetting, scope?: Scope): number => {
    // If no scope is defined in the setting, return default specificity
    if (!setting.scope) {
        return 0;
    }

    // If no matching criteria are defined in the scope, return default specificity
    if (!setting.scope.modelId && !setting.scope.providerId && !setting.scope.agentId) {
        return 0;
    }

    // Check for explicit non-matches (return -1)
    if (scope?.modelId && setting.scope.modelId && setting.scope.modelId !== scope.modelId) {
        return -1;
    }

    if (scope?.providerId && setting.scope.providerId && setting.scope.providerId !== scope.providerId) {
        return -1;
    }

    if (scope?.agentId && setting.scope.agentId && setting.scope.agentId !== scope.agentId) {
        return -1;
    }

    let specificity = 0;

    // Check provider match (1 point)
    if (scope?.providerId && setting.scope.providerId === scope.providerId) {
        specificity += 1;
    }

    // Check model match (10 points)
    if (scope?.modelId && setting.scope.modelId === scope.modelId) {
        specificity += 10;
    }

    // Check agent match (100 points)
    if (scope?.agentId && setting.scope.agentId === scope.agentId) {
        specificity += 100;
    }

    return specificity;
};
