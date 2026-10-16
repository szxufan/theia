<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - PLUGIN-METRICS 扩展</h2>

<hr />

</div>

## 描述

`@theia/plugin-metrics` 扩展以 [Prometheus](https://prometheus.io/) 格式为插件贡献度量指标。

### 它检测哪些指标

1. 检测直接在 monaco 中注册的语言里出现的错误（例如：如果这里发生错误：<https://github.com/microsoft/vscode-extension-samples/blob/master/completions-sample/src/extension.ts#L11>，它将被上报）。

2. 检测直接记录到某个使用语言服务的 vscode 扩展的输出通道中的错误。这些错误只能通过其在 vscode-languageclient 库中注册的 ID 来上报，例如 "YAML Support"、"XML Support" 等。

### 限制与缺点

由于 vscode-languageclient 库的限制（参见 <https://github.com/microsoft/vscode-languageserver-node/issues/517>），我们无法直接处理来自语言服务器的错误，而需要使用输出通道。输出通道很棒，因为它让我们能够绕过 vscode-languageclient 库的限制并仍然获取度量指标，但它仍有一些缺点：

1. 每当一个语言服务器请求被 resolve 时，都会计为一次成功。这是因为 vscode-languageclient 总是返回已 resolve 的 Promise，即使该 Promise 实际上被 reject 了。唯一能获取错误的方式是使用正则表达式从输出通道提取数据，并将其关联回之前统计的成功记录。这带来了一些后果：
    1. 如果记录的错误没有被正则表达式匹配到，我们就无法得知错误发生在哪里，因此无法将错误关联回某个语言服务器方法。这意味着我们创建的指标将始终显示 100% 正常工作，即便事实并非如此。

2. 你需要手动添加输出通道 ID 到 vscode 扩展 ID 的映射，否则当请求被记录到输出通道时，它不知道应该与哪个 vscode 扩展关联。这一点没有别的办法，因为输出通道 ID 是在 vscode 扩展内部的 vscode-languageclient 库中注册的，而不是在类似 vscode-extensions 的 package.json 中。

### 实现

本扩展的浏览器端重新绑定了 plugin-ext 的关键部分，使我们能够在某些节点上抽象出相关的度量指标。

浏览器端随后在 plugin-metrics-creator 类中收集所有这些关键度量指标。

一旦我们拥有了所有想要的数据，就需要将这些数据从前端传输到后端，以便我们的新度量指标能够显示在 /metrics 端点上。这种通信通过 JSON-RPC 完成，其中 PluginMetrics 接口充当在前端和后端之间传递信息的方式。欲了解更多，请参见 [1]

plugin-metrics-extractor 每隔 5 秒 [2] 通过 `pluginMetrics.setMetrics(metrics: string)` 设置插件度量指标。

随后，后端每隔 5 秒 [2] 通过 `pluginMetrics.getMetrics()` 检查插件度量指标，查看当时指标的内容。

然后，当你加载 /metrics 端点时，就会看到新的语言度量指标。

[1] - [https://www.theia-ide.org/docs/json_rpc](https://www.theia-ide.org/docs/json_rpc)

[2] - 这是可配置的，位于 common/metrics-protocol.ts 中

## 更多信息

- [`@theia/plugin-metrics` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_plugin-metrics.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
