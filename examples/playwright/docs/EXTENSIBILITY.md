# 可扩展性

Theia 是一个可扩展的工具平台，用于构建带有自定义用户界面元素（例如视图、编辑器、命令等）的自定义工具。
相应地，Theia 🎭 Playwright 支持为你的自定义用户界面元素添加专用的页面对象。
根据自定义组件的性质，你可以扩展通用基类对象（例如视图或编辑器），也可以从头开始添加自己的对象。

## 自定义命令或菜单项

命令和菜单项通过其标签处理，因此无需对页面对象框架做进一步定制。
只需通过菜单或快速命令与它们交互即可。

```typescript
const app = await TheiaAppLoader.load({ playwright, browser });
const menuBar = app.menuBar;

const yourMenu = await menuBar.openMenu('Your Menu');
const yourItem = await mainMenu.menuItemByName('Your Item');

expect(await yourItem?.hasSubmenu()).toBe(true);
```

## 自定义 Theia 应用程序

页面对象模型的主入口是 `TheiaApp`。
要为它添加更多能力，例如一个自定义工具栏，可以扩展 `TheiaApp` 类，并为自定义工具栏页面对象添加一个访问器。

```typescript
export class MyTheiaApp extends TheiaApp {
  readonly toolbar = new MyToolbar(this);
}

export class MyToolbar extends TheiaPageObject {
  selector = 'div#myToolbar';
  async clickItem1(): Promise<void> {
    await this.page.click(`${this.selector} .item1`);
  }
}

const ws = new TheiaWorkspace([path.resolve(__dirname, '../../src/tests/resources/sample-files1']);
const app = await TheiaAppLoader.load({ playwright, browser }, ws, MyTheiaApp);
await app.toolbar.clickItem1();
```

## 自定义视图和状态指示器

许多自定义 Theia 应用程序会添加专用的视图、编辑器或状态指示器。
为了在测试框架中支持这些自定义用户界面元素，你可以为它们添加专用的页面对象。
通常，这些针对你的自定义用户界面元素的专用页面对象是通用类 `TheiaView`、`TheiaEditor` 等的子类。
因此，它们会继承视图或编辑器的通用行为，例如激活或关闭它们、查询标题、检查编辑器是否为脏状态等。

让我们以一个自定义视图为例。这个自定义视图有一个我们希望能够点击的按钮。

```typescript
export class MyView extends TheiaView {
  constructor(public app: TheiaApp) {
    super(
      {
        tabSelector: '#shell-tab-my-view', // the id of the tab
        viewSelector: '#my-view-container', // the id of the view container
        viewName: 'My View', // the user visible view name
      },
      app
    );
  }

  async clickMyButton(): Promise<void> {
    await this.activate();
    const viewElement = await this.viewElement();
    const button = await viewElement?.waitForSelector('#idOfMyButton');
    await button?.click();
  }
}
```

首先，我们创建一个继承 `TheiaView` 所有通用视图能力的新类。
我们必须指定标签页的选择器以及我们在视图实现中指定的视图容器元素的选择器。
可选地，我们可以指定一个视图名称，它对应 Theia 视图菜单中的标签。
这些信息足以打开、关闭、查找该视图并与之交互。

此外，我们可以为自定义视图想要使用的特定操作和查询添加更多自定义方法。
例如，上面的 `MyView` 引入了一个允许点击按钮的方法。

要在测试中使用这个自定义页面对象，我们在通过 `app.openView` 打开视图时，将自定义页面对象作为参数传入。

```typescript
const app = await TheiaAppLoader.load({ playwright, browser });
const myView = await app.openView(MyView);
await myView.clickMyButton();
```

自定义编辑器采用类似的方法。唯一的区别是我们改为扩展 `TheiaEditor`，并将自定义页面对象作为参数传递给 `app.openEditor`。
作为自定义视图和编辑器的参考，请参阅现有的页面对象，例如 `TheiaPreferenceView`、`TheiaTextEditor` 等。

自定义状态指示器通过相同的机制支持。它们通过 `TheiaApp.statusBar` 访问。

```typescript
const app = await TheiaAppLoader.load({ playwright, browser });
const problemIndicator = await app.statusBar.statusIndicator(
  TheiaProblemIndicator
);
const numberOfProblems = await problemIndicator.numberOfProblems();
expect(numberOfProblems).to.be(2);
```
