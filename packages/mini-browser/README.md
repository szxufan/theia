<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - MINI-BROWSER 扩展</h2>

<hr />

</div>

## 描述

`@theia/mini-browser` 扩展提供一个浏览器组件以及相应的后端端点。

## 环境变量

- `THEIA_MINI_BROWSER_HOST_PATTERN`

  一个字符串模式，可能包含将被替换的 `{{uuid}}` 和 `{{hostname}}`。这是 `mini-browser` 将要服务的主机。
  将 `mini-browser` 处理器托管在子域名上是一种良好的做法，因为这样更安全。
  默认值为 `{{uuid}}.mini-browser.{{hostname}}`。

## 安全警告

- 潜在不安全的主机模式

  当你通过 `THEIA_MINI_BROWSER_HOST_PATTERN` 环境变量更改主机模式时，前端和后端都会发出警告。
  你可以在应用程序 `package.json` 的相应应用程序配置中设置 `warnOnPotentiallyInsecureHostPattern: false` 来禁用这些警告。

## 更多信息

- [`@theia/mini-browser` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_mini-browser.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
