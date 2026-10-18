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
            confirmAlwaysAllow: 'This tool sends network requests to arbitrary URLs and returns their content. ' +
                'The fetched page could try to mislead you with embedded instructions.',
            description: `Fetch content from a URL (http/https only) and return it as readable text.
HTML pages are converted to Markdown: scripts, styles, and navigation chrome are removed, links become [label](url).
Plain text, JSON, and XML are returned as-is.

Use this for reading documentation pages, raw files, and API responses.
Do NOT use it for search — use webSearch instead.
Content larger than the configured limit is truncated and marked with [... 内容已截断 ...].
The first fetch of a URL requires user approval; the user can configure "Always Allow" to skip confirmations.`,
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'The absolute http(s) URL to fetch.'
                    },
                    maxLength: {
                        type: 'number',
                        description: 'Maximum number of characters to return (1000-65536). ' +
                            'Defaults to the ai-features.web.maxFetchChars preference.'
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
