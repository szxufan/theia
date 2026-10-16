<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI EXTERNAL API 扩展</h2>

<hr />

</div>

## 描述

本包在 Theia 后端上暴露一个 HTTP API，允许外部工具
（控制平面、仪表板、CLI）检查正在运行的 Theia 实例的 AI 聊天会话、以推送流的方式跟随会话变更、在
IDE 中打开或恢复会话、向会话发送提示词，以及创建新会话。

会话数据由已连接的前端实时提供：每个前端向
后端注册自身，并按需被查询。在已连接前端中已恢复（驻留内存）的
会话会连同其完整状态一起上报；尚未恢复的持久化会话则连同其持久化元数据和 `"restored": false` 一起上报。如果没有前端
连接，会话列表为空。由某个智能体委派给另一个智能体的会话
会与顶层会话一起列出，并带有 `parentSessionId` 和 `rootSessionId`，以便消费者
可以像 IDE 的会话列表那样对它们进行分组。

会话*状态*使用 `ChatModel.status`（`@theia/ai-chat`）的按会话聚合状态：
`idle`、`running`、`awaitingApproval`、`awaitingToolCall`、
`awaitingInput` 或 `failed`。未恢复的持久化会话在其最后一次请求以错误结束时报告 `failed`，否则报告 `idle`。

### 启用 API

这些端点被贡献给 `@theia/external-api` 的外部 API 服务器，该服务器
默认禁用，并通过 `externalApi.*` 用户首选项（交付
模式、端口、主机名和 Bearer 令牌）进行配置。配置及其安全注意事项请参见
`@theia/external-api` 的 README。

### API 端点

| 端点 | 用途 |
|---|---|
| `GET /api/ai/sessions` | 列出会话，最近使用的在前。 |
| `POST /api/ai/sessions` | 创建会话，可选地发送初始提示词。 |
| `GET /api/ai/sessions/events` | 以服务器发送事件的形式跟随会话列表。 |
| `GET /api/ai/sessions/:id` | 读取单个会话，包括其对话。 |
| `POST /api/ai/sessions/:id/prompt` | 向会话发送提示词。 |
| `POST /api/ai/sessions/:id/open` | 在已连接前端的聊天视图中显示该会话。 |
| `POST /api/ai/sessions/:id/restore` | 恢复会话但不聚焦它。 |

端点、其请求和响应体及其错误响应在
[API 参考](https://github.com/eclipse-theia/theia/blob/master/packages/ai-external-api/doc/api-reference.md)中有文档说明。
该 API 也是自我描述的：所有端点都连同描述和 schema 一同发布在
`GET /api/openapi.json` 提供的 OpenAPI 文档中（见 `@theia/external-api`），例如
可用于生成客户端或 MCP 工具定义。

### 安全注意事项

- 聊天历史可能包含敏感的工作区内容。请配置 `externalApi.token`
  并留意 `@theia/external-api` 的安全注意事项。
- 创建和提示词端点会触发智能体执行：它们启动语言模型
  请求，并且根据所配置的工具确认设置，还会在
  用户的 IDE 中进行工具调用。请勿在没有令牌的情况下暴露它们。
- 打开和恢复端点会影响 IDE：打开会在用户的
  前端中唤起聊天视图，创建会切换活动会话，而恢复会将持久化的会话数据
  加载到内存中。

## 更多信息

- [`@theia/ai-external-api` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-external-api.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
