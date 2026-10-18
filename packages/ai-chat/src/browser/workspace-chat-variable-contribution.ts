// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-v2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { AIVariableContext, AIVariableResolutionRequest } from '@theia/ai-core';
import { AIVariableCompletionContext, FrontendVariableService } from '@theia/ai-core/lib/browser';
import { CancellationToken, nls, Path, QuickInputService, QuickPickItem, URI } from '@theia/core';
import { codiconArray } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as monaco from '@theia/monaco-editor-core';
import { FileQuickPickItem, QuickFileSelectService } from '@theia/file-search/lib/browser/quick-file-select-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import {
    AIVariable,
    AIVariableContribution,
    AIVariableResolver,
    ResolvedAIContextVariable
} from '@theia/ai-core/lib/common/variable-service';
import { VARIABLE_ADD_CONTEXT_COMMAND } from './ai-chat-frontend-contribution';

export const WORKSPACE_VARIABLE: AIVariable = {
    id: 'workspace-overview',
    description: nls.localize('theia/ai/chat/workspaceVariable/description', '工作区目录结构概览'),
    name: 'workspace',
    label: nls.localizeByDefault('工作区'),
    iconClasses: codiconArray('root-folder'),
    isContextVariable: true
};

export const FOLDER_VARIABLE: AIVariable = {
    id: 'folder-provider',
    description: nls.localize('theia/ai/chat/folderVariable/description', '解析文件夹的目录结构'),
    name: 'folder',
    label: nls.localizeByDefault('文件夹'),
    iconClasses: codiconArray('folder'),
    isContextVariable: true,
    args: [{
        name: 'path',
        description: nls.localize('theia/ai/chat/folderVariable/path/description', '文件夹的工作区相对路径。')
    }]
};

/** 目录树行数上限：概览用途，超出即截断并注明，避免撑爆上下文。 */
const MAX_TREE_ENTRIES = 500;

/**
 * Provides the `#workspace` and `#folder:<路径>` context variables, both resolving to an
 * indented directory listing so the model can navigate the project layout without reading
 * every single file.
 */
@injectable()
export class WorkspaceChatVariableContribution implements AIVariableContribution, AIVariableResolver {

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(WorkspaceService)
    protected readonly wsService: WorkspaceService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    @inject(QuickFileSelectService)
    protected readonly quickFileSelectService: QuickFileSelectService;

    registerVariables(service: FrontendVariableService): void {
        service.registerResolver(WORKSPACE_VARIABLE, this);
        service.registerResolver(FOLDER_VARIABLE, this);
        service.registerArgumentPicker(FOLDER_VARIABLE, this.pickFolderArgument.bind(this));
        service.registerArgumentCompletionProvider(FOLDER_VARIABLE, this.provideFolderCompletions.bind(this));
    }

    async canResolve(request: AIVariableResolutionRequest, _: AIVariableContext): Promise<number> {
        if (request.variable.name === WORKSPACE_VARIABLE.name || request.variable.name === FOLDER_VARIABLE.name) {
            return 1;
        }
        return 0;
    }

    async resolve(request: AIVariableResolutionRequest, _: AIVariableContext): Promise<ResolvedAIContextVariable | undefined> {
        if (request.variable.name === WORKSPACE_VARIABLE.name) {
            return this.resolveWorkspace(request);
        }
        if (request.variable.name === FOLDER_VARIABLE.name) {
            return this.resolveFolder(request);
        }
        return undefined;
    }

    protected async resolveWorkspace(request: AIVariableResolutionRequest): Promise<ResolvedAIContextVariable | undefined> {
        const roots = this.wsService.tryGetRoots();
        if (roots.length === 0) {
            return undefined;
        }
        const sections: string[] = [];
        let truncated = false;
        for (const root of roots) {
            const label = this.wsService.getRootPrefixedPath(root.resource) ?? root.resource.path.base;
            const tree = await this.buildTree(root.resource, 2);
            truncated = truncated || tree.truncated;
            sections.push(`${label}\n${tree.text}`);
        }
        return {
            variable: request.variable,
            value: nls.localizeByDefault('工作区'),
            contextValue: this.withTruncationNote(sections.join('\n\n'), truncated)
        };
    }

    protected async resolveFolder(request: AIVariableResolutionRequest): Promise<ResolvedAIContextVariable | undefined> {
        const uri = await this.resolveFolderUri(request.arg);
        if (!uri) {
            return undefined;
        }
        const label = this.wsService.getRootPrefixedPath(uri) ?? uri.path.toString();
        const tree = await this.buildTree(uri, 3);
        return {
            variable: request.variable,
            value: label,
            contextValue: this.withTruncationNote(`${label}\n${tree.text}`, tree.truncated)
        };
    }

    /** Resolves a workspace-relative or absolute folder argument, mirroring the file variable's path handling. */
    protected async resolveFolderUri(arg: string | undefined): Promise<URI | undefined> {
        if (!arg) {
            return undefined;
        }
        const normalized = Path.normalizePathSeparator(arg);
        const path = new Path(normalized);
        const candidates: URI[] = [];
        if (path.isAbsolute) {
            candidates.push(new URI(normalized));
        } else {
            const segments = normalized.split('/');
            const potentialRoot = segments[0];
            for (const root of this.wsService.tryGetRoots()) {
                if (root.resource.path.base === potentialRoot) {
                    const rest = segments.slice(1).join('/');
                    candidates.push(rest ? root.resource.resolve(rest) : root.resource);
                }
            }
            for (const root of this.wsService.tryGetRoots()) {
                candidates.push(root.resource.resolve(path));
            }
        }
        for (const candidate of candidates) {
            if (await this.fileService.exists(candidate)) {
                return candidate;
            }
        }
        return undefined;
    }

    protected async buildTree(root: URI, maxDepth: number): Promise<{ text: string, truncated: boolean }> {
        const lines: string[] = [];
        let truncated = false;
        const walk = async (current: URI, depth: number): Promise<void> => {
            if (truncated) {
                return;
            }
            let stat;
            try {
                stat = await this.fileService.resolve(current);
            } catch {
                return;
            }
            const children = [...(stat.children ?? [])].sort((a, b) =>
                a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : (a.isDirectory ? -1 : 1));
            for (const child of children) {
                if (lines.length >= MAX_TREE_ENTRIES) {
                    truncated = true;
                    return;
                }
                lines.push(`${'  '.repeat(depth)}${child.isDirectory ? child.name + '/' : child.name}`);
                if (child.isDirectory && depth + 1 < maxDepth) {
                    await walk(child.resource, depth + 1);
                    if (truncated) {
                        return;
                    }
                }
            }
        };
        await walk(root, 0);
        return { text: lines.join('\n'), truncated };
    }

    protected withTruncationNote(text: string, truncated: boolean): string {
        return truncated
            ? text + '\n' + nls.localize('theia/ai/chat/workspaceVariable/truncated', '（目录条目超过 {0}，已截断）', String(MAX_TREE_ENTRIES))
            : text;
    }

    protected async pickFolderArgument(): Promise<string | undefined> {
        const quickPick = this.quickInputService.createQuickPick();
        quickPick.placeholder = nls.localize('theia/ai/chat/folderPickerPlaceholder', '输入以筛选文件夹');
        quickPick.items = await this.listFolderPicks('');
        const listener = quickPick.onDidChangeValue(async (value: string) => {
            quickPick.items = await this.listFolderPicks(value);
        });
        quickPick.show();
        return new Promise(resolve => {
            quickPick.onDispose(listener.dispose);
            quickPick.onDidAccept(() => {
                const selected = quickPick.selectedItems[0] as FolderQuickPickItem | undefined;
                if (selected?.folderPath) {
                    quickPick.dispose();
                    resolve(selected.folderPath);
                }
            });
        });
    }

    protected async listFolderPicks(filter: string): Promise<FolderQuickPickItem[]> {
        const picks = await this.quickFileSelectService.getPicks(filter, CancellationToken.None);
        const dirs = new Map<string, string>(); // label → root-prefixed path
        for (const pick of picks) {
            if (!FileQuickPickItem.is(pick)) {
                continue;
            }
            const parent = pick.uri.parent;
            const folderPath = this.wsService.getRootPrefixedPath(parent);
            if (folderPath) {
                dirs.set(folderPath, folderPath);
            }
        }
        return [...dirs.values()].map(folderPath => ({
            label: folderPath,
            description: nls.localizeByDefault('文件夹'),
            iconClasses: codiconArray('folder'),
            folderPath
        }));
    }

    protected async provideFolderCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        matchString?: string
    ): Promise<monaco.languages.CompletionItem[] | undefined> {
        const context = AIVariableCompletionContext.get(FOLDER_VARIABLE.name, model, position, matchString);
        if (!context) {
            return undefined;
        }
        const { userInput, range, prefix } = context;
        const picks = await this.listFolderPicks(userInput);
        return picks.map((pick, index) => ({
            label: pick.folderPath,
            kind: monaco.languages.CompletionItemKind.Folder,
            range,
            insertText: `${prefix}${pick.folderPath}`,
            filterText: userInput,
            sortText: `ZZ${index.toString().padStart(4, '0')}_${pick.folderPath}`,
            command: {
                title: VARIABLE_ADD_CONTEXT_COMMAND.label!,
                id: VARIABLE_ADD_CONTEXT_COMMAND.id,
                arguments: [FOLDER_VARIABLE.name, pick.folderPath]
            }
        }));
    }
}

interface FolderQuickPickItem extends QuickPickItem {
    folderPath: string;
}
