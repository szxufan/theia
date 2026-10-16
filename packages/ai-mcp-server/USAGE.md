# MCP 服务器使用示例

本文档提供使用 Theia MCP 服务器的实用示例。

## 测试 MCP 服务器

### 使用基于 WebSocket 的客户端（推荐）

测试时可使用：`npx @modelcontextprotocol/inspector`，打开应用时令牌已预填。
在应用中选择 Streamable HTTP 作为传输类型，并在 URL 字段中添加你的端点（例如 `http://localhost:3000/mcp`）。

## 可用工具

MCP 服务器目前提供以下工具：

| 工具名称 | 描述 | 参数 |
|-----------|-------------|------------|
| `test-tool` | 用于验证的简单测试工具 | 无 |

更多工具通过后端和前端贡献添加。

## 与 AI 智能体集成

MCP 服务器设计用于与遵循 Model Context Protocol 规范的 AI 智能体和工具集成。这些智能体可以使用所提供的工具与 Theia 工作区交互。

## 安全注意事项

- MCP 服务器对 Theia 的命令系统和工作区拥有完全访问权限
- 仅在受信任的环境中启用该服务器
- 在生产环境中，请考虑为 HTTP 传输使用身份验证/授权

## 调试

通过设置日志级别启用调试日志：

```bash
THEIA_LOG_LEVEL=debug theia start
```

服务器将记录 MCP 操作、会话管理和错误详情。

## 开发说明

针对 MCP 服务器进行开发时，请注意它使用：

1. 基于 HTTP 的 JSON-RPC 2.0
2. 需要特定请求头和协议处理的 Streamable HTTP 传输
3. 通过 `mcp-session-id` 请求头进行的会话管理

出于开发和测试目的，可在启用 `THEIA_LOG_LEVEL=debug` 时查看服务器日志，以了解预期的协议交互。
