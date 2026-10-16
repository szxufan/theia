// *****************************************************************************
// Copyright (C) 2021 EclipseSource and others.
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

import { createPreferenceProxy, PreferenceProxy, PreferenceScope, PreferenceService, PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences';
import { nls } from '@theia/core/lib/common/nls';
import { interfaces } from '@theia/core/shared/inversify';

export const WORKSPACE_TRUST_ENABLED = 'security.workspace.trust.enabled';
export const WORKSPACE_TRUST_STARTUP_PROMPT = 'security.workspace.trust.startupPrompt';
export const WORKSPACE_TRUST_EMPTY_WINDOW = 'security.workspace.trust.emptyWindow';
export const WORKSPACE_TRUST_TRUSTED_FOLDERS = 'security.workspace.trust.trustedFolders';

export enum WorkspaceTrustPrompt {
    ALWAYS = 'always',
    ONCE = 'once',
    NEVER = 'never'
}

export const workspaceTrustPreferenceSchema: PreferenceSchema = {
    scope: PreferenceScope.User,
    properties: {
        [WORKSPACE_TRUST_ENABLED]: {
            description: nls.localize('theia/workspace/trustEnabled', '控制是否启用工作区信任。如果禁用，则所有工作区都被信任。'),
            type: 'boolean',
            default: true
        },
        [WORKSPACE_TRUST_STARTUP_PROMPT]: {
            description: nls.localizeByDefault('控制何时显示信任工作区的启动提示。'),
            enum: Object.values(WorkspaceTrustPrompt),
            default: WorkspaceTrustPrompt.ALWAYS
        },
        [WORKSPACE_TRUST_EMPTY_WINDOW]: {
            description: nls.localize('theia/workspace/trustEmptyWindow', '控制空工作区默认是否被信任。'),
            type: 'boolean',
            default: true
        },
        [WORKSPACE_TRUST_TRUSTED_FOLDERS]: {
            description: nls.localize('theia/workspace/trustTrustedFolders', '无需提示即可信任的文件夹 URI 列表。'),
            type: 'array',
            items: {
                type: 'string'
            },
            default: [],
            scope: PreferenceScope.User
        }
    }
};

export interface WorkspaceTrustConfiguration {
    [WORKSPACE_TRUST_ENABLED]: boolean,
    [WORKSPACE_TRUST_STARTUP_PROMPT]: WorkspaceTrustPrompt;
    [WORKSPACE_TRUST_EMPTY_WINDOW]: boolean;
    [WORKSPACE_TRUST_TRUSTED_FOLDERS]: string[];
}

export const WorkspaceTrustPreferenceContribution = Symbol('WorkspaceTrustPreferenceContribution');
export const WorkspaceTrustPreferences = Symbol('WorkspaceTrustPreferences');
export type WorkspaceTrustPreferences = PreferenceProxy<WorkspaceTrustConfiguration>;

export function createWorkspaceTrustPreferences(preferences: PreferenceService, schema: PreferenceSchema = workspaceTrustPreferenceSchema): WorkspaceTrustPreferences {
    return createPreferenceProxy(preferences, schema);
}

export function bindWorkspaceTrustPreferences(bind: interfaces.Bind): void {
    bind(WorkspaceTrustPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        const contribution = ctx.container.get<PreferenceContribution>(WorkspaceTrustPreferenceContribution);
        return createWorkspaceTrustPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(WorkspaceTrustPreferenceContribution).toConstantValue({ schema: workspaceTrustPreferenceSchema });
    bind(PreferenceContribution).toService(WorkspaceTrustPreferenceContribution);
}
