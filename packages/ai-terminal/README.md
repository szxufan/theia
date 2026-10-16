<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI TERMINAL 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-terminal` 扩展为终端视图提供一个浮层。\
该浮层可用于向专用的 `TerminalAgent` 询问终端命令的建议。

它还提供 `shellExecute` 工具，允许 AI 智能体在宿主系统上运行命令。

## Shell 执行工具

`shellExecute` 工具使 AI 智能体能够在获得用户确认的情况下，在宿主系统上执行 shell 命令。

### 安全性

默认情况下，每条命令都需要用户明确批准。该工具标记了 `confirmAlwaysAllow`，当用户尝试启用自动批准时会显示额外的警告对话框。

> **警告**：该工具拥有完整的系统访问权限。请仅在隔离环境（容器、虚拟机）中启用自动批准。

### 功能特性

- 执行任意 shell 命令（Linux/macOS 上的 bash，Windows 上的 cmd/PowerShell）
- 可配置的工作目录和超时（默认 2 分钟，最长 10 分钟）
- 针对大输出量的输出截断（首尾各 50 行）
- 支持取消

## 更多信息

- [`@theia/ai-terminal` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai_terminal.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
