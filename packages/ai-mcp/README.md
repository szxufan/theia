<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI MCP 扩展</h2>

<hr />

</div>

## 描述

AI MCP 包提供一个集成，允许用户启动和使用 MCP 服务器，为 LLM 提供额外的工具函数，例如搜索或（工作区之外的）文件访问。

### 功能特性

- 提供添加/移除、启动/停止 MCP 服务器的框架
- 在提示词模板中使用 MCP 服务器提供的工具函数

### 命令

- 引入 `@theia/ai-mcp-ui` 即可使用 MCP 服务器命令：启动、停止、登录/登出支持 OAuth 的服务器，以及 `"MCP: Get MCP OAuth Redirect URL"`。

### 配置

要配置 MCP 服务器，请引入 `@theia/mcp-ui` 或 `bind` 内置的 `mcp-preferences`。

然后打开首选项，在 `MCP Servers Configuration` 部分添加条目。每个服务器都需要一个唯一标识符（例如 `"brave-search"` 或 `"filesystem"`）以及配置细节，例如命令、参数、可选的环境变量和 autostart（默认为 true）。

`"autostart"`（默认为 true）会在每次重启 Theia 应用程序时自动启动相应的 MCP 服务器。但在当前会话中，你仍需要使用 `"MCP: Start MCP Server"` 命令**手动启动它**。

由某个前端连接管理的 MCP 服务器会在该连接断开时停止，包括本地 stdio 子进程。因此在浏览器部署中，刷新或关闭浏览器标签页会终止正在运行的服务器；带有 autostart 标记的服务器会在重新连接时再次启动，但手动启动的服务器需要通过 `"MCP: Start MCP Server"` 命令重新启动。

需要 OAuth 2.1 授权的远程 MCP 服务器可以通过 `oauth` 对象进行配置。`oauth` 对象的存在即为该服务器启用 OAuth（移除它即禁用 OAuth），并允许 Theia 在用户的浏览器中打开授权页面、在 `<theia-origin>/mcp/oauth/callback` 接收重定向、将 OAuth 令牌、动态注册的客户端信息和发现状态存储到 Theia 的凭据存储中，并通过 MCP SDK 刷新令牌。Theia 使用带 PKCE 的公共 OAuth 客户端；可选的静态 `clientId` 值存储在首选项中，当授权服务器不允许动态公共客户端注册时可以使用。

Theia 的凭据存储依赖操作系统密钥链（macOS 的 Keychain、Windows 的 Credential Manager、Linux 的 libsecret/gnome-keyring）。在没有 libsecret 可用的 Linux 上，存储会静默回退到内存提供方；此时 OAuth 令牌无法在后端重启后保留，且重启后支持 OAuth 的服务器的自动启动会被跳过。在 Linux 上安装 `libsecret`/`gnome-keyring` 可使 OAuth 凭据持久化。

配置的 `resource` 被解释为 RFC 8707 资源指示器，并使用 SDK 的 `checkResourceAllowed` 辅助函数针对 MCP 服务器 URL 进行检查。匹配器基于 origin，因此配置的 `resource` 为 `https://mcp.example.com` 时被视为覆盖对 `https://mcp.example.com/mcp` 的请求。当 `resource` 配置了但没有路径时，返回的资源 URL 是不带路径的配置值；当完全未配置 `resource` 时，返回的资源 URL 是去掉片段（fragment）的 MCP 服务器 URL（保留路径）。MCP OAuth 不提供按路径的资源作用域限定。

OAuth 凭据在系统凭据存储中按 MCP 服务器名称和服务器 URL/resource 作为键。使用相同服务器名称和 URL/resource 的工作区共享已存储的会话，重命名服务器需要以新名称重新登录。删除旧的服务器条目（或通过编辑首选项重命名，Theia 将其视为删除后重新添加）会自动清除之前的凭据；无需手动登出步骤。在多个人类用户共享同一个后端和同一个操作系统凭据存储的托管部署中，请为每个用户配置不同的服务器名称/resource，或提供隔离的凭据存储，以避免在用户之间共享 OAuth 会话。将重定向路由到进行中的授权的 OAuth 回调服务同样是进程全局的；其活动/被拒回调上限在同一后端的各前端之间共享，因此需要多用户隔离时请为每个用户部署一个后端。使用 `"MCP: Sign Out from MCP Server"` 可清除存储的 OAuth 凭据。浏览器弹出窗口拦截器可能阻止 OAuth 登录；如果授权页面没有打开，请为 Theia 来源允许弹出窗口。在 Electron 部署中，登录会在用户的系统默认浏览器中启动，而不是应用内弹窗；OAuth 回调被投递到绑定在 `http://127.0.0.1:28932/mcp/oauth/callback` 的专用回环 HTTP 服务器（RFC 8252 原生应用回环重定向），与受 cookie 保护的后端服务器相互独立。该端口默认为 `28932`，如果与主机上的其他服务冲突，可以在后端进程上设置 `THEIA_MCP_OAUTH_CALLBACK_PORT` 环境变量来覆盖。

在浏览器/托管部署中，回调 URL 在运行时计算为 `<theia-origin>/mcp/oauth/callback`；在 Electron 中则是上述固定的回环 URL `http://127.0.0.1:<port>/mcp/oauth/callback`。两种授权服务器路径对它的处理方式不同。使用**动态客户端注册**（默认情况，即未设置 `oauth.clientId`）时，Theia 会在注册请求中把回调 URL 作为 `redirect_uris` 告知授权服务器；无需单独的控制台步骤。使用**静态 `oauth.clientId`**（跳过注册的路径）时，在 OAuth 提供方开发者控制台中注册的重定向 URI 必须与回调 URL 完全一致（浏览器/托管部署中为 `<theia-origin>/mcp/oauth/callback`，Electron 中为使用所配置端口的 `http://127.0.0.1:<port>/mcp/oauth/callback`），否则授权服务器将以 `redirect_uri_mismatch` 拒绝回调。当选择 `Remote (OAuth)` 服务器类型时，添加/编辑 MCP 服务器对话框会显示当前部署的有效重定向 URL，注册静态客户端时可直接复制；`"MCP: Get MCP OAuth Redirect URL"` 命令在不打开对话框的情况下显示相同的 URL 并提供复制操作。如果 Theia 部署在反向代理之后，请确保代理将此回调路径转发到 Theia 后端，包括部署在诸如 `/theia/` 的基础路径之下的情形；如果前端暴露在某个基础路径下，代理必须剥离该前缀，或以其他方式将生成的回调 URL 路由到后端路由。当前回调 URL 是从前端 URL 计算得出的；因此浏览器部署应当将前端和后端暴露在同一个公共 origin 和路由前缀上。回调页面字符串由后端渲染并使用后端区域设置。授权 `code` 和 `state` 值会出现在回调查询字符串中，可能被浏览器历史记录或访问日志捕获；在回调仍有效期间，请避免分享这些日志。使用随机 UUID 进行的 OAuth state 校验可防止回调投毒。

配置示例：

```json
{
    "ai-features.mcp.mcpServers": {
        "memory": {
            "command": "npx",
            "args": [
              "-y",
              "@modelcontextprotocol/server-memory"
            ],
            "autostart": false
          },
          "brave-search": {
            "command": "npx",
            "args": [
              "-y",
              "@modelcontextprotocol/server-brave-search"
            ],
            "env": {
              "BRAVE_API_KEY": "YOUR_API_KEY"
            }
          },
          "filesystem": {
            "command": "npx",
            "args": [
              "-y",
              "@modelcontextprotocol/server-filesystem",
              "ABSOLUTE_PATH_TO_ALLOWED_DIRECTORY",
            ]
          },
          "git": {
            "command": "uv",
            "args": [
              "--directory",
              "/path/to/repo",
              "run",
              "mcp-server-git"
            ]
          },
          "git2": {
            "command": "uvx",
            "args": [
              "mcp-server-git",
              "--repository",
              "/path/to/otherrepo"
            ]
          },
          "remote-oauth": {
            "serverUrl": "https://mcp.example.com/mcp",
            "oauth": {
              "clientId": "OPTIONAL_STATIC_CLIENT_ID",
              "scopes": ["mcp.read", "mcp.write"],
              "authorizationServer": "https://auth.example.com",
              "resource": "https://mcp.example.com"
            }
          }
    }
}
```

提示词示例（用于搜索）

```md
~{mcp_brave-search_brave_web_search}
```

用户查询示例

```md
Search the internet for XYZ
```

### 更多信息

[Theia AI MCP UI README](https://github.com/eclipse-theia/theia/tree/master/packages/ai-mcp-ui)
[Theia IDE 中 MCP 的用户文档](https://theia-ide.org/docs/user_ai/#mcp-integration)
[可用的 MCP 服务器列表](https://github.com/modelcontextprotocol/servers)

## 更多信息

- [`@theia/mcp` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-mcp.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
