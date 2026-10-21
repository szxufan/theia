// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH and others.
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

import { LINUX_ENV_HINT, nls, PreferenceSchema, PreferenceScope } from '@theia/core';

export const GITHUB_TOKEN_PREF = 'ai-features.registry.githubToken';

export const SkillRegistryPreferencesSchema: PreferenceSchema = {
    properties: {
        [GITHUB_TOKEN_PREF]: {
            type: 'string',
            scope: PreferenceScope.User,
            markdownDescription: nls.localize('theia/ai-registry/skill/githubToken/mdDescription',
                '从 GitHub 下载技能时可选使用的 GitHub 个人访问令牌。令牌可将 GitHub 的速率限制从每小时 60 个\
提高到 5000 个请求。**请注意：** 使用此首选项时，令牌将以明文形式存储在运行 Theia 的机器上。\
建议使用环境变量 `GITHUB_TOKEN` 来安全地提供它。') + LINUX_ENV_HINT,
            title: nls.localize('theia/ai-registry/skill/githubToken/title', 'GitHub 访问令牌')
        }
    }
};
