# 变更日志 2024

## 1.57.0 - 12/16/2024

- [ai] 新增对 MCP 的初始支持 [#14598](https://github.com/eclipse-theia/theia/pull/14598)
- [ai] 新增对 Anthropic 作为 LLM 提供商的支持 [#14614](https://github.com/eclipse-theia/theia/pull/14614)
- [ai] 修复聊天部件激活时启用聊天输入的逻辑 [#14608](https://github.com/eclipse-theia/theia/pull/14608) - Contributed on behalf of STMicroelectronics
- [ai] 修复等待输入时隐藏 "Generating..." 的逻辑 [#14559](https://github.com/eclipse-theia/theia/pull/14559) - Contributed on behalf of STMicroelectronics
- [ai] 集成 SCANOSS [#14628](https://github.com/eclipse-theia/theia/pull/14628)
- [ai] 更新逻辑：在聊天 UI 中为 markdown 链接调用 OpenerService [#14602](https://github.com/eclipse-theia/theia/pull/14602) - Contributed on behalf of STMicroelectronics
- [application-package] 将 API 版本提升到 1.96.0 [#14634](https://github.com/eclipse-theia/theia/pull/14634) - Contributed on behalf of STMicroelectronics
- [core] 新增鼠标退出时取消待处理悬停的逻辑 [#14533](https://github.com/eclipse-theia/theia/pull/14533)
- [core] 修复 "Collapse Side Panel" 标签栏上下文菜单项的启用状态 [#14616](https://github.com/eclipse-theia/theia/pull/14616)
- [core] 修复使用启动画面时的窗口最大化问题 [#14219](https://github.com/eclipse-theia/theia/pull/14219)
- [core] 将 perfect-scrollbar 固定到 1.5.5 [#14592](https://github.com/eclipse-theia/theia/pull/14592) - Contributed on behalf of STMicroelectronics
- [dev-container] 新增使 DevContainer 工作区可通过最近工作区打开的逻辑 [#14567](https://github.com/eclipse-theia/theia/pull/14567)
- [dev-container] 新增对 THEIA_DEFAULT_PLUGINS 环境变量的支持 [#14530](https://github.com/eclipse-theia/theia/pull/14530)
- [dev-container] 改进 searchForDevontainerJsonFiles 使其不阻塞服务器 [#14563](https://github.com/eclipse-theia/theia/pull/14563)
- [dev-container] 更新逻辑以确保 dev container 使用正确的工作区 [#14557](https://github.com/eclipse-theia/theia/pull/14557)
- [dev-container] 更新逻辑以包含来自本地用户目录的设置与配置 [#14548](https://github.com/eclipse-theia/theia/pull/14548)
- [dev-container] 更新逻辑以在 darwin/arm64 上拉取 amd64 容器镜像 [#14552](https://github.com/eclipse-theia/theia/pull/14552)
- [editor] 修复编辑器偏好的本地化 [#14018](https://github.com/eclipse-theia/theia/pull/14018)
- [notebook] 新增支持隐藏单元格的基础能力 [#14573](https://github.com/eclipse-theia/theia/pull/14573)
- [notebook] 新增对不可见单元格的修复 [#14617](https://github.com/eclipse-theia/theia/pull/14617)
- [notebook] 修复更新输出时的单元格高度 [#14621](https://github.com/eclipse-theia/theia/pull/14621)
- [notebook] 修复以已有输出添加的单元格的输出渲染 [#14618](https://github.com/eclipse-theia/theia/pull/14618)
- [plugin] 引入 IconPath 类型 [#14590](https://github.com/eclipse-theia/theia/pull/14590) - Contributed on behalf of STMicroelectronics
- [plugin] 存根 TestRunProfile#loadDetailedCoverageForTest [#14599](https://github.com/eclipse-theia/theia/pull/14599) - Contributed on behalf of STMicroelectronics
- [plugin] 将内置插件更新到 1.95.3 [#14606](https://github.com/eclipse-theia/theia/pull/14606)

<a name="breaking_changes_1.57.0">[Breaking Changes:](#breaking_changes_1.57.0)</a>

- [remote] 连接远程时使用本地设置与配置（重绑定 UserStorageProvider）[#14548]<https://github.com/eclipse-theia/theia/pull/14548/>

## 1.56.0 - 11/28/2024

- [ai] 支持用户指定自定义请求设置、模型以及可选的提供商专属设置 [#14535](https://github.com/eclipse-theia/theia/pull/14535)
- [ai] 允许指定用于 AI 代码补全上下文的最大行数 [#14539](https://github.com/eclipse-theia/theia/pull/14539)
- [ai] 为 agent 与变量新增悬停 [#14498](https://github.com/eclipse-theia/theia/pull/14498)
- [ai] 允许在提示词模板中使用注释 [#14470](https://github.com/eclipse-theia/theia/pull/14470)
- [ai] 将本地模型加入非流式接受列表 [#14420](https://github.com/eclipse-theia/theia/pull/14420)
- [ai] 允许取消 llama-file 请求 [#14515](https://github.com/eclipse-theia/theia/pull/14515)
- [ai] 在工具调用响应渲染器中显示参数 [#14424](https://github.com/eclipse-theia/theia/pull/14424)
- [ai] 支持提示词变体 [#14487](https://github.com/eclipse-theia/theia/pull/14487)
- [ai] 默认关闭自动内联补全 [#14513](https://github.com/eclipse-theia/theia/pull/14513)
- [ai] 修复 HF 提供商中的请求设置与停止词 [#14504](https://github.com/eclipse-theia/theia/pull/14504)
- [ai] 新增在工作区函数中忽略文件的偏好 [#14449](https://github.com/eclipse-theia/theia/pull/14449)
- [ai] 修复提示词模板贡献类别与模板 [#14497](https://github.com/eclipse-theia/theia/pull/14497)
- [ai] chore: 避免打开聊天窗口的快捷键冲突 [#14495](https://github.com/eclipse-theia/theia/pull/14495)
- [ai] 支持 agent 请求输入并继续 [#14486](https://github.com/eclipse-theia/theia/pull/14486) - Contributed on behalf of STMicroelectronics
- [ai] 计算代码补全时显示进度 [#14537](https://github.com/eclipse-theia/theia/pull/14537)
- [ai] 修复 AI 历史视图首次使用时崩溃 [#14443](https://github.com/eclipse-theia/theia/pull/14443)
- [ai] fix: 在聊天视图中添加 React key [#14444](https://github.com/eclipse-theia/theia/pull/14444)
- [ai] 在 AI 配置视图的 LLM 选择对话框中对模型排序 [#14442](https://github.com/eclipse-theia/theia/pull/14442)
- [ai] 新增对 Hugging Face 的支持 [#14412](https://github.com/eclipse-theia/theia/pull/14412)
- [ai] 新增手动 AI 代码补全 [#14393](https://github.com/eclipse-theia/theia/pull/14393)
- [ai] 改进工作区 agent 函数与提示词 [#14426](https://github.com/eclipse-theia/theia/pull/14426)
- [ai] 改进 agent 历史记录 [#14378](https://github.com/eclipse-theia/theia/pull/14378)
- [ai] 允许重新打开 AI 历史部件 [#14422](https://github.com/eclipse-theia/theia/pull/14422)
- [ai] 避免提示词模板目录错误 [#14421](https://github.com/eclipse-theia/theia/pull/14421)
- [ai] 动态调整聊天输入高度 [#14432](https://github.com/eclipse-theia/theia/pull/14432)
- [ai] fix: 允许变量使用全部三种括号 [#14465](https://github.com/eclipse-theia/theia/pull/14465)
- [ai] 允许通过提示词模板文件添加变体 [#14509](https://github.com/eclipse-theia/theia/pull/14509)
- [application-package] 将 API 版本提升到 1.95.3 [#14541](https://github.com/eclipse-theia/theia/pull/14541) - Contributed on behalf of STMicroelectronics
- [browser-only] 移除 browserfs 依赖（由 OPFS 取代）[#14263](https://github.com/eclipse-theia/theia/pull/14263)
- [core] 将 Inversify 更新到最新 [#14435](https://github.com/eclipse-theia/theia/pull/14435)
- [core] 将 parcel watcher 更新到 2.5.0 [#14545](https://github.com/eclipse-theia/theia/pull/14545)
- [core] 修复 SelectComponent 下拉框底部的计算 [#14381](https://github.com/eclipse-theia/theia/pull/14381)
- [core] 修复 electron 窗口背景色 [#14491](https://github.com/eclipse-theia/theia/pull/14491) - Contributed on behalf of STMicroelectronics
- [core] fix: 通过固定/取消固定保留可关闭状态 [#14377](https://github.com/eclipse-theia/theia/pull/14377) - Contributed on behalf of STMicroelectronics
- [core] 修复 viewWelcome 与 VS Code 的对齐 [#14391](https://github.com/eclipse-theia/theia/pull/14391)
- [core] 修复 Electron 中最上方上下文菜单项有时不可点击的问题 [#14401](https://github.com/eclipse-theia/theia/pull/14401)
- [debug] 禁用编辑只读变量 [#14440](https://github.com/eclipse-theia/theia/pull/14440)
- [dev-container] 修复断开连接与应用关闭时容器未停止的问题 [#14542](https://github.com/eclipse-theia/theia/pull/14542)
- [electron] 将 Electron 版本固定到 30.1.2 [#14407](https://github.com/eclipse-theia/theia/pull/14407) - Contributed on behalf of STMicroelectronics
- [filesystem] 新增 formatOnSave 期间对 files.insertFinalNewline 的支持 [#13751](https://github.com/eclipse-theia/theia/pull/13751) - Contributed on behalf of STMicroelectronics
- [plugin] 为单元格输出添加最小高度 [#14488](https://github.com/eclipse-theia/theia/pull/14488)
- [plugin] 修复选择并改进活动文本编辑器行为 [#14480](https://github.com/eclipse-theia/theia/pull/14480)
- [plugin] 支持 MappedEditProviders 提案 API 演进 [#14453](https://github.com/eclipse-theia/theia/pull/14453) - Contributed on behalf of STMicroelectronics
- [plugin] 新增对 ThemeColor 属性 id 的支持 [#14437](https://github.com/eclipse-theia/theia/pull/14437) - Contributed on behalf of STMicroelectronics
- [plugin] 新增对属性 ThemeColor ID 的支持 [#14437](https://github.com/eclipse-theia/theia/pull/14437) - Contributed on behalf of STMicroelectronics
- [plugin-ext] 修复在顶部创建单元格时输出重叠的问题 [#14417](https://github.com/eclipse-theia/theia/pull/14417)
- [plugin-ext] 修复活动 notebook 编辑器在编辑器活动期间保持活动的问题 [#14419](https://github.com/eclipse-theia/theia/pull/14419)
- [metrics] 修复 MeasurementNotificationService 绑定 [#14439](https://github.com/eclipse-theia/theia/pull/14439)

<a name="breaking_changes_1.56.0">[Breaking Changes:](#breaking_changes_1.56.0)</a>

- [core] 修复关闭时对话框的释放 - [#14456](https://github.com/eclipse-theia/theia/pull/14456) - Contributed on behalf of STMicroelectronics

## 1.55.0 - 10/31/2024

- [ai] 新增对 AI 历史视图排序与清空的支持 [#14233](https://github.com/eclipse-theia/theia/pull/14233)
- [ai] 新增将文件排除出代码补全的偏好 [#14315](https://github.com/eclipse-theia/theia/pull/14315)
- [ai] 新增对自定义 agent 的支持 [#14301](https://github.com/eclipse-theia/theia/pull/14301)
- [ai] 新增对自定义 Open AI 模型自定义密钥的支持 [#14299](https://github.com/eclipse-theia/theia/pull/14299)
- [ai] 新增对 llamafile 作为 AI 模型提供商的支持 [#14281](https://github.com/eclipse-theia/theia/pull/14281)
- [ai] 新增对 o1-preview 的支持 [#14356](https://github.com/eclipse-theia/theia/pull/14356)
- [ai] 新增使响应解析可扩展的支持 [#14196](https://github.com/eclipse-theia/theia/pull/14196) - Contributed on behalf of STMicroelectronics
- [ai] 新增按会话查询历史的支持 [#14368](https://github.com/eclipse-theia/theia/pull/14368) - Contributed on behalf of STMicroelectronics
- [ai] 修复 markdown 请求渲染器 [#14211](https://github.com/eclipse-theia/theia/pull/14211)
- [ai] 改进自定义 OpenAI 与 llama-file 偏好描述 [#14376](https://github.com/eclipse-theia/theia/pull/14376)
- [ai] 改进聊天部件样式 [#14278](https://github.com/eclipse-theia/theia/pull/14278) - Contributed on behalf of STMicroelectronics
- [ai] 更新支持结构化输出的 OpenAI 模型列表 [#14247](https://github.com/eclipse-theia/theia/pull/14247)
- [ai] 更新逻辑使编排器记录其自身请求 [#14255](https://github.com/eclipse-theia/theia/pull/14255)
- [ai] 更新逻辑允许定制 LLM 请求设置 [#14284](https://github.com/eclipse-theia/theia/pull/14284) - Contributed on behalf of STMicroelectronics
- [ai] 更新逻辑避免代码响应部分换行 [#14363](https://github.com/eclipse-theia/theia/pull/14363)
- [ai] 更新终端 agent 以记录其请求 [#14246](https://github.com/eclipse-theia/theia/pull/14246)
- [application-package] 新增设置配置区域的应用属性 [#14319](https://github.com/eclipse-theia/theia/pull/14319) - Contributed on behalf of STMicroelectronics
- [application-package] 将 API 版本提升到 1.94.2 [#14371](https://github.com/eclipse-theia/theia/pull/14371) - Contributed on behalf of STMicroelectronics
- [cli] 将 puppeteer 升级到 23.1.0 [#14261](https://github.com/eclipse-theia/theia/pull/14261) - Contributed on behalf of STMicroelectronics
- [core] 修复导入 ReactDialog 时的循环导入 [#14352](https://github.com/eclipse-theia/theia/pull/14352)
- [core] 修复 css calc 表达式，使运算符两侧有空格 [#14241](https://github.com/eclipse-theia/theia/pull/14241) - Contributed on behalf of STMicroelectronics
- [core] 修复重复的文本编辑器条目 [#14238](https://github.com/eclipse-theia/theia/pull/14238)
- [core] 改进部件特定的状态栏处理 [#14239](https://github.com/eclipse-theia/theia/pull/14239)
- [core] 用 @parcel/watcher 替换 nsfw [#14194](https://github.com/eclipse-theia/theia/pull/14194)
- [core] 更新逻辑以降低启动时菜单栏的设置频率 [#14295](https://github.com/eclipse-theia/theia/pull/14295) - Contributed on behalf of STMicroelectronics
- [core] 更新逻辑使菜单处理器 id 从 1 开始而非 0 [#14282](https://github.com/eclipse-theia/theia/pull/14282) - Contributed on behalf of STMicroelectronics
- [core] 将 express 升级到 4.21.0 [#14283](https://github.com/eclipse-theia/theia/pull/14283) - Contributed on behalf of STMicroelectronics
- [filesystem] 新增"新建文件"对话框接受 Enter 以确认默认值的逻辑 [#14146](https://github.com/eclipse-theia/theia/pull/14146)
- [filesystem] 更新上传失败时显示错误消息的逻辑 [#14349](https://github.com/eclipse-theia/theia/pull/14349)
- [filesystem] 将 rimraf 更新到 5 [#14273](https://github.com/eclipse-theia/theia/pull/14273)
- [notebook] 为 notebook 新增单元格标签（Cell Tag）支持 [#14271](https://github.com/eclipse-theia/theia/pull/14271)
- [notebook] 新增拆分单元格命令 [#14212](https://github.com/eclipse-theia/theia/pull/14212)
- [notebook] 修复 notebook 编辑器聚焦 [#14229](https://github.com/eclipse-theia/theia/pull/14229)
- [notebook] 修复选择侧边栏或底部面板时 notebook 编辑器仍保持当前的问题 [#14262](https://github.com/eclipse-theia/theia/pull/14262)
- [notebook] 优化 notebook webview 输出 [#14234](https://github.com/eclipse-theia/theia/pull/14234)
- [notebook] 更新逻辑：shift+enter 时使单元格失焦，仅在变化时更新单元格高度 [#14277](https://github.com/eclipse-theia/theia/pull/14277)
- [notebook] 更新逻辑确保 notebook 文档事件注册 [#14242](https://github.com/eclipse-theia/theia/pull/14242)
- [notebook] 更新逻辑：在 notebook 中按 Esc 取消代码补全时不禁用单元格编辑模式 [#14328](https://github.com/eclipse-theia/theia/pull/14328)
- [playwright] 为 notebook 新增 Playwright API [#14098](https://github.com/eclipse-theia/theia/pull/14098)
- [plugin] 新增对 workspace.createFileSystemWatcher 提案签名的支持 [#14303](https://github.com/eclipse-theia/theia/pull/14303) - Contributed on behalf of STMicroelectronics
- [plugin] 修复 onDidChangeActiveNotebookEditorEmitter 正确触发 [#14321](https://github.com/eclipse-theia/theia/pull/14321)
- [plugin] 支持 MappedEditProviders 提案 API 演进 [#14276](https://github.com/eclipse-theia/theia/pull/14276) - Contributed on behalf of STMicroelectronics
- [plugin] 更新逻辑使 env.openExternal API 接受字符串参数 [#14350](https://github.com/eclipse-theia/theia/pull/14350) - Contributed on behalf of STMicroelectronics
- [plugin] 更新逻辑在关闭标签页时正确释放基于标签/标题的资源 [#14359](https://github.com/eclipse-theia/theia/pull/14359)
- [plugin] 将返回给客户端的 API 对象包装进代理 [#14213](https://github.com/eclipse-theia/theia/pull/14213) - Contributed on behalf of STMicroelectronics
- [preferences] 改进偏好渲染器链接 [#14311](https://github.com/eclipse-theia/theia/pull/14311)
- [workspace] 优化最近工作区显示 [#14260](https://github.com/eclipse-theia/theia/pull/14260)

## 1.54.0 - 09/26/2024

- [ai] 新增 Theia AI LLM 支持 [实验性] [#14048](https://github.com/eclipse-theia/theia/pull/14048)
- [ai] 将 Theia AI 的默认 LLM 调整为 gpt-4o [#14165](https://github.com/eclipse-theia/theia/pull/14165)
- [ai] 在偏好中新增 agent 的启用状态 [#14206](https://github.com/eclipse-theia/theia/pull/14206)
- [ai] chore: 打磨 AI 代码补全 [#14192](https://github.com/eclipse-theia/theia/pull/14192)
- [ai] 统一 agent 命名并添加标签 [#14182](https://github.com/eclipse-theia/theia/pull/14182)
- [ai] feat: 为聊天节点新增工具栏操作 [#14181](https://github.com/eclipse-theia/theia/pull/14181) - Contributed on behalf of STMicroelectronics
- [ai] feat: 在 AI agent 配置中显示变量与函数 [#14177](https://github.com/eclipse-theia/theia/pull/14177)
- [ai] feat: 支持经 OpenAI API 提供的模型 [#14172](https://github.com/eclipse-theia/theia/pull/14172)
- [ai] 修复 ai-settings 获取 [#14221](https://github.com/eclipse-theia/theia/pull/14221)
- [ai] 修复 AI 支持的启用状态 [#14166](https://github.com/eclipse-theia/theia/pull/14166)
- [ai] 改进工作区 agent 的提示词 [#14159](https://github.com/eclipse-theia/theia/pull/14159)
- [ai] 优化 AI 设置 [#14202](https://github.com/eclipse-theia/theia/pull/14202)
- [ai] 优化 AI 功能的实验性提示信息 [#14187](https://github.com/eclipse-theia/theia/pull/14187)
- [ai] 移除 kind 属性的重复类型 [#14207](https://github.com/eclipse-theia/theia/pull/14207)
- [ai] 统一提示词 id [#14162](https://github.com/eclipse-theia/theia/pull/14162)
- [ai] fix: 禁用一个 agent 同时也禁用其 UIContribution [#14184](https://github.com/eclipse-theia/theia/pull/14184)
- [application-package] 将 API 版本提升到 1.93.1 [#14224](https://github.com/eclipse-theia/theia/pull/14224) - Contributed on behalf of STMicroelectronics
- [core] 修复贡献菜单操作参数适配器的选择 [#14132](https://github.com/eclipse-theia/theia/pull/14132) - Contributed on behalf of STMicroelectronics
- [core] 支持 schema 目录下载的代理环境变量 [#14130](https://github.com/eclipse-theia/theia/pull/14130)
- [core] 支持 workbench.editorAssociations 偏好 [#14139](https://github.com/eclipse-theia/theia/pull/14139)
- [editor] 使活动文本与 notebook 编辑器进一步向 vscode 对齐 [#14190](https://github.com/eclipse-theia/theia/pull/14190)
- [filesystem] 修复 FileResource 有时在写入期间发送内容变更事件的问题 [#14043](https://github.com/eclipse-theia/theia/pull/14043) - Contributed on behalf of Toro Cloud
- [notebook] 正确聚焦 notebook 单元格容器 [#14175](https://github.com/eclipse-theia/theia/pull/14175)
- [notebook] 修复 notebook 上下文选择 [#14179](https://github.com/eclipse-theia/theia/pull/14179)
- [notebook] 使单元格编辑器在未聚焦时边框为灰色 [#14195](https://github.com/eclipse-theia/theia/pull/14195)
- [plugin] 从 TerminalOptions#color 移除存根标签 [#14171](https://github.com/eclipse-theia/theia/pull/14171)
- [plugin] 将已存根 API TerminalShellIntegration 移入主 API [#14168](https://github.com/eclipse-theia/theia/pull/14168) - Contributed on behalf of STMicroelectronics
- [plugin] 支持提案 API extensionAny 的演进 [#14199](https://github.com/eclipse-theia/theia/pull/14199) - Contributed on behalf of STMicroelectronics
- [plugin] 将 TreeView 的 reveal 选项更新为只读 [#14198](https://github.com/eclipse-theia/theia/pull/14198) - Contributed on behalf of STMicroelectronics
- [plugin-ext] 正确支持 executeDocumentSymbolProvider 命令 [#14173](https://github.com/eclipse-theia/theia/pull/14173)
- [plugin-ext] 修复 tabs-main.ts 中的泄漏 [#14186](https://github.com/eclipse-theia/theia/pull/14186)
- [preferences] 修复滚动时正确展开插件偏好 [#14170](https://github.com/eclipse-theia/theia/pull/14170)
- [test] 支持 TestMessage 堆栈跟踪 [#14154](https://github.com/eclipse-theia/theia/pull/14154) - Contributed on behalf of STMicroelectronics
- [workspace] 只处理用户工作区安全设置 [#14147](https://github.com/eclipse-theia/theia/pull/14147)

<a name="breaking_changes_1.54.0">[Breaking Changes:](#breaking_changes_1.54.0)</a>

- [ai] 在聊天节点上新增工具栏操作 [#14181](https://github.com/eclipse-theia/theia/pull/14181) - Contributed on behalf of STMicroelectronics
- [core] 更新 AuthenticationService 以处理每个提供商的多个账户 [#14149](https://github.com/eclipse-theia/theia/pull/14149) - Contributed on behalf of STMicroelectronics

## 1.53.0 - 08/29/2024

- [application-package] 将 API 版本提升到 1.92.2 [#14076](https://github.com/eclipse-theia/theia/pull/14076) - Contributed on behalf of STMicroelectronics
- [collaboration] 新增对协作功能的支持 [#13309](https://github.com/eclipse-theia/theia/pull/13309)
- [core] 新增 `testing/profiles/context` 菜单贡献 [#14028](https://github.com/eclipse-theia/theia/pull/14028) - Contributed on behalf of STMicroelectronics
- [core] 新增对回退复合可保存对象的支持 [#14079](https://github.com/eclipse-theia/theia/pull/14079)
- [core] 将可用语言环境与 VS Code 对齐 [#14039](https://github.com/eclipse-theia/theia/pull/14039)
- [core] 停止支持 Node 16.x [#14027](https://github.com/eclipse-theia/theia/pull/14027) - Contributed on behalf of STMicroelectronics
- [core] 重构编辑器的撤销-重做操作 [#13963](https://github.com/eclipse-theia/theia/pull/13963)
- [core] 更新逻辑以在部件关闭时正确回退可保存对象 [#14062](https://github.com/eclipse-theia/theia/pull/14062)
- [core] 更新逻辑以在构建期下载 json schema 目录 [#14065](https://github.com/eclipse-theia/theia/pull/14065) - Contributed on behalf of STMicroelectronics
- [electron] 将 electron 更新到 30.1.2 版本 [#14041](https://github.com/eclipse-theia/theia/pull/14041) - Contributed on behalf of STMicroelectronics
- [monaco] 更新逻辑以依赖 `IConfigurationService` 变更事件来更新模型选项 [#13994](https://github.com/eclipse-theia/theia/pull/13994) - Contributed on behalf of STMicroelectronics
- [notebook] 为 notebook 的 `list.focusUp` 与 `list.focusDown` 新增别名 [#14042](https://github.com/eclipse-theia/theia/pull/14042)
- [notebook] 新增在 notebook 中支持 Alt+Enter 的逻辑——运行当前单元格并在下方插入新单元格 [#14022](https://github.com/eclipse-theia/theia/pull/14022)
- [notebook] 新增 notebook 选中单元格状态栏条目与居中选中单元格命令 [#14046](https://github.com/eclipse-theia/theia/pull/14046)
- [notebook] 新增对 notebook 中查找部件的支持 [#13982](https://github.com/eclipse-theia/theia/pull/13982)
- [notebook] 增强 notebook 单元格分隔线 [#14081](https://github.com/eclipse-theia/theia/pull/14081)
- [notebook] 修复 notebook 输出滚动与文本渲染 [#14016](https://github.com/eclipse-theia/theia/pull/14016)
- [notebook] 修复 vscode API 的 notebook 选择属性 [#14087](https://github.com/eclipse-theia/theia/pull/14087)
- [notebook] 更新逻辑确保调用 `openNotebookDocument` 时创建 notebook 模型 [#14029](https://github.com/eclipse-theia/theia/pull/14029)
- [notebook] 更新逻辑为选中语言使用正确的单元格类型 [#13983](https://github.com/eclipse-theia/theia/pull/13983)
- [playwright] 修复不稳定的 playwright Theia 主菜单测试 [#13951](https://github.com/eclipse-theia/theia/pull/13951) - Contributed on behalf of STMicroelectronics
- [plugin] 新增 `executeFoldingRangeProvider`、`executeCodeActionProvider` 与 `executeWorkspaceSymbolProvider` 命令实现 [#14093](https://github.com/eclipse-theia/theia/pull/14093)
- [plugin] 新增对 `--headless-hosted-plugin-inspect` 命令行参数的支持 [#13918](https://github.com/eclipse-theia/theia/pull/13918)
- [plugin] 修复创建新的未命名 notebook 不生效的问题 [#14031](https://github.com/eclipse-theia/theia/pull/14031)
- [plugin] 实现此前已存根的 API `window.registerUriHandler()` [#13306](https://github.com/eclipse-theia/theia/pull/13306) - Contributed on behalf of STMicroelectronics
- [plugin] 存根 Terminal Shell Integration VS Code API [#14058](https://github.com/eclipse-theia/theia/pull/14058)
- [plugin] 更新逻辑以允许打开与自定义编辑器关联文件的更改 [#13916](https://github.com/eclipse-theia/theia/pull/13916)
- [plugin] 更新代码以不再在 `RPCProtocol` 中使用 `ChannelMultiplexer` [#13980](https://github.com/eclipse-theia/theia/pull/13980) - Contributed on behalf of STMicroelectronics
- [preferences] 修复插件的偏好树 [#14036](https://github.com/eclipse-theia/theia/pull/14036)
- [vsx-registry] 修复 OVSX 请求的 `429` 错误 [#14030](https://github.com/eclipse-theia/theia/pull/14030)

<a name="breaking_changes_1.53.0">[Breaking Changes:](#breaking_changes_1.53.0)</a>

- [dependencies] 将 electron 更新到 30.1.2 版本 - [#14041](https://github.com/eclipse-theia/theia/pull/14041) - Contributed on behalf of STMicroelectronics
- [dependencies] 将最低 node 版本提升到 18。[14027](https://github.com/eclipse-theia/theia/pull/14027) - Contributed on behalf of STMicroelectronics

## 1.52.0 - 07/25/2024

- [application-package] 将默认支持的 API 从 `1.90.2` 提升到 `1.91.1` [#13955](https://github.com/eclipse-theia/theia/pull/13955) - Contributed on behalf of STMicroelectronics
- [cli] 为 download:plugins 脚本新增日志 [#13905](https://github.com/eclipse-theia/theia/pull/13905) - Contributed on behalf of STMicroelectronics
- [core] bug 修复："core.saveAll" 命令只保存有未保存更改的部件 [#13942](https://github.com/eclipse-theia/theia/pull/13942)
- [core] 将 jsdom 降级到 22.1.0 [#13944](https://github.com/eclipse-theia/theia/pull/13944)
- [core] 修复远程功能的重新加载，并为 electron 窗口新增重新加载时更改 URL 的选项 [#13891](https://github.com/eclipse-theia/theia/pull/13891)
- [core] 改进部件管理相关实现 [#13818](https://github.com/eclipse-theia/theia/pull/13818)
- [core] 引入 `FRONTEND_CONNECTION_TIMEOUT` 环境变量以覆盖应用连接设置 [#13936](https://github.com/eclipse-theia/theia/pull/13936) - Contributed on behalf of STMicroelectronics
- [core] 确保最小化时 UI 已加载 [#13887](https://github.com/eclipse-theia/theia/pull/13887) - Contributed on behalf of STMicroelectronics
- [core] 在未提供标题时阻止渲染标签栏提示 [#13945](https://github.com/eclipse-theia/theia/pull/13945)
- [core] 关闭最后一个标签页时应选中相邻标签页 [#13912](https://github.com/eclipse-theia/theia/pull/13912) - Contributed on behalf of STMicroelectronics
- [core] 将 ws 升级到 8.18.0 [#13903](https://github.com/eclipse-theia/theia/pull/13903)
- [debug] 新增 DebugSessionOptions.testRun [#13939](https://github.com/eclipse-theia/theia/pull/13939) - Contributed on behalf of STMicroelectronics
- [debug] 在 debug 命名空间中实现 activeStackItem 及相关变更事件 [#13900](https://github.com/eclipse-theia/theia/pull/13900) - Contributed on behalf of STMicroelectronics
- [filesystem] 修复 FileResource 未向可释放集合添加事件监听器的问题 [#13880](https://github.com/eclipse-theia/theia/pull/13880)
- [notebook] 在为代码单元格选择 markdown 语言时更改单元格类型 [#13933](https://github.com/eclipse-theia/theia/pull/13933)
- [notebook] 使 Notebook 偏好注册可替换 [#13926](https://github.com/eclipse-theia/theia/pull/13926)
- [ovsx-client] 修复插件版本比较 [#13907](https://github.com/eclipse-theia/theia/pull/13907)
- [plugin-ext] 为 TerminalOptions 新增 codicon 颜色与 URI 支持 [#13413](https://github.com/eclipse-theia/theia/pull/13413)
- [plugin-ext] 为 ctx.importScripts() 使用相对路径 [#13854](https://github.com/eclipse-theia/theia/pull/13854)
- [preferences] 重构偏好树布局 [#13819](https://github.com/eclipse-theia/theia/pull/13819)
- [terminal] 新增对 256 真彩色的支持 [#13853](https://github.com/eclipse-theia/theia/pull/13853)
- [workflows] 将 CI 中的 Mac OS 版本更新为 14 [#13908](https://github.com/eclipse-theia/theia/pull/13908)

## 1.51.0 - 06/27/2024

- [application-manager] 更新逻辑以在 browser-only 模式下加载正确的消息模块 [#13827](https://github.com/eclipse-theia/theia/pull/13827)
- [application-package] 将默认支持的 API 从 `1.89.1` 提升到 `1.90.2` [#13849](https://github.com/eclipse-theia/theia/pull/13849) - Contributed on behalf of STMicroelectronics
- [core] 新增对动态菜单贡献的支持 [#13720](https://github.com/eclipse-theia/theia/pull/13720)
- [core] 修复账户菜单顺序、图标与徽标 [#13771](https://github.com/eclipse-theia/theia/pull/13771)
- [core] 修复侧边栏的溢出行为 [#13483](https://github.com/eclipse-theia/theia/pull/13483) - Contributed on behalf of STMicroelectronics
- [core] 改进上下文菜单中显示的快捷键 [#13830](https://github.com/eclipse-theia/theia/pull/13830)
- [core] 在 Saveable 中引入可选的 serialize 方法 [#13833](https://github.com/eclipse-theia/theia/pull/13833)
- [core] 更新 service-connection-provider.ts 上的文档注释 [#13805](https://github.com/eclipse-theia/theia/pull/13805) - Contributed on behalf of STMicroelectronics
- [core] 更新逻辑：在 electron 中阻止链接的本地导航并在外部打开新窗口 [#13782](https://github.com/eclipse-theia/theia/pull/13782) - Contributed on behalf of STMicroelectronics
- [core] 更新逻辑将"另存为"操作传播到插件宿主 [#13689](https://github.com/eclipse-theia/theia/pull/13689)
- [core] 更新逻辑：当 'env.openExternal' 请求时使用 'openWithSystemApp' 打开 URI [#13676](https://github.com/eclipse-theia/theia/pull/13676)
- [electron] 默认开启单实例。[13831](https://github.com/eclipse-theia/theia/pull/13831) - Contributed on behalf of STMicroelectronics
- [filesystem] 改进上传命令 [#13775](https://github.com/eclipse-theia/theia/pull/13775)
- [markers] 修复问题视图树中的数据竞争 [#13841](https://github.com/eclipse-theia/theia/pull/13841)
- [messages] 更新逻辑在显示新通知前始终解析既有通知 [#13668](https://github.com/eclipse-theia/theia/pull/13668)
- [monaco] 修复编辑器主题变更与部件未附加错误 [#13757](https://github.com/eclipse-theia/theia/pull/13757)
- [notebook] 新增加载 notebook 的指示器 [#13843](https://github.com/eclipse-theia/theia/pull/13843)
- [notebook] 新增 notebook 输出选项与标签偏好搜索 [#13773](https://github.com/eclipse-theia/theia/pull/13773)
- [notebook] 禁用单元格编辑器搜索部件 [#13836](https://github.com/eclipse-theia/theia/pull/13836)
- [notebook] 改进覆盖 notebook 服务的能力 [#13776](https://github.com/eclipse-theia/theia/pull/13776)
- [notebook] 改进 notebook 单元格拖拽图像 [#13791](https://github.com/eclipse-theia/theia/pull/13791)
- [notebook] 改进创建新 notebook 的支持 [#13696](https://github.com/eclipse-theia/theia/pull/13696)
- [notebook] 更新逻辑：在前台打开时将 notebook 编辑器设为活动 [#13828](https://github.com/eclipse-theia/theia/pull/13828)
- [notebook] 更新逻辑：建议部件可见时停止移动到下一个单元格 [#13774](https://github.com/eclipse-theia/theia/pull/13774)
- [playwright] 修复 TheiaAppFactory 的类型定义 [#13799](https://github.com/eclipse-theia/theia/pull/13799) - Contributed on behalf of STMicroelectronics
- [plugin] 为 `registerMappedEditProvider` 新增存根 [#13681](https://github.com/eclipse-theia/theia/pull/13681) - Contributed on behalf of STMicroelectronics
- [plugin] 新增对 PluginExt#extensionKind 的支持 [#13763](https://github.com/eclipse-theia/theia/pull/13763)
- [plugin] 新增对 TestRunRequest preserveFocus API 的支持 [#13839](https://github.com/eclipse-theia/theia/pull/13839) - Contributed on behalf of STMicroelectronics
- [plugin] 修复 RPC 代理处理器的通知与请求顺序 [#13810](https://github.com/eclipse-theia/theia/pull/13810)
- [plugin] 修复自定义文本编辑器的程序化保存 [#13684](https://github.com/eclipse-theia/theia/pull/13684)
- [plugin] 修复标签组 API 的事件顺序 [#13812](https://github.com/eclipse-theia/theia/pull/13812)
- [plugin] 存根 Chat 与 Language Model API [#13778](https://github.com/eclipse-theia/theia/pull/13778)
- [plugin] 存根 debug 命名空间中的 activeStackItem 及相关变更事件 [#13847](https://github.com/eclipse-theia/theia/pull/13847) - Contributed on behalf of STMicroelectronics
- [plugin] 更新逻辑避免扩展中树视图贡献的操作污染所有工具栏 [#13768](https://github.com/eclipse-theia/theia/pull/13768) - Contributed on behalf of STMicroelectronics
- [plugin] 更新逻辑使 web 插件宿主返回空 appRoot [#13762](https://github.com/eclipse-theia/theia/pull/13762)
- [scm] 更新 jsdiff 并简化 diff 计算 [#13787](https://github.com/eclipse-theia/theia/pull/13787) - Contributed on behalf of STMicroelectronics
- [vsx-registry] 更新逻辑以在从 open-vsx 安装插件时使用 targetPlatform [#13825](https://github.com/eclipse-theia/theia/pull/13825)

<a name="breaking_changes_1.51.0">[Breaking Changes:](#breaking_changes_1.51.0)</a>

- [electron] 默认开启单实例。[13831](https://github.com/eclipse-theia/theia/pull/13831) - Contributed on behalf of STMicroelectronics
- [filesystem] 调整"另存为"机制，假定 `Saveable.getSnapshot()` 返回编辑器模型的完整快照 [#13689](https://github.com/eclipse-theia/theia/pull/13689)。

## 1.50.0 - 06/03/2024

- [application-package] 将默认支持的 API 从 `1.88.1` 提升到 `1.89.1` [#13738](https://github.com/eclipse-theia/theia/pull/13738) - contributed on behalf of STMicroelectronics
- [cli] 升级 Theia 构建以使用 Typescript 5.4.5 [#13628](https://github.com/eclipse-theia/theia/pull/13628) - Contributed on behalf of STMicroelectronics
- [core] 新增将帮助显示委托给后端进程的逻辑。[13729](https://github.com/eclipse-theia/theia/pull/13729) - Contributed on behalf of STMicroelectronics
- [core] 新增更新树行时不展示聚焦元素的逻辑 [#13703](https://github.com/eclipse-theia/theia/pull/13703) - Contributed on behalf of STMicroelectronics
- [core] 新增确保在树部件上打开上下文菜单时正确设置 globalSelection 的逻辑 [#13710](https://github.com/eclipse-theia/theia/pull/13710)
- [core] 新增确保使用用户自定义 `THEIA_CONFIG_DIR` 的逻辑 [#13708](https://github.com/eclipse-theia/theia/pull/13708) - Contributed on behalf of STMicroelectronics
- [core] 通过将 `msgpckr` 更新到 1.10.2 修复十六进制编辑器 [#13722](https://github.com/eclipse-theia/theia/pull/13722)
- [core] 改进 `WebSocketConnectionProvider` 的弃用消息 [#13713](https://github.com/eclipse-theia/theia/pull/13713) - Contributed on behalf of STMicroelectronics
- [core] 通过中心服务重构自动保存机制 [#13683](https://github.com/eclipse-theia/theia/pull/13683)
- [core] 更新逻辑使 splashScreen 的 browserWindow 透明 [#13699](https://github.com/eclipse-theia/theia/pull/13699)
- [dev-container] 新增对四个此前不支持的 dev container 属性的支持 [#13714](https://github.com/eclipse-theia/theia/pull/13714)
- [dev-container] 改进在状态栏中显示 dev-container 标签的逻辑 [#13744](https://github.com/eclipse-theia/theia/pull/13744)
- [electron] 将 electron 更新到 ^28.2.8 [#13580](https://github.com/eclipse-theia/theia/pull/13580)
- [navigator] 新增处理 `isFileSystemResource` 上下文键的逻辑 [#13664](https://github.com/eclipse-theia/theia/pull/13664)
- [navigator] 新增不在文件夹上显示新的 "Open With..." 命令的逻辑 [#13678](https://github.com/eclipse-theia/theia/pull/13678)
- [notebook] 为 notebook 输出 webview 新增额外 CSS [#13666](https://github.com/eclipse-theia/theia/pull/13666)
- [notebook] 新增 notebook 单元格拖拽图像渲染器的基础能力 [#13698](https://github.com/eclipse-theia/theia/pull/13698)
- [notebook] 新增在编辑器首行或末行选择上/下一个 notebook 单元格的逻辑 [#13656](https://github.com/eclipse-theia/theia/pull/13656)
- [notebook] 新增删除选中末尾单元格时选中最后一个单元格的逻辑 [#13715](https://github.com/eclipse-theia/theia/pull/13715)
- [notebook] 新增删除单元格时停止执行的逻辑 [#13701](https://github.com/eclipse-theia/theia/pull/13701)
- [notebook] 为主 notebook 工具栏新增响应式设计 [#13663](https://github.com/eclipse-theia/theia/pull/13663)
- [notebook] 将命令与 vscode notebook 命令对齐 [#13645](https://github.com/eclipse-theia/theia/pull/13645)
- [notebook] 将 notebook 滚动到可视区域的行为与 vscode 对齐 [#13742](https://github.com/eclipse-theia/theia/pull/13742)
- [notebook] 修复单元格编辑器失焦时 notebook 编辑器部件丢失焦点的问题 [#13741](https://github.com/eclipse-theia/theia/pull/13741)
- [notebook] 修复 notebook 单元格分隔线大小 [#13745](https://github.com/eclipse-theia/theia/pull/13745)
- [notebook] 修复 notebook-outlineview 状态数据的存储 [#13648](https://github.com/eclipse-theia/theia/pull/13648)
- [notebook] 改进 notebook 单元格模型生命周期 [#13675](https://github.com/eclipse-theia/theia/pull/13675)
- [notebook] 改进创建新 notebook 的支持 [#13696](https://github.com/eclipse-theia/theia/pull/13696)
- [plugin] 为 `registerMappedEditProvider` 新增存根 [#13681](https://github.com/eclipse-theia/theia/pull/13681) - Contributed on behalf of STMicroelectronics
- [plugin] 新增对 `WindowState` 活动 API 的支持 [#13718](https://github.com/eclipse-theia/theia/pull/13718) - contributed on behalf of STMicroelectronics
- [plugin] 修复 electron 场景下 github 认证内置插件 [#13611](https://github.com/eclipse-theia/theia/pull/13611) - Contributed on behalof of STMicroelectronics
- [plugin] 修复 custom-editors-main 中不正确的 URI 转换 [#13653](https://github.com/eclipse-theia/theia/pull/13653)
- [plugin] 修复来自插件的快速选择分隔符 [#13740](https://github.com/eclipse-theia/theia/pull/13740)
- [plugin] 改进 vscode 标签 API [#13730](https://github.com/eclipse-theia/theia/pull/13730)
- [plugin] 为 1.89 兼容性更新 `DropMetada` 与 `documentPaste` 提案 API [#13733](https://github.com/eclipse-theia/theia/pull/13733) - contributed on behalf of STMicroelectronics
- [plugin] 为 VSCode API 1.89.0 更新 nls 元数据 [#13743](https://github.com/eclipse-theia/theia/pull/13743)
- [remote] 新增支持远程功能的插件复制逻辑 [#13369](https://github.com/eclipse-theia/theia/pull/13369)
- [terminal] 修复终端中的性能问题 [#13735](https://github.com/eclipse-theia/theia/pull/13735) - Contributed on behalf of STMicroelectronics
- [terminal] 更新逻辑允许 TerminalFrontendContribution 的传递绑定 [#13667](https://github.com/eclipse-theia/theia/pull/13667)

<a name="breaking_changes_1.50.0">[Breaking Changes:](#breaking_changes_1.50.0)</a>

- [core] 实现 `Saveable` 接口的类不再需要实现 `autoSave` 字段。取而代之新增了 `onContentChanged` 事件。
- [navigator] `Open With...` 命令现在使用专用的 `OpenWithHandler` 来填充快速选择。
  贡献打开处理器的采用者需要显式将处理器添加到 `OpenWithHandler`（[#13573](https://github.com/eclipse-theia/theia/pull/13573)）。

## v1.49.0 - 04/29/2024

- [application-manager] 新增在服务器应用中生成 Extension Info 的逻辑，避免"关于"对话框为空 [#13590](https://github.com/eclipse-theia/theia/pull/13590) - contributed on behalf of STMicroelectronics
- [application-manager] 修复 node LTS 版本的 spawn 调用 [#13614](https://github.com/eclipse-theia/theia/pull/13614)
- [application-package] 将默认支持的 API 从 `1.87.2` 提升到 `1.88.1` [#13646](https://github.com/eclipse-theia/theia/pull/13646) - contributed on behalf of STMicroelectronics
- [cli] 将 "patches" 文件夹加入 package.json 的 "files" 字段 [#13554](https://github.com/eclipse-theia/theia/pull/13554) - contributed on behalf of STMicroelectronics
- [core] 新增使用系统应用打开文件的内置处理器 [#13601](https://github.com/eclipse-theia/theia/pull/13601)
- [core] 新增逻辑使快捷键的 "passthrough" 命令始终视为启用 [#13564](https://github.com/eclipse-theia/theia/pull/13564) - contributed on behalf of STMicroelectronics
- [core] 新增 Electron 启动画面支持 [#13505](https://github.com/eclipse-theia/theia/pull/13505) - contributed on behalf of Pragmatiqu IT GmbH
- [core] 修复多窗口导航时的窗口展示问题 [#13561](https://github.com/eclipse-theia/theia/pull/13561) - contributed on behalf of STMicroelectronics
- [core] 改进 "Open With..." 命令的体验 [#13573](https://github.com/eclipse-theia/theia/pull/13573)
- [filesystem] 新增上传文件时打开编辑器的逻辑 [#13578](https://github.com/eclipse-theia/theia/pull/13578)
- [monaco] 新增防止编辑器上下文菜单中出现重复剪贴板操作的逻辑 [#13626](https://github.com/eclipse-theia/theia/pull/13626)
- [monaco] 修复 monaco 本地化 [#13557](https://github.com/eclipse-theia/theia/pull/13557)
- [notebook] 为 notebook 编辑器新增额外快捷键 [#13594](https://github.com/eclipse-theia/theia/pull/13594)
- [notebook] 新增内容变更后强制更新 notebook 滚动条的逻辑 [#13575](https://github.com/eclipse-theia/theia/pull/13575)
- [notebook] 新增读取执行摘要的逻辑 [#13567](https://github.com/eclipse-theia/theia/pull/13567)
- [notebook] 新增选择 notebook 单元格语言的逻辑 [#13615](https://github.com/eclipse-theia/theia/pull/13615)
- [notebook] 新增为 notebook 工具栏命令显示短标题的逻辑 [#13586](https://github.com/eclipse-theia/theia/pull/13586)
- [notebook] 新增使用 notebook URI 作为工具栏命令上下文的逻辑 [#13585](https://github.com/eclipse-theia/theia/pull/13585)
- [notebook] 为 markdown 单元格新增 shift+enter 快捷键 [#13563](https://github.com/eclipse-theia/theia/pull/13563)
- [notebook] 新增对大纲视图与面包屑的支持 [#13562](https://github.com/eclipse-theia/theia/pull/13562)
- [notebook] 新增对截断 notebook 输出命令的支持 [#13555](https://github.com/eclipse-theia/theia/pull/13555)
- [notebook] 在 notebook 主工具栏禁用清空所有输出 [#13569](https://github.com/eclipse-theia/theia/pull/13569)
- [notebook] 修复清空单元格输出命令 [#13640](https://github.com/eclipse-theia/theia/pull/13640)
- [notebook] 修复启动时打开的 notebook 的内核自动绑定 [#13598](https://github.com/eclipse-theia/theia/pull/13598)
- [notebook] 修复为多个 notebook 设置上下文的逻辑 [#13566](https://github.com/eclipse-theia/theia/pull/13566)
- [notebook] 修复 notebook 单元格 EOL 拆分 [#13574](https://github.com/eclipse-theia/theia/pull/13574)
- [notebook] 修复 notebook 模型/单元格释放 [#13606](https://github.com/eclipse-theia/theia/pull/13606)
- [notebook] 修复重新加载时的 notebook 部件图标 [#13612](https://github.com/eclipse-theia/theia/pull/13612)
- [notebook] 改进 notebook 单元格上下文键处理 [#13572](https://github.com/eclipse-theia/theia/pull/13572)
- [notebook] 改进 notebook markdown 单元格渲染 [#13577](https://github.com/eclipse-theia/theia/pull/13577)
- [plugin] 新增对用户隐藏空插件视图容器的逻辑 [#13581](https://github.com/eclipse-theia/theia/pull/13581)
- [plugin] 新增忽略 local-plugins 目录中 vsix 文件的逻辑 [#13435](https://github.com/eclipse-theia/theia/pull/13435) - contributed on behalf of STMicroelectronics
- [plugin] 修复 `onLanguage` 激活事件 [#13630](https://github.com/eclipse-theia/theia/pull/13630)
- [plugin] 修复 Safari 的 webview 通信问题 [#13587](https://github.com/eclipse-theia/theia/pull/13587)
- [plugin] 为 1.88 兼容性更新 `DropMetada` 与 `documentPaste` 提案 API [#13632](https://github.com/eclipse-theia/theia/pull/13632)
- [plugin] 更新后端插件部署逻辑 [#13643](https://github.com/eclipse-theia/theia/pull/13643) - contributed on behalf of STMicroelectronics
- [process] 修复 node LTS 版本的 spawn 调用 [#13614](https://github.com/eclipse-theia/theia/pull/13614)
- [remote] 修复打包应用中的远程支持 [#13584](https://github.com/eclipse-theia/theia/pull/13584)
- [scm] 新增对脏 diff 浮动预览（peek view）的支持 [#13104](https://github.com/eclipse-theia/theia/pull/13104)
- [terminal] 修复 node LTS 版本的 spawn 调用 [#13614](https://github.com/eclipse-theia/theia/pull/13614)
- [test] 存根 VS Code `Test Coverage` API [#13631](https://github.com/eclipse-theia/theia/pull/13631) - contributed on behalf of STMicroelectronics
- [vsx-registry] 修复将扩展搜索栏绑定到视图容器内的逻辑 [#13623](https://github.com/eclipse-theia/theia/pull/13623)

<a name="breaking_changes_1.49.0">[Breaking Changes:](#breaking_changes_1.49.0)</a>

- [scm] 修订部分脏 diff 相关类型 [#13104](https://github.com/eclipse-theia/theia/pull/13104)
  - 用 `changes` 替换 `DirtyDiff.added/removed/modified`，后者提供关于变更的更详细信息
  - 将 `LineRange` 的语义改为表示一个最多但不包含 `end` 行的范围（此前包含 `end` 行）
  - 将 `DirtyDiffDecorator.toDeltaDecoration(LineRange | number, EditorDecorationOptions)` 的签名改为 `toDeltaDecoration(Change)`

## v1.48.0 - 03/28/2024

- [application-package] 将默认支持的 API 从 `1.86.2` 提升到 `1.87.2` [#13514](https://github.com/eclipse-theia/theia/pull/13514) - contributed on behalf of STMicroelectronics
- [core] 新增 "New File" 默认实现 [#13344](https://github.com/eclipse-theia/theia/pull/13344)
- [core] 新增工具栏中发送更新消息前检查已释放的逻辑 [#13454](https://github.com/eclipse-theia/theia/pull/13454) - contributed on behalf of STMicroelectronics
- [core] 修复 Close Editor 命令的默认翻译 [#13412](https://github.com/eclipse-theia/theia/pull/13412)
- [core] 修复允许重新打开次窗口的逻辑 [#13509](https://github.com/eclipse-theia/theia/pull/13509) - contributed on behalf of STMicroelectronics
- [core] 修复快速选择按钮的渲染 [#13342](https://github.com/eclipse-theia/theia/pull/13342) - contributed on behalf of STMicroelectronics
- [core] 更新逻辑移除不必要的 URI 转换 [#13415](https://github.com/eclipse-theia/theia/pull/13415)
- [dev-container] 新增 dev-container 支持的首个版本 [#13372](https://github.com/eclipse-theia/theia/pull/13372)
- [editor] 为文本编辑器新增次窗口支持 [#13493](https://github.com/eclipse-theia/theia/pull/13493) - contributed on behalf of STMicroelectronics
- [git] 修复 git init 后检测变更的问题 [#13487](https://github.com/eclipse-theia/theia/pull/13487)
- [metrics] 允许在 electron 中访问指标端点以进行性能分析 [#13380](https://github.com/eclipse-theia/theia/pull/13380) - contributed on behalf of STMicroelectronics
- [monaco] 修复 monaco 快速选择 [#13451](https://github.com/eclipse-theia/theia/pull/13451) - contributed on behalf of STMicroelectronics
- [monaco] 修复快速选择按钮的渲染 [#13342](https://github.com/eclipse-theia/theia/pull/13342) - contributed on behalf of STMicroelectronics
- [notebook] 新增在上方/下方执行单元格的命令 [#13528](https://github.com/eclipse-theia/theia/pull/13528)
- [notebook] 为代码单元格新增执行顺序显示 [#13502](https://github.com/eclipse-theia/theia/pull/13502)
- [notebook] 为 notebook 编辑器新增快捷键 [#13497](https://github.com/eclipse-theia/theia/pull/13497)
- [notebook] 新增对 notebook 输出自定义部件类型的支持 [#13517](https://github.com/eclipse-theia/theia/pull/13517)
- [notebook] 修复单元格执行高度样式 [#13515](https://github.com/eclipse-theia/theia/pull/13515)
- [notebook] 修复 notebook 编辑器上下文的上下文键 [#13448](https://github.com/eclipse-theia/theia/pull/13448)
- [notebook] 修复单元格编辑器聚焦时快捷键触发的问题 [#13500](https://github.com/eclipse-theia/theia/pull/13500)
- [notebook] 修复 notebook 文档元数据编辑 [#13528](https://github.com/eclipse-theia/theia/pull/13528)
- [notebook] 修复打开 notebook 的重命名与移动 [#13467](https://github.com/eclipse-theia/theia/pull/13467)
- [notebook] 修复 notebook 编辑器的撤销重做快捷键 [#13518](https://github.com/eclipse-theia/theia/pull/13518)
- [notebook] 改进 notebook 单元格编辑器的聚焦 [#13516](https://github.com/eclipse-theia/theia/pull/13516)
- [notebook] 改进打开 notebook 时的性能 [#13488](https://github.com/eclipse-theia/theia/pull/13488)
- [notebook] 更新逻辑使 notebook 单元格编辑器仅在视口内初始化 [#13476](https://github.com/eclipse-theia/theia/pull/13476)
- [plugin] 新增 `Interval` `TextEditorLineNumbersStyle` [#13458](https://github.com/eclipse-theia/theia/pull/13458) - contributed on behalf of STMicroelectronics
- [plugin] 新增终端观察者 API [#13402](https://github.com/eclipse-theia/theia/pull/13402)
- [plugin] 更改逻辑确保 showOpenDialog 返回正确的文件 URI [#13208](https://github.com/eclipse-theia/theia/pull/13208) - contributed on behalf of STMicroelectronics
- [plugin] 修复快速选择 [#13451](https://github.com/eclipse-theia/theia/pull/13451) - contributed on behalf of STMicroelectronics
- [plugin] 使 `acquireVsCodeApi` 函数在全局对象上可用 [#13411](https://github.com/eclipse-theia/theia/pull/13411)
- [plugin] 更新逻辑避免隐藏时释放 `QuickInputExt` [#13485](https://github.com/eclipse-theia/theia/pull/13485) - contributed on behalf of STMicroelectronics
- [remote] 新增支持远程端口转发的逻辑 [#13439](https://github.com/eclipse-theia/theia/pull/13439)
- [terminal] 新增解析终端中指向工作区文件的链接的逻辑 [#13498](https://github.com/eclipse-theia/theia/pull/13498) - contributed on behalf of STMicroelectronics
- [terminal] 新增终端观察者 API [#13402](https://github.com/eclipse-theia/theia/pull/13402)

<a name="breaking_changes_1.48.0">[Breaking Changes:](#breaking_changes_1.48.0)</a>

- [core] 为文本编辑器新增次窗口支持。[13493](https://github.com/eclipse-theia/theia/pull/13493)。其中的改动要求对我们的依赖进行比以往更广泛的补丁。为此，我们使用 `patch-package` 库。但是，该变更要求采用者在其 monorepo 根目录（即 `node_modules` 所在目录）的 `package.json` 中添加 `"postinstall": "theia-patch"` 一行 - contributed on behalf of STMicroelectronics

## v1.47.0 - 02/29/2024

- [application-package] 将默认支持的 API 从 `1.85.1` 提升到 `1.86.2` [#13429](https://github.com/eclipse-theia/theia/pull/13429) - contributed on behalf of STMicroelectronics
- [core] 新增在编辑器标签页中显示装饰的逻辑 [#13371](https://github.com/eclipse-theia/theia/pull/13371)
- [core] 为若干关键工具类添加 ts-docs [#13324](https://github.com/eclipse-theia/theia/pull/13324)
- [core] 修复 electron 的核心本地化 [#13331](https://github.com/eclipse-theia/theia/pull/13331)
- [core] 修复 `DockPanelRenderer` 与 `ToolbarAwareTabBar` 中的内存泄漏 [#13327](https://github.com/eclipse-theia/theia/pull/13327)
- [core] 修复 CompositeMenuNode 属性的更新 [#13425](https://github.com/eclipse-theia/theia/pull/13425)
- [core] 改进菜单栏变更时的标题渲染 [#13317](https://github.com/eclipse-theia/theia/pull/13317)
- [core] 更新代码以在各处使用通用 uuid 生成器 [#13255](https://github.com/eclipse-theia/theia/pull/13255)
- [core] 更新逻辑使用 `tslib` 以减小 bundle 大小 [#13350](https://github.com/eclipse-theia/theia/pull/13350)
- [core] 将 msgpackr 升级到 1.10.1 [#13365](https://github.com/eclipse-theia/theia/pull/13365) - contributed on behalf of STMicroelectronics
- [debug] 修复 python 中意外断点的问题 [#12543](https://github.com/eclipse-theia/theia/pull/12543)
- [documentation] 扩充自定义插件 API 文档 [#13358](https://github.com/eclipse-theia/theia/pull/13358)
- [editor] 改进只读编辑器行为 [#13403](https://github.com/eclipse-theia/theia/pull/13403)
- [filesystem] 修复非递归文件夹删除的问题 [#13361](https://github.com/eclipse-theia/theia/pull/13361)
- [filesystem] 为文件系统提供者实现只读 markdown 消息 [#13414](https://github.com/eclipse-theia/theia/pull/13414) - contributed on behalf of STMicroelectronics
- [monaco] 将 Monaco 升级到 1.83.1 [#13217](https://github.com/eclipse-theia/theia/pull/13217)
- [notebook] 新增对提案中的 notebook 内核消息传递与 preload 贡献点的支持 [#13401](https://github.com/eclipse-theia/theia/pull/13401)
- [notebook] 修复 notebook 渲染器消息传递 [#13401](https://github.com/eclipse-theia/theia/pull/13401)
- [notebook] 修复 notebook 内核关联中的竞态条件 [#13364](https://github.com/eclipse-theia/theia/pull/13364)
- [notebook] 改进更新 notebook 执行计时器的逻辑 [#13366](https://github.com/eclipse-theia/theia/pull/13366)
- [notebook] 改进 notebook 滚动行为 [#13338](https://github.com/eclipse-theia/theia/pull/13338)
- [notebook] 改进 notebook 工具栏条目的样式 [#13334](https://github.com/eclipse-theia/theia/pull/13334)
- [notebook] 修复 Notebooks 的滚动行为 [#13430](https://github.com/eclipse-theia/theia/pull/13430)
- [plugin] 新增从命令行安装插件的命令 [#13406](https://github.com/eclipse-theia/theia/issues/13406) - contributed on behalf of STMicroelectronics
- [plugin] 新增支持 `workspace.save(URI)` 与 `workspace.saveAs(URI)` 的逻辑 [#13393](https://github.com/eclipse-theia/theia/pull/13393) - contributed on behalf of STMicroelectronics
- [plugin] 新增对 `extension/context`、`terminal/context` 与 `terminal/title/context` 菜单贡献点的支持 [#13226](https://github.com/eclipse-theia/theia/pull/13226)
- [plugin] 修复自定义编辑器资源加载 [#13382](https://github.com/eclipse-theia/theia/pull/13382)
- [plugin] 修复 hosted plugin deployer handler 使用正确路径的逻辑 [#13427](https://github.com/eclipse-theia/theia/pull/13427) - contributed on behalf of STMicroelectronics
- [plugin] 修复无头插件引入导致的回归 [#13337](https://github.com/eclipse-theia/theia/pull/13337) - contributed on behalf of STMicroelectronics
- [plugin] 支持 VS Code 1.86.0 引入的 TestRunProfile onDidChangeDefault [#13388](https://github.com/eclipse-theia/theia/pull/13388) - contributed on behalf of STMicroelectronics
- [plugin] 更新 `WorkspaceEdit` 元数据类型定义 [#13395](https://github.com/eclipse-theia/theia/pull/13395) - contributed on behalf of STMicroelectronics
- [search-in-workspace] 新增聚焦上/下一个搜索结果的逻辑 [#12703](https://github.com/eclipse-theia/theia/pull/12703)
- [task] 修复配置任务的逻辑 [#13367](https://github.com/eclipse-theia/theia/pull/13367) - contributed on behalf of STMicroelectronics
- [terminal] 更新到最新 xterm 版本 [#12691](https://github.com/eclipse-theia/theia/pull/12691)
- [vsx-registry] 新增 `--install-plugin` CLI 命令 [#13421](https://github.com/eclipse-theia/theia/pull/13421) - contributed on behalf of STMicroelectronics
- [vsx-registry] 新增从资源管理器视图安装 vsix 文件的可能性 [#13291](https://github.com/eclipse-theia/theia/pull/13291)

<a name="breaking_changes_1.47.0">[Breaking Changes:](#breaking_changes_1.47.0)</a>

- [monaco] 将 Monaco 依赖升级到 1.83.1 [#13217](https://github.com/eclipse-theia/theia/pull/13217)- contributed on behalf of STMicroelectronics\
  本次 monaco 更新带来了若干破坏性变更
  - 将 `ThemaIcon` 与 `ThemeColor` 移至 common 文件夹
  - QuickPickService 的少量类型调整：具体略
  - FileUploadService：将 id 字段从 data transfer item 移到对应的 file info
  - 我们实例化 monaco 服务的方式完全改变：如果你在代码中触碰 monaco 服务，请阅读
    `monaco-init.ts` 文件注释中的说明。

## v1.46.0 - 01/25/2024

- [plugin] 为贡献的视图容器 id 添加前缀 [#13362](https://github.com/eclipse-theia/theia/pull/13362) - contributed on behalf of STMicroelectronics
- [application-manager] 更新缺失 Electron 主入口的消息 [#13242](https://github.com/eclipse-theia/theia/pull/13242)
- [application-package] 将默认支持的 API 从 `1.84.2` 提升到 `1.85.1` [#13276](https://github.com/eclipse-theia/theia/pull/13276) - contributed on behalf of STMicroelectronics
- [browser-only] 新增对 'browser-only' Theia 的支持 [#12853](https://github.com/eclipse-theia/theia/pull/12853)
- [builtins] 将内置插件更新到 1.83.1 版本 [#13298](https://github.com/eclipse-theia/theia/pull/13298) - contributed on behalf of STMicroelectronics
- [core] 新增切换树复选框的快捷键 [#13271](https://github.com/eclipse-theia/theia/pull/13271)
- [core] 新增释放取消事件监听器的逻辑 [#13254](https://github.com/eclipse-theia/theia/pull/13254)
- [core] 新增偏好 'workbench.tree.indent' 以控制树部件缩进 [#13179](https://github.com/eclipse-theia/theia/pull/13179) - contributed on behalf of STMicroelectronics
- [core] 修复 electron 中从菜单复制/粘贴的问题 [#13220](https://github.com/eclipse-theia/theia/pull/13220) - contributed on behalf of STMicroelectronics
- [core] 修复文件资源管理器进度条问题 [#13268](https://github.com/eclipse-theia/theia/pull/13268)
- [core] 修复循环菜单贡献的问题 [#13264](https://github.com/eclipse-theia/theia/pull/13264)
- [core] 修复不重新加载而重连后端时的泄漏 [#13250](https://github.com/eclipse-theia/theia/pull/13250) - contributed on behalf of STMicroelectronics
- [core] 修复 SelectComponent 在对话框中正确渲染下拉框 [#13261](https://github.com/eclipse-theia/theia/pull/13261)
- [core] 从 RpcProxyFactory 移除错误日志 [#13191](https://github.com/eclipse-theia/theia/pull/13191)
- [documentation] 改进关于 'ContributionProvider' 使用的文档 [#13278](https://github.com/eclipse-theia/theia/pull/13278)
- [docuemtnation] 改进关于跨 RPC 传递对象的文档 [#13238](https://github.com/eclipse-theia/theia/pull/13238)
- [documentation] 更新无头插件与 Inversify DI 的插件 API 文档 [#13299](https://github.com/eclipse-theia/theia/pull/13299)
- [filesystem] 更新逻辑使读取整个文件时才无缓冲读取 [#13197](https://github.com/eclipse-theia/theia/pull/13197)
- [headless-plugin] 在新的插件宿主中新增对"无头插件"的支持 [#13138](https://github.com/eclipse-theia/theia/pull/13138)
- [monaco] 更新逻辑将文档 URI 作为上下文添加到 getDefaultFormatter [#13280](https://github.com/eclipse-theia/theia/pull/13280) - contributed on behalf of STMicroelectronics
- [notebook] 修复动态 notebook 部件的尺寸调整 [#13289](https://github.com/eclipse-theia/theia/pull/13289)
- [notebook] 修复 notebook 输出渲染的多个问题 [#13239](https://github.com/eclipse-theia/theia/pull/13239)
- [notebook] 改进 notebook 错误日志 [#13256](https://github.com/eclipse-theia/theia/pull/13256)
- [plugin] 新增同步经不同代理发送的消息的逻辑 [#13180](https://github.com/eclipse-theia/theia/pull/13180)
- [remote] 新增指定远程 SSH 连接端口的逻辑 [#13296](https://github.com/eclipse-theia/theia/pull/13296) - contributed on behalf of STMicroelectronics
- [plugin] 修复 inputbox onTriggerButton() 事件 [#13207](https://github.com/eclipse-theia/theia/pull/13207) - contributed on behalf of STMicroelectronics
- [plugin] 修复 removeSession 方法的本地化 [#13257](https://github.com/eclipse-theia/theia/pull/13257)
- [plugin] 修复 `vscode.env.appRoot` 路径 [#13285](https://github.com/eclipse-theia/theia/pull/13285)
- [plugin] 存根 multiDocumentHighlightProvider 提案 API [#13248](https://github.com/eclipse-theia/theia/pull/13248) - contributed on behalf of STMicroelectronics
- [plugin] 更新处理 activeCustomEditorId 的逻辑 [#13267](https://github.com/eclipse-theia/theia/pull/13267)
- [plugin] 更新逻辑将上下文传递给 webview 上下文菜单操作 [#13228](https://github.com/eclipse-theia/theia/pull/13228)
- [plugin] 更新逻辑为 webview 使用更稳定的主机名 [#13092](https://github.com/eclipse-theia/theia/pull/13225) [#13258](https://github.com/eclipse-theia/theia/pull/13265)
- [terminal] 修复错误消息中的措辞 [#13245](https://github.com/eclipse-theia/theia/pull/13245) - contributed on behalf of STMicroelectronics
- [terminal] 将 terminal.sendText() 参数从 addNewLine 重命名为 shouldExecute [#13236](https://github.com/eclipse-theia/theia/pull/13236) - contributed on behalf of STMicroelectronics
- [terminal] 更新调整终端大小的逻辑 [#13281](https://github.com/eclipse-theia/theia/pull/13281)
- [terminal] 按 vscode 1.85 版本更新 terminalQuickFixProvider 提案 API [#13240](https://github.com/eclipse-theia/theia/pull/13240) - contributed on behalf of STMicroelectronics
- [vsx-registry] 实现已验证扩展的过滤 [#12995](https://github.com/eclipse-theia/theia/pull/12995)

<a name="breaking_changes_1.46.0">[Breaking Changes:](#breaking_changes_1.46.0)</a>

- [core] 将 `FileUri` 从 `node` 包移至 `common` [#12853](https://github.com/eclipse-theia/theia/pull/12853)
- [plugin] 引入新的公共接口/类，供不同插件宿主复用 [#13138](https://github.com/eclipse-theia/theia/pull/13138)
