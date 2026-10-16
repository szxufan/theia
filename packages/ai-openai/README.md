<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - OPEN AI 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-openai` 将 OpenAI 的模型与 Theia AI 集成。
OpenAI API 密钥和要使用的模型可以通过首选项进行配置。
或者，也可以通过 `OPENAI_API_KEY` 变量提供 OpenAI API 密钥。

### 自定义模型

该扩展还支持托管在不同端点上的 OpenAI 兼容模型（如 `vllm`、API 网关等）。
推荐在 AI 配置视图的「OpenAI（自定义）」页面中以可视化方式配置：每个端点一张卡片，填写 Base URL 与该端点自己的
API 密钥，并在端点内的「模型列表」中逐个声明模型及其能力（上下文窗口、图像输入等）。
也可以直接通过 `ai-features.openAiCustom.endpoints` 首选项配置，结构为两级：

```ts
// 端点级
{
    url: string,                        // OpenAI 兼容 API 的基础地址，通常以 /v1 结尾
    apiKey?: string,                    // 该端点自己的密钥；留空表示无需认证
    useResponseApi?: boolean,           // true 使用 Response API；默认使用 Chat Completions
    headers?: Record<string, string>,   // 随每个请求附加的额外 HTTP 头
    models: [                           // 该端点托管的模型列表
        {
            model: string,              // 调用 API 时使用的模型名称（必需）
            id?: string,                // UI 中的显示名称；默认使用模型 ID
            contextWindow?: number,     // 上下文窗口（Token），用于提示截断
            maxOutputTokens?: number,   // 最大输出 Token
            vision?: boolean,           // 是否接受图像输入；默认开启，关闭后图片被忽略
            enableStreaming?: boolean,  // 是否使用流式 API；默认开启
            supportsStructuredOutput?: boolean, // 是否支持结构化输出；默认开启
            developerMessageSettings?: 'user' | 'system' | 'developer' | 'mergeWithFollowingUserMessage' | 'skip',
            reasoningSupport?: { supportedLevels: string[], defaultLevel?: string }
        }
    ]
}
```

- `url` 与 `models` 是端点的必需属性；`models` 中每项的 `model` 为必需。
- **安全提示**：自定义端点只会使用其自身配置的 `apiKey`，绝不会发送官方 OpenAI 的全局密钥
  （「OpenAI（官方）」页或 `OPENAI_API_KEY` 环境变量中的密钥）到自定义端点。
- 同一模型 ID 出现在多个端点时，注册 ID 自动追加端点序号（如 `my-model@2`）；显式 `id` 优先。
- 旧版平铺偏好 `ai-features.openAiCustom.customOpenAiModels` 已废弃，不再迁移，需按新结构重新配置。

### Azure OpenAI

Azure OpenAI 部署可通过 `headers` 传入 Azure 所需的请求头（如 `api-key`），并按上述两级结构配置端点与模型。
若端点对系统消息角色的支持有差异，可按模型配置 `developerMessageSettings`（例如 `system` 或 `user`）。

```json
{
  "ai-features.AiEnable.enableAI": true,
  "ai-features.openAiCustom.endpoints": [
    {
      "url": "<AZURE_OPENAI_API_BASE_URL>",
      "apiKey": "<AZURE_API_KEY>",
      "headers": { "api-version": "<AZURE_OPENAI_API_VERSION>" },
      "models": [
        { "model": "gpt4o", "id": "azure-deployment", "developerMessageSettings": "system" }
      ]
    }
  ],
  "ai-features.agentSettings": {
    "Universal": {
      "languageModelRequirements": [
        {
          "purpose": "chat",
          "identifier": "azure-deployment"
        }
      ]
    },
    "Orchestrator": {
      "languageModelRequirements": [
        {
          "purpose": "agent-selection",
          "identifier": "azure-deployment"
        }
      ]
    }
  }
}
```

## 更多信息

- [`@theia/ai-openai` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-openai.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
