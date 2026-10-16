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
import { isCustomizedPromptFragment, PromptService } from '@theia/ai-core/lib/common/prompt-service';
import { AiConfigurationItemRow } from './ai-configuration-item-row';
import { AiConfigurationIconButton } from './ai-configuration-primitives';
import { AiEnumOption, AiEnumSelect } from './ai-configuration-controls';
import { AiSettingsRowService } from './ai-settings-row-service';
import { PromptCustomizationDialogs } from './prompt-customization-dialogs';

export interface VariantSetCardProps {
    /** The agent that owns this prompt variant set; the selection is stored per agent. */
    readonly agentId: string;
    /** The prompt variant set id (e.g. `coder-system`). */
    readonly promptVariantSetId: string;
    readonly promptService: PromptService;
    /** Backs the row's gear menu, whose "Reset Setting" reverts the selected variant to the default. */
    readonly settingsRowService: AiSettingsRowService;
    /**
     * Optional display names per variant id, as shown in the chat mode switcher (an agent's
     * `ChatMode` names). Falls back to the fragment name and then the variant id.
     */
    readonly variantLabels?: Record<string, string>;
}

/**
 * The reusable prompt-variant-set component rendered inside an agent's detail page: a single list row per
 * variant set, showing the set id, a select that picks the variant this agent uses (with `(default)` and
 * `[edited]` markers), an edit action to customize the selected variant, and a reset action that reverts a
 * customized variant to built-in. The agent detail is the single source of truth for prompt variant sets.
 */
export const VariantSetCard: React.FC<VariantSetCardProps> = ({ agentId, promptVariantSetId, promptService, settingsRowService, variantLabels }) => {
    const variantIds = promptService.getVariantIds(promptVariantSetId);
    const defaultVariantId = promptService.getDefaultVariantId(promptVariantSetId);

    const [selectedVariantId, setSelectedVariantId] = React.useState<string | undefined>(
        promptService.getSelectedVariantId(promptVariantSetId) ?? defaultVariantId);

    React.useEffect(() => {
        setSelectedVariantId(promptService.getSelectedVariantId(promptVariantSetId) ?? defaultVariantId);
        const disposable = promptService.onSelectedVariantChange(notification => {
            if (notification.promptVariantSetId === promptVariantSetId) {
                setSelectedVariantId(notification.variantId ?? defaultVariantId);
            }
        });
        return () => disposable.dispose();
    }, [promptVariantSetId, defaultVariantId, promptService]);

    const selected = selectedVariantId && variantIds.includes(selectedVariantId)
        ? selectedVariantId
        : defaultVariantId ?? variantIds[0];

    if (!selected) {
        return <AiConfigurationItemRow
            label={promptVariantSetId}
            description={nls.localize('theia/ai/core/promptFragmentsConfiguration/variantSetError',
                '所选变体不存在，且找不到默认变体。请检查你的配置。')}
            status={{ kind: 'error', label: nls.localizeByDefault('错误') }}
        />;
    }

    const isVariantCustomized = (variantId: string): boolean => {
        const fragment = promptService.getRawPromptFragment(variantId);
        return fragment ? isCustomizedPromptFragment(fragment) : false;
    };
    const variantName = (variantId: string): string =>
        variantLabels?.[variantId] ?? promptService.getRawPromptFragment(variantId)?.name ?? variantId;

    const selectVariant = (variantId: string): void => {
        promptService.updateSelectedVariantId(agentId, promptVariantSetId, variantId);
    };
    const customize = (variantId: string): void => {
        const fragment = promptService.getRawPromptFragment(variantId);
        if (fragment && isCustomizedPromptFragment(fragment)) {
            promptService.editCustomization(fragment.id, fragment.customizationId);
        } else {
            promptService.createBuiltInCustomization(variantId);
        }
    };
    const resetVariant = async (variantId: string): Promise<void> => {
        await PromptCustomizationDialogs.confirmAndReset(
            promptService,
            variantId,
            nls.localize('theia/ai/core/promptFragmentsConfiguration/resetToBuiltInDialogTitle', '重置为内置版本'),
            nls.localize('theia/ai/core/promptFragmentsConfiguration/resetToBuiltInDialogMsg',
                '确定要将提示词片段“{0}”重置为内置版本吗？这将移除所有自定义内容。', variantId)
        );
    };

    /**
     * A variant that exists only as a user file — a custom prompt template, which becomes a variant of this
     * set through its id prefix — has no built-in to fall back to, so it is deleted rather than reset. The
     * dialog names the file, since this removes it from disk.
     */
    const removeVariant = async (variantId: string): Promise<void> => {
        const removed = await PromptCustomizationDialogs.confirmAndRemove(promptService, variantId, {
            title: nls.localize('theia/ai/core/promptFragmentsConfiguration/removePromptTemplateDialogTitle', '移除提示词模板'),
            message: ({ type, description }) => description
                ? nls.localize('theia/ai/core/promptFragmentsConfiguration/removePromptTemplateWithDescDialogMsg',
                    '确定要移除提示词模板“{1}”（{2}）的 {0} 自定义吗？它没有内置版本，移除后将完全消失。',
                    type ?? '', variantId, description)
                : nls.localize('theia/ai/core/promptFragmentsConfiguration/removePromptTemplateDialogMsg',
                    '确定要移除提示词模板“{1}”的 {0} 自定义吗？它没有内置版本，移除后将完全消失。',
                    type ?? '', variantId)
        });
        // The agent still points at the template we just deleted, which would show up as an unavailable
        // selection. Selecting the default drops the stored selection, so the set is simply back to default.
        if (removed && defaultVariantId && promptService.getSelectedVariantId(promptVariantSetId) === variantId) {
            await promptService.updateSelectedVariantId(agentId, promptVariantSetId, defaultVariantId);
            setSelectedVariantId(defaultVariantId);
        }
    };

    const explicitSelection = promptService.getSelectedVariantId(promptVariantSetId);
    const invalidSelection = explicitSelection !== undefined && !variantIds.includes(explicitSelection);
    const selectedCustomized = isVariantCustomized(selected);
    // Without a built-in, `PromptService.resetToBuiltIn` is a no-op by design, so the action must delete.
    const selectedHasBuiltIn = PromptCustomizationDialogs.hasBuiltIn(promptService, selected);
    // The agent's selection deviates from the built-in default; the gear "Reset Setting" reverts it. (A
    // customized variant is a separate, global edit, surfaced by the `[edited]` marker and the reset icon.)
    const modified = defaultVariantId !== undefined && selected !== defaultVariantId;
    const variantCountLabel = variantIds.length === 1
        ? nls.localize('theia/ai/core/variantSet/variantCountSingular', '1 个变体')
        : nls.localize('theia/ai/core/variantSet/variantCount', '{0} 个变体', variantIds.length);

    // Each option shows the variant name plus `(default)`/`[edited]` markers, so the collapsed select surfaces
    // the selected variant's state and the dropdown reveals which variants are customized.
    const options: AiEnumOption[] = variantIds.map(variantId => {
        const markers = [variantName(variantId)];
        if (variantId === defaultVariantId) {
            markers.push(`(${nls.localizeByDefault('默认')})`);
        }
        if (isVariantCustomized(variantId)) {
            markers.push(`[${nls.localize('theia/ai/chat-ui/edited', '已编辑')}]`);
        }
        return { value: variantId, label: markers.join(' ') };
    });
    // A selection pointing at a template that no longer exists stays visible as a disabled, red "Unavailable"
    // entry instead of quietly showing the default: the effective prompt *is* the default, but silently
    // displaying it would hide that the agent's own selection is broken and needs a new pick.
    if (invalidSelection) {
        options.unshift({
            value: explicitSelection!,
            label: nls.localize('theia/ai/core/variantSet/unavailableVariant', '{0}（不可用）', explicitSelection!),
            disabled: true
        });
    }

    const editLabel = nls.localize('theia/ai/core/promptFragmentsConfiguration/editPromptTemplate', '编辑提示词模板');
    const resetLabel = selectedHasBuiltIn
        ? nls.localize('theia/ai/core/promptFragmentsConfiguration/resetPromptTemplate', '重置提示词模板')
        : nls.localize('theia/ai/core/promptFragmentsConfiguration/removePromptTemplate', '移除提示词模板');

    return <AiConfigurationItemRow
        label={promptVariantSetId}
        description={variantCountLabel}
        modified={modified}
        onOpenMenu={modified && defaultVariantId
            ? gear => settingsRowService.openResetMenu(gear, () => selectVariant(defaultVariantId))
            : undefined}
        trailing={<div className='ai-variant-controls'>
            <AiEnumSelect
                value={invalidSelection ? explicitSelection : selected}
                ariaLabel={nls.localizeByDefault('模板')}
                options={options}
                invalid={invalidSelection}
                onCommit={selectVariant}
            />
            <AiConfigurationIconButton
                iconClass={codicon('edit')}
                title={editLabel}
                onClick={() => customize(selected)}
            />
            {selectedCustomized && <AiConfigurationIconButton
                iconClass={codicon(selectedHasBuiltIn ? 'discard' : 'trash')}
                title={resetLabel}
                onClick={() => selectedHasBuiltIn ? resetVariant(selected) : removeVariant(selected)}
            />}
        </div>}
    />;
};
