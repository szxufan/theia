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

import { Command } from '../common/command';
import { nls } from '../common/nls';

export namespace CommonCommands {

    export const FILE_CATEGORY = '文件';
    export const VIEW_CATEGORY = '视图';
    export const CREATE_CATEGORY = '创建';
    export const PREFERENCES_CATEGORY = '首选项';
    export const MANAGE_CATEGORY = '管理';
    export const FILE_CATEGORY_KEY = nls.getDefaultKey(FILE_CATEGORY);
    export const VIEW_CATEGORY_KEY = nls.getDefaultKey(VIEW_CATEGORY);
    export const PREFERENCES_CATEGORY_KEY = nls.getDefaultKey(PREFERENCES_CATEGORY);

    export const OPEN: Command = {
        id: 'core.open',
    };

    export const CUT = Command.toDefaultLocalizedCommand({
        id: 'core.cut',
        label: '剪切'
    });
    export const COPY = Command.toDefaultLocalizedCommand({
        id: 'core.copy',
        label: '复制'
    });
    export const PASTE = Command.toDefaultLocalizedCommand({
        id: 'core.paste',
        label: '粘贴'
    });

    export const COPY_PATH = Command.toDefaultLocalizedCommand({
        id: 'core.copy.path',
        label: '复制路径'
    });

    export const UNDO = Command.toDefaultLocalizedCommand({
        id: 'core.undo',
        label: '撤销'
    });
    export const REDO = Command.toDefaultLocalizedCommand({
        id: 'core.redo',
        label: '重做'
    });
    export const SELECT_ALL = Command.toDefaultLocalizedCommand({
        id: 'core.selectAll',
        label: '全选'
    });

    export const FIND = Command.toDefaultLocalizedCommand({
        id: 'core.find',
        label: '查找'
    });
    export const REPLACE = Command.toDefaultLocalizedCommand({
        id: 'core.replace',
        label: '替换'
    });

    export const NEXT_TAB = Command.toDefaultLocalizedCommand({
        id: 'core.nextTab',
        category: VIEW_CATEGORY,
        label: '显示下一个标签页'
    });
    export const PREVIOUS_TAB = Command.toDefaultLocalizedCommand({
        id: 'core.previousTab',
        category: VIEW_CATEGORY,
        label: '显示上一个标签页'
    });
    export const NEXT_TAB_IN_GROUP = Command.toLocalizedCommand({
        id: 'core.nextTabInGroup',
        category: VIEW_CATEGORY,
        label: '切换到组内的下一个标签页'
    }, 'theia/core/common/showNextTabInGroup', VIEW_CATEGORY_KEY);
    export const PREVIOUS_TAB_IN_GROUP = Command.toLocalizedCommand({
        id: 'core.previousTabInGroup',
        category: VIEW_CATEGORY,
        label: '切换到组内的上一个标签页'
    }, 'theia/core/common/showPreviousTabInGroup', VIEW_CATEGORY_KEY);
    export const NEXT_TAB_GROUP = Command.toLocalizedCommand({
        id: 'core.nextTabGroup',
        category: VIEW_CATEGORY,
        label: '切换到下一个标签页组'
    }, 'theia/core/common/showNextTabGroup', VIEW_CATEGORY_KEY);
    export const PREVIOUS_TAB_GROUP = Command.toLocalizedCommand({
        id: 'core.previousTabBar',
        category: VIEW_CATEGORY,
        label: '切换到上一个标签页组'
    }, 'theia/core/common/showPreviousTabGroup', VIEW_CATEGORY_KEY);
    export const CLOSE_TAB = Command.toLocalizedCommand({
        id: 'core.close.tab',
        category: VIEW_CATEGORY,
        label: '关闭标签页'
    }, 'theia/core/common/closeTab', VIEW_CATEGORY_KEY);
    export const CLOSE_OTHER_TABS = Command.toLocalizedCommand({
        id: 'core.close.other.tabs',
        category: VIEW_CATEGORY,
        label: '关闭其他标签页'
    }, 'theia/core/common/closeOthers', VIEW_CATEGORY_KEY);
    export const CLOSE_SAVED_TABS = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.closeUnmodifiedEditors',
        category: VIEW_CATEGORY,
        label: '关闭组内已保存的编辑器',
    });
    export const CLOSE_RIGHT_TABS = Command.toLocalizedCommand({
        id: 'core.close.right.tabs',
        category: VIEW_CATEGORY,
        label: '关闭右侧的标签页'
    }, 'theia/core/common/closeRight', VIEW_CATEGORY_KEY);
    export const CLOSE_ALL_TABS = Command.toLocalizedCommand({
        id: 'core.close.all.tabs',
        category: VIEW_CATEGORY,
        label: '关闭所有标签页'
    }, 'theia/core/common/closeAll', VIEW_CATEGORY_KEY);
    export const CLOSE_MAIN_TAB = Command.toLocalizedCommand({
        id: 'core.close.main.tab',
        category: VIEW_CATEGORY,
        label: '关闭主区域的标签页'
    }, 'theia/core/common/closeTabMain', VIEW_CATEGORY_KEY);
    export const CLOSE_OTHER_MAIN_TABS = Command.toLocalizedCommand({
        id: 'core.close.other.main.tabs',
        category: VIEW_CATEGORY,
        label: '关闭主区域的其他标签页'
    }, 'theia/core/common/closeOtherTabMain', VIEW_CATEGORY_KEY);
    export const CLOSE_ALL_MAIN_TABS = Command.toLocalizedCommand({
        id: 'core.close.all.main.tabs',
        category: VIEW_CATEGORY,
        label: '关闭主区域的所有标签页'
    }, 'theia/core/common/closeAllTabMain', VIEW_CATEGORY_KEY);
    export const COLLAPSE_PANEL = Command.toLocalizedCommand({
        id: 'core.collapse.tab',
        category: VIEW_CATEGORY,
        label: '折叠侧面板'
    }, 'theia/core/common/collapseTab', VIEW_CATEGORY_KEY);
    export const COLLAPSE_ALL_PANELS = Command.toLocalizedCommand({
        id: 'core.collapse.all.tabs',
        category: VIEW_CATEGORY,
        label: '折叠所有侧面板'
    }, 'theia/core/common/collapseAllTabs', VIEW_CATEGORY_KEY);
    export const TOGGLE_BOTTOM_PANEL = Command.toLocalizedCommand({
        id: 'core.toggle.bottom.panel',
        category: VIEW_CATEGORY,
        label: '切换底部面板'
    }, 'theia/core/common/collapseBottomPanel', VIEW_CATEGORY_KEY);
    export const TOGGLE_LEFT_PANEL = Command.toLocalizedCommand({
        id: 'core.toggle.left.panel',
        category: VIEW_CATEGORY,
        label: '切换左侧面板'
    }, 'theia/core/common/collapseLeftPanel', VIEW_CATEGORY_KEY);
    export const TOGGLE_RIGHT_PANEL = Command.toLocalizedCommand({
        id: 'core.toggle.right.panel',
        category: VIEW_CATEGORY,
        label: '切换右侧面板'
    }, 'theia/core/common/collapseRightPanel', VIEW_CATEGORY_KEY);
    export const TOGGLE_STATUS_BAR = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.toggleStatusbarVisibility',
        category: VIEW_CATEGORY,
        label: '切换状态栏可见性'
    });
    export const PIN_TAB = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.pinEditor',
        category: VIEW_CATEGORY,
        label: '固定编辑器'
    });
    export const UNPIN_TAB = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.unpinEditor',
        category: VIEW_CATEGORY,
        label: '取消固定编辑器'
    });
    export const TOGGLE_MAXIMIZED = Command.toLocalizedCommand({
        id: 'core.toggleMaximized',
        category: VIEW_CATEGORY,
        label: '切换最大化'
    }, 'theia/core/common/toggleMaximized', VIEW_CATEGORY_KEY);
    export const OPEN_VIEW = Command.toDefaultLocalizedCommand({
        id: 'core.openView',
        category: VIEW_CATEGORY,
        label: '打开视图...'
    });
    export const SHOW_MENU_BAR = Command.toDefaultLocalizedCommand({
        id: 'window.menuBarVisibility',
        category: VIEW_CATEGORY,
        label: '切换菜单栏'
    });
    /**
     * Command Parameters:
     * - `fileName`: string
     * - `directory`: URI
     */
    export const NEW_FILE = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.files.newFile',
        category: FILE_CATEGORY
    });
    // This command immediately opens a new untitled text file
    // Some VS Code extensions use this command to create new files
    export const NEW_UNTITLED_TEXT_FILE = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.files.newUntitledFile',
        category: FILE_CATEGORY,
        label: '新建无标题文本文件'
    });
    // This command opens a quick pick to select a file type to create
    export const PICK_NEW_FILE = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.files.pickNewFile',
        category: CREATE_CATEGORY,
        label: '新建文件...'
    });
    export const SAVE = Command.toDefaultLocalizedCommand({
        id: 'core.save',
        category: FILE_CATEGORY,
        label: '保存',
    });
    export const SAVE_AS = Command.toDefaultLocalizedCommand({
        id: 'file.saveAs',
        category: FILE_CATEGORY,
        label: '另存为...',
    });
    export const SAVE_WITHOUT_FORMATTING = Command.toDefaultLocalizedCommand({
        id: 'core.saveWithoutFormatting',
        category: FILE_CATEGORY,
        label: '保存而不设置格式',
    });
    export const SAVE_ALL = Command.toDefaultLocalizedCommand({
        id: 'core.saveAll',
        category: FILE_CATEGORY,
        label: '全部保存',
    });

    export const AUTO_SAVE = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.autosave',
        category: FILE_CATEGORY,
        label: '自动保存',
    });

    export const ABOUT_COMMAND = Command.toDefaultLocalizedCommand({
        id: 'core.about',
        label: '关于'
    });

    export const OPEN_PREFERENCES = Command.toDefaultLocalizedCommand({
        id: 'preferences:open',
        category: PREFERENCES_CATEGORY,
        label: '打开设置（UI）',
    });

    export const SELECT_COLOR_THEME = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.selectTheme',
        label: '颜色主题',
        category: PREFERENCES_CATEGORY
    });
    export const SELECT_ICON_THEME = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.selectIconTheme',
        label: '文件图标主题',
        category: PREFERENCES_CATEGORY
    });

    export const TOGGLE_BREADCRUMBS = Command.toDefaultLocalizedCommand({
        id: 'breadcrumbs.toggle',
        label: '切换痕迹导航',
        category: VIEW_CATEGORY
    });
}
