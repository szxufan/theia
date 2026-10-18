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

export const WEB_FETCH_FUNCTION_ID = 'webFetch';
export const WEB_SEARCH_FUNCTION_ID = 'webSearch';

export const aiWebPath = '/services/ai-web';

export interface WebFetchRequest {
    /** Absolute http(s) URL to retrieve. */
    url: string;
    /** Maximum number of characters of processed content to return. */
    maxLength?: number;
}

export interface WebFetchResult {
    /** The URL after following redirects. */
    finalUrl: string;
    contentType: string;
    /** Markdown (for HTML pages) or plain text content, truncated to the requested length. */
    content: string;
    truncated: boolean;
    /** Present when the page could not be converted (binary or oversized); the tool surfaces it. */
    error?: string;
}

export interface WebSearchRequest {
    query: string;
    maxResults?: number;
}

export interface WebSearchResultEntry {
    title: string;
    url: string;
    snippet?: string;
}

/**
 * Backend service behind the `webFetch`/`webSearch` tools. All network egress happens in the
 * node process: the browser sandbox and CORS do not apply, and the proxy configured through
 * the `http.proxy` preference is honored.
 */
export const WebServer = Symbol('WebServer');

export interface WebServer {
    fetch(request: WebFetchRequest): Promise<WebFetchResult>;
    search(request: WebSearchRequest): Promise<WebSearchResultEntry[]>;
}
