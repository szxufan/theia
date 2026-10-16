<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI MCP UI 扩展</h2>

<hr />

</div>

## 描述

Model Context Server（MCP）UI 集成包为用户启动和使用 MCP 服务器提供 UI

### 功能特性

- 启动和停止 MCP 服务器。
- 提供首选项 schema，支持首选项中的自动补全等功能

### 命令

#### 启动 MCP 服务器

- **命令 ID：** `mcp.startserver`
- **标签：** `MCP: Start MCP Server`
- **功能：** 允许你从已配置服务器的列表中选择并启动一个 MCP 服务器。

#### 停止 MCP 服务器

- **命令 ID：** `mcp.stopserver`
- **标签：** `MCP: Stop MCP Server`
- **功能：** 允许你从当前正在运行的服务器列表中选择并停止一个 MCP 服务器。

### 用法

1. **启动 MCP 服务器：**
    - 使用命令面板调用 `MCP: Start MCP Server`。
    - 会出现一个快速选择菜单，列出已配置的 MCP 服务器。
    - 选择要启动的服务器。

2. **停止 MCP 服务器：**
    - 使用命令面板调用 `MCP: Stop MCP Server`。
    - 快速选择菜单会显示当前正在运行的 MCP 服务器列表。
    - 选择要停止的服务器。

3. **使用提供的工具函数**
    - 只有已启动的 MCP 服务器的函数才能被使用
    - 打开一个提示词模板并添加所需的工具函数
    - 输入 '~{' 打开自动补全

### 配置

要配置 MCP 服务器，请打开首选项并在 `MCP Servers Configuration` 部分添加条目。
更多信息请参见 Theia MCP 包（`@theia/ai-mcp`）的 README。

### 更多信息

[Theia AI MCP README](https://github.com/eclipse-theia/theia/tree/master/packages/ai-mcp)
[Theia IDE 中 MCP 的用户文档](https://theia-ide.org/docs/user_ai/#mcp-integration)
[可用的 MCP 服务器列表](https://github.com/modelcontextprotocol/servers)

## 更多信息

- [`@theia/mcp-ui` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-mcp-ui.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
