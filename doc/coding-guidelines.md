# 编码规范

## 缩进

每级缩进使用 4 个空格。

## 导入

使用 `organize imports` 排序导入，并确保导入正常工作（例如 *.ts 文件从 `/src/` 而非 `/lib/` 导入可能破坏构建）。

## 命名

<a name="pascalcase-type"></a>

* [1.](#pascalcase-type) `type` 名称使用 PascalCase。
<a name="pascalcase-enum"></a>
* [2.](#pascalcase-enum) `enum` 值使用 PascalCase。
<a name="camelcase-fn"></a>
* [3.](#camelcase-fn)  `function` 与 `method` 名称使用 camelCase。
<a name="camelcase-var"></a>
* [4.](#camelcase-var)  `property` 名称与 `local variables` 使用 camelCase。
<a name="whole-words-names"></a>
* [5.](#whole-words-names) 名称尽可能使用完整单词。
<a name="lower-case-names"></a>

```ts
// bad
const termWdgId = 1;

// good
const terminalWidgetId = 1;
```

* [6.](#lower-case-names) 文件名使用小写、短横线分隔（例如 `document-provider.ts`）。
<a name="file-name"></a>
* [7.](#file-name) 文件以其导出的主要类型命名。

> 为什么？应能通过文件名轻松找到类型。
<a name="one-large-class-per-file"></a>

* [7.1](#one-large-class-per-file) 避免一个文件包含许多大型类；把每个类放进自己的文件。

> 为什么？应能通过文件名轻松找到类。
<a name="unique-names"></a>

* [8.](#unique-names) 为类型和文件赋予唯一名称。使用具体的名称来实现。

> 为什么？为了避免文件与类型搜索中出现重复记录。

```ts
// bad
export interface TitleButton {}

// good
export interface QuickInputTitleButton {}
```

<a name="no_underscore_private"></a>

* [9.](#no_underscore_private) 不要用 "_" 作为私有属性前缀。例外情况：
<a name="underscore_accessors"></a>
  * [9.1](#underscore_accessors) 通过 get/set 暴露属性并为内部字段使用下划线。
<a name="underscore_json"></a>
  * [9.2](#underscore_json) 把内部数据附加到用户可见的 JSON 对象上。
<a name="event_names"></a>
* [10.](#event_names) 事件命名遵循 `on[Will|Did]VerbNoun?` 模式。名称表明事件即将发生（onWill）还是已经发生（onDid）、发生了什么（verb），以及上下文（noun）——除非上下文显而易见。
<a name="unique-context-keys"></a>
* [11.](#unique-context-keys) 为快捷键上下文与键赋予唯一名称，避免运行时冲突。使用具体的名称来实现。

```ts
// bad
export namespace TerminalSearchKeybindingContext {
    export const disableSearch = 'hideSearch';
}

// good
export namespace TerminalSearchKeybindingContext {
    export const disableSearch = 'terminalHideSearch';
}

// bad
const terminalFocusKey = this.contextKeyService.createKey<boolean>('focus', false);

// good
const terminalFocusKey = this.contextKeyService.createKey<boolean>('terminalFocus', false);
```

## 类型

<a name="no-expose-types"></a>

* [1.](#no-expose-types) 除非需要跨多个组件共享，否则不要导出 `types` 或 `functions`，[另见](#di-function-export)。
<a name="no-global-types"></a>
* [2.](#no-global-types) 不要向全局命名空间引入新的 `types` 或 `values`。
<a name="explicit-return-type"></a>
* [3.](#explicit-return-type) 始终声明返回类型，以避免因方法体改动导致的意外破坏性变更。

## 接口/符号

<a name="interfaces-no-i-prefix"></a>

* [1.](#interfaces-no-i-prefix) 接口不使用 `I` 前缀。与接口同名的实现使用 `Impl` 后缀。相关讨论见 [624](https://github.com/theia-ide/theia/issues/624)。
<a name="classes-over-interfaces"></a>
<a name="interfaces-over-classes"></a>
* [2.](#interfaces-over-classes) 对于意图可被替换的服务——即 Theia 中大多数公共服务——应声明接口 + 符号，并导出默认实现。这让采用者可以选择*子类化*默认实现，或提供*完全独立*的实现。把类同时用作注入令牌和类型会迫使采用者子类化，因为他们只能重绑定为可赋值给该类的类型。

> 为什么？带有任何 `private` 或 `protected` 成员的类是名义类型的，因此一个结构完全相同的独立类*不能*赋值给它——只有子类才行。接口 + 符号移除了这一约束：采用者既可以子类化默认实现，*也可以*从头实现该接口。测试也更容易：测试替身可以直接满足接口，而类令牌会迫使测试为了提供 mock 而子类化真实实现（并连带引入其依赖）。

```ts
// good - 接口 + 符号 + 默认实现
export const TaskDefinitionRegistry = Symbol('TaskDefinitionRegistry');
export interface TaskDefinitionRegistry {
    register(definition: TaskDefinition): void;
}

@injectable()
export class TaskDefinitionRegistryImpl implements TaskDefinitionRegistry {
    register(definition: TaskDefinition): void {
    }
}
bind(TaskDefinitionRegistryImpl).toSelf().inSingletonScope();
bind(TaskDefinitionRegistry).toService(TaskDefinitionRegistryImpl);

// 采用者现在可以任选其一：
rebind(TaskDefinitionRegistry).to(MyRegistryFromScratch);      // 独立实现
rebind(TaskDefinitionRegistry).to(MyRegistryExtendingDefault); // TaskDefinitionRegistryImpl 的子类
```

**例外情况**
<a name="class-token-internal"></a>

* [2.1](#class-token-internal) 对于确实属于内部、不作为扩展点的服务，可以直接用一个类同时充当令牌和类型，以避免接口 + 符号的繁琐。此时仍应将注入字段保持为 `protected`，使子类化仍然可行。

```ts
@injectable()
export class InternalCache {
    protected readonly entries = new Map<string, unknown>();
}
bind(InternalCache).toSelf().inSingletonScope();
```

## 注释

* 对 `functions`、`interfaces`、`enums` 和 `classes` 使用 JSDoc 风格注释

## 字符串

* 所有非[模板字面量](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)的字符串使用'单引号'

## null 与 undefined

使用 `undefined`；不要使用 `null`。

## 国际化/本地化

<a name="nls-localize"></a>

* [1.](#nls-localize) 始终使用 `nls.localize(key, defaultValue, ...args)` 函数本地化用户可见文本。

> 什么是用户可见文本？任何硬编码（而非计算得出）、可能以任何方式被用户看到的字符串，包括命令与菜单的标签、消息/通知/对话框、快速输入占位符或偏好项。

<a name="nls-localize-args"></a>

* [1.1.](#nls-localize-args) 消息参数应作为 `localize` 函数的 `args` 传递。它们被插入到本地化文本中形如 `{\d+}` 的占位符位置。例如 `{0}` 会替换为第一个 `arg`，`{1}` 替换为第二个，依此类推。

```ts
// bad
nls.localize('hello', `Hello there ${name}.`);

// good
nls.localize('hello', 'Hello there {0}.', name);
```

<a name="nls-localize-by-default"></a>

* [1.2.](#nls-localize-by-default) `nls.localizeByDefault` 函数仅凭默认值作为参数即可自动找到 VS Code 语言包中的翻译键，并翻译为当前使用的语言环境。如果 `nls.localizeByDefault` 无法为给定的默认值找到键，浏览器控制台会显示警告。如果 VSCode 中没有合适的翻译，就使用 `nls.localize` 函数并以 `theia/<package>/<id>` 语法提供新键。

```ts
// bad
nls.localize('vscode/dialogService/close', 'Close');

// good
nls.localizeByDefault('Close');
```

<a name="nls-utilities"></a>

* [2.](#nls-utilities) 尽可能使用工具函数：

  * 当标签需要自定义本地化键时，应使用 `Command.toLocalizedCommand`（内部使用 `nls.localize`）。
  * 当标签与类别已存在于 VS Code 语言包中时，应使用 `Command.toDefaultLocalizedCommand`（内部使用 `nls.localizeByDefault`）。

```ts
// bad
command: Command = { label: nls.localize('theia/my-package/myCommand', 'My Custom Label'), originalLabel: 'My Custom Label' };

// good - 使用带自定义本地化键的 toLocalizedCommand
command = Command.toLocalizedCommand(
    { id: 'my-command-id', label: 'My Custom Label' },
    'theia/my-package/myCommand'
);

// good - 当标签已存在于 VS Code 语言包时使用 toDefaultLocalizedCommand
command = Command.toDefaultLocalizedCommand(
    { id: 'my-command-id', label: 'Close Editor' }
);
```

<a name="nls-rich-content-markdown"></a>

* [3.](#nls-rich-content-markdown) 本地化富内容（HTML）时，使用 Markdown 而非 HTML 字符串。

> 为什么？Markdown 确保生成合法、格式良好的 HTML，并与 VS Code 处理富内容的方式一致（例如偏好项的详细描述）。Theia 已支持把 Markdown 渲染为 HTML。

```tsx
// bad - 逐段本地化 HTML 片段
<div className="content">
    <h1>{nls.localize('key1', 'Title')}</h1>
    <p>{nls.localize('key2', 'First paragraph.')}</p>
    <p>{nls.localize('key3', 'Second paragraph.')}</p>
</div>

// bad - 使用 dangerouslySetInnerHTML 配合 HTML 字符串
<div dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(nls.localize('key', `
        <h1>Title</h1>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
    `))
}} />

// good - 使用 MarkdownRenderer
import { MarkdownRenderer } from '@theia/core/lib/browser/markdown-rendering/markdown-renderer';
import { MarkdownString } from '@theia/core/lib/common/markdown-rendering/markdown-string';

@injectable()
export class MyService {
    @inject(MarkdownRenderer)
    protected readonly markdownRenderer: MarkdownRenderer;

    renderWelcome(): HTMLElement {
        const markdownContent = nls.localize('theia/mypackage/welcomeMessage', `
# Welcome to My Feature

This feature provides the following capabilities:
- **Feature A**: Description of feature A
- **Feature B**: Description of feature B

Learn more in the [documentation](https://theia-ide.org/docs/).
`);
        const rendered = this.markdownRenderer.render(new MarkdownString(markdownContent));
        return rendered.element;
    }
}
```

> [!NOTE]
> 当 Markdown 不适用而必须使用 HTML 时，确保在用 `dangerouslySetInnerHTML` 渲染前使用 `DOMPurify.sanitize()` 对内容消毒。

<a name="nls-preload"></a>

* [4.](#nls-preload) 不要在 preload 阶段的模块被加载时读取本地化字符串，即在模块顶层读取，而非稍后调用的函数中。本地化数据只有在 `Preloader` 运行后才可用，因此在那之前读取的字符串在整个会话中都会保持英文。

> 这同样适用于 preload 入口点导入的模块，正因如此，此类入口点应从声明符号的模块导入所需符号，而不是通过 `@theia/core/lib/common` 这类桶导出。`@theia/preload-localization-check` ESLint 规则会报告这两种情况。

```ts
// bad - 模块加载时即求值
export namespace ProgressMessage {
    export const Cancel = nls.localizeByDefault('Cancel');
}

// good - 需要该字符串时才求值
export namespace ProgressMessage {
    export function cancel(): string {
        return nls.localizeByDefault('Cancel');
    }
}
```

## 风格

* 使用箭头函数 `=>` 而非匿名函数表达式。
* 仅在必要时才给箭头函数参数加括号。例如 `(x) => x + x` 是错的，但以下写法正确：

```javascript
x => x + x
(x,y) => x + y
<T>(x: T, y: T) => x === y
```

* 循环与条件体始终用花括号包裹。
* 开花括号始终与需要它的语句位于同一行。
* 带括号的构造周围不应有空格。其中逗号、冒号和分号后跟一个空格。例如：

```javascript
for (var i = 0, n = str.length; i < 10; i++) { }
if (x < 10) { }
function f(x: number, y: string): void { }
```

* 每个变量语句只做一次声明 <br />（即使用 `var x = 1; var y = 2;` 而非 `var x = 1, y = 2;`）。
* `else` 与闭花括号位于同一行。

## 依赖注入

<a name="property-injection"></a>

* [1.](#property-injection) 使用属性注入而非构造注入。通过构造注入新增依赖是破坏性变更。
<a name="post-construct"></a>
* [2.](#post-construct) 使用带 `postConstruct` 装饰器的方法而非构造函数来初始化对象，例如注册事件监听器。

```ts
@injectable()
export class MyComponent {

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @postConstruct()
    protected init(): void {
        this.shell.activeChanged.connect(() => this.doSomething());
    }

}
```

<a name="singleton-scope"></a>

* [3.](#singleton-scope) 确保为单例实例添加 `inSingletonScope`，否则每次注入请求都会创建新实例。

```ts
// bad
bind(CommandContribution).to(LoggerFrontendContribution);

// good
bind(CommandContribution).to(LoggerFrontendContribution).inSingletonScope();
```

<a name="di-function-export"></a>

* [4.](#di-function-export) 不要导出函数，把它们转换为类方法。函数无法被重写以改变行为或绕过缺陷。

```ts
// bad
export function createWebSocket(url: string): WebSocket {
   ...
}

// good
@injectable()
export class WebSocketProvider {
   protected createWebSocket(url: string): WebSocket {
       ...
   }
}

@injectable()
export class MyWebSocketProvider extends WebSocketProvider {
   protected createWebSocket(url: string): WebSocket {
      // 创建带自定义选项的 web socket
   }
}
```

**例外情况**
<a name="di-convenient-function-export"></a>

* [4.1](#di-convenient-function-export) 基于稳定 API 的便利函数可以在相应命名空间中导出。

这种情况下客户端：

* 可以通过更换 API 实现来自定义行为
* 可以选择使用便利函数或直接使用 API

```ts
export namespace MonacoEditor {
    // 基于 editor manager API 获取 Monaco 编辑器的便利函数
    export function getCurrent(manager: EditorManager): MonacoEditor | undefined {
        return get(manager.currentEditor);
    }
    ...
}
```

<a name="di-json-function-export"></a>

* [4.2](#di-json-function-export) [4.1](#di-convenient-function-export) 的特例是 JSON 类型上的函数。

JSON 类型不应是*可实现的*，而只应是*可实例化的*。为避免序列化问题，它们不能有函数。

```ts
export interface CompositeTreeNode extends TreeNode {
    children: ReadonlyArray<TreeNode>;

    // bad - JSON 类型不应有函数
    getFirstChild(): TreeNode | undefined;
}

// good - JSON 类型可以有带函数的对应命名空间
export namespace CompositeTreeNode {
    export function getFirstChild(parent: CompositeTreeNode): TreeNode | undefined {
        return parent.children[0];
    }
    ...
}

// bad - JSON 类型不应被实现
export class MyCompositeTreeNode implements CompositeTreeNode {
    ...
}

// good - JSON 类型可以被扩展
export interface MyCompositeTreeNode extends CompositeTreeNode {
    ...
}
```

<a name="di-auxiliary-function-export"></a>

* [4.3](#di-auxiliary-function-export) 从可定制上下文中调用的辅助函数可以在相应命名空间中导出。

```ts
@injectable()
export class DirtyDiffModel {
    // 该方法可被覆盖。子类可以访问 `DirtyDiffModel.documentContentLines`。
    protected handleDocumentChanged(document: TextEditorDocument): void {
        this.currentContent = DirtyDiffModel.documentContentLines(document);
        this.update();
    }
}
export namespace DirtyDiffModel {
    // 辅助函数
    export function documentContentLines(document: TextEditorDocument): ContentLines {
        ...
    }
}
```

<a name="di-factory-over-new"></a>

* [5.](#di-factory-over-new) 在可注入类中，对适合定制的对象避免直接调用构造函数。改用注入的工厂。

> 为什么？工厂可以被采用者重绑定以定制创建的实例。如果管理器直接 `new XYZImpl()`，采用者必须子类化并重绑定整个管理器才能替换创建的对象。

对于实现细节，直接构造仍然没问题，例如简单值、集合和 `new Map()` 之类的辅助对象。

```ts
// bad
@injectable()
export class MyManager {

    protected createModel(): MyModelImpl {
        return new MyModelImpl();
    }

}

// good
export const MyModelFactory = Symbol('MyModelFactory');
export type MyModelFactory = () => MyModel;

@injectable()
export class MyManager {

    @inject(MyModelFactory)
    protected readonly modelFactory: MyModelFactory;

    protected createModel(): MyModel {
        return this.modelFactory();
    }

}
```

对于需要运行时参数的类，向工厂传递选项对象。以下简化示例受进程任务运行器启发：

```ts
export const TaskProcessOptions = Symbol('TaskProcessOptions');
export interface TaskProcessOptions {
    label: string;
    process: Process;
}

@injectable()
export class ProcessTask {
    constructor(@inject(TaskProcessOptions) protected readonly options: TaskProcessOptions) { }
}

export const TaskFactory = Symbol('TaskFactory');
export type TaskFactory = (options: TaskProcessOptions) => ProcessTask;

@injectable()
export class ProcessTaskRunner {

    @inject(TaskFactory)
    protected readonly taskFactory: TaskFactory;

    protected createTask(task: TaskConfiguration, process: Process): ProcessTask {
        return this.taskFactory({
            label: task.label,
            process
        });
    }

}

bind(ProcessTask).toSelf();
bind(TaskFactory).toFactory(ctx => (options: TaskProcessOptions) => {
    const child = new Container({ defaultScope: 'Singleton' });
    child.parent = ctx.container;
    child.bind(TaskProcessOptions).toConstantValue(options);
    return child.get(ProcessTask);
});
```

<a name="no-multi-inject"></a>

* [6.](#no-multi-inject) 不要使用 InversifyJS 的 `@multiInject`，使用 Theia 的工具 `ContributionProvider` 注入多个实例。

> 为什么？
>
> * `ContributionProvider` 是引入贡献点的官方途径。参见 `Contribution-Points`：<https://www.theia-ide.org/docs/services_and_contributions>
> * 如果某个标识符上没有绑定任何内容，multi-inject 会解析为 `undefined` 而非空数组。`ContributionProvider` 提供空数组。
> * 如果扩展者不使用 `inSingletonScope`，multi-inject 不保证注入相同实例。`ContributionProvider` 缓存实例以确保唯一性。
> * `ContributionProvider` 支持过滤。参见 `ContributionFilterRegistry`。

<a name="bind-root-contribution-provider"></a>

* [7.](#bind-root-contribution-provider) 在主（根）容器中绑定贡献提供者时，使用 `bindRootContributionProvider` 而非 `bindContributionProvider`。

`bindContributionProvider` 会捕获最先解析该提供者的容器的引用。如果该容器是子容器（例如为某个 widget 或临时绑定创建的），提供者将永久保留该子容器及其缓存的所有内容，导致内存泄漏。

`bindRootContributionProvider` 通过在构造提供者前先走到根容器来避免此问题，确保只保留长生命周期的根容器。

```ts
// bad — 有保留子容器引用的风险
bindContributionProvider(bind, MyContribution);

// good — 始终针对根容器解析
bindRootContributionProvider(bind, MyContribution);
```

当贡献本身限定于子容器而非主应用容器时，`bindContributionProvider` 仍然合适，例如：

* 由 `ConnectionContainerModule.create(...)` 创建的**连接级容器**，服务按连接绑定。
* **测试容器**，为单元测试构造的独立容器。

参见：<https://github.com/eclipse-theia/theia/issues/10877#issuecomment-1107000223>

## CSS

<a name="css-use-lower-case-with-dashes"></a>

* [1.](#css-use-lower-case-with-dashes) 使用 `lower-case-with-dashes` 格式。
<a name="css-prefix-global-classes"></a>
* [2.](#css-prefix-global-classes) 作为全局类使用时，以 `theia` 作为类前缀。
<a name="no-styles-in-code"></a>
* [3.](#no-styles-in-code) 不要在代码中定义样式。引入恰当的 CSS 类。

> 为什么？不重新编译代码就无法在开发者工具中调整这些样式。CSS 类可以在开发者工具中直接编辑。

## 主题

<a name="theming-no-css-color-variables"></a>

* [1.](#theming-no-css-color-variables) 不要引入 CSS 颜色变量。实现 `ColorContribution` 并使用 `ColorRegistry.register` 注册新颜色。
<a name="theming-no-css-color-values"></a>
* [2.](#theming-no-css-color-values) 不要在 CSS 中引入硬编码的颜色值。改为在 CSS 中引用 [VS Code 颜色](https://code.visualstudio.com/api/references/theme-color)：以 `--theia` 为前缀并把所有点替换为短横线。例如 `widget.shadow` 颜色可以在 CSS 中以 `var(--theia-widget-shadow)` 引用。

> [!NOTE]
> `ColorApplicationContribution` 会把每个注册的颜色同时以 `--theia-` 与 `--vscode-` 前缀设置到文档元素上，使得引用 `--vscode-` 前缀颜色变量（例如渲染 HTML 的内联样式中）的 VS Code 扩展在 Theia 中正常工作。
> Theia 自身代码应始终使用 `--theia-` 前缀；不要在 CSS 文件中添加临时的 `--vscode-` 别名。

<a name="theming-derive-colors-from-vscode"></a>
* [3.](#theming-derive-colors-from-vscode) 新颜色始终从既有 [VS Code 颜色](https://code.visualstudio.com/api/references/theme-color)派生。可以通过直接引用（如 `dark: 'widget.shadow'`）或变换（如 `dark: Color.lighten('widget.shadow', 0.4)`）从既有颜色派生新颜色。

> 为什么？否则无法保证新颜色能很好地融入新的 VSCode 颜色主题。
<a name="theming-theia-colors"></a>

* [4.](#theming-theia-colors) 只在具体的 Theia 主题中应用不同的颜色值，参见 [Light (Theia)](https://github.com/eclipse-theia/theia/blob/master/packages/monaco/data/monaco-themes/vscode/light_theia.json)、[Dark (Theia)](https://github.com/eclipse-theia/theia/blob/master/packages/monaco/data/monaco-themes/vscode/dark_theia.json) 与 [High Contrast (Theia)](https://github.com/eclipse-theia/theia/blob/master/packages/monaco/data/monaco-themes/vscode/hc_theia.json) 主题。
<a name="theming-variable-naming"></a>
* [5.](#theming-variable-naming) 变量命名遵循 `object.property` 模式。

```ts
// bad
'button.secondary.foreground'
'button.secondary.disabled.foreground'

// good
'secondaryButton.foreground'
'secondaryButton.disabledForeground'
```

## React

<a name="no-react-import-for-jsx"></a>

* [1.](#no-react-import-for-jsx) 不要仅为编写 JSX 而导入 React。所有 Theia 包都使用 React 的自动 JSX 运行时编译，编译器会自行生成运行时导入。只在使用 `React.*` 类型或 API 的地方导入 React，且始终从共享的再导出导入，以便使用唯一一个 React 实例。

```tsx
// bad - 导入未被使用，`noUnusedLocals` 会报告
import * as React from '@theia/core/shared/react';

export const Hint = () => <div className='hint' />;

// good - 纯 JSX 无需导入
export const Hint = () => <div className='hint' />;

// good - 因为使用了 `React.ReactNode` 所以导入 React
import * as React from '@theia/core/shared/react';

export class MyWidget extends ReactWidget {
  render(): React.ReactNode {
    return <div className='hint' />;
  }
}
```

<a name="no-bind-fn-in-event-handlers"></a>

* [2.](#no-bind-fn-in-event-handlers) 不要在事件处理器中绑定函数。
  * 如果想把状态传给事件处理器函数，可以提取一个 React 组件。

> 为什么？因为这样做会在每次渲染时创建事件处理器函数的新实例，破坏 React 元素缓存，导致重渲染和糟糕的性能。

```ts
// bad
class MyWidget extends ReactWidget {
  render(): React.ReactNode {
    return <div onClick={this.onClickDiv.bind(this)} />;
  }

  protected onClickDiv(): void {
    // do stuff
  }
}

// bad
class MyWidget extends ReactWidget {
  render(): React.ReactNode {
    return <div onClick={() => this.onClickDiv()} />;
  }

  protected onClickDiv(): void {
    // do stuff
  }
}

// very bad
class MyWidget extends ReactWidget {
  render(): React.ReactNode {
    return <div onClick={this.onClickDiv} />;
  }

  protected onClickDiv(): void {
    // do stuff, no `this` access
  }
}

// good
class MyWidget extends ReactWidget {
  render(): React.ReactNode {
    return <div onClick={this.onClickDiv} />
  }

  protected onClickDiv = () => {
    // do stuff, can access `this`
  }
}
```

## URI/路径

<a name="uri-over-path"></a>

* [1.](#uri-over-path) 在前端与后端之间传递 URI，绝不传递路径。URI 应在 JSON-RPC 服务中以字符串形式发送，例如 `RemoteFileSystemServer` 接受字符串而非 URI。

> 为什么？前端与后端可能运行在不同操作系统上，导致路径不兼容。URI 会被规范化，从而与操作系统无关。
<a name="frontend-fs-path"></a>

* [2.](#frontend-fs-path) 在前端从 URI 获取路径使用 `FileService.fsPath`。
<a name="backend-fs-path"></a>
* [3.](#backend-fs-path) 在后端从 URI 获取路径使用 `FileUri.fsPath`。绝不在前端使用它。
<a name="explicit-uri-scheme"></a>
* [4.](#explicit-uri-scheme) 始终为 URI 定义显式 scheme。

> 为什么？没有 scheme 的 URI 目前会回退到 `file` scheme；将来会直接导致运行时错误。
<a name="frontend-path"></a>

* [5.](#frontend-path) 在前端操作路径使用 Theia 的 `Path` API。不要使用 `path` 模块之类的 Node.js API。另见[代码组织规范](code-organization.md)。
<a name="backend-fs"></a>
* [6.](#backend-fs) 在后端使用 Node.js API 操作文件系统，如 `fs` 与 `fs-extra` 模块。

> 为什么？`FileService` 只用于向前端暴露文件系统能力。它与前端的需求和期望保持一致。在后端使用它是不可能的。
<a name="use-long-name"></a>

* [7.](#use-long-name) 使用 `LabelProvider.getLongName(uri)` 获取完整路径的系统级人类可读表示。不要使用 `uri.toString()` 或 `uri.path.toString()`。
<a name="use-short-name"></a>
* [8.](#use-short-name) 使用 `LabelProvider.getName(uri)` 获取简单文件名的系统级人类可读表示。
<a name="use-icon"></a>
* [9.](#use-icon) 使用 `LabelProvider.getIcon(uri)` 获取系统级文件图标。
<a name="uri-no-string-manipulation"></a>
* [10.](#uri-no-string-manipulation) 不要用 `string` 操作 URI 与路径。改用 `URI` 与 `Path` 能力，如 `join`、`resolve` 和 `relative`。

> 为什么？因为对象表示能正确处理边界情况，如尾部分隔符。

```ts
// bad
uriString + '/' + pathString

// good
new URI(uriString).join(pathString)

// bad
pathString.substring(absolutePathString.length + 1)

// good
new Path(absolutePathString).relative(pathString)
```

## 捆绑资源

<a name="bundled-resource-provider"></a>

* [1.](#bundled-resource-provider) 把随应用分发的资源交给应用之外的进程（如 shell、调试适配器或其他工具）之前，先通过 `BundledResourceProvider`（`@theia/core/lib/node`）解析。

> 为什么？以 `asar: true` 打包的 Electron 应用把资源保存在归档中。指向归档内部的路径只能通过 Electron 打过补丁的 `fs` 模块读取，外部进程读取会失败。该提供者会在归档之外的位置返回资源，若打包步骤未解包则将其提取。

```ts
// bad - 打包应用中路径指向 `app.asar` 内部
const scriptPath = path.join(__dirname, 'scripts', 'setup.sh');
spawn(shell, [scriptPath]);

// good
const scriptPath = await this.bundledResourceProvider.resolveExternalPath(path.join(__dirname, 'scripts'));
spawn(shell, [path.join(scriptPath, 'setup.sh')]);
```

> [!NOTE]
> 解析脚本所需的目录而非单个文件，使相互引用的文件保持在一起。

## 日志

<a name="use-named-loggers"></a>

* [1.](#use-named-loggers) 每当需要记录日志且处于 Inversify 上下文中时，注入具名 logger

```ts
// bad
@inject(ILogger)
protected readonly logger: ILogger;

// 没有具名 logger 时，这个调用等同于 'console.info'
this.logger.info(``);

// good
@inject(ILogger) @named('my-logger')
this.logger.info(``)
```

> 为什么？所有具名 logger 的日志级别可以单独配置，甚至可以在运行时更改。这对把日志过滤到开发者感兴趣的用例很有用。更多信息参见[这里](https://github.com/eclipse-theia/theia/tree/master/packages/core#logging-configuration)。

<a name="naming-loggers"></a>

* [2.](#naming-loggers) 命名 logger 时遵循以下约定：`[optional-purpose]package-name:class-name#optional-suffix`

```ts
// bad
@inject(ILogger) @named('MyClass')
protected readonly logger: ILogger;

// good
@inject(ILogger) @named('remote:BackendRemoteServiceImpl');
```

> 遵循该约定便于为用途、包和具体类配置日志级别。

## 工作区信任

Theia 支持[工作区信任](https://theia-ide.org/docs/workspace_trust/)，以保护用户免受不受信任仓库中潜在有害代码的影响。执行代码或从工作区加载外部内容的功能必须受工作区信任限制。

<a name="workspace-trust-check"></a>

* [1.](#workspace-trust-check) 执行工作区提供的代码（任务、调试配置、脚本）或加载工作区提供的内容（提示词模板、影响行为的配置文件）的功能，必须在继续之前检查工作区信任。使用 `WorkspaceTrustService` 检查或请求信任。

```ts
@inject(WorkspaceTrustService)
protected readonly workspaceTrustService: WorkspaceTrustService;

// 检查当前信任状态
if (!this.workspaceTrustService.isWorkspaceTrusted()) {
    return; // 禁用该功能
}

// 或向用户请求信任（尚未决定时显示对话框）
const trusted = await this.workspaceTrustService.requestWorkspaceTrust();
if (!trusted) {
    return;
}
```

<a name="workspace-trust-restrictions"></a>

* [2.](#workspace-trust-restrictions) 当功能在不受信任的工作区中受限时，注册一个 `WorkspaceRestrictionContribution`，使受限模式状态栏提示能告知用户哪些功能被禁用。

```ts
bind(WorkspaceRestrictionContribution).toDynamicValue((): WorkspaceRestrictionContribution => ({
    getRestrictions(): WorkspaceRestriction[] {
        return [{
            label: nls.localize('theia/myPackage/restricted', 'My Feature is disabled in Restricted Mode')
        }];
    }
})).inSingletonScope();
```

<a name="workspace-trust-context-key"></a>

* [3.](#workspace-trust-context-key) 当工作区信任需要控制菜单或命令可见性时，使用 `isWorkspaceTrusted` 上下文键。

## "To Do" 标签

有些情况下，我们在合并 PR 时无法妥善实现某些功能。此时，在代码中留下日后需要修复的提示有时是好的做法。可以通过在注释中放置"标签"字符串来实现。这让我们能找到日后需要再次修复的地方。目前，Theia 中使用两个"标准"标签：

* `@stubbed`
   该标签用于 VS Code API 实现。有时我们需要为某个 API 提供实现以便 VS Code 扩展正确启动，但此时无法提供底层功能的完整实现。这可能是因为某功能在 Theia 中没有对应 UI，或我们没有资源提供完整实现。
   在 JSDoc 注释中使用 `@stubbed` 标签会把该元素在 [API 状态页面](https://eclipse-theia.github.io/vscode-theia-comparator/status.html)上标记为"已存根（stubbed）"
* `@monaco-uplift`
   当某功能在升级到更新版本的 monaco 编辑器时可以添加或需要修复时，使用该标签。如果你知道我们需要的 Monaco 最低版本，可以把它作为提醒加上。
