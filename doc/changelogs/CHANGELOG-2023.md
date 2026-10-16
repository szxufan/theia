# 变更日志 2023

## v1.45.0 - 12/21/2023

- [application-manager] 更新逻辑以允许在 preload 中重绑定消息服务 [#13199](https://github.com/eclipse-theia/theia/pull/13199)
- [application-package] 将默认支持的 API 从 `1.83.1` 提升到 `1.84.2` [#13198](https://github.com/eclipse-theia/theia/pull/13198)
- [core] 新增 CLI 参数 `--electronUserData` 以控制 `userDataPath` [#13155](https://github.com/eclipse-theia/theia/pull/13155)
- [core] 新增控制次窗口大小与位置的逻辑 [#13201](https://github.com/eclipse-theia/theia/pull/13201)
- [core] 新增将未命名文件保存到最后活动文件夹的逻辑 [#13184](https://github.com/eclipse-theia/theia/pull/13184)
- [core] 修复存在未保存编辑器时阻止应用关闭的回归 [#13173](https://github.com/eclipse-theia/theia/pull/13173)
- [core] 修复压缩导航器缩进的样式 [#13162](https://github.com/eclipse-theia/theia/pull/13162)
- [core] 引入保持连接上下文存活的超时逻辑 [#13082](https://github.com/eclipse-theia/theia/pull/13082)
- [core] 为 `1.84.2` 更新 `nls.metadata.json` [#13200](https://github.com/eclipse-theia/theia/pull/13200)
- [debug] 修复调试配置提供者会替换其他提供者的问题 [#13196](https://github.com/eclipse-theia/theia/pull/13196)
- [documentation] 改进关于插件宿主中插件 API 添加的文档 [#13153](https://github.com/eclipse-theia/theia/pull/13153)
- [notebook] 修复 notebook 内核选择 [#13171](https://github.com/eclipse-theia/theia/pull/13171)
- [notebook] 实现通用 API 改进 [#13012](https://github.com/eclipse-theia/theia/pull/13012)
- [notebook] 优化输出逻辑 [#13137](https://github.com/eclipse-theia/theia/pull/13137)
- [plugin] 新增关于添加自定义激活事件的文档 [#13190](https://github.com/eclipse-theia/theia/pull/13190)
- [plugin] 新增异步部署插件的逻辑 [#13134](https://github.com/eclipse-theia/theia/pull/13134)
- [plugin] 新增在 `WindowStateExt.asExternalUri` 中不拒绝未知 schema 的逻辑 [#13057](https://github.com/eclipse-theia/theia/pull/13057)
- [plugin] 新增对 `TestMessage.contextValue` VS Code API 的支持 [#13176](https://github.com/eclipse-theia/theia/pull/13176) - contributed on behalf of STMicroelectronics
- [plugin] 新增对 `webview/context` 菜单贡献点的支持 [#13166](https://github.com/eclipse-theia/theia/pull/13166)
- [plugin] 修复 stdout 中不正确的 `unsupported activation error` [#13095](https://github.com/eclipse-theia/theia/pull/13095)
- [plugin] 修复 `onView` 激活事件被错误生成的问题 [#13091](https://github.com/eclipse-theia/theia/pull/13091)
- [plugin] 修复插件图标样式 [#13101](https://github.com/eclipse-theia/theia/pull/13101)
- [terminal] 更新逻辑：展开/折叠底部面板时使用 `ApplicationShell` [#13131](https://github.com/eclipse-theia/theia/pull/13131)
- [workspace] 新增逻辑：在 `updateWorkspaceFolders` 事件时若无活动工作区则创建空工作区 [#13181](https://github.com/eclipse-theia/theia/pull/13181) - contributed on behalf of STMicroelectronics

<a name="breaking_changes_1.45.0">[Breaking Changes:](#breaking_changes_1.45.0)</a>

- [plugin] 更新 VS Code 扩展位置：部署目录切换为 `$CONFDIR/deployedPlugin`，`$CONFDIR/extensions` 中的 `.vsix` 文件会被自动部署 [#13178](https://github.com/eclipse-theia/theia/pull/13178) - Contributed on behalf of STMicroelectronics

## v1.44.0 - 11/30/2023

- [application-manager] 新增将 `trash` 依赖复制进 bundle 的选项 [#13112](https://github.com/eclipse-theia/theia/pull/13112)
- [application-package] 将默认支持的 API 从 `1.82.0` 提升到 `1.83.1` [#13118](https://github.com/eclipse-theia/theia/pull/13118)
- [ci] 为生产构建新增冒烟测试 [#12965](https://github.com/eclipse-theia/theia/pull/12965)
- [ci] 更新 CI 将 Python 固定在 `3.11` 以解决 `node-gyp` 错误 [#13040](https://github.com/eclipse-theia/theia/pull/13040)
- [core] 新增防止基于类名的贡献过滤的处理 [#13103](https://github.com/eclipse-theia/theia/pull/13103)
- [core] 新增对 electron 应用便携模式的支持 [#12690](https://github.com/eclipse-theia/theia/pull/12690)
- [core] 修复处理监听器事件时的逻辑 [#13079](https://github.com/eclipse-theia/theia/pull/13079)
- [core] 使用首选键改进默认翻译 [#13078](https://github.com/eclipse-theia/theia/pull/13078)
- [core] 为 `1.83.1` 更新 `nls.metadata.json` [#13119](https://github.com/eclipse-theia/theia/pull/13119)
- [core] 更新 `socket.io` 的代理路径处理 [#13054](https://github.com/eclipse-theia/theia/pull/13054)
- [debug] 修复编辑断点条件时 UI 未更新的问题 [#12980](https://github.com/eclipse-theia/theia/pull/12980)
- [debug] 修复调试 schema 属性的本地化 [#13017](https://github.com/eclipse-theia/theia/pull/13017)
- [debug] 更新线程停止状态的描述字段 [#13050](https://github.com/eclipse-theia/theia/pull/13050)
- [documentation] 新增关于 `@stubbed` 与 `@monaco-uplift` 标签的编码规范 [#13029](https://github.com/eclipse-theia/theia/pull/13029)
- [documentation] 更新 `private-ext-scripts/README.md` 的失效链接 [#13122](https://github.com/eclipse-theia/theia/pull/13122)
- [filesystem] 更新 electron 对话框，使其默认为模态 [#13043](https://github.com/eclipse-theia/theia/pull/13043)
- [notebook] 修复视图注册中的竞态条件 [#13115](https://github.com/eclipse-theia/theia/pull/13115)
- [playwright] 新增对 electron 的基础支持 [#12207](https://github.com/eclipse-theia/theia/pull/12207)
- [plugin] 新增列出已安装插件的命令 [#12818](https://github.com/eclipse-theia/theia/pull/12818)
- [plugin] 新增将 webview 日志消息转发到浏览器控制台的处理 [#13084](https://github.com/eclipse-theia/theia/pull/13084)
- [plugin] 新增对 VS Code 默认语言图标的支持 [#13014](https://github.com/eclipse-theia/theia/pull/13014)
- [plugin] 新增对 `LanguageConfiguration` VS Code API 中 `autoClosingPairs` 的支持 [#13088](https://github.com/eclipse-theia/theia/pull/13088) - contributed on behalf of STMicroelectronics
- [plugin] 新增对 `CodeActionKind#Notebook` VS Code API 的支持 [#13093](https://github.com/eclipse-theia/theia/pull/13093) - contributed on behalf of STMicroelectronics
- [plugin] 新增对 `TextEditorOptions.indentSize` VS Code API 的支持 [#13105](https://github.com/eclipse-theia/theia/pull/13105) - contributed on behalf of STMicroelectronics
- [plugin] 新增对 `env.onDidChangeShell` VS Code API 的支持 [#13097](https://github.com/eclipse-theia/theia/pull/13097) - contributed on behalf of STMicroelectronics
- [private-ext-scripts] 更新与脚本相关的信息 [#13127](https://github.com/eclipse-theia/theia/pull/13127)
- [repo] 移除 `tsconfig` 中对 `baseUrl` 的使用 [#12981](https://github.com/eclipse-theia/theia/pull/12981)
- [search-in-workspace] 新增输入框中搜索历史提示的支持 [#12967](https://github.com/eclipse-theia/theia/pull/12967)
- [search-in-workspace] 修复搜索结果的行样式 [#13071](https://github.com/eclipse-theia/theia/pull/13071)
- [task] 新增防止任务部件标题被任务进程更改的处理 [#13003](https://github.com/eclipse-theia/theia/pull/13003)
- [task] 新增对任务组定义中 `isDefault: false` 的支持 [#13075](https://github.com/eclipse-theia/theia/pull/13075) - contributed on behalf of STMicroelectronics
- [toolbar] 修复未定义工具栏组的渲染错误 [#13124](https://github.com/eclipse-theia/theia/pull/13124)

## v1.43.0 - 10/26/2023

- [application-manager] 修复后端 webpack 输出与监听 [#12902](https://github.com/eclipse-theia/theia/pull/12902)
- [application-manager] 更新 `clean` 命令以删除 `gen-webpack.node.config.js` [#12975](https://github.com/eclipse-theia/theia/pull/12975)
- [application-package] 将默认支持的 API 版本从 `1.81.0` 提升到 `1.82.0` [#13025](https://github.com/eclipse-theia/theia/pull/13025)
- [cli] 将 `chai` 依赖从 `^4.2.0` 升级到 `^4.3.10` [#12958](https://github.com/eclipse-theia/theia/pull/12958)
- [core] 新增底部侧边栏的 `manage` 相关菜单 [#12803](https://github.com/eclipse-theia/theia/pull/12803)
- [core] 新增本地化懒加载支持 [#12932](https://github.com/eclipse-theia/theia/pull/12932)
- [core] 新增剪贴板命令的本地化 [#13031](https://github.com/eclipse-theia/theia/pull/13031)
- [core] 修复有未保存编辑器时的文件保存对话框 [#12864](https://github.com/eclipse-theia/theia/pull/12864)
- [core] 修复 preload 应用包导入 [#12964](https://github.com/eclipse-theia/theia/pull/12964)
- [core] 改进选择本地化语言时的响应速度 [#12992](https://github.com/eclipse-theia/theia/pull/12992)
- [core] 从 `RpcProtocol` 中移除不必要的 `try-catch` [#12961](https://github.com/eclipse-theia/theia/pull/12961)
- [core] 为 `1.82.0` 更新 `nls.metadata.json` [#13028](https://github.com/eclipse-theia/theia/pull/13028)
- [core] 更新处理以确保 `ApplicationShellOptions` 在初始化时被正确应用 [#12983](https://github.com/eclipse-theia/theia/pull/12983)
- [debug] 补充调试暂停标签缺失的本地化 [#12973](https://github.com/eclipse-theia/theia/pull/12973)
- [debug] 修复导致悬停部件跳转的问题 [#12971](https://github.com/eclipse-theia/theia/pull/12971)
- [file-search] 实现 `search.quickOpen.includeHistory` 偏好 [#12913](https://github.com/eclipse-theia/theia/pull/12913)
- [keymaps] 为键盘快捷键视图新增上下文菜单项 [#12791](https://github.com/eclipse-theia/theia/pull/12791)
- [monaco] 将 `vscode-textmate` 依赖从 `7.0.3` 升级到 `9.0.0` [#12963](https://github.com/eclipse-theia/theia/pull/12963)
- [notebook] 更新处理，使其在输出条目更新时正确更新 [#13023](https://github.com/eclipse-theia/theia/pull/13023)
- [plugin] 新增对 `vscode.open` 字符串参数的支持 [#12997](https://github.com/eclipse-theia/theia/pull/12997)
- [plugin] 新增对 `EnvironmentVariableMutatorOptions` VS Code API 的支持 [#12984](https://github.com/eclipse-theia/theia/pull/12984)
- [plugin] 新增对图标贡献点的支持 [#12912](https://github.com/eclipse-theia/theia/pull/12912)
- [plugin] 修复输出渲染器脚本路径 [#12979](https://github.com/eclipse-theia/theia/pull/12979)
- [plugin] 修复初始化插件时的符号链接处理 [#12841](https://github.com/eclipse-theia/theia/pull/12841)
- [plugin] 改进 webview 视图的解析 [#12998](https://github.com/eclipse-theia/theia/pull/12998)
- [plugin] 更新处理以允许树数据提供者中的 null 条目 [#13018](https://github.com/eclipse-theia/theia/pull/13018)
- [remote] 新增远程 ssh 支持 [#12618](https://github.com/eclipse-theia/theia/pull/12618)
- [test] 新增对 `test` API 的支持 [#12935](https://github.com/eclipse-theia/theia/pull/12935)
- [vscode] 在 `DocumentRangeFormattingEditProvider` VS Code API 中新增 `provideDocumentRangesFormattingEdits` 的支持 [#13020](https://github.com/eclipse-theia/theia/pull/13020) - contributed on behalf of STMicroelectronics
- [vscode] 推进 `documentPaste` 提案 API（已存根）[#13010](https://github.com/eclipse-theia/theia/pull/13010) - contributed on behalf of STMicroelectronics
- [vscode] 推进 `dropDocument` 提案 API [#13009](https://github.com/eclipse-theia/theia/pull/13009) - contributed on behalf of STMicroelectronics
- [vscode] 推进 `terminalQuickFixProvider` 提案 API [#13006](https://github.com/eclipse-theia/theia/pull/13006) - contributed on behalf of STMicroelectronics
- [vscode] 在环境变量集合上实现作用域 API [#12999](https://github.com/eclipse-theia/theia/pull/12999) - contributed on behalf of STMicroelectronics

<a name="breaking_changes_1.43.0">[Breaking Changes:](#breaking_changes_1.43.0)</a>

- [core] 将 `FrontendApplicationContribution` 从 `@theia/core/lib/browser/frontend-application` 移至 `@theia/core/lib/browser/frontend-application-contribution` [#12993](https://github.com/eclipse-theia/theia/pull/12993)
- [core] 移除 `SETTINGS_OPEN` 菜单路径常量——由 `MANAGE_GENERAL` 取代 [#12803](https://github.com/eclipse-theia/theia/pull/12803)
- [core] 移除 `SETTINGS__THEME` 菜单路径常量——由 `MANAGE_SETTINGS` 取代 [#12803](https://github.com/eclipse-theia/theia/pull/12803)

## v1.42.0 - 09/28/2023

- [core] 在前端 preload 脚本中新增 `inversify` 支持 [#12590](https://github.com/eclipse-theia/theia/pull/12590)
- [core] 补充快捷键错误消息缺失的本地化 [#12889](https://github.com/eclipse-theia/theia/pull/12889)
- [core] 修复运行时日志配置变更时 logger 级别的传播 [#12566](https://github.com/eclipse-theia/theia/pull/12566) - Contributed on behalf of STMicroelectronics
- [core] 改进前端启动时间 [#12936](https://github.com/eclipse-theia/theia/pull/12936) - Contributed on behalf of STMicroelectronics
- [core] 为 `1.81.0` 更新 `nls.metadata.json` [#12951](https://github.com/eclipse-theia/theia/pull/12951)
- [core] 将 `ws` 从 `7.1.2` 升级到 `8.14.1` [#12909](https://github.com/eclipse-theia/theia/pull/12909)
- [debug] 修复错误的内联断点 [#12832](https://github.com/eclipse-theia/theia/pull/12832)
- [dev-packages] 将默认支持的 API 版本从 `1.80.0` 提升到 `1.81.0` [#12949](https://github.com/eclipse-theia/theia/pull/12949)
- [dev-packages] 恢复 src-gen 前端生产行为 [12950](https://github.com/eclipse-theia/theia/pull/12950) - Contributed on behalf of STMicroelectronics
- [dialogs] 新增在打开对话框中多选的功能 [#12923](https://github.com/eclipse-theia/theia/pull/12923) - Contributed on behalf of STMicroelectronics
- [documentation] 在 pull request 模板中新增后续工作章节 [#12901](https://github.com/eclipse-theia/theia/pull/12901)
- [editor] 新增双击标签栏时创建未命名文件的功能 [#12867](https://github.com/eclipse-theia/theia/pull/12867)
- [electron] 改进初始 electron 窗口的响应速度 [#12897](https://github.com/eclipse-theia/theia/pull/12897) - Contributed on behalf of STMicroelectronics.
- [plugin] 为 `TestController#invalidateTestResults` VS Code API 新增存根 [#12944](https://github.com/eclipse-theia/theia/pull/12944) - Contributed by STMicroelectronics
- [plugin] 新增 `QuickPickItem` VS Code API 中对 `iconPath` 的支持 [#12945](https://github.com/eclipse-theia/theia/pull/12945) - Contributed by STMicroelectronics
- [repo] 将弃用的 `context` 用法更新为 `when` 子句 [#12830](https://github.com/eclipse-theia/theia/pull/12830)
- [search-in-workspace] 新增多行搜索支持 [#12868](https://github.com/eclipse-theia/theia/pull/12868)
- [vsx-registry] 在获取扩展失败的 `ENOTFOUND` 错误中添加提示 [#12858](https://github.com/eclipse-theia/theia/pull/12858) - Contributed by STMicroelectronics

## v1.41.0 - 08/31/2023

- [application-package] 新增后端启动失败时退出 electron 应用的处理 [#12778](https://github.com/eclipse-theia/theia/pull/12778) - Contributed on behalf of STMicroelectronics
- [core] 新增 `--dnsDefaultResultOrder <value>` CLI 参数，`value` 为 `ipv4first`、`verbatim` 或 `nodeDefault` 之一。它控制域名解析方式 [#12711](https://github.com/eclipse-theia/theia/pull/12711)
- [core] 新增捕获秒表结果的功能 [#12812](https://github.com/eclipse-theia/theia/pull/12812)
- [core] 新增对 `file/newFile` 菜单路径的支持 [#12819](https://github.com/eclipse-theia/theia/pull/12819)
- [core] 新增对无图标标签栏条目的支持 [#12804](https://github.com/eclipse-theia/theia/pull/12804)
- [core] 新增对 `editor/title/run` 菜单中独立条目的支持 [#12799](https://github.com/eclipse-theia/theia/pull/12799)
- [core] 修复对 `editor/title` 与 `view/title` 的子菜单贡献 [#12706](https://github.com/eclipse-theia/theia/pull/12706)
- [core] 改进树节点的中键点击行为 [#12783](https://github.com/eclipse-theia/theia/pull/12783)
- [core] 改进悬停标签页时关闭图标的渲染 [#12806](https://github.com/eclipse-theia/theia/pull/12806)
- [core] 为 `1.80.0` 更新 `nls.metadata.json` [#12875](https://github.com/eclipse-theia/theia/pull/12875)
- [debug] 修复无会话时编辑监视表达式不更新的问题 [#12627](https://github.com/eclipse-theia/theia/pull/12627)
- [dev-packages] 将默认支持的 API 版本从 `1.79.0` 提升到 `1.89.0` [#12866](https://github.com/eclipse-theia/theia/pull/12866)
- [editor] 修复编辑器装订线的上下文菜单行为 [#12794](https://github.com/eclipse-theia/theia/pull/12794)
- [filesystem] 补充"复制下载链接到剪贴板"通知缺失的本地化 [#12873](https://github.com/eclipse-theia/theia/pull/12873)
- [getting-started] 在欢迎页新增复选框以控制启动时是否显示 [#12750](https://github.com/eclipse-theia/theia/pull/12750)
- [getting-started] 新增对 `workbench.startupEditor` 偏好的支持 [#12813](https://github.com/eclipse-theia/theia/pull/12813)
- [getting-started] 修复欢迎页的 `open folder` 链接 [#12857](https://github.com/eclipse-theia/theia/pull/12857)
- [getting-started] 改进欢迎页在较小视口下的渲染 [#12825](https://github.com/eclipse-theia/theia/pull/12825)
- [git] 修复 git 操作期间未处理的 promise 拒绝 [#12433](https://github.com/eclipse-theia/theia/pull/12433)
- [markers] 改进问题部件渲染与问题匹配 [#12802](https://github.com/eclipse-theia/theia/pull/12802)
- [monaco] 改进 `MonacoEditorCommandHandlers` 的可扩展性 [#12785](https://github.com/eclipse-theia/theia/pull/12785)
- [native-webpack-plugin] 新增将 `trash` 依赖辅助打包到后端 [#12797](https://github.com/eclipse-theia/theia/pull/12797)
- [navigator] 补充多根工作区中无根时缺失的本地化 [#12795](https://github.com/eclipse-theia/theia/pull/12795)
- [notebook] 新增对 `notebook` 编辑器的初始支持 [#12442](https://github.com/eclipse-theia/theia/pull/12442)
- [playwright] 升级到最新版本并新增页面对象 [#12843](https://github.com/eclipse-theia/theia/pull/12843)
- [plugin] 新增对 `EnvironmentVariableCollection#description` VS Code API 的支持 [#12838](https://github.com/eclipse-theia/theia/pull/12838)
- [plugin] 修复来自 VS Code 插件的 `configurationDefault` 支持 [#12758](https://github.com/eclipse-theia/theia/pull/12758)
- [plugin] 修复内置视图的 `view/title` 菜单行为 [#12763](https://github.com/eclipse-theia/theia/pull/12763)
- [plugin] 修复 `WebviewPanelSerializer` 无法成功序列化的问题 [#12584](https://github.com/eclipse-theia/theia/pull/12584)
- [plugin] 修复插件菜单图标悬停时的背景 [#12827](https://github.com/eclipse-theia/theia/pull/12827)
- [plugin] 修复主题的默认 `folderExpanded` 图标 [#12776](https://github.com/eclipse-theia/theia/pull/12776)
- [plugin] 修复 web 插件的 express 端点 [#12787](https://github.com/eclipse-theia/theia/pull/12787)
- [preferences] 通过复用 markdown 渲染器实例降低内存消耗 [#12790](https://github.com/eclipse-theia/theia/pull/12790)
- [process] 修复 shell 命令的 `.exe` 兼容性，与 VS Code 一致 [#12761](https://github.com/eclipse-theia/theia/pull/12761)
- [repo] 将内置插件提升到 `1.79.0` [#12807](https://github.com/eclipse-theia/theia/pull/12807)
- [scm-extra] 修复执行提交后 scm 历史的问题 [#12837](https://github.com/eclipse-theia/theia/pull/12837)
- [task] 新增确保成功发现已贡献问题匹配器的处理 [#12805](https://github.com/eclipse-theia/theia/pull/12805)
- [task] 修复自定义任务执行时抛出的错误 [#12770](https://github.com/eclipse-theia/theia/pull/12770)
- [vscode] 新增对树复选框 API 的支持 [#12836](https://github.com/eclipse-theia/theia/pull/12836) - Contributed on behalf of STMicroelectronics
- [workspace] 修复关闭工作区或应用时未命名文本编辑器的保存 [#12577](https://github.com/eclipse-theia/theia/pull/12577)

<a name="breaking_changes_1.41.0">[Breaking Changes:](#breaking_changes_1.41.0)</a>

- [deps] 将支持的 Node.js 版本从 16.x 提升到 >=18，你可能需要更新环境 [#12711](https://github.com/eclipse-theia/theia/pull/12711)
- [preferences] 移除 `welcome.alwaysShowWelcomePage` 偏好，改用 `workbench.startupEditor` [#12813](https://github.com/eclipse-theia/theia/pull/12813)
- [terminal] 弃用 `terminal.integrated.rendererType` 偏好 [#12691](https://github.com/eclipse-theia/theia/pull/12691)
- [terminal] 移除受保护方法 `TerminalWidgetImpl.getTerminalRendererType` [#12691](https://github.com/eclipse-theia/theia/pull/12691)

## v1.40.0 - 07/27/2023

- [application-package] 将默认支持的 VS Code API 从 `1.78.0` 提升到 `1.79.0` [#12764](https://github.com/eclipse-theia/theia/pull/12764) - Contributed on behalf of STMicroelectronics
- [application-package] 修复后端打包中被忽略的资源 [#12681](https://github.com/eclipse-theia/theia/pull/12681)
- [cli] 新增 `check:theia-extensions` 以便检查 `@theia` 扩展版本的唯一性 [#12596](https://github.com/eclipse-theia/theia/pull/12596) - Contributed on behalf of STMicroelectronics
- [core] 新增在工具栏条目提示中显示命令快捷方式的功能 [#12660](https://github.com/eclipse-theia/theia/pull/12660) - Contributed on behalf of STMicroelectronics
- [core] 新增悬停时渲染标签页可视预览的支持 [#12648](https://github.com/eclipse-theia/theia/pull/12648) - Contributed on behalf of STMicroelectronics
- [core] 修复菜单中渲染图标的回归 [#12739](https://github.com/eclipse-theia/theia/pull/12739)
- [core] 修复调整视图大小时标签栏图标闪烁的问题 [#12629](https://github.com/eclipse-theia/theia/pull/12629)
- [core] 按 VS Code `1.79.0` 更新本地化数据 [#12765](https://github.com/eclipse-theia/theia/pull/12765)
- [debug] 修复 `DebugBreakpointWidget` 值不正确的问题 [#12567](https://github.com/eclipse-theia/theia/pull/12567)
- [debug] 改进启动配置的多根体验 [#12674](https://github.com/eclipse-theia/theia/pull/12674)
- [dialog] 新增对 `maxWidth` 属性的支持 [#12642](https://github.com/eclipse-theia/theia/pull/12642)
- [documentation] 新增 VS Code 使用政策 [#11537](https://github.com/eclipse-theia/theia/pull/11537)
- [filesystem] 修复磁盘文件系统提供者的只读权限 [#12354](https://github.com/eclipse-theia/theia/pull/12354)
- [keymaps] 改进键盘快捷键视图中操作按钮的显示 [#12675](https://github.com/eclipse-theia/theia/pull/12675)
- [playwright] 修复 `TheiaDialog` 页面对象的问题 [#12753](https://github.com/eclipse-theia/theia/pull/12753)
- [plugin] 为 `ShareProvider` VS Code API 新增存根 [#12747](https://github.com/eclipse-theia/theia/pull/12474)
- [plugin] 修复 `documentation` 的 `MarkdownString` 支持 [#12685](https://github.com/eclipse-theia/theia/pull/12685)
- [plugin] 改进写入存储时的处理 [#12717](https://github.com/eclipse-theia/theia/pull/12717)
- [preferences] 改进偏好文件按钮渲染 [#12586](https://github.com/eclipse-theia/theia/pull/12586)
- [repo] 修复 ovsx 的启动配置 [#12731](https://github.com/eclipse-theia/theia/pull/12731)
- [scm] 改进树选择样式 [#12470](https://github.com/eclipse-theia/theia/pull/12670)
- [search-in-workspace] 改进搜索选项的样式 [#12697](https://github.com/eclipse-theia/theia/pull/12697)
- [search-in-workspace] 改进树选择样式 [#12470](https://github.com/eclipse-theia/theia/pull/12470)
- [vscode] 新增对 `AuthenticationForceNewSessionOptions` 与 `detail` 消息的支持 [#12752](https://github.com/eclipse-theia/theia/pull/12752) - Contributed on behalf of STMicroelectronics
- [vscode] 新增对 `TaskPresentationOptions` close 属性的支持 [#12749](https://github.com/eclipse-theia/theia/pull/12749) - Contributed on behalf of STMicroelectronics
- [workspace] 新增对工作区文件扩展名定制的支持 [#12420](https://github.com/eclipse-theia/theia/pull/12420)
- [workspace] 实现 `CanonicalUriProvider` VS Code API [#12743](https://github.com/eclipse-theia/theia/pull/12743) - Contributed on behalf of STMicroelectronics

<a name="breaking_changes_1.40.0">[Breaking Changes:](#breaking_changes_1.40.0)</a>

- [preferences] 将 `window.tabbar.enhancedPreview` 偏好从布尔值改为枚举：[#12648](https://github.com/eclipse-theia/theia/pull/12648) - Contributed on behalf of STMicroelectronics
  - `classic`：显示带基本信息的简单标签页预览。
  - `enhanced`：显示带附加信息的增强标签页预览。（[#12350](https://github.com/eclipse-theia/theia/pull/12350) 引入的行为）
  - `visual`：显示标签页的可视化预览。（预览支持由本 PR 添加）
- [repo] 更新 GitHub 工作流以停止发布 `next` 版本 [#12699](https://github.com/eclipse-theia/theia/pull/12699)
- [workspace] 将 `CommonWorkspaceUtils` 拆分为 `WorkspaceFileService` 与 `UntitledWorkspaceService` [#12420](https://github.com/eclipse-theia/theia/pull/12420)
- [plugin] 从后端应用与插件中移除同步 `fs` 调用。插件扫描器、目录与文件处理器以及插件部署入口现为异步 API。内部的 `protected` API 受到影响。[#12798](https://github.com/eclipse-theia/theia/pull/12798)

## v1.39.0 - 06/29/2023

- [application-manager] 新增对后端打包的支持 [#12412](https://github.com/eclipse-theia/theia/pull/12412)
- [application-package] 将默认支持的 VS Code API 从 `1.77.0` 提升到 `1.78.0` [#12655](https://github.com/eclipse-theia/theia/pull/12655)
- [core] 修复调整大小时工具栏的可见性 [#12617](https://github.com/eclipse-theia/theia/pull/12617)
- [core] 改进输入框的响应速度 [#12604](https://github.com/eclipse-theia/theia/pull/12604)
- [core] 改进 rpc 协议 [#12581](https://github.com/eclipse-theia/theia/pull/12581)
- [core] 为一致性更新 `ConfirmSaveDialog` 按钮顺序 [#12559](https://github.com/eclipse-theia/theia/pull/12559)
- [core] 更新侧边面板标签溢出的处理 [#12593](https://github.com/eclipse-theia/theia/pull/12593)
- [core] 为 `1.78.0` 更新本地化元数据 [#12661](https://github.com/eclipse-theia/theia/pull/12661)
- [core] 更新对话框中输入校验的样式 [#12585](https://github.com/eclipse-theia/theia/pull/12585)
- [debug] 补充调试会话状态缺失的本地化 [#12569](https://github.com/eclipse-theia/theia/pull/12569)
- [debug] 新增对条件异常断点的支持 [#12445](https://github.com/eclipse-theia/theia/pull/12445)
- [electron] 新增次窗口支持 [#12481](https://github.com/eclipse-theia/theia/pull/12481)
- [file-search] 补充快速文件打开缺失的本地化 [#12571](https://github.com/eclipse-theia/theia/pull/12571)
- [file-search] 更新文件搜索的 `ripgrep` 参数 [#12608](https://github.com/eclipse-theia/theia/pull/12608)
- [keymaps] 修复支持键的失效 typedoc 链接 [#12573](https://github.com/eclipse-theia/theia/pull/12573)
- [monaco] 改进快速输入菜单的样式 [#12239](https://github.com/eclipse-theia/theia/pull/12239)
- [navigator] 改进打开编辑器的样式与装饰 [#12598](https://github.com/eclipse-theia/theia/pull/12598)
- [plugin] 为 `SourceControlResourceThemableDecorations.iconPath` VS Code API 新增 `ThemeIcon` 支持 [#12187](https://github.com/eclipse-theia/theia/pull/12187)
- [plugin] 为 `onWillSaveNotebookDocument` VS Code API 新增存根 [#12614](https://github.com/eclipse-theia/theia/pull/12614)
- [plugin] 新增跟踪可见 viewlet 的支持 [#12597](https://github.com/eclipse-theia/theia/pull/12597)
- [repo] 更新多个元素的 border-radius 样式 [#12252](https://github.com/eclipse-theia/theia/pull/12252)
- [repo] 更新许可证头以符合 `SPDX` 标准 [#12584](https://github.com/eclipse-theia/theia/pull/12584)
- [repo] 将内置扩展包升级到 `v1.77.0` [#12576](https://github.com/eclipse-theia/theia/pull/12576)
- [terminal] 修复 `split-terminal` 工具栏条目的可见性 [#12626](https://github.com/eclipse-theia/theia/pull/12626)
- [terminal] 修复 Windows 上的命令执行 [#12620](https://github.com/eclipse-theia/theia/pull/12620)
- [terminal] 修复调整大小时的终端闪烁 [#12587](https://github.com/eclipse-theia/theia/pull/12587)
- [vscode] 补充缺失的 editor/lineNumber/上下文菜单映射 [#12638](https://github.com/eclipse-theia/theia/pull/12638) - Contributed on behalf of STMicroelectronics
- [vscode] 新增对 `editor/title/run` 工具栏菜单的支持 [#12637](https://github.com/eclipse-theia/theia/pull/12637) - Contributed on behalf of STMicroelectronics
- [vsx-registry] 新增多注册表支持 [#12040](https://github.com/eclipse-theia/theia/pull/12040)

<a name="breaking_changes_1.39.0">[Breaking Changes:](#breaking_changes_1.39.0)</a>

- [cli] 构建流程已调整以支持后端打包 [#12412](https://github.com/eclipse-theia/theia/pull/12412)
  - `webpack` 现在把前端文件编译到 `lib/frontend` 目录（此前为 `lib`）
  - `electron-main.js` 已从 `src-gen/frontend` 移至 `src-gen/backend`
  - 使用打包后端时，`theia rebuild` 需要在相应目标的 `theia build` **之前**运行
- [repo] 随着 Inversify 6.0 的升级，若干初始化方法被调整。另见[该迁移指南条目](https://github.com/eclipse-theia/theia/blob/master/doc/Migration.md#inversify-60)。此外，其他变更包括：[#12425](https://github.com/eclipse-theia/theia/pull/12425)
  - `PreferenceProxySchema` 符号期望的类型已从 `PromiseLike<PreferenceSchema>` 更改为 `() => PromiseLike<PreferenceSchema>`
  - 符号 `OnigasmPromise` 已改为 `OnigasmProvider`，注入类型为 `() => Promise<IOnigLib>` 的函数
  - 符号 `PreferenceTransactionPrelude` 已改为 `PreferenceTransactionPreludeProvider`，注入类型为 `() => Promise<unknown>` 的函数
- [rpc] 重命名仍在引用旧 rpc 协议的类与类型后缀。从 `JsonRpc*` 改为 `Rpc*`。
  - 旧类与类型仍可用，但已被弃用，并将在未来版本中移除 [#12588](https://github.com/eclipse-theia/theia/pull/12588)
  - 例如 `JsonRpcProxyFactory` 已弃用，请改用 `RpcProxyFactory`。

## v1.38.0 - 05/25/2023

- [application-manager] 修复阻止 browser-only 构建成功的回归 [#12491](https://github.com/eclipse-theia/theia/pull/12491)
- [application-package] 将默认支持的 VS Code API 从 `1.74.2` 提升到 `1.77.0` [#12516](https://github.com/eclipse-theia/theia/pull/12516)
- [core] 为 `workbench.tab.shrinkToFit.enabled` 偏好新增 `open tabs` 下拉框 [#12411](https://github.com/eclipse-theia/theia/pull/12411)
- [core] 执行 `Clear Command History` 时新增确认提示 [#12510](https://github.com/eclipse-theia/theia/pull/12510)
- [core] 新增防止并发访问磁盘的处理 [#12236](https://github.com/eclipse-theia/theia/pull/12236)
- [core] 新增正确关闭无显式焦点的快速打开菜单的处理 [#12446](https://github.com/eclipse-theia/theia/pull/12446)
- [core] 新增 `hc-dark` 活动边框缺失的主题 [#12448](https://github.com/eclipse-theia/theia/pull/12448)
- [core] 新增对命令贡献 `enablement` 属性的支持 [#12483](https://github.com/eclipse-theia/theia/pull/12483)
- [core] 更新 JSON schema URL [#12376](https://github.com/eclipse-theia/theia/pull/12376)
- [core] 为 `1.77.0` 更新 `nls.metadata.json` [#12555](https://github.com/eclipse-theia/theia/pull/12555)
- [debug] 新增将根文件夹关联到动态调试配置的处理 [#12482](https://github.com/eclipse-theia/theia/pull/12482)
- [debug] 修复已退出线程的行为 [#12113](https://github.com/eclipse-theia/theia/pull/12113)
- [debug] 修复调试配置快速打开菜单的焦点移出问题 [#12046](https://github.com/eclipse-theia/theia/pull/12046)
- [debug] 修复启动时错误的调试配置 [#12480](https://github.com/eclipse-theia/theia/pull/12480)
- [documentation] 新增 `msgpackr` 的解决说明 [#12527](https://github.com/eclipse-theia/theia/pull/12527)
- [editor] 执行 `Clear Editor History` 时新增确认提示 [#12506](https://github.com/eclipse-theia/theia/pull/12506)
- [markers] 改进渲染标记时的性能 [#12408](https://github.com/eclipse-theia/theia/pull/12408)
- [messages] 新增在为空时正确关闭 toaster 容器的处理 [#12457](https://github.com/eclipse-theia/theia/pull/12457)
- [monaco] 修复建议列表高亮的样式 [#12317](https://github.com/eclipse-theia/theia/pull/12317)
- [plugin] 为 `ProfileContentHandler` VS Code API 新增存根 [#12535](https://github.com/eclipse-theia/theia/pull/12535)
- [plugin] 为 `TerminalQuickFixProvider` VS Code API 新增存根 [#12532](https://github.com/eclipse-theia/theia/pull/12532)
- [plugin] 为 `onWillCreateEditSessionIdentity` 新增存根 [#12533](https://github.com/eclipse-theia/theia/pull/12533)
- [plugin] 为提案中的 `DocumentPaste` VS Code API 新增存根 [#12512](https://github.com/eclipse-theia/theia/pull/12512)
- [plugin] 为提案中的 `EditSessionIdentityProvider` VS Code API 新增存根 [#12508](https://github.com/eclipse-theia/theia/pull/12508)
- [plugin] 为提案中的 `ExternalUriOpener` VS Code API 新增存根 [#12539](https://github.com/eclipse-theia/theia/pull/12539)
- [plugin] 新增对树视图工具栏中 `collapse all` 的支持 [#12514](https://github.com/eclipse-theia/theia/pull/12514)
- [plugin] 新增对 `TelemetryLogger` VS Code API 的支持 [#12453](https://github.com/eclipse-theia/theia/pull/12453)
- [plugin] 修复 `TreeView#reveal` 行为 [#12489](https://github.com/eclipse-theia/theia/pull/12489)
- [plugin] 修复移动或关闭标签页时的索引逻辑 [#12400](https://github.com/eclipse-theia/theia/pull/12400)
- [repo] 升级 `engine.io` 以修复已知漏洞 [#12556](https://github.com/eclipse-theia/theia/pull/12556)
- [repo] 升级 `socket.io-parser` 以修复已知漏洞 [#12556](https://github.com/eclipse-theia/theia/pull/12556)
- [scripts] 改进 `dash-licenses` 以处理内部错误 [#12545](https://github.com/eclipse-theia/theia/pull/12545)
- [search-in-workspace] 新增视图中的多选支持 [#12331](https://github.com/eclipse-theia/theia/pull/12331)
- [task] 改进配置与运行任务时的用户体验 [#12507](https://github.com/eclipse-theia/theia/pull/12507)
- [workspace] 为 `WorkspaceDeleteHandler` 新增异常处理 [#12544](https://github.com/eclipse-theia/theia/pull/12544)
- [workspace] 改进 `open workspace` 与 `open folder` 的行为 [#12537](https://github.com/eclipse-theia/theia/pull/12537)

<a name="breaking_changes_1.38.0">[Breaking Changes:](#breaking_changes_1.38.0)</a>

- [core] 将 `ToolbarAwareTabBar.Styles` 移至 `ScrollableTabBar.Styles` [#12411](https://github.com/eclipse-theia/theia/pull/12411/)
- [debug] 将 `DebugConfigurationManager.provideDynamicDebugConfigurations()` 的返回类型改为 `Promise<Record<string, DynamicDebugConfigurationSessionOptions[]>>` [#12482](https://github.com/eclipse-theia/theia/pull/12482)
- [workspace] 移除 `WorkspaceFrontendContribution.createOpenWorkspaceOpenFileDialogProps(...)` 与 `WorkspaceFrontendContribution.preferences` [#12537](https://github.com/eclipse-theia/theia/pull/12537)

## v1.37.0 - 04/27/2023

- [application-package] 将默认支持的 VS Code API 从 `1.72.2` 提升到 `1.74.2` [#12468](https://github.com/eclipse-theia/theia/pull/12468)
- [cli] 新增在声明插件 URL 时对 `${targetPlatform}` 的支持 [#12410](https://github.com/eclipse-theia/theia/pull/12410)
- [core] 新增对动态标签页缩放策略的支持（由 `workbench.tab.shrinkToFit.enabled` 控制）[#12360](https://github.com/eclipse-theia/theia/pull/12360)
- [core] 新增对悬停时增强 `tabbar` 预览的支持 [#12350](https://github.com/eclipse-theia/theia/pull/12350)
- [core] 新增使用 VS Code 的 `l10n` 进行本地化的支持 [#12192](https://github.com/eclipse-theia/theia/pull/12192)
- [core] 新增对在树迭代器中推送大量条目的支持 [#12172](https://github.com/eclipse-theia/theia/pull/12172)
- [core] 新增对 `highlightModifiedTabs` 的主题支持 [#12367](https://github.com/eclipse-theia/theia/pull/12367)
- [core] 修复 `theia-file-icons` 主题并非总是被应用的问题 [#12419](https://github.com/eclipse-theia/theia/pull/12419)
- [core] 修复因 padding 导致的树中右键行为问题 [#12436](https://github.com/eclipse-theia/theia/pull/12436)
- [core] 用 `@theia/request` 替换 `request` [#12413](https://github.com/eclipse-theia/theia/pull/12413)
- [debug] 修复 `getTrackableWidgets` 未返回正确结果的问题 [#12241](https://github.com/eclipse-theia/theia/pull/12241)
- [electron] 将 `electron` 升级到 `23.2.4` [#12464](https://github.com/eclipse-theia/theia/pull/12464)
- [keymaps] 改进搜索快捷键时的搜索体验 [#12312](https://github.com/eclipse-theia/theia/pull/12312)
- [monaco] 补充缺失的本地化 [#12378](https://github.com/eclipse-theia/theia/pull/12378)
- [monaco] 新增对 `inQuickOpen` when 子句上下文的支持 [#12427](https://github.com/eclipse-theia/theia/pull/12427)
- [monaco] 修复 `parseSnippets` 处理 [#12463](https://github.com/eclipse-theia/theia/pull/12463)
- [monaco] 修复 `Save As...` 上限 [#12418](https://github.com/eclipse-theia/theia/pull/12418)
- [playwright] 新增终端页面对象 [#12381](https://github.com/eclipse-theia/theia/pull/12381)
- [playwright] 将 `playwright` 升级到最新版本 [#12384](https://github.com/eclipse-theia/theia/pull/12384)
- [plugin] 调用 `vscode.open` 命令时新增错误反馈 [#12284](https://github.com/eclipse-theia/theia/pull/12284)
- [plugin] 新增确保树视图 ID 唯一的处理 [#12338](https://github.com/eclipse-theia/theia/pull/12338)
- [plugin] 新增在未提供 `scope` 时默认使用 `TaskScope.Workspace` 的处理 [#12431](https://github.com/eclipse-theia/theia/pull/12431)
- [plugin] 为 `TestRunProfile#supportsContinuousRun` VS Code API 新增存根 [#12456](https://github.com/eclipse-theia/theia/pull/12456)
- [plugin] 新增对 `CommentThread#state` VS Code API 的支持 [#12454](https://github.com/eclipse-theia/theia/pull/12454)
- [plugin] 新增对 `onTaskType` when 子句上下文的支持 [#12431](https://github.com/eclipse-theia/theia/pull/12431)
- [plugin] 修复拖放时的文件存在性检查 [#12409](https://github.com/eclipse-theia/theia/pull/12409)
- [plugin] 修复树视图中的内存泄漏 [#12353](https://github.com/eclipse-theia/theia/pull/12353)
- [plugin] 实现 VS Code `LogOutputChannel` API [#12017](https://github.com/eclipse-theia/theia/pull/12429) - Contributed on behalf of STMicroelectronics
- [preferences] 改进偏好的本地化 [#12378](https://github.com/eclipse-theia/theia/pull/12378)
- [search-in-workspace] 补充 glob 输入框缺失的占位符 [#12389](https://github.com/eclipse-theia/theia/pull/12389)
- [search-in-workspace] 修复 `patternExcludesInputBoxFocus` when 子句处理器 [#12385](https://github.com/eclipse-theia/theia/pull/12385)

<a name="breaking_changes_1.37.0">[Breaking Changes:](#breaking_changes_1.37.0)</a>

- [core] 将 `CorePreferences` 注入 `DockPanelRenderer` 构造函数 [12360](https://github.com/eclipse-theia/theia/pull/12360)
- [core] 引入 `ScrollableTabBar.updateTabs()` 以完整渲染标签页 [12360](https://github.com/eclipse-theia/theia/pull/12360)
- [plugin] 将 `output-channel-item.ts` 中成员 `proxy` 与函数 `validate()` 的可见性从 `private` 改为 `protected` [#12017](https://github.com/eclipse-theia/theia/pull/12429)
- [plugin] 从 `plugin/src/theia-proposed.d.ts` 移除枚举 `LogLevel` 与命名空间 `env` [#12017](https://github.com/eclipse-theia/theia/pull/12429)

## v1.36.0 0 - 03/30/2023

- [application-manager] 将 `webpack` 升级到 `5.76.0` [#12316](https://github.com/eclipse-theia/theia/pull/12316)
- [cli] 更新 `puppeteer` 版本 [#12222](https://github.com/eclipse-theia/theia/pull/12222)
- [core] 为应用窗口新增对 `applicationName` 的回退 [#12265](https://github.com/eclipse-theia/theia/pull/12265)
- [core] 在 `SingleTextInputDialog` 中新增对 `placeholder` 的支持 [#12244](https://github.com/eclipse-theia/theia/pull/12244)
- [core] 修复 `waitForHidden` 方法实现以正确检查可见性 [#12300](https://github.com/eclipse-theia/theia/pull/12300)
- [core] 修复按 schema 渲染偏好时的处理 [#12347](https://github.com/eclipse-theia/theia/pull/12347)
- [core] 修复带 when 子句的工具栏条目渲染问题 [#12329](https://github.com/eclipse-theia/theia/pull/12329)
- [core] 修复有条目时的标签栏渲染 [#12307](https://github.com/eclipse-theia/theia/pull/12307)
- [core] 修复调试配置的 `merge` [#12174](https://github.com/eclipse-theia/theia/pull/12174)
- [core] 改进 `isObject<T>` 的类型定义 [#12259](https://github.com/eclipse-theia/theia/pull/12259)
- [core] 更新对话框样式 [#12254](https://github.com/eclipse-theia/theia/pull/12254)
- [debug] 为 `DebugSessionOptions` VS Code API 新增抑制支持 [#12220](https://github.com/eclipse-theia/theia/pull/12220)
- [debug] 改进断点装饰渲染 [#12249](https://github.com/eclipse-theia/theia/pull/12249)
- [file-search] 更新找不到文件时的处理 [#12255](https://github.com/eclipse-theia/theia/pull/12255)
- [monaco] 修复 `MonacoOutlineContribution` 中错误的范围 [#12306](https://github.com/eclipse-theia/theia/pull/12306)
- [monaco] 修复快速输入第一个元素无法被初始选中的问题 [#12208](https://github.com/eclipse-theia/theia/pull/12208)
- [outline-view] 新增 "expand-all" 工具栏条目 [#12188](https://github.com/eclipse-theia/theia/pull/12188)
- [plugin] 新增确保树节点 ID 唯一的处理 [#12120](https://github.com/eclipse-theia/theia/pull/12120)
- [plugin] 新增对 `OnEnterRule` 的恰当处理 [#12228](https://github.com/eclipse-theia/theia/pull/12228)
- [plugin] 为提案中的 `extensions.allAcrossExtensionHosts` VS Code API 新增存根 [#12277](https://github.com/eclipse-theia/theia/pull/12277)
- [plugin] 新增对 `TerminalExitReason` VS Code API 的支持 [#12293](https://github.com/eclipse-theia/theia/pull/12293)
- [plugin] 新增对 `ViewBadge` VS Code API 的支持 [#12330](https://github.com/eclipse-theia/theia/pull/12330)
- [plugin] 将默认支持的 API 提升到 `1.72.2` [#12359](https://github.com/eclipse-theia/theia/pull/12359)
- [plugin] 修复导致文件监视事件丢失的问题 [#12264](https://github.com/eclipse-theia/theia/pull/12264)
- [plugin] 修复 `PseudoTerminal` 事件的问题 [#12146](https://github.com/eclipse-theia/theia/pull/12146)
- [plugin] 修复插件代理支持 [#12266](https://github.com/eclipse-theia/theia/pull/12266)
- [plugin] 修复设置 webview 标题时的递归 [#12221](https://github.com/eclipse-theia/theia/pull/12221)
- [plugin] 将插件日志级别降为 debug [#12224](https://github.com/eclipse-theia/theia/pull/12224)
- [scm] 修复内联工具栏命令执行 [#12295](https://github.com/eclipse-theia/theia/pull/12295)
- [terminal] 新增终端中对上下文菜单的支持 [#12326](https://github.com/eclipse-theia/theia/pull/12326)
- [terminal] 修复无工作区时新终端无法生成的问题 [#12322](https://github.com/eclipse-theia/theia/pull/12322)
- [terminal] 修复快速生成多个终端时的终端创建问题 [#12225](https://github.com/eclipse-theia/theia/pull/12225)
- [toolbar] 修复工具栏中的 `dragOver` 行为 [#12257](https://github.com/eclipse-theia/theia/pull/12257)
- [workspace] 简化 `add folder` 与 `remove folder` 命令实现 [#12242](https://github.com/eclipse-theia/theia/pull/12242)
- [workspace] 更新 `rename` 命令在成功时返回 `stat` [#12278](https://github.com/eclipse-theia/theia/pull/12278)

<a name="breaking_changes_1.36.0">[Breaking Changes:](#breaking_changes_1.36.0)</a>

- [core] 将默认图标主题从 `none` 改为 `theia-file-icons` [#11028](https://github.com/eclipse-theia/theia/pull/12346)
- [plugin] 将 `TreeViewExtImpl#toTreeItem()` 重命名为 `TreeViewExtImpl#toTreeElement()`
- [scm] 修复 `scm` 内联工具栏命令，该改动引入以下破坏：[#12295](https://github.com/eclipse-theia/theia/pull/12295)
  - 接口 `ScmInlineAction` 移除 `commands: CommandRegistry`
  - 接口 `ScmInlineActions` 移除 `commands: CommandRegistry`
  - 接口 `ScmTreeWidget.Props` 移除 `commands: CommandRegistry`
- [terminal] 从 `TerminalFrontendContribution` 中移除 `openTerminalFromProfile` 方法 [#12322](https://github.com/eclipse-theia/theia/pull/12322)
- [electron] 在 Electron 渲染进程中启用上下文隔离并禁用 node 集成（<https://github.com/eclipse-theia/theia/issues/2018>）

## v1.35.0 - 02/23/2023

- [application-package] 将默认支持的 VS Code API 更新为 `1.70.1` [#12200](https://github.com/eclipse-theia/theia/pull/12200)
- [core] 新增存在未保存编辑器时关机的处理 [#12166](https://github.com/eclipse-theia/theia/pull/12166)
- [core] 修复 `ToolbarItem.when` 处理 [#12067](https://github.com/eclipse-theia/theia/pull/12067)
- [core] 修复带工具栏条目的视图标题样式 [#12077](https://github.com/eclipse-theia/theia/pull/12077)
- [core] 实现 `workbench.editor.revealIfOpen` 偏好 [#12145](https://github.com/eclipse-theia/theia/pull/12145)
- [core] 改进树与选择组件的轮廓样式 [#12156](https://github.com/eclipse-theia/theia/pull/12156)
- [core] 将本地化更新到 VS Code `1.70.2` [#12205](https://github.com/eclipse-theia/theia/pull/12205)
- [debug] 新增调试级别选择器的本地化 [#12033](https://github.com/eclipse-theia/theia/pull/12033)
- [debug] 修复元数据更新时断点事件的处理 [#12183](https://github.com/eclipse-theia/theia/pull/12183)
- [debug] 修复 `DebugSession` 中的指令断点 [#12190](https://github.com/eclipse-theia/theia/pull/12190)
- [debug] 移除不必要的"下载调试适配器"脚本 [#12150](https://github.com/eclipse-theia/theia/pull/12150)
- [editor] 新增在同一标签栏关闭重复编辑器的处理 [#12147](https://github.com/eclipse-theia/theia/pull/12147)
- [filesystem] 新增在文件对话框中切换显示隐藏文件/文件夹的选项 [#12179](https://github.com/eclipse-theia/theia/pull/12179)
- [filesystem] 修复 `NsfwWatcher` 中的内存泄漏 [#12144](https://github.com/eclipse-theia/theia/pull/12144)
- [filesystem] 将 trash 从 `6.1.1` 升级到 `7.2.0` [#12133](https://github.com/eclipse-theia/theia/pull/12133)
- [navigator] 更新打开编辑器的恢复处理 [#12210](https://github.com/eclipse-theia/theia/pull/12210)
- [playwright] 将 `@playwright/test` 依赖升级到 `1.30.0` [#12141](https://github.com/eclipse-theia/theia/pull/12141)
- [plugin] 新增自动生成激活事件的能力 [#12167](https://github.com/eclipse-theia/theia/pull/12167)
- [plugin] 新增插件通过方括号语法访问语言覆盖的处理 [#12136](https://github.com/eclipse-theia/theia/pull/12136)
- [plugin] 新增对 `DocumentDropEditProvider` 的支持 [#12125](https://github.com/eclipse-theia/theia/pull/12125)
- [plugin] 新增对 `activeWebviewPanelId` when 子句上下文的支持 [#12182](https://github.com/eclipse-theia/theia/pull/12182)
- [plugin] 向插件暴露终端命令 [#12134](https://github.com/eclipse-theia/theia/pull/12134)
- [plugin] 修复模态通知的焦点问题 [#12206](https://github.com/eclipse-theia/theia/pull/12206)
- [plugin] 实现 VS Code `Tab` API [#12109](https://github.com/eclipse-theia/theia/pull/12109)
- [plugin] 实现 `WorkspaceEditMetadata` VS Code API [#12193](https://github.com/eclipse-theia/theia/pull/12193)
- [plugin] 更新 `Webview` 未实现 `WebviewPanelSerializer` 时的恢复处理 [#12138](https://github.com/eclipse-theia/theia/pull/12138)
- [repo] 修复 API 集成测试套件 [#12117](https://github.com/eclipse-theia/theia/pull/12117)
- [scripts] 修复编译包引用时的比较 [#12122](https://github.com/eclipse-theia/theia/pull/12122)
- [terminal] 新增终端配置文件中对多根工作区的支持 [#12199](https://github.com/eclipse-theia/theia/pull/12199)
- [terminal] 修复启动时未设置默认终端配置文件的问题 [#12191](https://github.com/eclipse-theia/theia/pull/12191)
- [workspace] 新增确保根唯一的处理 [#12159](https://github.com/eclipse-theia/theia/pull/12159)
- [workspace] 更新输入对话框的样式 [#12158](https://github.com/eclipse-theia/theia/pull/12158)

<a name="breaking_changes_1.35.0">[Breaking Changes:](#breaking_changes_1.35.0)</a>

- [repo] 停止支持 `Node 14` [#12169](https://github.com/eclipse-theia/theia/pull/12169)

## v1.34.0 - 01/26/2023

- [application-package] 将默认支持的 API 版本从 `1.55.2` 提升到 `1.66.2` [#12104](https://github.com/eclipse-theia/theia/pull/12104)
- [cli] 新增下载插件时使用客户端限流的能力 [#11962](https://github.com/eclipse-theia/theia/pull/11962)
- [core] 改进包含大量内容的对话框显示 [#12052](https://github.com/eclipse-theia/theia/pull/12052)
- [core] 改进 `BackendApplication` 中"未捕获错误"处理器的可扩展性 [#12068](https://github.com/eclipse-theia/theia/pull/12068)
- [core] 改进内容溢出时 `select-dropdown` 组件的样式 [#12038](https://github.com/eclipse-theia/theia/pull/12038)
- [core] 重构以将 `fsPath` 用于 `COPY_PATH` 命令 [#12002](https://github.com/eclipse-theia/theia/pull/12002)
- [core] 将 `nsfw` 从 `2.1.2` 更新到 `2.2.4` [#11975](https://github.com/eclipse-theia/theia/pull/11975)
- [core] 将 `vscode-languageserver-protocol` 从 `3.15.3` 更新到 `3.17.2` [#12012](https://github.com/eclipse-theia/theia/pull/12012)
- [debug] 修复大量与调试相关的问题 [#11984](https://github.com/eclipse-theia/theia/pull/11984)
- [debug] 修复内容溢出时悬停部件的样式 [#12058](https://github.com/eclipse-theia/theia/pull/12058)
- [debug] 修复视图中变量的样式 [#12089](https://github.com/eclipse-theia/theia/pull/12089)
- [filesystem] 补充 "preparing download" 消息缺失的本地化 [#12041](https://github.com/eclipse-theia/theia/pull/12041)
- [filesystem] 补充已删除标签后缀缺失的本地化 [#12032](https://github.com/eclipse-theia/theia/pull/12032)
- [filesystem] 更新根节点子级的样式以包含额外的深度缩进 [#11967](https://github.com/eclipse-theia/theia/pull/11967)
- [filesystem] 更新 `UPLOAD` 命令的可见性 [#11756](https://github.com/eclipse-theia/theia/pull/11756)
- [getting-started] 修复 getting-started 部件不接受焦点的问题 [#11807](https://github.com/eclipse-theia/theia/pull/11807)
- [memory-view] 更新变量请求失败时的处理 [#11928](https://github.com/eclipse-theia/theia/pull/11928)
- [monaco] 改进快速输入菜单的响应速度 [#12095](https://github.com/eclipse-theia/theia/pull/12095)
- [navigator] 在标签上下文菜单中新增 `OPEN_CONTAINING_FOLDER` 命令 [#12076](https://github.com/eclipse-theia/theia/pull/12076)
- [plugin] 新增对 `Diagnostic.code` API 的完整支持 [#11765](https://github.com/eclipse-theia/theia/pull/11765)
- [plugin] 新增顶层偏好访问的处理 [#12056](https://github.com/eclipse-theia/theia/pull/12056)
- [plugin] 在 `TerminalOptions` 与 `ExtensionTerminalOptions` VS Code API 中新增对 `iconPath` 和 `color` 的部分支持 [#12060](https://github.com/eclipse-theia/theia/pull/12060)
- [plugin] 为与 tab 相关的 VS Code API 新增存根 [#12031](https://github.com/eclipse-theia/theia/pull/12031)
- [plugin] 在 `InputBox` VS Code API 中新增对 `valueSelection` 的支持 [#12050](https://github.com/eclipse-theia/theia/pull/12050)
- [plugin] 在 `CodeActionKind` VS Code API 中新增对 `RefactorMove` 的支持 [#12039](https://github.com/eclipse-theia/theia/pull/12039)
- [plugin] 在 `SourceControlInputBox` VS Code API 中新增对 `enabled` 的支持 [#12069](https://github.com/eclipse-theia/theia/pull/12069)
- [plugin] 在 `TerminalOptions` 与 `ExternalTerminalOptions` VS Code API 中新增对 `isTransient` 的支持 [#12055](https://github.com/eclipse-theia/theia/pull/12055) - Contributed on behalf of STMicroelectronics
- [plugin] 在 `TerminalOptions` VS Code API 中新增对 `location` 的支持 [#12006](https://github.com/eclipse-theia/theia/pull/12006)
- [plugin] 在 `Comment` VS Code API 中新增对 `timestamp` 的支持 [#12007](https://github.com/eclipse-theia/theia/pull/12007)
- [plugin] 新增树视图中的多选支持 [#12088](https://github.com/eclipse-theia/theia/pull/12088)
- [plugin] 新增对 `DataTransfer` VS Code API 的支持 [#12065](https://github.com/eclipse-theia/theia/pull/12065)
- [plugin] 新增对 `SnippetTextEdit` VS Code API 的支持 [#12047](https://github.com/eclipse-theia/theia/pull/12047)
- [plugin] 新增对 `TerminalProfile` VS Code API 的支持 [#12066](https://github.com/eclipse-theia/theia/pull/12066)
- [plugin] 新增对 `TreeDragAndDropController` VS Code API 的支持 [#12065](https://github.com/eclipse-theia/theia/pull/12065)
- [plugin] 修复 `WebView` 对 `vscode-resource` 的 CORS 处理 [#12070](https://github.com/eclipse-theia/theia/pull/12070)
- [plugin] 修复 `WebView` VS Code API 的不一致性 [#12091](https://github.com/eclipse-theia/theia/pull/12091) - Contributed on behalf of STMicroelectronics
- [plugin] 修复启动伪终端时的回归 [#12098](https://github.com/eclipse-theia/theia/pull/12098)
- [repo] 补充对话框中缺失的本地化 [#12062](https://github.com/eclipse-theia/theia/pull/12062)
- [repo] 新增对象的简化类型检查 [#11831](https://github.com/eclipse-theia/theia/pull/11831)
- [repo] 将默认本地化更新到 `1.68.1` [#12092](https://github.com/eclipse-theia/theia/pull/12092)
- [scm] 新增对由 `SourceControlResourceDecorations` VS Code API 贡献的 `strikethrough` 装饰的支持 [#11999](https://github.com/eclipse-theia/theia/pull/11999)
- [terminal] 新增对 `terminal.integrated.enablePersistentSessions` 偏好的支持，允许禁用重新加载时恢复终端 [#12055](https://github.com/eclipse-theia/theia/pull/12055) - Contributed on behalf of STMicroelectronics
- [terminal] 移除不必要的 `RPCProtocol` 使用 [#11972](https://github.com/eclipse-theia/theia/pull/11972)
- [variable-resolver] 修复 `pickString` 变量的求值 [#12100](https://github.com/eclipse-theia/theia/pull/12100) - Contributed on behalf of STMicroelectronics
- [workspace] 重构以将 `fsPath` 用于 `COPY_RELATIVE_PATH` 命令 [#12002](https://github.com/eclipse-theia/theia/pull/12002)

<a name="breaking_changes_1.34.0">[Breaking Changes:](#breaking_changes_1.34.0)</a>

- [plugin-ext] 将 `TreeViewWidgetIdentifier` 重命名为 `TreeViewWidgetOptions`，因为新增了更多字段 [12065](https://github.com/eclipse-theia/theia/pull/12065)
