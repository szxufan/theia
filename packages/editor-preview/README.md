<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - EDITOR-PREVIEW 扩展</h2>

<hr />

</div>

## 描述

`@theia/editor-preview` 扩展提供预览编辑器，它支持与常规编辑器组件相同的功能，唯一区别是：

- 如果预览编辑器在收到再次预览某个文件的请求时尚未"转换为永久编辑器"，则不会打开新的编辑器，而是显示新请求文件的内容。

以下事件会使预览编辑器转换为永久编辑器：

- 修改正在预览的文件内容
- 双击预览标签页
- 对编辑器预览标签页执行拖放操作，导致标签页被移动
- 发出打开正在预览的文件的请求（例如在
文件资源管理器中双击该文件）

当该扩展被包含在 Theia 应用程序中时，预览编辑器默认启用，但
可以通过修改以下首选项将其禁用：

```json
editor.enablePreview
```

除该值外，还必须将首选项：

```json
list.openMode
```

设置为 "singleClick"，才能启用以预览模式打开文件。

## 更多信息

- [`@theia/editor-preview` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_editor-preview.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
