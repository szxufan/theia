// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses as set forth in such availability conditions are set forth in the
// Eclipse Public License v. 2.0 are satisfied: GNU General Public License,
// version 2 with the GNU Classpath Exception which is available at
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
import { CancellationToken, generateUuid, ILogger, nls } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { z } from 'zod';
import { commandReviewPrompts } from './command-review-prompt-template';

const CommandReview = z.object({
    verdict: z.enum(['safe', 'risky']),
    purpose: z.string(),
    risks: z.array(z.string())
});
export type CommandReviewResult = z.infer<typeof CommandReview>;

/**
 * Built-in non-chat agent that reviews a shell command about to run. It is not invocable from the
 * chat UI (no `locations`/`invoke`), but appears in the AI configuration view where its model can
 * be assigned for the 'command-review' purpose. Invoked programmatically by
 * {@link ShellCommandReviewService} while a shell command awaits user confirmation.
 */
@injectable()
export class CommandReviewAgent implements Agent {

    id = 'Command Review';
    name = 'Command Review';
    displayName = nls.localize('theia/ai/terminal/commandReviewAgent/displayName', '命令审查');
    description = nls.localize('theia/ai/terminal/commandReviewAgent/description',
        '在 shell 命令等待用户确认时对其做安全审查。' +
        '纯只读且零副作用的命令可自动放行；有风险的命令会给出作用说明与风险点，展示在确认界面上供用户决策。' +
        '此代理不出现在聊天代理选择器中，仅在后台被调用。');
    variables = [];
    functions = [];
    agentSpecificVariables = [
        {
            name: 'command',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/commandReviewAgent/vars/command/description', '待审查的完整命令。')
        },
        {
            name: 'shell',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/commandReviewAgent/vars/shell/description', '执行命令的 shell。')
        },
        {
            name: 'cwd',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/commandReviewAgent/vars/cwd/description', '命令的工作目录。')
        },
        {
            name: 'subCommands',
            usedInPrompt: true,
            description: nls.localize('theia/ai/terminal/commandReviewAgent/vars/subCommands/description', '静态解析出的子命令列表。')
        }
    ];
    prompts = commandReviewPrompts;
    languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'command-review',
            identifier: 'default/universal',
        }
    ];

    @inject(LanguageModelRegistry)
    protected languageModelRegistry: LanguageModelRegistry;

    @inject(PromptService)
    protected promptService: PromptService;

    @inject(ILogger) @named('ai-terminal:CommandReviewAgent')
    protected logger: ILogger;

    @inject(LanguageModelService)
    protected languageModelService: LanguageModelService;

    /**
     * Reviews `command` and returns its verdict, purpose, and risks; resolves with `undefined`
     * when no model is available or the response cannot be parsed — callers then treat the
     * review as unavailable rather than guessing.
     */
    async review(
        command: string,
        shell: string,
        cwd: string,
        subCommands: string[],
        cancellationToken?: CancellationToken
    ): Promise<CommandReviewResult | undefined> {
        const lm = await this.languageModelRegistry.selectLanguageModel({
            agent: this.id,
            ...this.languageModelRequirements[0]
        });
        if (!lm) {
            this.logger.warn('No language model available for the Command Review agent.');
            return undefined;
        }

        const parameters = {
            command,
            shell,
            cwd,
            subCommands: subCommands.join('\n')
        };

        const systemMessage = await this.promptService.getResolvedPromptFragment('command-review-system', parameters).then(p => p?.text);
        const request = await this.promptService.getResolvedPromptFragment('command-review-user', parameters).then(p => p?.text);
        if (!systemMessage || !request) {
            this.logger.error('The prompt service didn\'t return prompts for the Command Review agent.');
            return undefined;
        }

        const variantInfo = this.promptService.getPromptVariantInfo('command-review-system');

        // The single request/response pair is considered a session of its own.
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
                    name: 'command-review',
                    description: 'Safety review of a shell command about to run',
                    schema: CommandReview.toJSONSchema()
                }
            },
            agentId: this.id,
            requestId: generateUuid(),
            sessionId: generateUuid(),
            promptVariantId: variantInfo?.variantId,
            isPromptVariantCustomized: variantInfo?.isCustomized,
            cancellationToken
        };

        try {
            const result = await this.languageModelService.sendRequest(lm, llmRequest);

            if (isLanguageModelParsedResponse(result)) {
                const parsedResult = CommandReview.safeParse(result.parsed);
                if (parsedResult.success) {
                    return parsedResult.data;
                }
            }

            // Fall back to parsing a textual JSON response.
            const jsonResult = await getJsonOfResponse(result);
            const parsedJsonResult = CommandReview.safeParse(jsonResult);
            if (parsedJsonResult.success) {
                return parsedJsonResult.data;
            }

            this.logger.warn('Command Review response did not match the expected schema.');
            return undefined;
        } catch (error) {
            this.logger.error('Error reviewing the command.', error);
            return undefined;
        }
    }

}
