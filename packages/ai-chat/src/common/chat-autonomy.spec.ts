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

import { expect } from 'chai';
import { ToolConfirmationMode } from './chat-tool-preferences';
import { isMutatingToolId, resolveAutonomyConfirmationMode } from './chat-autonomy';

describe('chat autonomy', () => {

    describe('isMutatingToolId', () => {
        it('classifies write, shell, and task tools as mutating', () => {
            expect(isMutatingToolId('writeFileContent')).to.be.true;
            expect(isMutatingToolId('writeFileReplacements')).to.be.true;
            expect(isMutatingToolId('shellExecute')).to.be.true;
            expect(isMutatingToolId('runTask')).to.be.true;
        });
        it('classifies read and proposal tools as non-mutating', () => {
            expect(isMutatingToolId('getFileContent')).to.be.false;
            expect(isMutatingToolId('suggestFileContent')).to.be.false;
            expect(isMutatingToolId('searchInWorkspace')).to.be.false;
        });
    });

    describe('resolveAutonomyConfirmationMode', () => {
        const plainTool = { id: 'getFileContent' };
        const writeTool = { id: 'writeFileContent' };
        const highRiskTool = { id: 'shellExecute', confirmAlwaysAllow: 'full system access' };

        it('returns the preference mode unchanged by default', () => {
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.CONFIRM, undefined, writeTool))
                .to.equal(ToolConfirmationMode.CONFIRM);
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.CONFIRM, 'default', writeTool))
                .to.equal(ToolConfirmationMode.CONFIRM);
        });

        it('plan mode denies mutating tools with a reason', () => {
            const resolution = resolveAutonomyConfirmationMode(ToolConfirmationMode.CONFIRM, 'plan', writeTool);
            expect(resolution).to.have.property('deny');
        });

        it('plan mode leaves read tools and explicit denials alone', () => {
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.CONFIRM, 'plan', plainTool))
                .to.equal(ToolConfirmationMode.CONFIRM);
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.DISABLED, 'plan', writeTool))
                .to.equal(ToolConfirmationMode.DISABLED);
        });

        it('yolo auto-approves pending confirmations', () => {
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.CONFIRM, 'yolo', plainTool))
                .to.equal(ToolConfirmationMode.ALWAYS_ALLOW);
        });

        it('yolo keeps confirmation for tools flagged confirmAlwaysAllow', () => {
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.CONFIRM, 'yolo', highRiskTool))
                .to.equal(ToolConfirmationMode.CONFIRM);
        });

        it('yolo respects tools already disabled or allowed by preference', () => {
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.DISABLED, 'yolo', plainTool))
                .to.equal(ToolConfirmationMode.DISABLED);
            expect(resolveAutonomyConfirmationMode(ToolConfirmationMode.ALWAYS_ALLOW, 'yolo', plainTool))
                .to.equal(ToolConfirmationMode.ALWAYS_ALLOW);
        });
    });
});
