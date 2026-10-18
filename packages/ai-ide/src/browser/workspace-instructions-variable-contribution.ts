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

import {
    AIVariable, AIVariableContext, AIVariableContribution, AIVariableResolutionRequest, AIVariableResolver, AIVariableService, ResolvedAIVariable
} from '@theia/ai-core/lib/common';
import { MaybePromise, nls, URI } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangeType, FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';

/**
 * Instruction file names looked up at each workspace root, in order of precedence.
 * Only the first match per root is used, mirroring the convention of other agents.
 */
export const WORKSPACE_INSTRUCTION_FILE_NAMES = ['AGENTS.md', 'AGENT.md', 'CLAUDE.md'] as const;

/** Total budget for instruction file contents, in characters. */
export const WORKSPACE_INSTRUCTIONS_MAX_TOTAL_CHARS = 32 * 1024;

export const WORKSPACE_INSTRUCTIONS_VARIABLE: AIVariable = {
    id: 'workspace-instructions',
    name: 'workspaceInstructions',
    description: nls.localize('theia/ai/ide/workspaceInstructionsVariable/description',
        '当前工作区的项目指令文件（AGENTS.md/AGENT.md/CLAUDE.md）内容，自动附加到系统提示词。')
};

/**
 * Collects the user-authored instruction files of the current workspace so that they can be
 * injected into agent system prompts (via the `workspace-instructions` prompt fragment).
 *
 * Per workspace root, only the first existing file of {@link WORKSPACE_INSTRUCTION_FILE_NAMES}
 * is used; multi-root workspaces get one section per root that has such a file. Contents are
 * cached and invalidated through file change events, so editing an instruction file takes
 * effect on the next request without a reload.
 */
@injectable()
export class WorkspaceInstructionsVariableContribution implements AIVariableContribution, AIVariableResolver {

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    /** Resolved instruction file URI per workspace root, and cached contents per file URI. */
    protected readonly cachedEntries = new Map<string, string | undefined>();
    protected readonly cachedRoots: URI[] = [];

    @postConstruct()
    protected init(): void {
        this.fileService.onDidFilesChange(event => this.invalidate(event));
        this.workspaceService.onWorkspaceChanged(() => this.cachedRoots.length = 0);
    }

    registerVariables(service: AIVariableService): void {
        service.registerResolver(WORKSPACE_INSTRUCTIONS_VARIABLE, this);
    }

    canResolve(request: AIVariableResolutionRequest, context: AIVariableContext): MaybePromise<number> {
        return request.variable.name === WORKSPACE_INSTRUCTIONS_VARIABLE.name ? 1 : 0;
    }

    async resolve(request: AIVariableResolutionRequest, context: AIVariableContext): Promise<ResolvedAIVariable | undefined> {
        if (request.variable.name !== WORKSPACE_INSTRUCTIONS_VARIABLE.name) {
            return undefined;
        }
        return { variable: request.variable, value: await this.collectInstructions() };
    }

    protected invalidate(event: FileChangesEvent): void {
        for (const uri of this.cachedEntries.keys()) {
            if (event.contains(new URI(uri), FileChangeType.UPDATED) || event.contains(new URI(uri), FileChangeType.DELETED)) {
                this.cachedEntries.delete(uri);
            }
        }
    }

    protected async collectInstructions(): Promise<string> {
        const sections: string[] = [];
        let remaining = WORKSPACE_INSTRUCTIONS_MAX_TOTAL_CHARS;
        for (const root of this.getWorkspaceRoots()) {
            const fileUri = await this.findInstructionFile(root);
            if (!fileUri) {
                continue;
            }
            const content = await this.readCached(fileUri);
            if (content === undefined) {
                continue;
            }
            const label = root.path.base || root.toString();
            if (content.length > remaining) {
                sections.push(this.buildSection(label, fileUri, content.substring(0, remaining)
                    + '\n[... 文件超出总大小限制，已截断 ...]'));
                remaining = 0;
                break;
            }
            sections.push(this.buildSection(label, fileUri, content));
            remaining -= content.length;
        }
        if (sections.length === 0) {
            return '';
        }
        return '## Workspace Instructions\n\n'
            + 'The user authored the following instructions for this workspace. '
            + 'Follow them wherever they do not conflict with your core instructions.\n\n'
            + sections.join('\n\n');
    }

    protected buildSection(rootLabel: string, fileUri: URI, content: string): string {
        return `### From ${rootLabel}/${fileUri.path.base}\n\n${content.trim()}`;
    }

    protected getWorkspaceRoots(): URI[] {
        if (this.cachedRoots.length === 0) {
            this.cachedRoots.push(...this.workspaceService.tryGetRoots().map(root => root.resource));
        }
        return this.cachedRoots;
    }

    protected async findInstructionFile(root: URI): Promise<URI | undefined> {
        for (const name of WORKSPACE_INSTRUCTION_FILE_NAMES) {
            const candidate = root.resolve(name);
            if (this.cachedEntries.has(candidate.toString())) {
                // Known file (or known read failure): reuse without touching the filesystem again.
                if (this.cachedEntries.get(candidate.toString()) !== undefined) {
                    return candidate;
                }
                continue;
            }
            if (await this.fileService.exists(candidate)) {
                return candidate;
            }
        }
        return undefined;
    }

    protected async readCached(fileUri: URI): Promise<string | undefined> {
        const key = fileUri.toString();
        if (this.cachedEntries.has(key)) {
            return this.cachedEntries.get(key);
        }
        try {
            const content = (await this.fileService.readFile(fileUri)).value.toString();
            this.cachedEntries.set(key, content);
            return content;
        } catch {
            this.cachedEntries.set(key, undefined);
            return undefined;
        }
    }
}
