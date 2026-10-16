本文件包含一些提示，帮助你在 Theia 开发的世界中迈出（并理解）最初几步。赶时间？请看[快速开始](#quick-start)。

# 如何构建 Theia 及示例应用

Theia 是一个用于构建 IDE 的框架，所以你无法真正"运行"Theia 本身。不过，你可以运行其仓库中自带的示例应用：一个是基于浏览器的 IDE，另一个是对应的基于 Electron 的版本。

以下说明适用于 Linux 和 macOS。

Windows 说明请[点击这里](#building-on-windows)。

- [**前置条件**](#prerequisites)
- [**快速开始**](#quick-start)
  - [以 SSL 方式运行](#run-the-browser-example-with-ssl)
- [**克隆仓库**](#clone-the-repository)
- [**仓库结构**](#the-repository-structure)
- [**构建 core、extensions 与 examples 包**](#build-core-extensions-and-examples-packages)
- [**单独构建扩展包**](#build-extension-packages-individually)
- [**运行基于浏览器的示例应用**](#run-the-browser-based-example-application)
- [**运行基于 Electron 的示例应用**](#run-the-electron-based-example-application)
- [**重新构建**](#rebuilding)
- [**监听模式**](#watching)
  - [监听 core 与扩展包](#watch-the-core-and-extension-packages)
  - [监听示例应用](#watch-the-examples)
  - [监听特定包](#watch-a-specific-package)
  - [监听特定包及其本地上游依赖](#watch-a-specific-package-and-its-local-upstream-dependencies)
- [**调试**](#debugging)
  - [调试浏览器示例的后端](#debug-the-browser-examples-backend)
  - [调试浏览器示例的前端](#debug-the-browser-examples-frontend)
  - [同时调试浏览器示例的前端与后端](#debug-the-browser-examples-frontend-and-backend-at-the-same-time)
  - [调试 Electron 示例的后端](#debug-the-electron-examples-backend)
  - [调试 Electron 示例的前端](#debug-the-electron-examples-frontend)
  - [同时调试 Electron 示例的前端与后端](#debug-the-electron-examples-frontend-and-backend-at-the-same-time)
  - [调试 IPC 服务器](#debug-ipc-servers)
  - [调试插件宿主](#debug-the-plugin-host)
- [**性能分析**](#profiling)
  - [分析前端进程](#profile-the-frontend-process)
  - [分析后端进程](#profile-the-backend-process)
  - [分析 IPC 服务器](#profile-ipc-servers)
  - [分析插件宿主](#profile-the-plugin-host)
- [**测试**](#testing)
- [**代码覆盖率**](#code-coverage)
- [**在 Windows 上构建**](#building-on-windows)
- [**故障排除**](#troubleshooting)
  - [Linux](#linux)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Root 权限错误](#root-privileges-errors)

## 前置条件

- Node.js `>= 24`（Node 24 是推荐的默认版本，也支持 Node 26）。
  - 如果你对 Theia 的 VS Code 扩展支持感兴趣，那么所用的 Node 版本至少应与 [VS Code](https://github.com/microsoft/vscode) 所用 Electron 内置的 Node 版本兼容。
  - 在 Windows 上请注意，Node.js 版本决定了本地模块编译所需的 Visual Studio Build Tools 版本。详情见[在 Windows 上构建](#building-on-windows)。
- git（如果你想使用 Git 扩展，则需要 git 2.11.0 或更高版本。）
- 由于 [`node-gyp`](https://github.com/nodejs/node-gyp#installation)，构建需要 Python3

根据你的平台，还需要一些额外的工具和库：

- Linux
  - [make](https://www.gnu.org/software/make/)
  - [gcc](https://gcc.gnu.org/)（或其他编译工具链）
    - 构建 Electron 示例需要 GCC 13 或更高版本，或 Clang。如果你的发行版附带的 GCC 较旧（例如 Ubuntu 22.04），请参见[故障排除](#linux)。
  - [pkg-config](https://www.freedesktop.org/wiki/Software/pkg-config/)
  - build-essential：`sudo apt-get install build-essential`
  <a name="prerequisite_native_keymap"></a>
  - [`native-keymap`](#prerequisite_native_keymap) 本地 node 模块依赖：
    - Debian 系：`sudo apt-get install libx11-dev libxkbfile-dev`
    - Red Hat 系：`sudo yum install libX11-devel.x86_64 libxkbfile-devel.x86_64 # 或 .i686`
    - FreeBSD：`sudo pkg install libX11`
  <a name="prerequisite_keytar"></a>
  - [`keytar`](#prerequisite_keytar) 本地 node 模块依赖（[参考](https://github.com/atom/node-keytar#on-linux)）：
    - Debian/Ubuntu：`sudo apt-get install libsecret-1-dev`
    - Red Hat 系：`sudo yum install libsecret-devel`
    - Arch Linux：`sudo pacman -S libsecret`
    - Alpine：`apk add libsecret-dev`

- Linux/macOS
  - 推荐使用 [nvm](https://github.com/nvm-sh/nvm)，便于在 Node.js 版本之间切换。

- Windows
  - 我们推荐使用 [`scoop`](https://scoop.sh/)。详细步骤见[这里](#building-on-windows)。

## 快速开始

构建并运行浏览器示例：

```sh
git clone https://github.com/eclipse-theia/theia \
    && cd theia \
    && npm install \
    && npm run build:browser \
    && npm run download:plugins \
    && npm run start:browser
```

在浏览器中打开 <http://localhost:3000>。

构建并运行 Electron 示例：

```sh
git clone https://github.com/eclipse-theia/theia \
    && cd theia \
    && npm install \
    && npm run build:electron \
    && npm run download:plugins \
    && npm run start:electron
```

### 下载插件

你可以运行以下命令下载供示例应用使用的插件：

```sh
npm run download:plugins
```

### 以 SSL 方式运行浏览器示例

要以 SSL 方式运行浏览器示例，请使用：

```sh
git clone https://github.com/eclipse-theia/theia \
    && cd theia \
    && npm install \
    && npm run download:plugins \
    && npm run build:browser \
    && npm run start:browser -- -- --ssl --cert /path/to/cert.crt --certkey /path/to/certkey.key
```

在浏览器中打开 <https://localhost:3000>。

## 克隆仓库

```sh
git clone https://github.com/eclipse-theia/theia
```

包含 Theia 仓库的目录以下简称 `$THEIA`，如果你要复制粘贴示例，可以在 shell 中设置 `THEIA` 变量：

```sh
THEIA=$PWD/theia
```

## 仓库结构

Theia 仓库有多个文件夹：

- `packages` 文件夹包含运行时包，如 core 包及其扩展
- `dev-packages` 文件夹包含开发期包
  - [@theia/cli](../dev-packages/cli/README.md) 是管理 Theia 应用的命令行工具
  - [@theia/ext-scripts](../dev-packages/private-ext-scripts/README.md) 是在 Theia 运行时包之间共享脚本的命令行工具
- `examples` 文件夹包含示例应用，既有基于 Electron 的也有基于浏览器的
- `doc` 文件夹提供关于 Theia 工作原理的文档
- `scripts` 文件夹包含安装时 npm scripts 使用的 JavaScript 脚本
- 根目录列出开发依赖，并用 [Lerna](https://lerna.js.org/) 把所有东西串起来

## 构建 core、extensions 与 examples 包

你可以使用以下命令下载依赖并构建 TypeScript 包：

```sh
npm install
npm run compile
```

这些命令会下载依赖，链接并构建所有 TypeScript 包。

构建示例应用：

```sh
npm run build:browser
npm run build:browser-only
npm run build:electron

# 一次构建所有示例应用：
npm run build:applications
```

想了解更多并准确理解发生了什么，请查看 [package.json](../package.json) 中的脚本。

## 构建所有内容

```sh
npm run all
```

这会安装依赖、链接并构建 TypeScript 包、执行 lint，并构建示例应用。

## 构建 TypeScript 源码

运行此命令之前必须先安装依赖。

```sh
npm run compile
```

## 代码检查（Lint）

Lint 耗时较长，这是 ESLint 本身的限制。我们始终在 GitHub Workflows 中执行 lint，但如果你想在本地 lint，必须手动执行：

```sh
npm run lint # lint TypeScript 源码
```

注意 `npm run all` 会执行 lint。

## 单独构建扩展包

在根目录执行：

```sh
npx lerna run compile --scope @theia/core
```

在包目录内执行：

```sh
npm run compile
```

## 运行基于浏览器的示例应用

我们可以在 [examples/browser](../examples/browser) 目录中启动应用：

```sh
npm run start
```

此命令会启动监听 `3000` 端口的后端应用。前端应用可通过 <http://localhost:3000> 访问。

如果你为 Electron 重新构建了本地 Node.js 包，那么在启动浏览器示例之前，请在根目录运行以下命令回滚这些更改：

```sh
npm run rebuild:browser
```

## 运行基于 Electron 的示例应用

```sh
npm run start:electron
```

## 重新构建

重新构建所有内容：TypeScript 和示例应用。

```sh
npm run build
```

## 监听模式

### 监听 core 与扩展包

要在检测到更改时重新构建_所有内容_，请运行：

```sh
npm run watch
```

### 监听示例应用

要在前端或后端检测到更改时重新构建，可以运行：

```sh
# 二选一
npm run watch:browser

# 或
npm run watch:electron
```

### 监听特定包

你可以使用 `npx` 监听单个包：

```sh
npx lerna run watch --scope @theia/package-name
```

### 监听特定包及其本地上游依赖

#### 使用 TypeScript 构建模式

在完整构建过一次所有 TypeScript 包之后，做单个改动并重新编译应该相当快。

有鉴于此，你可以用 TypeScript 构建模式高效地监听整个 monorepo，让它快速编译。

参见[监听 core 与扩展包](#watch-the-core-and-extension-packages)。

在此模式下，TypeScript 只编译改动的内容及其下游依赖。

#### 使用 Theia 的 `run` 工具

假设你要在 `@theia/navigator` 扩展中工作。但你可能需要在其任意上游依赖（如 `@theia/filesystem` 或 `@theia/core`）中做修改，你可以运行 `npm run watch`，但它可能极其昂贵，因为它监听所有包。或者，你可以在三个独立的 shell 中分别运行 `npx run watch @theia/navigator`、`npx run watch @theia/filesystem` 和 `npx run watch @theia/core`。或者，你可以用下面这条单行命令：

```sh
npx lerna run watch --scope @theia/navigator --include-filtered-dependencies --parallel
```

## 调试

### 调试浏览器示例的后端

- 打开调试视图并运行 `Launch Browser Backend` 配置。

### 调试浏览器示例的前端

- 使用 `npm run start` 启动后端。
- 在浏览器中：打开 <http://localhost:3000/>，并使用开发者工具调试。
- 打开调试视图并运行 `Launch Browser Frontend` 配置。

### 同时调试浏览器示例的前端与后端

- 打开调试视图并运行 `Launch Browser Backend` 配置。
- 然后运行 `Launch Browser Frontend` 配置。

### 调试 Electron 示例的后端

- 打开调试视图并运行 `Launch Electron Backend` 配置。

### 调试 Electron 示例的前端

- 启动 Electron 后端
  - 打开调试视图并运行 `Launch Electron Backend` 配置
  - 或使用 `npm run start`。
- 附加到 Electron 前端
  - 打开调试视图并运行 `Attach to Electron Frontend` 配置
  - 或在 Electron 中：Help -> Toggle Electron Developer Tools。

### 同时调试 Electron 示例的前端与后端

- 打开调试视图并运行 `Launch Electron Backend & Frontend` 配置。

### 调试 IPC 服务器

- 向后端服务器传递 `--${server-name}-inspect` 参数。
  - 例如 `--nsfw-watcher-inspect=0`，以动态端口分配的方式检查 nsfw watcher 进程。
  - 支持 `--inspect` 标志的所有变体：<https://nodejs.org/en/docs/inspector/#command-line-options>。
- 将调试器附加到日志中输出的端口。

要查找 `server-name`，请使用 `--log-level=debug` 参数运行后端服务器，以启用 IPC 服务器实例化日志。
你应该能看到 `[${server-name}: ${server-PID}]: IPC started` 格式的消息，例如 `[nsfw-watcher: 37557] IPC started`。

### 调试插件宿主

- 在命令行向后端服务器传递 `--hosted-plugin-inspect=9339` 参数。
  - 或者，你也可以运行已经预配置好的 `Launch Browser Backend` 启动配置。
- 打开调试视图并运行 `Attach to Plugin Host` 启动配置。
  - 只要检测到至少一个扩展，它就会连接到插件宿主，否则 60 秒后超时。
  - 如果你想调试激活过程，请启用 `stopOnEntry` 标志。
- 打开浏览器页面。

 ---

### 调试插件源码

[点击查看基础文章](https://github.com/eclipse-theia/theia/issues/3251#issuecomment-468166533)

以下启动配置适用于在 VS Code 中把 Theia 项目作为主项目打开的情形，需将以下启动配置添加到 .vscode/launch.json 中。

- 插件的源码仓库应位于你的 `${workspaceFolder}/plugins` 文件夹下
- 你可以从 URL <http://localhost:3030> 启动前端
- 建议更新你的前端启动配置 URL，以便在第二次启动时打开你偏好的目标项目

以下启动配置模板会启动后端进程，然后尝试连接 9339 端口以调试 plugin-host 子进程：

```jsonc
{
    "name": "Launch VS Code extension as Theia plugin",
    "type": "node",
    "request": "launch",
    "port": 9339,
    "timeout": 100000,
    "args": [
        "${workspaceFolder}/examples/browser/src-gen/backend/main.js",
        "${workspaceFolder}",
        "--port=3030",
        "--hosted-plugin-inspect=9339", // 以调试模式生成 plugin-host
        "--plugins=local-dir:${workspaceFolder}/plugins"
    ],
    "stopOnEntry": false,
    "sourceMaps": true,
    "outFiles": [
        "${workspaceFolder}/**/*.js"
    ],
    "internalConsoleOptions": "openOnSessionStart",
    "outputCapture": "std"
}
```

#### 为你的插件生成 TypeScript source map

在插件的 `tsconfig.json` 中启用 source map

```jsonc
{
    "compilerOptions": {
        "sourceMap": true
    }
}
```

如果使用 Webpack，应在 `package.json` 脚本中以开发模式打包以避免压缩：

```sh
webpack --mode development
```

并在 **webpack.config.js** 中启用 source map 输出

```js
module.exports = {
    devtool: 'source-map'
}
```

#### 编译时阻止 TypeScript 向上级目录遍历 [(参见讨论)](https://github.com/Microsoft/TypeScript/issues/13992#issuecomment-386253983)

如果构建时遇到类似以下的错误：

```sh
(parent folders)/index.d.ts: error TS2300: Duplicate identifier
```

你可以通过修改 `tsconfig.json` 修复：

```jsonc
{
    "compilerOptions": {
       "typeRoots": ["./node_modules/@types"]
    }
}
```

## 性能分析

- 使用 Chrome devtools 同时分析前端与后端（Node.js）。
  - 对 Node.js：打开 chrome://inspect，点击 configure 按钮，确保目标主机和端口已列出。
- 了解如何获取并理解 CPU 测量数据：<https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/>
- 了解如何获取并理解内存测量数据：<https://developers.google.com/web/tools/chrome-devtools/memory-problems/>
- 抓取内存快照前总是先触发垃圾回收。
- 通过禁用 Chrome 扩展来确保它们不会干扰测量。
  - 对前端：React 扩展会泄漏组件。
- 在改进前后各做一次测量，作为 pull request 中的证据。
  - 同时在 pull request 描述的 `How to test` 一节中记录如何复现改进后的测量结果。
- 如果对象没有合适的类（即纯 JSON），在第一个快照中找到其中一个，
 并检查它在快照间的 diff 中是否被垃圾回收。

### 分析前端进程

- 在浏览器中：打开 devtools。
- 在 Electron 中：Help -> Toggle Electron Developer Tools。

### 分析后端进程

- 向后端服务器传递 `--inspect` 参数：<https://nodejs.org/en/docs/inspector/#command-line-options>。

### 分析 IPC 服务器

- 向后端服务器传递 `--${server-name}-inspect` 参数。
  - 例如 `--nsfw-watcher-inspect=0`，以动态端口分配的方式检查 nsfw watcher 进程。
  - 支持 `--inspect` 标志的所有变体：<https://nodejs.org/en/docs/inspector/#command-line-options>。

### 分析插件宿主

- 向后端服务器传递 `--hosted-plugin-inspect` 参数。
  - 支持 `--inspect` 标志的所有变体：<https://nodejs.org/en/docs/inspector/#command-line-options>。

## 测试

- 参见[单元测试](Testing.md)文档。
- 参见 [API 集成测试](api-testing.md)文档。

## 代码覆盖率

```sh
    npm run test
```

默认情况下，这会以 HTML 格式生成测试的代码覆盖率，可用浏览器（Chrome/Firefox/Edge/Safari
等）打开 `packages/<package name>/coverage/index.html` 轻松查看。

## 更新依赖与锁文件

当你添加、移除或升级依赖时，在提交重新生成的 `package-lock.json` 之前，请运行 `node scripts/verify-lockfile-platforms.js`。它会检查锁文件是否仍然描述 CI 构建的每个平台，以及 `allowScripts` 允许列表是否同步。参见[锁文件维护](lockfile-maintenance.md)。

## 在 Windows 上构建

- 安装 [`scoop`](https://github.com/lukesampson/scoop#installation)。
- 用 scoop 安装 [`nvm`](https://github.com/coreybutler/nvm-windows)：`scoop install nvm`。
- 用 `nvm` 安装 Node.js：`nvm install lts`，然后使用它：`nvm use lts`。如果想选择其他版本，可以用 `nvm list available` 列出所有可用的 Node.js 版本。
- 现代 Node.js 安装程序在 Windows 上可以为你安装所需的构建工具（见 Node.js 安装程序中的"Automatically install the necessary tools"复选框）。如果需要手动安装，参见[`安装 Windows 构建工具`](#installing-windows-build-tools)。
- 如果安装所需构建工具时遇到问题，`node-gyp` 文档提供了如何手动安装依赖的实用[指南](https://github.com/nodejs/node-gyp#on-windows)。对于 Node 22 及更高版本，这至少需要 [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)（v17）以及"Desktop development with C++"工作负载。
- 如果安装了多个版本的 python 或 Visual Studio，或者找不到工具，你可以按照[这里](https://github.com/nodejs/node-gyp?tab=readme-ov-file#configuring-python-dependency)所述调整所用版本

克隆、构建并运行 Theia。
以管理员身份使用 Git Bash：

```sh
git clone https://github.com/eclipse-theia/theia.git \
    && cd theia \
    && npm install \
    && npm run build:browser \
    && npm run start:browser
```

如果你的系统没有安装 Git Bash，请[获取一个](https://gitforwindows.org/)，或使用 `scoop`：`scoop install git`。

### 安装 Windows 构建工具

- 现代 Node.js Windows 安装程序会在安装过程中提供安装所需构建工具（带 C++ 工作负载的 Visual Studio Build Tools 和 Python）的选项。这是推荐的路径。
- 如果你跳过了该步骤，请安装带"Desktop development with C++"工作负载的 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)（2022 或更高版本），以及 Python 3。详情参见 [node-gyp Windows 指南](https://github.com/nodejs/node-gyp#on-windows)。
- 旧式的 [`windows-build-tools`](https://www.npmjs.com/package/windows-build-tools) npm 包已被弃用，不应再使用。

## 故障排除

> 首先确保你正确遵循了[文档](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#run-the-browser-based-example-application)中的步骤。

### Linux

启动命令会监听 theia 目录中的大量文件。
为避免 ENOSPC 错误，请增加默认的 inotify watch 数量。

可以这样操作：

```sh
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

如果为 Electron 重新构建本地模块时在 `v8-primitive.h` 中出现 `error: expected identifier before '__attribute__'`，说明你的 GCC 版本低于 13，无法编译 Theia 所用 Electron 版本的 V8 头文件。请安装 GCC 13 或更高版本，或使用 Clang 构建：

```sh
CC=clang CXX=clang++ npm run build:electron
```

### Windows

如果你看到 `LINK : fatal error LNK1104: cannot open file 'C:\\Users\\path\\to\\node.lib' [C:\path\to\theia\node_modules\drivelist\build\drivelist.vcxproj]`，请手动设置 Visual Studio 版本，例如 `npm config set msvs_version 2022 --global`。注意所需的 Visual Studio 版本取决于你的 Node.js 版本：Node 22 及更高版本至少需要 Visual Studio 2022 Build Tools。当前要求请参阅 [node-gyp Windows 指南](https://github.com/nodejs/node-gyp#on-windows)。

如果在构建、测试或运行应用时遇到 `EPERM: operation not permitted` 或 `permission denied`
错误，那么：

- 你对安装目录没有写权限。
- 尝试以管理员身份运行你的命令行（`PowerShell`、`GitBash`、`Cygwin` 或你使用的任何工具）。
- NPM 缓存中的权限可能已损坏。请尝试运行
 `npm cache clean` 修复。
- 如果遇到 `Error: EBUSY: resource busy or locked, rename` 之类的问题，
 请尝试禁用（或卸载）你的反恶意软件。
 参见[这里](https://github.com/npm/npm/issues/13461#issuecomment-282556281)。
- 在 Windows 上仍有问题？请提交[缺陷]。我们主要在 Linux 或 OS X
 操作系统上工作。因此，我们非常乐意收到任何与 Windows 相关的
 反馈与[缺陷](https://github.com/eclipse-theia/theia/issues)报告。

如果你在 Windows 10 或更高版本上仍然无法构建，可以启用 `Windows Subsystem for Linux` 并免费获得一个 Linux 发行版。

### macOS

你需要安装 Xcode 命令行工具才能构建和运行 Theia。可以通过以下命令安装：

```sh
xcode-select --install
```

如果你已安装 Xcode，但看到 `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance` 错误，则需要运行以下命令修复：`sudo xcode-select --switch /Library/Developer/CommandLineTools`。

如果你升级到 `10.14`（Mojave）后看到 `gyp: No Xcode or CLT version detected!` 错误，解决办法相同。更多详情见[这里](https://github.com/nodejs/node-gyp#on-macos)。

### Root 权限错误

尝试以 root 权限安装时，你可能会遇到诸如
`cannot run in wd` 的错误。

有几种选择：

- 不以 root 权限安装
- 使用 `--unsafe-perm` 标志：`npm install --unsafe-perm`
