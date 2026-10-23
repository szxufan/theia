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

/* eslint-disable max-len, @typescript-eslint/indent */

import debounce = require('lodash.debounce');
import { injectable, inject, optional } from 'inversify';
import { MAIN_MENU_BAR, MANAGE_MENU, MenuContribution, MenuModelRegistry, ACCOUNTS_MENU, CompoundMenuNode, CommandMenu, Group, Submenu } from '../common/menu';
import { CommonMenus } from './common-menus';
export { CommonMenus };
import { KeybindingContribution, KeybindingRegistry } from './keybinding';
import { FrontendApplication } from './frontend-application';
import { FrontendApplicationContribution, OnWillStopAction } from './frontend-application-contribution';
import { CommandContribution, CommandRegistry, Command } from '../common/command';
import { CommonCommands } from './common-commands';
export { CommonCommands };
import { UriAwareCommandHandler } from '../common/uri-command-handler';
import { SelectionService } from '../common/selection-service';
import { MessageService } from '../common/message-service';
import { OpenerService, open } from '../browser/opener-service';
import { ApplicationShell } from './shell/application-shell';
import { SHELL_TABBAR_CONTEXT_CLOSE, SHELL_TABBAR_CONTEXT_COPY, SHELL_TABBAR_CONTEXT_PIN, SHELL_TABBAR_CONTEXT_SPLIT } from './shell/tab-bars';
import { AboutDialog } from './about-dialog';
import URI from '../common/uri';
import { ContextKey, ContextKeyService } from './context-key-service';
import { OS, isOSX, isWindows, EOL } from '../common/os';
import { ResourceContextKey } from './resource-context-key';
import { UriSelection } from '../common/selection';
import { StorageService } from './storage-service';
import { Navigatable, NavigatableWidget } from './navigatable';
import { QuickViewService } from './quick-input/quick-view-service';
import { environment } from '@theia/application-package/lib/environment';
import { IconTheme, IconThemeService } from './icon-theme-service';
import { ColorContribution } from './color-application-contribution';
import { ColorRegistry } from './color-registry';
import { Color } from '../common/color';
import { CoreConfiguration, CorePreferences } from '../common/core-preferences';
import { ThemeService } from './theming';
import { ClipboardService } from './clipboard-service';
import { EncodingRegistry } from './encoding-registry';
import { UTF8 } from '../common/encodings';
import { EnvVariablesServer } from '../common/env-variables';
import { AuthenticationService } from './authentication-service';
import { FormatType, Saveable, SaveOptions } from './saveable';
import { QuickInputService, QuickPickItem, QuickPickItemOrSeparator, QuickPickSeparator } from './quick-input';
import { AsyncLocalizationProvider } from '../common/i18n/localization';
import { nls } from '../common/nls';
import { CurrentWidgetCommandAdapter } from './shell/current-widget-command-adapter';
import { confirmExit, ConfirmSaveDialog, Dialog } from './dialogs';
import { WindowService } from './window/window-service';
import { SecondaryWindowService } from './window/secondary-window-service';
import { DecorationStyle } from './decoration-style';
import { codicon, isPinned, Title, togglePinned, Widget } from './widgets';
import { SaveableService } from './saveable-service';
import { UserWorkingDirectoryProvider } from './user-working-directory-provider';
import { PreferenceChangeEvent, PreferenceScope, PreferenceService, UNTITLED_SCHEME, UntitledResourceResolver } from '../common';
import { SidebarMenu } from './shell/sidebar-menu-widget';
import { UndoRedoHandlerService } from './undo-redo-handler';
import { timeout } from '../common/promise-util';

export const supportCut = environment.electron.is() || document.queryCommandSupported('cut');
export const supportCopy = environment.electron.is() || document.queryCommandSupported('copy');
// Browsers block programmatic paste (document.execCommand('paste') is a no-op and
// document.queryCommandSupported('paste') returns false), so supportPaste is effectively
// electron-only. Keeping it false in browsers is intentional: the ctrlcmd+v keybinding stays
// unregistered, so native paste events reach widget-level listeners (e.g. the navigator), and
// menu paste is handled by dedicated handlers using the async clipboard API.
export const supportPaste = environment.electron.is() || document.queryCommandSupported('paste');

export const RECENT_COMMANDS_STORAGE_KEY = 'commands';

export const CLASSNAME_OS_MAC = 'mac';
export const CLASSNAME_OS_WINDOWS = 'windows';
export const CLASSNAME_OS_LINUX = 'linux';

@injectable()
export class CommonFrontendContribution implements FrontendApplicationContribution, MenuContribution, CommandContribution, KeybindingContribution, ColorContribution {

    protected commonDecorationsStyleSheet: CSSStyleSheet = DecorationStyle.createStyleSheet('coreCommonDecorationsStyle');

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(OpenerService) protected readonly openerService: OpenerService,
        @inject(AboutDialog) protected readonly aboutDialog: AboutDialog,
        @inject(AsyncLocalizationProvider) protected readonly localizationProvider: AsyncLocalizationProvider,
        @inject(SaveableService) protected readonly saveResourceService: SaveableService,
    ) { }

    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    @inject(ResourceContextKey)
    protected readonly resourceContextKey: ResourceContextKey;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(StorageService)
    protected readonly storageService: StorageService;

    @inject(QuickInputService) @optional()
    protected readonly quickInputService: QuickInputService;

    @inject(IconThemeService)
    protected readonly iconThemes: IconThemeService;

    @inject(ThemeService)
    protected readonly themeService: ThemeService;

    @inject(CorePreferences)
    protected readonly preferences: CorePreferences;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    @inject(EncodingRegistry)
    protected readonly encodingRegistry: EncodingRegistry;

    @inject(EnvVariablesServer)
    protected readonly environments: EnvVariablesServer;

    @inject(AuthenticationService)
    protected readonly authenticationService: AuthenticationService;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(SecondaryWindowService)
    protected readonly secondaryWindowService: SecondaryWindowService;

    @inject(UserWorkingDirectoryProvider)
    protected readonly workingDirProvider: UserWorkingDirectoryProvider;

    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;

    @inject(UndoRedoHandlerService)
    protected readonly undoRedoHandlerService: UndoRedoHandlerService;

    protected pinnedKey: ContextKey<boolean>;

    async configure(app: FrontendApplication): Promise<void> {
        // FIXME: This request blocks valuable startup time (~200ms).
        const configDirUri = await this.environments.getConfigDirUri();
        // Global settings
        this.encodingRegistry.registerOverride({
            encoding: UTF8,
            parent: new URI(configDirUri)
        });

        this.contextKeyService.createKey<boolean>('isLinux', OS.type() === OS.Type.Linux);
        this.contextKeyService.createKey<boolean>('isMac', OS.type() === OS.Type.OSX);
        this.contextKeyService.createKey<boolean>('isWindows', OS.type() === OS.Type.Windows);
        this.contextKeyService.createKey<boolean>('isWeb', !this.isElectron());
        // Note: the 'inputFocus' context key is tracked by Monaco's ContextKeyService
        // which sets it for <input>, <textarea>, and elements with EditContext (Monaco editors).
        // We no longer track it separately to avoid race conditions between two focusin listeners.

        this.pinnedKey = this.contextKeyService.createKey<boolean>('activeEditorIsPinned', false);
        this.updatePinnedKey();
        this.shell.onDidChangeActiveWidget(() => this.updatePinnedKey());

        this.initResourceContextKeys();
        this.registerCtrlWHandling();

        this.setOsClass();
        this.updateStyles();
        this.preferences.ready.then(() => this.setSashProperties());
        this.preferences.onPreferenceChanged(e => this.handlePreferenceChange(e, app));

        app.shell.initialized.then(() => {
            app.shell.leftPanelHandler.addBottomMenu({
                id: 'settings-menu',
                iconClass: codicon('settings-gear'),
                title: nls.localizeByDefault(CommonCommands.MANAGE_CATEGORY),
                menuPath: MANAGE_MENU,
                order: 0,
            });
            const accountsMenu: SidebarMenu = {
                id: 'accounts-menu',
                iconClass: codicon('account'),
                title: nls.localizeByDefault('账户'),
                menuPath: ACCOUNTS_MENU,
                order: 1,
                onDidBadgeChange: this.authenticationService.onDidUpdateSignInCount
            };
            this.authenticationService.onDidRegisterAuthenticationProvider(() => {
                app.shell.leftPanelHandler.addBottomMenu(accountsMenu);
            });
            this.authenticationService.onDidUnregisterAuthenticationProvider(() => {
                if (this.authenticationService.getProviderIds().length === 0) {
                    app.shell.leftPanelHandler.removeBottomMenu(accountsMenu.id);
                }
            });
        });
    }

    protected setOsClass(): void {
        const osClass = this.getOsClass();
        document.body.classList.add(osClass);
        // The OS class selects the platform-specific font stacks in os.css. Secondary windows
        // have their own document, so apply it there as well.
        this.secondaryWindowService.onWindowLoaded(win => win.document.body.classList.add(osClass));
    }

    protected getOsClass(): string {
        if (isOSX) {
            return CLASSNAME_OS_MAC;
        } else if (isWindows) {
            return CLASSNAME_OS_WINDOWS;
        } else {
            return CLASSNAME_OS_LINUX;
        }
    }

    protected updateStyles(): void {
        document.body.classList.remove('theia-editor-highlightModifiedTabs');
        if (this.preferences['workbench.editor.highlightModifiedTabs']) {
            document.body.classList.add('theia-editor-highlightModifiedTabs');
        }
    }

    protected updatePinnedKey(): void {
        const activeTab = this.shell.findTabBar();
        const pinningTarget = activeTab && this.shell.findTitle(activeTab);
        const value = pinningTarget && isPinned(pinningTarget);
        this.pinnedKey.set(value);
    }

    protected handlePreferenceChange(e: PreferenceChangeEvent<CoreConfiguration>, app: FrontendApplication): void {
        switch (e.preferenceName) {
            case 'workbench.editor.highlightModifiedTabs': {
                this.updateStyles();
                break;
            }
            case 'window.menuBarVisibility': {
                const menuBarVisibility = this.preferences['window.menuBarVisibility'];
                const mainMenuId = 'main-menu';
                if (menuBarVisibility === 'compact') {
                    this.shell.leftPanelHandler.addTopMenu({
                        id: mainMenuId,
                        iconClass: `theia-compact-menu ${codicon('menu')}`,
                        title: nls.localizeByDefault('应用程序菜单'),
                        menuPath: MAIN_MENU_BAR,
                        order: 0,
                    });
                } else {
                    app.shell.leftPanelHandler.removeTopMenu(mainMenuId);
                }
                break;
            }
            case 'workbench.sash.hoverDelay':
            case 'workbench.sash.size': {
                this.setSashProperties();
                break;
            }
        }
    }

    protected setSashProperties(): void {
        const sashRule = `:root {
            --theia-sash-hoverDelay: ${this.preferences['workbench.sash.hoverDelay']}ms;
            --theia-sash-width: ${this.preferences['workbench.sash.size']}px;
        }`;

        DecorationStyle.deleteStyleRule(':root', this.commonDecorationsStyleSheet);
        this.commonDecorationsStyleSheet.insertRule(sashRule);
    }

    onStart(): void {
        this.setupHtmlLanguageAttributes(document.documentElement);
        this.storageService.getData<{ recent: Command[] }>(RECENT_COMMANDS_STORAGE_KEY, { recent: [] })
            .then(tasks => this.commandRegistry.recent = tasks.recent);
    }

    protected setupHtmlLanguageAttributes(element: HTMLElement): void {
        nls.setHtmlLang(element);
        nls.setHtmlNoTranslate(element);
    }

    onStop(): void {
        const recent = this.commandRegistry.recent;
        this.storageService.setData<{ recent: Command[] }>(RECENT_COMMANDS_STORAGE_KEY, { recent });
        window.localStorage.setItem(IconThemeService.STORAGE_KEY, this.iconThemes.current);
        window.localStorage.setItem(ThemeService.STORAGE_KEY, this.themeService.getCurrentTheme().id);
    }

    protected initResourceContextKeys(): void {
        const updateContextKeys = () => {
            const selection = this.selectionService.selection;
            const resourceUri = Navigatable.is(selection) && selection.getResourceUri() || UriSelection.getUri(selection);
            this.resourceContextKey.set(resourceUri);
        };
        updateContextKeys();
        this.selectionService.onSelectionChanged(updateContextKeys);
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerSubmenu(CommonMenus.FILE, nls.localizeByDefault('文件'));
        registry.registerSubmenu(CommonMenus.EDIT, nls.localizeByDefault('编辑'));
        registry.registerSubmenu(CommonMenus.VIEW, nls.localizeByDefault('视图'));
        registry.registerSubmenu(CommonMenus.HELP, nls.localizeByDefault('帮助'));

        // For plugins contributing create new file commands/menu-actions
        registry.registerSubmenu(CommonMenus.FILE_NEW_CONTRIBUTIONS, nls.localizeByDefault('新建文件...'));

        registry.registerMenuAction(CommonMenus.FILE_SAVE, {
            commandId: CommonCommands.SAVE.id
        });
        registry.registerMenuAction(CommonMenus.FILE_SAVE, {
            commandId: CommonCommands.SAVE_ALL.id
        });

        registry.registerMenuAction(CommonMenus.FILE_AUTOSAVE, {
            commandId: CommonCommands.AUTO_SAVE.id
        });

        registry.registerSubmenu(CommonMenus.FILE_SETTINGS_SUBMENU, nls.localizeByDefault(CommonCommands.PREFERENCES_CATEGORY));

        registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
            commandId: CommonCommands.UNDO.id,
            order: '0'
        });
        registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
            commandId: CommonCommands.REDO.id,
            order: '1'
        });

        registry.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: CommonCommands.FIND.id,
            order: '0'
        });
        registry.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: CommonCommands.REPLACE.id,
            order: '1'
        });

        registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
            commandId: CommonCommands.CUT.id,
            order: '0'
        });
        registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
            commandId: CommonCommands.COPY.id,
            order: '1'
        });
        registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
            commandId: CommonCommands.PASTE.id,
            order: '2'
        });
        registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
            commandId: CommonCommands.COPY_PATH.id,
            order: '3'
        });

        registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
            commandId: CommonCommands.TOGGLE_BOTTOM_PANEL.id,
            order: '1'
        });
        registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
            commandId: CommonCommands.TOGGLE_STATUS_BAR.id,
            order: '2',
            label: nls.localizeByDefault('切换状态栏可见性')
        });
        registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
            commandId: CommonCommands.COLLAPSE_ALL_PANELS.id,
            order: '3'
        });

        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
            commandId: CommonCommands.CLOSE_TAB.id,
            label: nls.localizeByDefault('关闭'),
            order: '0'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
            commandId: CommonCommands.CLOSE_OTHER_TABS.id,
            label: nls.localizeByDefault('关闭其他'),
            order: '1'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
            commandId: CommonCommands.CLOSE_RIGHT_TABS.id,
            label: nls.localizeByDefault('关闭右侧'),
            order: '2'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
            commandId: CommonCommands.CLOSE_SAVED_TABS.id,
            label: nls.localizeByDefault('关闭已保存'),
            order: '3',
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
            commandId: CommonCommands.CLOSE_ALL_TABS.id,
            label: nls.localizeByDefault('全部关闭'),
            order: '4'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
            commandId: CommonCommands.COLLAPSE_PANEL.id,
            label: CommonCommands.COLLAPSE_PANEL.label,
            order: '5'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
            commandId: CommonCommands.TOGGLE_MAXIMIZED.id,
            label: CommonCommands.TOGGLE_MAXIMIZED.label,
            order: '6'
        });
        registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_SCREEN, {
            commandId: CommonCommands.TOGGLE_MAXIMIZED.id,
            label: CommonCommands.TOGGLE_MAXIMIZED.label,
            order: '6'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_COPY, {
            commandId: CommonCommands.COPY_PATH.id,
            label: CommonCommands.COPY_PATH.label,
            order: '1',
        });
        registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
            commandId: CommonCommands.SHOW_MENU_BAR.id,
            label: nls.localizeByDefault('切换菜单栏'),
            order: '0'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_PIN, {
            commandId: CommonCommands.PIN_TAB.id,
            label: nls.localizeByDefault('固定'),
            order: '7'
        });
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_PIN, {
            commandId: CommonCommands.UNPIN_TAB.id,
            label: nls.localizeByDefault('取消固定'),
            order: '8'
        });
        registry.registerMenuAction(CommonMenus.HELP, {
            commandId: CommonCommands.ABOUT_COMMAND.id,
            label: CommonCommands.ABOUT_COMMAND.label,
            order: '9'
        });

        registry.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
            commandId: CommonCommands.OPEN_VIEW.id
        });

        registry.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_THEME, {
            commandId: CommonCommands.SELECT_COLOR_THEME.id
        });
        registry.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_THEME, {
            commandId: CommonCommands.SELECT_ICON_THEME.id
        });

        registry.registerSubmenu(CommonMenus.MANAGE_SETTINGS_THEMES, nls.localizeByDefault('主题'), { sortString: 'a50' });
        registry.registerMenuAction(CommonMenus.MANAGE_SETTINGS_THEMES, {
            commandId: CommonCommands.SELECT_COLOR_THEME.id,
            order: '0'
        });
        registry.registerMenuAction(CommonMenus.MANAGE_SETTINGS_THEMES, {
            commandId: CommonCommands.SELECT_ICON_THEME.id,
            order: '1'
        });

        registry.registerSubmenu(CommonMenus.VIEW_APPEARANCE_SUBMENU, nls.localizeByDefault('外观'));

        registry.registerMenuAction(CommonMenus.FILE_NEW_TEXT, {
            commandId: CommonCommands.NEW_UNTITLED_TEXT_FILE.id,
            label: nls.localizeByDefault('新建文本文件'),
            order: 'a'
        });

        registry.registerMenuAction(CommonMenus.FILE_NEW_TEXT, {
            commandId: CommonCommands.PICK_NEW_FILE.id,
            label: nls.localizeByDefault('新建文件...'),
            order: 'a1'
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(CommonCommands.OPEN, UriAwareCommandHandler.MultiSelect(this.selectionService, {
            execute: uris => uris.map(uri => open(this.openerService, uri)),
        }));
        commandRegistry.registerCommand(CommonCommands.CUT, {
            execute: () => {
                if (supportCut) {
                    const active = document.activeElement;
                    if (environment.electron.is() && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
                        const start = active.selectionStart ?? 0;
                        const end = active.selectionEnd ?? 0;
                        const selectedText = active.value.substring(start, end);
                        if (selectedText) {
                            this.clipboardService.writeText(selectedText);
                            document.execCommand('insertText', false, '');
                        }
                    } else {
                        document.execCommand('cut');
                    }
                } else {
                    this.messageService.warn(nls.localize('theia/core/cutWarn', "请使用浏览器的剪切命令或快捷键。"));
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.COPY, {
            execute: () => {
                if (supportCopy) {
                    const active = document.activeElement;
                    if (environment.electron.is() && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
                        const start = active.selectionStart ?? 0;
                        const end = active.selectionEnd ?? 0;
                        const selectedText = active.value.substring(start, end);
                        if (selectedText) {
                            this.clipboardService.writeText(selectedText);
                        }
                    } else {
                        document.execCommand('copy');
                    }
                } else {
                    this.messageService.warn(nls.localize('theia/core/copyWarn', "请使用浏览器的复制命令或快捷键。"));
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.PASTE, {
            execute: async () => {
                if (supportPaste) {
                    const active = document.activeElement;
                    if (environment.electron.is() && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
                        const text = await this.clipboardService.readText();
                        if (text) {
                            document.execCommand('insertText', false, text);
                        }
                    } else {
                        document.execCommand('paste');
                    }
                } else {
                    this.messageService.warn(nls.localize('theia/core/pasteWarn', "请使用浏览器的粘贴命令或快捷键。"));
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.COPY_PATH, UriAwareCommandHandler.MultiSelect(this.selectionService, {
            isVisible: uris => Array.isArray(uris) && uris.some(uri => uri instanceof URI),
            isEnabled: uris => Array.isArray(uris) && uris.some(uri => uri instanceof URI),
            execute: async uris => {
                if (uris.length) {
                    const lineDelimiter = EOL;
                    const text = uris.map(resource => resource.path.fsPath()).join(lineDelimiter);
                    await this.clipboardService.writeText(text);
                } else {
                    await this.messageService.info(nls.localize('theia/core/copyInfo', '请先打开一个文件以复制其路径'));
                }
            }
        }));

        commandRegistry.registerCommand(CommonCommands.UNDO, {
            execute: () => {
                this.undoRedoHandlerService.undo();
            }
        });
        commandRegistry.registerCommand(CommonCommands.REDO, {
            execute: () => {
                this.undoRedoHandlerService.redo();
            }
        });
        commandRegistry.registerCommand(CommonCommands.SELECT_ALL, {
            execute: () => document.execCommand('selectAll')
        });

        commandRegistry.registerCommand(CommonCommands.FIND, {
            execute: () => { /* no-op */ }
        });
        commandRegistry.registerCommand(CommonCommands.REPLACE, {
            execute: () => { /* no-op */ }
        });

        commandRegistry.registerCommand(CommonCommands.NEXT_TAB, {
            isEnabled: () => this.shell.currentTabBar !== undefined,
            execute: () => this.shell.activateNextTab()
        });
        commandRegistry.registerCommand(CommonCommands.PREVIOUS_TAB, {
            isEnabled: () => this.shell.currentTabBar !== undefined,
            execute: () => this.shell.activatePreviousTab()
        });
        commandRegistry.registerCommand(CommonCommands.NEXT_TAB_IN_GROUP, {
            isEnabled: () => this.shell.nextTabIndexInTabBar() !== -1,
            execute: () => this.shell.activateNextTabInTabBar()
        });
        commandRegistry.registerCommand(CommonCommands.PREVIOUS_TAB_IN_GROUP, {
            isEnabled: () => this.shell.previousTabIndexInTabBar() !== -1,
            execute: () => this.shell.activatePreviousTabInTabBar()
        });
        commandRegistry.registerCommand(CommonCommands.NEXT_TAB_GROUP, {
            isEnabled: () => this.shell.nextTabBar() !== undefined,
            execute: () => this.shell.activateNextTabBar()
        });
        commandRegistry.registerCommand(CommonCommands.PREVIOUS_TAB_GROUP, {
            isEnabled: () => this.shell.previousTabBar() !== undefined,
            execute: () => this.shell.activatePreviousTabBar()
        });
        commandRegistry.registerCommand(CommonCommands.CLOSE_TAB, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: title => Boolean(title?.closable),
            execute: (title, tabBar) => tabBar && this.shell.closeTabs(tabBar, candidate => candidate === title),
        }));
        commandRegistry.registerCommand(CommonCommands.CLOSE_OTHER_TABS, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: (title, tabbar) => Boolean(tabbar?.titles.some(candidate => candidate !== title && candidate.closable)),
            execute: (title, tabbar) => tabbar && this.shell.closeTabs(tabbar, candidate => candidate !== title && candidate.closable),
        }));
        commandRegistry.registerCommand(CommonCommands.CLOSE_SAVED_TABS, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: (_title, tabbar) => Boolean(tabbar?.titles.some(candidate => candidate.closable && !Saveable.isDirty(candidate.owner))),
            execute: (_title, tabbar) => tabbar && this.shell.closeTabs(tabbar, candidate => candidate.closable && !Saveable.isDirty(candidate.owner)),
        }));
        commandRegistry.registerCommand(CommonCommands.CLOSE_RIGHT_TABS, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: (title, tabbar) => {
                let targetSeen = false;
                return Boolean(tabbar?.titles.some(candidate => {
                    if (targetSeen && candidate.closable) { return true; };
                    if (candidate === title) { targetSeen = true; };
                }));
            },
            isVisible: (_title, tabbar) => {
                const area = (tabbar && this.shell.getAreaFor(tabbar)) ?? this.shell.currentTabArea;
                return area !== undefined && area !== 'left' && area !== 'right';
            },
            execute: (title, tabbar) => {
                if (tabbar) {
                    let targetSeen = false;
                    this.shell.closeTabs(tabbar, candidate => {
                        if (targetSeen && candidate.closable) { return true; };
                        if (candidate === title) { targetSeen = true; };
                        return false;
                    });
                }
            }
        }));
        commandRegistry.registerCommand(CommonCommands.CLOSE_ALL_TABS, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: (_title, tabbar) => Boolean(tabbar?.titles.some(title => title.closable)),
            execute: (_title, tabbar) => tabbar && this.shell.closeTabs(tabbar, candidate => candidate.closable),
        }));
        commandRegistry.registerCommand(CommonCommands.CLOSE_MAIN_TAB, {
            isEnabled: () => {
                const currentWidget = this.shell.getCurrentWidget('main');
                return currentWidget !== undefined && currentWidget.title.closable;
            },
            execute: () => this.shell.getCurrentWidget('main')!.close()
        });
        commandRegistry.registerCommand(CommonCommands.CLOSE_OTHER_MAIN_TABS, {
            isEnabled: () => {
                const currentWidget = this.shell.getCurrentWidget('main');
                return currentWidget !== undefined &&
                    this.shell.mainAreaTabBars.some(tb => tb.titles.some(title => title.owner !== currentWidget && title.closable));
            },
            execute: () => {
                const currentWidget = this.shell.getCurrentWidget('main');
                this.shell.closeTabs('main', title => title.owner !== currentWidget && title.closable);
            }
        });
        commandRegistry.registerCommand(CommonCommands.CLOSE_ALL_MAIN_TABS, {
            isEnabled: () => this.shell.mainAreaTabBars.some(tb => tb.titles.some(title => title.closable)),
            execute: () => this.shell.closeTabs('main', title => title.closable)
        });
        commandRegistry.registerCommand(CommonCommands.COLLAPSE_PANEL, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: (_title, tabbar) => {
                if (tabbar) {
                    const area = this.shell.getAreaFor(tabbar);
                    return ApplicationShell.isSideArea(area) && this.shell.isExpanded(area);
                }
                return false;
            },
            isVisible: (_title, tabbar) => Boolean(tabbar && ApplicationShell.isSideArea(this.shell.getAreaFor(tabbar))),
            execute: (_title, tabbar) => tabbar && this.shell.collapsePanel(this.shell.getAreaFor(tabbar)!)
        }));
        commandRegistry.registerCommand(CommonCommands.COLLAPSE_ALL_PANELS, {
            execute: () => {
                this.shell.collapsePanel('left');
                this.shell.collapsePanel('right');
                this.shell.collapsePanel('bottom');
            }
        });
        commandRegistry.registerCommand(CommonCommands.TOGGLE_BOTTOM_PANEL, {
            execute: () => {
                if (this.shell.isExpanded('bottom')) {
                    this.shell.collapsePanel('bottom');
                } else {
                    this.shell.expandPanel('bottom');
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.TOGGLE_LEFT_PANEL, {
            isEnabled: () => this.shell.getWidgets('left').length > 0,
            execute: () => {
                if (this.shell.isExpanded('left')) {
                    this.shell.collapsePanel('left');
                } else {
                    this.shell.expandPanel('left');
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.TOGGLE_RIGHT_PANEL, {
            isEnabled: () => this.shell.getWidgets('right').length > 0,
            execute: () => {
                if (this.shell.isExpanded('right')) {
                    this.shell.collapsePanel('right');
                } else {
                    this.shell.expandPanel('right');
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.TOGGLE_STATUS_BAR, {
            execute: () => this.preferenceService.updateValue('workbench.statusBar.visible', !this.preferences['workbench.statusBar.visible'])
        });
        commandRegistry.registerCommand(CommonCommands.TOGGLE_MAXIMIZED, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: title => Boolean(title?.owner && this.shell.canToggleMaximized(title?.owner)),
            isVisible: title => Boolean(title?.owner && this.shell.canToggleMaximized(title?.owner)),
            execute: title => title?.owner && this.shell.toggleMaximized(title?.owner),
        }));
        commandRegistry.registerCommand(CommonCommands.SHOW_MENU_BAR, {
            isEnabled: () => !this.isElectron() || !isOSX,
            isVisible: () => !this.isElectron() || !isOSX,
            execute: () => {
                const menuBarVisibility = 'window.menuBarVisibility';
                const visibility = this.preferences[menuBarVisibility];
                if (visibility !== 'compact') {
                    this.preferenceService.updateValue(menuBarVisibility, 'compact');
                } else {
                    this.preferenceService.updateValue(menuBarVisibility, 'classic');
                }
            }
        });
        commandRegistry.registerCommand(CommonCommands.SAVE, {
            execute: () => this.save({ formatType: FormatType.ON })
        });
        commandRegistry.registerCommand(CommonCommands.SAVE_AS, {
            isEnabled: () => this.saveResourceService.canSaveAs(this.shell.currentWidget),
            execute: () => {
                const { currentWidget } = this.shell;
                // No clue what could have happened between `isEnabled` and `execute`
                // when fetching currentWidget, so better to double-check:
                if (this.saveResourceService.canSaveAs(currentWidget)) {
                    this.saveResourceService.saveAs(currentWidget);
                } else {
                    this.messageService.error(nls.localize('theia/workspace/failSaveAs', '无法对当前部件运行“{0}”。', CommonCommands.SAVE_AS.label!));
                }
            },
        });
        commandRegistry.registerCommand(CommonCommands.SAVE_WITHOUT_FORMATTING, {
            execute: () => this.save({ formatType: FormatType.OFF })
        });
        commandRegistry.registerCommand(CommonCommands.SAVE_ALL, {
            execute: () => this.shell.saveAll({ formatType: FormatType.DIRTY })
        });
        commandRegistry.registerCommand(CommonCommands.ABOUT_COMMAND, {
            execute: () => this.openAbout()
        });

        commandRegistry.registerCommand(CommonCommands.OPEN_VIEW, {
            execute: () => this.quickInputService?.open(QuickViewService.PREFIX)
        });

        commandRegistry.registerCommand(CommonCommands.SELECT_COLOR_THEME, {
            execute: () => this.selectColorTheme()
        });
        commandRegistry.registerCommand(CommonCommands.SELECT_ICON_THEME, {
            execute: () => this.selectIconTheme()
        });
        commandRegistry.registerCommand(CommonCommands.PIN_TAB, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: title => Boolean(title && !isPinned(title)),
            execute: title => this.togglePinned(title),
        }));
        commandRegistry.registerCommand(CommonCommands.UNPIN_TAB, new CurrentWidgetCommandAdapter(this.shell, {
            isEnabled: title => Boolean(title && isPinned(title)),
            execute: title => this.togglePinned(title),
        }));
        commandRegistry.registerCommand(CommonCommands.TOGGLE_BREADCRUMBS, {
            execute: () => this.toggleBreadcrumbs(),
            isToggled: () => this.isBreadcrumbsEnabled(),
        });
        commandRegistry.registerCommand(CommonCommands.NEW_UNTITLED_TEXT_FILE, {
            execute: async () => {
                const untitledUri = this.untitledResourceResolver.createUntitledURI('', await this.workingDirProvider.getUserWorkingDir());
                this.untitledResourceResolver.resolve(untitledUri);
                const editor = await open(this.openerService, untitledUri);
                // Wait for all of the listeners of the `onDidOpen` event to be notified
                await timeout(50);
                // Afterwards, we can return from the command with the newly created editor
                // If we don't wait, we return from the command before the plugin API has been notified of the new editor
                return editor;
            }
        });
        commandRegistry.registerCommand(CommonCommands.PICK_NEW_FILE, {
            execute: async () => this.showNewFilePicker()
        });

        for (const [index, ordinal] of this.getOrdinalNumbers().entries()) {
            commandRegistry.registerCommand({ id: `workbench.action.focus${ordinal}EditorGroup`, label: index === 0 ? nls.localizeByDefault('聚焦第一个编辑器组') : '', category: nls.localize(CommonCommands.VIEW_CATEGORY_KEY, CommonCommands.VIEW_CATEGORY) }, {
                isEnabled: () => this.shell.mainAreaTabBars.length > index,
                execute: () => {
                    const widget = this.shell.mainAreaTabBars[index]?.currentTitle?.owner;
                    if (widget) {
                        this.shell.activateWidget(widget.id);
                    }
                }
            });
        }
    }

    protected getOrdinalNumbers(): readonly string[] {
        return ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];
    }

    protected isElectron(): boolean {
        return environment.electron.is();
    }

    protected togglePinned(title?: Title<Widget>): void {
        if (title) {
            togglePinned(title);
            this.updatePinnedKey();
        }
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        if (supportCut) {
            registry.registerKeybinding({
                command: CommonCommands.CUT.id,
                keybinding: 'ctrlcmd+x'
            });
        }
        if (supportCopy) {
            registry.registerKeybinding({
                command: CommonCommands.COPY.id,
                keybinding: 'ctrlcmd+c'
            });
        }
        if (supportPaste) {
            registry.registerKeybinding({
                command: CommonCommands.PASTE.id,
                keybinding: 'ctrlcmd+v'
            });
        }
        registry.registerKeybinding({
            command: CommonCommands.COPY_PATH.id,
            keybinding: isWindows ? 'shift+alt+c' : 'ctrlcmd+alt+c',
            when: '!editorFocus'
        });
        registry.registerKeybindings(
            // Edition
            {
                command: CommonCommands.UNDO.id,
                keybinding: 'ctrlcmd+z'
            },
            {
                command: CommonCommands.REDO.id,
                keybinding: isOSX ? 'ctrlcmd+shift+z' : 'ctrlcmd+y'
            },
            {
                command: CommonCommands.SELECT_ALL.id,
                keybinding: 'ctrlcmd+a'
            },
            {
                command: CommonCommands.FIND.id,
                keybinding: 'ctrlcmd+f'
            },
            {
                command: CommonCommands.REPLACE.id,
                keybinding: 'ctrlcmd+alt+f'
            },
            // Tabs
            {
                command: CommonCommands.NEXT_TAB.id,
                keybinding: 'ctrl+tab'
            },
            {
                command: CommonCommands.NEXT_TAB.id,
                keybinding: 'ctrlcmd+alt+d'
            },
            {
                command: CommonCommands.PREVIOUS_TAB.id,
                keybinding: 'ctrl+shift+tab'
            },
            {
                command: CommonCommands.PREVIOUS_TAB.id,
                keybinding: 'ctrlcmd+alt+a'
            },
            {
                command: CommonCommands.CLOSE_MAIN_TAB.id,
                keybinding: this.isElectron() ? (isWindows ? 'ctrl+f4' : 'ctrlcmd+w') : 'alt+w'
            },
            {
                command: CommonCommands.CLOSE_OTHER_MAIN_TABS.id,
                keybinding: 'ctrlcmd+alt+t'
            },
            {
                command: CommonCommands.CLOSE_ALL_MAIN_TABS.id,
                keybinding: this.isElectron() ? 'ctrlCmd+k ctrlCmd+w' : 'alt+shift+w'
            },
            // Panels
            {
                command: CommonCommands.COLLAPSE_PANEL.id,
                keybinding: 'alt+c'
            },
            {
                command: CommonCommands.TOGGLE_BOTTOM_PANEL.id,
                keybinding: 'ctrlcmd+j',
            },
            {
                command: CommonCommands.COLLAPSE_ALL_PANELS.id,
                keybinding: 'alt+shift+c',
            },
            {
                command: CommonCommands.TOGGLE_MAXIMIZED.id,
                keybinding: 'alt+m',
            },
            // Saving
            {
                command: CommonCommands.SAVE.id,
                keybinding: 'ctrlcmd+s'
            },
            {
                command: CommonCommands.SAVE_WITHOUT_FORMATTING.id,
                keybinding: 'ctrlcmd+k s'
            },
            {
                command: CommonCommands.SAVE_ALL.id,
                keybinding: 'ctrlcmd+alt+s'
            },
            // Theming
            {
                command: CommonCommands.SELECT_COLOR_THEME.id,
                keybinding: 'ctrlcmd+k ctrlcmd+t'
            },
            {
                command: CommonCommands.PIN_TAB.id,
                keybinding: 'ctrlcmd+k shift+enter',
                when: '!activeEditorIsPinned'
            },
            {
                command: CommonCommands.UNPIN_TAB.id,
                keybinding: 'ctrlcmd+k shift+enter',
                when: 'activeEditorIsPinned'
            },
            {
                command: CommonCommands.NEW_UNTITLED_TEXT_FILE.id,
                keybinding: this.isElectron() ? 'ctrlcmd+n' : 'alt+n',
            },
            {
                command: CommonCommands.PICK_NEW_FILE.id,
                keybinding: 'ctrlcmd+alt+n'
            }
        );
        for (const [index, ordinal] of this.getOrdinalNumbers().entries()) {
            registry.registerKeybinding({
                command: `workbench.action.focus${ordinal}EditorGroup`,
                keybinding: `ctrlcmd+${(index + 1) % 10}`,
            });
        }
    }

    protected async save(options?: SaveOptions): Promise<void> {
        const widget = this.shell.currentWidget;
        this.saveResourceService.save(widget, options);
    }

    protected async openAbout(): Promise<void> {
        this.aboutDialog.open(false);
    }

    protected shouldPreventClose = false;

    /**
     * registers event listener which make sure that
     * window doesn't get closed if CMD/CTRL W is pressed.
     * Too many users have that in their muscle memory.
     * Chrome doesn't let us rebind or prevent default the keybinding, so this
     * at least doesn't close the window immediately.
     */
    protected registerCtrlWHandling(): void {
        function isCtrlCmd(event: KeyboardEvent): boolean {
            return (isOSX && event.metaKey) || (!isOSX && event.ctrlKey);
        }

        window.document.addEventListener('keydown', event => {
            this.shouldPreventClose = isCtrlCmd(event) && event.code === 'KeyW';
        });

        window.document.addEventListener('keyup', () => {
            this.shouldPreventClose = false;
        });
    }

    onWillStop(): OnWillStopAction | undefined {
        if (this.shouldPreventClose || this.shell.canSaveAll()) {
            return {
                reason: 'Dirty editors present',
                action: async () => {
                    const captionsToSave = this.unsavedTabsCaptions();
                    const untitledCaptionsToSave = this.unsavedUntitledTabsCaptions();
                    const shouldExit = await this.confirmExitWithOrWithoutSaving(captionsToSave, async () => {
                        await this.saveDirty(untitledCaptionsToSave);
                        await this.shell.saveAll();
                    });
                    const allSavedOrDoNotSave = (
                        shouldExit === true && untitledCaptionsToSave.length === 0 // Should save and cancel if any captions failed to save
                    ) || shouldExit === false; // Do not save

                    this.shouldPreventClose = !allSavedOrDoNotSave;
                    return allSavedOrDoNotSave;

                }
            };
        }
    }
    // Asks the user to confirm whether they want to exit with or without saving the changes
    private async confirmExitWithOrWithoutSaving(captionsToSave: string[], performSave: () => Promise<void>): Promise<boolean | undefined> {
        const div: HTMLElement = document.createElement('div');
        div.innerText = nls.localizeByDefault("如果不保存，你的更改将丢失。");

        let result;
        if (captionsToSave.length > 0) {
            const span = document.createElement('span');
            span.appendChild(document.createElement('br'));
            captionsToSave.forEach(cap => {
                const b = document.createElement('b');
                b.innerText = cap;
                span.appendChild(b);
                span.appendChild(document.createElement('br'));
            });
            span.appendChild(document.createElement('br'));
            div.appendChild(span);
            result = await new ConfirmSaveDialog({
                title: nls.localizeByDefault('是否要保存对以下 {0} 个文件的更改？', captionsToSave.length),
                msg: div,
                dontSave: nls.localizeByDefault('不保存'),
                save: nls.localizeByDefault('全部保存'),
                cancel: Dialog.CANCEL
            }).open();

            if (result) {
                await performSave();
            }
        } else {
            // fallback if not passed with an empty caption-list.
            result = confirmExit();
        }
        if (result !== undefined) {
            return result === true;
        } else {
            return undefined;
        };

    }
    protected unsavedTabsCaptions(): string[] {
        return this.shell.widgets
            .filter(widget => this.saveResourceService.canSave(widget))
            .map(widget => widget.title.label);
    }
    protected unsavedUntitledTabsCaptions(): Widget[] {
        return this.shell.widgets.filter(widget =>
            NavigatableWidget.getUri(widget)?.scheme === UNTITLED_SCHEME && this.saveResourceService.canSaveAs(widget)
        );
    }
    /**
     * saves any dirty widget in toSave
     * side effect - will pop all widgets from toSave that was saved
     * @param toSave
     */
    protected async saveDirty(toSave: Widget[]): Promise<void> {
        for (const widget of toSave) {
            const saveable = Saveable.get(widget);
            if (saveable?.dirty) {
                await this.saveResourceService.save(widget);
                if (!this.saveResourceService.canSave(widget)) {
                    toSave.pop();
                }
            }
        }
    }
    protected toggleBreadcrumbs(): void {
        const value: boolean | undefined = this.preferenceService.get('breadcrumbs.enabled');
        this.preferenceService.set('breadcrumbs.enabled', !value, PreferenceScope.User);
    }

    protected isBreadcrumbsEnabled(): boolean {
        return !!this.preferenceService.get('breadcrumbs.enabled');
    }

    protected selectIconTheme(): void {
        let resetTo: IconTheme | undefined = this.iconThemes.getCurrent();
        const setTheme = (id: string, persist: boolean) => {
            const theme = this.iconThemes.getDefinition(id);
            if (theme) {
                this.iconThemes.setCurrent(theme as IconTheme, persist);
            }
        };
        const previewTheme = debounce(setTheme, 200);

        let items: Array<QuickPickItem & { id: string }> = [];
        for (const iconTheme of this.iconThemes.definitions) {
            items.push({
                id: iconTheme.id,
                label: iconTheme.label,
                description: iconTheme.description,
            });
        }
        items = items.sort((a, b) => {
            if (a.id === 'none') {
                return -1;
            }
            return a.label!.localeCompare(b.label!);
        });

        this.quickInputService?.showQuickPick(items,
            {
                placeholder: nls.localizeByDefault('选择文件图标主题'),
                activeItem: items.find(item => item.id === resetTo?.id),
                onDidChangeSelection: (_, selectedItems) => {
                    resetTo = undefined;
                    setTheme(selectedItems[0].id, true);
                },
                onDidChangeActive: (_, activeItems) => {
                    previewTheme(activeItems[0].id, false);
                },
                onDidHide: () => {
                    if (resetTo) {
                        this.iconThemes.setCurrent(resetTo, false);
                    }
                }
            });
    }

    protected selectColorTheme(): void {
        let resetTo: string | undefined = this.themeService.getCurrentTheme().id;
        const setTheme = (id: string, persist: boolean) => this.themeService.setCurrentTheme(id, persist);
        const previewTheme = debounce(setTheme, 200);
        type QuickPickWithId = QuickPickItem & { id: string };
        const itemsByTheme: {
            light: Array<QuickPickWithId>,
            dark: Array<QuickPickWithId>,
            hc: Array<QuickPickWithId>,
            hcLight: Array<QuickPickWithId>
        } = { light: [], dark: [], hc: [], hcLight: [] };

        const lightThemesSeparator = nls.localizeByDefault('浅色主题');
        const darkThemesSeparator = nls.localizeByDefault('深色主题');
        const highContrastThemesSeparator = nls.localizeByDefault('高对比度主题');

        for (const theme of this.themeService.getThemes().sort((a, b) => a.label.localeCompare(b.label))) {
            const themeItems: QuickPickItemOrSeparator[] = itemsByTheme[theme.type];

            // Add a separator for the first item in the respective group.
            // High Contrast Themes despite dark or light should be grouped together.
            if (themeItems.length === 0 && theme.type !== 'hcLight') {
                let label = '';
                if (theme.type === 'light') {
                    label = lightThemesSeparator;
                } else if (theme.type === 'dark') {
                    label = darkThemesSeparator;
                } else {
                    label = highContrastThemesSeparator;
                }
                themeItems.push({
                    type: 'separator',
                    label
                });
            }

            themeItems.push({
                id: theme.id,
                label: theme.label,
                description: theme.description,
            });
        }
        const items = [...itemsByTheme.light, ...itemsByTheme.dark, ...itemsByTheme.hc, ...itemsByTheme.hcLight];
        this.quickInputService?.showQuickPick(items,
            {
                placeholder: nls.localizeByDefault('选择颜色主题'),
                activeItem: items.find(item => item.id === resetTo),
                onDidChangeSelection: (_, selectedItems) => {
                    resetTo = undefined;
                    setTheme(selectedItems[0].id, true);
                },
                onDidChangeActive: (_, activeItems) => {
                    previewTheme(activeItems[0].id, false);
                },
                onDidHide: () => {
                    if (resetTo) {
                        setTheme(resetTo, false);
                    }
                }
            });
    }

    /**
     * @todo https://github.com/eclipse-theia/theia/issues/12824
     */
    protected async showNewFilePicker(): Promise<void> {
        const newFileContributions = this.menuRegistry.getMenuNode(CommonMenus.FILE_NEW_CONTRIBUTIONS) as Submenu; // Add menus
        const items: QuickPickItemOrSeparator[] = [
            {
                label: nls.localizeByDefault('新建文本文件'),
                description: nls.localizeByDefault('内置'),
                execute: async () => this.commandRegistry.executeCommand(CommonCommands.NEW_UNTITLED_TEXT_FILE.id)
            },
            ...newFileContributions.children
                .flatMap(node => {
                    if (CompoundMenuNode.is(node) && node.children.length > 0) {
                        return node.children;
                    }
                    return node;
                })
                .filter(node => Group.is(node) || CommandMenu.is(node))
                .map(node => {
                    if (Group.is(node)) {
                        return { type: 'separator' } as QuickPickSeparator;
                    } else {
                        const item = node as CommandMenu;
                        return {
                            label: item.label,
                            execute: () => item.run(CommonMenus.FILE_NEW_CONTRIBUTIONS)
                        };
                    }
                })
        ];

        const CREATE_NEW_FILE_ITEM_ID = 'create-new-file';
        const hasNewFileHandler = this.commandRegistry.getActiveHandler(CommonCommands.NEW_FILE.id) !== undefined;
        // Create a "Create New File" item only if there is a NEW_FILE command handler.
        const createNewFileItem: QuickPickItem & { value?: string } | undefined = hasNewFileHandler ? {
            id: CREATE_NEW_FILE_ITEM_ID,
            label: nls.localizeByDefault('新建文件 ({0})'),
            description: nls.localizeByDefault('内置'),
            execute: async () => {
                if (createNewFileItem?.value) {
                    const parent = await this.workingDirProvider.getUserWorkingDir();
                    // Exec NEW_FILE command with the file name and parent dir as arguments
                    return this.commandRegistry.executeCommand(CommonCommands.NEW_FILE.id, createNewFileItem.value, parent);
                }
            }
        } : undefined;

        this.quickInputService.showQuickPick(items, {
            title: nls.localizeByDefault('新建文件...'),
            placeholder: nls.localizeByDefault('选择文件类型或输入文件名...'),
            canSelectMany: false,
            onDidChangeValue: picker => {
                if (createNewFileItem === undefined) {
                    return;
                }
                // Dynamically show or hide the "Create New File" item based on the input value.
                if (picker.value) {
                    createNewFileItem.alwaysShow = true;
                    createNewFileItem.value = picker.value;
                    createNewFileItem.label = nls.localizeByDefault('新建文件 ({0})', picker.value);
                    picker.items = [...items, createNewFileItem];
                } else {
                    createNewFileItem.alwaysShow = false;
                    createNewFileItem.value = undefined;
                    picker.items = items.filter(item => item !== createNewFileItem);
                }
            }
        });
    }

    registerColors(colors: ColorRegistry): void {
        colors.register(
            // Base Colors should be aligned with https://code.visualstudio.com/api/references/theme-color#base-colors
            // if not yet contributed by Monaco, check runtime css variables to learn
            { id: 'selection.background', defaults: { dark: '#217daf', light: '#c0dbf1' }, description: '聚焦元素的整体边框颜色。此颜色仅在未被组件覆盖时使用。' },
            { id: 'icon.foreground', defaults: { dark: '#C5C5C5', light: '#424242', hcDark: '#FFFFFF', hcLight: '#292929' }, description: '工作台图标的默认颜色。' },
            { id: 'sash.hoverBorder', defaults: { dark: Color.transparent('focusBorder', 0.99), light: Color.transparent('focusBorder', 0.99), hcDark: 'focusBorder', hcLight: 'focusBorder' }, description: '可拖动分隔条的悬停边框颜色。' },
            { id: 'sash.activeBorder', defaults: { dark: 'focusBorder', light: 'focusBorder', hcDark: 'focusBorder' }, description: '可拖动分隔条的活动边框颜色。' },
            // Window border colors should be aligned with https://code.visualstudio.com/api/references/theme-color#window-border
            {
                id: 'window.activeBorder', defaults: {
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                }, description: '窗口处于活动状态时其边框使用的颜色。'
            },
            {
                id: 'window.inactiveBorder', defaults: {
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                },
                description: '窗口处于非活动状态时其边框使用的颜色。'
            },

            // Activity Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#activity-bar
            {
                id: 'activityBar.background', defaults: {
                    dark: '#333333',
                    light: '#2C2C2C',
                    hcDark: '#000000',
                    hcLight: '#FFFFFF'
                }, description: '活动栏的背景颜色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            {
                id: 'activityBar.foreground', defaults: {
                    dark: Color.white,
                    light: Color.white,
                    hcDark: Color.white,
                    hcLight: 'editor.foreground'
                }, description: '活动栏项处于活动状态时的前景色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。',
            },
            {
                id: 'activityBar.inactiveForeground', defaults: {
                    dark: Color.transparent('activityBar.foreground', 0.4),
                    light: Color.transparent('activityBar.foreground', 0.4),
                    hcDark: Color.white,
                    hcLight: 'editor.foreground'
                }, description: '活动栏项处于非活动状态时的前景色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            {
                id: 'activityBar.border', defaults: {
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                }, description: '活动栏与侧边栏分隔的边框颜色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            {
                id: 'activityBar.activeBorder', defaults: {
                    dark: 'activityBar.foreground',
                    light: 'activityBar.foreground',
                    hcLight: 'contrastBorder'
                }, description: '活动栏活动项的边框颜色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            {
                id: 'activityBar.activeFocusBorder', defaults: {
                    hcLight: '#B5200D'
                }, description: '活动栏活动项的焦点边框颜色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            { id: 'activityBar.activeBackground', description: '活动栏活动项的背景颜色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。' },
            {
                id: 'activityBar.dropBackground', defaults: {
                    dark: Color.transparent('#ffffff', 0.12),
                    light: Color.transparent('#ffffff', 0.12),
                    hcDark: Color.transparent('#ffffff', 0.12),
                }, description: '活动栏项的拖放反馈颜色。该颜色应带有透明度，以便活动栏条目仍能透出。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            {
                id: 'activityBarBadge.background', defaults: {
                    dark: '#007ACC',
                    light: '#007ACC',
                    hcDark: '#000000',
                    hcLight: '#0F4A85'
                }, description: '活动通知徽章的背景颜色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },
            {
                id: 'activityBarBadge.foreground', defaults: {
                    dark: Color.white,
                    light: Color.white,
                    hcDark: Color.white,
                    hcLight: Color.white
                }, description: '活动通知徽章的前景色。活动栏显示在最左侧或最右侧，用于在侧边栏的各视图之间切换。'
            },

            // Side Bar should be aligned with https://code.visualstudio.com/api/references/theme-color#side-bar
            // if not yet contributed by Monaco, check runtime css variables to learn
            { id: 'sideBar.background', defaults: { dark: '#252526', light: '#F3F3F3', hcDark: '#000000', hcLight: '#FFFFFF' }, description: '侧边栏的背景颜色。侧边栏是资源管理器和搜索等视图的容器。' },
            { id: 'sideBar.foreground', description: '侧边栏的前景色。侧边栏是资源管理器和搜索等视图的容器。' },
            { id: 'sideBarSectionHeader.background', defaults: { dark: '#80808033', light: '#80808033' }, description: '侧边栏分区标题的背景颜色。侧边栏是资源管理器和搜索等视图的容器。' },
            { id: 'sideBarSectionHeader.foreground', description: '侧边栏的前景色。侧边栏是资源管理器和搜索等视图的容器。' },
            { id: 'sideBarSectionHeader.border', defaults: { dark: 'contrastBorder', light: 'contrastBorder', hcDark: 'contrastBorder', hcLight: 'contrastBorder' }, description: '侧边栏分区标题的边框颜色。侧边栏是资源管理器和搜索等视图的容器。' },

            // Lists and Trees colors should be aligned with https://code.visualstudio.com/api/references/theme-color#lists-and-trees
            // if not yet contributed by Monaco, check runtime css variables to learn.
            // TODO: Following are not yet supported/no respective elements in theia:
            // list.focusBackground, list.focusForeground, list.inactiveFocusBackground, list.filterMatchBorder,
            // list.dropBackground, listFilterWidget.outline, listFilterWidget.noMatchesOutline
            // list.invalidItemForeground => tree node needs an respective class
            { id: 'list.activeSelectionBackground', defaults: { dark: '#094771', light: '#E8E8E8', hcLight: Color.transparent('#0F4A85', 0.1) }, description: '列表/树处于活动状态时选中项的背景颜色。活动的列表/树拥有键盘焦点，非活动的则没有。' },
            { id: 'list.activeSelectionForeground', defaults: { dark: '#FFF', light: '#FFF' }, description: '列表/树处于活动状态时选中项的前景色。活动的列表/树拥有键盘焦点，非活动的则没有。' },
            { id: 'list.inactiveSelectionBackground', defaults: { dark: '#37373D', light: '#E4E6F1', hcLight: Color.transparent('#0F4A85', 0.1) }, description: '列表/树处于非活动状态时选中项的背景颜色。活动的列表/树拥有键盘焦点，非活动的则没有。' },
            { id: 'list.inactiveSelectionForeground', description: '列表/树处于非活动状态时选中项的前景色。活动的列表/树拥有键盘焦点，非活动的则没有。' },
            { id: 'list.hoverBackground', defaults: { dark: '#2A2D2E', light: '#F0F0F0', hcLight: Color.transparent('#0F4A85', 0.1) }, description: '使用鼠标悬停在列表/树项上时的背景颜色。' },
            { id: 'list.hoverForeground', description: '使用鼠标悬停在列表/树项上时的前景色。' },
            { id: 'list.errorForeground', defaults: { dark: '#F88070', light: '#B01011' }, description: '包含错误的列表项的前景色。' },
            { id: 'list.warningForeground', defaults: { dark: '#CCA700', light: '#855F00' }, description: '包含警告的列表项的前景色。' },
            { id: 'list.filterMatchBackground', defaults: { dark: 'editor.findMatchHighlightBackground', light: 'editor.findMatchHighlightBackground' }, description: '过滤匹配项的背景颜色。' },
            { id: 'list.highlightForeground', defaults: { dark: '#18A3FF', light: '#0066BF', hcDark: 'focusBorder', hcLight: 'focusBorder' }, description: '在列表/树中搜索时，匹配高亮的前景色。' },
            { id: 'list.focusHighlightForeground', defaults: { dark: 'list.highlightForeground', light: 'list.activeSelectionForeground', hcDark: 'list.highlightForeground', hcLight: 'list.highlightForeground' }, description: '在列表/树中搜索时，活动焦点项上匹配高亮的前景色。' },
            { id: 'tree.inactiveIndentGuidesStroke', defaults: { dark: Color.transparent('tree.indentGuidesStroke', 0.4), light: Color.transparent('tree.indentGuidesStroke', 0.4), hcDark: Color.transparent('tree.indentGuidesStroke', 0.4) }, description: '非活动缩进参考线的树描边颜色。' },

            // Editor Group & Tabs colors should be aligned with https://code.visualstudio.com/api/references/theme-color#editor-groups-tabs
            {
                id: 'editorGroup.border',
                defaults: {
                    dark: '#444444',
                    light: '#E7E7E7',
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                },
                description: '用于分隔多个编辑器组的颜色。编辑器组是编辑器的容器。'
            },
            {
                id: 'editorGroup.dropBackground',
                defaults: {
                    dark: Color.transparent('#53595D', 0.5),
                    light: Color.transparent('#2677CB', 0.18),
                    hcLight: Color.transparent('#0F4A85', 0.50)
                },
                description: '拖动编辑器时的背景颜色。该颜色应带有透明度，以便编辑器内容仍能透出。'
            },
            {
                id: 'editorGroupHeader.tabsBackground',
                defaults: {
                    dark: '#252526',
                    light: '#F3F3F3',
                },
                description: '启用标签页时编辑器组标题栏的背景颜色。编辑器组是编辑器的容器。'
            },
            {
                id: 'editorGroupHeader.tabsBorder',
                defaults: {
                    hcDark: 'contrastBorder'
                },
                description: '启用标签页时编辑器组标题栏的边框颜色。编辑器组是编辑器的容器。'
            },
            {
                id: 'tab.activeBackground',
                defaults: {
                    dark: 'editor.background',
                    light: 'editor.background',
                    hcDark: 'editor.background',
                    hcLight: 'editor.background'
                },
                description: '活动标签页的背景颜色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedActiveBackground',
                defaults: {
                    dark: 'tab.activeBackground',
                    light: 'tab.activeBackground',
                    hcDark: 'tab.activeBackground',
                    hcLight: 'tab.activeBackground'
                },
                description: '未聚焦组中活动标签页的背景颜色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.inactiveBackground',
                defaults: {
                    dark: '#2D2D2D',
                    light: '#ECECEC'
                },
                description: '非活动标签页的背景颜色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.activeForeground',
                defaults: {
                    dark: Color.white,
                    light: '#333333',
                    hcDark: Color.white,
                    hcLight: '#292929'
                }, description: '活动组中活动标签页的前景色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.inactiveForeground', defaults: {
                    dark: Color.transparent('tab.activeForeground', 0.5),
                    light: Color.transparent('tab.activeForeground', 0.7),
                    hcDark: Color.white,
                    hcLight: '#292929'
                }, description: '活动组中非活动标签页的前景色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedActiveForeground', defaults: {
                    dark: Color.transparent('tab.activeForeground', 0.5),
                    light: Color.transparent('tab.activeForeground', 0.7),
                    hcDark: Color.white,
                    hcLight: '#292929'
                }, description: '未聚焦组中活动标签页的前景色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedInactiveForeground', defaults: {
                    dark: Color.transparent('tab.inactiveForeground', 0.5),
                    light: Color.transparent('tab.inactiveForeground', 0.5),
                    hcDark: Color.white,
                    hcLight: '#292929'
                }, description: '未聚焦组中非活动标签页的前景色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.border', defaults: {
                    dark: '#252526',
                    light: '#F3F3F3',
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                }, description: '用于分隔各标签页的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.activeBorder',
                description: '活动标签页底部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedActiveBorder',
                defaults: {
                    dark: Color.transparent('tab.activeBorder', 0.5),
                    light: Color.transparent('tab.activeBorder', 0.7)
                },
                description: '未聚焦组中活动标签页底部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.activeBorderTop',
                defaults: {
                    hcLight: '#B5200D'
                },
                description: '活动标签页顶部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedActiveBorderTop', defaults: {
                    dark: Color.transparent('tab.activeBorderTop', 0.5),
                    light: Color.transparent('tab.activeBorderTop', 0.7),
                    hcLight: '#B5200D'
                }, description: '未聚焦组中活动标签页顶部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.hoverBackground',
                description: '悬停时标签页的背景颜色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedHoverBackground', defaults: {
                    dark: Color.transparent('tab.hoverBackground', 0.5),
                    light: Color.transparent('tab.hoverBackground', 0.7)
                }, description: '未聚焦组中悬停时标签页的背景颜色。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.hoverBorder',
                description: '悬停时用于高亮标签页的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedHoverBorder', defaults: {
                    dark: Color.transparent('tab.hoverBorder', 0.5),
                    light: Color.transparent('tab.hoverBorder', 0.7),
                    hcLight: 'contrastBorder'
                }, description: '未聚焦组中悬停时用于高亮标签页的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.activeModifiedBorder', defaults: {
                    dark: '#3399CC',
                    light: '#33AAEE',
                    hcLight: 'contrastBorder'
                }, description: '活动组中已修改（脏）活动标签页顶部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.inactiveModifiedBorder', defaults: {
                    dark: Color.transparent('tab.activeModifiedBorder', 0.5),
                    light: Color.transparent('tab.activeModifiedBorder', 0.5),
                    hcDark: Color.white,
                    hcLight: 'contrastBorder'
                }, description: '活动组中已修改（脏）非活动标签页顶部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedActiveModifiedBorder', defaults: {
                    dark: Color.transparent('tab.activeModifiedBorder', 0.5),
                    light: Color.transparent('tab.activeModifiedBorder', 0.7),
                    hcDark: Color.white,
                    hcLight: 'contrastBorder'
                }, description: '未聚焦组中已修改（脏）活动标签页顶部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },
            {
                id: 'tab.unfocusedInactiveModifiedBorder', defaults: {
                    dark: Color.transparent('tab.inactiveModifiedBorder', 0.5),
                    light: Color.transparent('tab.inactiveModifiedBorder', 0.5),
                    hcDark: Color.white,
                    hcLight: 'contrastBorder'
                }, description: '未聚焦组中已修改（脏）非活动标签页顶部的边框。标签页是编辑器区域中编辑器的容器。一个编辑器组中可以打开多个标签页，也可以有多个编辑器组。'
            },

            // Status bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#status-bar-colors
            {
                id: 'statusBar.foreground', defaults: {
                    dark: '#FFFFFF',
                    light: '#FFFFFF',
                    hcDark: '#FFFFFF',
                    hcLight: 'editor.foreground'
                }, description: '打开工作区时状态栏的前景色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBar.background', defaults: {
                    dark: '#007ACC',
                    light: '#007ACC'
                }, description: '打开工作区时状态栏的背景颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBar.noFolderForeground', defaults: {
                    dark: 'statusBar.foreground',
                    light: 'statusBar.foreground',
                    hcDark: 'statusBar.foreground',
                    hcLight: 'statusBar.foreground'
                }, description: '未打开文件夹时状态栏的前景色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBar.noFolderBackground', defaults: {
                    dark: '#68217A',
                    light: '#68217A'
                }, description: '未打开文件夹时状态栏的背景颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBar.border', defaults: {
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                }, description: '状态栏与侧边栏和编辑器分隔的边框颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBar.noFolderBorder', defaults: {
                    dark: 'statusBar.border',
                    light: 'statusBar.border',
                    hcDark: 'statusBar.border',
                    hcLight: 'statusBar.border'
                }, description: '未打开文件夹时状态栏与侧边栏和编辑器分隔的边框颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.activeBackground', defaults: {
                    dark: Color.rgba(255, 255, 255, 0.18),
                    light: Color.rgba(255, 255, 255, 0.18),
                    hcDark: Color.rgba(255, 255, 255, 0.18),
                    hcLight: Color.rgba(0, 0, 0, 0.18)
                }, description: '点击时状态栏项的背景颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.hoverBackground', defaults: {
                    dark: Color.rgba(255, 255, 255, 0.12),
                    light: Color.rgba(255, 255, 255, 0.12),
                    hcDark: Color.rgba(255, 255, 255, 0.12),
                    hcLight: Color.rgba(0, 0, 0, 0.12)
                }, description: '悬停时状态栏项的背景颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.hoverForeground', defaults: {
                    dark: 'statusBar.foreground',
                    light: 'statusBar.foreground',
                    hcDark: 'statusBar.foreground',
                    hcLight: 'statusBar.foreground'
                }, description: '悬停时状态栏项的前景色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.compactHoverBackground', defaults: {
                    dark: Color.rgba(255, 255, 255, 0.20),
                    light: Color.rgba(255, 255, 255, 0.20),
                    hcDark: Color.rgba(255, 255, 255, 0.20),
                    hcLight: Color.rgba(0, 0, 0, 0.20)
                }, description: '悬停包含两个悬停提示的状态栏项时的背景颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.focusBorder', defaults: {
                    dark: 'statusBar.foreground',
                    light: 'statusBar.foreground',
                    hcDark: 'statusBar.foreground',
                    hcLight: 'statusBar.foreground'
                }, description: '键盘导航聚焦时状态栏项的边框颜色。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.errorBackground', defaults: {
                    dark: Color.darken('errorBackground', 0.4),
                    light: Color.darken('errorBackground', 0.4),
                    hcDark: undefined,
                    hcLight: '#B5200D'
                }, description: '状态栏错误项的背景颜色。错误项在其他状态栏条目中突出显示，以指示错误状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.errorForeground', defaults: {
                    dark: Color.white,
                    light: Color.white,
                    hcDark: Color.white,
                    hcLight: Color.white
                }, description: '状态栏错误项的前景色。错误项在其他状态栏条目中突出显示，以指示错误状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.errorHoverBackground', defaults: {
                    dark: Color.lighten('statusBarItem.errorBackground', 0.2),
                    light: Color.lighten('statusBarItem.errorBackground', 0.2),
                    hcDark: undefined,
                    hcLight: undefined
                }, description: '悬停时状态栏错误项的背景颜色。错误项在其他状态栏条目中突出显示，以指示错误状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.errorHoverForeground', defaults: {
                    dark: 'statusBarItem.errorForeground',
                    light: 'statusBarItem.errorForeground',
                    hcDark: 'statusBarItem.errorForeground',
                    hcLight: 'statusBarItem.errorForeground'
                }, description: '悬停时状态栏错误项的前景色。错误项在其他状态栏条目中突出显示，以指示错误状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.warningBackground', defaults: {
                    dark: Color.darken('warningBackground', 0.4),
                    light: Color.darken('warningBackground', 0.4),
                    hcDark: undefined,
                    hcLight: '#895503'
                }, description: '状态栏警告项的背景颜色。警告项在其他状态栏条目中突出显示，以指示警告状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.warningForeground', defaults: {
                    dark: Color.white,
                    light: Color.white,
                    hcDark: Color.white,
                    hcLight: Color.white
                }, description: '状态栏警告项的前景色。警告项在其他状态栏条目中突出显示，以指示警告状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.warningHoverBackground', defaults: {
                    dark: Color.lighten('statusBarItem.warningBackground', 0.2),
                    light: Color.lighten('statusBarItem.warningBackground', 0.2),
                    hcDark: undefined,
                    hcLight: undefined
                }, description: '悬停时状态栏警告项的背景颜色。警告项在其他状态栏条目中突出显示，以指示警告状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.warningHoverForeground', defaults: {
                    dark: 'statusBarItem.warningForeground',
                    light: 'statusBarItem.warningForeground',
                    hcDark: 'statusBarItem.warningForeground',
                    hcLight: 'statusBarItem.warningForeground'
                }, description: '悬停时状态栏警告项的前景色。警告项在其他状态栏条目中突出显示，以指示警告状态。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.prominentForeground', defaults: {
                    dark: 'statusBar.foreground',
                    light: 'statusBar.foreground',
                    hcDark: 'statusBar.foreground',
                    hcLight: 'statusBar.foreground'
                }, description: '状态栏重要项的前景色。重要项在其他状态栏条目中突出显示，以指示重要性。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.prominentBackground', defaults: {
                    dark: Color.rgba(0, 0, 0, .5),
                    light: Color.rgba(0, 0, 0, .5),
                    hcDark: Color.rgba(0, 0, 0, .5),
                    hcLight: Color.rgba(0, 0, 0, .5),
                }, description: '状态栏重要项的背景颜色。重要项在其他状态栏条目中突出显示，以指示重要性。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.prominentHoverForeground', defaults: {
                    dark: 'statusBarItem.hoverForeground',
                    light: 'statusBarItem.hoverForeground',
                    hcDark: 'statusBarItem.hoverForeground',
                    hcLight: 'statusBarItem.hoverForeground'
                }, description: '悬停时状态栏重要项的前景色。重要项在其他状态栏条目中突出显示，以指示重要性。状态栏显示在窗口底部。'
            },
            {
                id: 'statusBarItem.prominentHoverBackground', defaults: {
                    dark: 'statusBarItem.hoverBackground',
                    light: 'statusBarItem.hoverBackground',
                    hcDark: 'statusBarItem.hoverBackground',
                    hcLight: 'statusBarItem.hoverBackground'
                }, description: '悬停时状态栏重要项的背景颜色。重要项在其他状态栏条目中突出显示，以指示重要性。状态栏显示在窗口底部。'
            },

            // editor find

            {
                id: 'editor.findMatchBackground',
                defaults: {
                    light: '#A8AC94',
                    dark: '#515C6A',
                    hcDark: undefined,
                    hcLight: undefined
                },
                description: '当前搜索匹配项的颜色。'
            },

            {
                id: 'editor.findMatchForeground',
                defaults: {
                    light: undefined,
                    dark: undefined,
                    hcDark: undefined,
                    hcLight: undefined
                },
                description: '当前搜索匹配项的文本颜色。'
            },
            {
                id: 'editor.findMatchHighlightBackground',
                defaults: {
                    light: '#EA5C0055',
                    dark: '#EA5C0055',
                    hcDark: undefined,
                    hcLight: undefined
                },
                description: '其他搜索匹配项的颜色。该颜色不能为不透明，以免遮挡底层的装饰。'
            },

            {
                id: 'editor.findMatchHighlightForeground',
                defaults: {
                    light: undefined,
                    dark: undefined,
                    hcDark: undefined,
                    hcLight: undefined
                },
                description: '其他搜索匹配项的前景色。'
            },

            {
                id: 'editor.findRangeHighlightBackground',
                defaults: {
                    dark: '#3a3d4166',
                    light: '#b4b4b44d',
                    hcDark: undefined,
                    hcLight: undefined
                },
                description: '限制搜索范围区域的颜色。该颜色不能为不透明，以免遮挡底层的装饰。'
            },

            {
                id: 'editor.findMatchBorder',
                defaults: {
                    light: undefined,
                    dark: undefined,
                    hcDark: 'activeContrastBorder',
                    hcLight: 'activeContrastBorder'
                },
                description: '当前搜索匹配项的边框颜色。'
            },
            {
                id: 'editor.findMatchHighlightBorder',
                defaults: {
                    light: undefined,
                    dark: undefined,
                    hcDark: 'activeContrastBorder',
                    hcLight: 'activeContrastBorder'
                },
                description: '其他搜索匹配项的边框颜色。'
            },

            {
                id: 'editor.findRangeHighlightBorder',
                defaults: {
                    dark: undefined,
                    light: undefined,
                    hcDark: Color.transparent('activeContrastBorder', 0.4),
                    hcLight: Color.transparent('activeContrastBorder', 0.4)
                },
                description: '限制搜索范围区域的边框颜色。该颜色不能为不透明，以免遮挡底层的装饰。'
            },

            // Quickinput colors should be aligned with https://code.visualstudio.com/api/references/theme-color#quick-picker
            // if not yet contributed by Monaco, check runtime css variables to learn.
            {
                id: 'quickInput.background', defaults: {
                    dark: 'editorWidget.background',
                    light: 'editorWidget.background',
                    hcDark: 'editorWidget.background',
                    hcLight: 'editorWidget.background'
                }, description: '快速输入的背景颜色。快速输入小部件是颜色主题选择器等视图的容器。'
            },
            {
                id: 'quickInput.foreground', defaults: {
                    dark: 'editorWidget.foreground',
                    light: 'editorWidget.foreground',
                    hcDark: 'editorWidget.foreground',
                    hcLight: 'editorWidget.foreground'
                }, description: '快速输入的前景色。快速输入小部件是颜色主题选择器等视图的容器。'
            },
            {
                id: 'quickInput.list.focusBackground', defaults: {
                    dark: undefined,
                    light: undefined,
                    hcDark: undefined,
                    hcLight: undefined
                }, description: '已弃用 quickInput.list.focusBackground，请改用 quickInputList.focusBackground'
            },
            {
                id: 'quickInputList.focusForeground', defaults: {
                    dark: 'list.activeSelectionForeground',
                    light: 'list.activeSelectionForeground',
                    hcDark: 'list.activeSelectionForeground',
                    hcLight: 'list.activeSelectionForeground'
                }, description: '快速选择器中聚焦项的前景色'
            },
            {
                id: 'quickInputList.focusBackground', defaults: {
                    dark: 'list.activeSelectionBackground',
                    light: 'list.activeSelectionBackground',
                    hcDark: undefined
                }, description: '快速选择器中聚焦项的背景颜色。'
            },

            // Panel colors should be aligned with https://code.visualstudio.com/api/references/theme-color#panel-colors
            {
                id: 'panel.background', defaults: {
                    dark: 'editor.background', light: 'editor.background', hcDark: 'editor.background', hcLight: 'editor.background'
                }, description: '面板的背景颜色。面板显示在编辑器区域下方，包含输出和集成终端等视图。'
            },
            {
                id: 'panel.border', defaults: {
                    dark: Color.transparent('#808080', 0.35), light: Color.transparent('#808080', 0.35), hcDark: 'contrastBorder', hcLight: 'contrastBorder'
                }, description: '用于将面板与编辑器分隔的边框颜色。面板显示在编辑器区域下方，包含输出和集成终端等视图。'
            },
            {
                id: 'panel.dropBackground', defaults: {
                    dark: Color.rgba(255, 255, 255, 0.12), light: Color.transparent('#2677CB', 0.18), hcDark: Color.rgba(255, 255, 255, 0.12)
                }, description: '面板标题项的拖放反馈颜色。该颜色应带有透明度，以便面板条目仍能透出。面板显示在编辑器区域下方，包含输出和集成终端等视图。'
            },
            {
                id: 'panelTitle.activeForeground', defaults: {
                    dark: '#E7E7E7', light: '#424242', hcDark: Color.white, hcLight: 'editor.foreground'
                }, description: '活动面板的标题颜色。面板显示在编辑器区域下方，包含输出和集成终端等视图。'
            },
            {
                id: 'panelTitle.inactiveForeground', defaults: {
                    dark: Color.transparent('panelTitle.activeForeground', 0.6), light: Color.transparent('panelTitle.activeForeground', 0.75), hcDark: Color.white, hcLight: 'editor.foreground'
                }, description: '非活动面板的标题颜色。面板显示在编辑器区域下方，包含输出和集成终端等视图。'
            },
            {
                id: 'panelTitle.activeBorder', defaults: {
                    dark: 'panelTitle.activeForeground', light: 'panelTitle.activeForeground', hcDark: 'contrastBorder', hcLight: '#B5200D'
                }, description: '活动面板标题的边框颜色。面板显示在编辑器区域下方，包含输出和集成终端等视图。'
            },
            {
                id: 'panelInput.border', defaults: { light: '#ddd' },
                description: '面板中输入框的边框。'
            },
            {
                id: 'imagePreview.border', defaults: {
                    dark: Color.transparent('#808080', 0.35), light: Color.transparent('#808080', 0.35), hcDark: 'contrastBorder', hcLight: 'contrastBorder'
                }, description: '图片预览中图片的边框颜色。'
            },

            // Title Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#title-bar-colors
            {
                id: 'titleBar.activeForeground', defaults: {
                    dark: '#CCCCCC',
                    light: '#333333',
                    hcDark: '#FFFFFF',
                    hcLight: '#292929'
                }, description: '窗口处于活动状态时标题栏的前景色。注意，此颜色目前仅在 macOS 上受支持。'
            },
            {
                id: 'titleBar.inactiveForeground', defaults: {
                    dark: Color.transparent('titleBar.activeForeground', 0.6),
                    light: Color.transparent('titleBar.activeForeground', 0.6),
                    hcLight: '#292929'
                }, description: '窗口处于非活动状态时标题栏的前景色。注意，此颜色目前仅在 macOS 上受支持。'
            },
            {
                id: 'titleBar.activeBackground', defaults: {
                    dark: '#3C3C3C',
                    light: '#DDDDDD',
                    hcDark: '#000000',
                    hcLight: '#FFFFFF'
                }, description: '窗口处于活动状态时标题栏的背景颜色。注意，此颜色目前仅在 macOS 上受支持。'
            },
            {
                id: 'titleBar.inactiveBackground', defaults: {
                    dark: Color.transparent('titleBar.activeBackground', 0.6),
                    light: Color.transparent('titleBar.activeBackground', 0.6)
                }, description: '窗口处于非活动状态时标题栏的背景颜色。注意，此颜色目前仅在 macOS 上受支持。'
            },
            {
                id: 'titleBar.border', defaults: {
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                }, description: '标题栏的边框颜色。注意，此颜色目前仅在 macOS 上受支持。'
            },

            // Menu Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#menu-bar-colors
            {
                id: 'menubar.selectionForeground', defaults: {
                    dark: 'titleBar.activeForeground',
                    light: 'titleBar.activeForeground',
                    hcDark: 'titleBar.activeForeground',
                    hcLight: 'titleBar.activeForeground'
                }, description: '菜单栏中所选菜单项的前景色。'
            },
            {
                id: 'menubar.selectionBackground', defaults: {
                    dark: 'toolbar.hoverBackground',
                    light: 'toolbar.hoverBackground'
                }, description: '菜单栏中所选菜单项的背景颜色。'
            },
            {
                id: 'menubar.selectionBorder', defaults: {
                    hcDark: 'activeContrastBorder', hcLight: 'activeContrastBorder'
                }, description: '菜单栏中所选菜单项的边框颜色。'
            },
            {
                id: 'menu.border', defaults: {
                    hcDark: 'contrastBorder', hcLight: 'contrastBorder'
                }, description: '菜单的边框颜色。'
            },
            {
                id: 'menu.foreground', defaults: {
                    dark: 'dropdown.foreground', light: 'foreground', hcDark: 'dropdown.foreground', hcLight: 'dropdown.foreground'
                },
                description: '菜单项的前景色。'
            },
            {
                id: 'menu.background', defaults: {
                    dark: 'dropdown.background', light: 'dropdown.background', hcDark: 'dropdown.background', hcLight: 'dropdown.background'
                }, description: '菜单项的背景颜色。'
            },
            {
                id: 'menu.selectionForeground', defaults: {
                    dark: 'list.activeSelectionForeground', light: 'list.activeSelectionForeground', hcDark: 'list.activeSelectionForeground', hcLight: 'list.activeSelectionForeground'
                }, description: '菜单中所选菜单项的前景色。'
            },
            {
                id: 'menu.selectionBackground', defaults: {
                    dark: 'list.activeSelectionBackground', light: 'list.activeSelectionBackground', hcDark: 'list.activeSelectionBackground', hcLight: 'list.activeSelectionBackground'
                },
                description: '菜单中所选菜单项的背景颜色。'
            },
            {
                id: 'menu.selectionBorder', defaults: {
                    hcDark: 'activeContrastBorder', hcLight: 'activeContrastBorder'
                }, description: '菜单中所选菜单项的边框颜色。'
            },
            {
                id: 'menu.separatorBackground', defaults: {
                    dark: '#BBBBBB', light: '#888888', hcDark: 'contrastBorder', hcLight: 'contrastBorder'
                },
                description: '菜单中分隔符菜单项的颜色。'
            },

            // Welcome Page colors should be aligned with https://code.visualstudio.com/api/references/theme-color#welcome-page
            { id: 'welcomePage.background', description: '欢迎页的背景颜色。' },
            { id: 'welcomePage.buttonBackground', defaults: { dark: Color.rgba(0, 0, 0, .2), light: Color.rgba(0, 0, 0, .04), hcDark: Color.black, hcLight: Color.white }, description: '欢迎页上按钮的背景颜色。' },
            { id: 'welcomePage.buttonHoverBackground', defaults: { dark: Color.rgba(200, 235, 255, .072), light: Color.rgba(0, 0, 0, .10) }, description: '欢迎页上按钮的悬停背景颜色。' },
            { id: 'walkThrough.embeddedEditorBackground', defaults: { dark: Color.rgba(0, 0, 0, .4), light: '#f4f4f4' }, description: '交互式演练场中嵌入式编辑器的背景颜色。' },

            // Dropdown colors should be aligned with https://code.visualstudio.com/api/references/theme-color#dropdown-control

            {
                id: 'dropdown.background', defaults: {
                    light: Color.white,
                    dark: '#3C3C3C',
                    hcDark: Color.black,
                    hcLight: Color.white
                }, description: '下拉框的背景颜色。'
            },
            {
                id: 'dropdown.listBackground', defaults: {
                    hcDark: Color.black,
                    hcLight: Color.white
                }, description: '下拉框列表的背景颜色。'
            },
            {
                id: 'dropdown.foreground', defaults: {
                    dark: '#F0F0F0',
                    hcDark: Color.white,
                    hcLight: 'foreground'
                }, description: '下拉框的前景色。'
            },
            {
                id: 'dropdown.border', defaults: {
                    light: '#CECECE',
                    dark: 'dropdown.background',
                    hcDark: 'contrastBorder',
                    hcLight: 'contrastBorder'
                }, description: '下拉框的边框。'
            },

            // Settings Editor colors should be aligned with https://code.visualstudio.com/api/references/theme-color#settings-editor-colors
            {
                id: 'settings.headerForeground', defaults: {
                    light: '#444444', dark: '#e7e7e7', hcDark: '#ffffff', hcLight: '#292929'
                }, description: '分区标题或活动标题的前景色。'
            },
            {
                id: 'settings.modifiedItemIndicator', defaults: {
                    light: Color.rgba(102, 175, 224),
                    dark: Color.rgba(12, 125, 157),
                    hcDark: Color.rgba(0, 73, 122),
                    hcLight: Color.rgba(102, 175, 224)
                }, description: '已修改设置指示器的颜色。'
            },
            {
                id: 'settings.dropdownBackground', defaults: {
                    dark: 'dropdown.background', light: 'dropdown.background', hcDark: 'dropdown.background', hcLight: 'dropdown.background'
                },
                description: '设置编辑器下拉框的背景颜色。'
            },
            {
                id: 'settings.dropdownForeground', defaults: {
                    dark: 'dropdown.foreground', light: 'dropdown.foreground', hcDark: 'dropdown.foreground', hcLight: 'dropdown.foreground'
                }, description: '设置编辑器下拉框的前景色。'
            },
            {
                id: 'settings.dropdownBorder', defaults: {
                    dark: 'dropdown.border', light: 'dropdown.border', hcDark: 'dropdown.border', hcLight: 'dropdown.border'
                }, description: '设置编辑器下拉框的边框。'
            },
            {
                id: 'settings.dropdownListBorder', defaults: {
                    dark: 'editorWidget.border', light: 'editorWidget.border', hcDark: 'editorWidget.border', hcLight: 'editorWidget.border'
                }, description: '设置编辑器下拉列表的边框。它环绕各选项，并将选项与描述分隔开。'
            },
            {
                id: 'settings.checkboxBackground', defaults: {
                    dark: 'checkbox.background', light: 'checkbox.background', hcDark: 'checkbox.background', hcLight: 'checkbox.background'
                }, description: '设置编辑器复选框的背景颜色。'
            },
            {
                id: 'settings.checkboxForeground', defaults: {
                    dark: 'checkbox.foreground', light: 'checkbox.foreground', hcDark: 'checkbox.foreground', hcLight: 'checkbox.foreground'
                }, description: '设置编辑器复选框的前景色。'
            },
            {
                id: 'settings.checkboxBorder', defaults: {
                    dark: 'checkbox.border', light: 'checkbox.border', hcDark: 'checkbox.border', hcLight: 'checkbox.border'
                }, description: '设置编辑器复选框的边框。'
            },
            {
                id: 'settings.textInputBackground', defaults: {
                    dark: 'input.background', light: 'input.background', hcDark: 'input.background', hcLight: 'input.background'
                }, description: '设置编辑器文本输入框的背景颜色。'
            },
            {
                id: 'settings.textInputForeground', defaults: {
                    dark: 'input.foreground', light: 'input.foreground', hcDark: 'input.foreground', hcLight: 'input.foreground'
                }, description: '设置编辑器文本输入框的前景色。'
            },
            {
                id: 'settings.textInputBorder', defaults: {
                    dark: 'input.border', light: 'input.border', hcDark: 'input.border', hcLight: 'input.background'
                }, description: '设置编辑器文本输入框的边框。'
            },
            {
                id: 'settings.numberInputBackground', defaults: {
                    dark: 'input.background', light: 'input.background', hcDark: 'input.background', hcLight: 'input.background'
                }, description: '设置编辑器数字输入框的背景颜色。'
            },
            {
                id: 'settings.numberInputForeground', defaults: {
                    dark: 'input.foreground', light: 'input.foreground', hcDark: 'input.foreground', hcLight: 'input.foreground'
                }, description: '设置编辑器数字输入框的前景色。'
            },
            {
                id: 'settings.numberInputBorder', defaults: {
                    dark: 'input.border', light: 'input.border', hcDark: 'input.border', hcLight: 'input.border'
                }, description: '设置编辑器数字输入框的边框。'
            },
            {
                id: 'settings.focusedRowBackground', defaults: {
                    dark: Color.transparent('#808080', 0.14),
                    light: Color.transparent('#808080', 0.03),
                    hcDark: undefined,
                    hcLight: undefined
                }, description: '设置行聚焦时的背景颜色。'
            },
            {
                id: 'settings.rowHoverBackground', defaults: {
                    dark: Color.transparent('#808080', 0.07),
                    light: Color.transparent('#808080', 0.05),
                    hcDark: undefined,
                    hcLight: undefined
                }, description: '设置行悬停时的背景颜色。'
            },
            {
                id: 'settings.focusedRowBorder', defaults: {
                    dark: Color.rgba(255, 255, 255, 0.12),
                    light: Color.rgba(0, 0, 0, 0.12),
                    hcDark: 'focusBorder',
                    hcLight: 'focusBorder'
                }, description: "设置行聚焦时该行顶部和底部边框的颜色。"
            },
            // Toolbar Action colors should be aligned with https://code.visualstudio.com/api/references/theme-color#action-colors
            {
                id: 'toolbar.hoverBackground', defaults: {
                    dark: '#5a5d5e50', light: '#b8b8b850', hcDark: undefined, hcLight: undefined
                }, description: '使用鼠标悬停在工具栏操作上时的背景颜色。'
            },

            // Theia Variable colors
            {
                id: 'variable.name.color', defaults: {
                    dark: '#C586C0',
                    light: '#9B46B0',
                    hcDark: '#C586C0'
                },
                description: '变量名的颜色。'
            },
            {
                id: 'variable.value.color', defaults: {
                    dark: Color.rgba(204, 204, 204, 0.6),
                    light: Color.rgba(108, 108, 108, 0.8),
                    hcDark: Color.rgba(204, 204, 204, 0.6)
                },
                description: '变量值的颜色。'
            },
            {
                id: 'variable.number.variable.color', defaults: {
                    dark: '#B5CEA8',
                    light: '#09885A',
                    hcDark: '#B5CEA8'
                },
                description: '数字变量值的颜色'
            },
            {
                id: 'variable.boolean.variable.color', defaults: {
                    dark: '#4E94CE',
                    light: '#0000FF',
                    hcDark: '#4E94CE'
                },
                description: '布尔变量值的颜色'
            },
            {
                id: 'variable.string.variable.color', defaults: {
                    dark: '#CE9178',
                    light: '#A31515',
                    hcDark: '#CE9178'
                },
                description: '字符串变量值的颜色'
            },

            // Theia ANSI colors
            {
                id: 'ansi.black.color', defaults: {
                    dark: '#A0A0A0',
                    light: Color.rgba(128, 128, 128),
                    hcDark: '#A0A0A0'
                },
                description: '黑色（ANSI）'
            },
            {
                id: 'ansi.red.color', defaults: {
                    dark: '#A74747',
                    light: '#BE1717',
                    hcDark: '#A74747'
                },
                description: '红色（ANSI）'
            },
            {
                id: 'ansi.green.color', defaults: {
                    dark: '#348F34',
                    light: '#338A2F',
                    hcDark: '#348F34'
                },
                description: '绿色（ANSI）'
            },
            {
                id: 'ansi.yellow.color', defaults: {
                    dark: '#5F4C29',
                    light: '#BEB817',
                    hcDark: '#5F4C29'
                },
                description: '黄色（ANSI）'
            },
            {
                id: 'ansi.blue.color', defaults: {
                    dark: '#6286BB',
                    light: Color.rgba(0, 0, 139),
                    hcDark: '#6286BB'
                },
                description: '蓝色（ANSI）'
            },
            {
                id: 'ansi.magenta.color', defaults: {
                    dark: '#914191',
                    light: Color.rgba(139, 0, 139),
                    hcDark: '#914191'
                },
                description: '品红色（ANSI）'
            },
            {
                id: 'ansi.cyan.color', defaults: {
                    dark: '#218D8D',
                    light: Color.rgba(0, 139, 139),
                    hcDark: '#218D8D'
                },
                description: '青色（ANSI）'
            },
            {
                id: 'ansi.white.color', defaults: {
                    dark: '#707070',
                    light: '#BDBDBD',
                    hcDark: '#707070'
                },
                description: '白色（ANSI）'
            },

            // Theia defaults
            // Base
            {
                id: 'errorBackground',
                defaults: {
                    dark: 'inputValidation.errorBackground',
                    light: 'inputValidation.errorBackground',
                    hcDark: 'inputValidation.errorBackground'
                }, description: '错误小部件（如提醒或通知）的背景颜色。'
            },
            {
                id: 'successBackground',
                defaults: {
                    dark: 'editorGutter.addedBackground',
                    light: 'editorGutter.addedBackground',
                    hcDark: 'editorGutter.addedBackground'
                }, description: '成功小部件（如提醒或通知）的背景颜色。'
            },
            {
                id: 'warningBackground',
                defaults: {
                    dark: 'editorWarning.foreground',
                    light: 'editorWarning.foreground',
                    hcDark: 'editorWarning.border'
                }, description: '警告小部件（如提醒或通知）的背景颜色。'
            },
            {
                id: 'warningForeground',
                defaults: {
                    dark: 'inputValidation.warningBackground',
                    light: 'inputValidation.warningBackground',
                    hcDark: 'inputValidation.warningBackground'
                }, description: '警告小部件（如提醒或通知）的前景色。'
            },
            // Statusbar
            {
                id: 'statusBar.offlineBackground',
                defaults: {
                    dark: 'editorWarning.foreground',
                    light: 'editorWarning.foreground',
                    hcDark: 'editorWarning.foreground',
                    hcLight: 'editorWarning.foreground'
                }, description: '当 Theia 服务器离线时，悬停状态栏项的背景颜色。'
            },
            {
                id: 'statusBar.offlineForeground',
                defaults: {
                    dark: 'editor.background',
                    light: 'editor.background',
                    hcDark: 'editor.background',
                    hcLight: 'editor.background'
                }, description: '当 Theia 服务器离线时，悬停状态栏项的背景颜色。'
            },
            {
                id: 'statusBarItem.offlineHoverBackground',
                defaults: {
                    dark: Color.lighten('statusBar.offlineBackground', 0.4),
                    light: Color.lighten('statusBar.offlineBackground', 0.4),
                    hcDark: Color.lighten('statusBar.offlineBackground', 0.4),
                    hcLight: Color.lighten('statusBar.offlineBackground', 0.4)
                }, description: '当 Theia 服务器离线时，悬停状态栏项的背景颜色。'
            },
            {
                id: 'statusBarItem.offlineActiveBackground',
                defaults: {
                    dark: Color.lighten('statusBar.offlineBackground', 0.6),
                    light: Color.lighten('statusBar.offlineBackground', 0.6),
                    hcDark: Color.lighten('statusBar.offlineBackground', 0.6),
                    hcLight: Color.lighten('statusBar.offlineBackground', 0.6)
                }, description: '当 Theia 服务器离线时，活动状态栏项的背景颜色。'
            },
            {
                id: 'statusBarItem.remoteBackground',
                defaults: {
                    dark: 'activityBarBadge.background',
                    light: 'activityBarBadge.background',
                    hcDark: 'activityBarBadge.background',
                    hcLight: 'activityBarBadge.background'
                }, description: '状态栏上远程指示器的背景颜色。'
            },
            {
                id: 'statusBarItem.remoteForeground',
                defaults: {
                    dark: 'activityBarBadge.foreground',
                    light: 'activityBarBadge.foreground',
                    hcDark: 'activityBarBadge.foreground',
                    hcLight: 'activityBarBadge.foreground'
                }, description: '状态栏上远程指示器的前景色。'
            },
            {
                id: 'statusBarItem.remoteHoverBackground',
                defaults: {
                    dark: Color.lighten('statusBarItem.remoteBackground', 0.2),
                    light: Color.lighten('statusBarItem.remoteBackground', 0.2),
                    hcDark: Color.lighten('statusBarItem.remoteBackground', 0.2),
                    hcLight: Color.lighten('statusBarItem.remoteBackground', 0.2)
                }, description: '悬停时状态栏上远程指示器的背景颜色。'
            },
            {
                id: 'statusBarItem.remoteHoverForeground',
                defaults: {
                    dark: 'statusBarItem.remoteForeground',
                    light: 'statusBarItem.remoteForeground',
                    hcDark: 'statusBarItem.remoteForeground',
                    hcLight: 'statusBarItem.remoteForeground'
                }, description: '悬停时状态栏上远程指示器的前景色。'
            },
            // Buttons
            // https://github.com/microsoft/vscode/blob/release/1.108/src/vs/platform/theme/common/colors/inputColors.ts#L112
            {
                id: 'button.foreground',
                defaults: Color.white,
                description: '按钮的前景色。'
            },
            {
                id: 'button.disabledForeground',
                defaults: {
                    dark: Color.transparent('button.foreground', 0.5),
                    light: Color.transparent('button.foreground', 0.5),
                    hcDark: Color.transparent('button.foreground', 0.5)
                }, description: '已禁用按钮的前景色。'
            },
            {
                id: 'button.separator',
                defaults: Color.transparent('button.foreground', .4),
                description: '按钮分隔符的颜色。'
            },
            {
                id: 'button.background',
                defaults: {
                    dark: '#0E639C',
                    light: '#007ACC',
                    hcDark: Color.black,
                    hcLight: '#0F4A85'
                },
                description: '按钮的背景颜色。'
            },
            {
                id: 'button.disabledBackground',
                defaults: {
                    dark: Color.transparent('button.background', 0.5),
                    light: Color.transparent('button.background', 0.5)
                }, description: '已禁用按钮的背景颜色。'
            },
            {
                id: 'button.hoverBackground',
                defaults: {
                    dark: Color.lighten('button.background', 0.2),
                    light: Color.darken('button.background', 0.2),
                    hcDark: 'button.background',
                    hcLight: 'button.background'
                },
                description: '悬停时按钮的背景颜色。'
            },
            {
                id: 'button.border',
                defaults: 'contrastBorder',
                description: '按钮的边框颜色。'
            },
            {
                id: 'secondaryButton.foreground',
                defaults: {
                    dark: Color.white,
                    light: Color.white,
                    hcDark: Color.white,
                    hcLight: 'foreground'
                }, description: '次要按钮的前景色。'
            },
            {
                id: 'secondaryButton.disabledForeground',
                defaults: {
                    dark: Color.transparent('secondaryButton.foreground', 0.5),
                    light: Color.transparent('secondaryButton.foreground', 0.5),
                    hcDark: Color.transparent('secondaryButton.foreground', 0.5),
                    hcLight: Color.transparent('secondaryButton.foreground', 0.5),
                }, description: '已禁用次要按钮的前景色。'
            },
            {
                id: 'secondaryButton.background',
                defaults: {
                    dark: '#3A3D41',
                    light: '#5F6A79',
                    hcDark: undefined,
                    hcLight: Color.white
                }, description: '次要按钮的背景颜色。'
            },
            {
                id: 'secondaryButton.hoverBackground',
                defaults: {
                    dark: Color.lighten('secondaryButton.background', 0.2),
                    light: Color.lighten('secondaryButton.background', 0.2),
                    hcDark: undefined,
                    hcLight: undefined
                }, description: '悬停次要按钮时的背景颜色。'
            },
            {
                id: 'secondaryButton.disabledBackground',
                defaults: {
                    dark: Color.transparent('secondaryButton.background', 0.6),
                    light: Color.transparent('secondaryButton.background', 0.6)
                }, description: '已禁用次要按钮的背景颜色。'
            },
            {
                id: 'editorGutter.commentRangeForeground',
                defaults: {
                    dark: '#37373d',
                    light: '#d5d8e9',
                    hcDark: Color.white,
                    hcLight: Color.black
                }, description: '编辑器行号栏中注释范围的装饰颜色。'
            },
            {
                id: 'editorGutter.itemGlyphForeground',
                defaults: {
                    dark: 'editor.foreground',
                    light: 'editor.foreground',
                    hcDark: Color.black,
                    hcLight: Color.white,
                },
                description: '编辑器行号栏中项目字形的装饰颜色。'
            },
            {
                id: 'breadcrumb.foreground',
                defaults: {
                    dark: Color.transparent('foreground', 0.8),
                    light: Color.transparent('foreground', 0.8),
                    hcDark: Color.transparent('foreground', 0.8),
                    hcLight: Color.transparent('foreground', 0.8)
                },
                description: '面包屑项文本的颜色'
            },
            {
                id: 'breadcrumb.background',
                defaults: {
                    dark: 'editor.background',
                    light: 'editor.background',
                    hcDark: 'editor.background',
                    hcLight: 'editor.background'
                },
                description: '面包屑项背景的颜色'
            },
            {
                id: 'breadcrumb.focusForeground',
                defaults: {
                    dark: Color.lighten('foreground', 0.1),
                    light: Color.darken('foreground', 0.2),
                    hcDark: Color.lighten('foreground', 0.1),
                    hcLight: Color.lighten('foreground', 0.1)
                },
                description: '面包屑项文本聚焦时的颜色'
            },
            {
                id: 'breadcrumb.activeSelectionForeground',
                defaults: {
                    dark: Color.lighten('foreground', 0.1),
                    light: Color.darken('foreground', 0.2),
                    hcDark: Color.lighten('foreground', 0.1),
                    hcLight: Color.lighten('foreground', 0.1)
                },
                description: '所选面包屑项的颜色'
            },
            {
                id: 'breadcrumbPicker.background',
                defaults: {
                    dark: 'editorWidget.background',
                    light: 'editorWidget.background',
                    hcDark: 'editorWidget.background',
                    hcLight: 'editorWidget.background'
                },
                description: '面包屑项选择器的背景颜色'
            },
            {
                id: 'mainToolbar.background',
                defaults: {
                    dark: Color.lighten('activityBar.background', 0.1),
                    light: Color.darken('activityBar.background', 0.1),
                    hcDark: Color.lighten('activityBar.background', 0.1),
                    hcLight: Color.lighten('activityBar.background', 0.1)
                },
                description: '外壳全局工具栏的背景颜色'
            },
            {
                id: 'mainToolbar.foreground', defaults: {
                    dark: Color.darken('activityBar.foreground', 0.1),
                    light: Color.lighten('activityBar.foreground', 0.1),
                    hcDark: Color.lighten('activityBar.foreground', 0.1),
                    hcLight: Color.lighten('activityBar.foreground', 0.1),
                }, description: '活动工具栏项的前景色',
            },
            {
                id: 'editorHoverWidgetInternalBorder',
                defaults: {
                    dark: Color.transparent('editorHoverWidget.border', 0.5),
                    light: Color.transparent('editorHoverWidget.border', 0.5),
                    hcDark: Color.transparent('editorHoverWidget.border', 0.5),
                    hcLight: Color.transparent('editorHoverWidget.border', 0.5)
                },
                description: '悬停小部件各子元素之间的边框'
            }
        );
    }
}
