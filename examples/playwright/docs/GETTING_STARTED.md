# 入门

最快的上手方式是克隆 [theia-playwright-template](https://github.com/eclipse-theia/theia-playwright-template) 并构建 theia-playwright-template。

```bash
git clone git@github.com:eclipse-theia/theia-playwright-template.git
cd theia-playwright-template
yarn
```

theia-playwright-template 中最重要的文件是：

* `tests/theia-app.test.ts` 中的示例测试
* `test/page-objects/theia-app.ts` 中的示例页面对象
* 位于 `playwright.config.ts` 的基础 Playwright 配置文件
* 包含运行和调试测试所需的全部依赖与脚本的 `package.json`

现在，让我们运行测试：

1. 运行被测的 Theia 应用程序（不属于 theia-playwright-template 的一部分）
2. 在 theia-playwright-template 中运行 `yarn ui-tests`，以无头模式运行其测试

请注意，Theia 🎭 Playwright 的设计初衷就是可以用自定义页面对象进行扩展，例如 theia-playwright-template 中 `test/page-objects/theia-app.ts` 里的那个。
我们建议为所有自定义视图、编辑器、组件等添加更多页面对象。
更多信息请参阅[扩展指南](EXTENSIBILITY.md)。

此外，本仓库在 `examples/playwright/src/tests` 中包含若干基于 Theia 🎭 Playwright 的测试，可作为编写测试的补充示例。

## 添加更多测试

让我们以 Theia 文本编辑器为例，再编写一个系统测试：

1. 初始化一个包含文件 `sampleFolder/sample.txt` 的预备工作区，并用被测的 Theia 应用程序打开该工作区
2. 打开 Theia 文本编辑器
3. 将第 1 行的内容替换为 `change`，并检查该行内容和脏（dirty）状态——此时应指示编辑器为脏状态
4. 执行两次撤销（undo），验证该行内容应恢复为修改之前的内容。脏状态应重新变为干净
5. 执行两次重做（redo），检查第 1 行再次显示文本 `change`。同时脏状态应再次变为脏
6. 保存编辑器及已保存的内容，检查保存后编辑器状态是否干净。关闭编辑器
7. 重新打开同一个文件，检查第 1 行的内容是否仍然显示已更改的内容

测试代码可能如下所示。我们使用页面对象 `TheiaWorkspace` 和 `TheiaApp` 以一个预备工作区初始化应用程序。
使用 `TheiaApp` 实例，我们打开一个类型为 `TheiaTextEditor` 的编辑器，它允许我们执行诸如替换行内容、撤销、重做等操作。
我们随时可以从文本编辑器获取信息，例如获取脏状态，并验证这些信息是否符合我们的预期。

```typescript
test('should undo and redo text changes and correctly update the dirty state', async ({ playwright, browser }) => {
    // 1. set up workspace contents and open Theia app
    const ws = new TheiaWorkspace([path.resolve(__dirname, 'resources/sample-files1']);
    app = await TheiaAppLoader.load( { playwright, browser }, ws);

    // 2. open Theia text editor
    const sampleTextEditor = await app.openEditor(
        'sample.txt',
        TheiaTextEditor
    );

    // 3. make a change and verify contents and dirty
    await sampleTextEditor.replaceLineWithLineNumber('change', 1);
    expect(await sampleTextEditor.textContentOfLineByLineNumber(1)).toBe(
        'change'
    );
    expect(await sampleTextEditor.isDirty()).toBe(true);

    // 4. undo and verify contents and dirty state
    await sampleTextEditor.undo(2);
    expect(await sampleTextEditor.textContentOfLineByLineNumber(1)).toBe(
        'this is just a sample file'
    );
    expect(await sampleTextEditor.isDirty()).toBe(false);

    // 5. undo and verify contents and dirty state
    await sampleTextEditor.redo(2);
    expect(await sampleTextEditor.textContentOfLineByLineNumber(1)).toBe(
        'change'
    );
    expect(await sampleTextEditor.isDirty()).toBe(true);

    // 6. save verify dirty state
    await sampleTextEditor.save();
    expect(await sampleTextEditor.isDirty()).toBe(false);
    await sampleTextEditor.close();

    // 7. reopen editor and verify dirty state
    const reopenedEditor = await app.openEditor('sample.txt', TheiaTextEditor);
    expect(await reopenedEditor.textContentOfLineByLineNumber(1)).toBe(
        'change'
    );

    await reopenedEditor.close();
});
```

下面可以看到这个示例测试的运行情况——通过 VS Code 调试工具逐行单步调试代码。

<div style='margin:0 auto;width:100%;'>

![Theia](./images/debug-example.gif)

</div>

## 最佳实践

Playwright 测试/函数都是异步的，因此应使用 `await` 关键字来等待给定函数的结果。
这样就无需使用超时或其他函数来等待特定结果。
只要在任何调用上使用了 await，测试就应处于预期的状态。

使用选择器向页面查询元素有两种方式。

1. 一种是 `page.$(selector)` 方法，它返回 null 或元素（如果可用）。
2. 另一种方法 `page.waitForSelector(selector)`，顾名思义，会等待直到选择器可用。这确保元素能够被加载，因此之后无需再做 null 检查。

避免从测试中直接与文档对象模型（例如 HTML 元素）或 Playwright `page` 交互。
与应用程序的交互应封装在页面对象中。
否则，你的测试会变得臃肿，并且在应用程序变更时更加脆弱。
更多信息请参阅[页面对象模式](https://martinfowler.com/bliki/PageObject.html)。

避免从页面对象返回或暴露 Playwright 类型。
这能让你的测试独立于底层的浏览器自动化框架。

## 执行测试

## 构建

在仓库的根目录运行 `yarn` 来构建 Theia 应用程序。

为了构建 Playwright 库、测试并安装全部依赖（例如 chromium），运行构建脚本：

```bash
cd examples/playwright
yarn build
```

### 启动被测的 Theia 应用程序

在运行测试之前，被测的 Theia 应用程序需要处于运行状态。
不过，Playwright 配置已经考虑到了这一点，如果后端尚未运行，它会在 3000 端口上启动后端（`yarn theia:start`）。
这对于通过 VS Code Playwright 扩展或从命令行执行测试都有效。

### 通过 Playwright 扩展在 VS Code 中运行测试

为了在 VS Code 中快速方便地执行测试，我们推荐使用 [VS Code Playwright 扩展（`ms-playwright.playwright`）](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)。

安装 VS Code Playwright 测试扩展后，打开 *Test*（测试）视图，点击顶部工具栏的 `Run Tests` 按钮，或针对特定测试点击 `Run Test` 按钮。
它默认使用以 chromium 作为测试配置的默认配置。

要以有头模式运行测试，只需在 *Test* 视图的 Playwright 部分勾选 `Show browser` 复选框。

### 通过 CLI 无头运行测试

要启动测试，请在 `playwright` 文件夹中运行 `yarn ui-tests`。
这会以无头状态启动测试。

要只运行单个测试文件，可以通过 `yarn ui-tests <path-to-file>` 或 `yarn ui-tests -g "<partial test file name>"` 设置测试文件的路径。
参见 [Playwright Test 命令行文档](https://playwright.dev/docs/intro#command-line)。

### 通过 CLI 有头运行测试

如果你想在浏览器中观察测试的执行，使用 `yarn ui-tests-headful` 运行全部测试，或使用 `yarn ui-tests-headful <path-to-file>` 只运行特定测试。

### 通过 VS Code Playwright 扩展调试测试

要调试 Playwright 测试，在 VS Code 中打开 *Test* 视图，点击顶部工具栏的 `Debug Tests` 按钮，或针对特定测试点击 `Debug Test`。
它默认使用以 chromium 作为测试配置的默认配置。

有关调试的更多信息，请参阅 [Playwright 文档](https://playwright.dev/docs/debug)。

### UI 模式 - 监视和追踪模式

为了获得更高级的测试开发体验，Playwright 提供了所谓的 *UI 模式*。要启用它，只需在 CLI 命令中添加 `--ui` 标志。

```bash
yarn ui-tests --ui
```

有关 UI 模式的更多信息，请参阅 [Playwright 对 UI 模式的公告](https://playwright.dev/docs/release-notes#introducing-ui-mode-preview)。

## 进阶主题

Playwright 还有更多可用的功能、配置和命令行选项。
从对测试进行分组和标注、更多报告器，到可视化比较等等。
更多信息请参阅 [Playwright 文档](https://playwright.dev/docs/intro)。
