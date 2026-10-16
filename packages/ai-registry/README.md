<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI REGISTRY 扩展</h2>

<hr />

</div>

## 描述

AI Registry 包将 Theia 与远程 AI 制品注册表（例如 `ai-registry-core`）集成。用户可以浏览经过批准的 MCP 服务器，并通过单一操作进行安装。

### 功能特性

- 将注册表批准的 MCP 服务器与 Open VSX 扩展一起贡献到扩展（Extensions）视图中。
- 检测服务器是从注册表安装的、以匹配的键手动安装的，还是已偏离注册表配置——并相应地呈现安装 / 链接 / 更新 / 修复配置 / 卸载操作。
- 通过将注册表发布的配置片段写入现有的 `ai-features.mcp.mcpServers` 首选项来安装服务器。

### 产品配置

Theia 产品可以在其前端模块中重新绑定 `AIRegistryConfiguration`，以覆盖默认的工具名称（`all`）和注册表基础 URL。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
