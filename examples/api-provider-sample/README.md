<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - API PROVIDER SAMPLE</h2>

<hr />

</div>

## 描述

`@theia/api-provider-sample` 扩展是一个编程示例，展示如何为_插件_定义并提供自定义的 API 对象供其使用。
该扩展的目的是：

- 为开发者提供提供自定义 API 对象的真实编码示例
- 在评审拉取请求时提供易于使用和测试的功能示例

该扩展仅用于参考和测试目的，不发布到 `npm`（`private: true`）。

### 每日问候（Greeting of the Day）

该示例定义了一个 `gotd` API，插件可以导入并使用它来获取量身定制的问候消息，例如在它们的激活函数中使用。

源代码在 `src/` 目录树中的布局如下：

- `gotd.d.ts` — `gotd` API 对象的 TypeScript 定义，插件导入它以与"每日问候"服务交互
- `plugin/` — API 初始化脚本以及 API 对象的实现（`GreetingExt` 及类似接口）。
  此目录中的所有代码都只在独立的插件宿主 Node 进程中运行（与主 Theia 进程隔离），与无头插件或 VS Code 插件的后端一起运行。
  `GreetingExtImpl` 及类似类通过 RPC 与主 Theia 进程中的实际 API 实现（`GreetingMainImpl` 等）类通信
- `node/` — 实现 `GreetingMain` 及类似接口的 API 类，以及注册 API 提供方的 Inversify 绑定。
  此目录中的所有代码都在主 Theia Node 进程中运行
- `common/` — 与 `gotd` 插件 API 的后端相对应的 RPC API Ext/Main 接口定义

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
