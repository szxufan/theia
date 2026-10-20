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
import { CommandReviewAgent } from './command-review-agent';

disableJSDOM();

describe('CommandReviewAgent', () => {

    let agent: CommandReviewAgent;
    let sendRequest: sinon.SinonStub;

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        agent = new CommandReviewAgent();
        sendRequest = sinon.stub();
        (agent as unknown as Record<string, unknown>).languageModelRegistry = {
            selectLanguageModel: sinon.stub().resolves({ id: 'test-model' })
        };
        (agent as unknown as Record<string, unknown>).promptService = {
            getResolvedPromptFragment: sinon.stub().resolves({ text: 'prompt' }),
            getPromptVariantInfo: sinon.stub().returns(undefined)
        };
        (agent as unknown as Record<string, unknown>).languageModelService = { sendRequest };
        (agent as unknown as Record<string, unknown>).logger = { warn: sinon.stub(), error: sinon.stub() };
    });

    it('declares the agent metadata without chat capability', () => {
        expect(agent.id).to.equal('Command Review');
        expect(agent.name).to.equal('Command Review');
        expect(agent.displayName).to.equal('命令审查');
        expect(agent.functions).to.be.empty;
        expect(agent.languageModelRequirements[0].purpose).to.equal('command-review');
    });

    it('parses a structured response', async () => {
        sendRequest.resolves({
            parsed: { verdict: 'safe', purpose: '列出当前目录内容', risks: [] },
            content: []
        });
        const result = await agent.review('ls -la', 'bash', '/tmp', ['ls -la']);
        expect(result).to.deep.equal({ verdict: 'safe', purpose: '列出当前目录内容', risks: [] });
    });

    it('falls back to parsing a textual JSON response', async () => {
        sendRequest.resolves({
            text: '{"verdict":"risky","purpose":"推送到远端仓库","risks":["会更新远端分支"]}'
        });
        const result = await agent.review('git push', 'bash', '/tmp', ['git push']);
        expect(result).to.deep.equal({ verdict: 'risky', purpose: '推送到远端仓库', risks: ['会更新远端分支'] });
    });

    it('answers undefined when the response does not match the schema', async () => {
        sendRequest.resolves({ text: 'not json at all' });
        const result = await agent.review('ls', 'bash', '/tmp', ['ls']);
        expect(result).to.be.undefined;
    });

    it('answers undefined when no language model is available', async () => {
        (agent as unknown as Record<string, unknown>).languageModelRegistry = {
            selectLanguageModel: sinon.stub().resolves(undefined)
        };
        const result = await agent.review('ls', 'bash', '/tmp', ['ls']);
        expect(result).to.be.undefined;
        expect(sendRequest.called).to.be.false;
    });

    it('answers undefined when the request throws', async () => {
        sendRequest.rejects(new Error('provider down'));
        const result = await agent.review('ls', 'bash', '/tmp', ['ls']);
        expect(result).to.be.undefined;
    });

    it('answers undefined when prompts are missing', async () => {
        (agent as unknown as Record<string, unknown>).promptService = {
            getResolvedPromptFragment: sinon.stub().resolves(undefined),
            getPromptVariantInfo: sinon.stub().returns(undefined)
        };
        const result = await agent.review('ls', 'bash', '/tmp', ['ls']);
        expect(result).to.be.undefined;
        expect(sendRequest.called).to.be.false;
    });
});
