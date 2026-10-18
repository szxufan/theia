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

import { nls } from '@theia/core';
import { AutonomyMode } from './chat-model';
import { ToolConfirmationMode } from './chat-tool-preferences';

/**
 * Tools that immediately change workspace or system state and are therefore blocked in the
 * `plan` autonomy mode. Proposal-style tools (suggest*) stay available: they only create
 * reviewable change sets.
 */
export const AUTONOMY_MUTATING_TOOL_IDS: ReadonlySet<string> = new Set([
    'writeFileContent',
    'writeFileReplacements',
    'writeFileReplacementsSimple',
    'shellExecute',
    'runTask'
]);

export function isMutatingToolId(toolId: string): boolean {
    return AUTONOMY_MUTATING_TOOL_IDS.has(toolId);
}

/** Denial reason handed back to the model when plan mode blocks a mutating tool. */
export const PLAN_MODE_DENIAL_REASON = nls.localize('theia/ai-chat/autonomy/planDenial',
    '计划模式下禁止执行写操作。请先输出实现计划，等用户切换自主模式后再执行修改。');

/**
 * Outcome of applying the session autonomy mode to a tool call: either the confirmation
 * mode to proceed with, or a denial to hand back to the model.
 */
export type AutonomyResolution = ToolConfirmationMode | { deny: string };

/**
 * Applies the session's autonomy mode on top of the preference-derived confirmation mode:
 * - `plan`: mutating tools are denied with an explanatory reason instead of running.
 * - `yolo`: pending confirmations are auto-approved, except tools flagged
 *   `confirmAlwaysAllow` (e.g. shell execution), which keep their regular confirmation.
 */
export function resolveAutonomyConfirmationMode(
    preferenceMode: ToolConfirmationMode,
    autonomyMode: AutonomyMode | undefined,
    toolRequest: Pick<ToolRequestInfo, 'id' | 'confirmAlwaysAllow'>
): AutonomyResolution {
    if (autonomyMode === 'plan' && preferenceMode !== ToolConfirmationMode.DISABLED && isMutatingToolId(toolRequest.id)) {
        return { deny: PLAN_MODE_DENIAL_REASON };
    }
    if (autonomyMode === 'yolo'
        && preferenceMode === ToolConfirmationMode.CONFIRM
        && !toolRequest.confirmAlwaysAllow) {
        return ToolConfirmationMode.ALWAYS_ALLOW;
    }
    return preferenceMode;
}

interface ToolRequestInfo {
    id: string;
    confirmAlwaysAllow?: boolean | string;
}
