<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - DEBUG 扩展</h2>

<hr />

</div>

## 架构

`DebugService` 用于初始化新的 `DebugSession`。该服务提供配置和启动新调试会话的功能。工作流程如下：当用户想要调试某个应用程序，而该应用程序没有关联的调试配置时，会请求可用调试器的列表以创建合适的调试配置。选定配置后，可以通过填写缺失的值或添加/修改/移除属性来调整配置。

在大多数情况下，`DebugSession` 的默认行为已经足够。但也可以提供自己的实现。为此，可以通过 `DebugSessionContribution` 使用 `DebugSessionFactory`。带有文档说明的模型对象位于[这里](https://github.com/eclipse-theia/theia/tree/master/packages/debug/src/browser/debug-model.ts)

### 调试会话生命周期 API

`DebugSession` 的生命周期是可控的，可以按如下方式跟踪：

* `onDidPreCreateDebugSession` 事件表示即将创建调试会话。
* `onDidCreateDebugSession` 事件表示调试会话已创建。
* `onDidDestroyDebugSession` 事件表示调试会话已终止。
* `onDidChangeActiveDebugSession` 事件表示活动的调试会话已发生变更。

### 断点 API

`ExtDebugProtocol.AggregatedBreakpoint` 用于在客户端处理断点。它涵盖全部三种断点类型：`DebugProtocol.SourceBreakpoint`、`DebugProtocol.FunctionBreakpoint` 和 `ExtDebugProtocol.ExceptionBreakpoint`。可以借助 `DebugUtils` 识别断点类型。断点的添加、移除或变更通知通过 `onDidChangeBreakpoints` 接收。

### 服务端

在后端，我们使用 `DebugAdapterFactory` 启动调试适配器，随后会实例化一个 `DebugAdapterSession`，它充当客户端与调试适配器之间的代理。如果调试适配器会话的默认实现无法满足需求，可以通过 `DebugAdapterSessionFactory` 提供自己的实现。若是如此，建议扩展 `DebugAdapterSession` 的默认实现。带有文档说明的模型对象位于[这里](https://github.com/eclipse-theia/theia/tree/master/packages/debug/src/node/debug-model.ts)

`DebugSessionState` 会累积调试适配器事件，用于在页面刷新时在客户端恢复调试会话。

## 如何贡献新的调试器

`DebugAdapterContribution` 是一个贡献点，供所有调试适配器提供和解析调试配置。

## 更多信息

* [`@theia/debug` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_debug.html)
* [Theia - GitHub](https://github.com/eclipse-theia/theia)
* [Theia - Website](https://theia-ide.org/)
* [调试适配器协议（Debug Adapter Protocol）](https://github.com/Microsoft/vscode-debugadapter-node/blob/master/protocol/src/debugProtocol.ts)
* [VS Code 调试 API](https://code.visualstudio.com/docs/extensionAPI/api-debugging)
* [VS Code 调试适配器示例](https://code.visualstudio.com/docs/extensions/example-debuggers)

## VS Code 的调试适配器实现

* [Node 调试器](https://github.com/microsoft/vscode-node-debug)
* [Node 调试器 2](https://github.com/microsoft/vscode-node-debug2)
* [Java 调试器](https://github.com/Microsoft/vscode-java-debug)

## 许可证

* [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
* [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
