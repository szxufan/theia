<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - CHATGPT 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-chatgpt` 扩展通过你的 ChatGPT 订阅（而非 OpenAI API 密钥）来提供 OpenAI 模型。
这些模型在模型选择器中以 `chatgpt/<model>` 形式出现，并与 `@theia/ai-openai` 贡献的基于 API 密钥的 `openai/<model>` 模型共存。

默认情况下，登录后会从端点查询你的 ChatGPT 套餐所授权的模型。设置 `ai-features.chatGpt.modelOverrides`
首选项可改为提供固定的模型列表。当身份验证后的发现失败时（例如无法访问端点），会提供一个内置列表。没有凭据时发现不会返回任何模型。

### 登录

点击 ChatGPT 状态栏项或运行命令 _ChatGPT: Sign in_。它会在你的浏览器中打开 OpenAI 授权页面。
浏览器将授权码返回给 `http://localhost:1455/auth/callback` 上的监听器，该监听器由 Theia 后端提供。如果后端与你的浏览器不在同一台机器上运行，
或者端口已被占用，你也可以将授权码（或完整的重定向 URL）粘贴到 Theia 提供的输入框中。凭据存储在操作系统的凭据存储中，可通过 _ChatGPT: Sign out_ 命令移除。

模型只在登录期间注册。状态栏显示已登录的帐户并提供登出操作。
将 `ai-features.chatGpt.enabled` 设置为 `false` 可禁用该提供方、移除其模型并隐藏其状态栏项；已配置的模型列表会被保留。

### 后端应用程序配置

默认 OAuth 客户端 ID `app_EMoamEEZ73f0CkXaXp7hrann` 属于 OpenAI 的 Codex CLI；它不是 Theia 注册的客户端。
采用者必须评估使用此客户端和订阅端点是否适合自己的应用程序。
他们可以重新绑定以下配置，以使用自己注册的 OAuth 客户端和匹配的回调配置。

应用程序作者可以在本扩展之后加载的后端模块中重新绑定来自 `@theia/ai-chatgpt/lib/node/chatgpt-auth-service` 的 `ChatGptAuthServiceConfig`。
这些是后端 DI 值，而非前端首选项。所有字段都是必需的；展开
`DEFAULT_CHATGPT_AUTH_SERVICE_CONFIG` 以仅覆盖选定的值：

```typescript
import { ContainerModule } from '@theia/core/shared/inversify';
import { ChatGptAuthServiceConfig, DEFAULT_CHATGPT_AUTH_SERVICE_CONFIG } from '@theia/ai-chatgpt/lib/node/chatgpt-auth-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(ChatGptAuthServiceConfig).toConstantValue({
        ...DEFAULT_CHATGPT_AUTH_SERVICE_CONFIG,
        clientId: 'your-registered-client-id',
        keyStoreService: 'your-application-chatgpt'
    });
});
```

| 字段 | 默认值 |
| --- | --- |
| `clientId` | `app_EMoamEEZ73f0CkXaXp7hrann` |
| `callbackHost` | `localhost` |
| `callbackPort` | `1455` |
| `callbackPath` | `/auth/callback` |
| `keyStoreService` | `theia-chatgpt` |
| `keyStoreAccount` | `default` |

重定向 URI 推导为 `http://<callbackHost>:<callbackPort><callbackPath>`，并一致地用于授权、
授权码交换和回环监听器。请提供主机名或不含方括号的 IP 地址、固定端口和绝对回调路径。
客户端和重定向 URI 必须与某个 OpenAI OAuth 注册相匹配；更改本地值不会注册新的回调。
更改密钥存储标识符会选择不同的凭据条目，并且不会迁移现有凭据。

后端消费者使用同一模块中的 `ChatGptBackendAuthService` 接口符号，应用程序作者可以重新绑定
它以提供自定义的身份验证实现。前端 RPC 服务仍然是一个窄门面：它从不暴露凭据或后端客户端注册。

### 服务端压缩

ChatGPT 模型通过 Responses API 的 `context_management` 指令请求自动的服务端压缩。
`ai-features.chatGpt.serverSideCompaction` 默认为 `default`，继承全局聊天压缩设置；`enabled`
和 `disabled` 可以覆盖它。可选的 `ai-features.chatGpt.serverSideCompactionTokenThreshold` 覆盖全局的
输入令牌阈值。两者都未设置时，由提供方选择阈值。会话压缩设置的优先级更高。
响应保持不存储和流式传输；流中返回的加密压缩状态会在后续的 ChatGPT 请求中回放。
ChatGPT 使用 `chatgpt-responses` 压缩标记，与 OpenAI 的 `openai-responses` 标记不同。在这两个提供方之间切换时，
外来的压缩标记会被忽略，且之前的对话历史会被保留。

### 限制

该集成是实验性的，依赖一个未公开文档的端点。没有稳定性保证：OpenAI 可能不经通知就更改或
移除端点访问、身份验证要求或受支持的功能，导致该集成停止工作。
采用者在将其包含到自己的应用程序之前，应评估这些风险以及该集成的适用性。

请求由 ChatGPT 端点 `https://chatgpt.com/backend-api/codex` 提供服务。该端点只支持流式的 Response API，
不保留响应，且只提供你的 ChatGPT 套餐中包含的模型，因此手动配置的模型必须对你的套餐可用。

## 更多信息

- [`@theia/ai-chatgpt` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-chatgpt.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
