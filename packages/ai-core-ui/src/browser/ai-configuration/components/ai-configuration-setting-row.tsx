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

import { nls } from '@theia/core';
import { codicon } from '@theia/core/lib/browser';
import * as React from '@theia/core/shared/react';
import { AiMarkdownDescription } from './ai-configuration-primitives';

export interface AiConfigurationSettingRowProps {
    /**
     * Preference id; used as the deep-link anchor and by the gear menu's copy/reset commands. Omitted for
     * rows backed by non-preference data (e.g. per-agent settings).
     */
    readonly preferenceId?: string;
    /** Human-readable setting title. */
    readonly title: string;
    /**
     * Optional already-localized description rendered under the title. A string is rendered as markdown when
     * {@link renderMarkdown} is given (else as plain text); a React node (e.g. text with a link) is rendered as-is.
     */
    readonly description?: React.ReactNode;
    /** Bound markdown renderer (stable identity for the description's effect). Omit to render the description as plain text. */
    readonly renderMarkdown?: (markdown: string) => HTMLElement;
    /** `true` when the value is overridden in the current scope; reveals the modified edge. */
    readonly modified: boolean;
    /** Schema tags shown as badges next to the title (e.g. `experimental`, `preview`), mirroring the Settings UI. */
    readonly tags?: string[];
    /**
     * Opens this view's setting context menu (Reset Setting / Copy Setting ID / Copy Setting as JSON)
     * anchored at the gear element. When omitted the gear is hidden. The owner wires this to
     * {@link AiSettingsRowService.openSettingContextMenu}.
     */
    readonly onOpenMenu?: (gear: HTMLElement) => void;
    /** Inline control shown on the right of the row. */
    readonly control?: React.ReactNode;
    /** Full-width control shown below the row (e.g. a chip editor or a path input). */
    readonly below?: React.ReactNode;
    /**
     * Extra action(s) (e.g. a "Reset All" button) shown top-right, aligned with the title. Rendered next to
     * an inline {@link control} or on its own when the control is {@link below}, so a normal setting row can
     * carry page-level actions.
     */
    readonly actions?: React.ReactNode;
}

/**
 * Presentational per-setting row shared across every AI configuration page: title, the schema
 * description, a control (inline via {@link AiConfigurationSettingRowProps.control} or full-width via
 * {@link AiConfigurationSettingRowProps.below}), a modified edge when overridden in the current scope,
 * and a gear menu (mirroring the Settings UI) offering "Copy Setting ID" and "Reset Setting". It is
 * DI-free; owners supply the values, a bound markdown renderer and the callbacks.
 */
export const AiConfigurationSettingRow: React.FC<AiConfigurationSettingRowProps> = ({
    preferenceId, title, description, renderMarkdown, modified, tags, onOpenMenu, control, below, actions
}) => (
    <div className={`ai-settings-row${modified ? ' modified' : ''}`} data-ai-config-row-id={preferenceId}>
        <AiSettingRowGear onOpenMenu={onOpenMenu} />
        <div className='ai-settings-row-top'>
            <div className='ai-settings-row-main'>
                <div className='ai-settings-row-title'>
                    {title}
                    {tags && tags.length > 0 && <span className='ai-settings-row-tags'>
                        {tags.map(tag => (
                            <span key={tag} className='ai-settings-row-tag' title={tagTooltip(tag)}>
                                {tagLabel(tag)}
                            </span>
                        ))}
                    </span>}
                </div>
                {description !== undefined && (typeof description === 'string' && renderMarkdown
                    ? <AiMarkdownDescription renderMarkdown={renderMarkdown} markdown={description} />
                    : <div className='ai-settings-row-description'>{description}</div>)}
            </div>
            <div className='ai-settings-row-control'>
                {control}
                {actions}
            </div>
        </div>
        {below && <div className='ai-settings-row-below'>{below}</div>}
    </div>
);

/** Badge text for a preference tag, matching the Settings UI (experimental/preview localized; else the raw tag). */
function tagLabel(tag: string): string {
    return tag === 'experimental' ? nls.localizeByDefault('实验性')
        : tag === 'preview' ? nls.localizeByDefault('预览')
            : tag;
}

/** Hover text for a preference tag badge, matching the Settings UI. */
function tagTooltip(tag: string): string {
    if (tag === 'experimental') {
        return nls.localizeByDefault(
            '实验性设置：此设置控制一个正在积极开发中且可能不稳定的新功能。它可能会被更改或移除。');
    }
    if (tag === 'preview') {
        return nls.localizeByDefault(
            '预览设置：此设置控制一个仍在完善中但已可使用的新功能。欢迎提供反馈。');
    }
    return tag;
}

/**
 * Gear affordance in the row's left gutter, matching the Settings UI: a cog button (outside the content,
 * so it never shifts the title) that opens the preference context menu via
 * {@link AiConfigurationSettingRowProps.onOpenMenu}. That opener renders a real Theia context menu
 * (`AI_CONFIGURATION_SETTING_CONTEXT_MENU`), so no popover is implemented here. Hidden when no opener
 * is given.
 */
const AiSettingRowGear: React.FC<{
    onOpenMenu?: (gear: HTMLElement) => void;
}> = ({ onOpenMenu }) => {
    if (!onOpenMenu) {
        return undefined;
    }
    return <div className='ai-settings-row-actions'>
        <AiSettingGearButton onOpenMenu={onOpenMenu} />
    </div>;
};

/**
 * The bare cog button that opens a row's context menu, shared by {@link AiConfigurationSettingRow} and the
 * list {@link AiConfigurationItemRow} so both surface the identical gear affordance. It renders no wrapper,
 * so each host places it (the setting row in its left gutter, the item row in its trailing cluster).
 */
export const AiSettingGearButton: React.FC<{
    onOpenMenu: (gear: HTMLElement) => void;
}> = ({ onOpenMenu }) => {
    const open = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        onOpenMenu(event.currentTarget);
    }, [onOpenMenu]);
    const label = nls.localizeByDefault('更多操作...');
    return <button
        type='button'
        className={`ai-settings-row-gear ${codicon('settings-gear')}`}
        title={label}
        aria-label={label}
        aria-haspopup='menu'
        onClick={open}
    ></button>;
};
