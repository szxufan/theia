// *****************************************************************************
// Copyright (C) 2018 Bitsler and others.
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

/* eslint-disable max-len */

import { interfaces } from '@theia/core/shared/inversify';
import { IJSONSchema } from '@theia/core/lib/common/json-schema';
import { PreferenceService } from '@theia/core/lib/common';
import { createPreferenceProxy, PreferenceProxy } from '@theia/core/lib/common/preferences/preference-proxy';
import { nls } from '@theia/core/lib/common/nls';
import { editorGeneratedPreferenceProperties } from '@theia/editor/lib/common/editor-generated-preference-schema';
import { OS } from '@theia/core';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { ColorDefaults } from '@theia/core/lib/common/color';

/**
 * It should be aligned with https://github.com/microsoft/vscode/blob/0dfa355b3ad185a6289ba28a99c141ab9e72d2be/src/vs/workbench/contrib/terminal/common/terminalColorRegistry.ts#L40
 */
export const terminalAnsiColorMap: { [key: string]: { index: number, defaults: ColorDefaults } } = {
    'terminal.ansiBlack': {
        index: 0,
        defaults: {
            light: '#000000',
            dark: '#000000',
            hcDark: '#000000',
            hcLight: '#292929'
        }
    },
    'terminal.ansiRed': {
        index: 1,
        defaults: {
            light: '#cd3131',
            dark: '#cd3131',
            hcDark: '#cd0000',
            hcLight: '#cd3131'
        }
    },
    'terminal.ansiGreen': {
        index: 2,
        defaults: {
            light: '#00BC00',
            dark: '#0DBC79',
            hcDark: '#00cd00',
            hcLight: '#00bc00'
        }
    },
    'terminal.ansiYellow': {
        index: 3,
        defaults: {
            light: '#949800',
            dark: '#e5e510',
            hcDark: '#cdcd00',
            hcLight: '#949800'
        }
    },
    'terminal.ansiBlue': {
        index: 4,
        defaults: {
            light: '#0451a5',
            dark: '#2472c8',
            hcDark: '#0000ee',
            hcLight: '#0451a5'
        }
    },
    'terminal.ansiMagenta': {
        index: 5,
        defaults: {
            light: '#bc05bc',
            dark: '#bc3fbc',
            hcDark: '#cd00cd',
            hcLight: '#bc05bc'
        }
    },
    'terminal.ansiCyan': {
        index: 6,
        defaults: {
            light: '#0598bc',
            dark: '#11a8cd',
            hcDark: '#00cdcd',
            hcLight: '#0598b'
        }
    },
    'terminal.ansiWhite': {
        index: 7,
        defaults: {
            light: '#555555',
            dark: '#e5e5e5',
            hcDark: '#e5e5e5',
            hcLight: '#555555'
        }
    },
    'terminal.ansiBrightBlack': {
        index: 8,
        defaults: {
            light: '#666666',
            dark: '#666666',
            hcDark: '#7f7f7f',
            hcLight: '#666666'
        }
    },
    'terminal.ansiBrightRed': {
        index: 9,
        defaults: {
            light: '#cd3131',
            dark: '#f14c4c',
            hcDark: '#ff0000',
            hcLight: '#cd3131'
        }
    },
    'terminal.ansiBrightGreen': {
        index: 10,
        defaults: {
            light: '#14CE14',
            dark: '#23d18b',
            hcDark: '#00ff00',
            hcLight: '#00bc00'
        }
    },
    'terminal.ansiBrightYellow': {
        index: 11,
        defaults: {
            light: '#b5ba00',
            dark: '#f5f543',
            hcDark: '#ffff00',
            hcLight: '#b5ba00'
        }
    },
    'terminal.ansiBrightBlue': {
        index: 12,
        defaults: {
            light: '#0451a5',
            dark: '#3b8eea',
            hcDark: '#5c5cff',
            hcLight: '#0451a5'
        }
    },
    'terminal.ansiBrightMagenta': {
        index: 13,
        defaults: {
            light: '#bc05bc',
            dark: '#d670d6',
            hcDark: '#ff00ff',
            hcLight: '#bc05bc'
        }
    },
    'terminal.ansiBrightCyan': {
        index: 14,
        defaults: {
            light: '#0598bc',
            dark: '#29b8db',
            hcDark: '#00ffff',
            hcLight: '#0598bc'
        }
    },
    'terminal.ansiBrightWhite': {
        index: 15,
        defaults: {
            light: '#a5a5a5',
            dark: '#e5e5e5',
            hcDark: '#ffffff',
            hcLight: '#a5a5a5'
        }
    }
};

const commonProfileProperties: PreferenceSchema['properties'] = {
    env: {
        type: 'object',
        additionalProperties: {
            type: 'string'
        },
        markdownDescription: nls.localizeByDefault('一个包含环境变量的对象，这些变量将被添加到终端配置文件进程中。设置为 `null` 可从基础环境中删除环境变量。'),
    },
    overrideName: {
        type: 'boolean',
        description: nls.localizeByDefault('是否将检测正在运行的程序的动态终端标题替换为静态配置文件名称。')
    },
    icon: {
        type: 'string',
        markdownDescription: nls.localize('theia/terminal/profileIcon', '要与终端图标关联的 codicon ID。\nterminal-tmux:"$(terminal-tmux)"')
    },
    color: {
        type: 'string',
        enum: Object.getOwnPropertyNames(terminalAnsiColorMap),
        description: nls.localize('theia/terminal/profileColor', '要与终端关联的终端主题颜色 ID。')
    }
};

const stringOrStringArray: IJSONSchema = {
    oneOf: [
        { type: 'string' },
        {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    ]
};

const pathProperty: IJSONSchema = {
    description: nls.localize('theia/terminal/profilePath', '此配置文件使用的 shell 路径。'),
    ...stringOrStringArray
};

function shellArgsDeprecatedMessage(type: OS.Type): string {
    return nls.localize('theia/terminal/shell.deprecated', '此设置已弃用，配置默认 shell 的新推荐方式是在 \'terminal.integrated.profiles.{0}\' 中创建终端配置文件，并在 \'terminal.integrated.defaultProfile.{0}\' 中将其配置文件名称设置为默认。', type.toString().toLowerCase());
}

export const TerminalConfigSchema: PreferenceSchema = {
    properties: {
        'terminal.enableCopy': {
            type: 'boolean',
            description: nls.localize('theia/terminal/enableCopy', '启用 ctrl-c（macOS 上为 cmd-c）复制所选文本'),
            default: true
        },
        'terminal.enablePaste': {
            type: 'boolean',
            description: nls.localize('theia/terminal/enablePaste', '启用 ctrl-v（macOS 上为 cmd-v）从剪贴板粘贴'),
            default: true
        },
        'terminal.integrated.fontFamily': {
            type: 'string',
            markdownDescription: nls.localizeByDefault('控制终端的字体系列。默认为 {0} 的值。', '`#editor.fontFamily#`'),
            default: editorGeneratedPreferenceProperties['editor.fontFamily'].default,
        },
        'terminal.integrated.fontSize': {
            type: 'number',
            description: nls.localizeByDefault('控制终端的字体大小（像素）。'),
            minimum: 6,
            default: editorGeneratedPreferenceProperties['editor.fontSize'].default
        },
        'terminal.integrated.fontWeight': {
            type: 'string',
            enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
            description: nls.localizeByDefault('终端中非粗体文本使用的字重。接受 \"normal\" 和 \"bold\" 关键字或 1 到 1000 之间的数字。'),
            default: 'normal'
        },
        'terminal.integrated.fontWeightBold': {
            type: 'string',
            enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
            description: nls.localizeByDefault('终端中粗体文本使用的字重。接受 \"normal\" 和 \"bold\" 关键字或 1 到 1000 之间的数字。'),
            default: 'bold'
        },
        'terminal.integrated.drawBoldTextInBrightColors': {
            description: nls.localizeByDefault('控制终端中的粗体文本是否始终使用 \"bright\" ANSI 颜色变体。'),
            type: 'boolean',
            default: true,
        },
        'terminal.integrated.letterSpacing': {
            description: nls.localizeByDefault('控制终端的字符间距。这是一个整数值，表示在字符之间添加的额外像素数。'),
            type: 'number',
            default: 1
        },
        'terminal.integrated.lineHeight': {
            description: nls.localizeByDefault('控制终端的行高。该数字乘以终端字体大小即可得到实际的行高（像素）。'),
            type: 'number',
            minimum: 1,
            default: 1
        },
        'terminal.integrated.scrollback': {
            description: nls.localizeByDefault('控制终端缓冲区保留的最大行数。我们会根据此值预分配内存以确保流畅体验。因此，该值越大，占用的内存也越多。'),
            type: 'number',
            default: 1000
        },
        'terminal.integrated.fastScrollSensitivity': {
            markdownDescription: nls.localizeByDefault('按下 `Alt` 时的滚动速度倍率。'),
            type: 'number',
            default: 5,
        },
        'terminal.integrated.rendererType': {
            description: nls.localize('theia/terminal/rendererType', '控制终端的渲染方式。'),
            type: 'string',
            enum: ['canvas', 'dom'],
            default: 'canvas',
            deprecationMessage: nls.localize('theia/terminal/rendererTypeDeprecationMessage', '渲染器类型不再作为选项支持。')
        },
        'terminal.integrated.copyOnSelection': {
            description: nls.localizeByDefault('控制终端中选中的文本是否将复制到剪贴板。'),
            type: 'boolean',
            default: false,
        },
        'terminal.integrated.cursorBlinking': {
            description: nls.localizeByDefault('控制终端光标是否闪烁。'),
            type: 'boolean',
            default: false
        },
        'terminal.integrated.cursorStyle': {
            description: nls.localizeByDefault('控制终端聚焦时光标的样式。'),
            enum: ['block', 'underline', 'line'],
            default: 'block'
        },
        'terminal.integrated.cursorWidth': {
            markdownDescription: nls.localizeByDefault('控制当 {0} 设置为 {1} 时光标的宽度。', '`#terminal.integrated.cursorStyle#`', '`line`'),
            type: 'number',
            default: 1
        },
        'terminal.integrated.shell.windows': {
            type: ['string', 'null'],
            typeDetails: { isFilepath: true },
            markdownDescription: nls.localize('theia/terminal/shellWindows', '终端在 Windows 上使用的 shell 路径。（默认值：\'{0}\'）。', 'C:\\Windows\\System32\\cmd.exe'),
            default: undefined,
            deprecationMessage: shellArgsDeprecatedMessage(OS.Type.Windows),
        },
        'terminal.integrated.shell.osx': {
            type: ['string', 'null'],
            markdownDescription: nls.localize('theia/terminal/shellOsx', '终端在 macOS 上使用的 shell 路径（默认值：\'{0}\'}）。', '/bin/bash'),
            default: undefined,
            deprecationMessage: shellArgsDeprecatedMessage(OS.Type.OSX),
        },
        'terminal.integrated.shell.linux': {
            type: ['string', 'null'],
            markdownDescription: nls.localize('theia/terminal/shellLinux', '终端在 Linux 上使用的 shell 路径（默认值：\'{0}\'}）。', '/bin/bash'),
            default: undefined,
            deprecationMessage: shellArgsDeprecatedMessage(OS.Type.Linux),
        },
        'terminal.integrated.shellArgs.windows': {
            type: 'array',
            markdownDescription: nls.localize('theia/terminal/shellArgsWindows', '在 Windows 终端上使用的命令行参数。'),
            default: [],
            deprecationMessage: shellArgsDeprecatedMessage(OS.Type.Windows),
        },
        'terminal.integrated.shellArgs.osx': {
            type: 'array',
            markdownDescription: nls.localize('theia/terminal/shellArgsOsx', '在 macOS 终端上使用的命令行参数。'),
            default: [
                '-l'
            ],
            deprecationMessage: shellArgsDeprecatedMessage(OS.Type.OSX),
        },
        'terminal.integrated.shellArgs.linux': {
            type: 'array',
            markdownDescription: nls.localize('theia/terminal/shellArgsLinux', '在 Linux 终端上使用的命令行参数。'),
            default: [],
            deprecationMessage: shellArgsDeprecatedMessage(OS.Type.Linux),
        },
        // TODO: This preference currently features no implementation but is only available for plugins to use.
        'terminal.integrated.commandsToSkipShell': {
            type: 'array',
            markdownDescription: nls.localizeByDefault('一组命令 ID，其按键绑定不会被发送到 shell，而是始终由 VS Code 处理。这使得通常会被 shell 消耗的按键绑定表现得与终端未聚焦时相同，例如 `Ctrl+P` 启动快速打开。\n\n&nbsp;\n\n许多命令默认被跳过。若要覆盖默认值并将该命令的按键绑定传递给 shell，请在命令前加上 `-` 字符。例如添加 `-workbench.action.quickOpen` 以允许 `Ctrl+P` 到达 shell。\n\n&nbsp;\n\n在设置编辑器中查看时，以下默认跳过命令列表会被截断。要查看完整列表，请 {1} 并搜索下面的列表中的第一个命令。\n\n&nbsp;\n\n默认跳过的命令：\n\n{0}'),
            items: {
                type: 'string'
            },
            default: []
        },
        'terminal.integrated.confirmOnExit': {
            type: 'string',
            description: nls.localizeByDefault('控制存在活动终端会话时关闭窗口是否需要确认。由某些扩展启动的后台终端不会触发确认。'),
            enum: ['never', 'always', 'hasChildProcesses'],
            enumDescriptions: [
                nls.localizeByDefault('从不确认。'),
                nls.localizeByDefault('存在终端时始终确认。'),
                nls.localizeByDefault('存在含有子进程的终端时确认。'),
            ],
            default: 'never'
        },
        'terminal.integrated.enablePersistentSessions': {
            type: 'boolean',
            description: nls.localizeByDefault('在窗口重新加载之间为工作区保留终端会话/历史记录。'),
            default: true
        },
        'terminal.integrated.enableCommandHistory': {
            type: 'boolean',
            markdownDescription: nls.localize('theia/terminal/enableCommandHistory', '通过 shell 注入分别跟踪终端命令及其输出。这将启用诸如在 UI 中直观区分命令以及让 AI 代理更结构化地访问终端等用例。切换此设置不会影响已打开的终端。\n\n&nbsp;\n\n此功能目前仅受任务终端和运行 bash 或 zsh 的用户终端支持。'),
            default: false,
            tags: ['experimental']
        },
        'terminal.integrated.enableCommandSeparator': {
            type: 'boolean',
            markdownDescription: nls.localize('theia/terminal/enableCommandSeparator', '在终端中为已执行的命令及其输出之间启用可视化分隔符。更改仅适用于修改此设置后执行的命令。仅在启用 {0} 时有效。', '`#terminal.integrated.enableCommandHistory#`'),
            default: false,
            tags: ['experimental']
        },
        'terminal.integrated.defaultProfile.windows': {
            type: 'string',
            description: nls.localize('theia/terminal/defaultProfile', '{0} 上使用的默认配置文件', OS.Type.Windows.toString())

        },
        'terminal.integrated.defaultProfile.linux': {
            type: 'string',
            description: nls.localize('theia/terminal/defaultProfile', '{0} 上使用的默认配置文件', OS.Type.Linux.toString())

        },
        'terminal.integrated.defaultProfile.osx': {
            type: 'string',
            description: nls.localize('theia/terminal/defaultProfile', '{0} 上使用的默认配置文件', OS.Type.OSX.toString())
        },
        'terminal.integrated.profiles.windows': {
            markdownDescription: nls.localize('theia/terminal/profiles', '创建新终端时要显示的配置文件。手动设置 path 属性及可选参数。\n将现有配置文件设置为 `null` 可将其从列表中隐藏，例如：`"{0}": null`。', 'cmd'),
            anyOf: [
                {
                    type: 'object',
                    properties: {
                    },
                    additionalProperties: {
                        oneOf: [{
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                path: pathProperty,
                                args: {
                                    ...stringOrStringArray,
                                    description: nls.localize('theia/terminal/profileArgs', '此配置文件使用的 shell 参数。'),

                                },
                                ...commonProfileProperties
                            },
                            required: ['path']
                        },
                        {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                source: {
                                    type: 'string',
                                    description: nls.localizeByDefault('将自动检测 Shell 路径的配置文件源。注意不支持非标准的可执行文件位置，必须在新配置文件中手动创建。')
                                },
                                args: {
                                    ...stringOrStringArray,
                                    description: nls.localize('theia/terminal/profileArgs', '此配置文件使用的 shell 参数。'),

                                },
                                ...commonProfileProperties
                            },
                            required: ['source'],
                            default: {
                                path: 'C:\\Windows\\System32\\cmd.exe'
                            }

                        }, {
                            type: 'null'
                        }]
                    },
                    default: {
                        cmd: {
                            path: 'C:\\Windows\\System32\\cmd.exe'
                        }
                    }
                },
                { type: 'null' }
            ]
        },
        'terminal.integrated.profiles.linux': {
            markdownDescription: nls.localize('theia/terminal/profiles', '创建新终端时要显示的配置文件。手动设置 path 属性及可选参数。\n将现有配置文件设置为 `null` 可将其从列表中隐藏，例如：`"{0}": null`。', 'bash'),
            anyOf: [{
                type: 'object',
                properties: {
                },
                additionalProperties: {
                    oneOf: [
                        {
                            type: 'object',
                            properties: {
                                path: pathProperty,
                                args: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: nls.localize('theia/terminal/profileArgs', '此配置文件使用的 shell 参数。'),
                                },
                                ...commonProfileProperties
                            },
                            required: ['path'],
                            additionalProperties: false,
                        },
                        { type: 'null' }
                    ]
                },
                default: {
                    path: '${env:SHELL}',
                    args: ['-l']
                }

            },
            { type: 'null' }
            ]
        },
        'terminal.integrated.profiles.osx': {
            markdownDescription: nls.localize('theia/terminal/profiles', '创建新终端时要显示的配置文件。手动设置 path 属性及可选参数。\n将现有配置文件设置为 `null` 可将其从列表中隐藏，例如：`"{0}": null`。', 'zsh'),
            anyOf: [{
                type: 'object',
                properties: {
                },
                additionalProperties: {
                    oneOf: [
                        {
                            type: 'object',
                            properties: {
                                path: pathProperty,
                                args: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: nls.localize('theia/terminal/profileArgs', '此配置文件使用的 shell 参数。'),
                                },
                                ...commonProfileProperties
                            },
                            required: ['path'],
                            additionalProperties: false,
                        },
                        { type: 'null' }
                    ]
                },
                default: {
                    path: '${env:SHELL}',
                    args: ['-l']
                }

            },
            { type: 'null' }
            ]
        },
    }
};

export type Profiles = null | {
    [key: string]: {
        path?: string | string[],
        source?: string,
        args?: string | string[],
        env?: { [key: string]: string },
        overrideName?: boolean;
        icon?: string,
        color?: string
    }
};

export interface TerminalConfiguration {
    'terminal.enableCopy': boolean
    'terminal.enablePaste': boolean
    // xterm compatible, see https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/
    'terminal.integrated.fontFamily': string
    'terminal.integrated.fontSize': number
    'terminal.integrated.fontWeight': FontWeight
    'terminal.integrated.fontWeightBold': FontWeight,
    'terminal.integrated.drawBoldTextInBrightColors': boolean,
    'terminal.integrated.letterSpacing': number
    'terminal.integrated.lineHeight': number,
    'terminal.integrated.scrollback': number,
    'terminal.integrated.fastScrollSensitivity': number,
    'terminal.integrated.rendererType': TerminalRendererType,
    'terminal.integrated.copyOnSelection': boolean,
    'terminal.integrated.cursorBlinking': boolean,
    'terminal.integrated.cursorStyle': CursorStyleVSCode,
    'terminal.integrated.cursorWidth': number,
    'terminal.integrated.shell.windows': string | null | undefined,
    'terminal.integrated.shell.osx': string | null | undefined,
    'terminal.integrated.shell.linux': string | null | undefined,
    'terminal.integrated.shellArgs.windows': string[],
    'terminal.integrated.shellArgs.osx': string[],
    'terminal.integrated.shellArgs.linux': string[],
    'terminal.integrated.defaultProfile.windows': string,
    'terminal.integrated.defaultProfile.linux': string,
    'terminal.integrated.defaultProfile.osx': string,
    'terminal.integrated.profiles.windows': Profiles
    'terminal.integrated.profiles.linux': Profiles,
    'terminal.integrated.profiles.osx': Profiles,
    'terminal.integrated.confirmOnExit': ConfirmOnExitType
    'terminal.integrated.enablePersistentSessions': boolean
    'terminal.integrated.enableCommandHistory': boolean
    'terminal.integrated.enableCommandSeparator': boolean
}

type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type CursorStyle = 'block' | 'underline' | 'bar';
// VS Code uses 'line' to represent 'bar'. The following conversion is necessary to support their preferences.
export type CursorStyleVSCode = CursorStyle | 'line';
export type TerminalRendererType = 'canvas' | 'dom';
export type ConfirmOnExitType = 'never' | 'always' | 'hasChildProcesses';
export const DEFAULT_TERMINAL_RENDERER_TYPE = 'canvas';
export function isTerminalRendererType(arg: unknown): arg is TerminalRendererType {
    return typeof arg === 'string' && (arg === 'canvas' || arg === 'dom');
}

export const TerminalPreferenceContribution = Symbol('TerminalPreferenceContribution');
export const TerminalPreferences = Symbol('TerminalPreferences');
export type TerminalPreferences = PreferenceProxy<TerminalConfiguration>;

export function createTerminalPreferences(preferences: PreferenceService, schema: PreferenceSchema = TerminalConfigSchema): TerminalPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindTerminalPreferences(bind: interfaces.Bind): void {
    bind(TerminalPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(TerminalPreferenceContribution);
        return createTerminalPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(TerminalPreferenceContribution).toConstantValue({ schema: TerminalConfigSchema });
    bind(PreferenceContribution).toService(TerminalPreferenceContribution);
}
