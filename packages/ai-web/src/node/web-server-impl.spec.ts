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

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { PreferenceService } from '@theia/core/lib/common/preferences';
import { RequestService } from '@theia/core/shared/@theia/request';
import { WebServer } from '../common/web-protocol';
import { WebServerImpl } from './web-server-impl';

describe('WebServerImpl', () => {

    let server: WebServer;
    let response: { status: number; contentType: string; body: string; finalUrl?: string };
    let requestedUrls: string[];

    beforeEach(() => {
        response = { status: 200, contentType: 'text/html; charset=utf-8', body: '<html><body><p>hello</p></body></html>' };
        requestedUrls = [];

        const requestService = {
            request: async (options: { url: string }) => {
                requestedUrls.push(options.url);
                return {
                    url: response.finalUrl ?? options.url,
                    res: { statusCode: response.status, headers: { 'content-type': response.contentType } },
                    buffer: Buffer.from(response.body, 'utf8')
                };
            }
        } as unknown as RequestService;

        const container = new Container();
        container.bind(RequestService).toConstantValue(requestService);
        container.bind(PreferenceService).toConstantValue({
            get: (_name: string, defaultValue: unknown) => defaultValue
        } as unknown as PreferenceService);
        container.bind(ILogger).toConstantValue({ debug: () => { }, info: () => { }, warn: () => { }, error: () => { } } as unknown as ILogger);
        container.bind(WebServerImpl).toSelf();
        server = container.get(WebServerImpl);
    });

    it('fetches an HTML page and converts it to markdown', async () => {
        const result = await server.fetch({ url: 'https://example.com/page' });
        expect(result.content).to.equal('hello');
        expect(result.finalUrl).to.equal('https://example.com/page');
        expect(result.truncated).to.be.false;
    });

    it('reports the final URL after redirects', async () => {
        response.finalUrl = 'https://example.com/final';
        const result = await server.fetch({ url: 'https://example.com/redirect' });
        expect(result.finalUrl).to.equal('https://example.com/final');
    });

    it('truncates long content and marks the cut', async () => {
        response.body = `<html><body><p>${'x'.repeat(5000)}</p></body></html>`;
        const result = await server.fetch({ url: 'https://example.com/big', maxLength: 1000 });
        expect(result.truncated).to.be.true;
        expect(result.content).to.contain('已截断');
        expect(result.content.length).to.be.lessThan(1200);
    });

    it('returns plain text and JSON without conversion', async () => {
        response.contentType = 'application/json';
        response.body = '{"a": 1}';
        expect((await server.fetch({ url: 'https://example.com/data.json' })).content).to.equal('{"a": 1}');
    });

    it('rejects non-http schemes', async () => {
        let error: unknown;
        try {
            await server.fetch({ url: 'file:///etc/passwd' });
        } catch (e) {
            error = e;
        }
        expect(error?.toString?.()).to.contain('http');
        try {
            error = undefined;
            await server.fetch({ url: 'not a url' });
        } catch (e) {
            error = e;
        }
        expect(error).to.be.an('error');
    });

    it('surfaces HTTP errors', async () => {
        response.status = 404;
        let error: unknown;
        try {
            await server.fetch({ url: 'https://example.com/missing' });
        } catch (e) {
            error = e;
        }
        expect(error?.toString?.()).to.contain('404');
    });

    it('parses DuckDuckGo results and unwraps redirect URLs', async () => {
        response.contentType = 'text/html';
        response.body = `
        <html><body>
        <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org%2Fdocs&rut=abc">Example Docs &amp; Guide</a>
        <a class="result__snippet" href="#">The <b>official</b> documentation page</a>
        <a rel="nofollow" class="result__a" href="https://example.net/page">Plain Result</a>
        <a class="result__snippet" href="#">Second snippet</a>
        </body></html>`;
        const results = await server.search({ query: 'example' });
        expect(results).to.have.lengthOf(2);
        expect(results[0].url).to.equal('https://example.org/docs');
        expect(results[0].title).to.equal('Example Docs & Guide');
        expect(results[0].snippet).to.equal('The official documentation page');
        expect(results[1].url).to.equal('https://example.net/page');
    });

    it('sends the encoded query to the configured backend', async () => {
        await server.search({ query: 'theia ide' });
        expect(requestedUrls[0]).to.contain('https://html.duckduckgo.com/html/?q=');
    });
});
