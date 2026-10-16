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

import {
    NotificationType,
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_LABELS,
    NOTIFICATION_TYPE_DESCRIPTIONS,
} from '@theia/ai-core/lib/common';
import { nls } from '@theia/core';
import { SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import { AiEnumSelect } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-controls';
import { AiConfigurationSettingRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-setting-row';
import { AiSettingsRowService } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-settings-row-service';

export interface AgentNotificationSettingsProps {
    agentId: string;
    currentNotificationType?: NotificationType;
    onNotificationTypeChange: (agentId: string, notificationType: NotificationType | undefined) => Promise<void>;
    /** Opens the global AI notification setting (linked from the description). */
    onOpenNotificationSettings: () => void;
    /** Backs the row's gear menu (its "Reset Setting" resets this agent's override). */
    settingsRowService: AiSettingsRowService;
}

const DEFAULT_VALUE = 'default';

const NOTIFICATION_SELECT_OPTIONS: SelectOption[] = [
    {
        value: DEFAULT_VALUE,
        label: nls.localizeByDefault('默认'),
        description: nls.localize('theia/ai/core/agentConfiguration/defaultNotificationDescription',
            '使用全局 AI 通知设置'),
    },
    ...NOTIFICATION_TYPES.map(type => ({
        value: type,
        label: NOTIFICATION_TYPE_LABELS[type],
        description: NOTIFICATION_TYPE_DESCRIPTIONS[type],
    })),
];

/** The agent's completion-notification setting, rendered as a normal setting row whose gear menu resets the override. */
export const AgentNotificationSettings = ({
    agentId, currentNotificationType, onNotificationTypeChange, onOpenNotificationSettings, settingsRowService
}: AgentNotificationSettingsProps) => {
    const handleChange = (value: string): void => {
        const notificationType = value === DEFAULT_VALUE ? undefined : value as NotificationType;
        onNotificationTypeChange(agentId, notificationType);
    };
    const isOverridden = currentNotificationType !== undefined;
    return <AiConfigurationSettingRow
        title={nls.localizeByDefault('通知')}
        description={<>
            {/* Own key: the shipped `completionNotificationDescriptionPrefix` is translated with the older,
                longer wording, and a translation wins over a changed default. */}
            {nls.localize('theia/ai/core/agentConfiguration/completionNotificationIntro',
                '当此代理需要您的注意（完成任务或请求输入）时，您希望如何收到通知。“默认”使用全局 ')}
            <a href='#' onClick={event => { event.preventDefault(); onOpenNotificationSettings(); }}>
                {nls.localize('theia/ai/core/agentConfiguration/notificationSettingsLink', 'AI 通知设置')}
            </a>。
        </>}
        modified={isOverridden}
        below={<AiEnumSelect
            ariaLabel={nls.localizeByDefault('通知')}
            options={NOTIFICATION_SELECT_OPTIONS.map(option => ({
                value: String(option.value ?? ''),
                label: option.label ?? String(option.value ?? ''),
                title: option.description
            }))}
            value={currentNotificationType ?? DEFAULT_VALUE}
            onCommit={handleChange}
        />}
        onOpenMenu={gear => settingsRowService.openResetMenu(gear, () => onNotificationTypeChange(agentId, undefined))}
    />;
};
