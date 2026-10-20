// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
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

import {
    AgentService,
    AISettingsService,
    AIVariableService,
    CustomAgentsLocation,
    FrontendLanguageModelRegistry,
    LanguageModel,
    LanguageModelRegistry,
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_LABELS,
    PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE,
    PromptFragmentCustomizationService,
    PromptService,
    ToolInvocationRegistry,
} from '@theia/ai-core/lib/common';
import { AGENT_SETTINGS_PREF } from '@theia/ai-core/lib/common/agent-preferences';
import { LanguageModelAlias, LanguageModelAliasRegistry } from '@theia/ai-core/lib/common/language-model-alias';
import { DEFAULT_CHAT_AGENT_PREF } from '@theia/ai-chat/lib/common/ai-chat-preferences';
import { getAgentDisplayName, isChatAgent } from '@theia/ai-chat/lib/common';
import { GenericCapabilitiesService } from '@theia/ai-chat-ui/lib/browser/generic-capabilities-service';
import { ChatCapabilitiesService } from '@theia/ai-chat-ui/lib/browser/chat-capabilities-service';
import { CommandService, DisposableCollection, Emitter, Event, ILogger, MessageService, nls, URI } from '@theia/core';
import { codicon, HoverService, QuickInputService } from '@theia/core/lib/browser';
import { SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import { inject, injectable, named, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import {
    AiConfigurationCategory,
    AiConfigurationCategoryId,
    AiConfigurationCategoryOrder,
    AiConfigurationRenderContext,
    AiConfigurationTools,
    AiConfigurationSearchItem,
    AiConfigurationSearchProvider,
    AiConfigurationTreeItem
} from '@theia/ai-core-ui/lib/browser/ai-configuration/ai-configuration-category';
import { CollectionCategoryRenderer, AiConfigurationAddDescriptor } from '@theia/ai-core-ui/lib/browser/ai-configuration/renderers/collection-category-renderer';
import { AiConfigurationSection } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-primitives';
import { AiSettingsRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row';
import { AiSettingsRowService } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row-service';
import { PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST } from '../../../common/ai-ide-preferences';
import { AgentDetailView } from './agent-detail-view';
import { PromptSnippetsConfiguration } from './prompt-snippets-configuration-category';
import { AgentDetailServices } from './agent-detail-model';
import { getAgentIconClass } from '../agent-icon';

/** A candidate location for creating a new custom agent: its scope directory and `agents/` folder. */
interface CustomAgentScopeOption {
    scopeDir: URI;
    agentsDir: URI;
}

/**
 * The Agents category: a `collection` contributed onto the shared primitives.
 * Owns the agent-related service logic (previously in `AIAgentConfigurationWidget`)
 * and delegates the per-item detail to {@link AgentDetailView}.
 */
@injectable()
export class AgentsConfigurationCategory extends CollectionCategoryRenderer implements AiConfigurationCategory, AiConfigurationSearchProvider {

    readonly id = AiConfigurationCategoryId.AGENTS;
    readonly label = nls.localizeByDefault('代理');
    readonly description = nls.localize('theia/ai/ide/agentsConfiguration/description',
        'IDE 中可用的 AI 代理。打开某个代理以配置其提示词、模型与能力。');
    readonly iconClass = codicon('copilot');
    readonly order = AiConfigurationCategoryOrder.AGENTS;
    readonly kind = 'collection' as const;

    @inject(AgentService)
    protected readonly agentService: AgentService;

    @inject(LanguageModelRegistry)
    protected readonly languageModelRegistry: FrontendLanguageModelRegistry;

    @inject(PromptFragmentCustomizationService)
    protected readonly promptFragmentCustomizationService: PromptFragmentCustomizationService;

    @inject(LanguageModelAliasRegistry)
    protected readonly languageModelAliasRegistry: LanguageModelAliasRegistry;

    @inject(AISettingsService)
    protected readonly aiSettingsService: AISettingsService;

    @inject(AIVariableService)
    protected readonly variableService: AIVariableService;

    @inject(PromptService)
    protected readonly promptService: PromptService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(AiSettingsRowService)
    protected readonly settingsRowService: AiSettingsRowService;

    @inject(ToolInvocationRegistry)
    protected readonly toolInvocationRegistry: ToolInvocationRegistry;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(ILogger) @named('ai-ide:AgentsConfigurationCategory')
    protected readonly logger: ILogger;

    @inject(GenericCapabilitiesService)
    protected readonly genericCapabilitiesService: GenericCapabilitiesService;

    @inject(ChatCapabilitiesService)
    protected readonly chatCapabilitiesService: ChatCapabilitiesService;

    @inject(HoverService)
    protected readonly hoverService: HoverService;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;
    protected readonly toDispose = new DisposableCollection(this.onDidChangeEmitter);

    /** Category-wide caches consumed by the item detail; refreshed on the corresponding service events. */
    protected languageModels: LanguageModel[] | undefined;
    protected languageModelAliases: LanguageModelAlias[] = [];
    /** Bumped on every upstream change so the item-detail view re-runs its async load. */
    protected revision = 0;

    get renderer(): this {
        return this;
    }

    protected override get overviewListTitle(): string {
        return nls.localizeByDefault('代理');
    }

    getOwnedPreferenceIds(): string[] {
        return [
            DEFAULT_CHAT_AGENT_PREF,
            PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE,
            PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST,
            // Per-agent settings storage; edited through the agent detail pages, not as a raw row.
            AGENT_SETTINGS_PREF
        ];
    }

    get search(): AiConfigurationSearchProvider {
        return this;
    }

    @postConstruct()
    protected init(): void {
        this.languageModelRegistry.getLanguageModels().then(models => {
            this.languageModels = models ?? [];
            this.fireChange();
        });
        this.languageModelAliasRegistry.ready.then(() => {
            this.languageModelAliases = this.languageModelAliasRegistry.getAliases();
            this.toDispose.push(this.languageModelAliasRegistry.onDidChange(() => {
                this.languageModelAliases = this.languageModelAliasRegistry.getAliases();
                this.fireChange();
            }));
            this.fireChange();
        });
        this.toDispose.pushAll([
            this.languageModelRegistry.onChange(({ models }) => {
                this.languageModels = models;
                this.fireChange();
            }),
            this.agentService.onDidChangeAgents(() => this.fireChange()),
            this.promptService.onPromptsChange(() => this.fireChange()),
            this.promptFragmentCustomizationService.onDidChangePromptFragmentCustomization(() => this.fireChange()),
            this.aiSettingsService.onDidChange(() => this.fireChange()),
            this.genericCapabilitiesService.onDidChangeAvailableCapabilities(() => this.fireChange())
        ]);
    }

    protected fireChange(): void {
        this.revision++;
        this.onDidChangeEmitter.fire();
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected get categoryId(): string {
        return this.id;
    }

    getTreeChildren(): AiConfigurationTreeItem[] {
        return this.agentService.getAllAgents().map(agent => {
            const enabled = this.agentService.isEnabled(agent.id);
            return {
                id: agent.id,
                label: getAgentDisplayName(agent),
                iconClass: getAgentIconClass(agent),
                description: agent.description,
                status: {
                    kind: enabled ? 'on' : 'off',
                    label: enabled ? nls.localizeByDefault('已启用') : nls.localizeByDefault('已禁用')
                }
            } satisfies AiConfigurationTreeItem;
        });
    }

    protected override renderCategorySettings(ctx: AiConfigurationRenderContext): React.ReactNode {
        return <>
            <AiConfigurationSection title={nls.localize('theia/ai/ide/agentConfiguration/behavior', '行为')}>
                <AiSettingsRow
                    service={this.settingsRowService}
                    preferenceId={PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST}
                    label={nls.localize('theia/ai/ide/agentConfiguration/orchestratorExclude', '对编排器隐藏的代理')}
                    scope={ctx.scope}
                    control={{ type: 'array', placeholder: nls.localize('theia/ai/ide/agentConfiguration/orchestratorExcludePlaceholder', '添加代理 ID...') }}
                    onDidChange={ctx.update}
                />
            </AiConfigurationSection>
            <AiConfigurationSection title={nls.localize('theia/ai/ide/agentConfiguration/defaults', '默认值')}>
                <AiSettingsRow
                    service={this.settingsRowService}
                    preferenceId={DEFAULT_CHAT_AGENT_PREF}
                    label={nls.localize('theia/ai/ide/agentConfiguration/defaultChatAgent', '默认聊天代理')}
                    scope={ctx.scope}
                    control={{ type: 'select', options: this.getChatAgentOptions() }}
                    onDidChange={ctx.update}
                />
                <AiSettingsRow
                    service={this.settingsRowService}
                    preferenceId={PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE}
                    scope={ctx.scope}
                    control={{ type: 'select', options: this.getNotificationTypeOptions() }}
                    onDidChange={ctx.update}
                />
            </AiConfigurationSection>
        </>;
    }

    protected getChatAgentOptions(): SelectOption[] {
        // Leading empty entry so the (optional) preference can show and select its unset state, where Theia's
        // built-in defaults apply. Without it the select would fall back to showing the first agent when unset.
        const none: SelectOption = {
            value: '',
            label: nls.localize('theia/ai/ide/agentConfiguration/defaultChatAgentNone', '内置默认'),
            description: nls.localize('theia/ai/ide/agentConfiguration/defaultChatAgentNoneDescription',
                '未显式指定默认值；Theia 将选择默认聊天代理。')
        };
        return [none, ...this.agentService.getAllAgents()
            .filter(agent => isChatAgent(agent))
            .map(agent => ({ value: agent.id, label: getAgentDisplayName(agent) }))];
    }

    protected getNotificationTypeOptions(): SelectOption[] {
        return NOTIFICATION_TYPES.map(type => ({ value: type, label: NOTIFICATION_TYPE_LABELS[type] }));
    }

    override getAddAction(ctx: AiConfigurationRenderContext): AiConfigurationAddDescriptor {
        return {
            label: nls.localize('theia/ai/core/agentConfiguration/addCustomAgent', '添加自定义代理'),
            iconClass: codicon('add'),
            run: () => this.addCustomAgent()
        };
    }

    protected override getEmptyMessage(): string {
        return nls.localize('theia/ai/ide/agentConfiguration/noAgents', '没有可用的代理。');
    }

    protected override renderItemHeader(): React.ReactNode {
        // The detail view renders its own header (with the enable / show-in-chat toggles).
        return undefined;
    }

    protected renderItemSections(item: AiConfigurationTreeItem, ctx: AiConfigurationRenderContext): React.ReactNode {
        const agent = this.agentService.getAllAgents().find(candidate => candidate.id === item.id);
        if (!agent) {
            return undefined;
        }
        return <AgentDetailView
            agent={agent}
            services={this.detailServices}
            languageModels={this.languageModels}
            languageModelAliases={this.languageModelAliases}
            revision={this.revision}
            onOpenPromptSnippet={fragmentId => ctx.navigate(PromptSnippetsConfiguration.selectionFor(fragmentId))}
            onOpenTool={toolName => ctx.navigate(AiConfigurationTools.selectionFor(toolName))}
        />;
    }

    protected get detailServices(): AgentDetailServices {
        return {
            agentService: this.agentService,
            aiSettingsService: this.aiSettingsService,
            variableService: this.variableService,
            promptService: this.promptService,
            languageModelRegistry: this.languageModelRegistry,
            toolInvocationRegistry: this.toolInvocationRegistry,
            commandService: this.commandService,
            settingsRowService: this.settingsRowService,
            logger: this.logger,
            genericCapabilitiesService: this.genericCapabilitiesService,
            chatCapabilitiesService: this.chatCapabilitiesService,
            hoverService: this.hoverService
        };
    }

    getSearchItems(): AiConfigurationSearchItem[] {
        const settingLabel = nls.localizeByDefault('设置');
        const items: AiConfigurationSearchItem[] = [{
            label: nls.localize('theia/ai/ide/agentConfiguration/orchestratorExclude', '对编排器隐藏的代理'),
            typeLabel: settingLabel,
            categoryId: this.id,
            target: { categoryId: this.id, highlight: { rowId: PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST } },
            keywords: PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST
        }, {
            label: nls.localize('theia/ai/ide/agentConfiguration/defaultChatAgent', '默认聊天代理'),
            typeLabel: settingLabel,
            categoryId: this.id,
            target: { categoryId: this.id, highlight: { rowId: DEFAULT_CHAT_AGENT_PREF } },
            keywords: DEFAULT_CHAT_AGENT_PREF
        }, {
            label: nls.localize('theia/ai/core/defaultNotification/title', '默认通知类型'),
            typeLabel: settingLabel,
            categoryId: this.id,
            target: { categoryId: this.id, highlight: { rowId: PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE } },
            keywords: PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE
        }];
        const agentTypeLabel = nls.localizeByDefault('代理');
        for (const agent of this.agentService.getAllAgents()) {
            items.push({
                label: agent.name,
                typeLabel: agentTypeLabel,
                categoryId: this.id,
                target: { categoryId: this.id, itemId: agent.id },
                keywords: `${agent.id} ${agent.description ?? ''}`
            });
        }
        return items;
    }

    /**
     * Selects the candidate creation locations from the reported agent locations. Only `agents/`
     * directories are considered (legacy `customAgents.yml` entries exist for discovery only). A
     * scope is offered when it already contains an `agents/` folder; the preferred scope (the first
     * one, i.e. `.agents`) is always kept so a fresh workspace defaults to `.agents` without
     * surfacing empty fallback folders such as `.prompts`.
     */
    protected selectAgentScopeOptions(locations: CustomAgentsLocation[]): CustomAgentScopeOption[] {
        return locations
            .filter(location => location.kind === 'agents-dir')
            .filter((location, index) => index === 0 || location.exists)
            .map(location => ({ scopeDir: location.uri.parent, agentsDir: location.uri }));
    }

    protected async addCustomAgent(): Promise<void> {
        const allLocations = await this.promptFragmentCustomizationService.getCustomAgentsLocations();
        const scopeOptions = this.selectAgentScopeOptions(allLocations);
        if (scopeOptions.length === 0) {
            this.messageService.warn(nls.localize('theia/ai/ide/agentConfiguration/newAgent/noLocation',
                '无法创建自定义代理：未配置提示词模板位置。请设置全局或工作区提示词模板文件夹后重试。'));
            return;
        }

        let chosen = scopeOptions[0];
        if (scopeOptions.length > 1) {
            chosen = await new Promise<CustomAgentScopeOption>((resolve, reject) => {
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.title = nls.localize('theia/ai/ide/agentConfiguration/customAgentLocationQuickPick/title',
                    '选择新自定义代理的位置');
                quickPick.placeholder = nls.localize('theia/ai/ide/agentConfiguration/customAgentLocationQuickPick/placeholder',
                    '选择创建 agents/<id>/agent.md 文件的位置');
                quickPick.items = scopeOptions.map(opt => ({
                    label: opt.scopeDir.path.toString(),
                    description: opt.agentsDir.path.toString(),
                    option: opt
                }));
                quickPick.onDidAccept(() => {
                    const selected = quickPick.selectedItems[0] as unknown as { option: CustomAgentScopeOption };
                    quickPick.dispose();
                    if (selected?.option) {
                        resolve(selected.option);
                    } else {
                        reject(new Error('No location selected'));
                    }
                });
                quickPick.onDidHide(() => reject(new Error('Selection cancelled')));
                quickPick.show();
            }).catch(() => undefined) ?? scopeOptions[0];
        }

        const id = await this.quickInputService.input({
            title: nls.localize('theia/ai/ide/agentConfiguration/newAgent/idTitle', '新建自定义代理'),
            prompt: nls.localize('theia/ai/ide/agentConfiguration/newAgent/idPrompt', '代理 ID（用作 agents/ 下的文件夹名称）'),
            placeHolder: 'my-agent',
            validateInput: async value => /^[A-Za-z0-9._-]+$/.test(value)
                ? undefined
                : nls.localize('theia/ai/ide/agentConfiguration/newAgent/idInvalid', '只能使用字母、数字、短横线、下划线或点。')
        });
        if (!id) {
            return;
        }

        try {
            await this.promptFragmentCustomizationService.createCustomAgentFile(chosen.scopeDir, {
                id,
                name: id,
                description: nls.localize('theia/ai/ide/agentConfiguration/newAgent/defaultDescription', '自定义代理。请在 agent.md 中编辑此描述。'),
                prompt: nls.localize('theia/ai/ide/agentConfiguration/newAgent/defaultPrompt', '你是一个乐于助人的代理。请根据你的需求调整此提示词。'),
                defaultLLM: 'default/universal',
                showInChat: true
            });
        } catch (error) {
            this.messageService.error(nls.localize('theia/ai/ide/agentConfiguration/newAgent/createFailed',
                '无法创建自定义代理“{0}”：{1}', id, error instanceof Error ? error.message : String(error)));
        }
    }
}
