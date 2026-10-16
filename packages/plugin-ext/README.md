<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - PLUGIN-EXT 扩展</h2>

<hr />

</div>

## 描述

`@theia/plugin-ext` 扩展为 `plugin` API 提供功能实现。

## 实现

实现灵感来自：<https://blog.mattbierner.com/vscode-webview-web-learnings/>。

## 环境变量

- `THEIA_WEBVIEW_EXTERNAL_ENDPOINT`

  一个字符串模式，可能包含将被替换的 `{{uuid}}` 和 `{{hostname}}`。这是 `webviews` 将被托管的主机。
  将 `webview` 处理器托管在子域名上是一种良好的做法，因为这样更安全。
  默认值为 `{{uuid}}.webview.{{hostname}}`。

## 安全警告

- 潜在不安全的主机模式

  当你通过 `THEIA_WEBVIEW_EXTERNAL_ENDPOINT` 环境变量更改主机模式时，前端和后端都会发出警告。
  你可以在应用程序 `package.json` 的相应应用程序配置中设置 `warnOnPotentiallyInsecureHostPattern: false` 来禁用这些警告。

## 本包中的命名

本包的文件夹结构与其他 Theia 包不同。"hosted" 文件夹中的内容以单个前端为作用域，而 "main" 对后端实例是全局的。"plugin" 中的代码运行在插件宿主进程内。但请注意，情况并不总是如此，例如插件清单扫描器（如 `scanner-theia.ts`）位于 `hosted` 文件夹中，尽管它们是全局性的关注点。

## 更多信息

- [`@theia/plugin-ext` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_plugin-ext.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
