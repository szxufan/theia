<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - PROPERTY-VIEW 扩展</h2>

<hr />

</div>

## 描述

`@theia/property-view` 扩展基于 Theia 的全局选择提供了一个通用的全局属性视图。

属性视图组件可以通过菜单 _视图->属性_（_View->Properties_）或快捷键 <kbd>Shift+Alt+P</kbd> 打开/切换。它默认位于底部停靠区域。

本扩展实现了以下两个默认内容组件：

- EmptyPropertyViewWidget：如果无法提供其他组件，则显示一条简单消息（_No properties available_，无可用属性）。
- ResourcePropertyViewWidget：可以处理 `FileSelection` 和 `Navigatable` 选择（它们会提供资源 URI），并在 TreeWidget 中显示一般的 `FileStat` 信息（例如位置、名称、最后修改时间）。

要贡献特定的属性视图，需要实现一个 `PropertyViewDataService`（为某个选择收集属性数据），以及一个 `PropertyViewWidgetProvider`（提供一个合适的内容组件，用于在属性视图组件内显示特定选择的属性数据）。

</br>

## 更多信息

- [`@theia/property-view` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_property-view.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
