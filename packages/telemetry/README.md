<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - TELEMETRY 扩展</h2>

<hr />

</div>

## 描述

实验性的 `@theia/telemetry` 扩展提供了一个带类型的服务，用于从 Theia 前端和后端上报使用、错误和崩溃事件。应用程序通过贡献本地或远程后端接收端（sink）来决定通过 `TelemetryService` 上报的事件的去向；如果没有接收端，框架不会向任何地方发送数据。插件通过 `vscode.env.createTelemetryLogger` 发送的遥测数据不会经过接收端，参见[插件遥测](#插件遥测)。

远程接收端受用户级 `telemetry.telemetryLevel` 首选项控制，该首选项默认为 `off`。本地接收端将数据保留在本机上，不受同意检查约束，但所有接收端都遵守 `telemetry.filters`。缺少过滤条目时允许所有已声明的接收端关注点；空数组会禁用该接收端；非空数组则将投递限制在匹配的主题上。

```typescript
import { TelemetryEvent } from '@theia/telemetry/lib/common';
import { TelemetrySink } from '@theia/telemetry/lib/node';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
class ApplicationTelemetrySink implements TelemetrySink {
    readonly id = 'example/backend';
    readonly interests: readonly string[] = ['example/build/*'];
    readonly scope: 'local' | 'remote' = 'remote';

    handle(event: TelemetryEvent): void {
        // Forward the permitted event using an application-owned transport.
    }
}
```

生产方注入 `TelemetryService`，并以斜杠分隔的主题上报事件：

```typescript
telemetryService.report('example/build/completed', {
    duration: 1200,
    successful: true
});
```

完整的命令与接收端示例请参见 [API 示例](../../examples/api-samples)，公开契约请参见生成的 [`@theia/telemetry` API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_telemetry.html)。

## 自定义同意机制

前端和后端模块默认绑定基于首选项的 `TelemetryConsentProvider`。应用程序可以重新绑定它，以便从自己的选择加入机制获取同意状态。`TelemetryConsentProvider.onDidChangeTelemetryLevel` 是应用程序对同意状态变化做出响应的钩子；框架不会发送退出通知。

覆盖 `telemetry.telemetryLevel` 或 `telemetry.filters` 默认值的应用程序，必须在前端和后端容器中都注册等效的 `PreferenceContribution` 覆盖。这可以确保前端的转发优化与后端的权威策略保持一致。`theia.frontend.config.preferences` 仅配置前端默认值，单独使用不足以配置后端遥测策略。

## 插件遥测

`vscode.env.createTelemetryLogger` 会将事件投递给插件提供的 `TelemetrySender`，这是插件自身的传输通道，通向插件自己的后端。这些事件不经过 `TelemetryService`，也永远不会提供给 `TelemetrySink`，因此接收端和 `telemetry.filters` 对它们不生效，框架也不提供拦截点。该 API 和发送方都是 VS Code 的，其中扩展遥测同样由扩展自己负责。

应用程序所能控制的是同意。`telemetry.telemetryLevel` 通过与框架其余部分相同的 `TelemetryConsentProvider` 来控制插件日志记录器：`env.isTelemetryEnabled` 报告是否允许上报使用数据，`logUsage` 在低于 `all` 时被丢弃，`logError` 在低于 `error` 时被丢弃。插件日志记录器只会发出 `usage` 和 `error` 事件，因此级别为 `crash` 时插件不会投递任何内容。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
