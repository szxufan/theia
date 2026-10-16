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

import { interfaces } from 'inversify';
import { nls } from '../common/nls';
import { isOSX, isWindows } from '../common';
import { PreferenceContribution, PreferenceSchema } from '../common/preferences/preference-schema';
import { createPreferenceProxy, PreferenceProxy, PreferenceScope, PreferenceService } from '../common/preferences';

export namespace ZoomLevel {
    export const DEFAULT = 0;
    // copied from https://github.com/microsoft/vscode/blob/dda96b69bfc63f309e60cfc5f98cb863c46b32ac/src/vs/workbench/electron-sandbox/actions/windowActions.ts#L47-L48
    export const MIN = -8;
    export const MAX = 9;
    // amount to increment or decrement the window zoom level.
    export const VARIATION = 0.5;
    // Chromium's base for zoom factor calculation: zoomFactor = pow(ZOOM_BASE, zoomLevel)
    // See https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/common/page/page_zoom.cc
    export const ZOOM_BASE = 1.2;
}

export const PREF_WINDOW_ZOOM_LEVEL = 'window.zoomLevel';
export const PREF_WINDOW_TITLE_BAR_STYLE = 'window.titleBarStyle';

export const electronWindowPreferencesSchema: PreferenceSchema = {
    properties: {
        [PREF_WINDOW_ZOOM_LEVEL]: {
            type: 'number',
            default: ZoomLevel.DEFAULT,
            minimum: ZoomLevel.MIN,
            maximum: ZoomLevel.MAX,
            scope: PreferenceScope.User,
            markdownDescription: nls.localize('theia/core/window/zoomLevelPref',
                '调整所有窗口的默认缩放级别。\
                高于 `0`（例如 `0.5`）或低于 `0`（例如 `-0.5`）的每个 `0.5` 增量表示放大或缩小约 `10%`。\
                你也可以输入其他小数值，以更精细的粒度调整缩放级别。')
        },
        [PREF_WINDOW_TITLE_BAR_STYLE]: {
            type: 'string',
            enum: ['native', 'custom'],
            default: isWindows ? 'custom' : 'native',
            scope: PreferenceScope.User,
            description: nls.localizeByDefault('调整窗口标题栏的外观，使其为操作系统原生样式或自定义样式。更改需要完全重启后生效。'),
            included: !isOSX
        },
    }
};

export class ElectronWindowConfiguration {
    [PREF_WINDOW_ZOOM_LEVEL]: number;
    [PREF_WINDOW_TITLE_BAR_STYLE]: 'native' | 'custom';
}

export const ElectronWindowPreferenceContribution = Symbol('ElectronWindowPreferenceContribution');
export const ElectronWindowPreferences = Symbol('ElectronWindowPreferences');
export type ElectronWindowPreferences = PreferenceProxy<ElectronWindowConfiguration>;

export function createElectronWindowPreferences(preferences: PreferenceService, schema: PreferenceSchema = electronWindowPreferencesSchema): ElectronWindowPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindWindowPreferences(bind: interfaces.Bind): void {
    bind(ElectronWindowPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(ElectronWindowPreferenceContribution);
        return createElectronWindowPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(ElectronWindowPreferenceContribution).toConstantValue({ schema: electronWindowPreferencesSchema });
    bind(PreferenceContribution).toService(ElectronWindowPreferenceContribution);
}
