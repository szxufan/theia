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

import { nls, PreferenceSchema, PreferenceScope } from '@theia/core';

export const EXTERNAL_API_DELIVERY_PREF = 'externalApi.delivery';
export const EXTERNAL_API_PORT_PREF = 'externalApi.port';
export const EXTERNAL_API_HOSTNAME_PREF = 'externalApi.hostname';
export const EXTERNAL_API_TOKEN_PREF = 'externalApi.token';

export const EXTERNAL_API_DEFAULT_HOSTNAME = 'localhost';

/** How the external API is delivered. */
export type ExternalApiDelivery = 'off' | 'samePort' | 'separatePort';

/**
 * The external API preference schema. The preferences configure the backend and therefore
 * apply per user: their maximum scope is {@link PreferenceScope.User}, so they cannot be
 * overridden in workspace settings.
 */
export const externalApiPreferenceSchema: PreferenceSchema = {
    properties: {
        [EXTERNAL_API_DELIVERY_PREF]: {
            type: 'string',
            enum: ['off', 'samePort', 'separatePort'],
            enumItemLabels: [
                nls.localizeByDefault('关闭'),
                nls.localize('theia/external-api/delivery/samePortLabel', '与后端相同的端口'),
                nls.localize('theia/external-api/delivery/separatePortLabel', '独立端口')
            ],
            enumDescriptions: [
                nls.localize('theia/external-api/delivery/off', '不提供外部 API。'),
                nls.localize('theia/external-api/delivery/samePort', '在与后端相同的端口上提供外部 API。'),
                nls.localize('theia/external-api/delivery/separatePort', '在专用端口上提供外部 API，通过 "externalApi.port" 配置。')
            ],
            default: 'off',
            scope: PreferenceScope.User,
            description: nls.localize('theia/external-api/delivery/description',
                '控制是否以及如何提供外部 HTTP API。')
        },
        [EXTERNAL_API_PORT_PREF]: {
            type: 'number',
            minimum: 0,
            maximum: 65535,
            default: 0,
            scope: PreferenceScope.User,
            description: nls.localize('theia/external-api/port/description',
                '外部 HTTP API 的服务端口。仅在 "externalApi.delivery" 设为 "separatePort" 时使用。')
        },
        [EXTERNAL_API_HOSTNAME_PREF]: {
            type: 'string',
            default: EXTERNAL_API_DEFAULT_HOSTNAME,
            scope: PreferenceScope.User,
            description: nls.localize('theia/external-api/hostname/description',
                '外部 HTTP API 服务器绑定的主机名或 IP 地址。使用 "0.0.0.0" 可接受远程连接。\
形如 "localhost" 的名称按其解析结果绑定，使用另一个回环地址的客户端可能无法访问服务器；\
请使用 "127.0.0.1" 或 "::1" 固定其中一个。仅在 "externalApi.delivery" 设为 "separatePort" 时使用。')
        },
        [EXTERNAL_API_TOKEN_PREF]: {
            type: 'string',
            default: '',
            scope: PreferenceScope.User,
            description: nls.localize('theia/external-api/token/description',
                '访问受保护的外部 API 端点所需的 Bearer 令牌（"Authorization: Bearer <token>"）。\
为空时，外部 API 将在不校验的情况下提供服务。')
        }
    }
};
