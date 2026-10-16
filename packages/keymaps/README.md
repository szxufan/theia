<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - KEYMAPS 扩展</h2>

<hr />

</div>

## 描述

`@theia/keymaps` 允许用户使用自定义按键映射重新配置默认快捷键绑定。\
通过修改相应的 `keymaps.json`，用户可以修改现有的快捷键绑定，或者为尚无快捷键绑定的命令添加快捷键绑定。

有效的 `keymaps.json` 文件示例：

```json
[
    {
        "command": "quickCommand",
        "keybinding": "ctrl+shift+f4"
    }
]
```

 其中 `command` 是唯一的命令 ID，`keybinding` 是一个有效的快捷键绑定。还可以指定一个可选的 `context` 属性（它也是上下文 ID 的唯一字符串）。

## 支持的按键

对于大多数按键，你可以直接使用按键名称，即 `a`、`3`、`/`、`-`。

要在 Linux/Windows 上使用 `ctrl`、在 macOS 上使用 `cmd`，请使用 `ctrlcmd`。

你可以使用 `shift`、`ctrl`、`alt`、`meta`、`option`（即 `alt`）、`command`（即 `meta`）、`cmd`（即 `meta`）作为修饰键。注意，如果你定义了使用 `cmd`、`command` 或 `meta` 的自定义快捷键，同一个按键映射文件将无法在 Windows/Linux 机器上工作，因为这些按键没有等价物。

对于特殊按键，你还可以使用以下字符串：`backspace`、`tab`、`enter`、`return`、`capslock`、`esc`、`escape`、`space`、`pageup`、`pagedown`、`end`、`home`、`left`、`up`、`right`、`down`、`ins`、`del` 和 `plus`。

如果不确定，可以随时查看框架的[支持的按键](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_core.common_keys.Key.html)。

## 按键序列

支持诸如 `ctrl+x ctrl+a` 或 `ctrl+a b c` 之类的按键序列，但有以下限制：

- 如果按键序列超过 1 个组合键（key chord），它将不会显示在 electron 菜单中。
- 如果按键序列超过 2 个组合键，它将不会显示在命令面板中。

## 更多信息

- [`@theia/keymaps` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_keymaps.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
