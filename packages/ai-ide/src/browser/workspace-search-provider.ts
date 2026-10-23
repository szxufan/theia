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

import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';
import { CancellationToken } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/common/preferences/preference-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { SearchInWorkspaceService, SearchInWorkspaceCallbacks } from '@theia/search-in-workspace/lib/browser/search-in-workspace-service';
import { SearchInWorkspaceResult, SearchInWorkspaceOptions } from '@theia/search-in-workspace/lib/common/search-in-workspace-interface';
import { SEARCH_IN_WORKSPACE_FUNCTION_ID } from '../common/workspace-functions';
import { WorkspaceFunctionScope } from './workspace-functions';
import { SEARCH_IN_WORKSPACE_MAX_RESULTS_PREF } from '../common/workspace-preferences';
import { optimizeSearchResults } from '../common/workspace-search-provider-util';

@injectable()
export class WorkspaceSearchProvider implements ToolProvider {

    @inject(SearchInWorkspaceService)
    protected readonly searchService: SearchInWorkspaceService;

    @inject(WorkspaceFunctionScope)
    protected readonly workspaceScope: WorkspaceFunctionScope;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    getTool(): ToolRequest {
        return {
            id: SEARCH_IN_WORKSPACE_FUNCTION_ID,
            name: SEARCH_IN_WORKSPACE_FUNCTION_ID,
            description: '在工作区文件内容中搜索匹配给定搜索词的行。' +
            '默认最多返回 30 条匹配结果（可通过偏好配置）。如果结果被截断，' +
            '请用 fileExtensions 或 subDirectoryPath 过滤条件细化搜索。' +
            '搜索采用不区分大小写的字符串匹配或正则表达式（由 `useRegExp` 参数控制）。' +
            '返回的匹配列表包括：文件路径、行号和匹配行的内容。' +
            '多词模式必须完全匹配（包括空格，不区分大小写）。' +
            '为获得最佳结果，请使用具体的搜索词并按文件扩展名或子目录过滤。' +
            '复杂搜索时，优先使用多个简单查询而非一个复杂 regex。' +
            '用它查找代码模式、函数用法或代码库中的文本。' +
            '不要用它按名称查找文件——请改用 findFilesByPattern。',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: '搜索词或正则表达式模式。',
                    },
                    useRegExp: {
                        type: 'boolean',
                        description: '如果 query 是正则表达式，请设为 true。',
                    },
                    fileExtensions: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: '可选的文件扩展名数组，用于限定搜索范围（例如 ["ts", "js", "py"]）。未指定时搜索所有文件。'
                    },
                    subDirectoryPath: {
                        type: 'string',
                        description: '可选的目录，用于限定搜索范围 ' +
                            '（例如 "frontend/src"、"backend/packages/core/src/browser"）。' +
                            '也可以是 AI 工具可访问目录的绝对路径或 `file://` URI，' +
                            '例如 `ai-features.workspaceFunctions.allowedExternalPaths` 偏好中列出的目录。' +
                            '未指定时搜索整个工作区。'
                    }
                },
                required: ['query', 'useRegExp']
            },
            handler: (argString, ctx?: ToolInvocationContext) => this.handleSearch(argString, ctx?.cancellationToken)
        };
    }

    private async determineSearchRoots(subDirectoryPath?: string): Promise<string[]> {
        const rootMapping = this.workspaceScope.getRootMapping();
        if (rootMapping.size === 0) {
            throw new Error('No workspace has been opened yet');
        }

        if (!subDirectoryPath) {
            return Array.from(rootMapping.values()).map(uri => uri.toString());
        }

        const subDirUri = await this.workspaceScope.resolveAccessiblePath(subDirectoryPath);

        try {
            const stat = await this.fileService.resolve(subDirUri);
            if (!stat || !stat.isDirectory) {
                throw new Error(`Subdirectory '${subDirectoryPath}' does not exist or is not a directory`);
            }
        } catch (error) {
            throw new Error(`Invalid subdirectory path '${subDirectoryPath}': ${error.message}`);
        }

        return [subDirUri.toString()];
    }

    private async handleSearch(argString: string, cancellationToken?: CancellationToken): Promise<string> {
        try {
            const args: { query: string, useRegExp: boolean, fileExtensions?: string[] | string, subDirectoryPath?: string } = JSON.parse(argString);

            if (cancellationToken?.isCancellationRequested) {
                return JSON.stringify({ error: 'Operation cancelled by user' });
            }

            const results: SearchInWorkspaceResult[] = [];
            let expectedSearchId: number | undefined;
            let searchCompleted = false;

            cancellationToken?.onCancellationRequested(() => {
                if (expectedSearchId !== undefined && !searchCompleted) {
                    this.searchService.cancel(expectedSearchId);
                    searchCompleted = true;
                }
            });

            // Use one more than our actual maximum. this way we can determine if we have more results than our maximum and warn the user
            const maxResultsForTheiaAPI = this.preferenceService.get<number>(SEARCH_IN_WORKSPACE_MAX_RESULTS_PREF, 30) + 1;
            const options: SearchInWorkspaceOptions = {
                useRegExp: args.useRegExp,
                matchCase: false,
                matchWholeWord: false,
                maxResults: maxResultsForTheiaAPI,
            };

            // The model may supply fileExtensions as a single string instead of an array; normalize to an array so that `.map` never throws.
            const fileExtensions = args.fileExtensions === undefined ? undefined
                : Array.isArray(args.fileExtensions) ? args.fileExtensions
                    : [args.fileExtensions];
            if (fileExtensions && fileExtensions.length > 0) {
                options.include = fileExtensions.map(ext => `**/*.${ext}`);
            }

            // Resolve the search roots before starting the search so that any error is reported through the outer try/catch.
            const rootUris = await this.determineSearchRoots(args.subDirectoryPath);

            const searchPromise = new Promise<SearchInWorkspaceResult[]>((resolve, reject) => {
                const callbacks: SearchInWorkspaceCallbacks = {
                    onResult: (id, result) => {
                        if (expectedSearchId !== undefined && id !== expectedSearchId) {
                            return;
                        }

                        if (searchCompleted) {
                            return;
                        }

                        results.push(result);
                    },
                    onDone: (id, error) => {
                        if (expectedSearchId !== undefined && id !== expectedSearchId) {
                            return;
                        }

                        if (searchCompleted) {
                            return;
                        }

                        searchCompleted = true;
                        if (error) {
                            reject(new Error('Search failed: ' + error));
                        } else {
                            resolve(results);
                        }
                    }
                };

                this.searchService.searchWithCallback(args.query, rootUris, callbacks, options)
                    .then(id => {
                        expectedSearchId = id;
                        // Handle cancellation that was requested before the search id became available.
                        if (cancellationToken?.isCancellationRequested && !searchCompleted) {
                            this.searchService.cancel(id);
                        }
                    })
                    .catch(err => {
                        searchCompleted = true;
                        reject(err);
                    });
            });

            const timeoutPromise = new Promise<SearchInWorkspaceResult[]>((_, reject) => {
                setTimeout(() => {
                    if (!searchCompleted) {
                        if (expectedSearchId !== undefined) {
                            this.searchService.cancel(expectedSearchId);
                        }
                        searchCompleted = true;
                        reject(new Error('Search timed out after 30 seconds'));
                    }
                }, 30000);
            });

            const finalResults = await Promise.race([searchPromise, timeoutPromise]);
            const maxResults = this.preferenceService.get<number>(SEARCH_IN_WORKSPACE_MAX_RESULTS_PREF, 30);

            const formattedResults = optimizeSearchResults(finalResults, this.workspaceScope);

            let numberOfMatchesInFinalResults = 0;
            for (const result of finalResults) {
                numberOfMatchesInFinalResults += result.matches.length;
            }
            if (numberOfMatchesInFinalResults > maxResults) {
                return JSON.stringify({
                    info: 'Search limit exceeded: Found ' + maxResults + '+ results. ' +
                        'Please refine your search with more specific terms or use file extension filters. ' +
                        'You can increase the limit in preferences under \'ai-features.workspaceFunctions.searchMaxResults\'.',
                    incompleteResults: formattedResults
                });
            }

            return JSON.stringify(formattedResults);

        } catch (error) {
            return JSON.stringify({ error: error.message || 'Failed to execute search' });
        }
    }
}
