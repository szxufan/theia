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

import { FrontendLanguageModelRegistry } from '@theia/ai-core/lib/common/language-model';
import {
    BYPASS_MODEL_REQUIREMENT_PREF,
    PERSISTED_SESSION_LIMIT_PREF,
    PIN_CHAT_AGENT_PREF,
    SESSION_STORAGE_PREF,
    WELCOME_SCREEN_SESSIONS_PREF
} from '@theia/ai-chat/lib/common/ai-chat-preferences';
import { Emitter, Event, ILogger, nls } from '@theia/core';
import { codicon } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { DisposableCollection } from '@theia/core/lib/common';
import { inject, injectable, named, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import {
    AiConfigurationCategory,
    AiConfigurationCategoryId,
    AiConfigurationCategoryOrder,
    AiConfigurationRenderContext,
    AiConfigurationSearchItem,
    AiConfigurationSearchProvider
} from '@theia/ai-core-ui/lib/browser/ai-configuration/ai-configuration-category';
import { AiSettingsRowService } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row-service';
import {
    AiEnumSelect,
    AiSessionLimitControl,
    AiToggleSwitch
} from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-controls';
import { AiConfigurationSection, AiMarkdownDescription } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-primitives';
import { AiConfigurationSettingRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-setting-row';
import { AiSettingsRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row';
import { AiConfigurationCategoryRegistry } from '@theia/ai-core-ui/lib/browser/ai-configuration/ai-configuration-category-registry';
import { PREFERENCE_NAME_ENABLE_AI } from '../../../common/ai-ide-preferences';

/** Documentation on Theia's AI capabilities, linked from the hero's cost/data disclosure. */
const AI_DOCUMENTATION_URL = 'https://theia-ide.org/docs/user_ai/';

/** A single setting on the page, paired with its section for the deep-search index. */
interface GeneralSettingRef {
    readonly section: string;
    readonly preferenceId: string;
}

/**
 * The General category: a `single-page` category that presents the top-level `ai-features.*`
 * preferences as a curated "AI Features" page. A hero card hosts the master enablement toggle
 * and LLM-provider status; the dependent settings are grouped into a Chat section and are
 * visually gated while the master toggle is off.
 *
 * All values are read and written through {@link AiSettingsRowService} (backed by the
 * {@link PreferenceService}), so the page stays live-synced with `settings.json` and the
 * classic preferences editor. Gating is purely visual/interactive; preference values are
 * never rewritten when the master toggle changes.
 */
@injectable()
export class GeneralConfigurationCategory implements AiConfigurationCategory, AiConfigurationSearchProvider {

    readonly id = AiConfigurationCategoryId.GENERAL;
    readonly label = nls.localize('theia/ai/ide/generalConfiguration/label', '常规');
    readonly description = nls.localize('theia/ai/ide/generalConfiguration/description',
        '开启或关闭 AI 功能，并配置助手在整个 IDE 中的行为方式。');
    readonly iconClass = codicon('settings-gear');
    readonly order = AiConfigurationCategoryOrder.GENERAL;
    readonly kind = 'single-page' as const;

    @inject(ILogger) @named('ai-ide:GeneralConfigurationCategory')
    protected readonly logger: ILogger;

    @inject(AiSettingsRowService)
    protected readonly settingsRowService: AiSettingsRowService;

    @inject(AiConfigurationCategoryRegistry)
    protected readonly categoryRegistry: AiConfigurationCategoryRegistry;

    @inject(FrontendLanguageModelRegistry)
    protected readonly languageModelRegistry: FrontendLanguageModelRegistry;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;
    protected readonly toDispose = new DisposableCollection(this.onDidChangeEmitter);

    /** Whether at least one language-model provider is ready; drives the hero status line. */
    protected hasReadyProvider = false;

    /** Bound markdown renderer passed to description components (stable identity for `useEffect`). */
    protected readonly renderMarkdown = (markdown: string): HTMLElement => this.settingsRowService.renderMarkdown(markdown);

    get renderer(): this {
        return this;
    }

    getOwnedPreferenceIds(): string[] {
        return [
            PREFERENCE_NAME_ENABLE_AI,
            PIN_CHAT_AGENT_PREF,
            BYPASS_MODEL_REQUIREMENT_PREF,
            PERSISTED_SESSION_LIMIT_PREF,
            WELCOME_SCREEN_SESSIONS_PREF,
            SESSION_STORAGE_PREF
        ];
    }

    get search(): AiConfigurationSearchProvider {
        return this;
    }

    @postConstruct()
    protected init(): void {
        // Refresh the page (values, modified indicators, gating) whenever any preference changes.
        this.toDispose.push(this.settingsRowService.onPreferenceChanged(() => this.onDidChangeEmitter.fire()));
        // Re-evaluate the provider status line when the set of language models changes.
        this.toDispose.push(this.languageModelRegistry.onChange(() => this.refreshProviderStatus()));
        this.refreshProviderStatus();
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected async refreshProviderStatus(): Promise<void> {
        const models = await this.languageModelRegistry.getLanguageModels();
        const hasReady = models.some(model => model.status.status === 'ready');
        if (hasReady !== this.hasReadyProvider) {
            this.hasReadyProvider = hasReady;
            this.onDidChangeEmitter.fire();
        }
    }

    /** The page's sections and their settings, shared by rendering and the search index. */
    protected getSectionRefs(): GeneralSettingRef[] {
        return [
            { section: this.sectionChat, preferenceId: PIN_CHAT_AGENT_PREF },
            { section: this.sectionChat, preferenceId: BYPASS_MODEL_REQUIREMENT_PREF },
            { section: this.sectionChat, preferenceId: PERSISTED_SESSION_LIMIT_PREF },
            { section: this.sectionChat, preferenceId: WELCOME_SCREEN_SESSIONS_PREF },
            { section: this.sectionChat, preferenceId: SESSION_STORAGE_PREF }
        ];
    }

    protected get sectionChat(): string {
        return nls.localizeByDefault('聊天');
    }

    /** Per-setting, human-readable titles. The preferences share a schema `title`, so titles are authored here. */
    protected titleFor(preferenceId: string): string {
        switch (preferenceId) {
            case PREFERENCE_NAME_ENABLE_AI:
                return nls.localizeByDefault('启用 AI 功能');
            case PIN_CHAT_AGENT_PREF:
                return nls.localize('theia/ai/ide/generalConfiguration/pinAgentTitle', '固定被提及的代理');
            case BYPASS_MODEL_REQUIREMENT_PREF:
                return nls.localize('theia/ai/ide/generalConfiguration/bypassModelTitle', '跳过语言模型检查');
            case PERSISTED_SESSION_LIMIT_PREF:
                return nls.localize('theia/ai/ide/generalConfiguration/persistedSessionsTitle', '持久化的聊天会话');
            case WELCOME_SCREEN_SESSIONS_PREF:
                return nls.localize('theia/ai/ide/generalConfiguration/homeSessionsTitle', '主页视图上的会话');
            case SESSION_STORAGE_PREF:
                return nls.localize('theia/ai/ide/generalConfiguration/sessionStorageTitle', '会话存储位置');
            default:
                return this.settingsRowService.describe(preferenceId).label ?? preferenceId;
        }
    }

    renderPage(ctx: AiConfigurationRenderContext): React.ReactNode {
        const enabled = this.isEnabled(ctx);
        return <div className='ai-configuration-page'>
            {this.renderHero(ctx, enabled)}
            {!enabled && this.renderGateNote()}
            <div className={`ai-configuration-sections${enabled ? '' : ' ai-configuration-sections-off'}`}>
                {this.renderChatSection(ctx, !enabled)}
                {this.renderCatchAllSections(ctx, !enabled)}
            </div>
        </div>;
    }

    /**
     * AI preferences that no dedicated category claims — the "in doubt, put it in General" home. Chat
     * preferences fold into the Chat section (see {@link renderChatSection}); everything else is grouped
     * into a section per `ai-features.<segment>`. This keeps every AI preference reachable, since they are
     * hidden from the Settings UI, without a separate catch-all page.
     */
    protected unclaimedPreferenceIds(): string[] {
        const claimed = new Set<string>();
        for (const category of this.categoryRegistry.getCategories()) {
            for (const owned of category.renderer.getOwnedPreferenceIds?.() ?? []) {
                claimed.add(owned);
            }
        }
        return this.settingsRowService.aiFeaturePreferenceIds().filter(id => !claimed.has(id));
    }

    protected renderCatchAllSections(ctx: AiConfigurationRenderContext, disabled: boolean): React.ReactNode {
        const bySegment = new Map<string, string[]>();
        for (const id of this.unclaimedPreferenceIds()) {
            const segment = id.substring('ai-features.'.length).split('.')[0];
            if (segment === 'chat') {
                continue; // folded into the Chat section
            }
            const block = bySegment.get(segment) ?? [];
            block.push(id);
            bySegment.set(segment, block);
        }
        return Array.from(bySegment.entries())
            .sort((left, right) => this.segmentLabel(left[0]).localeCompare(this.segmentLabel(right[0])))
            .map(([segment, ids]) => (
                <AiConfigurationSection title={this.segmentLabel(segment)} key={segment}>
                    {ids.map(id => this.renderGenericRow(ctx, id, disabled))}
                </AiConfigurationSection>
            ));
    }

    protected renderGenericRow(ctx: AiConfigurationRenderContext, preferenceId: string, disabled: boolean): React.ReactNode {
        return <AiSettingsRow
            key={preferenceId}
            service={this.settingsRowService}
            preferenceId={preferenceId}
            scope={ctx.scope}
            control={this.settingsRowService.controlFor(preferenceId)}
            disabled={disabled}
            onDidChange={ctx.update}
        />;
    }

    /** `ai-features.<segment>` → Title Case words (e.g. `codeCompletion` → "Code Completion"). */
    protected segmentLabel(segment: string): string {
        const spaced = segment.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        return spaced.charAt(0).toLocaleUpperCase() + spaced.slice(1);
    }

    protected isEnabled(ctx: AiConfigurationRenderContext): boolean {
        return this.settingsRowService.inspect(PREFERENCE_NAME_ENABLE_AI, ctx.scope).value === true;
    }

    protected renderHero(ctx: AiConfigurationRenderContext, enabled: boolean): React.ReactNode {
        // Carries the same deep-link anchor as a normal setting row, so this category's search item for
        // `PREFERENCE_NAME_ENABLE_AI` can scroll to and flash the toggle even though it is not rendered
        // through `AiConfigurationSettingRow`.
        return <div className='ai-configuration-hero' data-ai-config-row-id={PREFERENCE_NAME_ENABLE_AI}>
            <div className='ai-settings-row-top'>
                <div className='ai-settings-row-main'>
                    <div className='ai-settings-row-title'>
                        {this.titleFor(PREFERENCE_NAME_ENABLE_AI)}
                    </div>
                    <div className='ai-settings-row-description'>
                        {nls.localize('theia/ai/ide/generalConfiguration/enableAiDescription',
                            '开启 {0} 的所有 AI 能力。需要至少配置一个语言模型提供程序。',
                            FrontendApplicationConfigProvider.get().applicationName)}
                    </div>
                </div>
                <div className='ai-settings-row-control'>
                    <AiToggleSwitch
                        large
                        checked={enabled}
                        ariaLabel={this.titleFor(PREFERENCE_NAME_ENABLE_AI)}
                        onChange={value => this.commit(PREFERENCE_NAME_ENABLE_AI, value, ctx)}
                    />
                </div>
            </div>
            {enabled && this.renderProviderStatus(ctx)}
            {enabled && <details className='ai-configuration-risks'>
                <summary>{nls.localize('theia/ai/ide/generalConfiguration/aboutCosts', '关于费用与数据使用')}</summary>
                <div className='ai-configuration-risk-body'>
                    <AiMarkdownDescription
                        renderMarkdown={this.renderMarkdown}
                        markdown={nls.localize('theia/ai/ide/generalConfiguration/costsBody',
                            'AI 功能会向您配置的语言模型提供程序发送请求。根据您的提供程序和使用情况，这可能产生费用 — 请密切监控。当代理处于活动状态时，请求可能会持续运行。详情请参阅[文档]({0})。',
                            AI_DOCUMENTATION_URL)}
                    />
                </div>
            </details>}
        </div>;
    }

    protected renderProviderStatus(ctx: AiConfigurationRenderContext): React.ReactNode {
        if (this.hasReadyProvider) {
            return <div className='ai-configuration-status-line'>
                <span className='ai-configuration-status ai-configuration-status-on'></span>
                <span>{nls.localize('theia/ai/ide/generalConfiguration/providerReady', '语言模型提供程序已配置并就绪。')}</span>
            </div>;
        }
        return <div className='ai-configuration-status-line'>
            <span className='ai-configuration-status ai-configuration-status-warn'></span>
            <span>
                {nls.localize('theia/ai/ide/generalConfiguration/noProvider', '尚未配置语言模型提供程序。')}{' '}
                <a
                    href='#'
                    onClick={e => { e.preventDefault(); ctx.navigate({ categoryId: AiConfigurationCategoryId.MODELS }); }}
                >{nls.localize('theia/ai/ide/generalConfiguration/configureProvider', '配置提供程序')}</a>
            </span>
        </div>;
    }

    protected renderGateNote(): React.ReactNode {
        return <div className='ai-configuration-gate-note'>
            <span className={codicon('info')}></span>
            <span>{nls.localize('theia/ai/ide/generalConfiguration/gateNote', '以下设置将在启用 AI 功能后生效。')}</span>
        </div>;
    }

    protected renderChatSection(ctx: AiConfigurationRenderContext, disabled: boolean): React.ReactNode {
        return this.renderSection(this.sectionChat, [
            this.renderSettingRow(ctx, PIN_CHAT_AGENT_PREF, {
                control: <AiToggleSwitch
                    checked={this.booleanValue(PIN_CHAT_AGENT_PREF, ctx)}
                    ariaLabel={this.titleFor(PIN_CHAT_AGENT_PREF)}
                    disabled={disabled}
                    onChange={value => this.commit(PIN_CHAT_AGENT_PREF, value, ctx)}
                />
            }),
            this.renderSettingRow(ctx, BYPASS_MODEL_REQUIREMENT_PREF, {
                control: <AiToggleSwitch
                    checked={this.booleanValue(BYPASS_MODEL_REQUIREMENT_PREF, ctx)}
                    ariaLabel={this.titleFor(BYPASS_MODEL_REQUIREMENT_PREF)}
                    disabled={disabled}
                    onChange={value => this.commit(BYPASS_MODEL_REQUIREMENT_PREF, value, ctx)}
                />
            }),
            this.renderSettingRow(ctx, PERSISTED_SESSION_LIMIT_PREF, {
                below: <AiSessionLimitControl
                    value={this.numberValue(PERSISTED_SESSION_LIMIT_PREF, ctx, 25)}
                    limitedMin={1}
                    limitedMax={999}
                    specials={[
                        { value: -1, label: nls.localize('theia/ai/ide/generalConfiguration/unlimited', '无限制') },
                        { value: 0, label: nls.localize('theia/ai/ide/generalConfiguration/dontPersist', '不持久化') }
                    ]}
                    ariaLabel={this.titleFor(PERSISTED_SESSION_LIMIT_PREF)}
                    disabled={disabled}
                    onCommit={value => this.commit(PERSISTED_SESSION_LIMIT_PREF, value, ctx)}
                />
            }),
            this.renderSettingRow(ctx, WELCOME_SCREEN_SESSIONS_PREF, {
                below: <AiSessionLimitControl
                    value={this.numberValue(WELCOME_SCREEN_SESSIONS_PREF, ctx, 20)}
                    limitedMin={1}
                    limitedMax={99}
                    specials={[
                        { value: 0, label: nls.localize('theia/ai/ide/generalConfiguration/hideList', '隐藏列表') }
                    ]}
                    ariaLabel={this.titleFor(WELCOME_SCREEN_SESSIONS_PREF)}
                    disabled={disabled}
                    onCommit={value => this.commit(WELCOME_SCREEN_SESSIONS_PREF, value, ctx)}
                />
            }),
            this.renderSettingRow(ctx, SESSION_STORAGE_PREF, {
                below: <AiEnumSelect
                    value={this.selectValue(SESSION_STORAGE_PREF, ctx)}
                    options={this.enumOptions(SESSION_STORAGE_PREF)}
                    ariaLabel={this.titleFor(SESSION_STORAGE_PREF)}
                    disabled={disabled}
                    onCommit={value => this.commit(SESSION_STORAGE_PREF, value, ctx)}
                />
            }),
            // Any other chat.* preference no category claims (e.g. token-usage, server-side compaction).
            ...this.unclaimedPreferenceIds()
                .filter(id => id.startsWith('ai-features.chat.'))
                .map(id => this.renderGenericRow(ctx, id, disabled))
        ]);
    }

    protected renderSection(title: string, rows: React.ReactNode[]): React.ReactNode {
        return <AiConfigurationSection title={title} key={title}>{rows}</AiConfigurationSection>;
    }

    /**
     * Renders one setting row via the shared {@link AiConfigurationSettingRow}: title, the schema
     * description, a control (inline via {@link options.control} or full-width via {@link options.below}),
     * a modified edge when overridden in the current scope, and the Settings-UI gear menu (Reset / Copy
     * Setting ID / Copy as JSON) wired to the shared {@link AiSettingsRowService.openSettingContextMenu}.
     */
    protected renderSettingRow(
        ctx: AiConfigurationRenderContext,
        preferenceId: string,
        options: { control?: React.ReactNode; below?: React.ReactNode }
    ): React.ReactNode {
        const inspection = this.settingsRowService.inspect(preferenceId, ctx.scope);
        return <AiConfigurationSettingRow
            key={preferenceId}
            preferenceId={preferenceId}
            title={this.titleFor(preferenceId)}
            description={this.settingsRowService.describe(preferenceId).description}
            renderMarkdown={this.renderMarkdown}
            modified={inspection.modified}
            tags={this.settingsRowService.tags(preferenceId)}
            onOpenMenu={gear => this.settingsRowService.openSettingContextMenu(gear, preferenceId, inspection.value, ctx.scope)}
            control={options.control}
            below={options.below}
        />;
    }

    protected commit(preferenceId: string, value: unknown, ctx: AiConfigurationRenderContext): void {
        this.settingsRowService.set(preferenceId, value, ctx.scope)
            .then(() => ctx.update())
            .catch(error => this.logger.error(`Failed to set preference '${preferenceId}'`, error));
    }

    protected booleanValue(preferenceId: string, ctx: AiConfigurationRenderContext): boolean {
        return this.settingsRowService.inspect(preferenceId, ctx.scope).value === true;
    }

    protected numberValue(preferenceId: string, ctx: AiConfigurationRenderContext, fallback: number): number {
        const value = this.settingsRowService.inspect(preferenceId, ctx.scope).value;
        return typeof value === 'number' ? value : fallback;
    }

    protected selectValue(preferenceId: string, ctx: AiConfigurationRenderContext): string | undefined {
        const value = this.settingsRowService.inspect(preferenceId, ctx.scope).value;
        return value === undefined ? undefined : String(value);
    }

    protected enumOptions(preferenceId: string): { value: string; label: string; title?: string }[] {
        return this.settingsRowService.enumOptions(preferenceId).map(option => {
            const value = option.value ?? '';
            // Keep the option's explanatory text as the select's per-option `title`, never as its label.
            return { value, label: option.label ?? value, title: option.description };
        });
    }

    getSearchItems(): AiConfigurationSearchItem[] {
        const settingLabel = nls.localizeByDefault('设置');
        const items = this.getSectionRefs().map(ref => ({
            label: this.titleFor(ref.preferenceId),
            typeLabel: settingLabel,
            categoryId: this.id,
            target: { categoryId: this.id, highlight: { rowId: ref.preferenceId } },
            keywords: `${ref.preferenceId} ${ref.section}`
        } satisfies AiConfigurationSearchItem));
        // Include the master enablement toggle (rendered in the hero rather than a section).
        items.unshift({
            label: this.titleFor(PREFERENCE_NAME_ENABLE_AI),
            typeLabel: settingLabel,
            categoryId: this.id,
            target: { categoryId: this.id, highlight: { rowId: PREFERENCE_NAME_ENABLE_AI } },
            keywords: PREFERENCE_NAME_ENABLE_AI
        });
        // Catch-all preferences rendered on this page (see renderCatchAllSections / the Chat section).
        for (const id of this.unclaimedPreferenceIds()) {
            items.push({
                label: this.settingsRowService.describe(id).label ?? id,
                typeLabel: settingLabel,
                categoryId: this.id,
                target: { categoryId: this.id, highlight: { rowId: id } },
                keywords: id
            });
        }
        return items;
    }
}
