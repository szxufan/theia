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

import { AI_CHAT_TOGGLE_COMMAND_ID } from '@theia/ai-chat-ui/lib/browser/ai-chat-ui-contribution';
import { ChatAgentRecommendationService } from '@theia/ai-chat/lib/common';
import { DEFAULT_CHAT_AGENT_PREF } from '@theia/ai-chat/lib/common/ai-chat-preferences';
import { ENABLE_AI_CONTEXT_KEY } from '@theia/ai-core/lib/browser/ai-activation-service';
import { AiConfigurationCategoryId } from '@theia/ai-core-ui/lib/browser/ai-configuration/ai-configuration-category';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { PerspectiveServiceImpl } from '@theia/core/lib/browser/perspective-service';
import { nls } from '@theia/core/lib/common/nls';
import { WalkthroughProvider } from '@theia/getting-started/lib/common/walkthrough-provider';
import { WalkthroughDefinition, WalkthroughStepDefinition } from '@theia/getting-started/lib/common/walkthrough-types';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { AI_SET_DEFAULT_CHAT_AGENT } from './ai-getting-started-commands';
import { OPEN_AI_CONFIG_VIEW, OPEN_AI_CONFIG_VIEW_TOOLS } from './ai-configuration/ai-configuration-view-contribution';
import {
    AI_CHAT_USED_CONTEXT_KEY,
    AI_DEFAULT_AGENT_CONTEXT_KEY,
    AI_MODEL_READY_CONTEXT_KEY,
    AI_TOOL_CONFIRMATION_CONFIGURED_CONTEXT_KEY
} from './ai-walkthrough-context-keys';

/**
 * Id of the walkthrough that guides a new user through setting up and using the AI features.
 * Also the argument of the `walkthrough.open` command.
 */
export const AI_GETTING_STARTED_WALKTHROUGH_ID = 'ai-features.getting-started';

const AI_DOC_URL = 'https://theia-ide.org/docs/user_ai/';
const THEIA_AI_DOC_URL = 'https://theia-ide.org/docs/theia_ai/';
const FEEDBACK_URL = 'https://github.com/eclipse-theia/theia/issues/new/choose';

/**
 * Contributes the "Get started with AI" walkthrough to the welcome page: the single, progress-tracked path
 * from disabled AI features to a first answer in the chat.
 */
@injectable()
export class AiGettingStartedWalkthroughProvider implements WalkthroughProvider {

    @inject(ChatAgentRecommendationService)
    protected readonly recommendationService: ChatAgentRecommendationService;

    protected walkthrough: WalkthroughDefinition | undefined;

    getWalkthroughs(): WalkthroughDefinition[] {
        // Built on demand rather than in the field initializer, so that the localization is in place.
        this.walkthrough ??= this.createWalkthrough();
        return [this.walkthrough];
    }

    protected get applicationName(): string {
        return FrontendApplicationConfigProvider.get().applicationName;
    }

    /** Deep-links into the AI Configuration view, which takes a category id or an `ai-features.*` preference id. */
    protected aiConfiguration(target?: string): string {
        return `command:${OPEN_AI_CONFIG_VIEW.id}${target ? `?${target}` : ''}`;
    }

    protected createWalkthrough(): WalkthroughDefinition {
        return {
            id: AI_GETTING_STARTED_WALKTHROUGH_ID,
            icon: 'sparkle',
            title: nls.localize('theia/ai/ide/walkthrough/title', '开始使用 AI'),
            description: nls.localize('theia/ai/ide/walkthrough/description', '设置 {0} 的 AI 功能并学习如何使用它们。', this.applicationName),
            steps: [
                this.createAiSupportStep(),
                this.createEnableStep(),
                this.createModelStep(),
                this.createAgentStep(),
                this.createFirstQuestionStep(),
                this.createToolConfirmationStep(),
                this.createGoFurtherStep()
            ]
        };
    }

    /**
     * The opening slide, carrying what the welcome page used to announce in its AI banner: what the features
     * are, that they are opt-in and may incur costs, and the invitation to the community behind them.
     */
    protected createAiSupportStep(): WalkthroughStepDefinition {
        return {
            id: 'ai-support',
            title: nls.localize('theia/ai/ide/walkthrough/aiSupport/title', '{0} 中的 AI 支持', this.applicationName),
            description: nls.localize('theia/ai/ide/walkthrough/aiSupport/description', `
{0} 内置 AI 支持：与专门的代理聊天讨论您的项目、让它们修改代码并运行任务、在您输入时自动补全代码，以及在终端中获得帮助。

这些功能默认处于禁用状态，以便您可以自行决定是否启用。

启用后，它们可能会持续向您授权的语言模型发送请求。这可能产生需要您密切关注的费用。

[阅读文档]({1})。

我们欢迎您的反馈、贡献与赞助！访问 [GitHub 项目]({2}) 支持持续开发。感谢您成为我们社区的一员！

所有这些都构建于 Theia AI 之上——已发布稳定版本的 AI 驱动工具与 IDE 框架。[阅读框架文档]({3})。
`, this.applicationName, AI_DOC_URL, FEEDBACK_URL, THEIA_AI_DOC_URL).trim(),
            // Reading it is done once the user acts on it, either by following a link or by turning the features on.
            completionEvents: [`onContext:${ENABLE_AI_CONTEXT_KEY}`, `onLink:${AI_DOC_URL}`]
        };
    }

    protected createEnableStep(): WalkthroughStepDefinition {
        return {
            id: 'enable-ai',
            title: nls.localize('theia/ai/ide/walkthrough/enableAi/title', '开启 AI 功能'),
            description: nls.localize('theia/ai/ide/walkthrough/enableAi/description', `
在您开启 AI 功能之前，不会向任何地方发送任何内容，并且您可以随时再次关闭它们。

[打开 AI 配置]({0}) 并在其中启用它们。
`, this.aiConfiguration(ENABLE_AI_CONTEXT_KEY)).trim(),
            completionEvents: [`onContext:${ENABLE_AI_CONTEXT_KEY}`]
        };
    }

    protected createModelStep(): WalkthroughStepDefinition {
        return {
            id: 'connect-model',
            title: nls.localize('theia/ai/ide/walkthrough/connectModel/title', '连接语言模型'),
            description: nls.localize('theia/ai/ide/walkthrough/connectModel/description', `
为托管提供程序添加 API 密钥：

- [OpenAI]({0})
- [Anthropic]({1})
- [Google]({2})

更愿意保持本地运行或使用其他服务？Ollama、llamafile 以及任何 OpenAI 兼容的端点都可以在[模型]({3})页面中设置。

某些代理自带模型（例如 Claude Code），无需提供程序即可工作。
`, this.aiConfiguration('ai-features.openAiOfficial.openAiApiKey'),
                this.aiConfiguration('ai-features.anthropic.AnthropicApiKey'),
                this.aiConfiguration('ai-features.google.apiKey'),
                this.aiConfiguration(AiConfigurationCategoryId.MODELS)).trim(),
            completionEvents: [`onContext:${AI_MODEL_READY_CONTEXT_KEY}`]
        };
    }

    protected createAgentStep(): WalkthroughStepDefinition {
        const intro = nls.localize('theia/ai/ide/walkthrough/chooseAgent/intro', `
每个聊天请求都会发送给一个代理，当您没有亲自指定时，会由其中一个代理来回答。

**设置您的默认代理：**
`).trim();
        const outro = nls.localize('theia/ai/ide/walkthrough/chooseAgent/outro', `
您还可以在设置中[选择默认代理]({0})，并通过以 *@代理名称* 开头的单条消息来指定另一个代理。
[代理]({1})页面列出了所有代理。
`, this.aiConfiguration(DEFAULT_CHAT_AGENT_PREF), this.aiConfiguration(AiConfigurationCategoryId.AGENTS)).trim();
        return {
            id: 'choose-agent',
            title: nls.localize('theia/ai/ide/walkthrough/chooseAgent/title', '选择您的默认代理'),
            description: [intro, this.renderAgentChoices(), outro].filter(part => !!part).join('\n\n'),
            completionEvents: [`onContext:${AI_DEFAULT_AGENT_CONTEXT_KEY}`]
        };
    }

    /**
     * One action per recommended agent, each setting it as the default right away.
     *
     * Every link stands alone in its paragraph, which is what the welcome page renders as a button, so this
     * reads like the buttons the chat welcome used to offer. Products customize the list through
     * {@link ChatAgentRecommendationService}.
     */
    protected renderAgentChoices(): string {
        return this.recommendationService.getRecommendedAgents()
            .map(agent => {
                const command = `command:${AI_SET_DEFAULT_CHAT_AGENT.id}?${encodeURIComponent(JSON.stringify(agent.id))}`;
                // Carried as the link title, so what the agent is good at stays available as a tooltip.
                const title = agent.description ? ` "${agent.description.replace(/"/g, '')}"` : '';
                return `[@${agent.label}](${command}${title})`;
            })
            .join('\n\n');
    }

    protected createFirstQuestionStep(): WalkthroughStepDefinition {
        return {
            id: 'first-question',
            title: nls.localize('theia/ai/ide/walkthrough/firstQuestion/title', '提出您的第一个问题'),
            description: nls.localize('theia/ai/ide/walkthrough/firstQuestion/description', `
[打开 AI 聊天]({0}) 并询问有关您项目的问题。

有两点可以让回答质量大幅提升：

- *@代理名称* 会为这条消息选择代理，例如 *@Coder*。
- *#* 用于附加上下文，例如 *#file* 或 *#selectedText*。输入框旁边的回形针按钮具有相同的作用。

聊天会记住您的会话，因此您可以稍后继续之前的对话。
`, `command:${AI_CHAT_TOGGLE_COMMAND_ID}`).trim(),
            completionEvents: [`onContext:${AI_CHAT_USED_CONTEXT_KEY}`]
        };
    }

    protected createToolConfirmationStep(): WalkthroughStepDefinition {
        return {
            id: 'tool-confirmation',
            title: nls.localize('theia/ai/ide/walkthrough/toolConfirmation/title', '掌控代理的操作'),
            description: nls.localize('theia/ai/ide/walkthrough/toolConfirmation/description', `
代理通过工具对您的工作区执行操作：读取文件、运行终端命令或编辑代码。

每次工具调用都会先请求您的确认。在[工具]({0})页面中，您可以更改该默认行为或预先批准您信任的工具。

当工作区不受信任时，AI 功能将完全保持关闭。[管理工作区信任]({1})以按项目决定。
`, `command:${OPEN_AI_CONFIG_VIEW_TOOLS.id}`, `command:${WorkspaceCommands.MANAGE_WORKSPACE_TRUST.id}`).trim(),
            completionEvents: [
                `onContext:${AI_TOOL_CONFIRMATION_CONFIGURED_CONTEXT_KEY}`,
                `onLink:command:${OPEN_AI_CONFIG_VIEW_TOOLS.id}`
            ]
        };
    }

    protected createGoFurtherStep(): WalkthroughStepDefinition {
        return {
            id: 'go-further',
            title: nls.localize('theia/ai/ide/walkthrough/goFurther/title', '更进一步'),
            description: nls.localize('theia/ai/ide/walkthrough/goFurther/description', `
聊天只是一个开始。AI 还可以在您输入时自动补全代码，并通过 *Ctrl+I* 在终端中提供协助。

- [提示词与技能]({0})：阅读并调整代理所使用的指令。
- [MCP 服务器]({1})：在 {3} 自带工具之外添加更多工具。
- [Token 用量]({2})：查看您的请求消耗了什么。
- [切换视角]({5})（实验性）：*AI 优先* 布局将聊天移动到主区域，资源管理器和源代码管理位于右侧。

AI 历史视图（如果可用）会显示实际发送给模型的内容。

[文档]({4})中还有更多内容——并且始终欢迎您的反馈。
`, this.aiConfiguration(AiConfigurationCategoryId.PROMPTS_AND_SKILLS),
                this.aiConfiguration(AiConfigurationCategoryId.MCP_SERVERS),
                this.aiConfiguration(AiConfigurationCategoryId.TOKEN_USAGE),
                this.applicationName,
                AI_DOC_URL,
                `command:${PerspectiveServiceImpl.SWITCH_PERSPECTIVE_COMMAND.id}`).trim()
        };
    }
}
