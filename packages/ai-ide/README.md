<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI IDE AGENTS 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-ide` 包整合了多种 AI 智能体（agent），供 Theia IDE 等 IDE 使用。

## 智能体

该包包含以下智能体：

- **编排者聊天智能体（Orchestrator Chat Agent）**：分析用户请求，并确定最适合处理每个请求的特定聊天智能体。它将任务无缝委派给合适的智能体，确保用户获得最相关的帮助。在未指定其他智能体时，它作为默认智能体使用。

- **通用聊天智能体（Universal Chat Agent）**：提供通用编程支持。它回答宽泛的编程相关问题，并作为一般性咨询的兜底，但不具体访问用户上下文或工作区。当默认智能体不可用时，该智能体作为首选兜底使用。

- **编码智能体（Coder Agent）**：在 Theia IDE 中协助软件开发者完成与代码相关的任务。它利用 AI 提供建议和改进，并借助一组函数与工作区交互。

- **命令聊天智能体（Command Chat Agent）**：该智能体根据用户请求帮助用户在 Theia IDE 中执行命令。它从 Theia 的命令注册表中识别正确的命令并促成其执行，为用户提供流畅的命令交互体验。

- **架构师智能体（Architect Agent）**：该智能体能够检查工作区的当前文件（包括其内容）来回答问题。

## 配置视图

该包提供一个配置视图，用于调整与 AI 智能体行为相关的设置。该视图实现于 packages/ai-ide/src/browser/ai-configuration 下的文件中，支持自定义默认参数、功能开关以及 AI IDE 的其他首选项。

## 更多信息

- [`@theia/ai-ide` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-ide.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
