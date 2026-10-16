<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - HEADLESS PLUGIN-EXT 扩展</h2>

<hr />

</div>

## 描述

`@theia/plugin-ext-headless` 扩展为仅限后端的 "无头 `plugin`" API 提供功能实现。
由该扩展管理的插件扩展宿主以单个 Theia NodeJS 实例为作用域。
这与由 [`@theia/plugin-ext` 扩展][plugin-ext]管理的插件扩展宿主不同，后者以前端连接为单位划分作用域。

[plugin-ext]: ../plugin-ext/README.md

## 实现

该实现派生自面向前端作用域插件的 [`@theia/plugin-ext` 扩展][plugin-ext]。

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
