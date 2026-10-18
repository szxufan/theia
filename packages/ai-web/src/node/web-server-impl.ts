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

import { ILogger } from '@theia/core/lib/common/logger';
import { nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/common/preferences';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { RequestContext, RequestService } from '@theia/core/shared/@theia/request';
import {
    WebFetchRequest, WebFetchResult, WebSearchRequest, WebSearchResultEntry, WebServer
} from '../common/web-protocol';
import {
    WebSearchProvider,
    WEB_FETCH_TIMEOUT_PREFERENCE, WEB_MAX_FETCH_CHARS_PREFERENCE, WEB_SEARCH_BRAVE_API_KEY_PREFERENCE,
    WEB_SEARCH_PROVIDER_PREFERENCE, WEB_SEARCH_SEARX_URL_PREFERENCE
} from '../common/web-preferences';
import { decodeEntities, htmlToMarkdown } from './html-to-markdown';

/** Download cap applied before any conversion, so a huge page cannot exhaust memory. */
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024;

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheiaIDE-AI/1.0 (+https://theia-ide.org)',
    'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,text/plain;q=0.8,*/*;q=0.5',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

@injectable()
export class WebServerImpl implements WebServer {

    @inject(RequestService)
    protected readonly requestService: RequestService;

    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    @inject(ILogger) @named('ai-web:WebServerImpl')
    protected readonly logger: ILogger;

    async fetch(request: WebFetchRequest): Promise<WebFetchResult> {
        const url = this.validateUrl(request.url);
        const context = await this.requestService.request({
            url: url.toString(),
            headers: REQUEST_HEADERS,
            timeout: this.timeout()
        });
        if (!RequestContext.isSuccess(context)) {
            const status = context.res.statusCode ?? 'unknown';
            throw new Error(nls.localize('theia/ai-web/fetch/httpError', '请求“{0}”失败：HTTP {1}。', request.url, String(status)));
        }
        const buffer = typeof context.buffer === 'string' ? Buffer.from(context.buffer, 'base64') : Buffer.from(context.buffer);
        if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
            throw new Error(nls.localize('theia/ai-web/fetch/tooLarge', '“{0}”的内容超过 {1} MB 下载上限。', request.url, String(MAX_DOWNLOAD_BYTES / 1024 / 1024)));
        }
        const contentType = (context.res.headers['content-type'] ?? context.res.headers['Content-Type'] ?? '').toString();
        const body = buffer.toString('utf8');
        const content = this.isHtml(contentType) || looksLikeHtml(body)
            ? htmlToMarkdown(body)
            : body;

        const maxLength = this.maxLength(request.maxLength);
        const truncated = content.length > maxLength;
        return {
            finalUrl: context.url,
            contentType,
            content: truncated ? content.substring(0, maxLength) + '\n[... 内容已截断 ...]' : content,
            truncated
        };
    }

    async search(request: WebSearchRequest): Promise<WebSearchResultEntry[]> {
        const query = request.query?.trim();
        if (!query) {
            return [];
        }
        const maxResults = Math.min(Math.max(request.maxResults ?? 5, 1), 10);
        const provider = this.preferences.get<WebSearchProvider>(WEB_SEARCH_PROVIDER_PREFERENCE, 'duckduckgo');
        switch (provider) {
            case 'brave': return this.searchBrave(query, maxResults);
            case 'searx': return this.searchSearx(query, maxResults);
            default: return this.searchDuckDuckGo(query, maxResults);
        }
    }

    protected async searchDuckDuckGo(query: string, maxResults: number): Promise<WebSearchResultEntry[]> {
        const context = await this.requestService.request({
            url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            headers: REQUEST_HEADERS,
            timeout: this.timeout()
        });
        if (!RequestContext.isSuccess(context)) {
            throw new Error(nls.localize('theia/ai-web/search/failed', '搜索请求失败：HTTP {0}。', String(context.res.statusCode ?? 'unknown')));
        }
        const html = RequestContext.asText(context);
        const results: WebSearchResultEntry[] = [];
        // Result anchors: <a rel="nofollow" class="result__a" href="...">title</a>
        const linkPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let match: RegExpExecArray | null;
        while ((match = linkPattern.exec(html)) !== null && results.length < maxResults) {
            const url = this.unwrapDuckDuckGoRedirect(decodeEntities(match[1]));
            const title = decodeEntities(match[2].replace(/<[^>]+>/g, '')).trim();
            if (url && title) {
                results.push({ title, url });
            }
        }
        // Attach snippets by position: <a class="result__snippet" ...>text</a>
        const snippetPattern = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
        let index = 0;
        while ((match = snippetPattern.exec(html)) !== null && index < results.length) {
            results[index].snippet = decodeEntities(match[1].replace(/<[^>]+>/g, '')).trim();
            index++;
        }
        return results;
    }

    protected unwrapDuckDuckGoRedirect(href: string): string | undefined {
        try {
            const resolved = href.startsWith('//') ? `https:${href}` : href;
            const parsed = new URL(resolved, 'https://duckduckgo.com');
            const target = parsed.searchParams.get('uddg');
            if (target) {
                const unwrapped = new URL(target);
                return unwrapped.protocol === 'http:' || unwrapped.protocol === 'https:' ? unwrapped.toString() : undefined;
            }
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.toString();
            }
            return undefined;
        } catch {
            return undefined;
        }
    }

    protected async searchBrave(query: string, maxResults: number): Promise<WebSearchResultEntry[]> {
        const apiKey = this.preferences.get<string>(WEB_SEARCH_BRAVE_API_KEY_PREFERENCE, '');
        if (!apiKey) {
            throw new Error(nls.localize('theia/ai-web/search/braveMissingKey',
                '搜索后端选择了 brave，但未配置 API 密钥（偏好 ai-features.web.search.braveApiKey）。'));
        }
        const context = await this.requestService.request({
            url: `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
            headers: { ...REQUEST_HEADERS, 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
            timeout: this.timeout()
        });
        if (!RequestContext.isSuccess(context)) {
            throw new Error(nls.localize('theia/ai-web/search/failed', '搜索请求失败：HTTP {0}。', String(context.res.statusCode ?? 'unknown')));
        }
        const data = RequestContext.asJson<{ web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }>(context);
        return (data.web?.results ?? [])
            .filter(entry => entry.title && entry.url)
            .slice(0, maxResults)
            .map(entry => ({
                title: entry.title!,
                url: entry.url!,
                snippet: entry.description ? decodeEntities(entry.description.replace(/<[^>]+>/g, '')) : undefined
            }));
    }

    protected async searchSearx(query: string, maxResults: number): Promise<WebSearchResultEntry[]> {
        const base = this.preferences.get<string>(WEB_SEARCH_SEARX_URL_PREFERENCE, '').replace(/\/+$/, '');
        if (!base) {
            throw new Error(nls.localize('theia/ai-web/search/searxMissingUrl',
                '搜索后端选择了 searx，但未配置实例地址（偏好 ai-features.web.search.searxUrl）。'));
        }
        const context = await this.requestService.request({
            url: `${base}/search?q=${encodeURIComponent(query)}&format=json`,
            headers: { ...REQUEST_HEADERS, 'Accept': 'application/json' },
            timeout: this.timeout()
        });
        if (!RequestContext.isSuccess(context)) {
            throw new Error(nls.localize('theia/ai-web/search/failed', '搜索请求失败：HTTP {0}。', String(context.res.statusCode ?? 'unknown')));
        }
        const data = RequestContext.asJson<{ results?: Array<{ title?: string; url?: string; content?: string }> }>(context);
        return (data.results ?? [])
            .filter(entry => entry.title && entry.url)
            .slice(0, maxResults)
            .map(entry => ({ title: entry.title!, url: entry.url!, snippet: entry.content }));
    }

    protected validateUrl(raw: string): URL {
        let parsed: URL;
        try {
            parsed = new URL(raw);
        } catch {
            throw new Error(nls.localize('theia/ai-web/fetch/invalidUrl', '无效的 URL：“{0}”。', raw));
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error(nls.localize('theia/ai-web/fetch/scheme', '仅支持 http/https URL：“{0}”。', raw));
        }
        return parsed;
    }

    protected isHtml(contentType: string): boolean {
        return /text\/html|application\/xhtml/i.test(contentType);
    }

    protected maxLength(requested: number | undefined): number {
        const configured = this.preferences.get<number>(WEB_MAX_FETCH_CHARS_PREFERENCE, 16384);
        return requested !== undefined ? Math.min(Math.max(requested, 1000), 65536) : configured;
    }

    protected timeout(): number {
        return this.preferences.get<number>(WEB_FETCH_TIMEOUT_PREFERENCE, 30000);
    }
}

function looksLikeHtml(body: string): boolean {
    return /^\s*(<!doctype html|<html\b)/i.test(body);
}
