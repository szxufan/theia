<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - OPENAI CODEX 集成</h2>

<hr />

</div>

## 描述

`@theia/ai-codex` 将 OpenAI 的 Codex 智能体集成到 Theia 平台中，通过聊天界面提供自然语言编程辅助。

## 功能特性

- 通过 OpenAI Codex SDK 提供自然语言编程辅助
- 基于线程（thread）的对话管理
- 支持实时更新的流式响应
- 令牌用量跟踪和成本监控
- 结构化输出支持（JSON Schema、Zod）
- 与 Theia 的 AI 聊天基础设施集成

## 前提条件

- Node.js 18 或更高版本
- OpenAI API 密钥（通过 Theia 首选项配置）

## 配置

### API 密钥

Codex 需要 OpenAI API 密钥。你可以通过多种方式配置它（按优先级排序）：

1. **Codex 专用密钥**（最高优先级）：
   - 首选项：`ai-features.codex.apiKey`
   - 如果你想为 Codex 使用单独的 API 密钥，请使用此项

2. **共享 OpenAI 密钥**（回退）：
   - 首选项：`ai-features.openAiOfficial.openAiApiKey`
   - 与 Theia 中的其他 OpenAI 集成共享

3. **环境变量**（最终回退）：

   ```bash
   export OPENAI_API_KEY=your-api-key-here
   ```

### 示例

如果你已经在 Theia 中使用 OpenAI 功能，Codex 会自动使用该 API 密钥。无需额外配置！

## 更多信息

- [`@theia/ai-codex` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-codex.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)
- [OpenAI Codex SDK](https://github.com/openai/codex)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
