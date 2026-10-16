# plugin-telemetry-probe

一个示例 Theia/VS Code 插件，演示 `env.createTelemetryLogger` 和 `telemetry.telemetryLevel` 同意门控。

它创建一个 `TelemetryLogger`，其发送方（sender）将每个通过了门控的事件追加到一个日志文件中，并在 `activate()` 内部记录一个使用事件和一个错误事件。这两个调用是有趣的场景：它们在通过 RPC 推送的级别可能到达之前运行，它们之所以能到达发送方，是因为该级别是通过插件管理器的初始化参数预先注入的。

标志状态会在激活时以及每次变更事件时记录，因此在应用程序运行期间更改首选项也会体现在同一个文件中。

**日志文件：** `<os.tmpdir()>/theia-telemetry-probe.log`，每行一个 JSON 对象。

## 测试

1. 将插件复制到已部署的 `plugins` 目录中，如[示例插件 README](../../README.md) 所述。
2. 设置 `telemetry.telemetryLevel` 并重启。
3. `tail -f $TMPDIR/theia-telemetry-probe.log`（Linux 上为 `/tmp`）。
4. 从命令面板运行 `Telemetry Probe: Log One Usage and One Error Event` 以按需再次记录。在应用程序运行期间更改首选项会追加一行新的 `state` 记录。

## 预期结果

| `telemetry.telemetryLevel` | `isTelemetryEnabled` | `delivered-usage` | `delivered-error` |
| --- | --- | --- | --- |
| `off` | false | 否 | 否 |
| `crash` | false | 否 | 否 |
| `error` | false | 否 | 是 |
| `all` | true | 是 | 是 |

插件日志记录器只会发出 `usage` 和 `error` 事件，因此级别为 `crash` 时不会投递任何内容。

## 许可证

EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
