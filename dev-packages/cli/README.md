<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - CLI</h2>

<hr />

</div>

## 大纲

- [大纲](#大纲)
- [描述](#描述)
- [入门](#入门)
- [配置](#配置)
  - [应用程序属性](#应用程序属性)
  - [默认首选项](#默认首选项)
  - [默认主题](#默认主题)
  - [构建目标](#构建目标)
  - [Electron 前端应用程序配置](#electron-前端应用程序配置)
  - [使用最新构建](#使用最新构建)
- [构建](#构建)
  - [构建](#构建-1)
  - [监视](#监视)
  - [清理](#清理)
- [重建原生模块](#重建原生模块)
- [运行](#运行)
- [调试](#调试)
- [测试](#测试)
  - [启用测试](#启用测试)
  - [编写测试](#编写测试)
  - [运行测试](#运行测试)
  - [配置测试](#配置测试)
  - [检查测试](#检查测试)
  - [报告测试覆盖率](#报告测试覆盖率)
- [下载插件](#下载插件)
- [自动生成的应用程序](#自动生成的应用程序)
- [更多信息](#更多信息)
- [许可证](#许可证)
- [商标](#商标)

## 描述

`@theia/cli` 包为扩展和应用程序开发提供有用的脚本和命令。
其中贡献的 `theia` 是一个用于管理基于 Theia 的应用程序的命令行工具。

## 入门

在你的应用程序中将 `@theia/cli` 安装为开发依赖。

使用 yarn：

```bash
yarn add @theia/cli@next --dev
```

使用 npm：

```bash
npm install @theia/cli@next --save-dev
```

## 配置

基于 Theia 的应用程序可以在应用程序的 `package.json` 中通过 `theia` 属性进行配置。

### 应用程序属性

可以为给定的应用程序配置 `应用程序属性`。\
例如，应用程序可以使用以下语法定义其 `applicationName`：

```json
"theia": {
    "frontend": {
      "config": {
        "applicationName": "Custom Application Name",
      }
    }
  },
```

### 默认首选项

如有需要，应用程序可以为给定的首选项定义默认值。
例如，应用程序可以根据自身需求更新 `files.enableTrash` 首选项的值：

```json

"theia": {
    "frontend": {
      "config": {
        "preferences": {
          "files.enableTrash": false
        }
      }
    }
  },
```

### 默认主题

默认颜色主题和图标主题可以在 `theia.frontend.config` 部分进行配置：

```json
"theia": {
    "frontend": {
      "config": {
        "defaultTheme": "light",
        "defaultIconTheme": "vs-seti"
      }
    }
  },
```

### 构建目标

支持以下目标：`browser` 和 `electron`。默认使用 `browser` 目标。
目标可以在 `package.json` 中通过 `theia/target` 属性进行配置，例如：

```json
{
    "theia": {
        "target": "electron"
    },
    "dependencies": {
        "@theia/electron": "latest"
    }
}
```

对于 `electron` 目标的应用程序，必须包含 **Electron** 运行时依赖。`@theia/electron` 包是安装所需依赖的最简单方式。

### Electron 前端应用程序配置

`electron` 前端应用程序配置为 `electron` 目标提供配置选项。\
当前支持的配置有：

- `disallowReloadKeybinding`：如果设置为 `true`，则无法通过 <kbd>Ctrl/Cmd</kbd> + <kbd>r</kbd> 快捷键重新加载当前浏览器窗口。默认为 `false`。在非 electron 环境中无效。
- `windowOptions`：覆盖或添加 electron `windowOptions` 的属性。

```json
{
    "theia": {
        "target": "electron",
        "frontend": {
            "config": {
                "electron": {
                    "disallowReloadKeybinding": true,
                    "windowOptions": {
                        "titleBarStyle": "hidden",
                        "webPreferences": {
                            "webSecurity": false,
                            "nodeIntegration": true,
                            "webviewTag": true
                        }
                    }
                }
            }
        }
    }
}
```

### 使用最新构建

如果你在 theia 配置中设置了 `next`，那么 Theia 将优先使用 `next` 而非 `latest` 作为最新标签。

```json
{
    "theia": {
        "next": "true"
    }
}
```

## 构建

### 构建

以下命令可用于构建应用程序：

**开发模式**

    theia build --mode development

**生产模式**

    theia build

### 监视

以下命令可用于在每次变更时重新构建应用程序：

    theia build --watch --mode development

### 清理

以下命令可用于清理构建结果：

清理构建结果：

    theia clean

参数会直接传递给生成的 [esbuild](https://esbuild.github.io/) 配置（`esbuild.mjs`）。使用 `--bundler-help` 了解支持哪些选项。

## 重建原生模块

要运行 Electron 目标，需要针对某个 electron 版本重建原生 node 模块：

    theia rebuild

要回滚原生模块，将目标改为 `browser` 并再次运行该命令。

## 运行

要运行后端服务器：

    theia start

对于 browser 目标，默认在 <http://localhost:3000> 上启动服务器。
对于 electron 目标，默认在 `localhost` 主机上使用动态分配的端口启动服务器。

参数会直接传递给服务器，使用 `--help` 了解支持哪些选项。

## 调试

要调试后端服务器：

    theia start --inspect

Theia CLI 接受 `--inspect` node 标志：<https://nodejs.org/en/docs/inspector/#command-line-options>。

## 测试

### 启用测试

首先在 `esbuild.mjs` 中启用 `exposeModulePlugin`，
以便将打包代码中的模块暴露给测试：

```js
import { browserOptions } from './gen-esbuild.browser.mjs';
import { exposeModulePlugin } from '@theia/bundle-plugin';

// Expose bundled modules on the window.theia.moduleName namespace, e.g.
// window['theia']['@theia/core/lib/common/uri'].
// Such syntax can be used by external code, for instance, for testing.
browserOptions.plugins.push(exposeModulePlugin());
```

之后再次运行 `theia build`，以便在生成的 bundle 文件中暴露模块。

### 编写测试

参见 [API 集成测试](../../doc/api-testing.md)文档。

### 运行测试

启动后端服务器并针对它运行 API 测试：

    theia test

测试运行完毕后该命令会终止。它接受与 `start` 命令相同的参数，
此外还接受一些附加参数，用于指定测试文件、启用检查或生成测试覆盖率。

### 配置测试

要指定测试文件：

    theia test . --test-spec=./test/*.spec.js --plugins=./plugins

此命令以当前目录作为工作区启动应用程序，
从 `./plugins` 加载 VS Code 扩展，
并运行匹配 `./test/*.spec.js` glob 的测试文件。

使用 `theia test --help` 了解更多选项。测试专用选项以 `--test-` 开头。

### 检查测试

要检查（inspect）测试：

    theia test . --test-spec=./test/*.spec.js --test-inspect --inspect

此命令以调试模式启动应用服务器，
并打开 Chrome devtools 来调试前端代码和测试文件。
只需重新加载页面即可重新加载/重新运行代码和测试。

> 重要！由于测试依赖焦点，运行测试时请保持页面处于焦点状态。

### 报告测试覆盖率

要报告测试覆盖率：

    theia test . --test-spec=./test/*.spec.js --test-coverage

此命令执行测试并生成可供 [Istanbul](https://github.com/istanbuljs/istanbuljs) 使用的测试覆盖率文件。

## 下载插件

`@theia/cli` 包为应用程序提供一个实用工具，使用以下命令定义并下载应用程序所需的插件列表：

    theia download:plugins

该工具的工作方式是：在 `package.json` 中声明一个存储已下载插件的位置，以及定义应用程序希望下载的每个插件。

`theiaPluginsDir` 属性描述下载插件的位置（相对于 `package.json`），例如：

```json
"theiaPluginsDir": "plugins",
```

`theiaPlugins` 属性描述要下载的插件列表，例如：

```json
"theiaPlugins": {
    "vscode.theme-defaults": "https://open-vsx.org/api/vscode/theme-defaults/1.62.3/file/vscode.theme-defaults-1.62.3.vsix",
    "vscode-builtin-extension-pack": "https://open-vsx.org/api/eclipse-theia/builtin-extension-pack/1.50.0/file/eclipse-theia.builtin-extension-pack-1.50.0.vsix",
    "vscode-editorconfig": "https://open-vsx.org/api/EditorConfig/EditorConfig/0.14.4/file/EditorConfig.EditorConfig-0.14.4.vsix",
    "vscode-eslint": "https://open-vsx.org/api/dbaeumer/vscode-eslint/2.1.1/file/dbaeumer.vscode-eslint-2.1.1.vsix",
    "rust-analyzer": "https://open-vsx.org/api/rust-lang/rust-analyzer/${targetPlatform}/0.4.1473/file/rust-lang.rust-analyzer-0.4.1473@${targetPlatform}.vsix"
}
```

如 `rust-analyzer` 条目所示，我们可以在 URL 中使用占位符。支持的占位符有：

- `${targetPlatform}` 占位符，它会解析为描述本地系统和架构的字符串，例如 `win32-x64`。这对于添加非通用插件很有用。

请注意，为了正确使用 `extensionPacks`，你应该使用 `namespace.name` 作为给扩展指定的 `id`，这样在解析扩展包时就不会用不同的名称重新下载一个已有的插件。

`theiaPluginsExcludeIds` 属性可用于声明在使用扩展包时要排除的插件 `id` 列表。
在解析扩展包时，该属性引用的 `id` 不会被下载，可用于省略有问题或不想要的扩展。该属性的格式如下：

```json
"theiaPluginsExcludeIds": [
  "vscode.cpp"
]
```

## 自动生成的应用程序

本包可以为后端和前端自动生成应用程序代码，以及 esbuild 配置文件。

以 Electron 为目标时，`electron-main.js` 脚本会在 Node.js 子进程中派生后端进程，此时 Electron 的 API 不可用。要阻止生成的应用程序派生后端，可以传入 `--no-cluster` 标志。该标志主要用于调试。

```sh
# when developing a Theia application with @theia/cli:
yarn theia start --no-cluster

# when starting a bundled application made using @theia/cli:
bundled-application.exe --no-cluster
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
