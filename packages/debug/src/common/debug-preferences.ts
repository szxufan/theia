// *****************************************************************************
// Copyright (C) 2018 Ericsson and others.
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
import { PreferenceContribution, PreferenceProxy, PreferenceSchema, PreferenceService, createPreferenceProxy } from '@theia/core/lib/common/preferences';
import { interfaces } from '@theia/core/shared/inversify';

export const debugPreferencesSchema: PreferenceSchema = {
    properties: {
        'debug.trace': {
            type: 'boolean',
            default: false,
            description: nls.localize('theia/debug/toggleTracing', '启用/禁用与调试适配器通信的跟踪')
        },
        'debug.openDebug': {
            enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart', 'openOnDebugBreak'],
            default: 'openOnSessionStart',
            description: nls.localizeByDefault('控制调试视图何时打开。')
        },
        'debug.internalConsoleOptions': {
            enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart'],
            default: 'openOnFirstSessionStart',
            description: nls.localizeByDefault('控制内部调试控制台何时打开。')
        },
        'debug.console.maximumLines': {
            type: 'number',
            default: 10000,
            minimum: 1,
            description: nls.localizeByDefault('控制调试控制台的最大行数。')
        },
        'debug.inlineValues': {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('调试时在编辑器中内联显示变量值。')
        },
        'debug.showInStatusBar': {
            enum: ['never', 'always', 'onFirstSessionStart'],
            enumDescriptions: [
                nls.localizeByDefault('从不在状态栏显示调试项'),
                nls.localizeByDefault('始终在状态栏显示调试项'),
                nls.localizeByDefault('仅在首次启动调试后在状态栏显示调试项')
            ],
            description: nls.localizeByDefault('控制调试状态栏项何时可见。'),
            default: 'onFirstSessionStart'
        },
        'debug.confirmOnExit': {
            description: nls.localizeByDefault('控制存在活动调试会话时关闭窗口是否需要确认。'),
            type: 'string',
            enum: ['never', 'always'],
            enumDescriptions: [
                nls.localizeByDefault('从不确认。'),
                nls.localizeByDefault('存在调试会话时始终确认。'),
            ],
            default: 'never'
        },
        'debug.disassemblyView.showSourceCode': {
            description: nls.localizeByDefault('在反汇编视图中显示源代码。'),
            type: 'boolean',
            default: true,
        },
        'debug.autoExpandLazyVariables': {
            type: 'string',
            enum: ['on', 'off'],
            default: 'off',
            enumDescriptions: [
                nls.localizeByDefault('始终自动展开惰性变量。'),
                nls.localizeByDefault('从不自动展开惰性变量。')
            ],
            description: nls.localizeByDefault('控制是否由调试器自动解析和展开惰性求值的变量（如 getter）。')
        },
        'debug.focusWindowOnBreak': {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('控制调试器中断时工作台窗口是否获取焦点。')
        },
        'debug.focusEditorOnBreak': {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('控制调试器中断时编辑器是否获取焦点。')
        },
    }
};

export class DebugConfiguration {
    'debug.trace': boolean;
    'debug.openDebug': 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart' | 'openOnDebugBreak';
    'debug.internalConsoleOptions': 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart';
    'debug.console.maximumLines': number;
    'debug.inlineValues': boolean;
    'debug.showInStatusBar': 'never' | 'always' | 'onFirstSessionStart';
    'debug.confirmOnExit': 'never' | 'always';
    'debug.disassemblyView.showSourceCode': boolean;
    'debug.autoExpandLazyVariables': 'on' | 'off';
    'debug.focusWindowOnBreak': boolean;
    'debug.focusEditorOnBreak': boolean;
}

export const DebugPreferenceContribution = Symbol('DebugPreferenceContribution');
export const DebugPreferences = Symbol('DebugPreferences');
export type DebugPreferences = PreferenceProxy<DebugConfiguration>;

export function createDebugPreferences(preferences: PreferenceService, schema: PreferenceSchema = debugPreferencesSchema): DebugPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindDebugPreferences(bind: interfaces.Bind): void {
    bind(DebugPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(DebugPreferenceContribution);
        return createDebugPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(DebugPreferenceContribution).toConstantValue({ schema: debugPreferencesSchema });
    bind(PreferenceContribution).toService(DebugPreferenceContribution);
}
