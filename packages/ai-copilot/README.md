<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - GITHUB COPILOT 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-copilot` 扩展将 GitHub Copilot 语言模型与 Theia AI 集成。
这允许用户使用其 GitHub Copilot 订阅进行身份验证，并通过 Theia 的 AI 功能使用 Copilot 模型（例如 GPT-5、Claude Sonnet）。

> **实验性：** 该集成仍在开发中，可能不稳定。其首选项被标记为实验性，
> 可能会变更或移除。

请求由官方 GitHub Copilot CLI 通过 [`@github/copilot-sdk`](https://www.npmjs.com/package/@github/copilot-sdk) 提供服务。
该 CLI 作为后台进程在托管 Theia 后端的机器上启动，并通过 JSON-RPC 与之通信。

> **注意：** 该扩展需要有效的 GitHub Copilot 订阅和 GitHub Copilot CLI。

### 安装 Copilot CLI

CLI 不随应用程序一起分发，必须在托管后端的机器上可用：

```sh
npm install -g @github/copilot
```

它会在应用程序的安装目录、后端进程的 `PATH` 以及全局 `npm` 目录中查找。
当它安装在其他位置时，可通过 `ai-features.copilot.executablePath` 首选项指向其可执行文件：

```json
{
    "ai-features.copilot.executablePath": "/opt/copilot/copilot"
}
```

后端进程的 `COPILOT_CLI_PATH` 环境变量具有相同作用，适用于集中而非按用户配置的部署。

CLI 不被打包，因为它是一个专有许可下的大型平台特定二进制文件，而且打包后的
应用程序无法执行其自身归档内部的二进制文件。想要分发它的应用程序必须把它安装在自己旁边
并确保它保持解压状态。

只需要安装 CLI。它会在其可执行文件旁边携带 Copilot SDK，而本集成加载的正是这份拷贝，
因此不必单独安装 `@github/copilot-sdk`。如果某个 CLI 发行版没有携带该拷贝，则已安装的 `@github/copilot-sdk` 会作为回退使用：

```sh
npm install -g @github/copilot-sdk
```

### 为什么使用 Copilot CLI

对 Copilot 模型的访问权限是按 OAuth 应用程序授予的，而不是按用户或按订阅。
GitHub 未授权的应用程序只能看到一小部分旧版模型，无论订阅情况或其发送的请求头如何。
Copilot CLI 是一个获得授权的第一方应用程序，因此通过它路由可以在 Theia 无需自行获得授权的情况下使用当前的模型阵容。

### 身份验证

登录是由 Copilot CLI 执行的设备码（device code）流程，在应用程序内驱动：

1. 点击 "Copilot" 状态栏项或运行 **Copilot: Sign In** 命令
2. 出现一个显示设备码的对话框，点击链接打开 GitHub 的设备授权页面
3. 输入代码并授权
4. 对话框报告成功，状态栏反映已登录状态

完成身份验证后，Copilot 模型即可在 AI Configuration 中使用，供任何 Theia AI 智能体使用。

凭据归应用程序所有，而非 CLI：登录针对一个私有的、临时的 Copilot 主目录运行，这样
令牌不会写入机器的凭据存储，随后它被保存在 Theia 的凭据存储中。
CLI 只在其请求中获得该令牌，别的什么都没有，因此环境中的令牌或 GitHub CLI 的既有登录
永远不会被使用，而 **Copilot: Sign Out** 只移除本应用程序的凭据，两者都不受影响。

### 配置

可用模型可以通过 `ai-features.copilot.modelOverrides` 首选项进行配置。
当其为空时，模型从你的 Copilot 订阅中发现：

```json
{
    "ai-features.copilot.modelOverrides": [
        "gpt-5.5",
        "claude-sonnet-5"
    ]
}
```

### Copilot Business 与 Enterprise

Copilot Business 和 Enterprise 席位由它们自己的 API 主机提供服务，但无需为它们配置任何内容：
属于订阅的端点会从登录凭据中解析出来。

如果某个部署的解析失败，可以通过运行后端的进程的 `COPILOT_API_URL` 环境变量强制指定主机，
例如 `https://api.business.githubcopilot.com`。这是最后手段而非正常设置的一部分：与订阅不匹配的值会使每个请求都失败，
而且 GitHub 上报的方式与缺少授权相同，很难区分。

对于 GitHub Enterprise 部署，请通过 `ai-features.copilot.enterpriseUrl` 首选项配置域名。
它用于登录，并与凭据一起被记住，以便请求发往同一个部署：

```json
{
    "ai-features.copilot.enterpriseUrl": "github.mycompany.com"
}
```

### 命令

- **Copilot: Sign In** - 通过设备码流程登录
- **Copilot: Sign Out** - 移除存储的凭据

### 已知限制

- Copilot CLI 必须安装在托管后端的机器上，见上文。
- Copilot CLI 作为托管后端的机器上的一个进程运行，每个前端连接一个。
  这不适用于多用户后端部署，因为在那里所有已连接的前端会共享同一个身份。
- 该路径不支持结构化输出。
- 请求映射是有损的，因为 CLI 是一个智能体，每轮只接受单个提示词而非消息历史：
  - 对话被扁平化为一个提示词。单个用户轮次按原样转发，较长的历史则渲染为
    带角色标注的对话记录。Theia 智能体的系统提示词不属于其中，它成为会话的系统消息，
    并取代 CLI 本会使用的智能体指令。
  - 请求中的图像在经过 base64 编码时作为内联附件发送；以 URL 形式给出的图像会被丢弃，
    只记录为被省略，因为 SDK 的附件携带的是内联数据而非远程引用。
  - 历史中的工具调用和工具结果被渲染为文本，而非它们原本的结构化条目。

## 更多信息

- [`@theia/ai-copilot` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-copilot.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
