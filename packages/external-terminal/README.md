<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - EXTERNAL-TERMINAL 扩展</h2>

<hr />

</div>

## 描述

`@theia/external-terminal` 扩展为 `electron` 应用程序提供启动外部终端的能力。
该扩展包含必要的逻辑，通过识别特定的环境变量，为每个操作系统（Windows、Linux、OSX）启动合适的终端应用程序。如有必要，该扩展还提供首选项来控制此行为。

**注意：** 该扩展不支持浏览器应用程序。

## 贡献内容

### 命令

- `OPEN_NATIVE_CONSOLE`：针对不同用例启动外部终端（原生控制台）。

### 首选项

- `terminal.external.windowsExec`：Windows 上的应用程序可执行文件。
- `terminal.external.linuxExec`：Linux 上的应用程序可执行文件。
- `terminal.external.osxExec`：OSX 上的应用程序可执行文件。

## 更多信息

- [`@theia/external-terminal` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_external-terminal.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
