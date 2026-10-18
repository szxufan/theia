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

import { inject, injectable } from '@theia/core/shared/inversify';
import { generateUuid, nls, URI } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService, WorkspaceMetadataStorageService, WorkspaceMetadataStore } from '@theia/workspace/lib/browser';
import { WebServer } from '../common/web-protocol';

export const DOC_SET_METADATA_STORE_KEY = 'doc-set';

/** 单篇文档内容上限（字符）。 */
export const DOC_SET_MAX_DOC_CHARS = 64 * 1024;
/** 文档集总内容上限（字符），超出时拒绝新增。 */
export const DOC_SET_MAX_TOTAL_CHARS = 256 * 1024;

export interface DocSetEntry {
    title: string;
    /** URL 或本地路径（工作区相对或绝对）。 */
    source: string;
    /** 文档在文档集目录中的文件名。 */
    file: string;
    /** Epoch milliseconds. */
    addedAt: number;
    charCount: number;
}

export const DocSetService = Symbol('DocSetService');
export interface DocSetService {
    list(): Promise<DocSetEntry[]>;
    /** 抓取 URL 或读取本地文件，转存为文档集内的一篇 Markdown。失败抛出带中文说明的错误。 */
    add(source: string): Promise<DocSetEntry>;
    remove(title: string): Promise<boolean>;
    /** 读取文档内容（超过单篇上限时截断并注明）。 */
    readContent(entry: DocSetEntry): Promise<string | undefined>;
    /** 面向提示词的清单文本：标题 + 来源 + 简要说明。无文档时为空字符串。 */
    summaryText(): Promise<string>;
}

/**
 * Workspace-persistent set of reference documents (fetched URLs or local files, stored as
 * Markdown) that users can attach to chats via the `#docs` variable. Lives in the workspace
 * metadata store, next to the AI memory directory.
 */
@injectable()
export class DocSetServiceImpl implements DocSetService {

    @inject(WorkspaceMetadataStorageService)
    protected readonly metadataStorage: WorkspaceMetadataStorageService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(WebServer)
    protected readonly webServer: WebServer;

    protected async getDocsDir(): Promise<URI> {
        const store: WorkspaceMetadataStore = await this.metadataStorage.getOrCreateStore(DOC_SET_METADATA_STORE_KEY);
        await store.ensureExists();
        return store.location.resolve('docs');
    }

    protected async readIndex(docsDir: URI): Promise<DocSetEntry[]> {
        try {
            const raw = await this.fileService.read(docsDir.resolve('index.json'));
            return JSON.parse(raw.value) as DocSetEntry[];
        } catch {
            return [];
        }
    }

    protected async writeIndex(docsDir: URI, entries: DocSetEntry[]): Promise<void> {
        await this.fileService.createFolder(docsDir);
        await this.fileService.write(docsDir.resolve('index.json'), JSON.stringify(entries, undefined, 2));
    }

    async list(): Promise<DocSetEntry[]> {
        const docsDir = await this.getDocsDir();
        return this.readIndex(docsDir);
    }

    async add(source: string): Promise<DocSetEntry> {
        const trimmed = source.trim();
        if (!trimmed) {
            throw new Error(nls.localize('theia/ai/web/docSet/emptySource', '请输入文档的 URL 或本地文件路径。'));
        }
        const { content, title } = /^https?:\/\//i.test(trimmed)
            ? await this.fetchUrl(trimmed)
            : await this.readFile(trimmed);

        const docsDir = await this.getDocsDir();
        const entries = await this.readIndex(docsDir);
        if (entries.some(entry => entry.title === title)) {
            throw new Error(nls.localize('theia/ai/web/docSet/duplicate', '文档集中已存在同名文档「{0}」。', title));
        }
        const total = entries.reduce((sum, entry) => sum + entry.charCount, 0);
        if (total + content.length > DOC_SET_MAX_TOTAL_CHARS) {
            throw new Error(nls.localize('theia/ai/web/docSet/totalExceeded',
                '文档集总大小将超过 {0} 字符上限，请先删除部分文档。', String(DOC_SET_MAX_TOTAL_CHARS)));
        }

        const entry: DocSetEntry = {
            title,
            source: trimmed,
            file: `${this.toSlug(title)}.md`,
            addedAt: Date.now(),
            charCount: content.length
        };
        await this.fileService.createFolder(docsDir);
        await this.fileService.write(docsDir.resolve(entry.file), content);
        await this.writeIndex(docsDir, [...entries, entry]);
        return entry;
    }

    async remove(title: string): Promise<boolean> {
        const docsDir = await this.getDocsDir();
        const entries = await this.readIndex(docsDir);
        const entry = entries.find(candidate => candidate.title === title);
        if (!entry) {
            return false;
        }
        await this.fileService.delete(docsDir.resolve(entry.file)).catch(() => undefined);
        await this.writeIndex(docsDir, entries.filter(candidate => candidate.title !== title));
        return true;
    }

    async readContent(entry: DocSetEntry): Promise<string | undefined> {
        try {
            const docsDir = await this.getDocsDir();
            const content = (await this.fileService.read(docsDir.resolve(entry.file))).value;
            if (content.length <= DOC_SET_MAX_DOC_CHARS) {
                return content;
            }
            return content.substring(0, DOC_SET_MAX_DOC_CHARS)
                + '\n' + nls.localize('theia/ai/web/docSet/truncated', '（文档超过 {0} 字符，已截断）', String(DOC_SET_MAX_DOC_CHARS));
        } catch {
            return undefined;
        }
    }

    async summaryText(): Promise<string> {
        const entries = await this.list();
        if (entries.length === 0) {
            return '';
        }
        const lines = entries.map(entry => `- ${entry.title}（来源 ${entry.source}，${entry.charCount} 字符）`);
        return nls.localize('theia/ai/web/docSet/summaryHeader',
            '用户维护了一组参考文档，可在对话中通过 #docs:<标题> 引用其全文：\n{0}',
            lines.join('\n'));
    }

    protected async fetchUrl(url: string): Promise<{ content: string, title: string }> {
        const result = await this.webServer.fetch({ url, maxLength: DOC_SET_MAX_DOC_CHARS * 2 });
        if (result.error) {
            throw new Error(nls.localize('theia/ai/web/docSet/fetchFailed', '抓取 {0} 失败：{1}', url, result.error));
        }
        const content = result.content.slice(0, DOC_SET_MAX_DOC_CHARS);
        return { content, title: this.titleFromUrl(url) };
    }

    protected async readFile(path: string): Promise<{ content: string, title: string }> {
        let uri: URI | undefined;
        if (/^[a-zA-Z]+:/.test(path)) {
            uri = new URI(path);
        } else {
            const root = this.workspaceService.tryGetRoots()[0];
            if (!root) {
                throw new Error(nls.localize('theia/ai/web/docSet/noWorkspace',
                    '当前没有打开的工作区，无法解析相对路径「{0}」。', path));
            }
            uri = /^([a-zA-Z]:[\\/]|\/)/.test(path) ? new URI(path) : root.resource.resolve(path);
        }
        const content = (await this.fileService.read(uri).catch(error => {
            throw new Error(nls.localize('theia/ai/web/docSet/readFailed', '读取文件 {0} 失败：{1}', path, String(error)));
        })).value.slice(0, DOC_SET_MAX_DOC_CHARS);
        return { content, title: uri.path.base || path };
    }

    protected titleFromUrl(url: string): string {
        try {
            const parsed = new URL(url);
            const lastSegment = parsed.pathname.split('/').filter(Boolean).pop();
            return decodeURIComponent(lastSegment || parsed.hostname);
        } catch {
            return url;
        }
    }

    protected toSlug(title: string): string {
        const slug = title
            .toLowerCase()
            .replace(/\.[a-z0-9]+$/, '')
            .replace(/[^\p{L}\p{N}]+/gu, '-')
            .replace(/^-+|-+$/g, '');
        return `${slug || 'doc'}-${generateUuid().substring(0, 6)}`;
    }
}
