// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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

import { nls, PreferenceSchema } from '@theia/core';

export const SCANOSS_MODE_PREF = 'ai-features.SCANOSS.mode';

export const AIScanOSSPreferencesSchema: PreferenceSchema = {
    properties: {
        [SCANOSS_MODE_PREF]: {
            type: 'string',
            enum: ['off', 'manual', 'automatic'],
            enumItemLabels: [
                nls.localizeByDefault('关闭'),
                nls.localizeByDefault('手动'),
                nls.localizeByDefault('自动')
            ],
            markdownEnumDescriptions: [
                nls.localize('theia/ai/scanoss/mode/off/description', '完全关闭该功能。'),
                nls.localize('theia/ai/scanoss/mode/manual/description', '用户可以通过点击聊天视图中的 SCANOSS 项来手动触发扫描。'),
                nls.localize('theia/ai/scanoss/mode/automatic/description', '启用聊天视图中代码片段的自动扫描。')
            ],
            markdownDescription: nls.localize('theia/ai/scanoss/mode/description',
                '配置用于分析聊天视图中代码片段的 SCANOSS 功能。这会将建议代码片段的哈希值发送到由 [Software Transparency foundation](https://www.softwaretransparency.org/osskb) 托管的 SCANOSS\n\
服务进行分析。'),
            default: 'off',
            title: nls.localize('theia/ai/scanoss/mode/title', 'SCANOSS 扫描模式')
        }
    }
};
