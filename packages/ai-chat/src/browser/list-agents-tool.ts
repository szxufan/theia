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
import { AGENT_DELEGATION_FUNCTION_ID, LIST_AGENTS_FUNCTION_ID, listByKeywords, ToolProvider, ToolRequest } from '@theia/ai-core';
import { ChatAgentService, ChatAgentServiceFactory } from '../common';

@injectable()
export class ListAgentsTool implements ToolProvider {
    static ID = LIST_AGENTS_FUNCTION_ID;

    @inject(ChatAgentServiceFactory)
    protected readonly getChatAgentService: () => ChatAgentService;

    getTool(): ToolRequest {
        return {
            id: ListAgentsTool.ID,
            name: ListAgentsTool.ID,
            description: `列出可通过 ${AGENT_DELEGATION_FUNCTION_ID} 委派的代理，每行一个，格式为“- <agentId>: <description>”。` +
                '委派前先调用此工具，挑选描述最契合任务的代理。' +
                '传入包含少量关键词的 query，只返回 id 或描述匹配任一关键词的代理，最匹配的排在最前。' +
                '省略 query 则列出全部代理，在比较候选代理时这是更稳妥的选择。',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: '可选的空格分隔关键词，与代理 id 和描述做不区分大小写的匹配（如 \'review test\'）'
                    }
                },
                required: []
            },
            handler: (arg_string: string) => this.listAgents(arg_string)
        };
    }

    protected async listAgents(arg_string: string): Promise<string> {
        const query: unknown = arg_string ? JSON.parse(arg_string).query : undefined;
        const keywords = typeof query === 'string' ? query.trim() : '';
        const entries = this.getChatAgentService().getAgents().map(agent => ({ name: agent.id, description: agent.description }));
        return listByKeywords(entries, keywords) ?? (keywords
            ? `No agent matches '${keywords}'. Retry with other keywords or without a query to list all agents.`
            : 'No agents available.');
    }
}
