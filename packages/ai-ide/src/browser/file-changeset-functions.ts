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
import { assertChatContext, ChatToolContext, FileReadTracker } from '@theia/ai-chat';
import { ChangeSet } from '@theia/ai-chat/lib/common/change-set';
import { ChangeSetElementArgs, ChangeSetFileElement, ChangeSetFileElementFactory } from '@theia/ai-chat/lib/browser/change-set-file-element';
import { ToolInvocationContext, ToolProvider, ToolRequest, ToolRequestParameters, ToolRequestParametersProperties } from '@theia/ai-core';
import { ContentReplacerV1Impl, Replacement, ContentReplacer } from '@theia/core/lib/common/content-replacer';
import { ContentReplacerV2Impl } from '@theia/core/lib/common/content-replacer-v2-impl';
import { URI } from '@theia/core/lib/common/uri';
import { inject, injectable, named, optional } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceFunctionScope } from './workspace-functions';

import { nls, ILogger, PreferenceService } from '@theia/core';
import { extractJsonStringField } from '@theia/ai-chat-ui/lib/browser/chat-response-renderer/toolcall-utils';
import {
    CLEAR_FILE_CHANGES_ID,
    GET_PROPOSED_CHANGES_ID,
    SUGGEST_FILE_CONTENT_ID,
    SUGGEST_FILE_REPLACEMENTS_ID,
    WRITE_FILE_CONTENT_ID,
    WRITE_FILE_REPLACEMENTS_ID,
    SUGGEST_FILE_REPLACEMENTS_SIMPLE_ID,
    WRITE_FILE_REPLACEMENTS_SIMPLE_ID
} from '../common/file-changeset-function-ids';
import { WRITE_CONTENT_MAX_SIZE_KB_PREF } from '../common/workspace-preferences';

/**
 * Description of the `path` parameter shared by all file changeset tools, so that they advertise the
 * same accepted forms as the read-only workspace tools.
 */
const FILE_PATH_PARAMETER_DESCRIPTION = '目标文件的路径。可以是工作区相对路径 ' +
    '（例如 "my-project/src/index.ts"）、绝对路径或 `file://` URI。' +
    '绝对路径 / URI 形式必须指向工具可访问的位置，例如 ' +
    '`ai-features.workspaceFunctions.allowedExternalPaths` 偏好中列出的目录。';

function createPathShortLabel(args: string, hasMore: boolean): { label: string; hasMore: boolean } | undefined {
    const path = extractJsonStringField(args, 'path');
    if (path) {
        return { label: path, hasMore };
    }
    return undefined;
}

/**
 * Whole-file writes from an outdated read would silently discard whatever changed in between. The replacement
 * tools need no such guard: they re-read and fail when their matched content is gone.
 */
function staleFileError(path: string): string {
    return `File ${path} changed since you last read it. Read it again before overwriting it, so that the changes made in the meantime are not lost.`;
}

const DEFAULT_WRITE_CONTENT_MAX_SIZE_KB = 256;

function getWriteContentMaxSizeKB(preferenceService: PreferenceService): number {
    return preferenceService.get<number>(WRITE_CONTENT_MAX_SIZE_KB_PREF, DEFAULT_WRITE_CONTENT_MAX_SIZE_KB);
}

/**
 * Whole-file writes require the model to re-emit the entire content as tool arguments, so their cost grows
 * with file size; mirror the read-side limit and steer oversized writes to the replacement-based tools.
 * The check only runs once the arguments have been generated, so it blocks the write and steers retries;
 * stating the limit in the tool description is what lets the model avoid the oversized call up front.
 *
 * @returns the error to report, or `undefined` if the content is within the limit.
 */
function writeContentSizeError(content: string, maxSizeKB: number, fileExists: boolean, replacementsToolId: string): string | undefined {
    const sizeKB = Math.round(Buffer.byteLength(content, 'utf8') / 1024);
    if (sizeKB <= maxSizeKB) {
        return undefined;
    }
    // The replacement tools edit existing content, so a new file has to be created small first.
    const hint = fileExists
        ? `Use ${replacementsToolId} for targeted edits`
        : `Create the file with a smaller initial part, then add the rest with ${replacementsToolId}`;
    return `The provided content is ${sizeKB}KB, but the maximum write size is ${maxSizeKB}KB ` +
        `(preference "${WRITE_CONTENT_MAX_SIZE_KB_PREF}"). ${hint}, ` +
        'or avoid embedding large data in the file and reference it by path instead.';
}

export const FileChangeSetTitleProvider = Symbol('FileChangeSetTitleProvider');

export interface FileChangeSetTitleProvider {
    getChangeSetTitle(ctx: ChatToolContext): string;
}

/**
 * Snapshot of the on-disk content taken when the change-set element is created, so the recorded
 * "state before the AI change" survives even if the element is serialized before its lazy
 * initialization got around to reading the file (e.g. after an immediate apply).
 */
async function readOriginalState(fileService: FileService, uri: URI, exists: boolean): Promise<string | undefined> {
    if (!exists) {
        return undefined;
    }
    try {
        return (await fileService.read(uri)).value.toString();
    } catch {
        return undefined;
    }
}

@injectable()
export class SuggestFileContent implements ToolProvider {
    static ID = SUGGEST_FILE_CONTENT_ID;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceFunctionScope: WorkspaceFunctionScope;

    @inject(FileService)
    fileService: FileService;

    @inject(ChangeSetFileElementFactory)
    protected readonly fileChangeFactory: ChangeSetFileElementFactory;

    @inject(FileChangeSetTitleProvider)
    protected readonly fileChangeSetTitleProvider: FileChangeSetTitleProvider;

    /** Optional: the guard is advisory, so containers without a tracker still get a working tool. */
    @inject(FileReadTracker) @optional()
    protected readonly fileReadTracker: FileReadTracker | undefined;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    getTool(): ToolRequest {
        const preferenceService = this.preferenceService;
        return {
            id: SuggestFileContent.ID,
            name: SuggestFileContent.ID,
            // A getter, because the registry keeps the tool from startup while the limit is a live preference.
            get description(): string {
                return `提议向文件写入完整内容，供用户审阅。如果文件存在，将用提供的内容覆盖。
             如果文件不存在，将创建该文件。此工具会自动创建写文件所需的任何目录。
             如果新内容为空，文件将被删除。要移动文件，请先删除再在新位置重新创建。
             提议的变更将在用户接受时应用。如果对同一文件再次调用，先前提议的变更将被覆盖。
             用于创建新文件或需要重写整个文件的场景。
             对现有文件做局部修改时，请优先使用 suggestFileReplacements——它更高效，diff 也更清晰。
             超过 ${getWriteContentMaxSizeKB(preferenceService)}KB 的内容会被拒绝。`;
            },
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: FILE_PATH_PARAMETER_DESCRIPTION
                    },
                    content: {
                        type: 'string',
                        description: `要写入文件的完整内容。必须包含文件的所有部分，即使未修改的部分也不例外。
                         不要截断或省略任何段落。使用空字符串 "" 可删除文件。`
                    }
                },
                required: ['path', 'content']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const { path, content } = JSON.parse(args);
                const chatSessionId = ctx.request.session.id;
                let uri: URI;
                try {
                    uri = await this.workspaceFunctionScope.resolveAccessiblePath(path);
                } catch (error) {
                    return JSON.stringify({ error: error.message });
                }
                if (await this.fileReadTracker?.isStale(chatSessionId, uri)) {
                    return JSON.stringify({ error: staleFileError(path) });
                }
                const exists = await this.fileService.exists(uri);
                const sizeError = writeContentSizeError(content, getWriteContentMaxSizeKB(this.preferenceService), exists, SUGGEST_FILE_REPLACEMENTS_ID);
                if (sizeError) {
                    return JSON.stringify({ error: sizeError });
                }
                let type: ChangeSetElementArgs['type'] = 'modify';
                if (content === '') {
                    type = 'delete';
                }
                if (!exists) {
                    type = 'add';
                }
                ctx.request.session.changeSet.addElements(
                    this.fileChangeFactory({
                        uri: uri,
                        type,
                        state: 'pending',
                        targetState: content,
                        originalState: await readOriginalState(this.fileService, uri, exists),
                        requestId: ctx.request.id,
                        chatSessionId
                    })
                );

                ctx.request.session.changeSet.setTitle(this.fileChangeSetTitleProvider.getChangeSetTitle(ctx));
                return `Proposed writing to file ${path}. The user will review and potentially apply the changes`;
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class WriteFileContent implements ToolProvider {
    static ID = WRITE_FILE_CONTENT_ID;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceFunctionScope: WorkspaceFunctionScope;

    @inject(FileService)
    fileService: FileService;

    @inject(ChangeSetFileElementFactory)
    protected readonly fileChangeFactory: ChangeSetFileElementFactory;

    @inject(FileChangeSetTitleProvider)
    protected readonly fileChangeSetTitleProvider: FileChangeSetTitleProvider;

    /** Optional: the guard is advisory, so containers without a tracker still get a working tool. */
    @inject(FileReadTracker) @optional()
    protected readonly fileReadTracker: FileReadTracker | undefined;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    getTool(): ToolRequest {
        const preferenceService = this.preferenceService;
        return {
            id: WriteFileContent.ID,
            name: WriteFileContent.ID,
            // A getter, because the registry keeps the tool from startup while the limit is a live preference.
            get description(): string {
                return `立即向文件写入完整内容，无需用户确认。如果文件存在，将被覆盖。
             如果文件不存在，将创建该文件。此工具会自动创建写文件所需的任何目录。
             如果新内容为空，文件将被删除。要移动文件，请先删除再在新位置重新创建。
             用于代理模式下创建新文件或完全重写文件。
             局部修改请优先使用 writeFileReplacements——它更高效且更不易出错。
             绝不在并行的工具调用中写同一个文件。
             超过 ${getWriteContentMaxSizeKB(preferenceService)}KB 的内容会被拒绝。
             注意：变更会立即应用，无法通过聊天界面撤销。`;
            },
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: FILE_PATH_PARAMETER_DESCRIPTION
                    },
                    content: {
                        type: 'string',
                        description: `要写入文件的完整内容。必须包含文件的所有部分，即使未修改的部分也不例外。
                         不要截断或省略任何段落。使用空字符串 "" 可删除文件。`
                    }
                },
                required: ['path', 'content']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const { path, content } = JSON.parse(args);
                const chatSessionId = ctx.request.session.id;
                let uri: URI;
                try {
                    uri = await this.workspaceFunctionScope.resolveAccessiblePath(path);
                } catch (error) {
                    return JSON.stringify({ error: error.message });
                }
                if (await this.fileReadTracker?.isStale(chatSessionId, uri)) {
                    return JSON.stringify({ error: staleFileError(path) });
                }
                const exists = await this.fileService.exists(uri);
                const sizeError = writeContentSizeError(content, getWriteContentMaxSizeKB(this.preferenceService), exists, WRITE_FILE_REPLACEMENTS_ID);
                if (sizeError) {
                    return JSON.stringify({ error: sizeError });
                }
                let type = 'modify';
                if (content === '') {
                    type = 'delete';
                }
                if (!exists) {
                    type = 'add';
                }

                const fileElement = this.fileChangeFactory({
                    uri: uri,
                    type: type as 'modify' | 'add' | 'delete',
                    state: 'pending',
                    targetState: content,
                    originalState: await readOriginalState(this.fileService, uri, exists),
                    requestId: ctx.request.id,
                    chatSessionId
                });

                ctx.request.session.changeSet.setTitle(this.fileChangeSetTitleProvider.getChangeSetTitle(ctx));
                ctx.request.session.changeSet.addElements(fileElement);

                try {
                    await fileElement.apply();
                    return `Successfully wrote content to file ${path}.`;
                } catch (error) {
                    return `Failed to write content to file ${path}: ${error.message}`;
                }
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class ReplaceContentInFileFunctionHelper {
    @inject(WorkspaceFunctionScope)
    protected readonly workspaceFunctionScope: WorkspaceFunctionScope;

    @inject(FileService)
    fileService: FileService;

    @inject(ChangeSetFileElementFactory)
    protected readonly fileChangeFactory: ChangeSetFileElementFactory;

    @inject(FileChangeSetTitleProvider)
    protected readonly fileChangeSetTitleProvider: FileChangeSetTitleProvider;

    @inject(ILogger) @named('ai-ide:ReplaceContentInFileFunctionHelper')
    protected readonly logger: ILogger;

    private replacer: ContentReplacer;

    constructor() {
        this.replacer = new ContentReplacerV1Impl();
    }

    protected setReplacer(replacer: ContentReplacer): void {
        this.replacer = replacer;
    }

    getToolMetadata(supportMultipleReplace: boolean = false, immediateApplication: boolean = false): { description: string, parameters: ToolRequestParameters } {
        const replacementProperties: ToolRequestParametersProperties = {
            oldContent: {
                type: 'string',
                description: '要被替换的确切内容。必须完全匹配，包括空白字符、注释等。'
            },
            newContent: {
                type: 'string',
                description: '替换匹配到的旧内容时插入的新内容。'
            }
        };

        if (supportMultipleReplace) {
            replacementProperties.multiple = {
                type: 'boolean',
                description: '如果预期替换 oldContent 的多个匹配处，请设为 true。'
            };
        }
        const replacementParameters = {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: FILE_PATH_PARAMETER_DESCRIPTION + ' 必须先用 getFileContent 读取该文件。'
                },
                replacements: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: replacementProperties,
                        required: ['oldContent', 'newContent']
                    },
                    description: '替换对象数组，每个对象包含 oldContent 和 newContent 字符串。'
                },
                reset: {
                    type: 'boolean',
                    description: '设为 true 可清除该文件已有的全部挂起变更并重新开始。默认为 false，即与已有变更合并。'
                }
            },
            required: ['path', 'replacements']
        } as ToolRequestParameters;

        const replacementSentence = supportMultipleReplace
            ? '默认情况下，每组元组中的旧内容应只被替换一次。如果可选的 \'multiple\' 标志设为 true，将替换所有匹配处。\
             无论哪种情况，如果文件中匹配处数量与预期不符，函数都会返回错误。\
             此时请换一种方式。'
            : '每组元组中的旧内容应只被替换一次。如果文件中匹配处数量与预期不符，\
              函数会返回错误。此时请换一种方式。';

        const applicationText = immediateApplication
            ? '变更将立即应用，无需用户确认。'
            : '提议的变更将在用户接受时应用。';

        const replacementDescription = `提议替换现有文件中的内容片段，需提供一个元组列表，其中包含要匹配和替换的旧内容。
            ${replacementSentence}。删除内容时，请在元组中使用空的新内容。
            确保使用与原文件内容相同的行尾和空白字符。${applicationText}
            对同一文件的多次调用会合并替换结果，除非 reset 参数设为 true。需要时可使用 reset 参数清除之前的变更并
            重新开始。

            重要：每个 oldContent 必须完全匹配（包括空白字符和缩进）。
            如果替换失败并提示 "Expected 1 occurrence but found 0"：请重新读取文件，内容可能已变化或空白字符不一致。
            如果替换失败并提示 "found 2+"：请在 oldContent 中加入更多上下文使其唯一。
            做替换前，务必先用 getFileContent 读取文件当前状态。`;

        return {
            description: replacementDescription,
            parameters: replacementParameters
        };
    }

    async createChangesetFromToolCall(toolCallString: string, ctx: ChatToolContext): Promise<string> {
        try {
            if (ctx.cancellationToken?.isCancellationRequested) {
                return JSON.stringify({ error: 'Operation cancelled by user' });
            }

            const result = await this.processReplacementsCommon(toolCallString, ctx, this.fileChangeSetTitleProvider.getChangeSetTitle(ctx));

            if (result.errors.length > 0) {
                return `Errors encountered: ${result.errors.join('; ')}`;
            }

            if (result.fileElement) {
                const action = result.reset ? 'reset and applied' : 'applied';
                return `Proposed replacements ${action} to file ${result.path}. The user will review and potentially apply the changes.`;
            } else {
                return `No changes needed for file ${result.path}. Content already matches the requested state.`;
            }
        } catch (error) {
            this.logger.debug('Error processing replacements:', error.message);
            return JSON.stringify({ error: error.message });
        }
    }

    async writeChangesetFromToolCall(toolCallString: string, ctx: ChatToolContext): Promise<string> {
        try {
            if (ctx.cancellationToken?.isCancellationRequested) {
                return JSON.stringify({ error: 'Operation cancelled by user' });
            }

            const result = await this.processReplacementsCommon(toolCallString, ctx, this.fileChangeSetTitleProvider.getChangeSetTitle(ctx));

            if (result.errors.length > 0) {
                return `Errors encountered: ${result.errors.join('; ')}`;
            }

            if (result.fileElement) {
                await result.fileElement.apply();

                const action = result.reset ? 'reset and' : '';
                return `Successfully ${action} applied replacements to file ${result.path}.`;
            } else {
                return `No changes needed for file ${result.path}. Content already matches the requested state.`;
            }
        } catch (error) {
            this.logger.debug('Error processing replacements:', error.message);
            return JSON.stringify({ error: error.message });
        }
    }

    private async processReplacementsCommon(
        toolCallString: string,
        ctx: ChatToolContext,
        changeSetTitle: string
    ): Promise<{ fileElement: ChangeSetFileElement | undefined, path: string, reset: boolean, errors: string[] }> {
        if (ctx.cancellationToken?.isCancellationRequested) {
            throw new Error('Operation cancelled by user');
        }

        const { path, replacements, reset } = JSON.parse(toolCallString) as { path: string, replacements: Replacement[], reset?: boolean };
        const fileUri = await this.workspaceFunctionScope.resolveAccessiblePath(path);

        let startingContent: string;
        if (reset || !ctx.request.session.changeSet) {
            startingContent = (await this.fileService.read(fileUri)).value.toString();
        } else {
            const existingElement = this.findExistingChangeElement(ctx.request.session.changeSet, fileUri);
            if (existingElement) {
                startingContent = existingElement.targetState || (await this.fileService.read(fileUri)).value.toString();
            } else {
                startingContent = (await this.fileService.read(fileUri)).value.toString();
            }
        }

        if (ctx.cancellationToken?.isCancellationRequested) {
            throw new Error('Operation cancelled by user');
        }

        const { updatedContent, errors } = this.replacer.applyReplacements(startingContent, replacements);

        if (errors.length > 0) {
            return { fileElement: undefined, path, reset: reset || false, errors };
        }

        const originalContent = (await this.fileService.read(fileUri)).value.toString();
        if (updatedContent !== originalContent) {
            ctx.request.session.changeSet.setTitle(changeSetTitle);

            const fileElement = this.fileChangeFactory({
                uri: fileUri,
                type: 'modify',
                state: 'pending',
                targetState: updatedContent,
                originalState: originalContent,
                requestId: ctx.request.id,
                chatSessionId: ctx.request.session.id
            });

            ctx.request.session.changeSet.addElements(fileElement);

            return { fileElement, path, reset: reset || false, errors: [] };
        } else {
            return { fileElement: undefined, path, reset: reset || false, errors: [] };
        }
    }

    private findExistingChangeElement(changeSet: ChangeSet, fileUri: URI): ChangeSetFileElement | undefined {
        const element = changeSet.getElementByURI(fileUri);
        if (element instanceof ChangeSetFileElement) {
            return element;
        }
    }

    async clearFileChanges(path: string, ctx: ChatToolContext): Promise<string> {
        try {
            if (ctx.cancellationToken?.isCancellationRequested) {
                return JSON.stringify({ error: 'Operation cancelled by user' });
            }

            const fileUri = await this.workspaceFunctionScope.resolveAccessiblePath(path);
            if (ctx.request.session.changeSet.removeElements(fileUri)) {
                return `Cleared pending change(s) for file ${path}.`;
            } else {
                return `No pending changes found for file ${path}.`;
            }
        } catch (error) {
            this.logger.debug('Error clearing file changes:', error.message);
            return JSON.stringify({ error: error.message });
        }
    }

    async getProposedFileState(path: string, ctx: ChatToolContext): Promise<string> {
        try {
            if (ctx.cancellationToken?.isCancellationRequested) {
                return JSON.stringify({ error: 'Operation cancelled by user' });
            }

            const fileUri = await this.workspaceFunctionScope.resolveAccessiblePath(path);

            if (!ctx.request.session.changeSet) {
                const originalContent = (await this.fileService.read(fileUri)).value.toString();
                return `File ${path} has no pending changes. Original content:\n\n${originalContent}`;
            }

            const existingElement = this.findExistingChangeElement(ctx.request.session.changeSet, fileUri);
            if (existingElement && existingElement.targetState) {
                return `File ${path} has pending changes. Proposed content:\n\n${existingElement.targetState}`;
            } else {
                const originalContent = (await this.fileService.read(fileUri)).value.toString();
                return `File ${path} has no pending changes. Original content:\n\n${originalContent}`;
            }
        } catch (error) {
            this.logger.debug('Error getting proposed file state:', error.message);
            return JSON.stringify({ error: error.message });
        }
    }
}

@injectable()
export class SimpleSuggestFileReplacements implements ToolProvider {
    static ID = 'simpleSuggestFileReplacements';
    @inject(ReplaceContentInFileFunctionHelper)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelper;

    getTool(): ToolRequest {
        const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata();
        return {
            id: SimpleSuggestFileReplacements.ID,
            name: SimpleSuggestFileReplacements.ID,
            description: metadata.description,
            parameters: metadata.parameters,
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                return this.replaceContentInFileFunctionHelper.createChangesetFromToolCall(args, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class SimpleWriteFileReplacements implements ToolProvider {
    static ID = 'simpleWriteFileReplacements';
    @inject(ReplaceContentInFileFunctionHelper)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelper;

    getTool(): ToolRequest {
        const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata(false, true);
        return {
            id: SimpleWriteFileReplacements.ID,
            name: SimpleWriteFileReplacements.ID,
            description: metadata.description,
            parameters: metadata.parameters,
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                return this.replaceContentInFileFunctionHelper.writeChangesetFromToolCall(args, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class SuggestFileReplacements_Simple implements ToolProvider {
    static ID = SUGGEST_FILE_REPLACEMENTS_SIMPLE_ID;
    @inject(ReplaceContentInFileFunctionHelper)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelper;

    getTool(): ToolRequest {
        const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata(true);
        return {
            id: SuggestFileReplacements_Simple.ID,
            name: SuggestFileReplacements_Simple.ID,
            description: metadata.description,
            parameters: metadata.parameters,
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                return this.replaceContentInFileFunctionHelper.createChangesetFromToolCall(args, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

/**
 * Legacy WriteFileReplacements implementation using V1 content replacer.
 * @deprecated Use WriteFileReplacements instead which uses the improved V2 implementation.
 */
@injectable()
export class WriteFileReplacements_Simple implements ToolProvider {
    static ID = WRITE_FILE_REPLACEMENTS_SIMPLE_ID;
    @inject(ReplaceContentInFileFunctionHelper)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelper;

    getTool(): ToolRequest {
        const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata(true, true);
        return {
            id: WriteFileReplacements_Simple.ID,
            name: WriteFileReplacements_Simple.ID,
            description: metadata.description,
            parameters: metadata.parameters,
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                return this.replaceContentInFileFunctionHelper.writeChangesetFromToolCall(args, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class ClearFileChanges implements ToolProvider {
    static ID = CLEAR_FILE_CHANGES_ID;
    @inject(ReplaceContentInFileFunctionHelper)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelper;

    getTool(): ToolRequest {
        return {
            id: ClearFileChanges.ID,
            name: ClearFileChanges.ID,
            description: '清除某个文件所有尚未应用的挂起变更，让你可以重新开始新的修改。' +
                '当之前的替换尝试失败、想换一种方案时使用。' +
                '不影响已应用的变更或磁盘上的实际文件。',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: FILE_PATH_PARAMETER_DESCRIPTION
                    }
                },
                required: ['path']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const { path } = JSON.parse(args);
                return this.replaceContentInFileFunctionHelper.clearFileChanges(path, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, false),
        };
    }
}

@injectable()
export class GetProposedFileState implements ToolProvider {
    static ID = GET_PROPOSED_CHANGES_ID;
    @inject(ReplaceContentInFileFunctionHelper)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelper;

    getTool(): ToolRequest {
        return {
            id: GET_PROPOSED_CHANGES_ID,
            name: GET_PROPOSED_CHANGES_ID,
            description: '返回文件当前的建议状态，包括所有已提议 ' +
                '但尚未应用的挂起变更。用它查看你的变更应用后文件的样子。' +
                '做增量修改时可用于确认累积状态是否正确。' +
                '如果该文件没有挂起变更，则返回原始文件内容。',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: FILE_PATH_PARAMETER_DESCRIPTION
                    }
                },
                required: ['path']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const { path } = JSON.parse(args);
                return this.replaceContentInFileFunctionHelper.getProposedFileState(path, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, false),
        };
    }
}

@injectable()
export class ReplaceContentInFileFunctionHelperV2 extends ReplaceContentInFileFunctionHelper {
    constructor() {
        super();
        this.setReplacer(new ContentReplacerV2Impl());
    }
}

@injectable()
export class SuggestFileReplacements implements ToolProvider {
    static ID = SUGGEST_FILE_REPLACEMENTS_ID;

    @inject(ReplaceContentInFileFunctionHelperV2)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelperV2;

    getTool(): ToolRequest {
        const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata(true);
        return {
            id: SuggestFileReplacements.ID,
            name: SuggestFileReplacements.ID,
            description: `提议替换现有文件中的内容片段，需提供一个替换列表。
            每个替换由要匹配的 oldContent 和插入到原位置的 newContent 组成。
            默认情况下，每个 oldContent 应只出现一次。如果 'multiple' 标志设为 true，将替换所有匹配处。
            删除内容时，请使用空的 newContent。
            提议的变更将在用户接受时应用。
            对同一文件的多次调用会合并替换结果，除非 reset 参数设为 true。

            重要：每个 oldContent 必须在文件中恰好出现一次（除非 'multiple' 为 true）。
            如果看到 "Expected 1 occurrence but found X" 错误：
            - 找到 0 处：内容不存在、空白字符/缩进不同，或文件已变化。请先重新读取文件。
            - 找到 2 处及以上：在 oldContent 中加入更多上下文行使其唯一。
            常见错误：缺少/多余的行尾换行、缩进错误、内容过时。
            尝试替换前，务必先用 getFileContent 读取文件。`,
            parameters: metadata.parameters,
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                return this.replaceContentInFileFunctionHelper.createChangesetFromToolCall(args, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class WriteFileReplacements implements ToolProvider {
    static ID = WRITE_FILE_REPLACEMENTS_ID;

    @inject(ReplaceContentInFileFunctionHelperV2)
    protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelperV2;

    getTool(): ToolRequest {
        const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata(true, true);
        return {
            id: WriteFileReplacements.ID,
            name: WriteFileReplacements.ID,
            description: `立即替换现有文件中的内容片段——变更会直接写入磁盘，无需用户确认。
            每个替换由要匹配的 oldContent 和插入到原位置的 newContent 组成。
            默认情况下，每个 oldContent 应只出现一次。如果 'multiple' 标志设为 true，将替换所有匹配处。
            删除内容时，请使用空的 newContent。
            确保使用与原文件内容相同的行尾和空白字符。
            对同一文件的多次调用会合并替换结果，除非 reset 参数设为 true。

            重要：每个 oldContent 必须在文件中恰好出现一次（除非 'multiple' 为 true）。
            如果看到 "Expected 1 occurrence but found X" 错误：
            - 找到 0 处：内容不存在、空白字符/缩进不同，或文件已变化。请先重新读取文件。
            - 找到 2 处及以上：在 oldContent 中加入更多上下文行使其唯一。
            常见错误：缺少/多余的行尾换行、缩进错误、内容过时。
            尝试替换前，务必先用 getFileContent 读取文件。
            绝不在并行的工具调用中写同一个文件。对一个文件多次编辑后，请重新读取以核实结果。`,
            parameters: metadata.parameters,
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                return this.replaceContentInFileFunctionHelper.writeChangesetFromToolCall(args, ctx);
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

@injectable()
export class DefaultFileChangeSetTitleProvider implements FileChangeSetTitleProvider {
    getChangeSetTitle(_ctx: ChatToolContext): string {
        return nls.localize('theia/ai-chat/fileChangeSetTitle', '建议的更改');
    }
}
