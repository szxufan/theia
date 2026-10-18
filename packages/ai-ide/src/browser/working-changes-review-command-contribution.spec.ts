// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-v2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
let disableJSDOM = enableJSDOM();
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
try { FrontendApplicationConfigProvider.set({}); } catch { /* 已由其他 spec 设置 */ }

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { MessageService } from '@theia/core';
import { AICommandHandlerFactory } from '@theia/ai-core/lib/browser';
import { ChatService } from '@theia/ai-chat/lib/common';
import { ScmRepository } from '@theia/scm/lib/browser/scm-repository';
import { ScmService } from '@theia/scm/lib/browser/scm-service';
import { GetGitChangesTool } from './git-changes-tool';
import { WorkingChangesReviewerAgent } from './working-changes-reviewer-agent';
import { WorkingChangesReviewCommandContribution } from './working-changes-review-command-contribution';

// 与本包其他 browser spec 相同的模式：模块加载期用完即释放 jsdom
disableJSDOM();

describe('WorkingChangesReviewCommandContribution', () => {

    let contribution: WorkingChangesReviewCommandContribution;
    let executeCommand: () => Promise<unknown>;
    let messages: { type: string, text: string }[];
    let selectedRepository: ScmRepository | undefined;
    let workingDiff: string;
    let createdSessions: { agent?: unknown }[];
    let sentRequests: { sessionId: string, text: string }[];

    before(() => { disableJSDOM = enableJSDOM(); });
    after(() => { disableJSDOM(); });

    beforeEach(async () => {
        messages = [];
        selectedRepository = { provider: { rootUri: 'file:///work/repo' } } as unknown as ScmRepository;
        workingDiff = 'diff --git a/x.ts b/x.ts';
        createdSessions = [];
        sentRequests = [];

        const container = new Container();
        container.bind(GetGitChangesTool).toConstantValue({
            getWorkingTreeChanges: async () => workingDiff
        } as unknown as GetGitChangesTool);
        container.bind(ScmService).toConstantValue({
            get selectedRepository() { return selectedRepository; }
        } as unknown as ScmService);
        container.bind(MessageService).toConstantValue({
            info: (text: string) => { messages.push({ type: 'info', text }); },
            warn: (text: string) => { messages.push({ type: 'warn', text }); },
            error: (text: string) => { messages.push({ type: 'error', text }); }
        } as unknown as MessageService);
        container.bind(WorkingChangesReviewerAgent).toConstantValue({ id: 'working-changes-reviewer' } as unknown as WorkingChangesReviewerAgent);
        container.bind(ChatService).toConstantValue({
            createSession: (_location: unknown, _options: unknown, agent?: unknown) => {
                const session = { id: `session-${createdSessions.length}`, agent };
                createdSessions.push(session);
                return session;
            },
            sendRequest: async (sessionId: string, request: { text: string }) => {
                sentRequests.push({ sessionId, text: request.text });
                return undefined;
            }
        } as unknown as ChatService);
        container.bind(AICommandHandlerFactory).toConstantValue(
            (handler: { execute: () => Promise<unknown> }) => handler as never);
        container.bind(WorkingChangesReviewCommandContribution).toSelf();
        contribution = container.get(WorkingChangesReviewCommandContribution);

        const registry = {
            registerCommand: (_command: unknown, handler: { execute: () => Promise<unknown> }) => {
                executeCommand = () => handler.execute();
            }
        } as never as Parameters<WorkingChangesReviewCommandContribution['registerCommands']>[0];
        contribution.registerCommands(registry);
    });

    it('warns when no repository is selected and sends nothing', async () => {
        selectedRepository = undefined;
        await executeCommand();
        expect(messages).to.have.lengthOf(1);
        expect(messages[0].type).to.equal('warn');
        expect(sentRequests).to.be.empty;
    });

    it('informs when the working tree has no changes', async () => {
        workingDiff = '   ';
        await executeCommand();
        expect(messages[0].type).to.equal('info');
        expect(sentRequests).to.be.empty;
    });

    it('creates a reviewer session and sends the diff', async () => {
        await executeCommand();
        expect(createdSessions).to.have.lengthOf(1);
        expect((createdSessions[0].agent as { id: string }).id).to.equal('working-changes-reviewer');
        expect(sentRequests).to.have.lengthOf(1);
        expect(sentRequests[0].sessionId).to.equal('session-0');
        expect(sentRequests[0].text).to.include('未提交变更');
        expect(sentRequests[0].text).to.include('diff --git a/x.ts b/x.ts');
        expect(sentRequests[0].text).to.include('```diff');
    });

    it('notes truncation for oversized diffs', async () => {
        workingDiff = 'x'.repeat(120 * 1024);
        await executeCommand();
        expect(sentRequests[0].text).to.include('已截断');
        expect(sentRequests[0].text.length).to.be.lessThan(120 * 1024);
    });
});
