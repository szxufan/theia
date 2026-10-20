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
import { CancellationToken } from '@theia/core/lib/common/cancellation';
import { ToolRequest } from '@theia/ai-core';
import { FrontendChatToolRequestService } from './chat-tool-request-service';
import { MutableChatRequestModel, ToolCallChatResponseContent } from '../common/chat-model';
import { ToolCallReview, ToolCallReviewer } from '../common/tool-call-reviewer';

disableJSDOM();

describe('FrontendChatToolRequestService tool call review', () => {

    let service: FrontendChatToolRequestService;
    let reviewer: { canReview: sinon.SinonStub; review: sinon.SinonStub };
    let content: { finished: boolean; isAwaitingUserConfirmation: boolean; updateResult: sinon.SinonStub; confirm: sinon.SinonStub };
    const toolRequest = { id: 'shellExecute' } as ToolRequest;
    const args = '{"action":"execute","command":"npm test"}';

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        service = new FrontendChatToolRequestService();
        reviewer = { canReview: sinon.stub().returns(true), review: sinon.stub() };
        content = {
            finished: false,
            isAwaitingUserConfirmation: true,
            updateResult: sinon.stub(),
            confirm: sinon.stub()
        };
        (service as unknown as Record<string, unknown>).logger = { warn: sinon.stub(), error: sinon.stub() };
        (service as unknown as Record<string, unknown>).toolCallReviewers = {
            getContributions: () => [reviewer as unknown as ToolCallReviewer]
        };
    });

    /** Calls the protected review hook with the current mocks, running in the given permission mode. */
    async function runReview(permissionMode: 'confirm' | 'autonomous' | 'full' = 'autonomous'): Promise<void> {
        const request = {
            response: { cancellationToken: CancellationToken.None },
            session: { settings: { commonSettings: { permissionMode } } }
        } as unknown as MutableChatRequestModel;
        await (service as unknown as {
            runToolCallReview: (t: ToolRequest, a: string, r: MutableChatRequestModel, c: ToolCallChatResponseContent) => Promise<void>;
        }).runToolCallReview(toolRequest, args, request, content as unknown as ToolCallChatResponseContent);
    }

    it('does nothing when no reviewer matches', async () => {
        reviewer.canReview.returns(false);
        await runReview();
        expect(reviewer.review.called).to.be.false;
        expect(content.updateResult.called).to.be.false;
        expect(content.confirm.called).to.be.false;
    });

    it('confirms without user interaction on a safe verdict with autoApprove in autonomous mode', async () => {
        const review: ToolCallReview = { verdict: 'safe', purpose: '运行测试', risks: [], autoApprove: true };
        reviewer.review.resolves(review);
        await runReview('autonomous');

        expect(reviewer.review.calledOnce).to.be.true;
        expect(content.confirm.calledOnce).to.be.true;
        // Only the pending indicator was written; no done payload since the card disappears.
        expect(content.updateResult.calledOnce).to.be.true;
        expect((content.updateResult.firstCall.args as unknown[])[0]).to.deep.equal({ aiReview: { status: 'pending' } });
    });

    it('only annotates a safe autoApprove verdict in confirm mode — the user must click', async () => {
        const review: ToolCallReview = { verdict: 'safe', purpose: '运行测试', risks: [], autoApprove: true };
        reviewer.review.resolves(review);
        await runReview('confirm');

        expect(content.confirm.called).to.be.false;
        expect(content.updateResult.calledTwice).to.be.true;
        expect((content.updateResult.secondCall.args as unknown[])[0]).to.deep.equal({
            aiReview: { status: 'done', verdict: 'safe', purpose: '运行测试', risks: [] }
        });
    });

    it('annotates the confirmation with a risky verdict instead of confirming', async () => {
        const review: ToolCallReview = { verdict: 'risky', purpose: '推送提交', risks: ['更新远端分支'], autoApprove: false };
        reviewer.review.resolves(review);
        await runReview();

        expect(content.confirm.called).to.be.false;
        expect(content.updateResult.calledTwice).to.be.true;
        expect((content.updateResult.secondCall.args as unknown[])[0]).to.deep.equal({
            aiReview: { status: 'done', verdict: 'risky', purpose: '推送提交', risks: ['更新远端分支'] }
        });
    });

    it('keeps a safe verdict on the confirmation UI when autoApprove is false', async () => {
        reviewer.review.resolves({ verdict: 'safe', purpose: '列出文件', risks: [], autoApprove: false });
        await runReview();
        expect(content.confirm.called).to.be.false;
        expect(content.updateResult.calledTwice).to.be.true;
    });

    it('clears the pending indicator when the review has no result', async () => {
        reviewer.review.resolves(undefined);
        await runReview();
        expect(content.confirm.called).to.be.false;
        expect(content.updateResult.calledTwice).to.be.true;
        expect((content.updateResult.secondCall.args as unknown[])[0]).to.be.undefined;
    });

    it('survives a rejecting reviewer', async () => {
        reviewer.review.rejects(new Error('provider down'));
        await runReview();
        expect(content.confirm.called).to.be.false;
        expect((content.updateResult.secondCall.args as unknown[])[0]).to.be.undefined;
    });

    it('never confirms a tool call that already finished while the review ran', async () => {
        let resolveReview: (value: ToolCallReview | undefined) => void = () => undefined;
        reviewer.review.returns(new Promise<ToolCallReview | undefined>(resolve => { resolveReview = resolve; }));
        const pending = runReview();
        content.finished = true; // user denied or the request was canceled in the meantime
        resolveReview({ verdict: 'safe', purpose: '列出文件', risks: [], autoApprove: true });
        await pending;
        expect(content.confirm.called).to.be.false;
        expect(content.updateResult.calledOnce).to.be.true; // pending only, no done payload
    });

    it('survives a canReview hook that throws', async () => {
        reviewer.canReview.throws(new Error('bad args'));
        await runReview();
        expect(reviewer.review.called).to.be.false;
        expect(content.updateResult.called).to.be.false;
    });
});
