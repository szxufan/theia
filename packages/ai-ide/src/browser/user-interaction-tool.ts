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

import { ToolProvider, ToolRequest, ToolRequestParameterProperty, ToolRequestParameters } from '@theia/ai-core';
import { AutoActionResult, ToolInvocationContext } from '@theia/ai-core/lib/common/language-model';
import { ChatToolContext, ToolCallChatResponseContent } from '@theia/ai-chat';
import { DiffUris } from '@theia/core/lib/browser/diff-uris';
import { open, OpenerService } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { MEMORY_TEXT, MEMORY_TEXT_READONLY, ResourceProvider } from '@theia/core/lib/common/resource';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { ScmService } from '@theia/scm/lib/browser/scm-service';
import { WorkspaceFunctionScope } from './workspace-functions';
import {
    ContentRef,
    USER_INTERACTION_FUNCTION_ID,
    PathContentRef,
    UserInteractionLink,
    UserInteractionResult,
    UserInteractionStep,
    buildDiffLabel,
    isEmptyContentRef,
    normalizeUserInteractionLink,
    parseUserInteractionArgs,
    resolveContentRef
} from '../common/user-interaction-tool';
import { ILogger } from '@theia/core';

interface PendingInteraction {
    deferred: Deferred<string>;
    steps: UserInteractionStep[];
    resolved: boolean;
    /**
     * Latest partial result pushed by the renderer via {@link UserInteractionTool.recordPartial}.
     * Used to resolve the handler with what the user has collected so far when the interaction
     * is canceled. If absent (no renderer mounted) the tool resolves with all steps skipped.
     */
    latestPartial?: UserInteractionResult;
    /**
     * Step the user is currently viewing, pushed by the renderer via
     * {@link UserInteractionTool.recordCurrentStep}. Lets another mount of the same
     * interaction (e.g. the collapsed delegation summary and the expanded details)
     * resume at that step instead of restarting at the first one.
     */
    currentStep?: number;
}

// Schemas are module-level constants so they are built once at load time
// rather than reconstructed on every getTool() call. We use a single object
// schema (no oneOf/anyOf) since some providers (notably OpenAI) handle union
// types poorly. The runtime parser additionally accepts plain string paths
// as shorthand.
const CONTENT_REF_SCHEMA: ToolRequestParameterProperty = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: '工作区相对文件路径。除非 "empty" 为 true，否则必填。'
        },
        gitRef: {
            type: 'string',
            description: '可选的 git 引用（分支、标签或提交哈希）。当 "empty" 为 true 时忽略。'
        },
        line: {
            type: 'number',
            description: '可选的行号（从 1 开始计数），用于定位滚动。当 "empty" 为 true 时忽略。'
        },
        empty: {
            type: 'boolean',
            description: '设为 true 表示该侧刻意留空（例如 diff 中新增或删除的文件）。'
        },
        label: {
            type: 'string',
            description: '空白侧的可选标签（例如 "新文件"、"已删除"）。仅当 "empty" 为 true 时使用。'
        }
    },
    description: '内容引用。为真实文件提供 "path"（可选附带 "gitRef" 和/或 "line"），'
        + '或设置 "empty": true 表示 diff 中缺失的一侧。'
};

const STEP_SCHEMA: ToolRequestParameterProperty = {
    type: 'object',
    properties: {
        title: { type: 'string', description: '该步骤的简短标题。' },
        message: { type: 'string', description: '向用户展示的 markdown 格式消息。' },
        options: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: '选项按钮的显示文本。' },
                    value: { type: 'string', description: '用户选择该选项时返回的值。' },
                    description: { type: 'string', description: '随选项一起显示的可选详细描述。' },
                    buttonLabel: { type: 'string', description: '可选的醒目按钮标签文本。未提供时回退为 text。' }
                },
                required: ['text', 'value']
            },
            description: '该步骤向用户提供的按钮。'
                + '仅在纯信息展示步骤中省略（或传空数组）：没有选项的步骤绝不会构成确认，'
                + '因此绝不要用它来征求同意。多步骤交互中始终会显示一个固定的“下一步”/“完成”按钮用于推进。'
        },
        links: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    ref: {
                        ...CONTENT_REF_SCHEMA,
                        description: '文件（或 diff 左侧）的内容引用。'
                            + '为真实文件提供 "path"，对原本不存在的文件设置 "empty": true。'
                    },
                    rightRef: {
                        ...CONTENT_REF_SCHEMA,
                        description: 'diff 视图右侧的内容引用。'
                            + '仅当该步骤要展示 diff 时才提供；单个文件链接请完全省略。'
                            + '为真实文件提供 "path"，对已不存在的文件设置 "empty": true。'
                    },
                    label: { type: 'string', description: '链接或 diff 标签页的可选标签。' },
                    autoOpen: {
                        type: 'boolean',
                        description: '该步骤变为当前步骤时是否自动打开文件/diff。默认为 false；'
                            + '仅当链接是用户必须立即查看的关键上下文时才设为 true。'
                    }
                },
                required: ['ref']
            },
            description: '随该步骤一起显示的可选文件或 diff 链接。'
                + '仅用 "ref" 表示单个文件链接；只在该步骤要展示 diff 时才添加 "rightRef"。'
        }
    },
    required: ['title', 'message']
};

const TOOL_PARAMETERS: ToolRequestParameters = {
    type: 'object',
    properties: {
        interactions: {
            type: 'array',
            items: STEP_SCHEMA,
            description: '有序的交互步骤列表。用户按顺序逐步浏览，也可以回到之前的步骤。'
        }
    },
    required: ['interactions']
};

const TOOL_DESCRIPTION = '展示一个交互式用户交互。每个步骤包含标题、markdown 消息、可选的选项按钮，'
    + '以及用户可点击的可选文件/diff 链接。'
    + '链接方面，仅用 "ref" 展示单个文件；只在该步骤要展示 diff 时才添加 "rightRef"。'
    + '单步骤行为：如果该步骤有选项，工具会等待用户选择一个选项，然后完成交互；'
    + '如果没有选项，则纯属信息展示，由工具自动完成'
    + '（不要向用户承诺会有“完成”或“下一步”按钮；没有这类按钮，也无法输入评论）。'
    + '多步骤行为：用户通过“下一步”按钮（最后一步为“完成”）推进各步骤，可以回到之前的步骤，'
    + '并可在每个步骤添加自由格式的评论。'
    + '工具返回一个 JSON 字符串，格式为 { "completed": boolean, "steps": [{ "title", "value"?, "comments"?, "skipped"? }] }。'
    + '如果用户中途取消，工具会返回目前收集到的内容，且 "completed" 为 false。'
    + '用它可在一次工具调用中引导用户完成一系列预先确定的发现或决策，'
    + '或在聊天中内联展示单条消息/diff。'
    + '嵌套值必须作为真正的 JSON 数组和对象传入，绝不要传 JSON 编码后的字符串。';

@injectable()
export class UserInteractionTool implements ToolProvider {
    static ID = USER_INTERACTION_FUNCTION_ID;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(ScmService)
    protected readonly scmService: ScmService;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    @inject(ResourceProvider)
    protected readonly resourceProvider: ResourceProvider;

    @inject(ILogger) @named('ai-ide:UserInteractionTool')
    protected readonly logger: ILogger;

    protected readonly pendingInteractions = new Map<string, PendingInteraction>();

    getTool(): ToolRequest {
        return {
            id: UserInteractionTool.ID,
            name: UserInteractionTool.ID,
            providerName: 'ai-ide',
            description: TOOL_DESCRIPTION,
            parameters: TOOL_PARAMETERS,
            handler: (argString: string, ctx) => this.handleInteraction(argString, ctx),
            checkAutoAction: (argString: string) => this.checkArguments(argString)
        };
    }

    /**
     * Auto-deny invocations whose arguments do not validate, handing the validation error back to
     * the model. Without this the confirmation flow would stall: the renderer refuses to mount the
     * interaction (and with it the Allow/Deny buttons) for arguments it cannot render, so a
     * confirmation that nobody can give would be awaited indefinitely.
     */
    protected checkArguments(argString: string): AutoActionResult | undefined {
        const validation = parseUserInteractionArgs(argString);
        return validation.ok ? undefined : { action: 'deny', reason: validation.error };
    }

    /**
     * Resolve the pending interaction with the given final result. The renderer is the single
     * source of truth for the collected user input and passes the full result here on Finish
     * (or on a per-option click for single-step interactions).
     */
    completeInteraction(toolCallId: string, result: UserInteractionResult): void {
        this.resolveInteraction(toolCallId, result);
    }

    /**
     * Push the latest partial result so the tool can resolve with it on cancellation.
     * The renderer should call this whenever the user changes step state. Calls for
     * an already-resolved interaction are silently ignored.
     */
    recordPartial(toolCallId: string, partial: UserInteractionResult): void {
        const pending = this.pendingInteractions.get(toolCallId);
        if (!pending || pending.resolved) {
            return;
        }
        pending.latestPartial = partial;
    }

    /**
     * Remember the step the user is currently viewing so another mount of the same
     * interaction resumes there. Calls for an unknown or already-resolved interaction
     * are silently ignored.
     */
    recordCurrentStep(toolCallId: string, step: number): void {
        const pending = this.pendingInteractions.get(toolCallId);
        if (!pending || pending.resolved) {
            return;
        }
        pending.currentStep = step;
    }

    /** The step last recorded via {@link recordCurrentStep}, or undefined if nothing is pending. */
    getCurrentStep(toolCallId: string): number | undefined {
        const pending = this.pendingInteractions.get(toolCallId);
        return pending && !pending.resolved ? pending.currentStep : undefined;
    }

    protected resolveInteraction(toolCallId: string, result: UserInteractionResult): void {
        const pending = this.pendingInteractions.get(toolCallId);
        if (!pending || pending.resolved) {
            return;
        }
        pending.resolved = true;
        pending.deferred.resolve(JSON.stringify(result));
    }

    protected cancelPending(toolCallId: string): void {
        const pending = this.pendingInteractions.get(toolCallId);
        if (!pending || pending.resolved) {
            return;
        }
        const result = pending.latestPartial ?? {
            completed: false,
            steps: pending.steps.map(step => ({ title: step.title, skipped: true }))
        };
        this.resolveInteraction(toolCallId, result);
    }

    async openLink(link: UserInteractionLink): Promise<void> {
        const normalizedLink = normalizeUserInteractionLink(link);
        if (!normalizedLink) {
            return;
        }
        link = normalizedLink;

        if (link.rightRef !== undefined) {
            const resolvedLeftUri = await this.resolveDiffSideUri(link.ref);
            const resolvedRightUri = await this.resolveDiffSideUri(link.rightRef);
            const left = resolveContentRef(link.ref);
            const right = resolveContentRef(link.rightRef);
            const diffLabel = link.label || buildDiffLabel(left, right);
            const diffUri = DiffUris.encode(resolvedLeftUri, resolvedRightUri, diffLabel);
            // Prefer the right-side line (working copy) since diff editors reveal
            // selections on the modified editor; fall back to the left-side line.
            const line = (!isEmptyContentRef(right) && right.line)
                || (!isEmptyContentRef(left) && left.line)
                || undefined;
            const selection = line ? { start: { line: line - 1, character: 0 } } : undefined;
            await open(this.openerService, diffUri, { selection });
        } else {
            if (isEmptyContentRef(link.ref)) {
                return;
            }
            const left = resolveContentRef(link.ref) as PathContentRef;
            if (left.gitRef) {
                const uri = this.resolveUri(left);
                let targetUri: URI;
                if (uri === undefined) {
                    targetUri = this.errorContentUri(left.path, left.gitRef);
                } else if (await this.canResolveUri(uri)) {
                    targetUri = uri;
                } else {
                    // SCM is available but reading at this ref failed — likely the
                    // ref does not exist or the file did not exist at that ref.
                    targetUri = this.refNotFoundUri(left.path, left.gitRef);
                }
                await open(this.openerService, targetUri);
            } else {
                const fileUri = this.workspaceScope.resolveRelativePath(left.path);
                if (!(await this.canResolveUri(fileUri))) {
                    await open(this.openerService, this.fileNotFoundUri(left.path));
                    return;
                }
                const selection = left.line
                    ? { start: { line: left.line - 1, character: 0 } }
                    : undefined;
                await this.editorManager.open(fileUri, { selection });
            }
        }
    }

    protected resolveUri(
        ref: PathContentRef
    ): URI | undefined {
        const fileUri = this.workspaceScope.resolveRelativePath(ref.path);
        if (ref.gitRef) {
            const repo = this.scmService.findRepository(fileUri);
            if (repo) {
                return repo.toUriAtRef(fileUri, ref.gitRef);
            }
            this.logger.warn(`No SCM repository found to resolve gitRef '${ref.gitRef}' for '${ref.path}'`);
            return undefined;
        }
        return fileUri;
    }

    protected async handleInteraction(argString: string, ctx: ToolInvocationContext | undefined): Promise<string> {
        // Validate via the shared parser so the tool only ever waits for steps that
        // the renderer would actually render, and so that anything the agent got
        // wrong is reported back to it verbatim instead of being silently dropped.
        const validation = parseUserInteractionArgs(argString);
        if (!validation.ok) {
            return JSON.stringify({ error: validation.error });
        }
        const validated = validation.args;

        const toolCallId = ToolInvocationContext.getToolCallId(ctx);
        if (!toolCallId) {
            return JSON.stringify({ error: 'No tool call ID available' });
        }

        const steps: UserInteractionStep[] = validated.interactions;

        // Single-step interactions without options are purely informational
        // (message + optional links/diffs) and should not block the agent.
        // Resolve immediately with completed=true.
        if (steps.length === 1 && (!steps[0].options || steps[0].options.length === 0)) {
            const result: UserInteractionResult = {
                completed: true,
                steps: [{ title: steps[0].title }]
            };
            return JSON.stringify(result);
        }

        const pending: PendingInteraction = {
            deferred: new Deferred<string>(),
            steps,
            resolved: false
        };
        this.pendingInteractions.set(toolCallId, pending);

        const cancellationToken = ToolInvocationContext.getCancellationToken(ctx);
        const cancellationListener = cancellationToken?.onCancellationRequested(() => this.cancelPending(toolCallId));

        // Mark the response as waiting for input while the interaction is pending, so it is
        // surfaced consistently with agent questions and tool confirmations (e.g. in the
        // session overview and notifications). Announce the interaction via
        // interactionNeeded so UIs that track pending interactions (e.g. the collapsed
        // delegation summary) surface it like tool confirmations (#17952).
        const response = ChatToolContext.is(ctx) ? ctx.response : undefined;
        let contentPart: ToolCallChatResponseContent | undefined;
        if (response) {
            contentPart = response.response.content.findLast(
                (part): part is ToolCallChatResponseContent => ToolCallChatResponseContent.is(part) && part.id === toolCallId
            );
            if (contentPart) {
                contentPart.requestUserInput();
                response.fireInteractionNeeded(contentPart);
            } else {
                this.logger.warn(`No tool call content found for '${toolCallId}'; the pending interaction cannot be announced to interaction trackers.`);
            }
            response.waitForInput();
        }
        try {
            return await pending.deferred.promise;
        } finally {
            contentPart?.userInputHandled();
            response?.stopWaitingForInput();
            cancellationListener?.dispose();
            this.pendingInteractions.delete(toolCallId);
        }
    }

    protected async resolveDiffSideUri(ref: ContentRef): Promise<URI> {
        if (isEmptyContentRef(ref)) {
            return this.emptyContentUri(ref.label || '');
        }
        const resolved = resolveContentRef(ref) as PathContentRef;
        const uri = this.resolveUri(resolved);
        if (uri === undefined) {
            // No SCM provider could resolve the gitRef — surface as an actionable error.
            return this.errorContentUri(resolved.path, resolved.gitRef!);
        }
        if (await this.canResolveUri(uri)) {
            return uri;
        }
        // SCM resolved the URI but reading content failed — most commonly the file
        // simply did not exist at that revision (e.g. newly added file). Show empty.
        return this.emptyContentUri(resolved.path);
    }

    protected errorContentUri(path: string, gitRef: string): URI {
        const message = `Unable to resolve revision '${gitRef}' for '${path}'.\n\n`
            + 'No SCM provider is available to retrieve this revision. '
            + 'Ensure the Git extension is active and the repository is recognized.';
        return new URI().withScheme(MEMORY_TEXT_READONLY).withPath(path).withQuery(message);
    }

    protected refNotFoundUri(path: string, gitRef: string): URI {
        const message = `Could not load '${path}' at revision '${gitRef}'.\n\n`
            + 'The revision may not exist, or the file did not exist at that revision.';
        return new URI().withScheme(MEMORY_TEXT_READONLY).withPath(path).withQuery(message);
    }

    protected fileNotFoundUri(path: string): URI {
        const message = `Could not load '${path}'.\n\nThe file does not exist in the current workspace.`;
        return new URI().withScheme(MEMORY_TEXT_READONLY).withPath(path).withQuery(message);
    }

    protected emptyContentUri(path: string): URI {
        return new URI().withScheme(MEMORY_TEXT).withPath(path);
    }

    protected async canResolveUri(uri: URI): Promise<boolean> {
        try {
            const resource = await this.resourceProvider(uri);
            try {
                await resource.readContents();
                return true;
            } catch {
                return false;
            } finally {
                resource.dispose();
            }
        } catch {
            return false;
        }
    }
}
