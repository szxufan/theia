// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability as set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************
import {
    AbstractStreamParsingChatAgent, ChatRequestModel, ChatService, ChatSession,
    ChatSessionContext, CommonChatSessionSettings, MutableChatModel, resolvePermissionSettings, SystemMessageDescription
} from '@theia/ai-chat/lib/common';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { CODER_SYSTEM_PROMPT_ID, getCoderAgentModePromptTemplate } from '../common/coder-replace-prompt-template';
import { AIVariableContext, LanguageModelRequirement, PromptVariantSet } from '@theia/ai-core';
import { ILogger, nls } from '@theia/core';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { MarkdownStringImpl } from '@theia/core/lib/common/markdown-rendering';
import { AI_CHAT_HOME, ChatCommands } from '@theia/ai-chat-ui/lib/browser/chat-view-commands';

export const CoderAgentId = 'Coder';

/**
 * The Coder agent uses a single system prompt: how its tool calls are executed is governed by
 * the session permission mode (confirm/autonomous/full + orthogonal plan mode), which is
 * enforced at the tool-request layer, not by different prompt variants. A short instruction
 * describing the active mode is appended to the system message so the model knows what to
 * expect (e.g. that mutating calls will be confirmed or denied).
 */
@injectable()
export class CoderAgent extends AbstractStreamParsingChatAgent {
    @inject(ILogger) @named('ai-ide:CoderAgent')
    protected override readonly logger: ILogger;

    @inject(ChatService) protected readonly chatService: ChatService;
    id: string = CoderAgentId;
    name = CoderAgentId;
    displayName = nls.localize('theia/ai/ide/coderAgent/displayName', '编码');
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';
    override iconClass: string = 'codicon codicon-code';

    override description = nls.localize('theia/ai/workspace/coderAgent/description',
        '集成于 {0} 的 AI 助手，旨在为软件开发者提供帮助。此代理可以访问用户的工作区，它可以获取所有可用文件'
        + '和文件夹的列表并检索其内容。此外，它还可以向用户建议文件的修改。因此，它可以协助用户完成编码任务或其他'
        + '涉及文件更改的任务。',
        FrontendApplicationConfigProvider.get().applicationName);

    override prompts: PromptVariantSet[] = [{
        id: CODER_SYSTEM_PROMPT_ID,
        defaultVariant: getCoderAgentModePromptTemplate(),
        variants: []
    }];
    protected override systemPromptId: string | undefined = CODER_SYSTEM_PROMPT_ID;

    protected override async getSystemMessageDescription(context: AIVariableContext): Promise<SystemMessageDescription | undefined> {
        const description = await super.getSystemMessageDescription(context);
        if (!description) {
            return description;
        }
        const settings = ChatSessionContext.is(context)
            ? context.request?.session.settings?.commonSettings
            : undefined;
        return { ...description, text: `${description.text}\n\n${getPermissionModePromptInstruction(settings)}` };
    }

    async suggest(context: ChatSession | ChatRequestModel): Promise<void> {
        const contextIsRequest = ChatRequestModel.is(context);
        const model = contextIsRequest ? context.session : context.model;
        const session = contextIsRequest ? this.chatService.getSessions().find(candidate => candidate.model.id === model.id) : context;
        if (!(model instanceof MutableChatModel) || !session) { return; }
        if (model.isEmpty()) {
            model.setSuggestions([
                {
                    kind: 'callback',
                    callback: () => this.chatService.sendRequest(session.id, {
                        text: `@Coder ${nls.localize('theia/ai/ide/coderAgent/suggestion/fixProblems/prompt', '请查看 {1} 并修复所有问题。', '#_f')}`
                    }),
                    content: nls.localize('theia/ai/ide/coderAgent/suggestion/fixProblems/content', '[修复当前文件中的问题]({0})。', '_callback')
                },
            ]);
        } else {
            model.setSuggestions([new MarkdownStringImpl(nls.localize('theia/ai/ide/coderAgent/suggestion/startNewChat',
                'Keep chats short and focused. [Start a new chat]({0}) for a new task or [start a new chat with a summary of this one]({1}).',
                `command:${AI_CHAT_HOME.id}`, `command:${ChatCommands.AI_CHAT_NEW_WITH_TASK_CONTEXT.id}`))]);
        }
    }

}

/** Short system-prompt instruction describing the active permission mode to the model. */
export function getPermissionModePromptInstruction(settings?: CommonChatSessionSettings): string {
    const { permissionMode, planMode } = resolvePermissionSettings(settings);
    const lines: string[] = [];
    if (planMode) {
        lines.push('# Permission: Plan Mode Active\n'
            + 'Mutating operations (writing files, executing commands) will be rejected. Explore the '
            + 'workspace with read-only tools and produce a complete implementation plan. Changes will '
            + 'only be executed after the user disables plan mode.');
    }
    switch (permissionMode) {
        case 'confirm':
            lines.push('# Permission: Confirm Before Changes\n'
                + 'File modifications and command executions require explicit user approval before they run.');
            break;
        case 'autonomous':
            lines.push('# Permission: Autonomous\n'
                + 'You may modify files and run commands directly. Shell commands are safety-reviewed; '
                + 'risky ones will ask the user for confirmation.');
            break;
        case 'full':
            lines.push('# Permission: Full Access\n'
                + 'All operations execute directly without confirmation.');
            break;
    }
    return lines.join('\n\n');
}
