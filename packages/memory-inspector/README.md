<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - MEMORY-INSPECTOR 扩展</h2>

<hr />

</div>

## 描述

本扩展提供一组以不同方式查看内存的组件。

## 要求

本扩展必须与实现了 `ReadMemoryRequest` 处理器（或返回内存数据的替代性自定义请求）的调试适配器配合使用。
它已针对 [CDT-GDB Adapter](https://github.com/eclipse-cdt/cdt-gdb-adapter) 进行了测试，该适配器是
[CDT-GDB VSCode](https://github.com/eclipse-cdt/cdt-gdb-vscode) 插件的后端。本仓库被配置为在构建流程中下载该插件。
如果你打算将本扩展与其他调试适配器一起使用，可能需要实现自定义的
[`MemoryProvider`](./src/browser/memory-provider/memory-provider-service.ts) 来处理你的适配器所用请求和响应的任何特殊之处。

## 组件

### 内存组件

基础的 [`MemoryWidget` 类](./src/browser/memory-widget/memory-widget.ts)封装了两个功能性组件：`MemoryOptionsWidget` 和
`MemoryTableWidget`。[ `MemoryOptionsWidget`](./src/browser/memory-widget/memory-options-widget.tsx) 负责配置显示和获取内存，
[ `MemoryTableWidget`](./src/browser/memory-widget/memory-table-widget.tsx) 则根据用户在 `MemoryOptionsWidget` 中指定的选项渲染内存。
这三个类的基本组合提供了变量高亮、ASCII 显示、响应调试会话事件的动态更新，以及锁定视图以忽略会话变更的选项。

### 差异组件

[ `MemoryDiffWidget`](./src/browser/diff-widget/memory-diff-widget-types.ts) 是 `MemoryWidget` 类型的扩展形式，支持并排比较两个 `MemoryWidget` 的内容。

### 寄存器组件

[ `RegisterWidget`](./src/browser/register-widget/register-widget-types.ts) 提供在使用能报告寄存器内容的调试适配器时查看和操作这些值的功能。

### 可编辑组件

[ `MemoryEditableTableWidget`](./src/browser/editable-widget/memory-editable-table-widget.tsx) 增加了 UI 功能，允许用户修改表格显示中的值，并将其发送到支持该操作的后端。

## 使用这些组件

这些组件由 [`MemoryWidgetManager`](./src/browser/utils/memory-widget-manager.ts) 创建，修改该服务的 `createNewMemoryWidget()`
方法可以更改实例化的组件类型以及实例化的时机。这些组件通过
[`MemoryProviderService`](./src/browser/memory-provider/memory-provider-service.ts) 获取内存，该服务委托给实现 `MemoryProvider` 接口
并绑定为 `MemoryProvider` 贡献的实现。

## 更多信息

- [`@theia/memory-inspector` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_memory-inspector.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
