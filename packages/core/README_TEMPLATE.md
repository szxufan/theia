<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - CORE 扩展</h2>

<hr />

</div>

## 描述

`@theia/core` 扩展是所有基于 Theia 的应用程序的主扩展，为所有依赖它的扩展提供主框架。
该扩展为所有基于 Theia 的应用程序提供基础 API，包括：

- 应用程序 API
- 外壳（Shell）API
- 基础组件（Widget）
- 贡献点（例如：命令、菜单项、快捷键绑定）

## Theia 扩展

Theia 扩展是一个在 `package.json` 中声明 `theiaExtensions` 属性的 node 包：

```json
{
  "theiaExtensions": [{
      "frontend": "lib/myExtension/browser/myextension-frontend-module",
      "backend": "lib/myExtension/node/myextension-backend-module",
    }, {
      "frontend": "lib/myExtension2/browser/myextension2-browser-module",
      "frontendElectron": "lib/myExtension2/electron-browser/myextension2-electron-browser-module",
      "backend": "lib/myExtension2/node/myextension2-node-module",
      "backendElectron": "lib/myExtension2/electron-main/myextension2-electron-main-module"
  }]
}
```

每个扩展可以由以下模块组成：

- `frontend` 用于浏览器环境；如果未提供 `frontendElectron`，也用于 electron 环境
- `frontendElectron` 用于 electron 环境
- `backend` 用于 node 环境；如果未提供 `backendElectron`，也用于 electron 环境
- `backendElectron` 用于 electron 环境

扩展模块应当有一个类型为 `ContainerModule | Promise<ContainerModule>` 的默认导出。

## Theia 应用程序

Theia 应用程序是一个将 [Theia 扩展](#theia-扩展)列为依赖项、并由 [Theia CLI](../../dev-packages/cli/README.md) 管理的 node 包。

## 重导出机制

为了让应用程序的构建更加稳定，`@theia/core` 重导出了一些常用依赖供 Theia 扩展复用。当需要复用与 `@theia/core` 相同的依赖时，这一点尤其有用：由于这些依赖会由 Theia 引入，你无需在自己的包中费力匹配相同版本，可以直接通过重导出从框架中消费它们。

### 使用示例

以 inversify 为例（你最有可能使用这个包），你可以通过添加 `@theia/core/shared/` 前缀来导入它：

```ts
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class SomeClass {
    // ...
}
```

## 重导出

{{#reExportsDirectories}}
- `@theia/core/{{&directory}}/...`
    {{#packages}}
    {{#modules}}
  - `{{&moduleName}}`（来自 [`{{&packageName}}@{{&versionRange}}`]({{&npmUrl}})）
    {{/modules}}
    {{/packages}}
{{/reExportsDirectories}}

## 日志配置

可以通过向应用程序传入 `--log-level={fatal,error,warn,info,debug,trace}` 选项来更改整个 Theia 应用程序的日志级别。如需更细粒度的调整，还可以按日志记录器（即按主题）设置日志级别。`root` 日志记录器是一个特殊的兜底记录器，所有未经特定记录器发送的消息都会经过它。要更改特定日志记录器的日志级别，可以创建如下配置文件：

```json
{
  "defaultLevel": "info",
  "levels": {
    "terminal*": "debug",
    "task*": "error",
    "ai-core*": "error",
    "ai-core:DefaultPromptFragmentCustomizationService": "debug",
    "*Token*": "warn"
  }
}
```

其中 `levels` 包含日志记录器到日志级别的映射。`defaultLevel` 包含未在 `levels` 中指定的日志记录器所使用的日志级别。随后可以通过 `--log-config` 选项指定该文件。Theia 会监视该文件的变更，因此可以在运行时通过修改该文件来更改日志级别。

**通配符支持与优先级**

除了精确的日志记录器名称外，还可以使用通配符（`*`）配置日志级别，用一条规则匹配多个日志记录器（例如 `ai-core*` 或 `*Token*`）。解析某个日志记录器的日志级别时，适用以下优先级规则：

- **精确匹配优先：** 与日志记录器名称的精确匹配始终优先于任何通配符规则。
- **后者优先：** 如果未找到精确匹配，系统会评估通配符规则。如果多条通配符规则匹配同一个日志记录器，则以配置文件中*最后*一条匹配的规则为准。

遗憾的是，目前无法向 Theia 查询现有日志记录器的列表。不过，每条日志消息都会指明它来自哪个日志记录器，无需阅读代码即可大致了解：

```
root INFO [parcel-watcher: 10734] Started watching: /Users/captain.future/git/theia/CONTRIBUTING.md
^^^^ ^^^^  ^^^^^^^^^^^^^^^^^^^^^
```

其中 `root` 是日志记录器的名称，`INFO` 是日志级别。其后可选地跟着子进程的名称和进程 ID。

## 环境变量

- `THEIA_HOSTS`
  - 预期解析到当前应用程序的主机列表（以逗号分隔）。
    - 例如：`theia.app.com,some.other.domain:3000`
  - 如果应用程序未托管在 `80` 或 `443` 端口上，则端口号很重要。
  - 如果可能，你应当设置此环境变量：
    - 未设置时，Theia 将对 WebSocket 服务强制实施同源访问。
    - 设置后，Theia 将仅允许此环境变量中定义的来源。
- `FRONTEND_CONNECTION_TIMEOUT`
  - 后端为前端保留连接上下文以便其重新连接的时长（毫秒）。
  - 未设置时默认为 '0'。
  - 如果设置为负数，后端将永不关闭连接。

## 更多信息

- [`@theia/core` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_core.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
