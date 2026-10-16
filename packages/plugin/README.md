<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - PLUGIN 扩展</h2>

<hr />

</div>

## 描述

`@theia/plugin` 扩展为应用程序贡献插件 API。

### 插件 API

用于处理已安装插件的命名空间。插件由一个 Plugin 接口表示，可以对它进行反射。插件作者可以通过在 `start` 调用中返回其 API 公共表面，向其他插件提供 API。

例如，某个插件导出它的 API：

```javascript
export function start() {
    let api = {
        sum(a, b) {
            return a + b;
        },
        mul(a, b) {
            return a * b;
        }
    };
    // 'export' public api-surface
    return api;
}
```

另一个插件可以使用该 API：

```javascript
let mathExt = theia.plugins.getPlugin('genius.math');
let importedApi = mathExt.exports;
console.log(importedApi.mul(42, 1));
```

此外，插件 API 还允许访问插件的 `package.json` 内容。

示例：

```javascript
const fooPlugin = plugins.getPlugin('publisher.plugin_name');
const fooPluginPackageJson = fooPlugin.packageJSON;
console.log(fooPluginPackageJson.someField);
```

### 命令 API

 命令是某个函数的唯一标识符，用户可以通过键盘快捷键、菜单操作或直接调用来执行它。

可以使用 [registerCommand](#commandsregistercommand) 和
[registerTextEditorCommand](#commandsregistertexteditorcommand) 函数添加命令。
注册可以分为两步：第一步注册不带处理器的命令，第二步按命令 ID 注册处理器。

任何已贡献的命令都可供任何插件使用，可以通过 [executeCommand](#commandsexecutecommand) 函数调用命令。

注册命令的简单示例：

```typescript
theia.commands.registerCommand({id:'say.hello.command'}, ()=>{
    console.log("Hello World!");
});
```

调用命令的简单示例：

```typescript
theia.commands.executeCommand('core.about');
```

### 窗口

用于处理窗口和编辑器、显示消息和获取用户输入的通用命名空间。

#### Quick Pick（快速选择）

用于让用户从列表中选择某个值的函数。

使用示例：

```typescript
//configure quick pick options
 const option: theia.QuickPickOptions = {
        machOnDescription: true,
        machOnDetail: true,
        canPickMany: false,
        placeHolder: "Select string:",
        onDidSelectItem: (item) => console.log(`Item ${item} is selected`)
    };
 // call Theia api to show quick pick
theia.window.showQuickPick(["foo", "bar", "foobar"], option).then((val: string[] | undefined) => {
        console.log(`Quick Pick Selected: ${val}`);
    });
```

#### Input Box（输入框）

用于获取用户输入的函数。

使用示例：

```typescript
const option: theia.InputBoxOptions = {
    prompt:"Hello from Plugin",
    placeHolder:"Type text there",
    ignoreFocusOut: false,
    password: false,
    value:"Default value"
};
theia.window.showInputBox(option).then((s: string | undefined) => {
    console.log(typeof s !== 'undefined'? s : "Input was canceled");
});
```

#### 通知 API

 通知用于向用户显示信息消息。
 可选地提供一组条目，它们将作为可点击的按钮呈现。

可以使用 [showInformationMessage](#windowshowinformationmessage)、
[showWarningMessage](#windowshowwarningmessage) 和 [showErrorMessage](#windowshowerrormessage) 函数显示通知。

显示信息消息的简单示例：

```typescript
theia.window.showInformationMessage('Information message');
```

显示带按钮的信息消息的简单示例：

```typescript
theia.window.showInformationMessage('Information message', 'Btn1', 'Btn2').then(result => {
    console.log("Click button", result);
});
```

#### 窗口状态 API

可以在插件中跟踪 IDE 窗口的状态。窗口状态定义如下：

```typescript
interface WindowState {
    readonly focused: boolean;
}
```

要按需读取状态，可以使用只读变量：

```typescript
theia.window.state
```

要跟踪窗口活动，请订阅 `onDidChangeWindowState` 事件：

```typescript
const disposable = theia.window.onDidChangeWindowState((windowState: theia.WindowState) => {
    console.log('Window focus changed: ', windowState.focused);
});
```

#### 状态栏 API

 状态栏向用户显示消息，并支持图标替换。

可以使用 [setStatusBarMessage](#windowsetstatusbarmessage) 和
[createStatusBarItem](#windowcreatestatusbaritem) 函数显示状态栏消息。

显示状态栏消息的简单示例：

```typescript
theia.window.setStatusBarMessage('test status bar item');
```

使用 statusBarItem 显示状态栏消息的简单示例：

```typescript
  const item = theia.window.createStatusBarItem(theia.StatusBarAlignment.Right, 99);
        item.text = 'test status bar item';
        item.show();
```

#### 输出通道 API

 可以显示一个用于展示只读文本信息的容器：

```typescript
   const channel = theia.window.createOutputChannel('test channel');
         channel.appendLine('test output');

```

#### 环境 API

环境 API 允许读取 IDE 的环境变量和查询参数。

按名称获取环境变量可以使用：

```typescript
theia.env.getEnvVariable('NAME_OF_ENV_VARIABLE').then(value => {
    // process the value here
}
```

如果环境变量不存在，将返回 `undefined`。

API 的这一部分还公开了加载 IDE 页面时所用的全部查询参数（已经过 URI 解码）。可以按名称获取查询参数：

```typescript
theia.env.getQueryParameter('NAME_OF_QUERY_PARAMETER');
```

如果查询参数不存在，将返回 `undefined`。

也可以获取所有查询参数的映射：

```typescript
theia.env.getQueryParameters();
```

注意，同一个名称可能对应一个值数组，因为它可能被指定了不止一次（例如 `localhost:3000?foo=bar&foo=baz`）。

### 终端

使用指定参数创建新终端的函数：

```typescript
const terminal = theia.window.createTerminal("Bash terminal", "/bin/bash", ["-l"]);
```

其中：

- 第一个参数 - 终端的名称。
- 第二个参数 - 可执行 shell 的路径。
- 第三个参数 - 用于配置可执行 shell 的参数。

也可以使用特定选项创建终端：

```typescript
const options: theia.TerminalOptions {
    name: "Bash terminal",
    shellPath: "/bin/bash";
    shellArgs: ["-l"];
    cwd: "/projects";
    env: { "TERM": "screen" };
};
```

其中：

- "shellPath" - 可执行 shell 的路径，例如 "/bin/bash"、"bash"、"sh" 等。
- "shellArgs" - shell 命令参数，例如不带登录："-l"。如果你定义了 shell 命令 "/bin/bash" 并设置 shell 参数 "-l"，则会创建命令为 "/bin/bash -l" 的终端进程。客户端将连接到该进程的 stdin/stdout 与用户交互。
- "cwd" - 当前工作目录；
- "env" - 终端进程的环境变量，例如 TERM - 终端窗口能力的标识符。

使用上文定义的 theia.TerminalOptions 创建新终端的函数：

```typescript
const terminal = theia.window.createTerminal(options);
```

创建的终端不会附加到面板。要将创建的终端应用到面板，请使用 "show" 方法：

```typescript
terminal.show();
```

要隐藏带有已创建终端的面板，请使用 "hide" 方法：

```typescript
terminal.hide();
```

向终端发送文本：

```typescript
terminal.sendText("Hello, Theia!", false);
```

其中：

- 第一个参数 - 文本内容。
- 第二个参数 - 如果为 true，终端会在文本后应用换行符，否则只发送文本。

销毁终端：

```typescript
terminal.dispose();
```

订阅终端关闭事件：

```typescript
theia.window.onDidCloseTerminal((term) => {
    console.log("Terminal closed.");
});
```

按 Id 检测终端销毁：

```typescript
terminal.processId.then(id => {
    theia.window.onDidCloseTerminal(async (term) => {
        const currentId = await term.processId;
        if (currentId === id) {
            console.log("Terminal closed.", id);
        }
    }, id);
});
```

#### 首选项 API

首选项 API 允许读取或更新用户和工作区的首选项。

获取首选项：

```typescript
// editor preferences
const preferences = theia.workspace.getConfiguration('editor');

// retrieving values
const fontSize = preferences.get('tabSize');
```

修改首选项：

```typescript
preferences.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('editor.tabSize')) {
        console.log('Property "editor.tabSize" is changed');
    }
});

preferences.update('tabSize', 2);
```

### 语言 API

#### 诊断

要获取所有现有的诊断，应使用 `getDiagnostics` 调用。如果需要特定 URI 的诊断，可以通过以下调用获取：

```typescript
const diagnostics = theia.languages.getDiagnostics(uriToResource)
```

要获取所有诊断，请使用：

```typescript
const diagnostics =  theia.languages.getDiagnostics()
```

例如，以下代码将获取编辑器中当前文件的诊断（假设文件已经打开）：

```typescript
const diagnosticsForCurrentFile = theia.languages.getDiagnostics(theia.window.activeTextEditor.document.uri)
```

如果未找到任何诊断，将返回空数组。

注意，`getDiagnostics` 调用返回的数组是只读的。

要跟踪诊断的变更，应使用 `onDidChangeDiagnostics` 事件。在事件处理器中可以获取诊断发生变更的 URI 列表。示例：

```typescript
disposables.push(
    theia.languages.onDidChangeDiagnostics((event: theia.DiagnosticChangeEvent) => {
        // handler code here
    }
);
```

此外，还可以添加自己的诊断。为此，应先创建诊断集合：

```typescript
const diagnosticsCollection = theia.languages.createDiagnosticCollection(collectionName);
```

集合名称可以省略。在这种情况下，名称将自动生成。

创建集合后，就可以操作诊断了。集合对象暴露了所有需要的方法：`get`、`set`、`has`、`delete`、`clear`、`forEach` 和 `dispose`。

`get`、`has` 和 `delete` 按给定的资源 URI 执行相应操作。`clear` 移除集合中所有 URI 的全部诊断。

`set` 的行为更复杂。要替换给定 URI 的所有诊断，应使用以下调用：

```typescript
diagnosticsCollection.set(uri, newDiagnostics)
```

如果传入 `undefined` 而非诊断数组，该调用将清除此集合中给定 URI 的诊断（与 `delete` 相同）。
还可以一次性设置所有诊断（将替换已有的诊断）。为此，应将格式为 `[uri, diagnostics]` 的元组数组作为 `set` 的参数传入：

```typescript
const changes: [Uri, Diagnostic[] | undefined][] = [];

changes.push([uri1, diagnostics1]);
changes.push([uri2, diagnostics2]);
changes.push([uri3, undefined]);
changes.push([uri1, diagnostics4]); // uri1 again

diagnosticsCollection.set(changes);
```

如果同一个 URI 使用了多次，相应的诊断将被合并。遇到 `undefined` 时，之前的（而非之后的）诊断会被清除。如果传入 `undefined` 而非元组数组，则整个集合将被清空。

要遍历集合中的所有诊断，可以使用 `forEach` 方法：

```typescript
diagnosticsCollection.forEach((uri, diagnostics) => {
    // code here
}
```

当不再需要该集合时，应使用 `dispose` 方法。如果在销毁之后尝试进行任何操作，将抛出错误。

#### 签名帮助

要通过插件提供签名帮助，需要注册提供方。注册需要 3 项内容：

- 文档选择器，描述应将其应用于哪些文件
- 完成实际工作的处理器
- 触发字符，输入这些字符后应调用处理器。通常使用符号 `(` 和 `,`。

注册签名帮助提供方的示例：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler = { provideSignatureHelp: signatureHelpHandler };
const triggerChars = '(,';

const disposable = theia.languages.registerSignatureHelpProvider(documentsSelector, handler, ...triggerChars);

...

function signatureHelpHandler(document: theia.TextDocument, position: theia.Position): theia.ProviderResult<theia.SignatureHelp> {
    // code here
}
```

签名信息的示例：

```typescript
{
    activeSignature: 0,
    activeParameter: 0,
    signatures: [
        {
            label: 'functionName(param1: number, param2: string, param3: boolean)',
            documentation: new theia.MarkdownString('What **this** function does'),
            parameters: [
                {
                    label: 'param1: number',
                    documentation: new theia.MarkdownString('Some number. Should not be `undefined`')
                },
                {
                    label: 'param2: string',
                    documentation: 'Some string'
                },
                {
                    label: 'param3: boolean',
                    documentation: 'Some flag'
                }
            ]
        }
    ]
}
```

注意：

- `activeSignature` 和 `activeParameter` 从零开始计数。
- label 通常是完整的方法签名。
- 对于 documentation 字段，markdown 仅部分支持（不支持标签）。
- 参数的 label 应当是签名 label 的子串。在这种情况下，当参数处于活动状态时，该子串会在主 label 中高亮显示。否则没有任何效果。

当签名帮助弹窗显示时，每次参数编辑甚至光标在签名内移动时都会调用处理器。如果你有较大的对象，明智的做法是缓存它们，或至少复用其中的一部分。

要从提供方隐藏弹窗，只需返回 `undefined`。

如果注册了多个提供方，链条会一直执行，直到某个提供方返回结果。对本次调用而言，后续的提供方将被忽略。

#### 悬停消息

要贡献悬停提示，只需要提供一个可以用 `TextDocument` 和 `Position` 调用并返回悬停信息的函数。注册时使用文档选择器，它可以是一个语言 ID（'typescript'、'javascript' 等），也可以是更复杂的过滤器，例如 `{scheme: 'file', language: 'typescript'}`。

例如，

```typescript
theia.languages.registerHoverProvider('typescript', {
    provideHover(doc: theia.TextDocument, position: theia.Position, token: theia.CancellationToken) {
        return new theia.Hover('Hover for all **typescript** files.');
    }
});
```

将为所有 `typescript` 文件显示悬停消息。

下面的代码将光标下的单词放入悬停消息：

```typescript
theia.languages.registerHoverProvider({scheme: 'file'}, {
    provideHover(doc: theia.TextDocument, position: theia.Position, token: theia.CancellationToken) {
        const range = doc.getWordRangeAtPosition(position);
        const text = doc.getText(range);
        return new theia.Hover(text);
    }
});
```

#### 文档高亮提供方

可以在插件中为符号提供文档高亮来源。
为此应注册相应的提供方。例如：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler: theia.DocumentHighlightProvider = { provideDocumentHighlights: provideDocumentHighlightsHandler };

const disposable = theia.languages.registerDocumentHighlightProvider(documentsSelector, handler);

...

function provideDocumentHighlightsHandler(document: theia.TextDocument, position: theia.Position): theia.ProviderResult<theia.DocumentHighlight[]> {
    // code here
}
```

可以返回多个来源，但对大多数情况而言一个就足够了。返回 `undefined` 表示不提供任何内容。

#### 定义提供方

可以在插件中为符号提供定义来源。
为此应注册相应的提供方。例如：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler: theia.DefinitionProvider = { provideDefinition: provideDefinitionHandler };

const disposable = theia.languages.registerDefinitionProvider(documentsSelector, handler);

...

function provideDefinitionHandler(document: theia.TextDocument, position: theia.Position): theia.ProviderResult<theia.Definition | theia.DefinitionLink[]> {
    // code here
}
```

每当用户执行 `Go To Definition`（转到定义）命令时，都会调用该处理器。
可以返回多个来源，但对大多数情况而言一个就足够了。返回 `undefined` 表示不提供任何内容。

#### 声明提供方

可以在插件中为符号提供声明。
为此可以注册相应的提供方。例如：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler: theia.DeclarationProvider = { provideDeclaration: provideDeclarationHandler };

const disposable = theia.languages.registerDeclarationProvider(documentsSelector, handler);

...

function provideDeclarationHandler(document: theia.TextDocument, position: theia.Position): theia.ProviderResult<theia.Definition | theia.DefinitionLink[]> {
    // code here
}
```

每当用户执行 `Go To Declaration`（转到声明）命令时，都会调用该处理器。
可以返回多个来源，但对大多数情况而言一个就足够了。返回 `undefined` 表示不提供任何内容。

#### 实现提供方

可以在插件中为符号提供实现来源。
为此应注册相应的提供方。例如：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler: theia.ImplementationProvider = { provideImplementation: provideImplementationHandler };

const disposable = theia.languages.registerImplementationProvider(documentsSelector, handler);

...

function provideImplementationHandler(document: theia.TextDocument, position: theia.Position): theia.ProviderResult<theia.Definition | theia.DefinitionLink[]> {
    // code here
}
```

可以返回多个来源，但对大多数情况而言一个就足够了。返回 `undefined` 表示不提供任何内容。

#### 类型定义提供方

可以在插件中为符号提供类型定义来源。
为此应注册相应的提供方。例如：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler: theia.TypeDefinitionProvider = { provideTypeDefinition: provideTypeDefinitionHandler };

const disposable = theia.languages.registerTypeDefinitionProvider(documentsSelector, handler);

...

function provideTypeDefinitionHandler(document: theia.TextDocument, position: theia.Position): theia.ProviderResult<theia.Definition | theia.DefinitionLink[]> {
    // code here
}
```

每当用户执行 `Go To Type Definition`（转到类型定义）命令时，都会调用该处理器。
可以返回多个来源，但对大多数情况而言一个就足够了。返回 `undefined` 表示不提供任何内容。

#### 引用提供方

可以在插件中为符号提供引用来源。
为此应注册相应的提供方。例如：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const handler: theia.ReferenceProvider = { provideReferences: provideReferencesHandler };

const disposable = theia.languages.registerReferenceProvider(documentsSelector, handler);

...

function provideReferencesHandler(document: theia.TextDocument, position: theia.Position, context: theia.ReferenceContext): theia.ProviderResult<theia.Location[]> {
    // code here
}
```

每当用户执行 `Find All References`（查找所有引用）命令时，都会调用该处理器。
可以返回多个来源。返回 `undefined` 表示不提供任何内容。

#### 文档链接提供方

文档链接提供方允许添加自定义的链接检测逻辑。

注册文档链接提供方的示例：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const provider = { provideDocumentLinks: provideLinks };

const disposable = theia.languages.registerDocumentLinkProvider(documentsSelector, provider);

...

function provideLinks(document: theia.TextDocument): theia.ProviderResult<theia.DocumentLink[]> {
    // code here
}
```

#### Code Lens 提供方

Code Lens 提供方允许添加自定义的透镜检测逻辑。

注册 Code Lens 提供方的示例：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const provider = { provideCodeLenses: provideLenses };

const disposable = theia.languages.registerCodeLensProvider(documentsSelector, provider);

...

function provideLenses(document: theia.TextDocument): theia.ProviderResult<theia.CodeLens[]> {
    // code here
}
```

#### 代码符号提供方

文档符号提供方允许添加自定义的符号检测逻辑。

注册代码符号提供方的示例：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const provider = { provideDocumentSymbols: provideSymbols };
const metadata = { label: 'providerLabel' }

const disposable = theia.languages.registerDocumentSymbolProvider(documentsSelector, provider, metadata);

...

function provideSymbols(document: theia.TextDocument): theia.ProviderResult<theia.SymbolInformation[] | theia.DocumentSymbol[]> {
    // code here
}
```

#### 工作区符号提供方

工作区符号提供方允许你为符号搜索功能注册符号。

如果从 provideWorkspaceSymbols 返回的所有 SymbolInformation 都带有 location，则不需要 resolveWorkspaceSymbol。否则，需要 resolveWorkspaceSymbol 来解析 SymbolInformation 的 location。

注册工作区符号提供方的示例：

```typescript
theia.languages.registerWorkspaceSymbolProvider({
    provideWorkspaceSymbols(query: string): theia.SymbolInformation[] {
        return [new theia.SymbolInformation('my symbol', 4, new theia.Range(new theia.Position(0, 0), new theia.Position(0, 0)), theia.Uri.parse("some_uri_to_file"))];
    }
} as theia.WorkspaceSymbolProvider);
```

在这种情况下不需要 resolveWorkspaceSymbol，因为我们为 provideWorkspaceSymbols 返回的每个符号都提供了 location。

```typescript
theia.languages.registerWorkspaceSymbolProvider({
    provideWorkspaceSymbols(query: string): theia.SymbolInformation[] {
        return [new theia.SymbolInformation('my symbol', 4, 'my container name', new theia.Location(theia.Uri.parse("some_uri_to_file"), undefined))];
    },
    resolveWorkspaceSymbol(symbolInformation: theia.SymbolInformation): theia.SymbolInformation {
        symbolInformation.location.range = new theia.Range(new theia.Position(0, 0), new theia.Position(0, 0));
        return symbolInformation;
    }
} as theia.WorkspaceSymbolProvider);
```

这里需要 resolveWorkspaceSymbol，因为我们没有为 provideWorkspaceSymbol 返回的每个符号都提供 location。

#### 折叠

折叠范围提供方允许你添加逻辑，以折叠和展开源代码的自定义区域。

注册折叠范围提供方的示例：

```typescript
const documentsSelector: theia.DocumentSelector = { scheme: 'file', language: 'typescript' };
const provider = { provideFoldingRanges: provideRanges };

const disposable = theia.languages.registerFoldingRangeProvider(documentsSelector, provider);

...

function provideRanges(document: theia.TextDocument): theia.ProviderResult<theia.FoldingRange[]> {
    // code here
}
```

## 更多信息

- [`@theia/plugin` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_plugin.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
