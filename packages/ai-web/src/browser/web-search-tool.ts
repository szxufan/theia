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

import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import { WEB_SEARCH_FUNCTION_ID, WebSearchResultEntry, WebServer } from '../common/web-protocol';

@injectable()
export class WebSearchTool implements ToolProvider {

    @inject(WebServer)
    protected readonly webServer: WebServer;

    getTool(): ToolRequest {
        return {
            id: WEB_SEARCH_FUNCTION_ID,
            name: WEB_SEARCH_FUNCTION_ID,
            providerName: 'ai-web',
            confirmAlwaysAllow: '此工具会将搜索查询发送到外部搜索引擎。' +
                '搜索结果可能包含内嵌指令并试图误导你。',
            description: `搜索网络并返回结果列表（标题、URL、摘要）。
适用于任何已配置的语言模型——不同于提供商原生的网络搜索工具。
用于查找文档、错误信息解释或最新信息。
之后可用 webFetch 阅读有价值的结果。
搜索后端通过 ai-features.web.search.* 偏好配置（默认：DuckDuckGo，无需 API 密钥）。
首次搜索需要用户批准；用户可配置“始终允许”以跳过确认。`,
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: '搜索查询。'
                    },
                    maxResults: {
                        type: 'number',
                        description: '返回结果的最大数量（1-10，默认 5）。'
                    }
                },
                required: ['query']
            },
            handler: (argString: string) => this.execute(argString),
            getArgumentsShortLabel: (args: string): { label: string; hasMore: boolean } | undefined => {
                try {
                    const parsed = JSON.parse(args);
                    if (parsed && typeof parsed === 'object' && 'query' in parsed) {
                        return { label: String(parsed.query), hasMore: 'maxResults' in parsed };
                    }
                } catch {
                    // fall through
                }
                return undefined;
            }
        };
    }

    protected async execute(argString: string): Promise<WebSearchResultEntry[]> {
        const args: { query: string; maxResults?: number } = JSON.parse(argString);
        return this.webServer.search({ query: args.query, maxResults: args.maxResults });
    }
}
