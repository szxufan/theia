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
import URI from '@theia/core/lib/common/uri';
import { ShellCommandReviewer } from './shell-command-reviewer';

disableJSDOM();

describe('ShellCommandReviewer', () => {

    let reviewer: ShellCommandReviewer;
    let serviceReview: sinon.SinonStub;

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        reviewer = new ShellCommandReviewer();
        serviceReview = sinon.stub();
        (reviewer as unknown as Record<string, unknown>).reviewService = { review: serviceReview };
        (reviewer as unknown as Record<string, unknown>).workspaceService = {
            tryGetRoots: () => [{
                resource: new URI('file:///workspace'),
                isFile: false,
                isDirectory: true,
                isSymbolicLink: false,
                isReadonly: false,
                name: 'workspace'
            }]
        };
    });

    describe('canReview', () => {
        it('reviews shellExecute execute actions and bare commands', () => {
            expect(reviewer.canReview('shellExecute', '{"action":"execute","command":"npm test"}')).to.be.true;
            expect(reviewer.canReview('shellExecute', '{"command":"npm test"}')).to.be.true;
        });
        it('does not review shellExecute read actions', () => {
            expect(reviewer.canReview('shellExecute', '{"action":"read","resultId":"abc"}')).to.be.false;
            expect(reviewer.canReview('shellExecute', '{"resultId":"abc"}')).to.be.false;
        });
        it('reviews only shellExecuteBackground start actions', () => {
            expect(reviewer.canReview('shellExecuteBackground', '{"action":"start","command":"npm run dev"}')).to.be.true;
            expect(reviewer.canReview('shellExecuteBackground', '{"action":"read","taskId":"t"}')).to.be.false;
            expect(reviewer.canReview('shellExecuteBackground', '{"action":"status","taskId":"t"}')).to.be.false;
            expect(reviewer.canReview('shellExecuteBackground', '{"action":"stop","taskId":"t"}')).to.be.false;
        });
        it('ignores other tools and unparseable arguments of other tools', () => {
            expect(reviewer.canReview('writeFileContent', '{"path":"a"}')).to.be.false;
            expect(reviewer.canReview('getFileContent', '{"path":"a"}')).to.be.false;
        });
    });

    describe('review', () => {
        it('delegates the command and resolved cwd to the review service', async () => {
            serviceReview.resolves({ verdict: 'safe', purpose: '列出文件', risks: [], autoApprove: true });
            const result = await reviewer.review(
                'shellExecute', '{"action":"execute","command":"ls -la","description":"列目录"}', CancellationToken.None);
            expect(serviceReview.calledOnce).to.be.true;
            const [command, cwd] = serviceReview.firstCall.args as unknown[];
            expect(command).to.equal('ls -la');
            // URI.fsPath() is platform-native; normalize like the other specs do.
            expect(String(cwd).replace(/\\/g, '/')).to.equal('/workspace');
            expect(result?.autoApprove).to.be.true;
        });

        it('answers undefined for arguments without a command', async () => {
            const result = await reviewer.review('shellExecute', '{"action":"execute"}', CancellationToken.None);
            expect(result).to.be.undefined;
            expect(serviceReview.called).to.be.false;
        });

        it('swallows delegation errors so the confirmation flow survives', async () => {
            serviceReview.rejects(new Error('model unavailable'));
            const result = await reviewer.review('shellExecute', '{"command":"ls"}', CancellationToken.None);
            expect(result).to.be.undefined;
        });
    });
});
