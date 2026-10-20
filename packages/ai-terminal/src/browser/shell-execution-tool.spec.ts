// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses as set forth in such availability conditions are set forth in the
// Eclipse Public License v. 2.0 are satisfied: GNU General Public License,
// version 2 with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
let disableJSDOM = enableJSDOM();
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import {
    ShellExecutionRequest,
    ShellExecutionResult,
    ShellExecutionServer,
    OutputReadOptions,
    ShellOutputReadResult
} from '../common/shell-execution-server';
import { ShellCommandPermissionService } from './shell-command-permission-service';
import { ShellExecutionTool } from './shell-execution-tool';

disableJSDOM();

function createResult(overrides: Partial<ShellExecutionResult> = {}): ShellExecutionResult {
    return {
        success: true,
        exitCode: 0,
        stdout: 'hello\n',
        stderr: '',
        duration: 5,
        ...overrides
    };
}

function createReadResult(overrides: Partial<ShellOutputReadResult> = {}): ShellOutputReadResult {
    return {
        output: '1| hello',
        totalLines: 1,
        startLine: 1,
        endLine: 1,
        hasMore: false,
        ...overrides
    };
}

describe('ShellExecutionTool', () => {

    let container: Container;
    let shellServer: {
        execute: sinon.SinonStub;
        cancel: sinon.SinonStub;
        readResult: sinon.SinonStub;
    };
    let permissionService: { checkCommand: sinon.SinonStub };
    let tool: ShellExecutionTool;

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        container = new Container();
        shellServer = {
            execute: sinon.stub().callsFake(async (request: ShellExecutionRequest) =>
                createResult({ totalLines: 300, truncated: true })),
            cancel: sinon.stub().resolves(true),
            readResult: sinon.stub().resolves(createReadResult())
        };
        permissionService = {
            checkCommand: sinon.stub().returns({ allowed: false, reason: 'not-allowed' })
        };
        const workspaceService: Partial<WorkspaceService> = {
            tryGetRoots: () => [{
                resource: new URI('file:///workspace'),
                isFile: false,
                isDirectory: true,
                isSymbolicLink: false,
                isReadonly: false,
                name: 'workspace'
            }]
        };
        container.bind(ShellExecutionServer).toConstantValue(shellServer as unknown as ShellExecutionServer);
        container.bind(ShellCommandPermissionService).toConstantValue(permissionService as unknown as ShellCommandPermissionService);
        container.bind(WorkspaceService).toConstantValue(workspaceService as WorkspaceService);
        container.bind(ShellExecutionTool).toSelf();
        tool = container.get(ShellExecutionTool);
    });

    describe('execute action', () => {

        it('runs the command through the server and passes the read metadata through', async () => {
            const request = tool.getTool();
            const result = await request.handler(
                JSON.stringify({ action: 'execute', command: 'npm test', description: 'Run tests' })) as {
                    success: boolean; resultId: string; totalLines: number; truncated: boolean; hint: string;
                };
            expect(shellServer.execute.calledOnce).to.be.true;
            const arg = shellServer.execute.firstCall.args[0] as ShellExecutionRequest;
            expect(arg.command).to.equal('npm test');
            // URI.fsPath() uses the platform-native separator; normalize for platform-agnostic assertions.
            expect(arg.cwd?.replace(/\\/g, '/')).to.equal('/workspace');
            expect(result.success).to.be.true;
            // resultId is the executionId generated for this call and sent to the server.
            expect(result.resultId).to.equal(arg.executionId);
            expect(result.totalLines).to.equal(300);
            expect(result.truncated).to.be.true;
            expect(result.hint).to.contain(result.resultId);
        });

        it('is the default action when only a command is given', async () => {
            const request = tool.getTool();
            await request.handler(JSON.stringify({ command: 'git status', description: 'Show working tree status' }));
            expect(shellServer.execute.calledOnce).to.be.true;
        });

        it('answers with an error object when the command is missing', async () => {
            const request = tool.getTool();
            const result = await request.handler(JSON.stringify({ action: 'execute' })) as { error: string };
            expect(result.error).to.contain('command');
            expect(shellServer.execute.called).to.be.false;
        });
    });

    describe('read action', () => {

        it('forwards the read options to ShellExecutionServer.readResult', async () => {
            const request = tool.getTool();
            const args = { action: 'read', resultId: 'abc', filter: 'error', tail: 20 };
            const result = await request.handler(JSON.stringify(args)) as ShellOutputReadResult;
            expect(shellServer.readResult.calledOnce).to.be.true;
            const [resultId, passedOptions] = shellServer.readResult.firstCall.args as [string, OutputReadOptions];
            expect(resultId).to.equal('abc');
            expect(passedOptions.filter).to.equal('error');
            expect(passedOptions.tail).to.equal(20);
            expect(passedOptions.head).to.be.undefined;
            expect(result.output).to.equal('1| hello');
        });

        it('is inferred when only a resultId is given', async () => {
            const request = tool.getTool();
            await request.handler(JSON.stringify({ resultId: 'xyz' }));
            expect(shellServer.readResult.calledOnce).to.be.true;
            expect(shellServer.execute.called).to.be.false;
        });

        it('answers with an error object when the resultId is missing', async () => {
            const request = tool.getTool();
            const result = await request.handler(JSON.stringify({ action: 'read' })) as { error: string };
            expect(result.error).to.contain('resultId');
            expect(shellServer.readResult.called).to.be.false;
        });
    });

    describe('checkAutoAction', () => {

        it('auto-allows read actions without consulting the permission service', () => {
            const request = tool.getTool();
            const outcome = request.checkAutoAction!(JSON.stringify({ action: 'read', resultId: 'abc' }));
            expect(outcome).to.deep.equal({ action: 'allow' });
            expect(permissionService.checkCommand.called).to.be.false;
        });

        it('allows execute when every sub-command is allowlisted', () => {
            permissionService.checkCommand.returns({ allowed: true });
            const request = tool.getTool();
            const outcome = request.checkAutoAction!(JSON.stringify({ action: 'execute', command: 'git status' }));
            expect(outcome).to.deep.equal({ action: 'allow' });
        });

        it('denies execute when a denylist pattern matches', () => {
            permissionService.checkCommand.returns({ allowed: false, reason: 'denied', matchedPattern: 'rm -rf *' });
            const request = tool.getTool();
            const outcome = request.checkAutoAction!(JSON.stringify({ action: 'execute', command: 'rm -rf /' }));
            expect(outcome).to.have.property('action', 'deny');
        });

        it('asks for confirmation otherwise', () => {
            const request = tool.getTool();
            const outcome = request.checkAutoAction!(JSON.stringify({ action: 'execute', command: 'npm test' }));
            expect(outcome).to.be.undefined;
        });
    });

    describe('getArgumentsShortLabel', () => {

        it('labels execute calls with the command and read calls with the result id and options', () => {
            const request = tool.getTool();
            const executeLabel = request.getArgumentsShortLabel!(JSON.stringify({ action: 'execute', command: 'npm test' }));
            expect(executeLabel?.label).to.equal('execute: npm test');
            const readLabel = request.getArgumentsShortLabel!(JSON.stringify({ action: 'read', resultId: 'abc', filter: 'error', tail: 3 }));
            expect(readLabel?.label).to.contain('read: abc');
            expect(readLabel?.label).to.contain('filter');
            expect(readLabel?.label).to.contain('tail');
        });
    });
});
