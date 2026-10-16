# 变更日志 2018

## v0.3.18 - 20/12/2018

- [core] 新增一个偏好项，用于定义应用退出时的处理方式
- [core] 新增阻止应用退出的扩展机制
- [core] 新增当某些编辑器有未保存更改时阻止应用退出的功能
- [core] 允许按连接限定绑定的作用域
- [core] 修复 `@theia/core/lib/node/debug#DEBUG_MODE` 标志，使其能正确检测运行时是否处于被检查/调试状态
- [cpp] 修复构建配置激活时 clangd 被过早启动的问题
- [electron] 为 Git 实现基于 HTTP 的身份验证
- [electron] 将 Electron 更新至 `^2.0.14`
- [electron] 更新 Git for Electron：当 `PATH` 上找不到 Git 时回退到内置 Git
- [file-search] 新增在多根工作区中搜索文件的能力
- [file-search] 改进从 `quick-open-file` 打开不存在文件时的处理
- [filesystem] 新增将 URI 转换为平台特定路径的能力
- [git] 更新 Git 视图：分离（detached）状态下显示短哈希
- [java-debug] 对 `java-debug` 进行重大增强
- [keybinding] 将按键序列规范化为美式（US）布局
- [languages] 为每个语言贡献新增偏好项，以便追踪客户端 <-> 服务器通信
- [languages] 允许提供语言服务器启动选项
- [languages] 修复语言客户端泄漏问题
- [languages][java] 复用 `jdt.ls` 工作区
- [monaco] 修复 OSX 上的快捷键
- [plug-in] 新增用于语言服务器贡献的插件 API
- [plug-in] 新增 `storagePath` 插件 API
- [plug-in] 新增 `tasks.registerTaskProvider` 插件 API
- [plug-in] 新增 `window.withProgress` 插件 API
- [plug-in] 新增从插件的 `package.json` 注册快捷键的能力
- [plug-in] 新增打开链接命令
- [plug-in] 新增在贡献视图中使用上下文菜单的支持
- [plug-in] 实现按给定文件 URI 获取工作区文件夹的 API
- [plug-in][languages] 新增注册文档高亮提供者的能力
- [search-in-workspace] 新增同时对多个文件夹执行 "Find in Folder..." 的能力
- [search-in-workspace] 新增搜索结果的匹配数与文件数
- [search-in-workspace] 新增对多根工作区的支持
- [search-in-workspace] 改用 URI 修复路径问题
- [terminal] 新增当工作区包含多个根时选择终端根位置的能力
- [workspace] 修复多根工作区的长标签计算
- [xterm] 将 Xterm 更新至 `3.9.1`

## v0.3.17 - 29/11/2018

- 针对不同用例改进部件错误处理（例如：无工作区、无仓库等）
- 修复多个后端内存泄漏
- 为快速打开命令添加前缀，便于分类与搜索
- 将 `Task` 菜单项重构进新的 `Terminal` 菜单
- [core] 在应用 `package.json` 中新增 `theia.applicationName`，并改进窗口标题
- [core] 新增对初始化与重连错误的优雅处理
- [core] 新增快捷键 `ctrl+alt+a` 与 `ctrl+alt+d`，用于左右切换标签页
- [core] 新增菜单项 `Find Command...`，便于触发快速打开命令
- [core] 新增标签栏的工具栏支持
- [core] 更新离线时的状态栏显示
- [cpp] macOS 上 `Switch Header/Source` 的快捷键从 `Option+o` 更新为 `Option+Command+o`
- [debug] 新增派生（fork）调试适配器的能力
- [debug] 新增追踪调试适配器通信的能力
- [debug] 实现大量前端与后端调试改进
- [electron] Electron 上的一系列稳定性与可用性改进
- [getting-started] 新增 `Getting Started Widget`——用于查看常用命令、最近工作区与有用链接
- [lsp] 新增符号类型，并提升既有工作区符号的健壮性
- [lsp] 为因不同目的启动的每个语言服务器注册 'Restart' 命令
- [markers] 为问题标记新增上下文菜单项 `Collapse All`
- [mini-browser] mini-browser 的一系列改进
- [plug-in] 新增 Theia 与插件之间通信的插件 API
- [plug-in] 新增 `languages.registerCodeLensProvider` 插件 API
- [plug-in] 新增 `languages.registerDocumentSymbolProvider` 插件 API
- [plug-in] 新增 `window.showTextDocument` 插件 API
- [plug-in] 新增为插件 API 提供自定义命名空间的能力
- [plug-in] 注册类型定义提供者
- [plug-in] 新增 `tasks.registerTaskProvider` 插件 API
- [preview-editor] 新增以预览模式打开编辑器的能力
- [process] 新增通过派生（fork）创建新 node 进程的能力
- [search-in-workspace] 执行 `Replace All...` 时提示用户，以防误触发
- [search-in-workspace] 修复选中文件时命令 `Find in Folder...` 从节点最近父级开始搜索的问题
- [terminal] 新增菜单项与命令 `Split Terminal`
- [workspace] 新增从文件导航器同时打开多个文件的能力
- [workspace] 为文件导航器新增上下文菜单项 `Collapse All`
- [workspace] 将工作区路径纳入 URL 片段

## v0.3.16 - 25/10/2018

- 回退 [cpp] 为 C/C++ 程序添加调试。该特性将在其专属的 cpp 仓库中回归
- [callhierarchy][typescript] 适配分层文档符号
- [core] 新增注销菜单、命令与快捷键的方法
- [debug] 将调试模型与 UI 解耦 + 清理
- [markers] 新增移除标记的能力
- [output] 新增清空输出视图的按钮
- [plug-in] Terminal.sendText API：在未指定 `addNewLine` 参数时，为发送到终端的文本追加换行
- [plug-in] 新增 `DocumentLinkProvider` 插件 API
- [terminal] 在导航器中新增 "open in terminal"
- [windows] 为文件对话框实现驱动器选择器

## v0.3.15 - 27/09/2018

- [cpp] 新增 C/C++ 程序调试
- [debug] 新增调试工具栏
- [debug] 解析配置中的变量
- [debug] 更新调试会话视图使其表现为面板
- [keymaps] 新增 `View Keybindings Widget`——用于查看、搜索和编辑快捷键
- [languages] 新增 TCL 语法文件
- [plug-in] 新增 `menus` 贡献点
- [workspace] 新增带 vscode 兼容性的多根工作区支持

## v0.3.13 - 30/08/2018

- 使用 React 重新实现更多部件
- 使用 React 重新实现若干组件
- [cpp] 新增状态栏按钮，用于选择激活的 cpp 构建配置
- [cpp] 实现对 compile_commands.json 更改的监听
- [git/blame] 新增转换为切换命令的支持
- [markers] 修复 #2315：细粒度标记树计算
- [markers] 默认不再把标记存储在浏览器本地存储，从而提升性能
- [terminal] 更新到 xterm.js 3.5.0
- [textmate] 新增 C/C++、Java、Python、CSS、html、less、markdown、shell、xml、yaml
- [tree] 不渲染折叠节点以提升性能
- [ts] 新增支持用一个语言服务器服务所有 JavaScript 相关语言
- [workspace] 新增最近打开工作区历史支持

## v0.3.12 - 28/06/2018

- 全新插件系统！
  - 详情参见[设计](https://github.com/theia-ide/theia/issues/1482)与[文档](https://github.com/theia-ide/theia/blob/master/packages/plugin/API.md)。
- 推出 [Task API](https://github.com/theia-ide/theia/pull/2086)。
  - 注意，tasks.json 的格式已变更。详情参见 Task 扩展的 [README.md](https://github.com/theia-ide/theia/blob/master/packages/task/README.md)。
- 新增开发插件时的 UI
- 将部件迁移到 `react`
- 当浏览器拒绝打开新标签页时，Theia 会向用户发出提示
- [core] 新增快速切换自动保存功能的选项
- [filesystem] 新增 `File Download` 功能
- [git] `git commit` 在未暂存任何文件时向用户发出提示
- [git] 修复 `git` 取消暂存功能
- [languages] 新增 textmate 语法着色支持（当前适用于 `.ts` 文件，直至注册更多语法）
- [search-in-workspace] 新增命令 `Search In Folder...`
- [search-in-workspace] 补上缺失的 `Search` 菜单项
- [workspace] 修复防止工作区根被删除的问题
- 在 `diff` 模式下编辑的 `.md` 文件现在能以编辑器正确打开
- `HTML` 文件现在默认在编辑器中打开

## v0.3.11 - 06/06/2018

- 新增搜索与替换部件
- 新增在 OSX 上用 cmd+backspace 删除文件的能力
- 新增设置更细粒度 logger 级别的能力
- 修复多个内存泄漏。
- [editor] 更改编辑器字体
- [editor] 修复大写 `R` 键（<kbd>shift + r</kbd>）在编辑器中不生效的问题
- [file-search] 新增在隐藏文件中搜索的支持
- [git] 新增 `git sync` 与 `git publish` 操作
- [navigator] 新增在导航器中切换显示隐藏文件的能力
- `jdt.ls` 在 postinstall 时下载
