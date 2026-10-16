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

import { nls, PreferenceSchema } from '@theia/core';

export const CONSIDER_GITIGNORE_PREF = 'ai-features.workspaceFunctions.considerGitIgnore';
export const USER_EXCLUDE_PATTERN_PREF = 'ai-features.workspaceFunctions.userExcludes';
export const SEARCH_IN_WORKSPACE_MAX_RESULTS_PREF = 'ai-features.workspaceFunctions.searchMaxResults';
export const PROMPT_TEMPLATE_WORKSPACE_DIRECTORIES_PREF = 'ai-features.promptTemplates.WorkspaceTemplateDirectories';
export const PROMPT_TEMPLATE_ADDITIONAL_EXTENSIONS_PREF = 'ai-features.promptTemplates.TemplateExtensions';
export const PROMPT_TEMPLATE_WORKSPACE_FILES_PREF = 'ai-features.promptTemplates.WorkspaceTemplateFiles';
export const TASK_CONTEXT_STORAGE_DIRECTORY_PREF = 'ai-features.promptTemplates.taskContextStorageDirectory';
export const FILE_CONTENT_MAX_SIZE_KB_PREF = 'ai-features.workspaceFunctions.fileContentMaxSizeKB';
export const WRITE_CONTENT_MAX_SIZE_KB_PREF = 'ai-features.workspaceFunctions.writeContentMaxSizeKB';
export const ALLOWED_EXTERNAL_PATHS_PREF = 'ai-features.workspaceFunctions.allowedExternalPaths';

const CONFLICT_RESOLUTION_DESCRIPTION = '当多个位置存在相同 ID（文件名）的模板时，冲突将按优先级解决：特定模板文件 \
（最高）> 工作区目录 > 全局目录（最低）。';

export const WorkspacePreferencesSchema: PreferenceSchema = {
    properties: {
        [CONSIDER_GITIGNORE_PREF]: {
            type: 'boolean',
            title: nls.localize('theia/ai/workspace/considerGitignore/title', '遵循 .gitignore'),
            description: nls.localize('theia/ai/workspace/considerGitignore/description',
                '启用后，将排除每个工作区根目录中 .gitignore 规则所匹配的文件/文件夹。'),
            default: true
        },
        [USER_EXCLUDE_PATTERN_PREF]: {
            type: 'array',
            title: nls.localize('theia/ai/workspace/excludedPattern/title', '排除的文件模式'),
            description: nls.localize('theia/ai/workspace/excludedPattern/description', '要排除的文件/文件夹的模式列表（glob 或正则表达式）。'),
            default: ['node_modules', 'lib'],
            items: {
                type: 'string'
            }
        },
        [SEARCH_IN_WORKSPACE_MAX_RESULTS_PREF]: {
            type: 'number',
            title: nls.localize('theia/ai/workspace/searchMaxResults/title', '最大搜索结果数'),
            description: nls.localize('theia/ai/workspace/searchMaxResults/description',
                '工作区搜索功能返回的最大搜索结果数。'),
            default: 30,
            minimum: 1
        },
        [PROMPT_TEMPLATE_WORKSPACE_DIRECTORIES_PREF]: {
            type: 'array',
            title: nls.localize('theia/ai/promptTemplates/directories/title', '工作区专属的提示词模板目录'),
            description: nls.localize('theia/ai/promptTemplates/directories/description',
                '相对路径列表，指示当前工作区中用于扫描 WORKSPACE 专属提示词模板的文件夹。' +
                CONFLICT_RESOLUTION_DESCRIPTION),
            default: ['.prompts'],
            items: {
                type: 'string'
            }
        },
        [PROMPT_TEMPLATE_ADDITIONAL_EXTENSIONS_PREF]: {
            type: 'array',
            title: nls.localize('theia/ai/promptTemplates/extensions/title', '额外的提示词模板文件扩展名'),
            description: nls.localize('theia/ai/promptTemplates/extensions/description',
                '在提示词位置被视为提示词模板的其他文件扩展名列表。\'.prompttemplate\' 始终被视为默认扩展名。'),
            items: {
                type: 'string'
            }
        },
        [PROMPT_TEMPLATE_WORKSPACE_FILES_PREF]: {
            type: 'array',
            title: nls.localize('theia/ai/promptTemplates/files/title', '工作区专属的提示词模板文件'),
            description: nls.localize('theia/ai/promptTemplates/files/description',
                '相对路径列表，指向当前工作区中用作提示词模板的特定文件。' +
                CONFLICT_RESOLUTION_DESCRIPTION),
            default: [],
            items: {
                type: 'string'
            }
        },
        [TASK_CONTEXT_STORAGE_DIRECTORY_PREF]: {
            type: 'string',
            description: nls.localize('theia/ai/chat/taskContextStorageDirectory/description',
                '用于持久化任务上下文描述的工作区相对路径，也将从中检索。' +
                '若设置为空值，生成的任务上下文将存储在内存中而非磁盘上。'
            ),
            default: '.prompts/task-contexts'
        },
        [FILE_CONTENT_MAX_SIZE_KB_PREF]: {
            type: 'number',
            title: nls.localize('theia/ai/workspace/fileContentMaxSizeKB/title', '文件内容最大大小 (KB)'),
            description: nls.localize('theia/ai/workspace/fileContentMaxSizeKB/description',
                'getFileContent 工具返回内容的最大大小（以千字节为单位）。' +
                '读取完整文件（无 offset/limit）时，超过此限制的文件将返回错误。' +
                '使用 offset 和 limit 时，仅对请求的范围检查此限制。'),
            default: 256,
            minimum: 1
        },
        [WRITE_CONTENT_MAX_SIZE_KB_PREF]: {
            type: 'number',
            title: nls.localize('theia/ai/workspace/writeContentMaxSizeKB/title', '写入内容最大大小 (KB)'),
            description: nls.localize('theia/ai/workspace/writeContentMaxSizeKB/description',
                '整文件写入工具（writeFileContent 和 suggestFileContent）接受内容的最大大小（以千字节为单位）。' +
                '更大的写入将被拒绝，并提示改用基于替换的工具。'),
            default: 256,
            minimum: 1
        },
        [ALLOWED_EXTERNAL_PATHS_PREF]: {
            type: 'array',
            title: nls.localize('theia/ai/workspace/allowedExternalPaths/title', '允许的外部路径'),
            description: nls.localize('theia/ai/workspace/allowedExternalPaths/description',
                'AI 工具可以访问的工作区之外的绝对路径或文件 URI（目录或文件）列表。' +
                '支持用 `~` 表示用户主目录。默认为空；仅限显式启用。' +
                '所有接受路径的工具（包括写文件的工具）都会遵循此设置。' +
                '当工作区不受信任时，工作区作用域的值将被忽略。' +
                '允许列表目录内的符号链接会被跟随，并可能指向允许列表之外的文件；' +
                '只添加你信任其内容的目录。'),
            default: [],
            items: {
                type: 'string'
            }
        }
    }
};
