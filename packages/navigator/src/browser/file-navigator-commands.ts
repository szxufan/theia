// *****************************************************************************
// Copyright (C) 2022 Ericsson and others.
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

import { codicon, CommonCommands } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';

export namespace FileNavigatorCommands {
    export const REVEAL_IN_NAVIGATOR = Command.toLocalizedCommand({
        id: 'navigator.reveal',
        label: '在资源管理器中显示'
    }, 'theia/navigator/reveal');
    export const TOGGLE_HIDDEN_FILES = Command.toLocalizedCommand({
        id: 'navigator.toggle.hidden.files',
        label: '切换隐藏文件'
    }, 'theia/navigator/toggleHiddenFiles');
    export const TOGGLE_AUTO_REVEAL = Command.toLocalizedCommand({
        id: 'navigator.toggle.autoReveal',
        category: CommonCommands.FILE_CATEGORY,
        label: '自动显示'
    }, 'theia/navigator/autoReveal', CommonCommands.FILE_CATEGORY_KEY);
    export const REFRESH_NAVIGATOR = Command.toLocalizedCommand({
        id: 'navigator.refresh',
        category: CommonCommands.FILE_CATEGORY,
        label: '刷新资源管理器',
        iconClass: codicon('refresh')
    }, 'theia/navigator/refresh', CommonCommands.FILE_CATEGORY_KEY);
    export const COLLAPSE_ALL = Command.toDefaultLocalizedCommand({
        id: 'navigator.collapse.all',
        category: CommonCommands.FILE_CATEGORY,
        label: '在资源管理器中折叠文件夹',
        iconClass: codicon('collapse-all')
    });
    export const ADD_ROOT_FOLDER: Command = {
        id: 'navigator.addRootFolder'
    };
    export const FOCUS = Command.toDefaultLocalizedCommand({
        id: 'workbench.files.action.focusFilesExplorer',
        category: CommonCommands.FILE_CATEGORY,
        label: '聚焦文件资源管理器'
    });
    export const OPEN: Command = {
        id: 'navigator.open',
    };
    export const OPEN_WITH: Command = {
        id: 'navigator.openWith',
    };
    export const NEW_FILE_TOOLBAR: Command = {
        id: `${WorkspaceCommands.NEW_FILE.id}.toolbar`,
        iconClass: codicon('new-file')
    };
    export const NEW_FOLDER_TOOLBAR: Command = {
        id: `${WorkspaceCommands.NEW_FOLDER.id}.toolbar`,
        iconClass: codicon('new-folder')
    };

    /**
     * @deprecated since 1.21.0. Use WorkspaceCommands.COPY_RELATIVE_FILE_COMMAND instead.
     */
    export const COPY_RELATIVE_FILE_PATH = WorkspaceCommands.COPY_RELATIVE_FILE_PATH;
}
