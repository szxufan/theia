# 构建和开发 Theia 🎭 Playwright

## 构建

在仓库的根目录运行 `npm install && npm run build` 来构建 Theia 应用程序。

为了构建 Playwright 库、测试并安装全部依赖（例如 chromium），运行构建脚本：

```bash
cd examples/playwright
npm run build
```

## 执行测试

### 前提条件

在运行测试之前，被测的 Theia 应用程序需要处于运行状态。

不过，Playwright 配置已经考虑到了这一点，如果后端尚未运行，它会在 3000 端口上启动后端（`npm run theia:start`）。
这对于通过 VS Code Playwright 扩展或从命令行执行测试都有效。

你也可以使用 VS Code 中的 `Launch Browser Backend` 启动配置。

### 通过 Playwright 扩展在 VS Code 中运行测试

为了在 VS Code 中快速方便地执行测试，我们推荐使用 [VS Code Playwright 扩展（`ms-playwright.playwright`）](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)。

安装 VS Code Playwright 测试扩展后，打开 *Test*（测试）视图，点击顶部工具栏的 `Run Tests` 按钮，或针对特定测试点击 `Run Test` 按钮。
它默认使用以 chromium 作为测试配置的默认配置。

要以有头模式运行测试，只需在 *Test* 视图的 Playwright 部分勾选 `Show browser` 复选框。

### 通过 CLI 无头运行测试

要启动测试，请在 `playwright` 文件夹中运行 `npm run ui-tests`。
这会以无头状态启动测试。

要只运行单个测试文件，可以通过 `npm run ui-tests <path-to-file>` 或 `npm run ui-tests -g "<partial test file name>"` 设置测试文件的路径。
参见 [Playwright Test 命令行文档](https://playwright.dev/docs/intro#command-line)。

### 通过 CLI 有头运行测试

如果你想在浏览器中观察测试的执行，使用 `npm run ui-tests-headful` 运行全部测试，或使用 `npm run ui-tests-headful <path-to-file>` 只运行特定测试。

### 监视测试

在本包的根目录运行 `npm run watch`，可在每次变更后重新构建测试代码。
这能确保即使通过 [Playwright VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)运行测试，所执行的测试也是最新的。

### 调试测试

请参阅[通过 VS Code Playwright 扩展调试测试](./GETTING_STARTED.md#通过-vs-code-playwright-扩展调试测试)一节。

### UI 模式 - 监视和追踪模式

请参阅 [UI 模式 - 监视和追踪模式](./GETTING_STARTED.md#ui-模式---监视和追踪模式)一节。
