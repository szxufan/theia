// *****************************************************************************
// Copyright (C) 2021 Ericsson and others.
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

import { nls } from '@theia/core/lib/common/nls';
import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace VSXExtensionsCommands {

    const EXTENSIONS_CATEGORY = '扩展';

    export const CLEAR_ALL = Command.toDefaultLocalizedCommand({
        id: 'vsxExtensions.clearAll',
        category: EXTENSIONS_CATEGORY,
        label: '清除搜索结果',
        iconClass: codicon('clear-all')
    });
    export const INSTALL_FROM_VSIX: Command & { dialogLabel: string } = {
        id: 'vsxExtensions.installFromVSIX',
        category: nls.localizeByDefault(EXTENSIONS_CATEGORY),
        originalCategory: EXTENSIONS_CATEGORY,
        originalLabel: '从 VSIX 安装...',
        label: nls.localizeByDefault('从 VSIX 安装') + '...',
        dialogLabel: nls.localizeByDefault('从 VSIX 安装')
    };
    export const INSTALL_VSIX_FILE: Command = Command.toDefaultLocalizedCommand({
        id: 'vsxExtensions.installVSIX',
        label: '安装扩展 VSIX',
        category: EXTENSIONS_CATEGORY,
    });
    export const INSTALL_ANOTHER_VERSION: Command = {
        id: 'vsxExtensions.installAnotherVersion'
    };

    export const DISABLE: Command = {
        id: 'vsxExtensions.disable'
    };

    export const ENABLE: Command = {
        id: 'vsxExtensions.enable'
    };
    export const COPY: Command = {
        id: 'vsxExtensions.copy'
    };
    export const COPY_EXTENSION_ID: Command = {
        id: 'vsxExtensions.copyExtensionId'
    };
    export const SHOW_BUILTINS = Command.toDefaultLocalizedCommand({
        id: 'vsxExtension.showBuiltins',
        label: '显示内置扩展',
        category: EXTENSIONS_CATEGORY,
    });
    export const SHOW_INSTALLED = Command.toLocalizedCommand({
        id: 'vsxExtension.showInstalled',
        label: '显示已安装的扩展',
        category: EXTENSIONS_CATEGORY,
    }, 'theia/vsx-registry/showInstalled');
    export const SHOW_RECOMMENDATIONS = Command.toDefaultLocalizedCommand({
        id: 'vsxExtension.showRecommendations',
        label: '显示推荐的扩展',
        category: EXTENSIONS_CATEGORY,
    });
    export const REFRESH = Command.toDefaultLocalizedCommand({
        id: 'vsxExtension.refresh',
        label: '刷新',
        category: EXTENSIONS_CATEGORY,
        iconClass: codicon('refresh')
    });
}
