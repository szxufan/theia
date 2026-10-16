<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - PREFERENCES 扩展</h2>

<hr />

</div>

## 描述

`@theia/preferences` 扩展实现了 `@theia/core` 中定义的首选项 API，包括四个首选项提供方：

- `Default`（默认）首选项，作为首选项的默认值，
- `User`（用户）首选项，对应于用户主目录，优先级高于默认值，
- `Workspace`（工作区）首选项，对应于工作区，优先级高于用户首选项，以及
- `Folder`（文件夹）首选项，对应于根文件夹，优先级高于工作区首选项

设置方式：

- `User` 首选项：在用户主目录下的 `.theia` 文件夹中创建或编辑 `settings.json`。
- `Workspace` 首选项：如果打开的是单文件夹工作区，请在工作区根目录下创建或编辑 `settings.json`；如果打开的是多根工作区，请在工作区文件中创建或编辑 "settings" 属性。
- `Folder` 首选项：在任意根文件夹下创建或编辑 `settings.json`。

下面是一个 `settings.json` 示例：

```typescript
{
    // 启用/禁用 monaco 编辑器中的行号
 "editor.lineNumbers": "off",
    // 编辑器中的制表符宽度
 "editor.tabSize": 4,
 "files.watcherExclude": "path/to/file"
}
```

下面是一个工作区文件示例：

```typescript
{
   "folders": [
      {
         "path": "file:///home/username/helloworld"
   },
   {
         "path": "file:///home/username/dev/byeworld"
      }
   ],
   "settings": {
      // 启用/禁用 monaco 编辑器中的行号
   "editor.lineNumbers": "off",
      // 编辑器中的制表符宽度
   "editor.tabSize": 4,
   }
}
```

## 更多信息

- [`@theia/preferences` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_preferences.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>

# Theia - Preferences 扩展

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)
