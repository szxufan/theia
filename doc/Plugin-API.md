# Theia 插件 API 与 VS Code 扩展支持

Eclipse Theia 为可扩展性而设计。
因此，它支持[三种扩展机制：VS Code 扩展、Theia 扩展和 Theia 插件](https://theia-ide.org/docs/extensions/)。
下文我们聚焦于 Theia 插件的机制，以及 Theia 与 [VS Code Extension API](https://code.visualstudio.com/api) 的兼容性，以便在 Theia 中运行 VS Code 扩展。
本文档旨在帮助扩展 Theia 插件 API 的开发者：或通过插件增强 Theia 的可扩展性，或/且提升 Theia 对 VS Code Extension API 的覆盖率——从而让更多 VS Code 扩展能在 Theia 中使用。

Theia 插件与 VS Code 扩展都可以在运行时安装到 Theia 实例中或从中移除。
有三类插件，分别面向不同的扩展用例：

- VS Code 插件可以通过明确定义的 API 扩展 Theia 的众多面向用户的能力，如主题、语言支持、调试器、树视图等。
_在 VS Code 本身的语境中这些被称为"扩展"（extensions），不要与构建期的 Theia 扩展混淆。_
- Theia 插件是 VS Code 插件的超集，使用大体兼容的 API，并带有一些不适用于 VS Code 的额外能力
- 无头（headless）插件面向应用特定的扩展点。
它们不像前两类插件那样扩展 Theia 面向用户的能力，而是支撑应用特定的服务，而这些服务往往又进一步扩展面向用户的能力。
关于无头插件的更多信息[详见下文](#headless-plugins)。

插件运行在一个"宿主进程"内。
这是 Theia 后端派生的子进程，用于把插件与主进程隔离。
这种封装防止插件随意访问 Theia 服务，避免损害 Theia 主要功能的性能或功能。
插件通过其宿主进程内提供的插件 API（如果有）来访问 Theia 的状态与服务。

Theia 的插件 API 力求成为 VS Code 扩展 API 的超集，以便把 VS Code 扩展作为 Theia 插件运行。
许多情况下这已经运作良好。
[vscode-theia-comparator 仓库](https://github.com/eclipse-theia/vscode-theia-comparator)每天生成一份 API 兼容性报告。
请注意该报告只在接口层面检查 API——不检查接口实现行为的兼容性。
要确认某个扩展被完全支持，建议自行测试。
欢迎针对缺失或不完整的 API [提交新 issue](https://github.com/eclipse-theia/theia/issues/new/choose)，并通过 [pull request](https://github.com/eclipse-theia/vscode-theia-comparator/compare) 在报告中链接它们。
报告在此：

[![API 兼容性](https://img.shields.io/badge/API_Compatibility-Status_Report-blue.svg?style=flat-curved)](https://eclipse-theia.github.io/vscode-theia-comparator/status.html)

## 相关 Theia 源码

- [plugin](https://github.com/eclipse-theia/theia/tree/master/packages/plugin)：包含 theia 插件命名空间的 API 声明。
- [plugin-ext](https://github.com/eclipse-theia/theia/tree/master/packages/plugin-ext)：既包含运行插件并为其提供 API 命名空间的机制，也包含 'theia' 插件 API 的实现。
- [plugin-ext-vscode](https://github.com/eclipse-theia/theia/tree/master/packages/plugin-ext-vscode)：包含 VS Code 插件 API 的实现。
由于 VS Code 与 Theia API 大体兼容，其初始化先传递 Theia 插件 API，再在 API 对象上覆盖少数成员以兼容 VS Code 扩展（参见 [plugin-ext-vscode/src/node/plugin-vscode-init.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext-vscode/src/node/plugin-vscode-init.ts)）。
- [plugin-ext-headless](https://github.com/eclipse-theia/theia/tree/master/packages/plugin-ext-headless)：包含在专用的后端插件宿主进程中运行"无头"插件的机制。

## API 的定义与暴露

插件 API 声明在 [plugin](https://github.com/eclipse-theia/theia/tree/master/packages/plugin) 包的 [theia.d.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin/src/theia.d.ts) 文件中。

plugin 包中定义的 API 的实现，是通过操纵插件容器中的模块加载机制来构造 API 模块对象，进而传递给插件的。
这使得 Theia 插件可以在 node 中通过 `@theia/plugin` 模块导入 API，或在 web worker 中通过 `theia` 命名空间导入。
对 VS Code 插件而言，同一 API 通过它们所预期的 `vscode` 命名空间提供。

插件容器是 node 进程（见 [plugin-ext/src/hosted/node/plugin-host.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/hosted/node/plugin-host.ts)）和 web worker（[plugin-ext/src/hosted/browser/worker/worker-main.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/hosted/browser/worker/worker-main.ts)）。
它们在以下位置暴露 API：

- 浏览器：在 [plugin-ext/src/hosted/browser/worker/worker-main.ts](https://github.com/eclipse-theia/theia/blob/541b300adc029ab1dd729da1ca49179ace1447b2/packages/plugin-ext/src/hosted/browser/worker/worker-main.ts#L192) 中把 API 对象赋给 `window['theia']`。
- 后端/Node：在 [plugin-ext/src/hosted/node/scanners/backend-init-theia.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/hosted/node/scanners/backend-init-theia.ts) 中为 Theia 插件重写模块加载，在 [plugin-ext-vscode/src/node/plugin-vscode-init.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext-vscode/src/node/plugin-vscode-init.ts) 中为 VS Code 插件重写模块加载。

**注意**实现新的插件 API 时无需修改这些位置。

## 插件 API 与 Theia 之间的通信

由于插件运行在独立进程中，插件 API 无法直接与 Theia 通信。
插件进程与 Theia 主进程改为通过 RPC 通信。

对 VS Code 插件和 Theia 插件，使用如下的 "Main-Ext" 模式。
每个连接的前端对应一个插件宿主进程实例。

![VS Code 插件场景下 Theia 与插件 API 的通信](./images/plugin-api-diagram.svg)

`Ext` 指运行在隔离宿主进程内、插件一侧的代码。
因此，这些代码不能直接使用任何 Theia 服务（例如通过依赖注入）。
`Main` 指运行在 Theia 前端、**浏览器**上下文中的代码。
因此它可以像[构建期 Theia 扩展](https://theia-ide.org/docs/authoring_extensions/)一样访问任何 Theia 服务。

> [!NOTE]
> 由于 VS Code 插件的插件宿主按前端连接划分作用域，而 `Main` 侧位于浏览器中，RPC 通信通道实际上经由 Theia 后端做了一层间接。
> 它只是双向中继消息，如示意图所示。

对无头插件，"Main-Ext" 模式非常相似，区别在于只有一个插件宿主实例，且 `Main` 代码运行在 **node** 上下文中，因为无头插件没有关联的前端上下文。

![无头插件场景下 Theia 与插件 API 的通信](./images/headless-plugin-diagram.svg)

由于插件的生命周期从其进程内 `Ext` 侧开始，插件需要从 Theia 获得的任何东西（如状态、命令执行、服务访问）都必须通过 RPC 调用 `Main` 侧的实现。
反方向亦然：运行在 `Main` 侧、需要插件侧提供某些东西的代码（例如用户输入后更改插件状态），
也必须通过 RPC 调用 `Ext` 侧的实现。
因此，`Main` 与 `Ext` 接口通常成对出现（例如 [LanguagesExt](https://github.com/eclipse-theia/theia/blob/541b300adc029ab1dd729da1ca49179ace1447b2/packages/plugin-ext/src/common/plugin-api-rpc.ts#L1401) 和 [LanguagesMain](https://github.com/eclipse-theia/theia/blob/541b300adc029ab1dd729da1ca49179ace1447b2/packages/plugin-ext/src/common/plugin-api-rpc.ts#L1474)）。

为了彼此通信，API 每一侧（`Main` 与 `Ext`）的实现都持有其对应一侧的 RPC 代理。
代理基于另一侧的接口：`Main` 实现持有 `Ext` 接口的代理，反之亦然。
两侧实现彼此之间没有显式依赖。

### RPC 消息的编码与解码

API 两侧之间的通信由代理管理，代理在给定通道上使用 `RpcProtocol` 传输 RPC 消息（如请求和通知）。
在 Theia 中，RPC 消息的编码与解码过程可以通过专用的 `RpcMessageEncoder` 与 `RpcMessageDecoder` 类自定义，它们可在创建新 RpcProtocol 时提供。
`RpcMessageEncoder` 将 RPC 消息写入缓冲区，而 `RpcMessageDecoder` 将缓冲区中的二进制消息解析为 RPC 消息。

默认情况下，Theia 使用基于 [msgpackr](https://www.npmjs.com/package/msgpackr) 的编码器和解码器，它们已能正确处理许多 JavaScript 内置类型，如数组和映射。
我们可以通过 `MsgPackExtensionManager` 单例安装扩展，分别为我们自己的类扩展编码与解码，该单例可从通道两端访问。
示例可参见 [Errors 的扩展](https://github.com/eclipse-theia/theia/blob/72421be24d0461f811a39324579913e91056d7c4/packages/core/src/common/message-rpc/rpc-message-encoder.ts#L171)与 [URI、Range 及其他类的扩展](https://github.com/eclipse-theia/theia/blob/72421be24d0461f811a39324579913e91056d7c4/packages/plugin-ext/src/common/rpc-protocol.ts#L223)。
我们在 `index.ts` 中注册这些扩展，以确保它们尽早可用。
请注意 msgpackr [总是在全局注册扩展](https://github.com/kriszyp/msgpackr/issues/93)，因此这些扩展会泄漏到 Theia 内的所有连接中，即也包括与 API 无关的区域，如前后端连接。
而且尽管自定义扩展的数量[限制为 100](https://github.com/kriszyp/msgpackr?tab=readme-ov-file#custom-extensions)，若扩展很多或转换开销很大，对每条消息检查扩展可能影响性能。
另一个障碍是我们必须始终仅凭对象形状就正确识别对象类型——当存在成百上千个对象以及来自用户代码的自定义实例时，这可能相当困难。
因此，我们主要将 msgpackr 扩展机制用于极少数常见类，而 Theia 插件 API 依赖自定义数据传输对象（DTO），另见[复杂对象与 RPC](#complex-objects-and-rpc)。

## 添加新 API

本节介绍扩展 Theia 插件 API 的方法。如果你想在自家扩展中添加完整的自定义插件 API，参见此[说明文档](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/doc/how-to-add-new-custom-plugin-api.md)。

添加新 API 的第一步是在 plugin 包的 [theia.d.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin/src/theia.d.ts) 文件中声明它。
第二步，新 API 的实现必须在 [plugin-context.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/plugin-context.ts) 中 API 工厂返回的对象上提供。
通常，API 工厂返回的函数或属性会委托给实际提供功能的 `Ext` 实现。
以下是摘自 [plugin-context.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/plugin-context.ts)#createAPIFactory 的精简注释示例：

```typescript
// 创建用于为每个插件生成 API 对象的 API 工厂
// 传入其中的实现在各插件间共享
export function createAPIFactory(
    rpc: RPCProtocol,
    pluginManager: PluginManager,
    envExt: EnvExtImpl,
    debugExt: DebugExtImpl,
    preferenceRegistryExt: PreferenceRegistryExtImpl,
    editorsAndDocumentsExt: EditorsAndDocumentsExtImpl,
    workspaceExt: WorkspaceExtImpl,
    messageRegistryExt: MessageRegistryExt,
    clipboard: ClipboardExt,
    webviewExt: WebviewsExtImpl
): PluginAPIFactory {

    // Ext 服务的实例化。
    // 实例化并注册到 RPC，以便主侧使用其代理时能调用到它们。
    const authenticationExt = rpc.set(MAIN_RPC_CONTEXT.AUTHENTICATION_EXT, new AuthenticationExtImpl(rpc));
    const commandRegistry = rpc.set(MAIN_RPC_CONTEXT.COMMAND_REGISTRY_EXT, new CommandRegistryImpl(rpc));
    // [...]

    // 返回的函数用于为某个插件创建插件 API 的实例。
    return function (plugin: InternalPlugin): typeof theia {
        const authentication: typeof theia.authentication = {
            // [...]
        };

        // [...]

        // 这里返回 API。把根命名空间的成员直接添加到返回的对象上。
        // 每个命名空间包含在各自的属性中。
        return <typeof theia>{
            version: require('../../package.json').version,
            // authentication 命名空间
            authentication,
            // [...]
            // 类型
            StatusBarAlignment: StatusBarAlignment,
            Disposable: Disposable,
            EventEmitter: Emitter,
            CancellationTokenSource: CancellationTokenSource,
            // [...]
        };
    };
}
```

### 添加新的 Ext 与 Main 接口及其实现

`Ext` 与 `Main` 接口只包含经 RPC 调用的函数。
其他函数只是实现的一部分。
经 RPC 调用的函数必须以 `$` 开头，例如 `$executeStuff`。

- 在 [plugin-ext/src/common/plugin-api-rpc.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/common/plugin-api-rpc.ts) 中定义 `Ext` 与 `Main` 接口。
接口应相应地以 `Ext` 和 `Main` 为后缀（如 `LanguagesMain` 和 `LanguagesExt`）。
- 在 [plugin-ext/src/common/plugin-api-rpc.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/common/plugin-api-rpc.ts) 中，为 `Ext` 接口向 `MAIN_RPC_CONTEXT` 添加代理标识符，为 `Main` 接口向 `PLUGIN_RPC_CONTEXT` 添加代理标识符
- 在 [plugin-ext/src/plugin](https://github.com/eclipse-theia/theia/tree/master/packages/plugin-ext/src/plugin) 文件夹创建 `Ext` 实现。
- 在 [plugin-ext/src/main/browser](https://github.com/eclipse-theia/theia/tree/master/packages/plugin-ext/src/main/browser) 文件夹创建 `Main` 实现。
- 为经 RPC 通信，每个实现都持有依赖另一侧接口的代理。
例如参见 [plugin-ext/src/plugin/languages.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/languages.ts) 中的 `LanguagesExtImpl` 和 [plugin-ext/src/main/browser/languages-main.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/main/browser/languages-main.ts) 中的 `LanguagesMainImpl`。
它们各自在构造函数中使用代理标识符创建指向另一侧的代理。

### 复杂对象与 RPC

当[编码与解码 RPC 消息](#encoding-and-decoding-rpc-messages)时，只携带属性的纯 DTO 对象总能被安全传输。
但由于必要的序列化过程，函数和指向其他对象的引用永远无法被安全传输。

如果对象的函数需要在创建侧的另一侧被调用，该对象需要在创建侧缓存。
另一侧收到一个句柄（通常是一个 id），可用它在创建侧调用相应功能。
由于所有缓存的对象都保留在内存中，不再需要时应将它们释放。
例如，在 [LanguagesExtImpl#registerCodeActionsProvider](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/languages.ts) 中，新的 code action provider 被创建并缓存在 `Ext` 侧，然后通过其句柄在 `Main` 侧注册。
之后当 code action provider 的方法在 `Main` 侧被调用时（例如在 [LanguagesMainImpl#provideCodeActions](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/main/browser/languages-main.ts) 中），它会用该句柄调用 `Ext` 侧。
`Ext` 侧随即取出缓存的对象，执行相应函数，并把结果返回给 `Main` 侧（例如在 [LanguagesExtImpl#$provideCodeActions](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/languages.ts) 中）。
另一个可参考的示例是 [TaskExtImpl](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/tasks/tasks.ts) 和 [TaskMainImpl](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/main/browser/tasks-main.ts) 类。

为了[确保 Theia 后端与插件宿主之间正确的类型转换](#encoding-and-decoding-rpc-messages)，我们定义了一个基于可安全传输的类型与 DTO 的 API 协议。
插件 API 及其类型定义在 [plugin-ext/src/common/plugin-api-rpc.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/common/plugin-api-rpc.ts)，`Ext` 侧的一些额外转换定义在 [plugin-ext/src/plugin/type-converters.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/type-converters.ts)。
因此，这也是查找既有类型转换工具的好起点。

### 添加新类型

新的类及其他类型（如枚举）通常在 [plugin-ext/src/plugin/types-impl.ts](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/src/plugin/types-impl.ts) 中实现。
可以在那里添加，然后把它们加到 API 工厂创建的 API 对象上。

## 无头插件（Headless Plugins）

大多数插件用例是通过 Theia 提供的 VS Code 兼容 API 扩展 Theia 的用户体验。
这些插件使用 `vscode` API 对象（如果其包清单中的 engine 类型为 `"vscode"`），或 `theia` 对象（如果其 engine 为 `"theiaPlugin"`）。
这类插件的生命周期绑定于_前端连接_：对每个连接的前端，Theia 后端会为其派生一个专用的插件宿主进程，并在其中加载并激活这些插件（按其声明的激活事件）。
在面向前端连接的插件宿主中，这些插件可以访问上述 Theia 服务，与主 Theia 后端进程以及其他所有前端连接插件宿主中运行的同一插件的其他实例相互隔离。

相比之下，无头插件在大多数方面都相当不同：

- 它们被封装在后端一个单独的插件宿主进程中，独立于所有面向前端连接的插件宿主。
只有存在需要运行的无头插件时才会拉起该宿主。
- Theia 不导出任何默认 API 对象（类比其他插件的 `vscode` 或 `theia`），因为 Theia 自身不为无头插件定义用例。
这些用例完全由基于 Theia 的应用的需求定义，并反映在其[如该 how-to 文档所述][custom-api-howto]定义的自定义 API 中。
- Theia 既不为无头插件提供任何贡献点，也不提供任何非平凡激活事件（仅 `'*'` 与 `'onStartupFinished'`）。
这是用例完全由应用决定的必然结果：应用需要定义自己的贡献点与激活事件。
目前这要求应用通过 [HostedPluginServer](https://github.com/eclipse-theia/theia/blob/1a56ba96fdc9b6df3a230df7b44e22e5785e3abd/packages/plugin-ext/src/common/plugin-protocol.ts#L1005) 枚举可用的已部署插件，解析其包清单以提取应用特定的贡献点与激活事件，并在适当的触发时机通过 [PluginManager::activatePlugin(pluginId)](https://github.com/eclipse-theia/theia/blob/1a56ba96fdc9b6df3a230df7b44e22e5785e3abd/packages/plugin-ext/src/common/plugin-api-rpc.ts#L182) API 激活插件。

因此，无头插件最适合用于为 Theia 应用的自定义后端服务贡献第三方扩展——这些服务被所有连接的前端共享，或服务于某种无头场景（如 CLI）。

无头插件可以限定于仅无头部署，此时它可以在包清单中声明 `"theiaHeadlessPlugin"` engine 来显式表明。
或者，扩展前端用户体验的 VS Code 或 Theia 插件，也可以在包清单中 `"theiaPlugin"` 对象的 `"headless"` 属性中标识这样的入口点脚本，从而为无头部署贡献一个无头入口，同时保留 `"main"` 入口（VS Code 插件）或 `"theiaPlugin.backend"` 入口（Theia 插件）。

无头插件可用的 API 命名空间只有那些由应用的自定义构建期 Theia 扩展或其他无头插件通过其 `activate()` 函数返回结果贡献的自定义 API。
贡献自定义 API 的详情参见[相关文档][custom-api-howto]。

[custom-api-howto]: https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/doc/how-to-add-new-custom-plugin-api.md

## 依赖注入

插件 API 的 `Main` 与 `Ext` 两侧都使用 [InversifyJS](https://inversify.io) 依赖注入进行配置。

在 `Main` 侧，使用常规机制绑定 API 对象的实现：由注册在 `package.json` 中的 `ContainerModule` 组成，启动时通过生成的脚本加载进 Theia 的 Inversify `Container`。

在 `Ext` 侧，插件宿主初始化脚本创建并配置其 Inversify `Container`。
我们鼓励你在定义新 API 对象和维护既有 API 时利用这种依赖注入，以促进各种接口实现的复用与可替换性。

## 更多链接

Thomas Maeder 关于编写插件 API 的演讲：<https://www.youtube.com/watch?v=Z_65jy8_9SM>

在 Theia 插件 API 之外添加新的自定义插件 API：[how-to-add-new-custom-plugin-api.md](https://github.com/eclipse-theia/theia/blob/master/packages/plugin-ext/doc/how-to-add-new-custom-plugin-api.md)

Theia Plugin Implementation wiki 页面：<https://github.com/eclipse-theia/theia/wiki/Theia-Plugin-Implementation>

che wiki 中的 Writing Plugin API wiki 页面：<https://github.com/eclipse/che/wiki/Writing-Theia-plugin-API>

Theia 与 VS Code API 对比器：<https://github.com/eclipse-theia/vscode-theia-comparator>

Theia 的扩展机制：VS Code 扩展、Theia 扩展与 Theia 插件：<https://theia-ide.org/docs/extensions>

创建自定义命名空间 API 并在 VS Code 扩展中使用的示例：<https://github.com/thegecko/vscode-theia-extension>

定义自定义命名空间 API 的 Theia 扩展与使用它的无头插件示例：[Greeting-of-the-Day API Provider 示例](https://github.com/eclipse-theia/theia/blob/master/examples/api-provider-sample)与 [Greeting-of-the-Day 客户端示例插件](https://github.com/eclipse-theia/theia/blob/master/sample-plugins/sample-namespace/plugin-gotd)
