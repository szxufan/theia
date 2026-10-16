<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI TOOL SKETCHPAD 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-tool-sketchpad` 扩展让你可以在运行时为 LLM 工具制作原型，而无需编写或重新构建任何代码。

在设计自定义 AI 智能体时，智能体行为的大多数方面（系统提示词、LLM、技能、MCP）已经可以在运行时调整。自定义工具是剩下的缺口。该扩展通过允许你以声明式方式定义_草绘工具（sketched tools）_来填补这一缺口：名称、描述、输入参数和返回行为。工具的实现被刻意留空。

## 用法

打开 **AI Tool Sketchpad** 视图（启用 AI 功能后可用）即可创建、编辑和删除草绘工具。每个工具定义：

- 暴露给 LLM 的**名称**和**描述**。
- **参数**，包括嵌套的对象和数组参数。
- 一个**返回模式（Return Mode）**：
  - `Static Return Value`（静态返回值）始终返回一个固定字符串。
  - `Ask At Runtime`（运行时询问）在调用时打开一个快速输入，让你即时提供返回值。

草绘工具注册在 `ToolInvocationRegistry` 中，并立即可供任何 AI 智能体或聊天会话使用。定义以 YAML 形式持久化，在外部编辑时会实时重新加载。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
