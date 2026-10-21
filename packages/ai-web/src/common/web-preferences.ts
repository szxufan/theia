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

import { nls } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences';

export const WEB_MAX_FETCH_CHARS_PREFERENCE = 'ai-features.web.maxFetchChars';
export const WEB_FETCH_TIMEOUT_PREFERENCE = 'ai-features.web.fetchTimeoutMs';
export const WEB_SEARCH_PROVIDER_PREFERENCE = 'ai-features.web.search.provider';
export const WEB_SEARCH_BRAVE_API_KEY_PREFERENCE = 'ai-features.web.search.braveApiKey';
export const WEB_SEARCH_SEARX_URL_PREFERENCE = 'ai-features.web.search.searxUrl';

export type WebSearchProvider = 'duckduckgo' | 'brave' | 'searx';

export const webPreferences: PreferenceSchema = {
    properties: {
        [WEB_MAX_FETCH_CHARS_PREFERENCE]: {
            type: 'number',
            default: 16384,
            description: nls.localize('theia/ai-web/maxFetchChars/description',
                'webFetch 工具单次返回内容的最大字符数（超出部分截断并标记）。'),
            title: nls.localize('theia/ai-web/maxFetchChars/title', '网页抓取最大字符数'),
        },
        [WEB_FETCH_TIMEOUT_PREFERENCE]: {
            type: 'number',
            default: 30000,
            description: nls.localize('theia/ai-web/fetchTimeout/description',
                'webFetch / webSearch 请求的超时时间（毫秒）。'),
            title: nls.localize('theia/ai-web/fetchTimeout/title', '网页请求超时'),
        },
        [WEB_SEARCH_PROVIDER_PREFERENCE]: {
            type: 'string',
            enum: ['duckduckgo', 'brave', 'searx'],
            default: 'duckduckgo',
            description: nls.localize('theia/ai-web/searchProvider/description',
                'webSearch 工具使用的搜索后端。duckduckgo 无需密钥；brave 需要 API 密钥；searx 需要自建实例地址。'),
            title: nls.localize('theia/ai-web/searchProvider/title', '网页搜索后端'),
        },
        [WEB_SEARCH_BRAVE_API_KEY_PREFERENCE]: {
            type: 'string',
            default: '',
            description: nls.localize('theia/ai-web/braveApiKey/description',
                'Brave Search API 密钥（仅当搜索后端选择 brave 时使用）。'),
            title: nls.localize('theia/ai-web/braveApiKey/title', 'Brave Search API 密钥'),
        },
        [WEB_SEARCH_SEARX_URL_PREFERENCE]: {
            type: 'string',
            default: '',
            description: nls.localize('theia/ai-web/searxUrl/description',
                'SearXNG 实例的基地址，例如 https://searx.example.org（仅当搜索后端选择 searx 时使用）。'),
            title: nls.localize('theia/ai-web/searxUrl/title', 'SearXNG 实例地址'),
        },
    }
};
