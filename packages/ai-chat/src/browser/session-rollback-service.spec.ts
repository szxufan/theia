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
enableJSDOM();
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { expect } from 'chai';
import { URI } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MutableChatModel, MutableChatRequestModel, ChatRequest } from '../common/chat-model';
import { ChangeSetElement, ChangeSetImpl } from '../common/change-set';
import { ChatService } from '../common/chat-service';
import { ParsedChatRequest, ParsedChatRequestTextPart } from '../common/parsed-chat-request';
import { ChangeSetFileService } from './change-set-file-service';
import { SessionRollbackServiceImpl } from './session-rollback-service';

function createParsedRequest(text: string): ParsedChatRequest {
    return {
        request: { text } as ChatRequest,
        parts: [new ParsedChatRequestTextPart({ start: 0, endExclusive: text.length }, text)],
        toolRequests: new Map(),
        variables: []
    };
}

function fileElement(path: string, type: 'add' | 'modify' | 'delete', original?: string): ChangeSetElement {
    const uri = new URI('file:///workspace/' + path);
    return {
        uri,
        type,
        state: 'applied',
        async getOriginalContent(): Promise<string | undefined> {
            return original;
        }
    } as unknown as ChangeSetElement;
}

describe('SessionRollbackServiceImpl', () => {

    let service: SessionRollbackServiceImpl;
    let model: MutableChatModel;
    let requests: MutableChatRequestModel[];
    let writeCalls: { uri: string, content: string }[];
    let deleteCalls: string[];
    let fileExists: (uri: URI) => boolean;

    beforeEach(() => {
        model = new MutableChatModel();
        writeCalls = [];
        deleteCalls = [];
        fileExists = () => true;

        const container = new Container();
        container.bind(ChatService).toConstantValue({
            getSession: (id: string) => id === 'session-1' ? { model } : undefined
        } as unknown as ChatService);
        container.bind(ChangeSetFileService).toConstantValue({
            write: async (uri: URI, content: string) => { writeCalls.push({ uri: uri.toString(), content }); },
            delete: async (uri: URI) => { deleteCalls.push(uri.toString()); }
        } as unknown as ChangeSetFileService);
        container.bind(FileService).toConstantValue({
            exists: async (uri: URI) => fileExists(uri)
        } as unknown as FileService);
        container.bind(SessionRollbackServiceImpl).toSelf();

        service = container.get(SessionRollbackServiceImpl);
        requests = [];
    });

    function addRequest(name: string, elements: ChangeSetElement[]): MutableChatRequestModel {
        const request = model.addRequest(createParsedRequest(name));
        if (elements.length > 0) {
            request.changeSet = new ChangeSetImpl(elements);
        }
        requests.push(request);
        return request;
    }

    it('returns undefined for an unknown session or request', async () => {
        addRequest('r1', [fileElement('a.txt', 'modify', 'old-a')]);
        expect(await service.createPlan('missing', requests[0].id)).to.be.undefined;
        expect(await service.createPlan('session-1', 'missing-id')).to.be.undefined;
    });

    it('collects add and modify entries from the target request onwards', async () => {
        addRequest('r1', []);
        addRequest('r2', [
            fileElement('a.txt', 'modify', 'old-a'),
            fileElement('new/b.ts', 'add')
        ]);

        const plan = await service.createPlan('session-1', requests[1].id);
        expect(plan).to.be.not.undefined;
        expect(plan!.entries.map(e => e.uri.path.base)).to.deep.equal(['a.txt', 'b.ts']);
        expect(plan!.entries[0].restoreContent).to.equal('old-a');
        expect(plan!.entries[1].restoreContent).to.be.undefined;
        expect(plan!.skipped).to.be.empty;
    });

    it('keeps the earliest original content when the same file was modified across requests', async () => {
        addRequest('r1', [fileElement('a.txt', 'modify', 'v1')]);
        addRequest('r2', [fileElement('a.txt', 'modify', 'v2')]);
        addRequest('r3', [fileElement('b.txt', 'add')]);

        // 回滚到 r1 之前：a.txt 恢复 v1（最早），b.txt 删除
        const plan = await service.createPlan('session-1', requests[0].id);
        expect(plan!.entries).to.have.lengthOf(2);
        expect(plan!.entries.find(e => e.uri.path.base === 'a.txt')!.restoreContent).to.equal('v1');

        // 回滚到 r2 之前：a.txt 恢复 v2（r2 是最早涉及它的目标内请求）
        const plan2 = await service.createPlan('session-1', requests[1].id);
        expect(plan2!.entries.find(e => e.uri.path.base === 'a.txt')!.restoreContent).to.equal('v2');
    });

    it('skips modified files whose original content is unknown', async () => {
        addRequest('r1', [
            fileElement('ok.txt', 'modify', 'old'),
            fileElement('unknown.txt', 'modify', undefined)
        ]);

        const plan = await service.createPlan('session-1', requests[0].id);
        expect(plan!.entries.map(e => e.uri.path.base)).to.deep.equal(['ok.txt']);
        expect(plan!.skipped.map(s => s.uri.path.base)).to.deep.equal(['unknown.txt']);
    });

    it('restores contents, deletes added files and removes the elements from the change sets', async () => {
        const r1 = addRequest('r1', [fileElement('a.txt', 'modify', 'old-a')]);
        addRequest('r2', [fileElement('b.ts', 'add')]);

        const plan = await service.createPlan('session-1', r1.id);
        const result = await service.executePlan(plan!);

        expect(result.restored).to.equal(1);
        expect(result.deleted).to.equal(1);
        expect(result.failed).to.be.empty;
        expect(writeCalls).to.deep.equal([{ uri: 'file:///workspace/a.txt', content: 'old-a' }]);
        expect(deleteCalls).to.deep.equal(['file:///workspace/b.ts']);
        expect(requests[0].changeSet!.getElements()).to.be.empty;
        expect(requests[1].changeSet!.getElements()).to.be.empty;
    });

    it('treats an added file that no longer exists as already rolled back', async () => {
        const r1 = addRequest('r1', [fileElement('gone.ts', 'add')]);
        fileExists = () => false;

        const plan = await service.createPlan('session-1', r1.id);
        const result = await service.executePlan(plan!);

        expect(result.deleted).to.equal(1);
        expect(deleteCalls).to.be.empty;
    });

    it('reports write failures without aborting the remaining entries', async () => {
        const r1 = addRequest('r1', [
            fileElement('bad.txt', 'modify', 'old-bad'),
            fileElement('good.txt', 'modify', 'old-good')
        ]);
        const container = new Container();
        container.bind(ChatService).toConstantValue({ getSession: () => ({ model }) } as unknown as ChatService);
        container.bind(ChangeSetFileService).toConstantValue({
            write: async (uri: URI, content: string) => {
                if (uri.path.base === 'bad.txt') {
                    throw new Error('EPERM');
                }
                writeCalls.push({ uri: uri.toString(), content });
            },
            delete: async () => { }
        } as unknown as ChangeSetFileService);
        container.bind(FileService).toConstantValue({ exists: async () => true } as unknown as FileService);
        container.bind(SessionRollbackServiceImpl).toSelf();
        const failingService = container.get(SessionRollbackServiceImpl);

        const plan = await failingService.createPlan('session-1', r1.id);
        const result = await failingService.executePlan(plan!);

        expect(result.restored).to.equal(1);
        expect(result.failed).to.have.lengthOf(1);
        expect(result.failed[0].uri.path.base).to.equal('bad.txt');
        expect(writeCalls.map(call => call.uri)).to.deep.equal(['file:///workspace/good.txt']);
    });
});
