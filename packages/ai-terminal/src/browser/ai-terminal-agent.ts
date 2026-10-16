// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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

import {
    Agent,
    getJsonOfResponse,
    isLanguageModelParsedResponse,
    LanguageModelRegistry,
    LanguageModelRequirement,
    PromptService,
    UserRequest
} from '@theia/ai-core/lib/common';
import { LanguageModelService } from '@theia/ai-core/lib/browser';
import { generateUuid, ILogger, nls } from '@theia/core';
import { terminalPrompts } from './ai-terminal-prompt-template';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { z } from 'zod';

const Commands = z.object({
    commands: z.array(z.string()),
});
type Commands = z.infer<typeof Commands>;

@injectable()
export class AiTerminalAgent implements Agent {

    id = 'Terminal Assistant';
    name = 'Terminal Assistant';
    description = nls.localize('theia/ai/terminal/agent/description', '此代理协助编写和执行任意终端命令。\
        根据用户的请求，它会建议命令，并允许用户直接将其粘贴到终端中执行。\
        它会访问当前目录、环境以及终端会话的最近输出，以提供具备上下文感知的协助');
    variables = [];
    functions = [];
    agentSpecificVariables = [
        {
            name: 'userRequest',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/agent/vars/userRequest/description', '用户的问题或请求。')
        },
        {
            name: 'shell',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/agent/vars/shell/description', '正在使用的 shell，例如 /usr/bin/zsh。')
        },
        {
            name: 'cwd',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/agent/vars/cwd/description', '当前工作目录。')
        },
        {
            name: 'recentTerminalContents',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/agent/vars/recentTerminalContents/description', '终端中可见的最近 0 到 50 行内容。')
        }
    ];
    prompts = terminalPrompts;
    languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'suggest-terminal-commands',
            identifier: 'default/universal',
        }
    ];

    @inject(LanguageModelRegistry)
    protected languageModelRegistry: LanguageModelRegistry;

    @inject(PromptService)
    protected promptService: PromptService;

    @inject(ILogger) @named('ai-terminal:AiTerminalAgent')
    protected logger: ILogger;

    @inject(LanguageModelService)
    protected languageModelService: LanguageModelService;

    async getCommands(
        userRequest: string,
        cwd: string,
        shell: string,
        recentTerminalContents: string[],
    ): Promise<string[]> {
        const lm = await this.languageModelRegistry.selectLanguageModel({
            agent: this.id,
            ...this.languageModelRequirements[0]
        });
        if (!lm) {
            this.logger.error('No language model available for the AI Terminal Agent.');
            return [];
        }

        const parameters = {
            userRequest,
            shell,
            cwd,
            recentTerminalContents
        };

        const systemMessage = await this.promptService.getResolvedPromptFragment('terminal-system', parameters).then(p => p?.text);
        const request = await this.promptService.getResolvedPromptFragment('terminal-user', parameters).then(p => p?.text);
        if (!systemMessage || !request) {
            this.logger.error('The prompt service didn\'t return prompts for the AI Terminal Agent.');
            return [];
        }

        const variantInfo = this.promptService.getPromptVariantInfo('terminal-system');

        // since we do not actually hold complete conversions, the request/response pair is considered a session
        const sessionId = generateUuid();
        const requestId = generateUuid();
        const llmRequest: UserRequest = {
            messages: [
                {
                    actor: 'ai',
                    type: 'text',
                    text: systemMessage
                },
                {
                    actor: 'user',
                    type: 'text',
                    text: request
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'terminal-commands',
                    description: 'Suggested terminal commands based on the user request',
                    schema: Commands.toJSONSchema()
                }
            },
            agentId: this.id,
            requestId,
            sessionId,
            promptVariantId: variantInfo?.variantId,
            isPromptVariantCustomized: variantInfo?.isCustomized
        };

        try {
            const result = await this.languageModelService.sendRequest(lm, llmRequest);

            if (isLanguageModelParsedResponse(result)) {
                // model returned structured output
                const parsedResult = Commands.safeParse(result.parsed);
                if (parsedResult.success) {
                    return parsedResult.data.commands;
                }
            }

            // fall back to agent-based parsing of result
            const jsonResult = await getJsonOfResponse(result);
            const parsedJsonResult = Commands.safeParse(jsonResult);
            if (parsedJsonResult.success) {
                return parsedJsonResult.data.commands;
            }

            return [];

        } catch (error) {
            this.logger.error('Error obtaining the command suggestions.', error);
            return [];
        }
    }

}
