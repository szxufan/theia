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
import { WEB_FETCH_FUNCTION_ID, WebFetchResult, WebServer } from '../common/web-protocol';

@injectable()
export class WebFetchTool implements ToolProvider {

    @inject(WebServer)
    protected readonly webServer: WebServer;

    getTool(): ToolRequest {
        return {
            id: WEB_FETCH_FUNCTION_ID,
            name: WEB_FETCH_FUNCTION_ID,
            providerName: 'ai-web',
            confirmAlwaysAllow: '此工具会向任意 URL 发送网络请求并返回其内容。' +
                '抓取到的页面可能包含内嵌指令并试图误导你。',
            description: `抓取 URL（仅限 http/https）的内容并返回可读文本。
HTML 页面会转换为 Markdown：脚本、样式和导航元素会被移除，链接变为 [label](url)。
纯文本、JSON 和 XML 原样返回。

用于阅读文档页面、原始文件和 API 响应。
不要用它做搜索——请改用 webSearch。
超过配置上限的内容会被截断并标记 [... 内容已截断 ...]。
首次抓取某个 URL 需要用户批准；用户可配置“始终允许”以跳过确认。`,
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: '要抓取的绝对 http(s) URL。'
                    },
                    maxLength: {
                        type: 'number',
                        description: '返回的最大字符数（1000-65536）。' +
                            '默认取 ai-features.web.maxFetchChars 偏好值。'
                    }
                },
                required: ['url']
            },
            handler: (argString: string) => this.execute(argString),
            getArgumentsShortLabel: (args: string): { label: string; hasMore: boolean } | undefined => {
                try {
                    const parsed = JSON.parse(args);
                    if (parsed && typeof parsed === 'object' && 'url' in parsed) {
                        return { label: String(parsed.url), hasMore: 'maxLength' in parsed };
                    }
                } catch {
                    // fall through
                }
                return undefined;
            }
        };
    }

    protected async execute(argString: string): Promise<WebFetchResult> {
        const args: { url: string; maxLength?: number } = JSON.parse(argString);
        return this.webServer.fetch({ url: args.url, maxLength: args.maxLength });
    }
}
