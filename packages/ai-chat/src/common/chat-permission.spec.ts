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

import { expect } from 'chai';
import { CommonChatSessionSettings, resolvePermissionSettings } from './chat-model';
import { ToolConfirmationMode } from './chat-tool-preferences';
import {
    isMutatingToolCall,
    PLAN_MODE_DENIAL_REASON,
    resolvePermissionConfirmationMode
} from './chat-permission';

const CONFIRM = ToolConfirmationMode.CONFIRM;
const ALWAYS_ALLOW = ToolConfirmationMode.ALWAYS_ALLOW;
const DISABLED = ToolConfirmationMode.DISABLED;

describe('ChatPermission', () => {

    describe('resolvePermissionSettings', () => {

        it('defaults to confirm without plan mode', () => {
            expect(resolvePermissionSettings(undefined)).to.deep.equal({ permissionMode: 'confirm', planMode: false });
            expect(resolvePermissionSettings({})).to.deep.equal({ permissionMode: 'confirm', planMode: false });
        });

        it('reads the new fields', () => {
            expect(resolvePermissionSettings({ permissionMode: 'full', planMode: true }))
                .to.deep.equal({ permissionMode: 'full', planMode: true });
        });

        it('migrates legacy autonomyMode values', () => {
            expect(resolvePermissionSettings({ autonomyMode: 'yolo' }))
                .to.deep.equal({ permissionMode: 'autonomous', planMode: false });
            expect(resolvePermissionSettings({ autonomyMode: 'plan' }))
                .to.deep.equal({ permissionMode: 'confirm', planMode: true });
            expect(resolvePermissionSettings({ autonomyMode: 'default' }))
                .to.deep.equal({ permissionMode: 'confirm', planMode: false });
        });

        it('prefers the new fields over legacy values', () => {
            expect(resolvePermissionSettings({ permissionMode: 'full', autonomyMode: 'plan' }))
                .to.deep.equal({ permissionMode: 'full', planMode: true });
        });
    });

    describe('isMutatingToolCall', () => {

        it('classifies file writes and task runs as mutating', () => {
            expect(isMutatingToolCall('writeFileContent')).to.be.true;
            expect(isMutatingToolCall('writeFileReplacements')).to.be.true;
            expect(isMutatingToolCall('runTask')).to.be.true;
        });

        it('classifies read-only tools as non-mutating', () => {
            expect(isMutatingToolCall('getFileContent')).to.be.false;
            expect(isMutatingToolCall('searchInWorkspace')).to.be.false;
        });

        it('gates shellExecute per action', () => {
            expect(isMutatingToolCall('shellExecute', JSON.stringify({ command: 'npm test' }))).to.be.true;
            expect(isMutatingToolCall('shellExecute', JSON.stringify({ action: 'execute', command: 'npm test' }))).to.be.true;
            expect(isMutatingToolCall('shellExecute', JSON.stringify({ action: 'read', resultId: 'r1' }))).to.be.false;
            expect(isMutatingToolCall('shellExecute', JSON.stringify({ resultId: 'r1' }))).to.be.false;
        });

        it('gates shellExecuteBackground per action', () => {
            expect(isMutatingToolCall('shellExecuteBackground', JSON.stringify({ command: 'npm watch' }))).to.be.true;
            expect(isMutatingToolCall('shellExecuteBackground', JSON.stringify({ action: 'start', command: 'npm watch' }))).to.be.true;
            expect(isMutatingToolCall('shellExecuteBackground', JSON.stringify({ action: 'read' }))).to.be.false;
            expect(isMutatingToolCall('shellExecuteBackground', JSON.stringify({ action: 'stop' }))).to.be.false;
        });

        it('treats unparseable shell arguments as mutating', () => {
            expect(isMutatingToolCall('shellExecute', 'not json')).to.be.true;
        });
    });

    describe('resolvePermissionConfirmationMode', () => {

        const writeTool = { id: 'writeFileContent' };
        const readTool = { id: 'getFileContent' };
        const shellTool = { id: 'shellExecute', confirmAlwaysAllow: true, arguments: JSON.stringify({ command: 'npm test' }) };

        it('never overrides an explicit tool disable', () => {
            for (const settings of [undefined, { permissionMode: 'full' } as CommonChatSessionSettings, { planMode: true }]) {
                expect(resolvePermissionConfirmationMode(DISABLED, settings, writeTool)).to.equal(DISABLED);
            }
        });

        it('denies mutating calls in plan mode with an explanatory reason', () => {
            const resolution = resolvePermissionConfirmationMode(CONFIRM, { planMode: true }, writeTool);
            expect(resolution).to.deep.equal({ deny: PLAN_MODE_DENIAL_REASON });
        });

        it('keeps read-only shell actions available in plan mode', () => {
            const shellRead = { id: 'shellExecute', confirmAlwaysAllow: true, arguments: JSON.stringify({ action: 'read', resultId: 'r1' }) };
            expect(resolvePermissionConfirmationMode(ALWAYS_ALLOW, { planMode: true }, shellRead)).to.equal(ALWAYS_ALLOW);
        });

        it('confirm mode forces confirmation for mutating tools even when preferences allow them', () => {
            expect(resolvePermissionConfirmationMode(ALWAYS_ALLOW, { permissionMode: 'confirm' }, writeTool)).to.equal(CONFIRM);
            expect(resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'confirm' }, writeTool)).to.equal(CONFIRM);
        });

        it('confirm mode leaves non-mutating tools on their preferences', () => {
            expect(resolvePermissionConfirmationMode(ALWAYS_ALLOW, { permissionMode: 'confirm' }, readTool)).to.equal(ALWAYS_ALLOW);
            expect(resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'confirm' }, readTool)).to.equal(CONFIRM);
        });

        it('autonomous mode auto-approves confirmations except confirmAlwaysAllow tools', () => {
            expect(resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'autonomous' }, writeTool)).to.equal(ALWAYS_ALLOW);
            expect(resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'autonomous' }, shellTool)).to.equal(CONFIRM);
            expect(resolvePermissionConfirmationMode(ALWAYS_ALLOW, { permissionMode: 'autonomous' }, readTool)).to.equal(ALWAYS_ALLOW);
        });

        it('full mode auto-approves everything including confirmAlwaysAllow tools', () => {
            expect(resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'full' }, writeTool)).to.equal(ALWAYS_ALLOW);
            expect(resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'full' }, shellTool)).to.equal(ALWAYS_ALLOW);
        });

        it('plan mode wins over permissive modes for mutating calls', () => {
            const resolution = resolvePermissionConfirmationMode(CONFIRM, { permissionMode: 'full', planMode: true }, writeTool);
            expect(resolution).to.deep.equal({ deny: PLAN_MODE_DENIAL_REASON });
        });

        it('migrates legacy yolo/plan settings', () => {
            expect(resolvePermissionConfirmationMode(CONFIRM, { autonomyMode: 'yolo' }, writeTool)).to.equal(ALWAYS_ALLOW);
            expect(resolvePermissionConfirmationMode(CONFIRM, { autonomyMode: 'yolo' }, shellTool)).to.equal(CONFIRM);
            expect(resolvePermissionConfirmationMode(CONFIRM, { autonomyMode: 'plan' }, writeTool))
                .to.deep.equal({ deny: PLAN_MODE_DENIAL_REASON });
        });
    });
});
