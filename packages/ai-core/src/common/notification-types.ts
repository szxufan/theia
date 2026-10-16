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

import { nls } from '@theia/core';

export const NOTIFICATION_TYPE_OFF = 'off';
export const NOTIFICATION_TYPE_OS_NOTIFICATION = 'os-notification';
export const NOTIFICATION_TYPE_MESSAGE = 'message';
export const NOTIFICATION_TYPE_BLINK = 'blink';
export type NotificationType =
    | typeof NOTIFICATION_TYPE_OFF
    | typeof NOTIFICATION_TYPE_OS_NOTIFICATION
    | typeof NOTIFICATION_TYPE_MESSAGE
    | typeof NOTIFICATION_TYPE_BLINK;
export const NOTIFICATION_TYPES: NotificationType[] = [
    NOTIFICATION_TYPE_OFF,
    NOTIFICATION_TYPE_OS_NOTIFICATION,
    NOTIFICATION_TYPE_MESSAGE,
    NOTIFICATION_TYPE_BLINK,
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    [NOTIFICATION_TYPE_OFF]: nls.localizeByDefault('关闭'),
    [NOTIFICATION_TYPE_OS_NOTIFICATION]: nls.localize('theia/ai/core/notification/osNotification', '系统通知'),
    [NOTIFICATION_TYPE_MESSAGE]: nls.localizeByDefault('消息'),
    [NOTIFICATION_TYPE_BLINK]: nls.localize('theia/ai/core/notification/windowBlink', '窗口闪烁'),
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
    [NOTIFICATION_TYPE_OFF]: nls.localize('theia/ai/core/notification/off/description', '禁用所有通知'),
    [NOTIFICATION_TYPE_OS_NOTIFICATION]: nls.localize('theia/ai/core/notification/osNotification/description', '显示操作系统原生通知'),
    [NOTIFICATION_TYPE_MESSAGE]: nls.localize('theia/ai/core/notification/message/description', '在应用程序内显示通知消息'),
    [NOTIFICATION_TYPE_BLINK]: nls.localize('theia/ai/core/notification/windowBlink/description', '闪烁应用程序标题以吸引注意'),
};

/**
 * The event that triggered an agent notification. Drives the notification wording while
 * sharing the same delivery channel and user preference.
 */
export const AGENT_NOTIFICATION_KIND_COMPLETED = 'completed';
export const AGENT_NOTIFICATION_KIND_INPUT_NEEDED = 'inputNeeded';
export type AgentNotificationKind =
    | typeof AGENT_NOTIFICATION_KIND_COMPLETED
    | typeof AGENT_NOTIFICATION_KIND_INPUT_NEEDED;
