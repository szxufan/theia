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

该扩展还支持托管在不同端点上的 OpenAI 兼容模型。
推荐在 AI 配置视图的「OpenAI（自定义）」页面中以可视化方式添加和编辑端点（每个端点一张卡片，
逐字段填写）；也可以直接通过 `ai-features.openAiCustom.customOpenAiModels` 首选项配置：

```ts
{
    model: string,
    url: string,
    id?: string,
    apiKey?: string | true,
    apiVersion?: string | true,
    developerMessageSettings?: 'user' | 'system' | 'developer' | 'mergeWithFollowingUserMessage' | 'skip',
    enableStreaming?: boolean
}
```

- `model` 和 `url` 是必需属性，指示要使用的端点和模型
- `id` 是可选属性，在 UI 中用于引用此配置
- `apiKey` 是访问给定 URL 所提供 API 的密钥，或为 `true` 以使用全局 OpenAI API 密钥。如果未提供，将使用 'no-key'。`apiKey` 将作为 Bearer Token 在授权请求中发送。
- `apiVersion` 是在 Azure 中访问给定 URL 所提供 API 的 API 版本，或为 `true` 以使用全局 OpenAI API 版本。
- `developerMessageSettings` 控制系统消息的处理方式：`user`、`system` 和 `developer` 将被用作角色，`mergeWithFollowingUserMessage` 会将系统消息作为后续用户消息的前缀，或者在接下来的消息不是用户消息时将系统消息转换为用户消息。`skip` 则直接移除系统消息。
  默认为 `developer`。
- `enableStreaming` 是一个标志，指示是否应使用流式 API。默认为 `true`。

### Azure OpenAI

要使用托管在 Azure 上的自定义 OpenAI 模型，需要使用 `AzureOpenAI` 类，如
[openai-node 文档](https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai)所述。

对托管在 Azure 上的 OpenAI 模型的请求需要 `apiVersion`。因此，要在 Theia 中配置自定义 OpenAI 模型，你需要为端点配置 `apiVersion`。
注意，如果不配置 `apiVersion`，将使用默认的 `OpenAI` 对象进行初始化，与 Azure 托管的 OpenAI 模型的连接将会失败。

部署在 Azure 上的 OpenAI 模型版本可能不支持 `developer` 角色。在这种情况下，可以通过
`developerMessageSettings` 选项配置是否支持 `developer` 角色，例如将其设置为 `system` 或 `user`。

以下代码片段展示了访问托管在 Azure 上的 OpenAI 模型的可能配置。`AZURE_OPENAI_API_BASE_URL` 需要不含 `/chat/completions`
路径，也不含 `api-version` 参数，例如 _`https://<my_prefix>.openai.azure.com/openai/deployments/<my_deployment>`_

```json
{
  "ai-features.AiEnable.enableAI": true,
  "ai-features.openAiCustom.customOpenAiModels": [
    {
      "model": "gpt4o",
      "url": "<AZURE_OPENAI_API_BASE_URL>",
      "id": "azure-deployment",
      "apiKey": "<AZURE_OPENAI_API_KEY>",
      "apiVersion": "<AZURE_OPENAI_API_VERSION>",
      "developerMessageSettings": "system"
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
