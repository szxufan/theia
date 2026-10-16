# Theia AI External API：会话 API

用于检查、跟随、打开、提示和创建正在运行的 Theia 实例的 AI 聊天会话的 HTTP API。由 `@theia/ai-external-api` 贡献给 `@theia/external-api` 的外部 API 服务器。

**可用性：** 默认禁用。通过 `externalApi.delivery` 首选项启用，取值 `samePort`（在 Theia 主端口上提供）或 `separatePort`（在 `externalApi.port` 上提供）。如果配置了 `externalApi.token`，则每个请求都必须发送 `Authorization: Bearer <token>`。

**请求：** 带请求体的端点期望随 `Content-Type: application/json` 请求头一起发送的 JSON。没有该请求头时，请求体不会被解析，请求将像空请求一样被拒绝。携带 `Origin` 请求头的请求会以 `403` 拒绝，因为该 API 面向外部工具而非浏览器页面。

**机器可读描述：** 所有端点也连同描述和 schema 一同发布在 `GET /api/openapi.json` 提供的 OpenAPI 3.1 文档中。配置了令牌时，文档中这些（受保护的）端点仅对携带令牌的请求列出。

**作用域：** 当前在已连接前端中*已恢复*（驻留内存）的会话会连同其完整状态一起上报。尚未恢复的持久化会话则连同其持久化元数据和 `"restored": false` 一起上报；它们可以按需恢复。没有前端连接时，列表为空。被多个前端知晓的会话会被去重（优先恢复的，其次进行中的，再次是更近的上报）。

## `GET /api/ai/sessions`

列出所有会话，按 `lastInteraction` 排序，最近的在前。

```json
{
  "sessions": [
    {
      "id": "d3f1a2b4-…",
      "title": "Fix failing tests",
      "status": "awaitingApproval",
      "lastInteraction": 1751880000000,
      "workspace": "file:///home/user/project",
      "preview": "Tool call: runTests({})\nAll tests pass now.",
      "agentId": "Coder",
      "agentName": "Coder",
      "restored": true
    }
  ]
}
```

会话摘要字段：

| 字段 | 类型 | 取值 / 含义 |
|---|---|---|
| `id` | string | 唯一的会话 ID（UUID）。 |
| `title` | string，可选 | 会话标题（由用户设置或自动生成）。否则不存在。 |
| `status` | string | 由会话最后一次请求导出的聚合状态。取值之一：`idle`（没有进行中的请求；最后一次成功或被取消）、`running`（请求进行中）、`awaitingApproval`（某个工具调用需要用户确认）、`awaitingToolCall`（某个已批准/无需确认的工具调用正在执行）、`awaitingInput`（智能体等待用户输入，例如对某个问题的回答）、`failed`（最后一次请求以错误结束）。`awaitingApproval` 和 `awaitingInput` 表示会话正阻塞在用户身上。未恢复的会话在其最后一次请求以错误结束时报告 `failed`，否则报告 `idle`。 |
| `lastInteraction` | number，可选 | 最后一次用户交互的时间戳，自纪元起的毫秒数。对于未恢复的会话，是会话最后一次保存的时间。 |
| `workspace` | string，可选 | 会话所属工作区的 URI（该会话所在前端的工作区文件夹或 `.theia-workspace` 文件），例如 `file:///home/user/project`。当该前端没有打开的工作区时不存在；对于未恢复的会话，当会话被全局持久化时（`ai-features.chat.sessionStorageScope` 设为 `global`）也不存在，因为全局会话存储保存的是来自任意工作区的会话。 |
| `preview` | string，可选 | 对话的最后几行（纯文本，目前最多 5 个非空行，以换行分隔，超过 200 字符的行以 `…` 截断）。对话为空以及会话未恢复时不存在。 |
| `agentId` | string，可选 | 驱动该会话的智能体的 ID。没有固定到会话的智能体时不存在。 |
| `agentName` | string，可选 | 驱动该会话的智能体的人类可读名称。没有固定智能体或智能体未注册时不存在。 |
| `parentSessionId` | string，可选 | 委派本会话的会话的 ID，即智能体派生本会话所自的会话。顶层会话不存在此字段。被委派的会话与顶层会话一起列出；使用此字段对它们进行分组，就像 IDE 的会话列表那样。 |
| `rootSessionId` | string，可选 | 委派链最顶层会话的 ID。顶层会话不存在此字段。 |
| `restored` | boolean | 会话是否已在某个已连接前端中恢复（实时）。未恢复的会话仅上报持久化元数据。 |

## `POST /api/ai/sessions`

在已连接的前端中创建一个新的聊天会话，并可选地发送初始提示词。创建的会话成为其前端的活动会话（外部创建的会话被预期是用户想要处理的那个）；`focus: true` 还会唤起聊天视图。

请求体：

| 字段 | 类型 | 含义 |
|---|---|---|
| `workspace` | string，可选 | 会话将在打开此工作区的前端中创建。当所有已连接的前端共享同一个工作区时可以省略；否则会有歧义。匹配时忽略末尾的斜杠。 |
| `agentId` | string，可选 | 要固定到会话的智能体。未提供时，提示词由默认智能体处理。 |
| `prompt` | string，可选 | 创建后立即发送的初始提示词（可以包含 `@agent` 提及和变量引用）。 |
| `focus` | boolean，可选 | 在 IDE 中唤起聊天视图。 |

返回 `201 Created`：

```json
{
  "session": { "id": "d3f1a2b4-…", "title": "Fix the failing tests", "status": "running", "restored": true, "agentId": "Coder", "…": "…" },
  "requestId": "a81c…"
}
```

`session` 是一个会话摘要（见列表端点）；`requestId` 标识为初始提示词创建的请求，没有初始提示词时不存在。失败情况：`400 { "error": "unknown agent" }`、`400 { "error": "invalid request" }`、`404 { "error": "workspace not found" }`（没有匹配的已连接前端）、`409 { "error": "ambiguous workspace" }`（未提供工作区，且连接了多个不同的工作区）、`409 { "error": "no agent available" }`（初始提示词无法被处理，因为没有可用的智能体——无论是被提及的、固定的还是默认的；此时不会保留该会话）、`503 { "error": "no frontend connected" }`（没有前端连接或没有前端响应）。

## `POST /api/ai/sessions/:id/prompt`

向会话发送提示词，必要时先恢复它。提示词的处理方式与在聊天视图中输入的一样：`@agent` 提及会选择（并重新固定）智能体，工具调用在所配置的确认设置下运行。

请求体：

| 字段 | 类型 | 含义 |
|---|---|---|
| `text` | string | 提示词文本。必须非空。 |
| `interrupt` | boolean，可选 | 在发送之前取消进行中的请求（包括待处理的工具调用）。未设置时，向繁忙会话发送提示词会被拒绝。 |

返回 `202 Accepted`，表示请求已提交（而非已完成）；通过事件流或读取端点跟随进度：

```json
{ "sessionId": "d3f1a2b4-…", "requestId": "a81c…" }
```

失败情况：`400 { "error": "invalid request" }`、`404 { "error": "not found" }`（所有已连接前端都不认识该会话）、`409 { "error": "busy" }`（有请求正在进行，即状态为 `running`、`awaitingApproval`、`awaitingToolCall` 或 `awaitingInput`，且未设置 `interrupt`）、`409 { "error": "no agent available" }`。

## `GET /api/ai/sessions/events`

以[服务器发送事件](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)的形式流式传输会话列表。连接时，流会立即投递当前列表；此后，每当会话发生变化（创建、删除、重命名或状态变更）都会推送一份更新后的列表。变化的突发会被合并（目前后端约 100 毫秒内加上每个前端约 200 毫秒），并且每 30 秒发送一次注释行（`: keep-alive`）以保持连接。

```text
event: sessions
data: {"sessions":[…]}
```

每个 `sessions` 事件都以与 `GET /api/ai/sessions` 相同的格式携带完整的当前会话列表。请将其作为整体替换来消费，而非增量。

当外部 API 配置发生变化（交付模式、主机名、端口或令牌）时，打开的流会被服务器关闭；请针对新配置重新连接。浏览器的 `EventSource` API 无法发送 `Authorization` 请求头，因此配置了令牌时，请使用带流式请求体的 `fetch` 或某个 SSE 客户端库。

## `GET /api/ai/sessions/:id`

返回单个会话：包含上述所有摘要字段以及 `messages`——该会话的对话被归约为纯文本。对于未恢复的持久化会话，仅返回摘要字段（无 `messages`）；请恢复该会话以读取其对话。

```json
{
  "id": "d3f1a2b4-…",
  "title": "Fix failing tests",
  "status": "idle",
  "lastInteraction": 1751880000000,
  "workspace": "file:///home/user/project",
  "preview": "Tool call: runTests({})\nAll tests pass now.",
  "agentId": "Coder",
  "agentName": "Coder",
  "restored": true,
  "messages": [
    { "actor": "user", "text": "Fix the failing tests" },
    { "actor": "ai", "text": "Tool call: runTests({})\n\nAll tests pass now." }
  ]
}
```

`messages` 字段（每个对话轮次一条，最旧的在前）：

| 字段 | 类型 | 取值 / 含义 |
|---|---|---|
| `actor` | string | 条目的作者：`user` 或 `ai`。 |
| `text` | string | 条目的纯文本渲染。用户条目包含用户输入的文本（包括 `#file` 之类的变量引用）。AI 条目包含渲染为文本的完整响应：markdown/代码按原样呈现，工具调用形如 `Tool call: name(arguments)`，推理形如 `<Thinking>…</Thinking>`，错误显示其消息；各部分之间用空行分隔。 |

对话遵循会话当前活动的分支（不包含被编辑/重新生成的备选分支），即 Theia 在下一次请求时将发送给语言模型的同一份历史。进行中的响应会连同其至今的内容一起包含。内部细节（内容 ID、请求分支、序列化元数据、令牌用量）不会暴露。

## `POST /api/ai/sessions/:id/open`

在已连接前端的聊天视图中显示该会话，必要时先恢复它。当多个前端知晓该会话时，选择已恢复（优先进行中）会话的那个前端。成功时返回 `204 No Content`。

## `POST /api/ai/sessions/:id/restore`

在已连接的前端中恢复会话但不聚焦它，并返回会话详情（包括 `messages`）。恢复一个已经恢复的会话是空操作，并返回其详情。恢复之后，该会话会以 `"restored": true` 上报，并出现在事件流中。

## 错误

| 状态码 | 响应体 | 含义 |
|---|---|---|
| 400 | `{ "error": "invalid request" }` | JSON 格式错误、未带 `Content-Type: application/json` 请求头发送的请求体，或请求体字段无效/缺失。 |
| 400 | `{ "error": "unknown agent" }` | 请求的 `agentId` 未注册。 |
| 401 | `{ "error": "unauthorized" }` | 缺少/无效的 Bearer 令牌（配置了令牌时）。 |
| 403 | `{ "error": "forbidden" }` | 请求携带了 `Origin` 请求头——浏览器页面会发送而外部工具不会。 |
| 404 | `{ "error": "not found" }` | 所有已连接前端都不认识该会话 ID。 |
| 404 | `{ "error": "workspace not found" }` | 没有已连接的前端匹配所请求的工作区。 |
| 409 | `{ "error": "busy" }` | 有请求正在进行且未设置 `interrupt`。 |
| 409 | `{ "error": "ambiguous workspace" }` | 未提供工作区且连接了多个不同的工作区。 |
| 409 | `{ "error": "no agent available" }` | 没有找到可用于处理该提示词的智能体。 |
| 413 | `{ "error": "payload too large" }` | 请求体超过大小限制（1 MB）。 |
| 500 | `{ "error": "internal error" }` | 收集会话数据或执行操作失败。 |
| 503 | `{ "error": "no frontend connected" }` | 没有前端连接（或没有前端响应），无法在其中创建会话。 |

`error` 代码是稳定的且机器可读。请求体校验失败还会在人类可读的 `details` 数组中附带校验消息（例如 `{ "error": "invalid request", "details": ["should have required property 'text'"] }`），该数组不提供稳定性承诺。
