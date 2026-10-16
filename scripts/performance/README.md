# 性能测量

本目录包含测量 Theia 前端在 browser 和 Electron 示例中的启动性能的脚本。

前端的启动时间使用最后记录的 `Largest contentful paint (LCP)` 候选指标的时间戳来测量。
此外，脚本还会抓取 Theia 的 Stopwatch 日志输出以捕获补充指标；参见下文的[基于日志的指标](#基于日志的指标)。

## 运行 browser 启动脚本

### 快速开始

在根目录执行 `npm run performance:startup:browser` 来启动后端并执行脚本。

### 前提条件

要运行脚本，需要先启动 Theia 后端。
可以使用 `Launch Browser Backend` 启动配置，也可以在 `examples/browser-app` 目录中运行 `npm run start`。
要捕获按贡献划分的 Stopwatch 细分数据，后端必须以 debug 日志级别启动（例如 `npm run start -- --log-level=debug`）；否则脚本的摘要中只会出现聚合指标。
内置的 `npm run performance:startup:browser` 流程已经这样做了。

### 执行脚本

可以在本目录中使用 `node browser-performance.js` 执行脚本。

脚本接受以下可选参数：

- `--name`：为当前测量指定一个名称（默认：`Browser Frontend Startup`）
- `--url`：让 Theia 指向某个 URL，例如用于指定特定的工作区（默认：`http://localhost:3000/#/<pathToMeasurementScript>/workspace`）
- `--folder`：在 `profiles` 文件夹中生成的追踪文件的文件夹名称（默认：`browser`）
- `--runs`：测量的运行次数（默认：`10`）
- `--headless`：布尔值，测试是否应以无头模式运行（默认：`true`）

_**注意**：当指定了多次运行时，脚本会计算所有值的均值和标准差。_

## 运行 Electron 启动脚本

### 快速开始

在根目录执行 `yarn run performance:startup:electron` 来执行脚本。

### 前提条件

要运行脚本，需要先构建 Theia Electron 示例。在根目录中：

```console
npm install
npm run build:electron
```

### 执行脚本

可以在本目录中使用 `node electron-performance.js` 执行脚本。

脚本接受以下可选参数：

- `--name`：为当前测量指定一个名称（默认：`Electron Frontend Startup`）
- `--folder`：在 `profiles` 文件夹中生成的追踪文件的文件夹名称（默认：`electron`）
- `--workspace`：要打开的 Theia 工作区的绝对路径（默认：一个空的工作区文件夹）
- `--runs`：测量的运行次数（默认：`10`）
- `--debug`：是否向控制台记录调试信息。目前，这只是 Electron 应用的标准错误输出——通常因为子进程是分离的而被抑制

_**注意**：当指定了多次运行时，脚本会计算所有值的均值和标准差，但因异常而未能捕获测量的运行除外。_

可能出现 Electron 应用无法正常启动的情况，原因是原生浏览器模块没有为 Electron 目标正确构建。
其症状通常是某个模块未能自注册的错误；当检测到这种情况时，脚本会停止，而不是打印出一连串必然的测量失败。

## 测量扩展对启动性能的影响

为了测量扩展对应用程序启动性能的影响，还有另一个脚本可用，它使用 `browser-performance.js` 或 `electron-performance.js` 脚本的测量结果。
`extension-impact.js` 脚本对一个定义好的基础应用程序（本目录中的 `base-package.json`）进行测量，然后在基础应用程序加入某个定义好的扩展时测量启动时间。
随后，脚本会向控制台打印一个表格（CSV 格式）（并将其存储到文件中），其中包含每次扩展运行的均值、标准差（Std Dev）和变异系数（CV）。
此外，每个扩展条目还会包含与基础应用程序时间的差值。

示例表格：

| 扩展名称           | 均值（10 次运行）（秒） | 标准差（秒） | CV (%) | 差值（秒） |
| ------------------ | --------------------- | ------------ | ------ | ------------ |
| Base Theia         | 2.027                 | 0.084          | 4.144  | -            |
| @theia/core:1.19.0 | 2.103                 | 0.041          | 1.950  | 0.076        |

### 脚本用法

可以在本目录中通过 `node extension-impact.js` 执行脚本。

可用参数如下：

- `--app`：要测量性能的示例应用，`browser` 或 `electron`（默认：`browser`）
- `--runs`：指定每个扩展的测量次数（默认：`10`）
- `--base-time`：提供基础 Theia 应用程序的现有测量值（均值）。如果未提供，将进行测量。
- `--extensions`：提供要测试的扩展列表（需要在本地安装）（默认：packages 文件夹中的所有扩展）

    _**注意**：每个条目应当：_

  - _具有 {name}:{version} 格式_
  - _不含空白字符_
  - _并且以空白字符分隔_

    _例如：`--extensions @theia/core:1.19.0 @theia/keymaps:1.19.0`_

- `--yarn`：在脚本启动时触发完整构建的标志（例如构建对扩展的修改）
- `--url`：指定 Theia 启动时应使用的 URL（可用于指定要打开的工作区）。_仅适用于 `browser` 应用_（默认：`http://localhost:3000/#/<GIT_ROOT>/scripts/performance/workspace`）
- `--workspace`：指定启动 Theia 时使用的工作区。_仅适用于 `electron` 应用_（默认：`/<GIT_ROOT>/scripts/performance/workspace`）
- `--file`：主输出文件的相对路径（默认：`./script.csv`）
- `--detail-file`：记录按贡献细分的第二个 CSV 的相对路径（默认：在 `--file` 的 `.csv` 后缀之前插入 `-details` 得到）

_**注意**：如果未提供扩展，将测量 `packages` 文件夹中的所有扩展。_

### 按贡献的详细输出

除了主 LCP 对比 CSV 之外，`extension-impact.js` 还会输出一个详细 CSV，每个（扩展，指标）对一行。
指标包括 `All frontend/backend contributions settled` 聚合指标以及 Theia Stopwatch 在运行期间发出的每一个按贡献的计时。
这让你可以把某个扩展的启动开销归因到具体的贡献点。

详细表示例：

| 扩展名称           | 指标                                          | 均值（10 次运行）（秒） | 标准差（秒） | CV (%) |
| ------------------ | --------------------------------------------- | --------------------- | -------------- | ------ |
| @theia/foo:1.19.0  | All frontend contributions settled            | 2.015                 | 0.032          | 1.588  |
| @theia/foo:1.19.0  | Frontend FooFrontendContribution.onStart      | 0.087                 | 0.006          | 6.897  |
| @theia/foo:1.19.0  | Frontend FooFrontendContribution.initialize   | 0.004                 | 0.001          | 25.000 |

## 基于日志的指标

Theia Stopwatch 以性能脚本所抓取的、明确定义的格式发出启动计时日志：

```
<activity>: <ms> ms [<seconds> s since {backend process|frontend page} start]
```

脚本目前捕获的日志行：

- `All frontend contributions settled`：由前端在所有生命周期方法返回 Promise 的贡献都已 resolve 之后记录（即稳定状态，与首次绘制相对）。
- `All backend contributions settled`：后端的等价物。
- `Frontend <ContributionName>.<phase>`：`initialize`、`configure`、`onStart`、`initializeLayout` 和 `onDidInitializeLayout` 的按贡献计时。
- `Backend <ContributionName>.<phase>`：`initialize`、`configure` 和 `onStart` 的按贡献计时。
- `Frontend <ContributionName> settled` / `Backend <ContributionName> settled`：按贡献的完成计时，仅当某个贡献从多个生命周期方法返回了 Promise 时才记录。

这些日志的可见位置：

| 指标                                       | Browser                  | Electron                   |
| ------------------------------------------ | ------------------------ | -------------------------- |
| LCP                                        | Chrome trace             | Chromium trace             |
| `All frontend contributions settled`       | Puppeteer 页面控制台     | Electron 子进程 stdout/stderr |
| `All backend contributions settled`        | _（父进程，不可用）_     | Electron 子进程 stdout/stderr |
| `Frontend <Contribution>.<phase>`          | Puppeteer 页面控制台     | Electron 子进程 stdout/stderr |
| `Backend <Contribution>.<phase>`           | _（父进程，不可用）_     | Electron 子进程 stdout/stderr |

Theia 的前端日志记录器通过 RPC 将所有控制台输出转发到后端，因此 Electron 子进程的 stdout/stderr 同时包含前端和后端的 Stopwatch 日志行。
browser 脚本无法观察后端日志，因为后端作为独立进程运行，其 stdout 未被捕获。
