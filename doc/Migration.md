# 迁移指南

## 说明

以下指南重点介绍在采用本框架时发现的、`theia` 升级期间可能需要的迁移步骤。
请查看最新版本（`master`）以获取最新信息。即使针对以前的版本，也请把你升级到新版 Theia 时遇到的问题贡献到本文档中。

## 指南

### 通用

_AI Configuration 视图_：

AI Configuration 视图（`@theia/ai-ide`）已从选项卡式停靠面板重构为由新的公共贡献点 `AiConfigurationCategory` 驱动的主从（master–detail）树。

- **新的包依赖边：** `@theia/ai-ide` 和 `@theia/ai-mcp` 现在依赖 `@theia/ai-core-ui`，后者承载贡献点（`AiConfigurationCategory`、`AiConfigurationCategoryRegistry`）、共享选择模型（`AiConfigurationSelectionModel`）以及共享页面基础组件（`AiSettingsRow`、`AiConfigurationSection`、`SinglePageCategoryRenderer`、`CollectionCategoryRenderer` 等）。如果你消费 AI 配置 UI，请在依赖中添加 `@theia/ai-core-ui`。`@theia/ai-core-ui` 本身现在依赖 `@theia/preferences`，用于设置行的复杂值委托的设置 UI "Open settings.json" 命令（`PreferencesCommands.OPEN_PREFERENCES_JSON_TOOLBAR`）。
- **移除的部件：** 各选项卡的部件及其 `WidgetFactory` 注册已被移除——`AIAgentConfigurationWidget`、`AIVariableConfigurationWidget`、`ModelAliasesConfigurationWidget`、`AIToolsConfigurationWidget`、`AISkillsConfigurationWidget`、`AITokenUsageConfigurationWidget`、`AIPromptFragmentsConfigurationWidget`（均在 `@theia/ai-ide` 中）以及 `AIMCPConfigurationWidget`（`@theia/ai-mcp`）。失效的基类（`AIConfigurationBaseWidget`、`AICardGridConfigurationWidget`、`AI{List,Table,Hierarchical}ConfigurationWidget`）也一并移除。每个界面现在都存在于一个 `AiConfigurationCategory` 贡献中，渲染器由共享基础组件构建。
- **移除的组件与 API：** 部件时代的构建块 `ConfigurationSection`、`ExpandableSection` 和 `PromptVariantRenderer`（`template-settings-renderer.tsx`）已从 `@theia/ai-ide` 中移除；请改用 `@theia/ai-core-ui` 中的 `AiConfigurationSection` 和 `VariantSetCard`。该视图的纯图标按钮现在共用一个基础组件 `AiConfigurationIconButton`，因此 CSS 类 `.ai-variant-action-button` 和 `.ai-configuration-value-row-copy` 已被 `.ai-configuration-icon-button` 取代。`MCPServerEditor.openEditServer` 已从接口中删除——MCP 服务器分类现在拥有编辑流程；`openAddServer` 和 `installFromEntry` 保持不变。
- **添加自定义分类：** 之前添加了自己 AI 配置选项卡的采用者现在应注册一个 `AiConfigurationCategory`（将其绑定到 `AiConfigurationCategory` 服务标识符）。设置 `contributed: true` 可使其归入 "Contributed by extensions" 分组。最小端到端示例参见 `examples/api-samples`（`SampleChatToolbarConfigurationCategory`）。
- **选择：** 分类/条目导航现在经由 `AiConfigurationSelectionModel`（`@theia/ai-core-ui`）路由。`AIConfigurationSelectionService`（`@theia/ai-ide`）因仍承载 agent/alias 领域事件而保留。
- **稳定入口点：** 命令 id `aiConfiguration:open`（`OPEN_AI_CONFIG_VIEW`）与 `aiConfiguration:openTools`（`OPEN_AI_CONFIG_VIEW_TOOLS`）以及聊天视图工具栏按钮均保持不变。`OPEN_AI_CONFIG_VIEW(tabId)` 仍接受旧式 per-tab 部件 id，并将其映射到相应的分类 id。

_动态模型发现（Anthropic、Google、OpenAI）_：

`@theia/ai-anthropic`、`@theia/ai-google` 和 `@theia/ai-openai` 现在从各提供商的模型端点（`/v1/models`、`/v1beta/models`、`/v1/models`）动态发现可用模型，而非注册人工维护的列表。因此，以下偏好已被**移除**：

- `ai-features.anthropic.AnthropicModels`
- `ai-features.google.models`
- `ai-features.openAiOfficial.officialOpenAiModels`

配置了 API key 后模型会自动出现，因此常见场景无需迁移。如果你依赖这些偏好来固定特定的模型集合，请注意：

- 模型会在启动时、API key 变更时以及 Models 配置分类中该提供商节点下的手动刷新时获取，该节点还会显示发现状态（fetching / updated / cached / error / no API key / manual），并列出模型及提供商报告的发布日期。发现结果会缓存到 `<configDir>/model-snapshots/<provider>-models.json`，当后续获取失败时复用，因此模型在离线时仍然可用。
- 自定义端点偏好（`ai-features.anthropicCustom.customAnthropicModels`、`ai-features.openAiCustom.customOpenAiModels`）保持不变：它们不一定指向官方提供商，因此保留其手动条目。
- Anthropic 和 OpenAI 每个发布版本报告一个条目（`claude-opus-5-20260401`、`claude-opus-5-20251120` 等）。每个发布版本都会注册，外加不带日期的 id（`claude-opus-5`），提供商将其作为最新版本的别名——内置模型别名引用的就是这个 id，也是提供商发布更新时不会在配置之下发生变化的那个 id。Gemini 的 id 不带发布日期，因此 Google 不做任何额外添加。出于同样原因，当 Copilot 的某个系列本身可用时，GitHub Copilot 不再丢弃带日期的发布版本。
- 让这些列表不碍事的原因在于：**AI 聊天输入的模型选择器展示的是收藏模型而非全部模型**：每个提供商最多五个自动精选模型，加上 AI Configuration 视图中为该提供商勾选的模型（以完全限定 id 存储在 `ai-features.modelSettings.favoriteModels` 中）。其他一切都不受限：agent 的模型与模型别名仍从所有已发现的模型中选取，并在各自的页面上按提供商分组，选择器末尾还有一个条目可打开决定其内容的页面，因此短列表不会被误认为是全部。
- 精选的是提供商提供的无日期 id，按发布日期排序，其次按提供商在当前系列模型上维护的 `-latest` 指针排序，再按 id 中的版本号排序。该指针只在没有日期可依据时起作用（Gemini）：报告发布日期的提供商同样为其指针标注日期。模型别名所指定的名字不参与其中：别名本身就是一份人工维护的列表，指明某个用途应使用哪个模型，这与哪些模型值得在选择器中展示是不同的问题。该集合从每次发现中推导而非存储，因此明天发布的模型在它出现当天就会被展示。
- 两个方向都可以由用户覆盖，且只存储覆盖结果：取消勾选一个默认展示的模型会将其加入 `ai-features.modelSettings.hiddenModels`，勾选任何其他模型会将其加入 `ai-features.modelSettings.favoriteModels`。没人动过的模型不会出现在任何一个列表中，成功发现后不再提供的模型会从两个列表中移除。
- 一个 `-latest` id（提供商将其维护为指向某系列当前模型的指针，如 `gemini-flash-latest`）排在带版本号的 id 之前，因为它按定义解析为最新版本，自身没有版本号可比。更了解自家产品的提供商可以通过 `DiscoveredModel.featured` 直接提名其模型：GitHub Copilot 在一个提供商下服务多家厂商，因此它逐个厂商填充五个名额：先是 `auto`，然后是 Anthropic、OpenAI 和 Google 各自的最新模型，再依次是各自的次新模型，而不是让排序从模型编号最高的厂商里挑出五个。Copilot 携带的其余模型保持注册且可选，只是不被预选。
- 成功发现后不再提供的模型会从收藏中移除，而缓存或失败的发现不会动它们。不参与发现的提供商（手动配置的或自定义端点）的模型全部展示，因为列出它们本就是既定选择。
- 模型列表——Model Discovery 区、聊天输入的模型选择器、agent 的模型下拉框和别名的模型选择器——把最近发布的模型排在前面，跨多个提供商时按提供商分组。发布日期来自提供商（`LanguageModelMetaData.released`，新增）；Gemini 不报告日期，因此 Google 的模型保持字母顺序。
- 内置模型别名保持由代码定义。发现未产出的 `defaultModelId` 在别名解析时会被直接跳过，与之前一样。
- OpenAI 的端点列出了所有模型类型而没有能力元数据，因此非聊天模型（audio/image/embedding/moderation/computer-use/live/`-instruct`/…）被启发式过滤掉，各模型的能力仍来自内置默认值。Google 的端点以同样方式过滤为 `gemini-*` 聊天模型：它还承载的内容要么不是聊天（图像、语音、嵌入），要么通过它自己的 agentic API 回答（deep research、computer use），要么属于其他系列（Gemma、LearnLM）。由于 Gemini id 不带发布日期，排序退回到其中的数字，否则像 `gemma-3-27b-it` 这样的参数量会被读作最新模型。它也不报告显示名称；因此每个模型都按 id 列出，提供商报告的名称（对 Google 还有描述）在其下方显示（如果有）。
- 发现的列表可以为每个提供商替换为显式列表：`ai-features.anthropic.modelOverrides`、`ai-features.google.modelOverrides` 和 `ai-features.openAiOfficial.modelOverrides`。空（默认）表示进行发现；列出模型 id 则精确注册这些模型并完全跳过发现，语义与既有的 `ai-features.copilot.modelOverrides` 相同。这就是把产品目录固定下来以抵御提供商变更的方式，也是在完全无法访问列表端点时命名模型的方式。
- **行为变更：** 当 API key 来自环境变量（`ANTHROPIC_API_KEY`、`GOOGLE_API_KEY`/`GEMINI_API_KEY`、`OPENAI_API_KEY`）而非偏好时，它不再被自动使用。Theia 会先请求一次性确认；可通过提示授予，或将 `ai-features.<provider>.allowEnvironmentApiKey` 设为 `true`。
- `@theia/ai-copilot` 现在通过同一界面报告其发现，因此其提供商页面会显示 Copilot CLI 返回的内容、列表调用是否失败，以及聊天输入展示了它的哪些模型。登录之于 Copilot 相当于设置 API key，因此未登录被报告为缺少凭据而非调用失败——徽标显示 "Not signed in" 而非 "No API key"，带有一个执行登录命令的按钮且没有可按的刷新按钮，因为登录前什么都取不到。凭据由命令建立的提供商会在 `ModelDiscoveryStatus.action` 中命名该命令；凭据不是 API key 的提供商会在 `ModelDiscoveryStatus.stateLabel` 中命名徽标。
- 添加自己的发现型提供商的采用者应扩展 `DiscoveringProviderContribution`（`@theia/ai-core/lib/browser`），它负责执行发现：排队运行、注册返回的模型、注销消失的模型、把环境变量 key 置于同意之后，并将全部状态报告给 `ModelDiscoveryStatusService`。提供商需提供其 id、管理器、读取的两个偏好、消息，以及发现的模型如何成为模型描述；其他行为（自定义端点、代理）放入 `initializeProvider` 和 `handlePreferenceChange`。在后端，`ModelDiscoveryFetcher` 和 `ModelSnapshotStore`（`@theia/ai-core/lib/node`）提供对瞬时失败重试的获取，并将结果保留为离线快照；`DiscoveredModels`（`@theia/ai-core/lib/common`）合并带发布日期的 id。`FavoriteModelsService`（`@theia/ai-core/lib/browser`）决定聊天输入展示哪些已发现的模型。

_Electron 启动参数转发 API_：

将第二次启动的 CLI 参数转发到新窗口新增了几个 API，实现受影响扩展点的采用者需要了解。新 API 均为 `@experimental`，很可能发生破坏性变更：

- `TheiaCoreAPI.WindowMetadata`（Electron preload API，`@theia/core/lib/electron-common/electron-api`）新增可选成员 `launchArgs?: LaunchArguments`，承载被转发启动解析后的 CLI 选项。它由 preload 脚本通过既有的 `CHANNEL_WC_METADATA` 通道同步填充，该通道现在返回完整的元数据对象而不只是 `webContents` id。使用自定义 preload 的采用者必须从该通道返回 `{ webcontentId, launchArgs }`。
- `ElectronMainApplicationContribution` 新增可选钩子 `claimsWindow?(args: LaunchArguments): MaybePromise<boolean>`。返回 `true` 的贡献会使该次启动打开一个空窗口，而不是恢复上次的工作区，因为该窗口即将被贡献所附加的内容替换。`@theia/dev-container` 用它认领 `--attach-container` 启动，通过新的 `electronMain` 入口点（`lib/electron-main/dev-container-electron-main-module`），手动组装扩展列表的采用者必须包含它。
- 新的可替换服务 `WindowLaunchArgs`（接口 + 符号，`@theia/core/lib/browser/window/window-launch-args`）将这些选项同步暴露给前端，新的贡献点 `RemoteCliArgsContribution`（`@theia/core/lib/common/remote-cli-args-contribution`）允许扩展向远程后端贡献额外的 CLI 参数。

_ESBuild_：

Theia 使用 [`ESBuild`](https://esbuild.github.io/) 打包应用（前端+后端）。`webpack` 打包选项已在 1.75.0 移除，参见 [v1.75.0](#v1750)。删除 `webpack.config.js` 后会在下次构建时生成 `esbuild.mjs` 文件；你添加到 `webpack.config.js` 的打包指令需要迁移到基于 ESBuild 的打包器。

注意，作为此变更的一部分，`@theia/native-webpack-plugin` 依赖已更名为 `@theia/bundle-plugin`。

生成的 ESBuild 配置包含一个 `sourceMapPathsPlugin`，它将输出的 source map 中的 `sources` 字段改写为绝对的 `file://` URL。这使得浏览器和 Node 的调试启动配置无需任何自定义 `webRoot` 或 `sourceMapPathOverrides` 即可工作：一个最小的 Chrome 启动配置如

```json
{
    "name": "Launch Browser Frontend",
    "type": "chrome",
    "request": "launch",
    "url": "http://localhost:3000/"
}
```

就足以在原始源码中绑定断点。如果你的自定义 `esbuild.mjs` 不会被自动重新生成（因为 `gen-esbuild` 导入被移除了），要么重新生成它（删除 `esbuild.mjs` 并重跑 `theia build`），要么手动将来自 `@theia/bundle-plugin` 的 `sourceMapPathsPlugin()` 添加到每个构建目标的 `plugins` 数组。当 source map 被禁用（生产构建）时，该插件是空操作。

_Builtin Extension Pack_：

如果你在使用 [`eclipse-theia.builtin-extension-pack@1.79.0`](https://open-vsx.org/extension/eclipse-theia/builtin-extension-pack) 扩展包，可能需要包含 [`ms-vscode.js-debug`](https://open-vsx.org/extension/ms-vscode/js-debug) 和 [`ms-vscode.js-debug-companion`](https://open-vsx.org/extension/ms-vscode/js-debug-companion) 插件以支持 JavaScript 调试。
该包发布时曾出现问题，排除了这些必要的内置扩展。

例如，在你的应用 `package.json` 中：

```json
"theiaPlugins": {
  "eclipse-theia.builtin-extension-pack": "https://open-vsx.org/api/eclipse-theia/builtin-extension-pack/1.79.0/file/eclipse-theia.builtin-extension-pack-1.79.0.vsix",
  "ms-vscode.js-debug": "https://open-vsx.org/api/ms-vscode/js-debug/1.78.0/file/ms-vscode.js-debug-1.78.0.vsix",
  "ms-vscode.js-debug-companion": "https://open-vsx.org/api/ms-vscode/js-debug-companion/1.1.2/file/ms-vscode.js-debug-companion-1.1.2.vsix"
}
```

_msgpackr_：

如果你遇到 [`maximum callstack exceeded`](https://github.com/eclipse-theia/theia/issues/12499) 错误，可能需要通过 [yarn resolution](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 降低 `msgpackr` 的版本。

```
rpc-message-encoder.ts:151 Uncaught (in promise) Error: Error during encoding: 'Maximum call stack size exceeded'
    at MsgPackMessageEncoder.encode (rpc-message-encoder.ts:151:23)
    at MsgPackMessageEncoder.request (rpc-message-encoder.ts:137:14)
    at RpcProtocol.sendRequest (rpc-protocol.ts:161:22)
    at proxy-handler.ts:74:45
```

为获得最佳效果，请遵循框架使用并测试过的版本。

例如：

```json
"resolutions": {
    "**/msgpackr": "1.8.3"
}
```

_socket.io-parser_：

在 [`v1.31.1`](https://github.com/eclipse-theia/theia/releases/tag/v1.31.1) 之前，可能需要使用 [resolution](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 来绕过我们运行时依赖 [socket.io-parser](https://github.com/socketio/socket.io-parser) 中最近发现的一个[严重漏洞](https://security.snyk.io/vuln/SNYK-JS-SOCKETIOPARSER-3091012)。

例如：

```json
"resolutions": {
    "**/socket.io": "^4.5.3",
    "**/socket.io-client": "^4.5.3"
}
```

_终端 Shell 集成脚本_：

`@theia/terminal` 包现在包含用于 Bash 和 Zsh 的 shell 集成脚本（`packages/terminal/src/node/shell-integrations/`）。这些脚本在运行时由 `ShellIntegrationInjector` 使用，向终端会话注入 shell 集成，从而启用命令历史跟踪和命令分隔符等特性。

对于**浏览器**应用，生成的打包器配置会自动将这些脚本复制到 `lib/backend/shell-integrations/`。

对于使用自定义打包（如 `electron-builder`、`electron-forge`）的 **Electron** 应用，你必须确保 `shell-integrations` 目录包含在打包产物中。这些脚本必须能够相对于编译后的 `ShellIntegrationInjector` 模块在 `lib/backend/shell-integrations/` 位置访问。如果缺少这些文件，终端 shell 集成将静默失败而无法激活。

例如，在 `electron-builder` 配置中，通过 `files` 模式确保包含 `lib/backend/shell-integrations` 目录：

```json
{
  "files": [
    "lib/**/*",
    "src-gen/**/*"
  ]
}
```

`lib/**/*` glob 已经覆盖 `lib/backend/shell-integrations/`。如果你使用更严格的 `files` 模式，请确保显式包含 `lib/backend/shell-integrations/**/*`，因为 `ShellIntegrationInjector` 相对于 `__dirname`（即 `lib/backend/`）解析这些脚本。

_asar 打包的 Electron 应用中的捆绑文件_：

以 `asar: true` 打包的应用将文件存储在 `app.asar` 内，只有应用自身能读取。因此 Theia 派生的进程无法使用归档中的文件：shell 无法 source 终端 shell 集成脚本，`child_process.spawn` 也无法执行 `@theia/bundle-plugin` 复制到 `lib/backend/native/` 的 ripgrep 二进制。自 `1.77.0` 起应用已处理此问题：`BundledResourceProvider`（`@theia/core/lib/node`）在首次需要时将此类文件从归档提取到配置目录（默认 `~/.theia/bundled-resources/`），并清理早期版本的副本。无需任何打包改动。

可以在打包时解包文件来避免提取。只要解包文件完整，提供者会优先使用它们而非自己的副本。以 `electron-builder` 为例：

```yaml
asar: true
asarUnpack:
  - "**/lib/backend/shell-integrations/**"
  - "**/lib/backend/native/**"
```

对于其他任何要交给应用之外进程使用的捆绑文件（如脚本或辅助可执行文件），请使用 `BundledResourceProvider.resolveExternalPath(path)`。这同样适用于你自己派生 `@vscode/ripgrep` 导出的 `rgPath` 的代码：在捆绑包中，`rgPath` 只有在二进制被解包时才指向 `app.asar.unpacked`，否则指向归档内部。

如果你曾通过在自己的 esbuild 配置中覆盖 `@vscode/ripgrep` 替换来绕过 ripgrep 问题，该覆盖已不再需要。

### v1.76.0

#### GitHub Copilot 改由 Copilot CLI 提供服务

`@theia/ai-copilot` 不再使用自己的 GitHub OAuth token 直接访问 Copilot REST API。所有请求均由官方 GitHub Copilot CLI 处理，该 CLI 作为后台进程启动在后端所在机器上，并通过 Copilot SDK 通信。

原因是 GitHub 按 OAuth 应用授予 Copilot 模型访问权。此前集成所用的应用不具备当前模型阵容的权限，因此无论用户订阅如何，它只能看到一小部分旧版模型。Copilot CLI 具备权限，经由它路由即可使用当前模型。

该集成是实验性的，其偏好也在设置 UI 中如此标记：它仍在开发中，其 API 与偏好可能变更或移除。

**对用户而言：** 后端所在机器上必须能找到 Copilot CLI，例如通过
`npm install -g @github/copilot`。查找位置包括应用的安装目录、`PATH` 以及全局 `npm`
目录；如果安装在其他位置，可通过新偏好 `ai-features.copilot.executablePath`（或后端的 `COPILOT_CLI_PATH` 环境变量）指定。打包后的应用无法依赖自带 CLI，
因为它是平台相关的二进制，无法从应用归档内部执行。

之前版本的登录无法延续，因为它属于另一个 OAuth 应用。它会在首次启动时从凭据存储中移除，并弹出通知要求重新登录。除此之外无需其他操作：登录
对话框与之前一样工作，现在它代表用户登录 Copilot CLI。登出会再次移除应用的凭据，
且绝不触碰其他工具的系统钥匙串条目或 GitHub CLI 的登录。

**对采用者而言：** 以下 API 已被移除。

- `CopilotOAuthConfig` 和 `DEFAULT_COPILOT_OAUTH_CONFIG`。配置自己的 OAuth 应用不再有任何效果，因为
  登录由 Copilot CLI 执行。请移除对该符号的任何重绑定。
- `CopilotLanguageModel`、`getCopilotApiBaseUrl` 和 `COPILOT_API_BASE_URL`，以及它们所属的 REST 传输层。
  Copilot 模型现在是 `CopilotSdkLanguageModel` 的实例。
- `CopilotModelDescription.enableStreaming` 和 `CopilotModelDescription.supportsStructuredOutput`。请求始终流式，且
  该路径上不提供结构化输出。
- `CopilotAuthService.initiateDeviceFlow`、`pollForToken` 和 `getAccessToken`。登录现在由 `startSignIn`、
  `waitForSignIn` 和 `cancelSignIn` 驱动，因为 CLI 自己执行并轮询该流程，且产生的 token 不对外暴露。

新增了 `CopilotAuthService.setExecutablePath`，使前端能把配置的 CLI 位置交给
无法自行读取偏好的后端。从零实现该接口的采用者必须提供它；查找逻辑本身是
`CopilotCliLocator`，可以重绑定。

`@github/copilot-sdk` 被**刻意**设为本扩展的非依赖，连开发依赖也不是。该包依赖
CLI，这会把一个大型专有二进制引入每个包含 `@theia/ai-copilot` 的应用的依赖树和锁文件，
而打包后的应用反正无法从归档内部执行它。CLI 自带 SDK 副本，
`CopilotSdkLoader` 从即将处理请求的那个 CLI 加载它。当 CLI 不带副本时，
已安装的 `@github/copilot-sdk` 会被使用，因此依赖该包的应用仍能工作。
本集成使用的 SDK API 部分镜像在 `copilot-sdk-types.ts` 中，其中记录了所取自的 SDK 版本
以及如何更新。

有两点后果值得提前规划。CLI 是后端主机的前置条件而非应用自带之物，因此发行版要么安装它，要么告知用户安装。并且由于 CLI 在后端主机上运行、每个前端连接一个进程，本集成不适合多用户后端部署——那样每个连接的前端都会共享同一个身份。

供仔细研究的采用者参考的三个行为细节：Theia agent 的系统提示现在作为 Copilot 会话的系统消息，取代 CLI 原本会使用的 agent 指令，而不是被前置到用户提示。运行时被指向 Theia 配置目录之下的一个 Copilot home，因此从 Theia 发出的请求不再出现在用户用自己的 CLI 发起的对话之中，且请求的会话在回答后被删除。运行时的配置关闭了 CLI 的环境行为：只有请求的工具可用，主机上找到的指令与技能、记忆与会话存储、主机 git 操作以及插件都被关闭，因为 Theia 自己驱动对话。

#### 从 Theia 代码库中移除已弃用的 @theia/preview 扩展 [#18001](https://github.com/eclipse-theia/theia/pull/18001)

`@theia/preview` 扩展已从 Theia 代码库中完全移除。
该扩展自 v1.73.0 起被弃用并停止发布。

如果你的应用仍依赖 `@theia/preview`，请迁移到内置的 VS Code Markdown 扩展（`vscode.markdown-language-features`），它提供相同的功能集且在积极维护。请从应用的依赖中移除对 `@theia/preview` 的所有引用，并确保 VS Code Markdown 扩展包含在你的应用中——或通过内置扩展包，或显式添加到插件配置。

随扩展一起消失的还有 `preview.openByDefault` 偏好、`preview:open` 和 `preview.open.source` 命令，以及 `PreviewUri`、`PreviewHandler`、`PreviewHandlerProvider`、`PreviewWidget`、`PreviewContribution`、`PreviewCommands`、`MarkdownPreviewHandler` 和 `PreviewLinkNormalizer` API。VS Code Markdown 扩展转而贡献 `markdown.showPreview`、`markdown.showPreviewToSide` 和 `markdown.preview.*` 偏好。

#### browser-only 配置目录移至 `/.theia` [#17966](https://github.com/eclipse-theia/theia/pull/17966)

browser-only 的 `EnvVariablesServer` 存根（`packages/core/src/browser-only/frontend-only-application-module.ts`）此前对 `getConfigDirUri()` 返回空字符串。`new URI('')` 解析为 `file:///`，因此在 browser-only 模式下配置目录实际上是 OPFS 文件系统的根，每个消费者都把状态写在那里，与用户的工作区目录混在一起。`getConfigDirUri()` 现在返回 `file:///.theia`，与后端默认的 `.theia` 配置文件夹（`configurationFolder` 属性）一致。

副作用是，`CommonFrontendContribution` 以 `parent: new URI(configDirUri)` 注册了 UTF-8 编码覆盖。由于该父目录过去是 `file:///`，在 browser-only 模式下该覆盖作用于整个文件树。现在它被正确限定在 `/.theia`，与后端行为一致。

**面向最终用户：**

- 现有的 browser-only 部署把状态放在 OPFS 根目录。这不会被自动迁移：升级后，Theia 在 `/.theia` 下查找，一无所获，对该状态而言表现得如同全新安装。受影响的数据包括：
  - `settings.json` 和 `keymaps.json`
  - 未命名工作区文件与最近工作区列表
  - 工作区元数据
  - AI 存储：聊天会话、提示词定制、技能、草绘工具
- `/.theia` 之外的文件不再被强制使用 UTF-8 编码。

**面向采用者：**

- 如果需要保留既有用户数据，请在升级后首次运行时把上面列出的条目从 OPFS 根复制到 `/.theia`。
- 不要依赖旧的覆盖全局 UTF-8 编码作用于配置目录之外。

### v1.75.0

#### React 19 与自动 JSX 运行时

Theia 现在要求 `react`/`react-dom` `^19`，不再支持 React 18。
`@theia/core` 对 `react`、`react-dom`、`@types/react` 和 `@types/react-dom` 的 peer 依赖范围收窄为 `^19.0.0`，因此四个都需要升版。
自 v1.74.0 起，`react`/`react-dom` 是 `@theia/core` 的 peer 依赖而非直接依赖。
因此，取决于你的包管理器及其设置，你可能需要把它们添加为你产品的显式依赖。

React 本身的升级由 [React 19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)覆盖。
最可能影响扩展代码的变更是 `useRef` 不再有零参重载，因此 `React.useRef<T | undefined>()` 变为 `React.useRef<T | undefined>(undefined)`。

所有 Theia 包现在都使用自动 JSX 运行时编译：

```json
"jsx": "react-jsx",
"jsxImportSource": "@theia/core/shared/react"
```

`@theia/core/shared/react/jsx-runtime` 和 `@theia/core/shared/react/jsx-dev-runtime` 是新的再导出，因此生成的 JSX 调用仍解析为 `@theia/core` 共享的唯一 React 实例。
唯一的例外是 `@theia/core`：它无法导入自己的再导出，所以 `packages/core/tsconfig.json` 将 `jsxImportSource` 覆盖为 `react`，它解析到同一模块。

采用者不必切换，但如果你想在自家扩展中使用相同配置：

- 在你的 `tsconfig.json` 中按上面设置 `jsx` 与 `jsxImportSource`（若你使用 `jsx: "react-jsxdev"`，则改用 `jsx-dev-runtime` 再导出）
- 从那些只是为 JSX 才需要它的文件中移除 `import * as React from '@theia/core/shared/react'`。凡使用 `React.*` 类型或 API 的地方（`React.ReactNode`、`React.FC`、`React.MouseEvent`、hooks 等）保留导入。启用 `noUnusedLocals` 后编译器会报告这些现已多余的导入。


#### 移除 webpack 打包器

`webpack` 打包选项已被移除，`theia build` 现在总是使用 [esbuild](https://esbuild.github.io/) 打包。自 1.72.0 起 esbuild 就是没有 `webpack.config.js` 的应用的默认打包器，1.74.0 宣布了 webpack 的移除。

已经用 esbuild 构建的应用不受影响。仍有 `webpack.config.js` 的应用会在下次构建时生成 `esbuild.mjs`；遗留的 `webpack.config.js` 被忽略并给出警告。请将自定义迁移到 `esbuild.mjs` 并删除 `webpack.config.js`；生成的 `gen-webpack.config.js` 和 `gen-webpack.node.config.js` 由 `theia clean` 移除。

具体而言：

- `theia build` 不再读取 `webpack.config.js`，也不再生成 `gen-webpack.config.js` / `gen-webpack.node.config.js`。
- `theia build [webpack-args...]` 变为 `theia build [bundler-args...]`；参数被转发给生成的 `esbuild.mjs` 而非 webpack CLI。`--webpack-help` 保留为新 `--bundler-help` 的弃用别名。
- `@theia/bundle-plugin` 不再导出 `NativeWebpackPlugin` 和 `MonacoWebpackPlugin`，也不再依赖 `webpack`。esbuild 等价物是 `nativeDependenciesPlugin()` 和 `monacoNlsPlugin()`。
- `@theia/application-manager/lib/expose-loader` 已被移除。请改用来自 `@theia/bundle-plugin` 的 `exposeModulePlugin()`，示例见 [`examples/browser/esbuild.mjs`](../examples/browser/esbuild.mjs)。
- `@theia/application-manager` 不再依赖 `webpack`、`webpack-cli`、`copy-webpack-plugin`、`compression-webpack-plugin`、`mini-css-extract-plugin`、`css-loader`、`style-loader`、`ignore-loader`、`source-map-loader`、`node-loader`、`string-replace-loader`、`umd-compat-loader`、`path-browserify` 和 `buffer`，也不再依赖仅由 webpack 配置引入的包：`babel-loader`、`worker-loader`、`@babel/*`、`source-map` 和 `source-map-support`。如果你自己的构建依赖其中任何一项被传递性安装，请在你的应用 `devDependencies` 中显式声明。

如果你尚无法迁移，请停留在 Theia 1.74.x，或将 webpack 配置 vendor 进自己的仓库。最后生成的配置在 [`bundler-generator.ts`](https://github.com/eclipse-theia/theia/blob/v1.74.1/dev-packages/application-manager/src/generator/bundler-generator.ts)（`compileWebpackConfig` 和 `compileNodeWebpackConfig`），插件在 [`webpack-plugin.ts`](https://github.com/eclipse-theia/theia/blob/v1.74.1/dev-packages/bundle-plugin/src/webpack-plugin.ts) 和 [`monaco-webpack-plugins.ts`](https://github.com/eclipse-theia/theia/blob/v1.74.1/dev-packages/bundle-plugin/src/monaco-webpack-plugins.ts)，expose loader 在 [`expose-loader.ts`](https://github.com/eclipse-theia/theia/blob/v1.74.1/dev-packages/application-manager/src/expose-loader.ts)。这种情况下你还得自行声明 `webpack`、`webpack-cli`、`terser-webpack-plugin` 和上面列出的 loader。

#### 使用 esbuild 预压缩前端资源

只要存在 `<file>.gz` 兄弟文件且客户端接受 `gzip`，Theia 后端就会改而服务它。这过去由 webpack 的 `CompressionPlugin` 生成；现在由来自 `@theia/bundle-plugin` 的新 `compressAssetsPlugin()` 生成，生成的 esbuild 浏览器配置包含它。

`theia build` 的 `--static-compression` 标志继续有效，但其默认值变了：仅对以 `--mode production` 构建的浏览器应用启用压缩。因此开发和 watch 重建保持快速，而从前端经回环加载自本地后端的 Electron 应用不再在打包产物中携带压缩副本。可用 `--static-compression` 或 `--no-static-compression` 覆盖。

每当某个资源未被压缩，该插件会移除上次构建的 `.gz` 文件。因此开发构建不会把更早生产构建的资源留给后端去服务。

### v1.74.0

#### @theia/ai-vercel-ai 包被弃用

`@theia/ai-vercel-ai` 包已被标记为弃用，不再发布到 npm。经过一段弃用期后它将从 Theia 代码库中移除。该包只是封装了 OpenAI 和 Anthropic 模型，而这两者已由提供一等支持的专用 `@theia/ai-openai` 和 `@theia/ai-anthropic` 提供商覆盖。

如果你的应用依赖 `@theia/ai-vercel-ai`，请按如下方式迁移：

- **OpenAI 模型**：使用 `@theia/ai-openai`。将 `ai-features.vercelAi.openaiApiKey` 移至 `ai-features.openAiOfficial.openAiApiKey`；模型本身从提供商发现（见上文 _动态模型发现_）。
- **Anthropic 模型**：使用 `@theia/ai-anthropic`。将 `ai-features.vercelAi.anthropicApiKey` 移至 `ai-features.anthropic.AnthropicApiKey`；模型本身从提供商发现（见上文 _动态模型发现_）。
- **自定义端点**（`ai-features.vercelAi.customModels`）：按其 `provider` 字段将条目拆分到匹配的提供商专属偏好：
  - `provider: 'openai'` → `ai-features.openAiCustom.customOpenAiModels`
  - `provider: 'anthropic'` → `ai-features.anthropicCustom.customAnthropicModels`

专用提供商偏好提供相同的字段外加更多（例如 OpenAI 的 Azure `apiVersion`/`deployment`、`useResponseApi`、`reasoningSupport`；Anthropic 的 `useCaching`、`maxRetries`）。

#### 用于读写 AI 偏好的 `AiConfigurationService`

新的框架 API `AiConfigurationService`（`@theia/ai-core`）为 `ai-features.*` 偏好包装了 `PreferenceService`，是读写 AI 配置的预期扩展点。

**面向采用者：**

- 在前端代码中，对 `ai-features.*` 键优先使用 `AiConfigurationService` 而非 `PreferenceService`。其 `get`/`inspect` 是工作区信任感知的（工作区不受信任时抑制工作区/文件夹值）；写操作（`set`/`update`）不受信任限制。
- **行为变更：** AI 终端的 shell 命令允许/拒绝列表（`ai-features.terminal.shellCommand{Allowlist,Denylist}`）现在通过 `AiConfigurationService` 以信任感知方式读取。此前它们通过原始的 `PreferenceService.get` 读取，因此不受信任的工作区可以贡献允许列表条目。现在工作区/文件夹范围的条目在工作区受信任前被抑制（不受信任的工作区无法再扩大 shell 允许列表）。用户与默认范围的条目不受影响。

### v1.73.0

#### 自定义 agent 重组为每 agent 一个文件夹 [#17523](https://github.com/eclipse-theia/theia/pull/17523)

自定义 agent 不再按作用域存储在单个 `customAgents.yml` 中。每个 agent 现在位于自己的文件夹 `<scope>/agents/<id>/agent.md`，带 YAML frontmatter（`name`、`description`、`defaultLLM`、`showInChat`）及其下的提示词正文，与既有的 `SKILL.md` 模式一致（作用域为工作区的 `.prompts/` 目录和 `~/.theia/prompt-templates`）。

**面向最终用户：**

- 当发现现有 `customAgents.yml` 时，Theia 在迁移到新布局前会询问：通知提供 **Migrate** 或 **Don't Show Again**。在你选择 **Migrate** 之前不会写入任何东西，这避免了意外的文件改动（例如版本控制下的工作区）。拒绝是安全的：旧式 `customAgents.yml` 文件继续被加载，agent 继续工作，并且下个会话会再次询问，直到你迁移或用 **Don't Show Again**（记录在本地存储中，不是设置项）永久关闭提示。成功迁移后，`customAgents.yml` 被重命名为 `customAgents.yml.bak`（绝不删除）；恢复它只需手动把 `.bak` 改回原名。迁移也可以随时通过命令面板的 `AI: Re-run custom-agent migration` 触发。
- 以 YAML _折叠_ 块标量存储的提示词（`prompt: >-`）保留其 markdown 标题结构：折叠标量否则会把每个标题并入下一段（例如 `## Task Your task is ...`），因此迁移和运行时加载改为保留原始换行。如果更早的 Theia 版本已经以合并标题的方式迁移过这样的 agent，生成的 `agent.md` 会在下次迁移时自动纠正，但前提是你此后没有编辑过它（纠正内容从 `customAgents.yml.bak` 重写；用户修改过的文件保持不动）。
- 由 "Edit prompt" 创建的默认提示词覆盖文件从 `<agent-name>_prompt.prompttemplate` 变为 agent 文件夹内的 `prompt.prompttemplate`。既有的同目录 `<agent-name>_prompt*.prompttemplate` 文件会在迁移期间移入 agent 文件夹。

**面向采用者：**

- `PromptFragmentCustomizationService` 新增了必需方法 `createCustomAgentFile`、`migrateCustomAgentsYaml` 和 `hasPendingCustomAgentMigration`。如果你直接实现该接口，必须提供它们。`migrateCustomAgentsYaml()` 的报告对象除迁移计数外还带一个 `corrected` 计数。
- `PromptFragmentCustomizationService.getCustomAgentsLocations()` 现在返回 `CustomAgentsLocation[]`。每个元素新增必需字段 `kind: 'agents-dir' | 'legacy-yaml'`，且结果把每 agent 的 `agents/` 目录条目与旧式 `customAgents.yml` 条目交错排列（每个作用域各一个）。之前假定结果只含 `customAgents.yml` 文件的遍历代码应改为按 `kind` 分支。

#### 自定义 agent 默认使用 `.agents` 工作区文件夹

现在从每个工作区根的 `.agents/` 和 `.prompts/` 文件夹扫描自定义 agent，与 `ai-features.promptTemplates.WorkspaceTemplateDirectories` 偏好无关。`.agents/` 优先，并且是新建 agent 的默认位置（与 [#17553](https://github.com/eclipse-theia/theia/pull/17553) 引入的技能约定一致）；出于向后兼容，`.prompts/agents/` 仍会被发现。

**面向最终用户：**

- 新的自定义 agent 默认创建在 `.agents/agents/<id>/agent.md` 下。`.prompts/agents/` 下的既有 agent 继续工作，且仍被列为创建位置。

**面向采用者：**

- `PromptFragmentCustomizationProperties` 新增可选字段 `agentDirectoryPaths`，承载扫描自定义 agent 的绝对父目录。`.agents`/`.prompts` 父目录导出为 `CUSTOM_AGENT_WORKSPACE_DIRECTORIES`。

### v1.70.0

#### 从 Theia 代码库中移除已弃用的 @theia/git 扩展 [#17148](https://github.com/eclipse-theia/theia/pull/17148)

`@theia/git` 扩展已从 Theia 代码库中完全移除。
该扩展自 v1.58.0 起被弃用，并于 v1.61.0 停止发布。

如果你的应用仍依赖 `@theia/git`，必须迁移到内置的 VS Code Git 扩展，它提供相同的功能集且在积极维护。请从应用的依赖中移除对 `@theia/git` 的所有引用，并确保 VS Code Git 扩展包含在你的应用中——或通过内置扩展包，或显式添加到插件配置。

### v1.65.0

#### 浏览器-only 文件系统改进 [#16187](https://github.com/eclipse-theia/theia/pull/16187)

浏览器-only 文件系统重构为使用带 web worker 的 OPFS API。

关键变更：

- `OPFSFileSystemProvider` 完全重写——继承旧实现的扩展需要对齐
- `FileUploadService` 从 `@theia/filesystem/lib/browser/file-upload-service` 移至 `@theia/filesystem/lib/common/upload/file-upload`，现以符号键绑定并有独立的 `FileUploadServiceImpl`
- `FileDownloadService` 从 `file-download-data.ts` 移至 `file-download.ts`，现以符号键绑定并有独立的 `FileDownloadServiceImpl`
- `NodeFileUploadService` 从 `src/node/node-file-upload-service.ts` 移至 `src/node/upload/node-file-upload-service.ts`
- `OPFSInitialization.getRootDirectory()` 返回 `Promise<string> | string` 而非 `Promise<FileSystemDirectoryHandle>`——只需以字符串返回文件系统根而非目录句柄

#### 让后端可用偏好 [#16017](https://github.com/eclipse-theia/theia/pull/16017)

该 PR 让后端支持偏好。后端只能访问默认与用户偏好。API 变更如下：
- 许多文件从 "browser" 文件夹移至 "common" 文件夹。导入语句需要相应调整
- `PreferenceSchemaProvider` 被两个独立的 `PreferenceSchemaServiceImpl`（及相应接口）和 `DefaultsPreferenceProvider` 类取代。
- 偏好模式（schema）类型被简化：偏好 schema 不再继承 IJSONSchema，类型改为严格使用 Theia 类型（例如 scopes），属性则是对标准 IJSONSchema 的直接扩展。这意味着来自 VS Code（被贡献的）schema 必须转换为 Theia 格式。
- PrefenceSchemaService 区分添加 schema 和为属性注册默认覆盖。此外，该服务使用显式覆盖标识符而非把覆盖编码进偏好键。该服务严格区分偏好 schema 与为偏好文件派生的 JSON Schema。适用时以 `JSONValue` 替代 `any`。必须在注册覆盖之前添加 schema 属性。
`PreferenceSchemaService` 现在有 `validScopes` 概念。在后端只能使用 `Default` 和 `User`。因此，特定偏好作用域的偏好提供者可能未被绑定。不要用 `@inject(PreferenceProvider) @named(<preference scope>)` 注入偏好提供者，改为注入并使用 `PreferenceProviderProvider`。
- 除声明式 Schema 贡献外，`PreferenceContribution` 现在还有 `initSchema()` 方法。它用于注册覆盖。

### v1.62.0

#### 重构菜单节点 [#14676](https://github.com/eclipse-theia/theia/pull/14676)

该 PR 把菜单节点和标签栏工具栏条目从纯数据描述符变为活动对象。这意味着它们可以多态地处理启用、可见性、命令执行和渲染等问题。这使得参数转换等问题从通用工具栏与菜单处理代码中剥离。借此我们得以移除 MenuCommandExecutor 和 MenuCommandAdapter 基础设施。
如果你只是注册工具栏条目和菜单，作为 Theia 采用者几乎不会有变化。主要是 menu-model-registry.ts 中一些参数类型发生了变化。菜单注册被简化：独立子菜单就是注册在不以 MAIN_MENU_BAR 前缀开头的路径下的菜单。
如果你在产品中覆盖任何工具栏或菜单相关实现，最大的变化是某些功能现在被委托给菜单与工具栏条目实现。如果这破坏了你的用例，请告诉我们。

### v1.38.0

#### Inversify 6.0

Inversify 6 引入了同步与异步依赖注入上下文的严格划分。
Theia 使用同步依赖注入上下文，因此异步依赖不能再作为 Theia 中的依赖使用。

如果你此前使用过异步依赖，这可能需要对 Theia 扩展做少量调整，包括：

1. 直接向服务注入 promise
2. `@postConstruct` 方法返回 `Promise` 实例的类

对于 1，你可以把 promise 包进一个函数：

```diff
const PromiseSymbol = Symbol();
const promise = startLongRunningOperation();

-bind(PromiseSymbol).toConstantValue(promise);
+bind(PromiseSymbol).toConstantValue(() => promise);
```

新绑定的函数需要在注入侧被恰当地处理。

对于 2，`@postConstruct` 方法可以重构为一个同步方法加一个异步方法：

```diff
-@postConstruct()
-protected async init(): Promise<void> {
-  await longRunningOperation();
-}
+@postConstruct()
+protected init(): void {
+  this.doInit();
+}
+
+protected async doInit(): Promise<void> {
+  await longRunningOperation();
+}
```

注意此版本包含若干破坏性变更，也对我们自己的类执行了此重构。
如果你一直在覆盖其中一些 `init()` 方法，改覆盖 `doInit()` 可能更合适。

### v1.37.0

#### 在 Electron 渲染进程中禁用 node 集成并启用上下文隔离标志

这也意味着 `electron-remote` 不能再用于 `electron-frontend` 或 `electron-common` 中的组件。要从浏览器侧使用 electron 相关功能，你需要通过 preload 脚本暴露一个 API（参见 <https://www.electronjs.org/docs/latest/tutorial/context-isolation>）。在 Theia 扩展中实现它需要以下步骤：

1. 定义 API 接口并在全局 `window` 变量上声明一个 API 变量。示例见 `packages/filesystem/electron-common/electron-api.ts`
2. 编写一个 preload 脚本模块，在渲染端（"browser"）实现该 API，并通过 `exposeInMainWorld` 暴露。你需要在名为 `preload()` 的导出函数中暴露该 API。示例见 `packages/filesystem/electron-browser/preload.ts`。
3. 声明指向该 preload 脚本的 `theiaExtensions` 条目，如下：

```
"theiaExtensions": [
    {
      "preload": "lib/electron-browser/preload",
```

示例见 `/packages/filesystem/package.json`

4. 通过贡献一个 `ElectronMainApplicationContribution` 在 electron-main 侧实现该 API。示例见 `packages/filesystem/electron-main/electron-api-main.ts`。如果没有模块向 electron-main 应用贡献，你可能需要在 package.json 中声明。

```
"theiaExtensions": [
  {
    "preload": "lib/electron-browser/preload",
    "electronMain": "lib/electron-main/electron-main-module"
  }
```

如果你在 electron 浏览器侧代码中使用 NodeJS API，还需要把代码移出渲染进程，例如按上述方式建立 API，或改用后端服务。

### v1.35.0

#### 停止支持 `Node 14`

框架不再支持 `Node 14`，以便更好地支持面向 `1.68.1` 默认支持的 VS Code API 的插件。
使用 `yarn --ignore-engines` 变通办法仍可构建，但我们不建议。

### v1.32.0

#### 移除 `CircularDependencyPlugin`

我们不再在生成的 webpack 配置中强制使用 `CircularDependencyPlugin`。该插件此前会告知用户 JavaScript 导入中的任何非致命循环依赖。
注意，Theia 采用者可以把 `circular-dependency-plugin` 添加为 dev 依赖，并在其 `webpack.config.js` 文件中加入以下片段来重新启用该插件。

```js
config[0].module.plugins.push(new CircularDependencyPlugin({
    exclude: /(node_modules)[\\\\|\/]./,
    failOnError: false
}));
```

### v1.30.0

#### lerna 5.5.4

`lerna` 开发依赖升级了一个大版本至 v5.5.4。这移除了我们开发环境中的若干高危与严重已知漏洞。详情见该 [PR](https://github.com/eclipse-theia/theia/pull/11738)。

在本仓库中升级很顺利，但可能以不同方式使用 `lerna` 的 Theia 开发者/扩展者或许需要做一些适配。

### v1.29.0

#### React 18 更新

`react` 与 `react-dom` 依赖升级到版本 18。一些相关变更包括：

- `ReactDOM.render` 现已被弃用，由 `react-dom/client` 的 `createRoot` 取代
- 新 API 不再支持渲染回调
- promise、setTimeout、事件处理器中的更新会自动批处理
- 依赖 `react-virtualized` 被移除，改用 `react-virtuoso`

### v1.24.0

#### node-gyp 8.4.1

`electron-rebuild` 依赖升级，进而把 `node-gyp` 升至 `v8.4.1`。
该版本的 `node-gyp` 不支持 **Python2**（已 EOL），因此构建期间需要 **Python3**。

#### 从 WebSocket 迁移到 Socket.io

这是对 Theia 与其后端收发消息方式的一个非常重要的变更。

新的 Socket.io 协议会尽可能建立 WebSocket 连接，但也可能设置 HTTP 轮询。它甚至可能在尝试 WebSocket 之前先通过 HTTP 连接。

请确保你的网络配置同时支持 WebSocket 和/或 HTTP 轮询。

### Monaco 1.65.2

该版本将 Theia 使用的 Monaco 代码更新至 VSCode 1.65.2 的状态，并改变了代码的消费方式：从加载并挂到
`window.monaco` 对象上的 ASM 模块改为使用 Webpack 构建进 bundle 的 ESM 模块。

#### ASM 到 ESM

使用 ESM 模块消费 Monaco 可能需要两类改动。

- 如果你的应用使用自己的 Webpack 配置而非 @theia/dev-packages 生成的配置，你
需要更新该配置：移除先前用于把 Monaco 代码放进构建文件夹的 `CopyWebpackPlugin`，
并为 `editor.worker` 构建单独的入口。参见[这里的变更](https://github.com/eclipse-theia/theia/pull/10736/files#diff-b4677f3ff57d8b952eeefc10493ed3600d2737f9b5c9b0630b172472acb9c3a2)
- 如果你的应用使用自己的前端生成器，应修改生成 `index.html` 的代码，把包含 bundle 的 `script` 加载到 `body` 元素而非 head。参见[这里的变更](https://github.com/eclipse-theia/theia/pull/10947/files)
- 对 `window.monaco` 对象的引用应替换为从 `@theia/monaco-editor-core` 的导入。多数情况下，只需添加导入 `import * as monaco from
'@theia/monaco-editor-core'` 即可。更复杂的用例可能需要从 Monaco 的特定部分导入。详情请见
[该 PR](https://github.com/eclipse-theia/theia/pull/10736)，如有任何问题或疑问也请在该 PR 中提出。

使用 ESM 模块后，现在可以顺着导入跳转到定义以及 Monaco 源码。这有助于排查下文讨论的
Monaco 变更相关的问题。

#### Monaco 的变更

自上次 uplift 以来，Monaco API 发生了重大变化。其中最重要的之一是对 Monaco 实例化服务的覆盖处理。

- `monaco.StaticServices.<ServiceName>.get()` 式的服务访问不再可用。改用 `StaticServices.get(<ServiceIdentifier>)`，service
identifier 从 `@theia/monaco-editor-core` 导入。
- 任何应作用于 Monaco 中所有实例化的服务覆盖都应传给 `StaticServices.initialize` 的第一次调用。首次调用用于为
后续所有调用设置服务。传给后续 `StaticServices.initialize` 调用的覆盖会被忽略。要更改覆盖，请覆盖
[`MonacoFrontendApplicationContribution.initialize`](https://github.com/eclipse-theia/theia/pull/10736/files#diff-99d13bb12b3c33ada58d66291db38b8b9f61883822b08b228f0ebf30b457a85d)。
- 应用于特定实例化的服务必须传给全局 `IInstantiationService` 的子服务。参见 `MonacoEditor.getInstantiationWithOverrides`
示例。

其他变更包括若干从 `mode` -> `language` 的改名及接口变更。请查阅 [该 PR](https://github.com/eclipse-theia/theia/pull/10736) 或
`@theia/monaco-editor-core` 附带的 Monaco 源码。

#### Theia 中的破坏性变更

Theia 接口的变更详情请见 CHANGELOG。

### v1.23.0

#### TypeScript 4.5.5

如果你使用 TypeScript <= 4.5.5，并且在构建 Theia 应用时因编译器无法解析我们的类型定义而遇到问题，
那么你应升级到 TypeScript >= 4.5.5。

#### Socket.io

如果你在负载均衡器之后部署多个 Theia 节点，必须启用粘性会话（sticky-sessions），
这是使用 Socket.io 协议的新 WebSocket 实现所要求的。

更多细节参见 socket.io 关于[使用多节点](https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session)的文档。

### v1.22.0

#### Resolutions

由于 [colors.js](https://github.com/Marak/colors.js) 的问题，你的应用可能需要使用 [resolution](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 来绕过：

例如：

```json
"resolutions": {
    "**/colors": "<=1.4.0"
}
```

#### Electron 更新

Electron 从 9 升到 15，这可能需要根据新 API 对代码做一些修改。

参见 Electron 的[文档](https://github.com/electron/electron/tree/15-x-y/docs)。

最显著的是 `electron.remote` API 被弃用，由 `@electron/remote` 包取代。

Theia 使用该包并将其再导出为 `@theia/core/electron-shared/@electron/remote`。

参见 `@theia/core` 再导出的[文档](../packages/core/README.md#re-exports)。

最后，Electron 现在必须定义在你应用的 `package.json` 的 `devDependencies` 下。

`theia build` 会自动添加该条目，并在不同步时提示你重新安装依赖。

### v1.21.0

#### 前端 Source Map

前端的 source map 命名变了。如果你的调试配置中有类似以下内容：

```json
      "sourceMapPathOverrides": {
        "webpack://@theia/example-electron/*": "${workspaceFolder}/examples/electron/*"
      }
```

你可以删除整个块，替换为：

```json
      "webRoot": "${workspaceFolder}/examples/electron"
```

### v1.17.0

#### ES2017

- Theia 更新到 ES2017
  - es5 的 VS Code 扩展与 Theia 插件仍受支持
  - 如果你需要 es5 代码库，应可以用 webpack 转译回 es5
  - 以下代码可转译回 es2015 代码库：

    ```
    config.module.rules.push({
        test: /\.js$/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: [['@babel/preset-env', { targets: { chrome: '58', ie: '11' } }]],
            }
        }
    });
    ```

  - 将 targets 替换为你的用例所需的值
  - 确保使用 `inversify@5.1.1`。Theia 要求 `inversify@^5.0.1`，即 `5.1.1` 兼容，
    但你的锁文件可能引用了更旧的版本。

### v1.16.0

[Release](https://github.com/eclipse-theia/theia/releases/tag/v1.16.0)

- 无。

### v1.15.0

[Release](https://github.com/eclipse-theia/theia/releases/tag/v1.15.0)

#### Keytar

- [`keytar`](https://github.com/atom/node-keytar) 被添加为 secrets API 的依赖。它在你的特定发行版上可能需要 `libsecret` 才能工作：
  - Debian/Ubuntu：`sudo apt-get install libsecret-1-dev`
  - Red Hat 系：`sudo yum install libsecret-devel`
  - Arch Linux：`sudo pacman -S libsecret`
  - Alpine：`apk add libsecret-dev`
- 在较旧的发行版上，`keytar` 可能需要 `yarn resolution` 才能工作（修复于 `1.16.0` 通过降级依赖版本加入）：

  ```json
  "resolutions": {
    "**/keytar": "7.6.0",
  }
  ```

- `keytar` 使用 [`prebuild-install`](https://github.com/prebuild/prebuild-install) 下载预构建二进制。如果你遇到系统中缺少其最初构建时的某些共享库的问题，可以在执行 `yarn` 前设置环境变量，让 `prebuild-install` 在本地构建本地扩展：

  ```sh
  # 或者：
  export npm_config_build_from_source=true
  yarn
  # 或：
  npm_config_build_from_source=true yarn
  ```

#### Webpack

- webpack 版本从 4 升级到 5，鉴于应用的特定配置，可能需要额外的 shim 才能正常工作。
- 如果执行应用 `production` 构建时因一个有问题的 `webpack-sources` 依赖而出错，`webpack` 依赖可能需要更新。有效版本范围为 `^5.36.2 <5.47.0`。如有必要，可以用 `yarn resolution` 修复：

  ```json
  "resolutions": {
    "**/webpack": "5.46.0",
  }
  ```
