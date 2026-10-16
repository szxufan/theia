// *****************************************************************************
// Copyright (C) 2026 STMicroelectronics and others.
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
import { PreferenceScope } from '@theia/core/lib/common/preferences/preference-scope';
import { createPreferenceProxy, PreferenceProxy } from '@theia/core/lib/common/preferences/preference-proxy';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { PreferenceService } from '@theia/core/lib/common/preferences/preference-service';
import { interfaces } from '@theia/core/shared/inversify';
import { TelemetryLevel } from './telemetry-types';

/** @experimental */
export const TELEMETRY_LEVEL = 'telemetry.telemetryLevel';
/** @experimental */
export const TELEMETRY_FILTERS = 'telemetry.filters';

/** @experimental */
export type TelemetryFilters = Record<string, string[]>;

/** @experimental */
export interface TelemetryConfiguration {
    [TELEMETRY_LEVEL]: TelemetryLevel;
    [TELEMETRY_FILTERS]: TelemetryFilters;
}

/** @experimental */
export const TelemetryPreferenceSchema: PreferenceSchema = {
    scope: PreferenceScope.User,
    properties: {
        [TELEMETRY_LEVEL]: {
            type: 'string',
            enum: ['off', 'crash', 'error', 'all'],
            enumDescriptions: [
                nls.localizeByDefault('禁用所有产品遥测。'),
                nls.localizeByDefault('发送操作系统级别的崩溃报告。'),
                nls.localizeByDefault('发送一般错误遥测和崩溃报告。'),
                nls.localizeByDefault('发送使用数据、错误和崩溃报告。')
            ],
            default: 'off',
            description: nls.localizeByDefault('控制遥测级别。')
        },
        [TELEMETRY_FILTERS]: {
            type: 'object',
            additionalProperties: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            default: {},
            description: nls.localize('theia/telemetry/filters',
                '限制传递给每个遥测接收器（sink）的主题模式。缺少的条目表示允许所有该接收器感兴趣的内容；空数组则禁用该接收器。')
        }
    }
};

/** @experimental */
export const TelemetryPreferenceContribution = Symbol('TelemetryPreferenceContribution');
/** @experimental */
export const TelemetryPreferences = Symbol('TelemetryPreferences');
/** @experimental */
export type TelemetryPreferences = PreferenceProxy<TelemetryConfiguration>;

/** @experimental */
export function createTelemetryPreferences(preferences: PreferenceService, schema: PreferenceSchema = TelemetryPreferenceSchema): TelemetryPreferences {
    return createPreferenceProxy(preferences, schema);
}

/** @experimental */
export function bindTelemetryPreferences(bind: interfaces.Bind): void {
    bind(TelemetryPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(TelemetryPreferenceContribution);
        return createTelemetryPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(TelemetryPreferenceContribution).toConstantValue({ schema: TelemetryPreferenceSchema });
    bind(PreferenceContribution).toService(TelemetryPreferenceContribution);
}
