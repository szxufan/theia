# API 集成测试

- [**测试原则**](#testing-principles)
- [**编写测试**](#writing-tests)
  - [**声明测试套件**](#declaring-a-test-suite)
  - [**访问应用服务**](#accessing-application-services)
  - [**编写一个测试**](#writing-a-test)
- [**运行测试**](#running-tests)
- [**检查测试**](#inspecting-tests)
- [**运行单个测试**](#running-a-single-test)

通常，集成测试针对 DOM/CSS 编写，并用 Selenium 之类的框架在独立进程中执行。
在尝试过这种方式后，我们发现它们
缓慢、不稳定、难以开发、调试与维护，并且
会漏掉真实的问题。

Theia 自带一套集成测试框架，旨在克服
常规方法的缺点：

- 测试针对应用 API 编写，
确保 API 的完整性与时序得到测试；
- 测试在应用进程内执行，
确保其速度与稳健性。

## 测试原则

- **信息隐藏**：API 应提供应用对象模型，
把 DOM/CSS 实现细节隐藏在其后。针对应用 API 测试，而非 DOM/CSS 等实现细节。
- **完整性**：API 应当完整，即有状态服务
应提供访问器函数与事件。
与其引入辅助测试函数，不如实现缺失的 API。
- **可扩展性**：API 应拆分为具备简单函数的最小接口，因为最小接口易于实现，
且新功能可以通过组合简单函数来开发。
警惕在测试与实现中大包大揽的复杂函数。
- **便利性**：API 应为典型的复杂任务提供便利函数，此类函数虽然
不应复杂，但应按可扩展性原则拆分。
通过提取便利的 API 简化测试。
- **稳健性**：API 应提供可靠的时序，例如测试聚焦编辑器时，
函数应在编辑器聚焦后 resolve。
警惕基于 DOM 事件监听器去猜测、而非依赖 API 事件与 promise 的测试。

## 编写测试

新测试应添加在 `examples/api-tests` 包中。
该包会被发布，以便采用者能针对最终产品运行测试。
测试应拆分为不同的测试套件文件，让采用者可以选择性包含。

### 声明测试套件

所有测试文件在应用进程的全局作用域中逐一加载。
这意味着它们共享在全局作用域中声明的变量。
为避免命名冲突，每个测试文件应以带函数作用域的测试套件声明开头。新变量只能在该函数作用域内声明。

```js
describe('Editors', function () {

    const { assert } = chai;

});
```

### 访问应用服务

应用总是被打包的。Bundle 通过 `theia` 命名空间暴露应用模块。
可以用 `window.theia.moduleName` 访问模块，其中 `moduleName`
是模块文件相对于所属包的绝对路径。
例如 `editor-manager.js` 可以通过 `window.theia['@theia/editor/lib/browser/editor-manager']` 访问。
测试框架同样注入了 `require` 函数用于查找模块。
在为 js 文件启用 typescript 检查时，它有助于编写静态检查的代码。

仅从暴露的模块导入符号是不够的，
还必须从应用容器获取它们的实现。
应用容器同样通过 `theia` 命名空间暴露，
可以用 `window.theia.container` 访问。

```js
// @ts-check
describe('Editors', function () {

    const { assert } = chai;

    const { EditorManager } = require('@theia/editor/lib/browser/editor-manager');
    const Uri = require('@theia/core/lib/common/uri');
    const { WorkspaceService } = require('@theia/workspace/lib/browser/workspace-service');

    /** @type {import('inversify').Container} */
    const container = window['theia'].container;
    const editorManager = container.get(EditorManager);
    const workspaceService = container.get(WorkspaceService);

});
```

### 编写一个测试

完整测试套件的示例如下。可以看到它如何遵循设计原则：

- **信息隐藏**：提供对象模型（EditorManager）来访问编辑器，不使用任何 DOM/CSS。
- **完整性**：API 提供访问既有编辑器和打开新编辑器的途径，
还有在新编辑器被创建或关闭时通知的事件。可以添加更多测试来验证它。
- **可扩展性**：EditorManager 并不实现所有内容，而是复用 WidgetOpenHandler 和 WidgetManager。
各种专用的 widget 管理器可以构建在其之上。
WidgetOpenHandler 和 WidgetManager 的改进会惠及所有专用 widget 管理器。
- **便利性**：测试没有使用 `WidgetManager.open` API 编写，
而是使用已封装此类逻辑的 `EditorManager.open`，从而保持测试简单。
- **稳健性**：测试依赖 `EditorManager.open` 在 widget 展示后 resolve。

```js
// @ts-check
describe('Editors', function () {

    const { assert } = chai;

    const { EditorManager } = require('@theia/editor/lib/browser/editor-manager');
    const Uri = require('@theia/core/lib/common/uri');
    const { WorkspaceService } = require('@theia/workspace/lib/browser/workspace-service');

    /** @type {import('inversify').Container} */
    const container = window['theia'].container;
    const editorManager = container.get(EditorManager);
    const workspaceService = container.get(WorkspaceService);

    before(() => editorManager.closeAll({ save: false });

    it('open', async () => {
        const root = (await workspaceService.roots)[0];
        assert.equal(editorManager.all.length, 0);
        await editorManager.open(new Uri.default(root.uri).resolve('package.json'), {
            mode: 'reveal'
        });
        assert.equal(editorManager.all.length, 1);
    });

});
```

框架确保测试只在应用就绪、工作区已初始化且所有偏好已加载后执行。

由于测试在同一进程内执行，
每个测试套件应负责把应用带入恰当的状态。
例如，示例测试在测试 open 函数之前会等待所有编辑器被关闭。

## 运行测试

> 参见 [theia CLI 文档](../dev-packages/cli/README.md#testing)了解如何使用 `test` 命令。

以下命令应从 `examples/browser` 执行。

运行一次测试：

    npm run test

该命令启动浏览器示例应用，并对其运行 `examples/api-tests` 中的测试。

### 检查测试

要检查（调试）测试：

    npm run test:debug

该命令运行测试，同时
打开 Chrome devtools，让你可以调试前端代码与测试文件。
对源码或测试做出更改后，重新加载页面即可运行新的代码与测试。

> 重要！由于测试依赖焦点，运行测试时请保持页面聚焦。

要同时检查测试与后端代码：

    npm run test:debug --inspect

像往常一样使用调试视图附加到后端服务器进行调试。

### 运行单个测试

把某个测试用例改为使用 `it.only` 而非 `it`，然后重新加载页面。
也可以在页面 URL 上添加 `?grep=foo` 查询参数，只运行匹配的测试。
