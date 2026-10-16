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

import { AiConfigurationService, ToolInvocationRegistry, ToolRequest } from '@theia/ai-core';
import { ToolConfirmationManager } from '@theia/ai-chat/lib/browser/chat-tool-preference-bindings';
import {
    DEFAULT_TOOL_CONFIRMATION_PREFERENCE,
    TOOL_CONFIRMATION_MODE_DESCRIPTIONS,
    TOOL_CONFIRMATION_MODE_VALUES,
    TOOL_CONFIRMATION_PREFERENCE,
    ToolConfirmationMode
} from '@theia/ai-chat/lib/common/chat-tool-preferences';
import { SHELL_COMMAND_ALLOWLIST_PREFERENCE, SHELL_COMMAND_DENYLIST_PREFERENCE } from '@theia/ai-terminal/lib/common/shell-command-preferences';
import { ShellCommandPermissionService } from '@theia/ai-terminal/lib/browser/shell-command-permission-service';
import { Emitter, Event, nls } from '@theia/core';
import { codicon, ConfirmDialog } from '@theia/core/lib/browser';
import { DisposableCollection } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import {
    AiConfigurationCategory,
    AiConfigurationCategoryId,
    AiConfigurationCategoryOrder,
    AiConfigurationRenderContext,
    AiConfigurationSearchItem,
    AiConfigurationSearchProvider,
    AiConfigurationTools
} from '@theia/ai-core-ui/lib/browser/ai-configuration/ai-configuration-category';
import { SinglePageCategoryRenderer } from '@theia/ai-core-ui/lib/browser/ai-configuration/renderers/single-page-category-renderer';
import {
    AiConfigurationCallout,
    AiConfigurationFilterInput,
    AiConfigurationSection
} from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-primitives';
import { AiEnumSelect } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-controls';
import { AiConfigurationItemRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-item-row';
import { AiConfigurationSettingRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-setting-row';
import { AiSettingsRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row';
import { AiSettingsControl, AiSettingsRowService } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row-service';

// UI labels for the modes (the schema has no `enumItemLabels`); the values and per-option descriptions
// come straight from the preference definition so the descriptions are not duplicated here.
const TOOL_OPTION_LABELS: Record<ToolConfirmationMode, string> = {
    [ToolConfirmationMode.DISABLED]: nls.localizeByDefault('禁用'),
    [ToolConfirmationMode.CONFIRM]: nls.localize('theia/ai/ide/toolsConfiguration/toolOptions/confirm/label', '确认'),
    [ToolConfirmationMode.ALWAYS_ALLOW]: nls.localizeByDefault('始终允许')
};

const TOOL_OPTIONS: { value: ToolConfirmationMode; label: string; title: string }[] = TOOL_CONFIRMATION_MODE_VALUES.map((value, index) => ({
    value,
    label: TOOL_OPTION_LABELS[value],
    title: TOOL_CONFIRMATION_MODE_DESCRIPTIONS[index]
}));

/**
 * The Tools category: a `single-page` category with the default confirmation mode, a per-tool
 * confirmation table, the recommended-defaults banner, and the shell allow/deny-list editors.
 */
@injectable()
export class ToolsConfigurationCategory extends SinglePageCategoryRenderer implements AiConfigurationCategory, AiConfigurationSearchProvider {

    readonly id = AiConfigurationCategoryId.TOOLS;
    readonly label = nls.localizeByDefault('工具');
    readonly description = nls.localize('theia/ai/ide/toolsConfiguration/description',
        '选择代理可以调用哪些工具，以及每个工具在运行前是否需要确认。');
    readonly iconClass = codicon('tools');
    readonly order = AiConfigurationCategoryOrder.TOOLS;
    readonly kind = 'single-page' as const;

    @inject(ToolConfirmationManager)
    protected readonly confirmationManager: ToolConfirmationManager;

    @inject(ToolInvocationRegistry)
    protected readonly toolInvocationRegistry: ToolInvocationRegistry;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;
    protected readonly toDispose = new DisposableCollection(this.onDidChangeEmitter);

    protected toolNames: string[] = [];
    protected toolConfirmationModes: Record<string, ToolConfirmationMode> = {};
    protected defaultState: ToolConfirmationMode = ToolConfirmationMode.CONFIRM;

    get renderer(): this {
        return this;
    }

    getOwnedPreferenceIds(): string[] {
        // Managed via the confirmation-mode selector/table and the shell allow/deny editors on this page.
        return [
            DEFAULT_TOOL_CONFIRMATION_PREFERENCE,
            TOOL_CONFIRMATION_PREFERENCE,
            SHELL_COMMAND_ALLOWLIST_PREFERENCE,
            SHELL_COMMAND_DENYLIST_PREFERENCE
        ];
    }

    get search(): AiConfigurationSearchProvider {
        return this;
    }

    @inject(AiConfigurationService)
    protected readonly aiConfigurationService: AiConfigurationService;

    @inject(AiSettingsRowService)
    protected readonly settingsRowService: AiSettingsRowService;

    @inject(ShellCommandPermissionService)
    protected readonly shellCommandPermissionService: ShellCommandPermissionService;

    protected readonly renderMarkdown = (markdown: string): HTMLElement => this.settingsRowService.renderMarkdown(markdown);

    @postConstruct()
    protected init(): void {
        this.load();
        this.toDispose.pushAll([
            this.toolInvocationRegistry.onDidChange(() => {
                this.loadTools();
                this.onDidChangeEmitter.fire();
            }),
            this.aiConfigurationService.onDidChange(async event => {
                if (event.affectsPreference(TOOL_CONFIRMATION_PREFERENCE) || event.affectsPreference(DEFAULT_TOOL_CONFIRMATION_PREFERENCE)) {
                    await this.loadConfirmation();
                    this.onDidChangeEmitter.fire();
                }
                if (event.affectsPreference(SHELL_COMMAND_ALLOWLIST_PREFERENCE) || event.affectsPreference(SHELL_COMMAND_DENYLIST_PREFERENCE)) {
                    this.onDidChangeEmitter.fire();
                }
            })
        ]);
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected async load(): Promise<void> {
        this.loadTools();
        await this.loadConfirmation();
        this.onDidChangeEmitter.fire();
    }

    protected loadTools(): void {
        this.toolNames = this.toolInvocationRegistry.getAllFunctions()
            .map(func => func.name)
            .sort((a, b) => {
                const aIsMcp = a.startsWith('mcp_');
                const bIsMcp = b.startsWith('mcp_');
                if (aIsMcp !== bIsMcp) {
                    return aIsMcp ? 1 : -1;
                }
                return a.localeCompare(b);
            });
    }

    protected async loadConfirmation(): Promise<void> {
        this.defaultState = this.confirmationManager.getDefaultConfirmationMode();
        this.toolConfirmationModes = this.confirmationManager.getAllConfirmationSettings();
    }

    protected getEffectiveState(toolName: string): ToolConfirmationMode {
        const explicit = this.toolConfirmationModes[toolName];
        if (explicit !== undefined) {
            return explicit;
        }
        const toolRequest = this.toolInvocationRegistry.getFunction(toolName);
        if (toolRequest?.confirmAlwaysAllow && this.defaultState === ToolConfirmationMode.ALWAYS_ALLOW) {
            return ToolConfirmationMode.CONFIRM;
        }
        return this.defaultState;
    }

    /** Title of the default-confirmation-mode row, shared by the header and the search index. */
    protected defaultModeLabel(): string {
        return this.settingsRowService.describe(DEFAULT_TOOL_CONFIRMATION_PREFERENCE).label
            ?? nls.localize('theia/ai/ide/toolsConfiguration/default/rowLabel', '默认工具确认模式');
    }

    protected override renderHeader(ctx: AiConfigurationRenderContext): React.ReactNode {
        const described = this.settingsRowService.describe(DEFAULT_TOOL_CONFIRMATION_PREFERENCE);
        const inspection = this.settingsRowService.inspect(DEFAULT_TOOL_CONFIRMATION_PREFERENCE, ctx.scope);
        const modeLabel = this.defaultModeLabel();
        return <div className='ai-configuration-page'>
            {/* Rendered as a normal setting row (id/title/description + control below), plus a page-level
                "Reset All" action in the row's action slot. */}
            <AiConfigurationSettingRow
                preferenceId={DEFAULT_TOOL_CONFIRMATION_PREFERENCE}
                title={modeLabel}
                description={described.description}
                renderMarkdown={this.renderMarkdown}
                modified={inspection.modified}
                tags={this.settingsRowService.tags(DEFAULT_TOOL_CONFIRMATION_PREFERENCE)}
                onOpenMenu={gear => this.settingsRowService.openSettingContextMenu(gear, DEFAULT_TOOL_CONFIRMATION_PREFERENCE, inspection.value, ctx.scope)}
                below={<AiEnumSelect
                    ariaLabel={modeLabel}
                    value={this.defaultState}
                    options={TOOL_OPTIONS}
                    onCommit={value => this.confirmationManager.setDefaultConfirmationMode(value as ToolConfirmationMode)}
                />}
                actions={<button
                    className='theia-button secondary'
                    title={nls.localize('theia/ai/ide/toolsConfiguration/resetAllTooltip', '将所有工具重置为默认值')}
                    onClick={() => this.resetAllToolsToDefault()}
                >
                    {nls.localize('theia/ai/ide/toolsConfiguration/resetAll', '全部重置')}
                </button>}
            />
            {this.renderRecommendedDefaultsBanner()}
        </div>;
    }

    protected renderRecommendedDefaultsBanner(): React.ReactNode {
        if (this.defaultState !== ToolConfirmationMode.CONFIRM) {
            return undefined;
        }
        return <AiConfigurationCallout
            message={nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/message',
                '当前工具调用需要批准。一次性自动允许所有内置工具。'
                + '需要额外确认的工具（例如 Shell 执行）、MCP 工具'
                + '以及之后添加的任何工具在运行前仍会询问。')}
            action={<button className='theia-button main' onClick={() => this.allowCurrentTools()}>
                {nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/apply', '允许默认工具')}
            </button>}
        />;
    }

    protected renderSections(ctx: AiConfigurationRenderContext): React.ReactNode {
        return <div className='ai-configuration-page'>
            <ToolConfirmationTable
                toolNames={this.toolNames}
                getDescription={name => this.toolInvocationRegistry.getFunction(name)?.description}
                getEffectiveState={name => this.getEffectiveState(name)}
                isModified={name => this.toolConfirmationModes[name] !== undefined}
                onChangeMode={(name, value) => this.handleToolConfirmationModeChange(name, value)}
            />
            {/* The allow/deny lists are plain `string[]` preferences, rendered as normal setting rows with the
                shared list editor rather than a bespoke add/remove control. Entries are checked by
                `ShellCommandPermissionService` first: this is the only GUI for these patterns, and an
                unchecked one silently misbehaves ("*" would auto-approve everything, "git log*" would also
                match "git logfoo"). The row still writes the preference itself, so it keeps honouring the
                page's scope; only the rules come from the service. */}
            <AiConfigurationSection title={nls.localize('theia/ai/ide/toolsConfiguration/shellExecution', 'Shell 命令执行')}>
                <AiSettingsRow
                    service={this.settingsRowService}
                    preferenceId={SHELL_COMMAND_ALLOWLIST_PREFERENCE}
                    scope={ctx.scope}
                    control={this.shellPatternControl(SHELL_COMMAND_ALLOWLIST_PREFERENCE)}
                    onDidChange={ctx.update}
                />
                <AiSettingsRow
                    service={this.settingsRowService}
                    preferenceId={SHELL_COMMAND_DENYLIST_PREFERENCE}
                    scope={ctx.scope}
                    control={this.shellPatternControl(SHELL_COMMAND_DENYLIST_PREFERENCE)}
                    onDidChange={ctx.update}
                />
            </AiConfigurationSection>
        </div>;
    }

    protected async handleToolConfirmationModeChange(toolName: string, mode: ToolConfirmationMode): Promise<void> {
        const toolRequest = this.toolInvocationRegistry.getFunction(toolName);
        if (mode === ToolConfirmationMode.ALWAYS_ALLOW && toolRequest?.confirmAlwaysAllow) {
            const confirmed = await this.showConfirmAlwaysAllowDialog(toolName, toolRequest);
            if (!confirmed) {
                this.onDidChangeEmitter.fire();
                return;
            }
        }
        await this.confirmationManager.setConfirmationMode(toolName, mode, toolRequest);
    }

    protected async showConfirmAlwaysAllowDialog(toolName: string, toolRequest: ToolRequest): Promise<boolean> {
        const warningMessage = typeof toolRequest.confirmAlwaysAllow === 'string'
            ? toolRequest.confirmAlwaysAllow
            : nls.localize('theia/ai/ide/toolsConfiguration/confirmAlwaysAllow/genericWarning',
                '此工具需要确认后才能启用自动批准。'
                + '启用后，所有后续调用都将无需确认直接执行。'
                + '仅当您信任此工具并了解潜在风险时才启用此功能。');
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/ide/toolsConfiguration/confirmAlwaysAllow/title', '启用“{0}”的自动批准？', toolName),
            msg: warningMessage,
            ok: nls.localize('theia/ai/ide/toolsConfiguration/confirmAlwaysAllow/confirm', '我已了解，启用自动批准'),
            cancel: nls.localizeByDefault('取消')
        });
        return !!await dialog.open();
    }

    protected async resetAllToolsToDefault(): Promise<void> {
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/ide/toolsConfiguration/resetAllConfirmDialog/title', '重置所有工具确认模式'),
            msg: nls.localize('theia/ai/ide/toolsConfiguration/resetAllConfirmDialog/msg',
                '确定要将所有工具确认模式重置为默认值吗？这将移除所有自定义设置。'),
            ok: nls.localize('theia/ai/ide/toolsConfiguration/resetAll', '全部重置'),
            cancel: nls.localizeByDefault('取消')
        });
        if (await dialog.open()) {
            await this.confirmationManager.resetAllConfirmationModeSettings();
        }
    }

    protected async allowCurrentTools(): Promise<void> {
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/dialogTitle', '允许默认工具？'),
            msg: this.buildAllowCurrentToolsMessage(),
            ok: nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/dialogConfirm', '我已了解，允许'),
            cancel: nls.localizeByDefault('取消')
        });
        if (!await dialog.open()) {
            return;
        }
        const updates: Array<{ toolId: string; mode: ToolConfirmationMode; toolRequest: ToolRequest }> = [];
        for (const tool of this.toolInvocationRegistry.getAllFunctions()) {
            if (tool.confirmAlwaysAllow || tool.name.startsWith('mcp_') || this.toolConfirmationModes[tool.name] === ToolConfirmationMode.DISABLED) {
                continue;
            }
            updates.push({ toolId: tool.name, mode: ToolConfirmationMode.ALWAYS_ALLOW, toolRequest: tool });
        }
        await this.confirmationManager.setConfirmationModes(updates);
    }

    protected buildAllowCurrentToolsMessage(): HTMLElement {
        const container = document.createElement('div');
        const lines = [
            nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/msg/line1', '这会将所有当前注册的内置工具设为“始终允许”。'),
            nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/msg/line2',
                '需要额外确认的工具（例如 Shell 执行）在运行前仍会询问。'),
            nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/msg/line3',
                'MCP 工具属于第三方工具，不包含在内。您可以在此视图中单独允许它们。'),
            nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/msg/line4', '之后添加的工具仍默认为“确认”，以便您进行审查。'),
            nls.localize('theia/ai/ide/toolsConfiguration/recommendedDefaults/msg/line5', '您可以稍后在此视图中更改此设置。')
        ];
        for (const line of lines) {
            const paragraph = document.createElement('p');
            paragraph.textContent = line;
            container.appendChild(paragraph);
        }
        return container;
    }

    /**
     * The list control for a shell command pattern list, with the service's own rules attached so an invalid
     * pattern is refused with its message instead of being written.
     */
    protected shellPatternControl(preferenceId: string): AiSettingsControl {
        const control = this.settingsRowService.controlFor(preferenceId);
        if (control.type !== 'array') {
            return control;
        }
        return { ...control, validate: pattern => this.shellCommandPermissionService.checkPattern(pattern) };
    }

    getSearchItems(): AiConfigurationSearchItem[] {
        const toolTypeLabel = nls.localizeByDefault('工具');
        const items: AiConfigurationSearchItem[] = [{
            label: this.defaultModeLabel(),
            typeLabel: nls.localizeByDefault('设置'),
            categoryId: this.id,
            target: { categoryId: this.id },
            keywords: `${DEFAULT_TOOL_CONFIRMATION_PREFERENCE} ${TOOL_CONFIRMATION_PREFERENCE} ${SHELL_COMMAND_ALLOWLIST_PREFERENCE} ${SHELL_COMMAND_DENYLIST_PREFERENCE}`
        }];
        for (const name of this.toolNames) {
            items.push({ label: name, typeLabel: toolTypeLabel, categoryId: this.id, target: AiConfigurationTools.selectionFor(name), keywords: name });
        }
        return items;
    }
}

/**
 * The per-tool confirmation-mode list with a reusable filter above it. The filter is local UI state, so
 * typing narrows the (potentially long) tool list without touching any preference. Each tool is a
 * non-navigable {@link AiConfigurationItemRow} whose trailing control is its confirmation-mode select,
 * so the list matches the Skills / Variables list style.
 */
const ToolConfirmationTable: React.FC<{
    toolNames: string[];
    getDescription: (name: string) => string | undefined;
    getEffectiveState: (name: string) => ToolConfirmationMode;
    isModified: (name: string) => boolean;
    onChangeMode: (name: string, value: ToolConfirmationMode) => void;
}> = ({ toolNames, getDescription, getEffectiveState, isModified, onChangeMode }) => {
    const [filter, setFilter] = React.useState('');
    const term = filter.trim().toLowerCase();
    const filtered = term ? toolNames.filter(name => name.toLowerCase().includes(term)) : toolNames;
    const modeLabel = nls.localize('theia/ai/ide/toolsConfiguration/confirmationMode/label', '确认模式');
    return <>
        <AiConfigurationFilterInput
            value={filter}
            onChange={setFilter}
            placeholder={nls.localize('theia/ai/ide/toolsConfiguration/filterPlaceholder', '筛选工具')}
        />
        <div className='ai-configuration-item-list'>
            {filtered.map(name => <AiConfigurationItemRow
                key={name}
                rowId={AiConfigurationTools.ROW_ID_PREFIX + name}
                label={name}
                description={getDescription(name)}
                modified={isModified(name)}
                trailing={<AiEnumSelect
                    ariaLabel={modeLabel}
                    value={getEffectiveState(name)}
                    options={TOOL_OPTIONS}
                    onCommit={value => onChangeMode(name, value as ToolConfirmationMode)}
                />}
            />)}
        </div>
    </>;
};
