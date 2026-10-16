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

import { expect } from 'chai';
import { PreferenceScope } from '@theia/core/lib/common/preferences/preference-scope';
import {
    TELEMETRY_FILTERS,
    TELEMETRY_LEVEL,
    TelemetryPreferenceSchema
} from './telemetry-preferences';

describe('telemetry preferences', () => {
    it('defines only the level and filters preference keys', () => {
        expect(Object.keys(TelemetryPreferenceSchema.properties)).to.deep.equal([TELEMETRY_LEVEL, TELEMETRY_FILTERS]);
    });

    it('limits telemetry preferences to user scope', () => {
        expect(TelemetryPreferenceSchema.scope).to.equal(PreferenceScope.User);
    });

    it('uses safe defaults and describes each telemetry level', () => {
        expect(TelemetryPreferenceSchema.properties[TELEMETRY_LEVEL]).to.deep.include({
            type: 'string',
            enum: ['off', 'crash', 'error', 'all'],
            enumDescriptions: [
                '禁用所有产品遥测。',
                '发送操作系统级别的崩溃报告。',
                '发送一般错误遥测和崩溃报告。',
                '发送使用数据、错误和崩溃报告。'
            ],
            default: 'off'
        });
        expect(TelemetryPreferenceSchema.properties[TELEMETRY_FILTERS].default).to.deep.equal({});
    });

    it('defines filters as sink IDs mapped to arrays of topic patterns', () => {
        expect(TelemetryPreferenceSchema.properties[TELEMETRY_FILTERS]).to.include({ type: 'object' });
        expect(TelemetryPreferenceSchema.properties[TELEMETRY_FILTERS].additionalProperties).to.deep.equal({
            type: 'array',
            items: { type: 'string' }
        });
    });
});
