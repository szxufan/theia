# OpenAI 工具调用问题排查

如果你遇到类似以下的工具调用错误：

```
400 No tool call found for function call output with <UUID>
```

## 当前解决方案（自动）

**好消息**：工具调用现在会被自动正确处理。即使启用了 Response API，系统也会自动将工具调用路由到 Chat Completions API，确保可靠的功能，无需任何用户干预。

## 发生了什么

OpenAI Response API 在工具调用方面存在根本性的兼容问题，导致无法可靠地进行函数调用。该 API 具有不同的消息格式、工具调用语义和状态管理要求。

## 自动路由

自最新版本起：
- ✅ **工具调用**：自动使用 Chat Completions API（可靠）
- ✅ **文本生成**：使用所配置的 API（Response 或 Chat Completions）
- ✅ **无需用户操作**：一切无缝运行

## 调试信息

要验证自动路由是否正常工作：
1. 打开浏览器开发者工具（F12）
2. 查找控制台消息：
   - `Model <id>: Request contains tools, falling back to Chat Completions API`
   - 这确认工具调用被正确路由

## Response API 设置

### 官方 OpenAI 模型
1. 打开 Theia 首选项（文件 > 首选项 > 打开首选项）
2. 搜索 "useResponseApi"
3. 按需切换 "Use Response API"
4. **注意**：无论此设置如何，工具调用始终使用 Chat Completions API

### 自定义 OpenAI 兼容端点
在你的模型配置中设置 `useResponseApi: true/false`。无论如何，工具调用都会自动使用 Chat Completions API。

## API 状态

- **Chat Completion API**：✅ 对工具调用完全稳定
- **Response API**：✅ 对文本生成稳定，工具调用会被自动绕过

## 角色支持问题

### 错误消息
```
OpenAI API error: 400 - Invalid request: messages[X]: role 'developer' is not supported
```

### 描述
某些 OpenAI 模型（尤其是 o1-preview 和 o1-mini）不支持消息中的 'developer' 角色。

### 解决方案
对于已知模型，这会自动处理。对于使用不支持模型的自定义端点：

1. 在自定义模型配置中将 `developerMessageSettings` 设置为 `'user'` 或 `'system'`：

```json
{
  "model": "o1-mini",
  "url": "https://api.openai.com/v1",
  "developerMessageSettings": "user"
}
```

2. 或者，使用 `'mergeWithFollowingUserMessage'` 将系统消息与用户消息合并。

## 连接与身份验证问题

### 缺少 API 密钥
```
Error: Please provide OPENAI_API_KEY in preferences or via environment variable
```

**解决方案：**
1. 设置环境变量：`export OPENAI_API_KEY=your_key_here`
2. 或在首选项中设置：AI Features > OpenAI Official > API Key

### 自定义端点问题
对于自定义 OpenAI 兼容端点，请确保：
- URL 正确且可访问
- API 密钥有效（如果需要）
- 模型名称与端点上可用的模型匹配

## 报告问题

如果你在自动工具调用路由方面遇到问题，请报告：
- 确切的错误消息
- 控制台调试消息（如有）
- 模型配置
- 复现步骤

## 未来计划

一旦 OpenAI 解决了底层的兼容性问题，Response API 将用于工具调用。当前的自动路由方法确保用户无需手动干预即可获得可用的工具调用。
