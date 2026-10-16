<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - EXTERNAL API 扩展</h2>

<hr />

</div>

## 描述

本包提供旨在供外部工具（控制平面、
仪表板、CLI、抓取器）消费的 HTTP API，既可以运行在专用 HTTP 服务器上，也可以运行在 Theia 的主 HTTP 服务器上。

将外部 API 托管在独立的端口上，可以让它们不受主服务器面向前端的防护措施的影响：
在 Electron 部署中，主端口由 Electron 安全令牌封闭（外部进程无法访问其上的端点），
而在浏览器部署中主端口是开放的。专用的外部 API 服务器在两种
平台上的行为完全一致，并拥有自己的、由首选项显式控制的防护。

### 首选项

外部 API 通过首选项进行配置。它们配置的是后端，因此
按用户生效：它们的最大作用域是用户作用域，因此无法在
工作区设置中被覆盖。

- `externalApi.delivery`：是否以及如何提供外部 API：
  - `off`（默认）：不提供外部 API。
  - `samePort`：与后端在同一端口上提供。注意，在 Electron 部署中
    主端口需要 Electron 安全令牌，因此在此模式下外部进程无法访问外部 API。
  - `separatePort`：在专用端口上提供，通过 `externalApi.port` 配置。
- `externalApi.port`：外部 HTTP API 的服务端口。仅在
  `separatePort` 模式下使用。
- `externalApi.hostname`：专用服务器绑定的主机名或 IP 地址。默认为
  `localhost`；使用 `0.0.0.0` 接受远程连接。名称会按其解析结果绑定，
  因此使用另一个回环地址的客户端可能无法访问绑定到 `localhost` 的服务器；可使用
  `127.0.0.1` 或 `::1` 来固定。仅在 `separatePort` 模式下使用。
- `externalApi.token`：访问受保护的外部 API 端点所需的 Bearer 令牌
  （`Authorization: Bearer <token>`）。为空时（默认），外部 API 在无校验的情况下提供。

后端会立即应用首选项变更：服务器会启动、重启、在
交付模式之间切换或停止，无需重启应用程序。

该配置对后端整体生效。当多个前端连接时，
最后推送的配置获胜。实践中，同一个后端的各个前端共享用户
首选项并推送相同的值。配置将持续生效，直到被更改
或后端停止；推送它的前端断开连接时配置不会被撤销。

### 贡献端点

扩展通过在其后端模块中绑定 `ExternalApiContribution` 来贡献端点。贡献点声明其挂载的绝对路径（不强加任何
路径约定，但不同贡献点的路径不得相互嵌套，因为每个贡献点会响应其路径下的所有请求），并在传递给
`configure` 的 `ExternalApiRouter` 上注册其路由。在 `samePort` 模式下，路径还不得与 Theia 自身的路由嵌套，否则会遮蔽它们：

```typescript
@injectable()
export class MyExternalApi implements ExternalApiContribution {
    readonly path = '/api/my-feature';

    configure(router: ExternalApiRouter): void {
        router.get('/', () => RestResult.ok({ ok: true }));
        router.get('/items/:id', ({ params }) => {
            const item = this.service.find(params.id);
            return item ? RestResult.ok(item) : RestResult.notFound();
        });
        router.post('/items', { bodySchema: CreateItemRequest.SCHEMA }, async ({ body }) =>
            RestResult.created(await this.service.create(body)));
    }
}

bind(MyExternalApi).toSelf().inSingletonScope();
bind(ExternalApiContribution).toService(MyExternalApi);
```

带类型的路由负责处理端点的常见机制，使外部 API 的所有贡献保持一致的行为：

- 请求体按 JSON 解析并针对路由选项中声明的 JSON Schema 进行校验，失败时不会调用处理器：schema 违规将以
  `400 { "error": "invalid request", "details": [...] }` 拒绝并附带校验消息，
  JSON 格式错误返回 `400 { "error": "invalid request" }`，超过大小限制（默认 `1mb`，可通过每个路由的 `jsonLimit` 配置）的请求体返回
  `413 { "error": "payload too large" }`。与稳定的 `error` 代码不同，`details` 是
  人类可读的，不提供稳定性承诺。客户端必须通过
  `Content-Type: application/json` 请求头发送请求体；否则请求体不会被解析，请求将
  像空请求一样被拒绝。
- 处理器返回一个 `RestResult`（`RestResult.ok`、`created`、`accepted`、`noContent`、
  `badRequest`、`notFound`、`conflict` 等），它会被写入响应，从而使
  成功和错误响应共享同一种线上格式（错误形如 `{ "error": "<code>" }`）。
- 处理器抛出的错误会被记录，并以 `500 { "error": "internal error" }` 应答。
- 对没有路由匹配的路径的请求将以 `404 { "error": "not found" }` 应答，
  而不是 HTML 错误页面。

服务器发送事件（SSE）流通过 `eventStream` 提供，它管理连接的
客户端、保活注释和合并的广播：

```typescript
configure(router: ExternalApiRouter): void {
    const stream = router.eventStream('/events', {
        event: 'items',
        snapshot: () => this.service.getItems()
    });
    router.toDispose.push(this.service.onDidChangeItems(() => stream.notifyChanged()));
}
```

每当路由被重建时都会调用 `configure`，即外部 API 配置发生变化时。上一次构建的路由会先被销毁：事件
流被自动关闭，客户端会根据新配置重新连接，而贡献点将其自己的构建作用域资源（例如上面的事件监听器）
注册到路由的 `toDispose` 集合中。

对于带类型路由未覆盖的场景，`router.raw` 暴露挂载在贡献点路径下（位于令牌校验之后）的底层 express
路由器：现有的 express 路由器和中间件可以原样挂载在那里，保留它们自己的请求处理
和响应格式。它们未自行处理的错误仍会被归约为统一的
错误格式：服务器错误以 `500 { "error": "internal error" }` 应答，客户端
错误保留其状态码并以 HTTP 状态文本作为错误码，但普通的
`400` 除外——它保留既定的 `invalid request` 错误码。

线上格式由 `ExternalApiResponseWriter` 编写；重新绑定它会一致地改变所有带类型路由、校验失败、令牌校验以及兜底错误处理的格式。

### 文档与 OpenAPI

外部 API 是自我描述的：所有贡献点的带类型路由和事件流
都会被记录，并以 OpenAPI 3.1 文档的形式在 `GET /api/openapi.json` 提供。该端点
在提供时不做令牌校验，但会根据请求者限定文档范围：配置了令牌时，不带令牌的请求只会得到覆盖未受保护
贡献点的文档，而携带令牌的请求会得到完整文档。未编写文档的路由仅以其方法、路径和请求体 schema 出现；可选的
路由文档让该文档对外部消费者更有用，例如用于生成
客户端、文档 UI 或 MCP 工具定义：

```typescript
router.post('/items/query', {
    operationId: 'queryItems',
    summary: 'Query items by creation time range.',
    bodySchema: ItemQuery.SCHEMA,
    validate: body => body.from <= body.to ? undefined : 'from must not be after to',
    responses: {
        200: { description: 'The matching items.', schema: ITEM_LIST_SCHEMA }
    }
}, async ({ body }) => RestResult.ok(await this.service.query(body)));
```

- `bodySchema` 是一个 `RestBodySchema<B>`，即携带其所接受请求体 TypeScript 类型的 JSON Schema。schema 常量只声明一次，位于请求体接口旁边，
  它是断言 schema 与类型一致的唯一位置；该类型会流入路由的
  处理器和 `validate` 函数。
- `validate` 覆盖 JSON Schema 无法表达的约束，例如上面范围检查那样的跨字段依赖，它在通过 schema 校验的请求体上运行：对于有效的请求体它返回 `undefined`（或
  空字符串），否则返回拒绝请求时使用的消息。优先在 schema 中表达约束（例如用 `"pattern": "\\S"` 表示非空字符串），
  以便 OpenAPI 文档的消费者能看到它们。
- 贡献点的 `documentation` 将其路由归组到一个 OpenAPI 标签下；事件流通过其选项
  （`summary`、`dataSchema` 等）编写文档。
- 注册在 `router.raw` 上的路由不会被记录，也不会出现在文档中。

文档由 `OpenApiDocumentBuilder` 组装；重新绑定它可以自定义文档。配置了令牌时，完整文档会在所有受保护的操作上声明 `bearerAuth` 安全方案。

配置了令牌时，所有贡献点都受 Bearer 令牌校验保护；
校验失败的请求以 `401 { "error": "unauthorized" }` 应答。拥有自己的
认证方案（例如 OAuth）或按惯例公开的贡献点，可以通过声明 `unprotected = true` 退出保护。

### 安全注意事项

- 令牌以纯文本形式存储在用户设置中，并作为 Bearer 请求头传输。
  请用它来阻挡随意的本地进程，而不是作为网络级安全的替代品；
  远程场景建议绑定到 `localhost` 并使用终结 TLS 的反向代理。
- 没有令牌时，任何能访问所配置端口的人都可以调用所有贡献的端点；
  后端在非本地主机名上无令牌提供服务时会记录警告。
- 外部 API 面向外部工具而非浏览器页面：携带 `Origin`
  请求头的请求将以 `403 { "error": "forbidden" }` 拒绝。浏览器会在任何预检之前执行 CORS 简单
  跨域请求，否则恶意网页就可能驱动改变状态的端点，
  在 `samePort` 模式下尤其如此。外部工具不发送
  `Origin` 请求头，因此不受影响。

## 更多信息

- [`@theia/external-api` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_external-api.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
