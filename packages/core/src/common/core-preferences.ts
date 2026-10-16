// *****************************************************************************
// Copyright (C) 2018 Google and others.
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

import { interfaces } from 'inversify';
import { environment } from '@theia/application-package/lib/environment';
import { SUPPORTED_ENCODINGS } from './supported-encodings';
import { isOSX } from '../common/os';
import { nls } from '../common/nls';
import { PreferenceContribution, PreferenceSchema } from '../common/preferences/preference-schema';
import { createPreferenceProxy, PreferenceProxy, PreferenceService } from '../common/preferences';
import { PreferenceScope } from '../common/preferences/preference-scope';

/* eslint-disable max-len */
const windowTitleDescription = [
    nls.localizeByDefault('根据当前上下文（例如打开的工作区或活动编辑器）控制窗口标题。根据上下文替换以下变量：'),
    nls.localizeByDefault('`${activeEditorShort}`: 文件名（例如 myFile.txt）。'),
    nls.localizeByDefault('`${activeEditorMedium}`: 相对于工作区文件夹的文件路径（例如 myFolder/myFileFolder/myFile.txt）。'),
    nls.localizeByDefault('`${activeEditorLong}`: 文件的完整路径（例如 /Users/Development/myFolder/myFileFolder/myFile.txt）。'),
    nls.localizeByDefault('`${activeFolderShort}`: 文件所在文件夹的名称（例如 myFileFolder）。'),
    nls.localizeByDefault('`${activeFolderMedium}`: 相对于工作区文件夹的文件所在文件夹路径（例如 myFolder/myFileFolder）。'),
    nls.localizeByDefault('`${activeFolderLong}`: 文件所在文件夹的完整路径（例如 /Users/Development/myFolder/myFileFolder）。'),
    nls.localizeByDefault('`${folderName}`: 文件所在工作区文件夹的名称（例如 myFolder）。'),
    nls.localizeByDefault('`${folderPath}`: 文件所在工作区文件夹的文件路径（例如 /Users/Development/myFolder）。'),
    nls.localizeByDefault('`${rootName}`: 工作区的名称，可选地附带远程名称和工作区指示符（如果适用）（例如 myFolder、myRemoteFolder [SSH] 或 myWorkspace (Workspace)）。'),
    nls.localizeByDefault('`${rootPath}`: 打开的工作区或文件夹的文件路径（例如 /Users/Development/myWorkspace）。'),
    nls.localizeByDefault('`${appName}`: 例如 VS Code。'),
    nls.localizeByDefault('`${remoteName}`: 例如 SSH'),
    nls.localizeByDefault('`${dirty}`: 活动编辑器有未保存更改时的指示符。'),
    nls.localizeByDefault('`${separator}`: 条件分隔符（" - "），仅在被有值的变量或静态文本包围时显示。')
].join('\n- ');

export const corePreferenceSchema: PreferenceSchema = {
    properties: {
        'application.confirmExit': {
            type: 'string',
            enum: [
                'never',
                'ifRequired',
                'always',
            ],
            default: 'ifRequired',
            description: nls.localizeByDefault('控制是否在关闭浏览器标签页或窗口之前显示确认对话框。请注意，即使启用此设置，浏览器仍可能在没有确认的情况下关闭标签页或窗口，并且此设置只是一个提示，可能在并非所有情况下都有效。'),
        },
        'breadcrumbs.enabled': {
            'type': 'boolean',
            'default': true,
            'description': nls.localizeByDefault('启用/禁用导航痕迹。'),
            'scope': PreferenceScope.User
        },
        'files.encoding': {
            'type': 'string',
            'enum': Object.keys(SUPPORTED_ENCODINGS),
            'default': 'utf8',
            'description': nls.localizeByDefault(
                '读写文件时使用的默认字符集编码。也可以按语言配置此设置。'),
            'scope': PreferenceScope.Folder,
            'enumDescriptions': Object.keys(SUPPORTED_ENCODINGS).map(key => SUPPORTED_ENCODINGS[key].labelLong),
            'included': Object.keys(SUPPORTED_ENCODINGS).length > 1
        },
        'keyboard.dispatch': {
            type: 'string',
            enum: [
                'code',
                'keyCode',
            ],
            default: 'code',
            markdownDescription: nls.localizeByDefault('控制按键分派逻辑是使用 `code`（推荐）还是 `keyCode`。')
        },
        'window.tabbar.enhancedPreview': {
            type: 'string',
            enum: ['classic', 'enhanced', 'visual'],
            markdownEnumDescriptions: [
                nls.localize('theia/core/enhancedPreview/classic', '显示标签页的简单预览，包含基本信息。'),
                nls.localize('theia/core/enhancedPreview/enhanced', '显示标签页的增强预览，包含附加信息。'),
                nls.localize('theia/core/enhancedPreview/visual', '显示标签页的可视化预览。'),
            ],
            default: 'classic',
            description: nls.localize('theia/core/enhancedPreview', '控制悬停时水平标签栏中应显示有关标签页的哪些信息。')
        },
        'window.menuBarVisibility': {
            type: 'string',
            enum: ['classic', 'visible', 'toggle', 'hidden', 'compact'],
            markdownEnumDescriptions: [
                nls.localizeByDefault('菜单显示在窗口顶部，仅在全屏模式下隐藏。'),
                nls.localizeByDefault('菜单始终显示在窗口顶部，即使处于全屏模式。'),
                nls.localizeByDefault('菜单处于隐藏状态，但可通过 Alt 键显示在窗口顶部。'),
                nls.localizeByDefault('菜单始终隐藏。'),
                environment.electron.is()
                    // we do not support the window.menuStyle setting yet, so we do not use the default string in this case yet
                    ? nls.localize('theia/core/window.menuBarVisibility', '菜单以紧凑按钮的形式显示在侧边栏中。当 {0} 为 {1} 时，此值将被忽略。', '`#window.titleBarStyle#`', '`native`')
                    : nls.localizeByDefault('菜单以紧凑按钮的形式显示在侧边栏中。')
            ],
            default: 'classic',
            scope: PreferenceScope.User,
            markdownDescription: nls.localizeByDefault("控制菜单栏的可见性。设置为 'toggle' 表示隐藏菜单栏，按一次 Alt 键即可显示。设置为 'compact' 会将菜单移动到侧边栏中。"),
            included: !(isOSX && environment.electron.is())
        },
        'window.title': {
            type: 'string',
            default: isOSX
                ? '${activeEditorShort}${separator}${rootName}'
                : '${dirty} ${activeEditorShort}${separator}${rootName}${separator}${appName}',
            scope: PreferenceScope.User,
            markdownDescription: windowTitleDescription
        },
        'window.titleSeparator': {
            type: 'string',
            default: ' - ',
            scope: PreferenceScope.User,
            markdownDescription: nls.localizeByDefault('{0} 使用的分隔符。', '`#window.title#`')
        },
        'window.tabCloseIconPlacement': {
            type: 'string',
            enum: ['end', 'start'],
            enumDescriptions: [
                nls.localize('theia/core/window/tabCloseIconPlacement/end', '将关闭图标放在标签的末尾。在从左到右的语言中，这是标签页的右侧。'),
                nls.localize('theia/core/window/tabCloseIconPlacement/start', '将关闭图标放在标签的开头。在从左到右的语言中，这是标签页的左侧。'),
            ],
            default: 'end',
            scope: PreferenceScope.User,
            description: nls.localize('theia/core/window/tabCloseIconPlacement/description', '将标签页标题上的关闭图标放置在标签页的开头或结尾。所有平台的默认值为结尾。'),
            included: isOSX
        },
        'window.secondaryWindowPlacement': {
            type: 'string',
            enum: ['originalSize', 'halfWidth', 'fullSize'],
            enumDescriptions: [
                nls.localize('theia/core/secondaryWindow/originalSize', '提取的部件的位置和大小将与原始部件相同。'),
                nls.localize('theia/core/secondaryWindow/halfWidth', '提取的部件的位置和大小将是正在运行的 Theia 应用程序宽度的一半。'),
                nls.localize('theia/core/secondaryWindow/fullSize', '提取的部件的位置和大小将与正在运行的 Theia 应用程序相同。'),
            ],
            default: 'originalSize',
            description: nls.localize('theia/core/secondaryWindow/description', '设置提取的辅助窗口的初始位置和大小。'),
        },
        'window.secondaryWindowAlwaysOnTop': {
            type: 'boolean',
            default: false,
            description: nls.localize('theia/core/secondaryWindow/alwaysOnTop', '启用后，辅助窗口将始终位于所有其他窗口之上，包括其他应用程序的窗口。'),
        },
        'http.proxy': {
            type: 'string',
            pattern: '^https?://([^:]*(:[^@]*)?@)?([^:]+|\\[[:0-9a-fA-F]+\\])(:\\d+)?/?$|^$',
            markdownDescription: nls.localize('theia/core/http/proxy', '要使用的代理设置。如果未设置，将从 `http_proxy` 和 `https_proxy` 环境变量继承。'),
            scope: PreferenceScope.User
        },
        'http.proxyStrictSSL': {
            type: 'boolean',
            default: true,
            description: nls.localize('theia/core/http/proxyStrictSSL', '控制是否应根据提供的 CA 列表验证代理服务器证书。'),
            scope: PreferenceScope.User
        },
        'http.proxyAuthorization': {
            type: 'string',
            markdownDescription: nls.localize('theia/core/http/proxyAuthorization', '为每个网络请求发送的 `Proxy-Authorization` 标头的值。'),
            scope: PreferenceScope.User
        },
        'http.proxySupport': {
            type: 'string',
            enum: ['off', 'on', 'fallback', 'override'],
            enumDescriptions: [
                nls.localizeByDefault('禁用扩展的代理支持。'),
                nls.localizeByDefault('启用扩展的代理支持。'),
                nls.localizeByDefault('启用扩展的代理支持，当找不到代理时回退到请求选项。'),
                nls.localizeByDefault('启用扩展的代理支持，覆盖请求选项。'),
            ],
            default: 'override',
            description: nls.localize('theia/core/http/proxySupport', '对扩展使用代理支持。'),
            scope: PreferenceScope.User
        },
        'http.systemCertificates': {
            type: 'boolean',
            default: true,
            description: nls.localize('theia/core/http/systemCertificates', '控制是否应从操作系统加载 CA 证书。在 Windows 和 macOS 上，关闭此选项后需要重新加载窗口。'),
            scope: PreferenceScope.User
        },
        'workbench.list.openMode': {
            type: 'string',
            enum: [
                'singleClick',
                'doubleClick'
            ],
            default: 'singleClick',
            description: nls.localizeByDefault('控制如何使用鼠标在树和列表中打开项目（如果支持）。请注意，某些树和列表可能会选择忽略此设置（如果它不适用）。')
        },
        'workbench.editor.highlightModifiedTabs': {
            'type': 'boolean',
            'markdownDescription': nls.localize('theia/core/highlightModifiedTabs', '控制是否在已修改（脏）的编辑器标签页上绘制顶部边框。'),
            'default': false
        },
        'workbench.editor.closeOnFileDelete': {
            'type': 'boolean',
            'description': nls.localizeByDefault('控制当编辑器显示的文件在会话期间被其他进程删除或重命名时，是否应自动关闭编辑器。禁用此选项将在发生此类事件时保持编辑器打开。请注意，从应用程序内删除将始终关闭编辑器，并且具有未保存更改的编辑器将永远不会关闭以保护你的数据。'),
            'default': false
        },
        'workbench.editor.mouseBackForwardToNavigate': {
            'type': 'boolean',
            'description': nls.localizeByDefault("启用鼠标第四、第五键用于命令“后退”和“前进”。"),
            'default': true
        },
        'workbench.editor.revealIfOpen': {
            'type': 'boolean',
            'description': nls.localizeByDefault('控制是否在打开时在任一可见的组中显示编辑器。如果禁用，编辑器将优先在当前活动的编辑器组中打开。如果启用，则已打开的编辑器将被显示，而不是在当前活动的编辑器组中再次打开。请注意，在某些情况下会忽略此设置，例如强制编辑器在特定组中打开或在当前活动组的侧面打开。'),
            'default': false
        },
        'workbench.editor.decorations.badges': {
            'type': 'boolean',
            'description': nls.localizeByDefault('控制编辑器文件装饰是否使用徽章。'),
            'default': true
        },
        'workbench.commandPalette.history': {
            type: 'number',
            default: 50,
            minimum: 0,
            description: nls.localizeByDefault('控制命令面板中保留最近使用命令历史的数量。设置为 0 以禁用命令历史记录。')
        },
        'workbench.colorTheme': {
            type: 'string',
            enum: ['dark', 'light', 'hc-theia'],
            enumItemLabels: ['Dark (Theia)', 'Light (Theia)', 'High Contrast (Theia)'],
            default: 'light',
            description: nls.localizeByDefault('指定在未启用 {0} 时工作台中使用的颜色主题。', '`#window.autoDetectColorScheme#`')
        },
        'workbench.iconTheme': {
            type: ['string'],
            enum: ['none', 'theia-file-icons'],
            enumItemLabels: [nls.localizeByDefault('无'), 'File Icons (Theia)'],
            default: 'none',
            description: nls.localizeByDefault("指定工作台中使用的文件图标主题，或设置为 'null' 以不显示任何文件图标。")
        },
        'workbench.silentNotifications': {
            type: 'boolean',
            default: false,
            description: nls.localize('theia/core/silentNotifications', '控制是否禁止显示通知弹出窗口。')
        },
        'workbench.statusBar.visible': {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('控制工作台底部状态栏的可见性。')
        },
        'workbench.tree.renderIndentGuides': {
            type: 'string',
            enum: ['onHover', 'none', 'always'],
            default: 'onHover',
            description: nls.localizeByDefault('控制树是否渲染缩进参考线。')
        },
        'workbench.hover.delay': {
            type: 'number',
            default: isOSX ? 1500 : 500,
            description: nls.localizeByDefault('控制悬停显示后的延迟时间（以毫秒为单位）。')
        },
        'workbench.sash.hoverDelay': {
            type: 'number',
            default: 300,
            minimum: 0,
            maximum: 2000,
            description: nls.localizeByDefault('控制视图/编辑器之间拖动区域的悬停反馈延迟（以毫秒为单位）。')
        },
        'workbench.sash.size': {
            type: 'number',
            default: 4,
            minimum: 1,
            maximum: 20,
            description: nls.localizeByDefault('控制视图/编辑器之间拖动区域的反馈区域大小（以像素为单位）。如果觉得难以使用鼠标调整视图大小，请将其设置为更大的值。')
        },
        'workbench.tab.maximize': {
            type: 'boolean',
            default: false,
            description: nls.localize('theia/core/tabMaximize', '控制是否在双击时最大化标签页。')
        },
        'workbench.tab.shrinkToFit.enabled': {
            type: 'boolean',
            default: false,
            description: nls.localize('theia/core/tabShrinkToFit', '缩小标签页以适应可用空间。')
        },
        'workbench.tab.shrinkToFit.minimumSize': {
            type: 'number',
            default: 50,
            minimum: 10,
            description: nls.localize('theia/core/tabMinimumSize', '指定标签页的最小大小。')
        },
        'workbench.tab.shrinkToFit.defaultSize': {
            type: 'number',
            default: 200,
            minimum: 10,
            description: nls.localize('theia/core/tabDefaultSize', '指定标签页的默认大小。')
        },
        'workbench.editorAssociations': {
            type: 'object',
            markdownDescription: nls.localizeByDefault('配置 [glob 模式](https://aka.ms/vscode-glob-patterns) 与编辑器的关联（例如 `"*.hex": "hexEditor.hexedit"`）。这些关联优先于默认行为。'),
            patternProperties: {
                '.*': {
                    type: 'string'
                }
            }
        }
    }
};

export interface CoreConfiguration {
    'application.confirmExit': 'never' | 'ifRequired' | 'always';
    'breadcrumbs.enabled': boolean;
    'files.encoding': string;
    'keyboard.dispatch': 'code' | 'keyCode';
    'window.tabbar.enhancedPreview': 'classic' | 'enhanced' | 'visual';
    'window.menuBarVisibility': 'classic' | 'visible' | 'toggle' | 'hidden' | 'compact';
    'window.title': string;
    'window.titleSeparator': string;
    'window.tabCloseIconPlacement': 'end' | 'start';
    'workbench.list.openMode': 'singleClick' | 'doubleClick';
    'workbench.commandPalette.history': number;
    'workbench.editor.highlightModifiedTabs': boolean;
    'workbench.editor.mouseBackForwardToNavigate': boolean;
    'workbench.editor.closeOnFileDelete': boolean;
    'workbench.editor.revealIfOpen': boolean;
    'workbench.editor.decorations.badges': boolean;
    'workbench.colorTheme': string;
    'workbench.iconTheme': string;
    'workbench.silentNotifications': boolean;
    'workbench.statusBar.visible': boolean;
    'workbench.tree.renderIndentGuides': 'onHover' | 'none' | 'always';
    'workbench.hover.delay': number;
    'workbench.sash.hoverDelay': number;
    'workbench.sash.size': number;
    'workbench.tab.maximize': boolean;
    'workbench.tab.shrinkToFit.enabled': boolean;
    'workbench.tab.shrinkToFit.minimumSize': number;
    'workbench.tab.shrinkToFit.defaultSize': number;
}

export const CorePreferenceContribution = Symbol('CorePreferenceContribution');
export const CorePreferences = Symbol('CorePreferences');
export type CorePreferences = PreferenceProxy<CoreConfiguration>;

export function createCorePreferences(preferences: PreferenceService, schema: PreferenceSchema = corePreferenceSchema): CorePreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindCorePreferences(bind: interfaces.Bind): void {
    bind(CorePreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(CorePreferenceContribution);
        return createCorePreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(CorePreferenceContribution).toConstantValue({ schema: corePreferenceSchema });
    bind(PreferenceContribution).toService(CorePreferenceContribution);
}
