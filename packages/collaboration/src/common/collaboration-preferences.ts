// *****************************************************************************
// Copyright (C) 2025 TypeFox and others.
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

export const collaborationPreferencesSchema: PreferenceSchema = {
    properties: {
        'collaboration.serverUrl': {
            type: 'string',
            default: 'https://api.open-collab.tools/',
            title: nls.localize('theia/collaboration/serverUrl', '服务器 URL'),
            description: nls.localize('theia/collaboration/serverUrlDescription', '用于实时协作会话的 Open Collaboration Tools 服务器实例的 URL'),
        },
    },
    title: nls.localize('theia/collaboration/collaboration', '协作'),
};
