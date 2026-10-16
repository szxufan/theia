<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - TOOLBAR 扩展</h2>

<hr />

</div>

## 描述

`@theia/toolbar` 扩展为应用程序外壳提供了一个全局工具栏。该工具栏是对 `Command Palette`（命令面板）的补充，允许用户按照自己的喜好轻松添加、移除和重新排列工具栏项。工具栏默认隐藏，并附带一个默认布局，下游应用程序可以覆盖该布局。扩展开发者还可以通过贡献点向工具栏贡献自定义组件。

### 图标管理

向工具栏添加新项时，会弹出一个对话框，显示所有已安装的图标。此功能让用户无需提前了解图标名称即可轻松为工具栏项选择合适的图标。该对话框以可视化方式展示来自 FontAwesome 和 Codicons 图标库的可用图标。

`update-icons.js` 脚本会从当前安装的依赖中收集 FontAwesome 和 Codicons 的图标字符串，并保存到临时 JSON 文件中。随后将内容复制到 `codicon.ts` 和 `font-awesome-icons.ts` 以更新图标列表。
可以使用一个工具类 npm 脚本：`npm run update:icons`。

## 更多信息

工具栏自定义组件和布局覆盖的示例可在[这里](https://github.com/eclipse-theia/theia/tree/master/examples/api-samples/src/browser/toolbar)找到。

- [`@theia/toolbar` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_toolbar.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
