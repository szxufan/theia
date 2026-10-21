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

import { nls, PreferenceSchema, PreferenceScope } from '@theia/core';

export const AUTO_UPDATE_PREF = 'ai-features.registry.autoUpdate';
export const AUTO_UPDATE_OVERRIDES_PREF = 'ai-features.registry.autoUpdateOverrides';

/** How registry-managed artifacts (skills, MCP servers, Agent Plugins) react to a newer registry entry. */
export type AutoUpdateMode = 'off' | 'ask' | 'on';

export const AUTO_UPDATE_MODES: readonly AutoUpdateMode[] = ['off', 'ask', 'on'];

export namespace AutoUpdateMode {
    export function is(value: unknown): value is AutoUpdateMode {
        return typeof value === 'string' && (AUTO_UPDATE_MODES as readonly string[]).includes(value);
    }
}

/** Artifact families the registry can auto-update. Namespaces the override keys. */
export type RegistryArtifactKind = 'skill' | 'mcp' | 'plugin';

/**
 * Both preferences are `User`-scoped on purpose: a workspace-settable policy would let a cloned
 * repository turn auto-update on and download skill content into `~/.agents/skills` at startup
 * without the user ever being asked.
 */
export const AIRegistryPreferencesSchema: PreferenceSchema = {
    properties: {
        [AUTO_UPDATE_PREF]: {
            type: 'string',
            enum: [...AUTO_UPDATE_MODES],
            enumItemLabels: [
                nls.localize('theia/ai-registry/autoUpdate/off/label', '从不更新'),
                nls.localize('theia/ai-registry/autoUpdate/ask/label', '有更新时询问'),
                nls.localize('theia/ai-registry/autoUpdate/on/label', '自动更新')
            ],
            default: 'ask',
            scope: PreferenceScope.User,
            enumDescriptions: [
                nls.localize('theia/ai-registry/autoUpdate/off',
                    '从不更新已安装的技能、MCP 服务器和代理插件，也不通知可用的更新。'),
                nls.localize('theia/ai-registry/autoUpdate/ask', '当已安装的技能、MCP 服务器或代理插件有可用更新时通知。'),
                nls.localize('theia/ai-registry/autoUpdate/on', '自动更新已安装的技能、MCP 服务器和代理插件。')
            ],
            description: nls.localize('theia/ai-registry/autoUpdate/description',
                '从 AI 注册表安装的技能、MCP 服务器和代理插件的默认更新行为。每次\
窗口加载时检查一次更新。单个工件可以在扩展视图的齿轮菜单中覆盖此设置。'),
            title: nls.localize('theia/ai-registry/autoUpdate/title', '注册表自动更新')
        },
        [AUTO_UPDATE_OVERRIDES_PREF]: {
            type: 'object',
            default: {},
            scope: PreferenceScope.User,
            additionalProperties: {
                type: 'string',
                enum: [...AUTO_UPDATE_MODES]
            },
            markdownDescription: nls.localize('theia/ai-registry/autoUpdateOverrides/mdDescription',
                '按工件覆盖 `#ai-features.registry.autoUpdate#`，以 `skill:<skillId>`、`mcp:<serverId>` 或 \
`plugin:<pluginId>` 为键。条目通常通过扩展视图中的齿轮菜单维护；没有条目的工件将遵循\
默认设置。'),
            title: nls.localize('theia/ai-registry/autoUpdateOverrides/title', '按工件覆盖自动更新')
        }
    }
};
