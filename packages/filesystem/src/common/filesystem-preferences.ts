// *****************************************************************************
// Copyright (C) 2017 TypeFox and others.
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

import { interfaces } from '@theia/core/shared/inversify';
import { createPreferenceProxy, PreferenceProxy } from '@theia/core/lib/common/preferences/preference-proxy';
import { PreferenceScope } from '@theia/core/lib/common/preferences/preference-scope';
import { PreferenceService } from '@theia/core/lib/common/preferences/preference-service';
import { SUPPORTED_ENCODINGS } from '@theia/core/lib/common/supported-encodings';
import { nls } from '@theia/core/lib/common/nls';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

// See https://github.com/Microsoft/vscode/issues/30180
export const WIN32_MAX_FILE_SIZE_MB = 300; // 300 MB
export const GENERAL_MAX_FILE_SIZE_MB = 16 * 1024; // 16 GB

export const MAX_FILE_SIZE_MB = typeof process === 'object'
    ? process.arch === 'ia32'
        ? WIN32_MAX_FILE_SIZE_MB
        : GENERAL_MAX_FILE_SIZE_MB
    : 32;

export const filesystemPreferenceSchema: PreferenceSchema = {
    properties: {
        'files.watcherExclude': {
            // eslint-disable-next-line max-len
            markdownDescription: nls.localizeByDefault('配置要从文件监视中排除的路径或 [glob 模式](https://aka.ms/vscode-glob-patterns)。路径可以是相对于被监视文件夹的相对路径，也可以是绝对路径。glob 模式相对于被监视文件夹进行匹配。如果发现文件监视进程占用大量 CPU，请确保排除关注度较低的大型文件夹（例如构建输出文件夹）。'),
            additionalProperties: {
                type: 'boolean'
            },
            default: {
                '**/.git/objects/**': true,
                '**/.git/subtree-cache/**': true
            },
            scope: PreferenceScope.Folder
        },
        'files.exclude': {
            type: 'object',
            default: { '**/.git': true, '**/.svn': true, '**/.hg': true, '**/CVS': true, '**/.DS_Store': true },
            // eslint-disable-next-line max-len
            markdownDescription: nls.localize('theia/filesystem/filesExclude', '配置用于排除文件和文件夹的 [glob 模式](https://aka.ms/vscode-glob-patterns)。例如，文件资源管理器根据此设置决定显示或隐藏哪些文件和文件夹。'),
            scope: PreferenceScope.Folder
        },
        'files.enableTrash': {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('删除时将文件/文件夹移入操作系统回收站（Windows 上为回收站）。禁用此选项将永久删除文件/文件夹。')
        },
        'files.associations': {
            type: 'object',
            default: {},
            markdownDescription: nls.localizeByDefault(
                // eslint-disable-next-line max-len
                'Configure [glob patterns](https://aka.ms/vscode-glob-patterns) of file associations to languages (for example `\"*.extension\": \"html\"`). Patterns will match on the absolute path of a file if they contain a path separator and will match on the name of the file otherwise. These have precedence over the default associations of the languages installed.'
            )
        },
        'files.autoGuessEncoding': {
            type: 'boolean',
            default: false,
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault('启用后，编辑器将在打开文件时尝试猜测字符集编码。此设置也可以按语言进行配置。注意，文本搜索不会遵循此设置，仅遵循 {0}。', '`#files.encoding#`'),
            scope: PreferenceScope.Folder,
            overridable: true,
            included: Object.keys(SUPPORTED_ENCODINGS).length > 1
        },
        'files.participants.timeout': {
            type: 'number',
            default: 5000,
            markdownDescription: nls.localizeByDefault(
                'Timeout in milliseconds after which file participants for create, rename, and delete are cancelled. Use `0` to disable participants.'
            )
        },
        'files.maxFileSizeMB': {
            type: 'number',
            default: MAX_FILE_SIZE_MB,
            markdownDescription: nls.localize('theia/filesystem/maxFileSizeMB', '控制可打开的最大文件大小（以 MB 为单位）。')
        },
        'files.trimTrailingWhitespace': {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('启用后，保存文件时会去除行尾空白。'),
            scope: PreferenceScope.Folder,
            overridable: true
        },
        'files.insertFinalNewline': {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('启用后，保存文件时会在文件末尾插入一个最终换行符。'),
            scope: PreferenceScope.Folder,
            overridable: true
        },
        'files.maxConcurrentUploads': {
            type: 'integer',
            default: 1,
            description: nls.localize(
                'theia/filesystem/maxConcurrentUploads',
                'Maximum number of concurrent files to upload when uploading multiple files. 0 means all files will be uploaded concurrently.'
            ),
        }
    }
};

export interface FileSystemConfiguration {
    'files.watcherExclude': { [globPattern: string]: boolean }
    'files.exclude': { [key: string]: boolean }
    'files.enableTrash': boolean
    'files.associations': { [filepattern: string]: string }
    'files.encoding': string
    'files.autoGuessEncoding': boolean
    'files.participants.timeout': number
    'files.maxFileSizeMB': number
    'files.trimTrailingWhitespace': boolean
    'files.insertFinalNewline': boolean
    'files.maxConcurrentUploads': number
}

export const FileSystemPreferenceContribution = Symbol('FilesystemPreferenceContribution');
export const FileSystemPreferences = Symbol('FileSystemPreferences');
export type FileSystemPreferences = PreferenceProxy<FileSystemConfiguration>;

export function createFileSystemPreferences(preferences: PreferenceService, schema: PreferenceSchema = filesystemPreferenceSchema): FileSystemPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindFileSystemPreferences(bind: interfaces.Bind): void {
    bind(FileSystemPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(FileSystemPreferenceContribution);
        return createFileSystemPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(FileSystemPreferenceContribution).toConstantValue({ schema: filesystemPreferenceSchema });
    bind(PreferenceContribution).toService(FileSystemPreferenceContribution);
}
