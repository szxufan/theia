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

import { injectable, inject, optional } from '@theia/core/shared/inversify';
import { QuickInputService, QuickPickItem, StatusBarEntry, StatusBarAlignment } from '@theia/core/lib/browser';
import { nls, PreferenceScope } from '@theia/core';
import { Severity } from '@theia/core/lib/common/severity';
import { TextEditor } from '../editor';
import { FormatterService, FormatterSettingScope, FormatterStatus, FormatterInfo } from '../editor-formatter-service';
import { LanguageStatus } from './editor-language-status-service';

interface ScopeDisplayInfo {
    icon: string;
    text: string;
}

const SCOPE_DISPLAY_MAP: Record<FormatterSettingScope, () => ScopeDisplayInfo> = {
    user: () => ({
        icon: '$(account)',
        text: nls.localizeByDefault('用户设置')
    }),
    workspace: () => ({
        icon: '$(folder)',
        text: nls.localizeByDefault('工作区设置')
    }),
    folder: () => ({
        icon: '$(folder-opened)',
        text: nls.localizeByDefault('文件夹设置')
    }),
    auto: () => ({
        icon: '$(check)',
        text: nls.localize('theia/editor/onlyAvailableFormatter', '唯一可用的格式化程序')
    }),
    none: () => ({
        icon: '$(question)',
        text: nls.localizeByDefault('未知')
    })
};

function getScopeDisplayInfo(scope: FormatterSettingScope): ScopeDisplayInfo {
    return SCOPE_DISPLAY_MAP[scope]();
}

/**
 * Icons used for formatter status display.
 * - info: normal state (configured, auto-selected, or no formatters)
 * - error: invalid configuration with no fallback
 * - warning: invalid config with fallback available (single formatter case)
 */
const enum FormatterIcon {
    Info = '$(info)',
    Error = '$(error)',
    Warning = '$(warning)'
}

/**
 * Display information for a formatter status.
 */
interface FormatterDisplayInfo {
    /** Icon to display (check, error, warning) */
    icon: FormatterIcon;
    /** Label text (formatter name or status) */
    label: string;
    /** Tooltip text for hover */
    tooltip: string;
    /** Whether the configure action should be available */
    hasConfigureAction: boolean;
    /** Severity for the language status item */
    severity: Severity;
}

/**
 * Handles formatter-related status bar functionality.
 * Responsible for creating formatter status items, displaying formatter quick picks,
 * and managing pinned formatter items in the status bar.
 */
@injectable()
export class EditorFormatterStatusContribution {
    static readonly FORMATTER_STATUS_ITEM_ID = 'editor-formatter-status';

    @inject(FormatterService) @optional()
    protected readonly formatterService: FormatterService | undefined;

    @inject(QuickInputService) @optional()
    protected readonly quickInputService: QuickInputService | undefined;

    /**
     * Creates a language status item for the formatter.
     * Returns undefined if no formatter service is available.
     */
    createFormatterStatusItem(editor: TextEditor): LanguageStatus | undefined {
        if (!this.formatterService) {
            return undefined;
        }

        const displayInfo = this.getFormatterDisplayInfo(editor);

        return {
            id: EditorFormatterStatusContribution.FORMATTER_STATUS_ITEM_ID,
            name: nls.localize('theia/editor/formatter', '格式化程序'),
            selector: { language: editor.document.languageId },
            severity: displayInfo.severity,
            label: displayInfo.label,
            detail: '',
            busy: false,
            source: 'theia',
            command: {
                id: EditorFormatterStatusContribution.FORMATTER_STATUS_ITEM_ID,
                title: '',
                tooltip: displayInfo.tooltip
            },
            accessibilityInfo: undefined
        };
    }

    /**
     * Gets the tooltip text for the formatter status item.
     */
    getTooltip(editor: TextEditor): string {
        if (!this.formatterService) {
            return '';
        }
        const displayInfo = this.getFormatterDisplayInfo(editor);
        return displayInfo.tooltip;
    }

    /**
     * Creates a status bar entry for a pinned formatter item.
     * Includes proper tooltip and icon.
     */
    createPinnedStatusBarEntry(editor: TextEditor | undefined, onclick?: (e: MouseEvent) => void): StatusBarEntry {
        if (!this.formatterService || !editor) {
            return {
                text: `${FormatterIcon.Warning} ${nls.localize('theia/editor/formatter', '格式化程序')}`,
                tooltip: nls.localize('theia/editor/noEditor', '没有活动的编辑器'),
                affinity: { id: 'editor-status-language', alignment: StatusBarAlignment.RIGHT, compact: false },
                alignment: StatusBarAlignment.RIGHT,
                onclick,
            };
        }

        const displayInfo = this.getFormatterDisplayInfo(editor, true);

        return {
            text: `${displayInfo.icon} ${displayInfo.label}`,
            tooltip: displayInfo.tooltip,
            affinity: { id: 'editor-status-language', alignment: StatusBarAlignment.RIGHT, compact: false },
            alignment: StatusBarAlignment.RIGHT,
            onclick,
        };
    }

    /**
     * Shows the formatter selection quick pick dialog.
     */
    async showFormatterQuickPick(editor: TextEditor): Promise<void> {
        if (!this.formatterService || !this.quickInputService) {
            return;
        }

        const formatters = this.formatterService.getAvailableFormatters(editor);

        if (formatters.length === 0) {
            await this.quickInputService.showQuickPick(
                [{ label: nls.localize('theia/editor/noFormattersAvailable', '此语言没有可用的格式化程序') }],
                { placeholder: nls.localize('theia/editor/selectFormatter', '选择默认格式化程序') }
            );
            return;
        }

        const selectedFormatter = await this.showFormatterSelectionPick(editor, formatters);
        if (selectedFormatter === undefined) {
            return;
        }

        const targetScope = await this.determineTargetScope(editor);
        if (targetScope === undefined) {
            return;
        }

        const formatterId = selectedFormatter.id === '' ? undefined : selectedFormatter.id;
        await this.formatterService.setDefaultFormatter(editor, formatterId, targetScope);
    }

    /**
     * Returns true if the formatter service is available.
     */
    isAvailable(): boolean {
        return this.formatterService !== undefined;
    }

    /**
     * Returns true if the configure action should be available for the given editor.
     * Configure is available when there are multiple formatters or an invalid configuration.
     */
    hasConfigureAction(editor: TextEditor): boolean {
        if (!this.formatterService) {
            return false;
        }
        const displayInfo = this.getFormatterDisplayInfo(editor);
        return displayInfo.hasConfigureAction;
    }

    /**
     * Gets the formatter display info for the given editor.
     * Caches the status to avoid repeated service calls.
     */
    protected getFormatterDisplayInfo(editor: TextEditor, useShortLabel = false): FormatterDisplayInfo {
        const status = this.formatterService!.getFormatterStatus(editor);
        const availableFormatters = this.formatterService!.getAvailableFormatters(editor);
        return this.buildDisplayInfo(status, availableFormatters, useShortLabel);
    }

    /**
     * Builds display info based on the current formatter state.
     * @param status The formatter status
     * @param availableFormatters List of available formatters
     * @param useShortLabel If true, uses shorter labels suitable for status bar
     */
    protected buildDisplayInfo(status: FormatterStatus, availableFormatters: FormatterInfo[], useShortLabel = false): FormatterDisplayInfo {
        const formatterCount = availableFormatters.length;

        if (formatterCount === 0) {
            return this.buildNoFormattersDisplayInfo(status, useShortLabel);
        }

        if (formatterCount === 1) {
            return this.buildSingleFormatterDisplayInfo(status, availableFormatters[0]);
        }

        return this.buildMultipleFormattersDisplayInfo(status, formatterCount);
    }

    protected buildNoFormattersDisplayInfo(status: FormatterStatus, useShortLabel = false): FormatterDisplayInfo {
        const label = useShortLabel
            ? nls.localize('theia/editor/noFormatter', '无格式化程序')
            : nls.localize('theia/editor/noFormatterInstalled', '未安装格式化程序');

        if (status.configuredFormatterId) {
            const scopeInfo = getScopeDisplayInfo(status.scope);
            return {
                icon: FormatterIcon.Error,
                label,
                tooltip: nls.localize(
                    'theia/editor/configuredNotInstalled',
                    "已在 {1} 中配置 '{0}'，但未安装",
                    status.configuredFormatterId,
                    scopeInfo.text
                ),
                hasConfigureAction: false,
                severity: Severity.Error
            };
        }
        return {
            icon: FormatterIcon.Info,
            label,
            tooltip: nls.localize('theia/editor/noFormattersInstalledTooltip', '未安装适用于此语言的格式化程序。'),
            hasConfigureAction: false,
            severity: Severity.Info
        };
    }

    protected buildSingleFormatterDisplayInfo(status: FormatterStatus, formatter: FormatterInfo): FormatterDisplayInfo {
        // Invalid config but we have a fallback
        if (status.isInvalid && status.configuredFormatterId) {
            const scopeInfo = getScopeDisplayInfo(status.scope);
            return {
                icon: FormatterIcon.Warning,
                label: formatter.displayName,
                tooltip: nls.localize(
                    'theia/editor/configuredNotInstalledFallbackNamed',
                    "已在 {1} 中配置 '{0}'，但未安装，正在使用 '{2}'",
                    status.configuredFormatterId,
                    scopeInfo.text,
                    formatter.displayName
                ),
                hasConfigureAction: true,
                severity: Severity.Warning
            };
        }

        // Normal case - auto-selected single formatter
        return {
            icon: FormatterIcon.Info,
            label: formatter.displayName,
            tooltip: nls.localize('theia/editor/onlyFormatterInstalled', '{0}（唯一已安装的格式化程序）', formatter.displayName),
            hasConfigureAction: false,
            severity: Severity.Info
        };
    }

    protected buildMultipleFormattersDisplayInfo(status: FormatterStatus, formatterCount: number): FormatterDisplayInfo {
        // Invalid config - configured formatter not installed
        if (status.isInvalid && status.configuredFormatterId) {
            const scopeInfo = getScopeDisplayInfo(status.scope);
            return {
                icon: FormatterIcon.Error,
                label: status.configuredFormatterId,
                tooltip: nls.localize(
                    'theia/editor/configuredNotInstalled',
                    "'{0}' configured in {1} but not installed",
                    status.configuredFormatterId,
                    scopeInfo.text
                ),
                hasConfigureAction: true,
                severity: Severity.Error
            };
        }

        // Configured formatter
        if (status.formatter) {
            const scopeInfo = getScopeDisplayInfo(status.scope);
            return {
                icon: FormatterIcon.Info,
                label: status.formatter.displayName,
                tooltip: nls.localize(
                    'theia/editor/configuredIn',
                    '已在 {0} 中配置',
                    scopeInfo.text
                ),
                hasConfigureAction: true,
                severity: Severity.Info
            };
        }

        // No formatter configured
        return {
            icon: FormatterIcon.Info,
            label: nls.localize('theia/editor/noDefaultConfiguredLabel', '未配置默认格式化程序'),
            tooltip: nls.localize('theia/editor/noDefaultConfiguredTooltip', '未配置默认格式化程序（有 {0} 个格式化程序可用）', formatterCount),
            hasConfigureAction: true,
            severity: Severity.Info
        };
    }

    protected async showFormatterSelectionPick(
        editor: TextEditor,
        formatters: FormatterInfo[]
    ): Promise<QuickPickItem | undefined> {
        if (!this.formatterService || !this.quickInputService) {
            return undefined;
        }
        const status = this.formatterService.getFormatterStatus(editor);
        const currentFormatterId = status.formatter?.id;
        const currentLabel = nls.localize('theia/editor/currentFormatter', '（当前）');

        const formatterItems: QuickPickItem[] = formatters.map(formatter => ({
            label: formatter.displayName,
            description: formatter.id === currentFormatterId ? currentLabel : undefined,
            detail: formatter.id,
            id: formatter.id
        }));

        const noneItem: QuickPickItem = {
            label: nls.localizeByDefault('无'),
            description: !currentFormatterId ? currentLabel : undefined,
            detail: nls.localize('theia/editor/clearFormatterSetting', '清除格式化程序设置'),
            id: ''
        };

        return this.quickInputService.showQuickPick(
            [noneItem, ...formatterItems],
            { placeholder: nls.localize('theia/editor/selectFormatter', '选择默认格式化程序') }
        );
    }

    protected async determineTargetScope(editor: TextEditor): Promise<PreferenceScope | undefined> {
        if (!this.formatterService) {
            return undefined;
        }
        const currentScope = this.formatterService.getConfiguredScope(editor);

        if (currentScope === PreferenceScope.Folder || currentScope === PreferenceScope.Workspace) {
            return currentScope;
        }

        return this.showScopeSelectionPick();
    }

    protected async showScopeSelectionPick(): Promise<PreferenceScope | undefined> {
        if (!this.quickInputService) {
            return undefined;
        }
        const userScopeInfo = getScopeDisplayInfo('user');
        const workspaceScopeInfo = getScopeDisplayInfo('workspace');

        const scopeItems: (QuickPickItem & { value: PreferenceScope })[] = [
            {
                label: `${userScopeInfo.icon} ${userScopeInfo.text}`,
                detail: nls.localize('theia/editor/userSettingsDetail', '应用于所有工作区'),
                value: PreferenceScope.User
            },
            {
                label: `${workspaceScopeInfo.icon} ${workspaceScopeInfo.text}`,
                detail: nls.localize('theia/editor/workspaceSettingsDetail', '仅应用于当前工作区'),
                value: PreferenceScope.Workspace
            }
        ];

        const result = await this.quickInputService.showQuickPick(
            scopeItems,
            { placeholder: nls.localize('theia/editor/selectScope', '选择保存此设置的位置') }
        );

        return result?.value;
    }
}
