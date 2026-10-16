<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - SECONDARY WINDOW 扩展</h2>

<hr />

</div>

## 描述

`@theia/secondary-window` 扩展提供了提取命令和工具栏项，用于将可提取的组件移动到次级窗口。

要将某个组件标记为可提取，请实现 `@theia/core` 中的 `ExtractableWidget` 接口。

### 限制

要使提取功能正常工作，需要在上游库中做一些修改。
Theia 提供了 `theia-patch` CLI 命令来应用这些补丁。

建议：在根 npm 包的 `postinstall` 脚本中执行 `theia-patch`，以自动应用这些补丁。

如果未应用这些补丁，次级窗口将显示为空白。

## 更多信息

- [`@theia/secondary-window` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_secondary-window.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
