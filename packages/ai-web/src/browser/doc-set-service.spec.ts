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
try { FrontendApplicationConfigProvider.set({}); } catch { /* 已由其他 spec 设置 */ }

import { expect } from 'chai';
import { URI } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService, WorkspaceMetadataStorageService } from '@theia/workspace/lib/browser';
import { WebServer } from '../common/web-protocol';
import { DocSetServiceImpl } from './doc-set-service';

async function expectRejection(promise: Promise<unknown>, messagePattern: RegExp): Promise<void> {
    try {
        await promise;
        expect.fail('预期操作会失败，但实际成功了');
    } catch (error) {
        expect(String(error)).to.match(messagePattern);
    }
}

describe('DocSetServiceImpl', () => {

    let service: DocSetServiceImpl;
    let files: Map<string, string>;
    let folders: Set<string>;
    let fetchResults: Map<string, string>;

    beforeEach(() => {
        files = new Map();
        folders = new Set();
        fetchResults = new Map();

        const container = new Container();
        const storeLocation = new URI('file:///metadata/doc-set');
        container.bind(WorkspaceMetadataStorageService).toConstantValue({
            getOrCreateStore: async () => ({
                location: storeLocation,
                ensureExists: async () => folders.add(storeLocation.toString())
            })
        } as unknown as WorkspaceMetadataStorageService);
        container.bind(WorkspaceService).toConstantValue({
            tryGetRoots: () => [{ resource: new URI('file:///workspace') }]
        } as unknown as WorkspaceService);
        container.bind(FileService).toConstantValue({
            read: async (uri: URI) => {
                const content = files.get(uri.toString());
                if (content === undefined) {
                    throw new Error('FileNotFound: ' + uri.toString());
                }
                return { value: content };
            },
            write: async (uri: URI, content: string) => {
                files.set(uri.toString(), content);
                return {};
            },
            createFolder: async (uri: URI) => {
                folders.add(uri.toString());
                return {};
            },
            delete: async (uri: URI) => {
                files.delete(uri.toString());
            }
        } as unknown as FileService);
        container.bind(WebServer).toConstantValue({
            fetch: async (request: { url: string }) => {
                const content = fetchResults.get(request.url);
                if (content === undefined) {
                    return { finalUrl: request.url, contentType: 'text/html', content: '', truncated: false, error: 'HTTP 404' };
                }
                return { finalUrl: request.url, contentType: 'text/html', content, truncated: false };
            },
            search: async () => []
        } as unknown as WebServer);
        container.bind(DocSetServiceImpl).toSelf();

        service = container.get(DocSetServiceImpl);
    });

    it('adds a fetched URL document as markdown and lists it', async () => {
        fetchResults.set('https://example.com/docs/guide.md', '# 指南\n正文');

        const entry = await service.add('https://example.com/docs/guide.md');
        expect(entry.title).to.equal('guide.md');
        expect(entry.charCount).to.equal('# 指南\n正文'.length);

        const list = await service.list();
        expect(list).to.have.lengthOf(1);
        expect(list[0].title).to.equal('guide.md');

        expect(await service.readContent(entry)).to.equal('# 指南\n正文');
    });

    it('adds a workspace-relative local file', async () => {
        files.set('file:///workspace/notes/design.md', '# 设计');

        const entry = await service.add('notes/design.md');
        expect(entry.title).to.equal('design.md');
        expect(await service.readContent(entry)).to.equal('# 设计');
    });

    it('rejects duplicate titles, empty sources and failed fetches', async () => {
        fetchResults.set('https://example.com/a.md', 'x');
        await service.add('https://example.com/a.md');

        await expectRejection(service.add('https://example.com/a.md'), /已存在同名文档/);
        await expectRejection(service.add('   '), /URL 或本地文件路径/);
        await expectRejection(service.add('https://example.com/missing.md'), /抓取/);
    });

    it('removes a document and its file', async () => {
        fetchResults.set('https://example.com/a.md', '内容');
        const entry = await service.add('https://example.com/a.md');

        expect(await service.remove(entry.title)).to.be.true;
        expect(await service.list()).to.be.empty;
        expect(files.get(`file:///metadata/doc-set/docs/${entry.file}`)).to.be.undefined;
        expect(await service.remove(entry.title)).to.be.false;
    });

    it('rejects additions beyond the total size budget', async () => {
        // 抓取路径会把单篇截断到 64K，用 4 篇满额文档逼近 256K 总额上限
        for (let i = 0; i < 4; i++) {
            fetchResults.set(`https://example.com/big-${i}.md`, 'x'.repeat(100 * 1024));
            await service.add(`https://example.com/big-${i}.md`);
        }

        fetchResults.set('https://example.com/too-much.md', 'y'.repeat(100 * 1024));
        await expectRejection(service.add('https://example.com/too-much.md'), /上限/);
    });

    it('truncates oversized documents when reading', async () => {
        fetchResults.set('https://example.com/huge.md', '短内容');
        const entry = await service.add('https://example.com/huge.md');
        // 直接改写存储的文件，模拟历史遗留的超大文档
        files.set(`file:///metadata/doc-set/docs/${entry.file}`, 'z'.repeat(70 * 1024));

        const content = await service.readContent(entry);
        expect(content!).to.include('已截断');
        expect(content!.length).to.be.lessThan(70 * 1024);
    });

    it('renders an empty summary without documents and a listing with them', async () => {
        expect(await service.summaryText()).to.equal('');

        fetchResults.set('https://example.com/a.md', '内容');
        await service.add('https://example.com/a.md');
        const summary = await service.summaryText();
        expect(summary).to.include('a.md');
        expect(summary).to.include('#docs');
    });
});
