// *****************************************************************************
// Copyright (C) 2023 Ericsson and others.
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

import { nls, PreferenceProxy, PreferenceSchema, PreferenceScope } from '@theia/core';

export const TerminalManagerPreferenceSchema: PreferenceSchema = {
    properties: {
        'terminal.grouping.treeViewLocation': {
            'type': 'string',
            'enum': ['left', 'right'],
            'description': nls.localize('theia/terminal-manager/treeViewLocation', '终端管理器树视图的位置。'
                + ' 仅在 \'terminal.grouping.mode\' 设置为 \'tree\' 时生效。'),
            'default': 'left',
            'scope': PreferenceScope.Workspace,
        },
        'terminal.grouping.mode': {
            'type': 'string',
            'enum': ['tabbed', 'tree'],
            'description': nls.localize('theia/terminal-manager/tabsDisplay',
                '控制终端的显示方式。\'tree\' 在单个视图中显示多个终端，并提供树视图进行管理；'
                + '\'tabbed\' 在单独的选项卡中为每个终端显示各自的视图。'),
            'default': 'tabbed',
            'scope': PreferenceScope.Workspace,
        },
    },
};

export type TerminalManagerTreeViewLocation = 'left' | 'right';
export type TerminalGroupingMode = 'tabbed' | 'tree';

export interface TerminalManagerConfiguration {
    'terminal.grouping.treeViewLocation': TerminalManagerTreeViewLocation;
    'terminal.grouping.mode': TerminalGroupingMode;
}

export const TerminalManagerPreferences = Symbol('TerminalManagerPreferences');
export const TerminalManagerPreferenceContribution = Symbol('TerminalManagerPreferenceContribution');
export type TerminalManagerPreferences = PreferenceProxy<TerminalManagerConfiguration>;

