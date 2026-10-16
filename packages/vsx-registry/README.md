<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - OPEN VSX REGISTRY 扩展</h2>

<hr />

</div>

## 描述

`@theia/vsx-registry` 扩展提供与 Open VSX Registry 的集成。

### 配置

该扩展默认连接到托管在 `http://open-vsx.org/` 上的公共 Open VSX Registry。
你也可以托管自己的[注册表](https://github.com/eclipse/openvsx#eclipse-open-vsx)实例，并通过配置 `VSX_REGISTRY_URL` 环境变量来使用它。

### 使用多个注册表

可以通过在后端运行时指定 CLI 参数来面向多个注册表：`--ovsx-router-config=<path>`，其中 `path` 必须指向一个定义了 `OVSXRouterConfig` 对象的 json 文件。

欲了解 `OVSXRouterClient` 及其 `OVSXRouterConfig` 配置的更多信息，请参阅 `@theia/ovsx-client` 的文档。

## 更多信息

- [`@theia/vsx-registry` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_vsx-registry.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
