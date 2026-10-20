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
import { ShellCommandReviewService } from './shell-command-review-service';
import { DefaultShellCommandAnalyzer } from '../common/shell-command-analyzer';

disableJSDOM();

describe('ShellCommandReviewService', () => {

    let service: ShellCommandReviewService;
    let agentReview: sinon.SinonStub;
    let preferences: Record<string, unknown>;

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        service = new ShellCommandReviewService();
        agentReview = sinon.stub();
        preferences = {};
        (service as unknown as Record<string, unknown>).reviewAgent = { review: agentReview };
        (service as unknown as Record<string, unknown>).shellCommandAnalyzer = new DefaultShellCommandAnalyzer();
        (service as unknown as Record<string, unknown>).aiConfigurationService = {
            get: sinon.stub().callsFake((key: string, fallback?: unknown) => preferences[key] ?? fallback)
        };
    });

    it('skips the review entirely when the feature is disabled', async () => {
        preferences['ai-features.terminal.aiCommandReview.enabled'] = false;
        const result = await service.review('ls -la', '/tmp');
        expect(result).to.be.undefined;
        expect(agentReview.called).to.be.false;
    });

    it('auto-approves a safe, non-dangerous command by default', async () => {
        agentReview.resolves({ verdict: 'safe', purpose: '列出文件', risks: [] });
        const result = await service.review('ls -la', '/tmp');
        expect(result).to.deep.equal({ verdict: 'safe', purpose: '列出文件', risks: [], autoApprove: true });
    });

    it('never auto-approves a safe verdict on a command with dangerous patterns', async () => {
        agentReview.resolves({ verdict: 'safe', purpose: '回显内容', risks: [] });
        const result = await service.review('echo $(whoami)', '/tmp');
        expect(result?.verdict).to.equal('safe');
        expect(result?.autoApprove).to.be.false;
    });

    it('respects the autoApprove preference', async () => {
        preferences['ai-features.terminal.aiCommandReview.autoApprove'] = false;
        agentReview.resolves({ verdict: 'safe', purpose: '列出文件', risks: [] });
        const result = await service.review('ls -la', '/tmp');
        expect(result?.autoApprove).to.be.false;
    });

    it('does not auto-approve risky verdicts regardless of preferences', async () => {
        agentReview.resolves({ verdict: 'risky', purpose: '推送提交', risks: ['更新远端分支'] });
        const result = await service.review('git push', '/tmp');
        expect(result?.verdict).to.equal('risky');
        expect(result?.autoApprove).to.be.false;
    });

    it('passes the statically parsed sub-commands to the agent', async () => {
        agentReview.resolves({ verdict: 'risky', purpose: '安装依赖', risks: ['修改 node_modules'] });
        await service.review('npm install && npm test', '/tmp');
        expect(agentReview.calledOnce).to.be.true;
        const args = agentReview.firstCall.args as unknown[];
        expect(args[3]).to.deep.equal(['npm install', 'npm test']);
    });

    it('caches the model verdict for repeated commands', async () => {
        agentReview.resolves({ verdict: 'safe', purpose: '列出文件', risks: [] });
        await service.review('ls -la', '/tmp');
        await service.review('ls -la', '/tmp');
        expect(agentReview.calledOnce).to.be.true;
    });

    it('answers undefined when the agent cannot review', async () => {
        agentReview.resolves(undefined);
        const result = await service.review('ls -la', '/tmp');
        expect(result).to.be.undefined;
    });
});
