// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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

import { AI_CORE_PREFERENCES_TITLE, MODEL_PROVIDER_TYPE_DETAIL, ModelProviderTypeDetail } from '@theia/ai-core/lib/common/ai-core-preferences';
import { nls, PreferenceSchema } from '@theia/core';

export const COPILOT_ENABLED_PREF = 'ai-features.copilot.enabled';
export const COPILOT_MODEL_OVERRIDES_PREF = 'ai-features.copilot.modelOverrides';
export const COPILOT_ENTERPRISE_URL_PREF = 'ai-features.copilot.enterpriseUrl';
export const COPILOT_EXECUTABLE_PATH_PREF = 'ai-features.copilot.executablePath';

export const CopilotPreferencesSchema: PreferenceSchema = {
    properties: {
        [COPILOT_ENABLED_PREF]: {
            type: 'boolean',
            typeDetails: { [MODEL_PROVIDER_TYPE_DETAIL]: { label: 'GitHub Copilot' } satisfies ModelProviderTypeDetail },
            markdownDescription: nls.localize('theia/ai/copilot/enabled/mdDescription',
                '启用 GitHub Copilot 提供程序。启用后，状态栏将出现用于身份验证的条目，'
                + '并会从您的 Copilot 订阅中发现可用模型。\n\n'
                + '请求通过官方 GitHub Copilot CLI 路由，该 CLI 作为后台进程运行在'
                + '托管后端的机器上。它只会获得您的 Copilot 登录凭据，不会使用其他内容，'
                + '因此不会使用环境中的 Token 或 GitHub CLI 的现有登录。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: true,
            tags: ['experimental']
        },
        [COPILOT_MODEL_OVERRIDES_PREF]: {
            type: 'array',
            markdownDescription: nls.localize('theia/ai/copilot/modelOverrides/mdDescription',
                '覆盖自动发现的 GitHub Copilot 模型。'
                + '为空时（默认），会从您的 Copilot 订阅中发现可用模型。'
                + '设置显式的模型 ID 可覆盖自动发现。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: [],
            items: {
                type: 'string'
            },
            tags: ['experimental']
        },
        [COPILOT_ENTERPRISE_URL_PREF]: {
            type: 'string',
            markdownDescription: nls.localize('theia/ai/copilot/enterpriseUrl/mdDescription',
                '用于身份验证和发送请求的 GitHub Enterprise 域名（例如 `github.mycompany.com`）。'
                + '留空表示 GitHub.com。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: '',
            tags: ['experimental']
        },
        [COPILOT_EXECUTABLE_PATH_PREF]: {
            type: 'string',
            markdownDescription: nls.localize('theia/ai/copilot/executablePath/mdDescription',
                '托管后端的机器上 GitHub Copilot CLI 可执行文件的位置。'
                + '为空时（默认），将在应用程序的安装目录、`PATH` 以及全局 `npm` 目录中搜索 CLI。'
                + '当 CLI 安装在其他位置时请设置此项。\n\n'
                + 'CLI 不随应用程序一起提供，请使用 `npm install -g @github/copilot` 安装。'),
            title: AI_CORE_PREFERENCES_TITLE,
            default: '',
            tags: ['experimental']
        }
    }
};
