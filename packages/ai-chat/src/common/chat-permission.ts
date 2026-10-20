// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability as set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { nls } from '@theia/core';
import { CommonChatSessionSettings, resolvePermissionSettings } from './chat-model';
import { ToolConfirmationMode } from './chat-tool-preferences';

/**
 * Tools that immediately change workspace or system state. Their calls are gated by the
 * session permission mode and denied in plan mode. Proposal-style tools (suggest*) are not
 * listed: they only create reviewable change sets. Action-based tools are gated per call via
 * {@link isMutatingToolCall}.
 */
export const MUTATING_TOOL_IDS: ReadonlySet<string> = new Set([
    'writeFileContent',
    'writeFileReplacements',
    'writeFileReplacementsSimple',
    'shellExecute',
    'shellExecuteBackground',
    'runTask'
]);

export function isMutatingToolId(toolId: string): boolean {
    return MUTATING_TOOL_IDS.has(toolId);
}

/**
 * Whether this specific call of a mutating tool actually mutates state. The shell tools are
 * action-based: only "execute"/"start" run a command; their read/status/stop actions operate on
 * already-approved executions and stay available in plan mode. Ids are hardcoded (not imported
 * from @theia/ai-terminal) because ai-chat sits below that package in the dependency graph.
 */
export function isMutatingToolCall(toolId: string, args?: string): boolean {
    if (toolId !== 'shellExecute' && toolId !== 'shellExecuteBackground') {
        return isMutatingToolId(toolId);
    }
    try {
        const parsed = args === undefined ? undefined : JSON.parse(args) as { action?: string; resultId?: string };
        if (toolId === 'shellExecute') {
            const action = parsed?.action ?? (parsed?.resultId !== undefined ? 'read' : 'execute');
            return action !== 'read';
        }
        return parsed?.action === undefined || parsed.action === 'start';
    } catch {
        return true; // Unparseable arguments: treat as mutating (the safer default)
    }
}

/** Denial reason handed back to the model when plan mode blocks a mutating tool. */
export const PLAN_MODE_DENIAL_REASON = nls.localize('theia/ai-chat/permission/planDenial',
    '计划模式下禁止执行写操作。请先探索工作区并输出实施计划，待用户关闭计划模式后再执行修改。');

/**
 * Outcome of applying the session permission mode to a tool call: either the confirmation
 * mode to proceed with, or a denial to hand back to the model.
 */
export type PermissionResolution = ToolConfirmationMode | { deny: string };

/**
 * Applies the session's permission mode and plan flag on top of the preference-derived
 * confirmation mode. A `DISABLED` preference always wins (the user explicitly turned the
 * tool off). Otherwise:
 * - plan mode denies mutating calls outright with an explanatory reason;
 * - `confirm` forces CONFIRM for mutating tools (变更前确认), regardless of preferences;
 * - `autonomous` auto-approves confirmations except for tools flagged `confirmAlwaysAllow`
 *   (e.g. shell execution), which stay confirmed and are gated by the AI command review;
 * - `full` auto-approves everything, including `confirmAlwaysAllow` tools.
 */
export function resolvePermissionConfirmationMode(
    preferenceMode: ToolConfirmationMode,
    settings: CommonChatSessionSettings | undefined,
    toolRequest: Pick<ToolRequestInfo, 'id' | 'confirmAlwaysAllow' | 'arguments'>
): PermissionResolution {
    const { permissionMode, planMode } = resolvePermissionSettings(settings);
    if (preferenceMode === ToolConfirmationMode.DISABLED) {
        return preferenceMode;
    }
    if (planMode && isMutatingToolCall(toolRequest.id, toolRequest.arguments)) {
        return { deny: PLAN_MODE_DENIAL_REASON };
    }
    switch (permissionMode) {
        case 'confirm':
            if (isMutatingToolCall(toolRequest.id, toolRequest.arguments)) {
                return ToolConfirmationMode.CONFIRM;
            }
            return preferenceMode;
        case 'autonomous':
            if (preferenceMode === ToolConfirmationMode.CONFIRM && !toolRequest.confirmAlwaysAllow) {
                return ToolConfirmationMode.ALWAYS_ALLOW;
            }
            return preferenceMode;
        case 'full':
            return ToolConfirmationMode.ALWAYS_ALLOW;
    }
}

interface ToolRequestInfo {
    id: string;
    confirmAlwaysAllow?: boolean | string;
    /** Raw tool call arguments, when available; enables per-action gating of action-based tools. */
    arguments?: string;
}
