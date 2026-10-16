<div align='center'>

<br />

<h2>ECLIPSE THEIA - 使用 API PROVIDER SAMPLE 的无头插件示例</h2>

<hr />

</div>

## 描述

一个演示三个 Theia 概念的示例：

- "无头插件"，即在单一插件宿主 Node 进程中加载、脱离任何前端连接上下文的插件
- 由 `@theia/api-provider-sample` 扩展提供的自定义"每日问候（Greeting of the Day）" API 的客户端
- "后端插件"，即在前端连接的后端插件宿主进程中加载的插件

因此，本插件演示了 VS Code 兼容插件为两个不同的后端上下文提供两个不同后端入口点的能力。
如 `package.json` 清单中所声明：

- 在无头插件宿主中，入口点脚本是通过 Theia 专有的 `"theiaPlugin"` 对象指定的 `headless.js`
- 在前端连接的后端插件宿主中，入口点脚本是通过 VS Code 标准 `"main"` 属性指定的 `backend.js`

该插件仅用于参考和测试目的，不发布到 `npm`（`private: true`）。

### 每日问候

该示例使用自定义的 `gotd` API 在激活时记录一条问候。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
