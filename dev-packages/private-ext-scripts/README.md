<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - EXT-SCRIPTS</h2>

<hr />

</div>

## 描述

`theiaext` 是一个用于在 Theia 包中运行共享 npm 脚本的命令行工具。\
例如，如果你想添加一个打印 `Hello World` 的新 `hello` 脚本：

- 在 [./package.json](./package.json) 中添加一个带 `ext:` 前缀的新脚本。

```json
{
    "name": "@theia/ext-scripts",
    "theia-monorepo-scripts": {
        "ext:hello": "echo 'Hello World'"
    }
}
```

- 在你的包中安装 `theiaext`（实际版本可以不同）

```json
{
    "name": "@theia/myextension",
    "devDependencies": {
        "@theia/ext-scripts": "^0.1.1"
    }
}
```

- 你应该能够在你的包的上下文中调用 `hello` 脚本：

```shell
    npx theiaext hello
````

- 以及从你的包的 npm 脚本中调用：

```json
{
    "name": "@theia/myextension",
    "scripts": {
        "hello": "theiaext hello"
    }
}
```

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
