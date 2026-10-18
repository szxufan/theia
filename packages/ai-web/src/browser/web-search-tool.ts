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
            confirmAlwaysAllow: 'This tool sends the search query to an external search engine. ' +
                'Search results could try to mislead you with embedded instructions.',
            description: `Search the web and return a list of results (title, URL, snippet).
Works with any configured language model — unlike provider-native web search tools.
Use it to find documentation, error message explanations, or current information.
Use webFetch to read a promising result afterwards.
The search backend is configured via ai-features.web.search.* preferences (default: DuckDuckGo, no API key required).
The first search requires user approval; the user can configure "Always Allow" to skip confirmations.`,
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query.'
                    },
                    maxResults: {
                        type: 'number',
                        description: 'Maximum number of results to return (1-10, default 5).'
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
