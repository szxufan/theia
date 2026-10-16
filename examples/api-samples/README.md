<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - API SAMPLES</h2>

<hr />

</div>

## 描述

`@theia/api-samples` 扩展包含关于如何使用内部 API 的编程示例。
该扩展的目的是：

- 为开发者提供使用内部 API、依赖注入等的真实编码示例
- 在评审拉取请求时提供易于使用和测试的功能示例

该扩展仅用于参考和测试目的，不发布到 `npm`（`private: true`）。

### 遥测示例

**Telemetry Samples** 命令类别演示了从前端向 `sample/console` 后端接收端（sink）上报事件。将 `telemetry.telemetryLevel` 设置为 `all`，运行 started 和 completed 命令，然后检查后端日志中的主题、类型、会话、时间戳和负载。completed 命令会上报一个带有属性的 `error` 事件。`sample/other` 事件被刻意置于该接收端的关注范围之外。

将 `telemetry.telemetryLevel` 设置为 `off` 可抑制远程接收端，或设置 `"telemetry.filters": { "sample/console": [] }` 来显式禁用它。

### 模拟 OpenVSX 服务器示例

这些示例包含一个 OpenVSX 服务器的模拟实现。这
仅用于测试目的。它目前托管在
`<backend-host>/mock-open-vsx/api/...`。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
