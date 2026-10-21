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

import { LINUX_ENV_HINT, nls, PreferenceSchema } from '@theia/core';

export const SCAN_OSS_API_KEY_PREF = 'ai-features.SCANOSS.apiKey';

export const ScanOSSPreferencesSchema: PreferenceSchema = {
    properties: {
        [SCAN_OSS_API_KEY_PREF]: {
            type: 'string',
            markdownDescription: nls.localize('theia/scanoss/apiKey/mdDescription',
                '输入您 SCANOSS 账户的 API 密钥。**请注意：**使用此偏好设置后，'
                + 'API 密钥将以明文形式存储在运行 Theia 的机器上。'
                + '请使用环境变量 `SCANOSS_API_KEY` 安全地设置密钥。') + LINUX_ENV_HINT,
            title: nls.localize('theia/scanoss/apiKey/title', 'SCANOSS API 密钥')
        }
    }
};
