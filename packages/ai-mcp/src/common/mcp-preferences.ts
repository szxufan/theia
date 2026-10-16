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

export const MCP_SERVERS_PREF = 'ai-features.mcp.mcpServers';
export const MCP_USE_WORKSPACE_AS_ROOT_PREF = 'ai-features.mcp.useWorkspaceAsRoot';

export const McpServersPreferenceSchema: PreferenceSchema = {
    properties: {
        [MCP_SERVERS_PREF]: {
            type: 'object',
            title: nls.localize('theia/ai/mcp/servers/title', 'MCP 服务器配置'),
            markdownDescription: nls.localize('theia/ai/mcp/servers/mdDescription', '配置 MCP 服务器：本地服务器通过命令、\
参数以及可选的环境变量来定义；\
远程服务器通过服务器 URL、认证令牌、OAuth 配置以及可选的认证头名称来定义。\
此外还可以配置自动启动（默认为 true）。\
每个服务器通过一个唯一的键来标识，例如 "brave-search" 或 "filesystem"。\
要启动服务器，请使用 "MCP: 启动 MCP 服务器" 命令，该命令允许你选择所需的服务器。\
要停止服务器，请使用 "MCP: 停止 MCP 服务器" 命令。\
请注意，自动启动仅在重启后生效，首次需要手动启动服务器。\
从 AI 注册表安装的服务器会带有额外的 `registryMetadata` 块，该块由系统自动管理，不应手动编辑。\
\n\
配置示例：\n\
```\
{\n\
  "brave-search": {\n\
    "command": "npx",\n\
    "args": [\n\
      "-y",\n\
      "@modelcontextprotocol/server-brave-search"\n\
    ],\n\
    "env": {\n\
      "BRAVE_API_KEY": "YOUR_API_KEY"\n\
    },\n\
  },\n\
  "filesystem": {\n\
    "command": "npx",\n\
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/YOUR_USERNAME/Desktop"],\n\
    "env": {\n\
      "CUSTOM_ENV_VAR": "custom-value"\n\
    },\n\
    "autostart": false\n\
  },\n\
  "jira": {\n\
    "serverUrl": "YOUR_JIRA_MCP_SERVER_URL",\n\
    "serverAuthToken": "YOUR_JIRA_MCP_SERVER_TOKEN"\n\
  },\n\
  "oauth-protected-server": {\n\
    "serverUrl": "YOUR_OAUTH_PROTECTED_MCP_SERVER_URL",\n\
    "oauth": {\n\
      "clientId": "OPTIONAL_CLIENT_ID",\n\
      "scopes": ["OPTIONAL_SCOPE"]\n\
    }\n\
  }\n\
  }\n```'),
            additionalProperties: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/command/title', '执行 MCP 服务器的命令'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/command/mdDescription', '用于启动 MCP 服务器的命令，例如 "uvx" 或 "npx"。')
                    },
                    args: {
                        type: 'array',
                        title: nls.localize('theia/ai/mcp/servers/args/title', '命令参数'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/args/mdDescription', '传递给命令的参数数组。'),
                    },
                    env: {
                        type: 'object',
                        title: nls.localize('theia/ai/mcp/servers/env/title', '环境变量'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/env/mdDescription', '为服务器设置的可选环境变量，例如 API 密钥。'),
                        additionalProperties: {
                            type: 'string'
                        }
                    },
                    // `cwd`, `pluginRoot` and `pluginData` are deliberately absent: they are written by
                    // `@theia/ai-registry` for a server contributed by an Agent Plugin and derived from
                    // where that plugin was installed, so there is nothing for a user to author here.
                    // Undeclared rather than documented as read-only, because a declared property is an
                    // invitation to edit and the preference schema has no read-only affordance. Extra
                    // properties stay legal, so the values still round-trip through the editor.
                    autostart: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/mcp/servers/autostart/title', '自动启动'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/autostart/mdDescription',
                            '在前端启动时自动启动此服务器。新添加的服务器不会立即自动启动，而是在重启后生效'),
                        default: true
                    },
                    deferLoading: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/mcp/servers/deferLoading/title', '延迟加载'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/deferLoading/mdDescription',
                            '启用后，此服务器提供的工具会在生成的提示词片段 ' +
                            '`mcp_<server>_tools` 中被标记为延迟。延迟工具不会预先加载到模型的上下文中，而是由模型' +
                            '在受支持时（Anthropic、OpenAI）通过提供商内置的工具搜索机制按需发现。' +
                            '这可以显著减少暴露大量工具的服务器的 token 开销。'),
                        default: false
                    },
                    serverUrl: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/serverUrl/title', '服务器 URL'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/serverUrl/mdDescription',
                            '远程 MCP 服务器的 URL。提供后，服务器将连接到此 URL 而不是启动本地进程。'),
                    },
                    serverAuthToken: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/serverAuthToken/title', '认证令牌'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/serverAuthToken/mdDescription',
                            '服务器的认证令牌（如需要）。它以纯文本形式存储在首选项中；' +
                            '如果令牌较为敏感，请避免使用工作区设置。'),
                    },
                    serverAuthTokenHeader: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/serverAuthTokenHeader/title', '认证头名称'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/serverAuthTokenHeader/mdDescription',
                            '用于服务器认证令牌的头部名称。未提供时，将使用 "Authorization" 配合 "Bearer"。'),
                    },
                    headers: {
                        type: 'object',
                        title: nls.localizeByDefault('请求头'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/headers/mdDescription',
                            '每次请求服务器时附带的可选附加请求头。头部值以纯文本形式存储在首选项中；' +
                            '如果包含敏感值，请避免使用工作区设置。'),
                        additionalProperties: {
                            type: 'string'
                        }
                    },
                    oauth: {
                        type: 'object',
                        title: nls.localize('theia/ai/mcp/servers/oauth/title', 'OAuth'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/oauth/mdDescription',
                            '需要授权的远程 MCP 服务器的可选 OAuth 2.1 配置。' +
                            '此对象的存在即为该服务器启用 OAuth；删除它即可禁用 OAuth。' +
                            'Theia 默认使用支持 PKCE 的公共客户端；' +
                            '仅为要求预注册机密客户端的服务器配置客户端密钥。' +
                            '更改将在重启 MCP 服务器后生效。'),
                        properties: {
                            clientId: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/oauth/clientId/title', '客户端 ID'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/oauth/clientId/mdDescription',
                                    '可选的静态 OAuth 客户端 ID。省略时，Theia 会尝试动态客户端注册。'),
                            },
                            clientSecret: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/oauth/clientSecret/title', '客户端密钥'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/oauth/clientSecret/mdDescription',
                                    '用于仅接受预注册机密客户端（不支持动态客户端注册）的授权服务器的可选 OAuth 客户端密钥。' +
                                    '仅与客户端 ID 配合使用。它以纯文本形式存储在首选项中；' +
                                    '如果密钥较为敏感，请避免使用工作区设置。'),
                            },
                            scopes: {
                                type: 'array',
                                title: nls.localize('theia/ai/mcp/servers/oauth/scopes/title', '作用域'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/oauth/scopes/mdDescription',
                                    '在服务器未通告作用域时请求的可选 OAuth 作用域。'),
                                items: {
                                    type: 'string'
                                }
                            },
                            authorizationServer: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/oauth/authorizationServer/title', '授权服务器'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/oauth/authorizationServer/mdDescription',
                                    '可选的授权服务器 URL 覆盖。省略时，Theia 会从 MCP 服务器发现它。'),
                            },
                            resource: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/oauth/resource/title', '资源'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/oauth/resource/mdDescription',
                                    '此 MCP 服务器的可选 RFC 8707 资源指示符覆盖。'),
                            }
                        }
                    },
                    registryMetadata: {
                        type: 'object',
                        title: nls.localize('theia/ai/mcp/servers/registryMetadata/title', '注册表元数据'),
                        markdownDescription: nls.localize('theia/ai/mcp/servers/registryMetadata/mdDescription',
                            '从 AI 注册表安装的服务器的来源元数据。由 `@theia/ai-registry` 写入；不可由用户编辑。'),
                        properties: {
                            serverId: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/registryMetadata/serverId/title', '注册表服务器 ID'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/registryMetadata/serverId/mdDescription',
                                    '标识此服务器安装自的 AI 注册表条目。由代理插件提供的服务器不包含此字段，' +
                                    '而是携带 `pluginId`。'),
                            },
                            pluginId: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/registryMetadata/pluginId/title', '代理插件 ID'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/registryMetadata/pluginId/mdDescription',
                                    '标识提供此服务器的已安装代理插件。由 `@theia/ai-registry` 写入；不可由用户编辑。'),
                            },
                            version: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/registryMetadata/version/title', '注册表版本'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/registryMetadata/version/mdDescription',
                                    '安装时记录的注册表发布版本。'),
                            },
                            configHash: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/registryMetadata/configHash/title', '注册表配置哈希'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/registryMetadata/configHash/mdDescription',
                                    '用于安装此服务器的注册表条目或提供它的代理插件的内容哈希。'),
                            },
                            installedAt: {
                                type: 'string',
                                title: nls.localize('theia/ai/mcp/servers/registryMetadata/installedAt/title', '代理插件安装时间'),
                                markdownDescription: nls.localize('theia/ai/mcp/servers/registryMetadata/installedAt/mdDescription',
                                    '提供此服务器的代理插件最后一次写入磁盘的时间。更改它会重启服务器，'
                                    + '这也是使更新生效的机制。由 `@theia/ai-registry` 写入；不可由用户编辑。'),
                            }
                        },
                        // The validator drops a block identifying nothing; requiring one here keeps
                        // the settings editor from silently accepting what it will throw away.
                        anyOf: [
                            { required: ['serverId'] },
                            { required: ['pluginId'] }
                        ]
                    }
                },
                required: []
            }
        },
        [MCP_USE_WORKSPACE_AS_ROOT_PREF]: {
            title: nls.localize('theia/ai/mcp/useWorkspaceAsRoot/title', '使用工作区作为根目录'),
            markdownDescription: nls.localize('theia/ai/mcp/useWorkspaceAsRoot/mdDescription',
                '根目录定义了服务器在文件系统中可以操作的范围边界。\
启用后，工作区文件夹将被用作根目录；否则 MCP 服务器将可以访问整个文件系统。\
更改此设置将重启所有正在运行的 MCP 服务器以应用新的根目录配置。'),
            type: 'boolean',
            default: true
        }
    }
};
