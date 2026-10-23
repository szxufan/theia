// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
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
    ChatAgent,
    ChatAgentLocation,
    ChatAgentService,
    ErrorChatResponseContentImpl,
    MarkdownChatResponseContentImpl,
    MutableChatRequestModel,
    QuestionResponseContentImpl,
    ThinkingChatResponseContentImpl,
} from '@theia/ai-chat';
import { AI_CHAT_HOME, AI_CHAT_SHOW_CHATS_COMMAND } from '@theia/ai-chat-ui/lib/browser/chat-view-commands';
import { PromptText } from '@theia/ai-core/lib/common/prompt-text';
import { AIVariableResolutionRequest, BasePromptFragment, PromptService, ResolvedPromptFragment, TokenUsageService } from '@theia/ai-core';
import { CommandService, ILogger, nls, SelectionService } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import {
    AskUserQuestionInput,
    ContentBlock,
    EditInput,
    MultiEditInput,
    PermissionMode,
    SDKMessage,
    TaskInput,
    ToolApprovalRequestMessage,
    ToolApprovalResponseMessage,
    Usage,
    WriteInput
} from '../common/claude-code-service';
import { ClaudeCodeEditToolService, ToolUseBlock } from './claude-code-edit-tool-service';
import { FileEditBackupService } from './claude-code-file-edit-backup-service';
import { ClaudeCodeFrontendService } from './claude-code-frontend-service';
import { ClaudeCodeToolCallChatResponseContent } from './claude-code-tool-call-content';
import { OPEN_CLAUDE_CODE_CONFIG, OPEN_CLAUDE_CODE_MEMORY } from './claude-code-command-contribution';

export const CLAUDE_SESSION_ID_KEY = 'claudeSessionId';
export const CLAUDE_EDIT_TOOL_USES_KEY = 'claudeEditToolUses';
export const CLAUDE_INPUT_TOKENS_KEY = 'claudeInputTokens';
export const CLAUDE_OUTPUT_TOKENS_KEY = 'claudeOutputTokens';
export const CLAUDE_PENDING_APPROVALS_KEY = 'claudePendingApprovals';
export const CLAUDE_APPROVAL_TOOL_INPUTS_KEY = 'claudeApprovalToolInputs';
export const CLAUDE_MODEL_NAME_KEY = 'claudeModelName';
export const CLAUDE_COST_KEY = 'claudeCost';
export const CLAUDE_SESSION_APPROVED_TOOLS_KEY = 'claudeSessionApprovedTools';
export const CLAUDE_ASK_USER_QUESTION_IDS_KEY = 'claudeAskUserQuestionIds';
export const CLAUDE_PENDING_ASK_USER_QUESTIONS_KEY = 'claudePendingAskUserQuestions';

const APPROVAL_OPTIONS = [
    { text: nls.localizeByDefault('允许'), value: 'allow' },
    { text: nls.localize('theia/ai/claude-code/allowSession', '在此会话中允许'), value: 'allow-session' },
    { text: nls.localizeByDefault('拒绝'), value: 'deny' }
];

export const systemPromptAppendixTemplate: BasePromptFragment = {
    id: 'system-prompt-appendix',
    template: `
## IDE 集成上下文

你通过聊天界面集成在 {{productName}} 中，为开发任务提供情境化帮助。
这一集成使你可以访问实时 IDE 状态与用户工作区信息。

### 文件修改行为

**重要**：IDE 会自动收集并展示你建议的全部文件修改，无论工具权限是否明确授权。
即使遇到权限限制，也请继续提出文件变更。
IDE 会通过其变更管理界面将这些变更呈现给用户审阅与批准。

进行文件修改时：
- 即使工具调用提示权限问题，也继续给出建议的变更
- 提示用户在 IDE 下方"变更审查界面"中审阅建议的变更
- 认为由 IDE 在用户批准后处理实际的文件系统操作（除非你处于自动编辑模式）

### 可用的上下文信息

以下 IDE 上下文会随每次请求动态提供。
请根据用户的具体查询与任务要求评估各类上下文的相关性。

#### 当前选区

\`\`\`
{{selectedText}}
\`\`\`

**优先使用的时机**：用户询问特定代码段、想重构选中的代码，或要求解释选中文本。

#### 活动编辑器

{{activeEditor}}

**优先使用的时机**：用户的请求与当前聚焦的文件相关、询问代码问题，或需要当前工作文件的上下文。

#### 打开的编辑器

{{openEditors}}

**使用方式**：作为判断哪些文件可能与用户当前请求相关的线索。

#### 上下文文件

{{contextFiles}}

**优先使用的时机**：用户明确引用了附加文件，或需要更多文件才能理解请求的完整范围。

### 上下文使用准则

1. **评估相关性**：
并非所有提供的上下文都与每个请求相关。聚焦于直接支撑用户当前任务的上下文。

2. **交叉引用信息**：
当多种上下文类型都相关时，交叉引用它们以提供全面的帮助（例如活动编辑器中的选中文本）。

3. **工作区感知**：
利用整体上下文理解用户当前的工作区状态，给出与其开发环境和工作流相符的建议。

### 回答优化

- 以 markdown 链接格式引用具体文件：[文件名](<不带协议的绝对路径>)，例如 [example.ts](/home/me/workspace/example.ts)
- 组织回答时考虑用户当前的焦点与工作流
- 借助打开的编辑器，建议工作区内可能相关的其他修改
`
};

export const CLAUDE_CHAT_AGENT_ID = 'ClaudeCode';

const localCommands = {
    'clear': AI_CHAT_HOME,
    'config': OPEN_CLAUDE_CODE_CONFIG,
    'memory': OPEN_CLAUDE_CODE_MEMORY,
    'resume': AI_CHAT_SHOW_CHATS_COMMAND,
};

@injectable()
export class ClaudeCodeChatAgent implements ChatAgent {
    id = CLAUDE_CHAT_AGENT_ID;
    name = CLAUDE_CHAT_AGENT_ID;
    displayName = nls.localize('theia/ai/claude-code/displayName', 'Claude Code');
    description = nls.localize('theia/ai/claude-code/agentDescription', 'Anthropic 的编码代理');
    iconClass: string = 'codicon codicon-claude';
    locations: ChatAgentLocation[] = ChatAgentLocation.ALL;
    tags = [nls.localizeByDefault('聊天')];

    modes = [
        { id: 'default', name: nls.localize('theia/ai/claude-code/askBeforeEdit', '编辑前询问') },
        { id: 'acceptEdits', name: nls.localize('theia/ai/claude-code/editAutomatically', '自动编辑') },
        { id: 'plan', name: nls.localize('theia/ai/claude-code/plan', '计划模式') }
    ];

    variables = [];
    prompts = [{ id: systemPromptAppendixTemplate.id, defaultVariant: systemPromptAppendixTemplate }];
    languageModelRequirements = [];
    agentSpecificVariables = [
        {
            name: 'activeEditor',
            description: nls.localize('theia/ai/claude-code/vars/activeEditor/description', '当前活动编辑器的 URI。'),
            usedInPrompt: true
        }
    ];
    functions = [];

    @inject(PromptService)
    protected promptService: PromptService;

    @inject(ClaudeCodeFrontendService)
    protected claudeCode: ClaudeCodeFrontendService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    @inject(ClaudeCodeEditToolService)
    protected readonly editToolService: ClaudeCodeEditToolService;

    @inject(FileEditBackupService)
    protected readonly backupService: FileEditBackupService;

    @inject(TokenUsageService)
    protected readonly tokenUsageService: TokenUsageService;

    @inject(ILogger) @named('ai-claude-code:ClaudeCodeChatAgent')
    protected readonly logger: ILogger;

    async invoke(request: MutableChatRequestModel, chatAgentService?: ChatAgentService): Promise<void> {
        this.warnIfDifferentAgentRequests(request);

        // Handle slash commands anywhere in the request text
        const commandRegex = /\/(\w+)/g;
        const matches = Array.from(request.request.text.matchAll(commandRegex));
        for (const match of matches) {
            const command = match[1];
            if (command in localCommands) {
                const commandInfo = localCommands[command as keyof typeof localCommands];
                this.commandService.executeCommand(commandInfo.id);
                const message = nls.localize('theia/ai/claude-code/executedCommand', '已执行：{0}', commandInfo.label);
                request.response.response.addContent(new MarkdownChatResponseContentImpl(message));
                request.response.complete();
                return;
            }
        }

        try {
            const systemPromptAppendix = await this.createSystemPromptAppendix(request);
            const claudeSessionId = this.getPreviousClaudeSessionId(request);
            const agentAddress = `${PromptText.AGENT_CHAR}${CLAUDE_CHAT_AGENT_ID}`;
            let prompt = request.request.text.trim();
            if (prompt.startsWith(agentAddress)) {
                prompt = prompt.replace(agentAddress, '').trim();
            }

            const shouldFork = claudeSessionId !== undefined && this.isEditRequest(request);

            const streamResult = await this.claudeCode.send({
                prompt,
                options: {
                    systemPrompt: {
                        type: 'preset',
                        preset: 'claude_code',
                        append: systemPromptAppendix?.text
                    },
                    permissionMode: this.getClaudePermissionMode(request),
                    resume: claudeSessionId,
                    forkSession: shouldFork
                }
            }, request.response.cancellationToken);

            this.initializesEditToolUses(request);

            let hasAssistantMessage = false;
            for await (const message of streamResult) {
                if (ToolApprovalRequestMessage.is(message)) {
                    this.handleToolApprovalRequest(message, request);
                } else {
                    if (message.type === 'assistant') {
                        hasAssistantMessage = true;
                    }
                    // Only set session ID if we've seen an assistant message
                    // because we cannot resume a prior request without an assistant message
                    if (hasAssistantMessage) {
                        this.setClaudeSessionId(request, message.session_id);
                    }
                    this.addResponseContent(message, request);
                }
            }

            return request.response.complete();
        } catch (error) {
            this.logger.error('Error handling chat interaction:', error);
            request.response.response.addContent(new ErrorChatResponseContentImpl(error));
            request.response.error(error);
        } finally {
            await this.backupService.cleanUp(request);
        }
    }

    protected warnIfDifferentAgentRequests(request: MutableChatRequestModel): void {
        const requests = request.session.getRequests();
        if (requests.length > 1) {
            const previousRequest = requests[requests.length - 2];
            if (previousRequest.agentId !== this.id) {
                const warningMessage = '⚠️ ' + nls.localize('theia/ai/claude-code/differentAgentRequestWarning',
                    '上一个聊天请求由其他代理处理。Claude Code 看不到那些其他消息。') + '\n\n';
                request.response.response.addContent(new MarkdownChatResponseContentImpl(warningMessage));
            }
        }
    }

    protected async createSystemPromptAppendix(request: MutableChatRequestModel): Promise<ResolvedPromptFragment | undefined> {
        const contextVariables = request.context.variables.map(AIVariableResolutionRequest.fromResolved) ?? request.session.context.getVariables();
        const contextFiles = contextVariables
            .filter(variable => variable.variable.name === 'file' && !!variable.arg)
            .map(variable => `- ${variable.arg}`)
            .join('\n');

        const activeEditor = this.editorManager.currentEditor?.editor.document.uri ?? 'None';
        const openEditors = this.editorManager.all.map(editor => `- ${editor.editor.document.uri}`).join('\n');

        return this.promptService.getResolvedPromptFragment(
            systemPromptAppendixTemplate.id,
            { contextFiles, activeEditor, openEditors },
            { model: request.session, request }
        );
    }

    protected initializesEditToolUses(request: MutableChatRequestModel): void {
        request.addData(CLAUDE_EDIT_TOOL_USES_KEY, new Map<string, ToolUseBlock>());
    }

    protected getPendingApprovals(request: MutableChatRequestModel): Map<string, QuestionResponseContentImpl> {
        let approvals = request.getDataByKey(CLAUDE_PENDING_APPROVALS_KEY) as Map<string, QuestionResponseContentImpl> | undefined;
        if (!approvals) {
            approvals = new Map<string, QuestionResponseContentImpl>();
            request.addData(CLAUDE_PENDING_APPROVALS_KEY, approvals);
        }
        return approvals;
    }

    protected getApprovalToolInputs(request: MutableChatRequestModel): Map<string, unknown> {
        let toolInputs = request.getDataByKey(CLAUDE_APPROVAL_TOOL_INPUTS_KEY) as Map<string, unknown> | undefined;
        if (!toolInputs) {
            toolInputs = new Map<string, unknown>();
            request.addData(CLAUDE_APPROVAL_TOOL_INPUTS_KEY, toolInputs);
        }
        return toolInputs;
    }

    protected getSessionApprovedTools(request: MutableChatRequestModel): Set<string> {
        const approvedTools = request.session.settings?.[CLAUDE_SESSION_APPROVED_TOOLS_KEY] as string[] | undefined;
        return new Set(approvedTools ?? []);
    }

    protected setSessionApprovedTools(request: MutableChatRequestModel, approvedTools: Set<string>): void {
        const currentSettings = request.session.settings || {};
        request.session.setSettings({
            ...currentSettings,
            [CLAUDE_SESSION_APPROVED_TOOLS_KEY]: Array.from(approvedTools)
        });
    }

    protected isToolApprovedForSession(request: MutableChatRequestModel, toolName: string): boolean {
        return this.getSessionApprovedTools(request).has(toolName);
    }

    protected approveToolForSession(request: MutableChatRequestModel, toolName: string): void {
        const approvedTools = this.getSessionApprovedTools(request);
        approvedTools.add(toolName);
        this.setSessionApprovedTools(request, approvedTools);
    }

    protected handleToolApprovalRequest(
        approvalRequest: ToolApprovalRequestMessage,
        request: MutableChatRequestModel
    ): void {
        if (approvalRequest.toolName === 'AskUserQuestion') {
            this.handleAskUserQuestion(approvalRequest, request);
            return;
        }

        if (this.isToolApprovedForSession(request, approvalRequest.toolName)) {
            const response: ToolApprovalResponseMessage = {
                type: 'tool-approval-response',
                requestId: approvalRequest.requestId,
                approved: true,
                updatedInput: approvalRequest.toolInput
            };
            this.claudeCode.sendApprovalResponse(response);
            return;
        }

        // If not approved for session, prompt user
        const question = nls.localize('theia/ai/claude-code/toolApprovalRequest', 'Claude Code 想要使用"{0}"工具。您要允许吗？', approvalRequest.toolName);

        const questionContent = new QuestionResponseContentImpl(
            question,
            APPROVAL_OPTIONS,
            request,
            selectedOption => this.handleApprovalResponse(selectedOption, approvalRequest.requestId, approvalRequest.toolName, request),
            { onSkip: () => this.handleApprovalSkip(approvalRequest.requestId, request) }
        );

        // Store references for this specific approval request
        this.getPendingApprovals(request).set(approvalRequest.requestId, questionContent);
        this.getApprovalToolInputs(request).set(approvalRequest.requestId, approvalRequest.toolInput);

        request.response.response.addContent(questionContent);
        request.response.waitForInput();
    }

    protected handleApprovalResponse(
        selectedOption: { text: string; value?: string },
        requestId: string,
        toolName: string,
        request: MutableChatRequestModel
    ): void {
        const pendingApprovals = this.getPendingApprovals(request);
        const toolInputs = this.getApprovalToolInputs(request);

        // Update UI state and clean up
        const questionContent = pendingApprovals.get(requestId);
        const originalToolInput = toolInputs.get(requestId);

        if (questionContent) {
            questionContent.selectedOption = selectedOption;
        }

        pendingApprovals.delete(requestId);
        toolInputs.delete(requestId);

        const approved = selectedOption.value === 'allow' || selectedOption.value === 'allow-session';

        if (selectedOption.value === 'allow-session') {
            this.approveToolForSession(request, toolName);
        }

        const response: ToolApprovalResponseMessage = {
            type: 'tool-approval-response',
            requestId,
            approved,
            ...(approved
                ? { updatedInput: originalToolInput }
                : { message: 'User denied tool usage' }
            )
        };

        this.claudeCode.sendApprovalResponse(response);

        // Only stop waiting for input if there are no more pending approvals or questions
        if (pendingApprovals.size === 0 && this.getPendingAskUserQuestions(request).size === 0) {
            request.response.stopWaitingForInput();
        }
    }

    protected handleApprovalSkip(requestId: string, request: MutableChatRequestModel): void {
        const pendingApprovals = this.getPendingApprovals(request);
        pendingApprovals.delete(requestId);
        this.getApprovalToolInputs(request).delete(requestId);

        const response: ToolApprovalResponseMessage = {
            type: 'tool-approval-response',
            requestId,
            approved: false,
            message: 'User dismissed the tool approval request'
        };
        this.claudeCode.sendApprovalResponse(response);

        if (pendingApprovals.size === 0 && this.getPendingAskUserQuestions(request).size === 0) {
            request.response.stopWaitingForInput();
        }
    }

    protected handleAskUserQuestion(
        approvalRequest: ToolApprovalRequestMessage,
        request: MutableChatRequestModel
    ): void {
        const toolInput = approvalRequest.toolInput;
        if (!AskUserQuestionInput.is(toolInput)) {
            const response: ToolApprovalResponseMessage = {
                type: 'tool-approval-response',
                requestId: approvalRequest.requestId,
                approved: false,
                message: 'Invalid AskUserQuestion input format'
            };
            this.claudeCode.sendApprovalResponse(response);
            return;
        }

        const questions = toolInput.questions;
        const answers: Record<string, string> = {};
        let answeredCount = 0;
        const totalQuestions = questions.length;

        this.getPendingAskUserQuestions(request).add(approvalRequest.requestId);

        for (const questionItem of questions) {
            const options = questionItem.options.map(opt => ({
                text: opt.label,
                value: opt.label,
                description: opt.description
            }));

            const onAnswered = (): void => {
                answeredCount++;
                if (answeredCount === totalQuestions) {
                    this.getPendingAskUserQuestions(request).delete(approvalRequest.requestId);

                    const updatedInput: AskUserQuestionInput = {
                        ...toolInput,
                        answers
                    };

                    const response: ToolApprovalResponseMessage = {
                        type: 'tool-approval-response',
                        requestId: approvalRequest.requestId,
                        approved: true,
                        updatedInput
                    };

                    this.claudeCode.sendApprovalResponse(response);

                    if (this.getPendingApprovals(request).size === 0 && this.getPendingAskUserQuestions(request).size === 0) {
                        request.response.stopWaitingForInput();
                    }
                }
            };

            let questionContent: QuestionResponseContentImpl;
            if (questionItem.multiSelect) {
                questionContent = new QuestionResponseContentImpl(
                    questionItem.question, options, request,
                    selectedOptions => {
                        answers[questionItem.question] = selectedOptions.map(o => o.value ?? o.text).join(', ');
                        onAnswered();
                    },
                    { multiSelect: true, header: questionItem.header }
                );
            } else {
                questionContent = new QuestionResponseContentImpl(
                    questionItem.question, options, request,
                    selectedOption => {
                        answers[questionItem.question] = selectedOption.value ?? selectedOption.text;
                        onAnswered();
                    },
                    {
                        header: questionItem.header,
                        onSkip: () => {
                            answers[questionItem.question] = '';
                            onAnswered();
                        }
                    }
                );
            }

            request.response.response.addContent(questionContent);
        }

        request.response.waitForInput();
    }

    protected getPendingAskUserQuestions(request: MutableChatRequestModel): Set<string> {
        let ids = request.getDataByKey(CLAUDE_PENDING_ASK_USER_QUESTIONS_KEY) as Set<string> | undefined;
        if (!ids) {
            ids = new Set<string>();
            request.addData(CLAUDE_PENDING_ASK_USER_QUESTIONS_KEY, ids);
        }
        return ids;
    }

    protected getAskUserQuestionToolUseIds(request: MutableChatRequestModel): Set<string> {
        let ids = request.getDataByKey(CLAUDE_ASK_USER_QUESTION_IDS_KEY) as Set<string> | undefined;
        if (!ids) {
            ids = new Set<string>();
            request.addData(CLAUDE_ASK_USER_QUESTION_IDS_KEY, ids);
        }
        return ids;
    }

    protected getEditToolUses(request: MutableChatRequestModel): Map<string, ToolUseBlock> | undefined {
        return request.getDataByKey(CLAUDE_EDIT_TOOL_USES_KEY);
    }

    protected getPreviousClaudeSessionId(request: MutableChatRequestModel): string | undefined {
        const requests = request.session.getRequests();
        if (requests.length > 1) {
            const previousRequest = requests[requests.length - 2];
            return previousRequest.getDataByKey(CLAUDE_SESSION_ID_KEY);
        }
        return undefined;
    }

    protected getClaudeSessionId(request: MutableChatRequestModel): string | undefined {
        return request.getDataByKey(CLAUDE_SESSION_ID_KEY);
    }

    protected isEditRequest(request: MutableChatRequestModel): boolean {
        return request.request.referencedRequestId !== undefined;
    }

    protected setClaudeSessionId(request: MutableChatRequestModel, sessionId: string): void {
        request.addData(CLAUDE_SESSION_ID_KEY, sessionId);
    }

    protected readonly ALLOWED_MODES: PermissionMode[] = ['default', 'acceptEdits', 'plan', 'bypassPermissions'];

    protected getClaudePermissionMode(request: MutableChatRequestModel): PermissionMode {
        const modeId = request.request.modeId ?? 'default';
        return this.ALLOWED_MODES.includes(modeId as PermissionMode) ? modeId as PermissionMode : 'default';
    }

    protected getClaudeModelName(request: MutableChatRequestModel): string | undefined {
        return request.getDataByKey(CLAUDE_MODEL_NAME_KEY);
    }

    protected setClaudeModelName(request: MutableChatRequestModel, modelName: string): void {
        request.addData(CLAUDE_MODEL_NAME_KEY, modelName);
    }

    protected getCurrentInputTokens(request: MutableChatRequestModel): number {
        return request.getDataByKey(CLAUDE_INPUT_TOKENS_KEY) as number ?? 0;
    }

    protected getCurrentOutputTokens(request: MutableChatRequestModel): number {
        return request.getDataByKey(CLAUDE_OUTPUT_TOKENS_KEY) as number ?? 0;
    }

    protected updateTokens(request: MutableChatRequestModel, inputTokens: number, outputTokens: number): void {
        request.addData(CLAUDE_INPUT_TOKENS_KEY, inputTokens);
        request.addData(CLAUDE_OUTPUT_TOKENS_KEY, outputTokens);
        this.updateSessionSuggestion(request);
    }

    protected getSessionTotalTokens(request: MutableChatRequestModel): { inputTokens: number; outputTokens: number } {
        const requests = request.session.getRequests();
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (const req of requests) {
            const inputTokens = req.getDataByKey(CLAUDE_INPUT_TOKENS_KEY) as number ?? 0;
            const outputTokens = req.getDataByKey(CLAUDE_OUTPUT_TOKENS_KEY) as number ?? 0;
            totalInputTokens += inputTokens;
            totalOutputTokens += outputTokens;
        }

        return { inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
    }

    protected updateSessionSuggestion(request: MutableChatRequestModel): void {
        const { inputTokens, outputTokens } = this.getSessionTotalTokens(request);
        const formatTokens = (tokens: number): string => {
            if (tokens >= 1000) {
                return `${(tokens / 1000).toFixed(1)}K`;
            }
            return tokens.toString();
        };
        const suggestion = `↑ ${formatTokens(inputTokens)} | ↓ ${formatTokens(outputTokens)}`;
        request.session.setSuggestions([suggestion]);
    }

    protected isEditMode(request: MutableChatRequestModel): boolean {
        const permissionMode = this.getClaudePermissionMode(request);
        return permissionMode === 'acceptEdits' || permissionMode === 'bypassPermissions';
    }

    protected async reportTokenUsage(
        request: MutableChatRequestModel,
        inputTokens: number,
        outputTokens: number,
        cachedInputTokens?: number,
        readCachedInputTokens?: number
    ): Promise<void> {
        const modelName = this.getClaudeModelName(request);
        if (!modelName) {
            return;
        }

        const prefixedModelName = `anthropic/claude-code/${modelName}`;
        const sessionId = this.getClaudeSessionId(request);
        const requestId = sessionId || request.id;

        try {
            await this.tokenUsageService.recordTokenUsage(prefixedModelName, {
                inputTokens,
                outputTokens,
                cachedInputTokens,
                readCachedInputTokens,
                requestId
            });
            request.response.setTokenUsage({
                inputTokens,
                outputTokens,
                cacheCreationInputTokens: cachedInputTokens,
                cacheReadInputTokens: readCachedInputTokens
            });
        } catch (error) {
            this.logger.error('Failed to report token usage:', error);
        }
    }

    protected async addResponseContent(message: SDKMessage, request: MutableChatRequestModel): Promise<void> {
        // Extract model name from system init message
        if (message.type === 'system' && message.subtype === 'init' && message.model) {
            this.setClaudeModelName(request, message.model);
        }

        // Handle result messages with final usage
        if (message.type === 'assistant' && message.message.usage) {
            await this.handleTokenMetrics(message.message.usage, request);
        }
        if (message.type === 'result' && message.usage) {
            request.addData(CLAUDE_COST_KEY, message.total_cost_usd);
            await this.handleTokenMetrics(message.usage, request);
        }

        // Handle user messages for local-command-stdout extraction
        if (message.type === 'user') {
            const extractedContent = this.extractLocalCommandStdout(message.message.content);
            if (extractedContent) {
                request.response.response.addContent(new MarkdownChatResponseContentImpl(extractedContent));
            }
        }

        if (message.type === 'assistant' || message.type === 'user') {
            if (!Array.isArray(message.message.content)) {
                return;
            }

            for (const block of message.message.content) {
                switch (block.type) {
                    case 'text':
                        request.response.response.addContent(new MarkdownChatResponseContentImpl(block.text));
                        break;
                    case 'tool_use':
                    case 'server_tool_use':
                        // Suppress AskUserQuestion - already shown as interactive questions via the approval flow
                        if (block.name === 'AskUserQuestion') {
                            this.getAskUserQuestionToolUseIds(request).add(block.id);
                            break;
                        }

                        if (block.name === 'Task' && TaskInput.is(block.input)) {
                            request.response.response.addContent(new MarkdownChatResponseContentImpl(`\n\n### Task: ${block.input.description}\n\n${block.input.prompt}`));
                        }

                        // Track file edits
                        if ((block.name === 'Edit' && EditInput.is(block.input)) ||
                            (block.name === 'MultiEdit' && MultiEditInput.is(block.input)) ||
                            (block.name === 'Write' && WriteInput.is(block.input))) {
                            const toolUse: ToolUseBlock = {
                                name: block.name,
                                input: block.input
                            };
                            this.getEditToolUses(request)?.set(block.id, toolUse);
                        }
                        request.response.response.addContent(new ClaudeCodeToolCallChatResponseContent(block.id, block.name, JSON.stringify(block.input)));
                        break;
                    case 'tool_result':
                        // Suppress AskUserQuestion tool results
                        if (this.getAskUserQuestionToolUseIds(request).has(block.tool_use_id)) {
                            break;
                        }

                        if (this.getEditToolUses(request)?.has(block.tool_use_id)) {
                            const toolUse = this.getEditToolUses(request)?.get(block.tool_use_id);
                            if (toolUse) {
                                await this.editToolService.handleEditTool(toolUse, request, {
                                    sessionId: this.getClaudeSessionId(request),
                                    isEditMode: this.isEditMode(request)
                                });
                            }
                        }
                        request.response.response.addContent(new ClaudeCodeToolCallChatResponseContent(block.tool_use_id, '', '', true, JSON.stringify(block.content)));
                        break;
                    case 'thinking':
                        request.response.response.addContent(new ThinkingChatResponseContentImpl(block.thinking.trim(), block.signature?.trim() || ''));
                        break;
                    case 'redacted_thinking':
                        request.response.response.addContent(new ThinkingChatResponseContentImpl(block.data.trim(), ''));
                        break;
                    case 'web_search_tool_result':
                        if (Array.isArray(block.content)) {
                            const result = block.content.map(value => value.title + ':' + value.url).join(', ');
                            request.response.response.addContent(new ClaudeCodeToolCallChatResponseContent(block.tool_use_id, '', '', true, result));
                        }
                        break;
                }
            }
        }
    }

    protected async handleTokenMetrics(usage: Usage, request: MutableChatRequestModel): Promise<void> {
        const allInputTokens = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
        this.updateTokens(request, allInputTokens, (usage.output_tokens ?? 0));
        await this.reportTokenUsage(request, allInputTokens, (usage.output_tokens ?? 0),
            (usage.cache_creation_input_tokens ?? 0), (usage.cache_read_input_tokens ?? 0));
    }

    private extractLocalCommandStdout(content: string | ContentBlock[]): string | undefined {
        const regex = /<(local-command-stdout|local-command-stderr)>([\s\S]*?)<\/\1>/g;
        let extractedContent = '';
        let match;

        if (typeof content === 'string') {
            // eslint-disable-next-line no-null/no-null
            while ((match = regex.exec(content)) !== null) {
                extractedContent += match[2];
            }
        } else {
            for (const block of content) {
                if (block.type === 'text') {
                    // eslint-disable-next-line no-null/no-null
                    while ((match = regex.exec(block.text)) !== null) {
                        extractedContent += match[2];
                    }
                }
            }
        }

        return extractedContent || undefined;
    }
}
