# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中处理代码时提供指导。

## 开发命令

**核心命令：**（所有包管理与脚本一律使用 `npm`，而非 `yarn`）
- `npm install` - 安装依赖（会运行 `theia-patch`、`compute-references` 和 lerna `afterInstall` 钩子）
- `npm run build:browser` - 构建所有包并打包 Browser 示例应用（开发期间首选）
- `npm run compile` - 仅编译 TypeScript（使用带项目引用的 `tsc --build`）
- `npm run lint` - 对所有包运行 ESLint
- `npm run lint:fix` - 运行 ESLint 并自动修复
- `npm run test` - 运行所有测试

**重要：** `npm run compile` 只编译 TypeScript。在 UI 测试之前，你还必须运行 `npm run build:browser` 来打包前端——否则正在运行的浏览器应用不会包含你的最新改动。打包通过 `theia build`（位于 `@theia/cli` / `application-manager`）执行，且始终使用 **esbuild**。每个应用的配置文件（`esbuild.mjs` 及其导入的 `gen-esbuild.*.mjs`）由 `dev-packages/application-manager` 中的 `BundlerGenerator` 生成。

**应用命令：**
- `npm run start:browser` - 在 localhost:3000 启动浏览器示例
- `npm run start:electron` - 启动 Electron 应用
- `npm run watch` - 开发监听模式（同时监听 browser + electron）

**针对特定包：**
- `npx lerna run compile --scope @theia/package-name` - 构建特定包
- `npx lerna run test --scope @theia/package-name` - 测试特定包
- `npx lerna run watch --scope @theia/package-name --include-filtered-dependencies --parallel` - 监听某个包及其依赖

**运行单个测试文件（编译后）：**
- `npx mocha ./packages/core/lib/browser/some-file.spec.js`

**测试基础设施：** 测试使用 Mocha + NYC (Istanbul) 统计覆盖率。配置位于 `configs/mocharc.yml` 和 `configs/nyc.json`。每个包的 `npm test` 通过 `dev-packages/private-ext-scripts` 中定义的 `theiaext test` 包装器运行，它执行 `nyc mocha --config ../../configs/mocharc.yml "./lib/**/*.*spec.js"`。

## 架构

**Monorepo 结构：**
- 由 Lerna 管理的 monorepo
- `/packages/` - 运行时包（core + 扩展）
- `/dev-packages/` - 开发工具（application-manager、cli、eslint-plugin、ext-scripts）
- `/examples/` - 示例应用（browser、electron、browser-only、playwright）
- `/configs/` - 共享配置文件（tsconfig、eslint、mocha、nyc）

**平台相关的代码组织（每个包内）：**
- `src/common/` - 共享的 JavaScript API（到处可用）
- `src/browser/` - 浏览器/DOM API（前端使用 InversifyJS DI 容器）
- `src/node/` - Node.js API（后端使用 InversifyJS DI 容器）
- `src/electron-browser/` - Electron 渲染进程
- `src/electron-main/` - Electron 主进程

**扩展入口点**在每个包的 `package.json` 中的 `theiaExtensions` 下声明：

```json
"theiaExtensions": [{
  "frontend": "lib/browser/editor-frontend-module",
  "backend": "lib/node/editor-backend-module"
}]
```

**扩展系统：**
- 通过 InversifyJS 进行依赖注入（优先使用属性注入而非构造函数注入）
- 使用贡献点（Contribution Points）模式实现可扩展性（CommandContribution、MenuContribution、KeybindingContribution、FrontendApplicationContribution 等）
- 三种扩展类型：Theia 扩展（构建期）、VS Code 扩展（运行时）、Theia 插件（运行时）

## 关键模式

更多信息另请参阅：
- @doc/coding-guidelines.md
- @doc/Testing.md
- @doc/Plugin-API.md（VS Code 扩展插件 API）
- @.prompts/project-info.prompttemplate（贡献、部件、命令、偏好、插件 API、样式的实用模式）

按需阅读（不会自动加载）——当任务需要时再查阅：
- [doc/code-organization.md](doc/code-organization.md) — 平台导入规则；添加跨平台导入时查阅。
- [doc/vscode-usage.md](doc/vscode-usage.md) — 从 Theia 包中暴露 Monaco/VS Code 内部实现的规则。
- [doc/api-management.md](doc/api-management.md) — API 稳定性生命周期。
- [doc/api-testing.md](doc/api-testing.md) — API 集成测试（区别于 `Testing.md` 中的单元测试）。
- [doc/pull-requests.md](doc/pull-requests.md) — PR/审查清单。
- [doc/Developing.md](doc/Developing.md) — 完整的构建/环境搭建细节。
- [doc/Migration.md](doc/Migration.md) — 面向采用者的破坏性变更说明。
- [doc/runtime-policy.md](doc/runtime-policy.md) / [doc/Publishing.md](doc/Publishing.md) — Node/Electron 支持策略与发布流程。
- [doc/lockfile-maintenance.md](doc/lockfile-maintenance.md) — `package-lock.json` 中 `allowScripts` 的维护与平台相关条目；提交锁文件改动前查阅。

**代码风格：**
- 4 空格缩进，单引号，用 `undefined` 而非 `null`
- 类型/枚举用 PascalCase，函数/变量用 camelCase
- 优先使用箭头函数，必须显式声明返回类型
- 属性注入优先于构造函数注入，初始化用 `@postConstruct()`

**文件命名：**
- 文件名用 kebab-case（如 `document-provider.ts`）
- 文件名与主要导出类型一致
- 平台目录遵循严格的依赖规则（browser 不能导入 node 等）

**架构模式：**
- 插件 API 采用 Main-Ext 模式（浏览器端 Main ↔ 插件宿主 Ext，通过 RPC 通信）
- 服务实现为带 DI 的类，避免导出函数（函数无法被重写）
- 使用 `ContributionProvider` 而非 `@multiInject` 来收集多个实现
- 在顶层模块中绑定贡献提供者时使用 `bindRootContributionProvider`（而非 `bindContributionProvider`）。`bindContributionProvider` 会保留最先解析它的那个子容器的引用，导致内存泄漏。仅当贡献有意限定在子容器作用域时（例如通过 `ConnectionContainerModule` 创建的连接级容器）才使用 `bindContributionProvider`。
- 跨平台文件路径使用 URI 字符串，绝不使用原始路径
- 用户可见文案用 `nls.localize()` 或 `nls.localizeByDefault()` 本地化

**测试：**
- 单元测试：`*.spec.ts`
- UI 测试：`*.ui-spec.ts`
- 慢速测试：`*.slow-spec.ts`
- 测试资源放在 `test-resources/` 目录

## 技术要求

- Node.js ≥24（依据 `package.json` 的 `engines`）
- TypeScript ~5.9.3，启用严格设置（target ES2023，module CommonJS）
- UI 组件使用 React 19，以自动 JSX 运行时编译（`jsx: react-jsx`、`jsxImportSource: @theia/core/shared/react`），因此 JSX 文件仅在使用 `React.*` 类型或 API 时才需要导入 React。`@theia/core` 无法导入其自身的再导出，所以 `packages/core/tsconfig.json` 特意将 `jsxImportSource` 覆盖为 `react`（同一模块）——不要把它"对齐"回基础配置
- 代码编辑使用 Monaco Editor

**关键技术：**
- Express.js 作为后端 HTTP 服务器
- InversifyJS 用于依赖注入
- Lerna 用于 monorepo 管理
- esbuild 用于应用打包（webpack 支持已在 1.75.0 移除）
- Lumino 2.x 用于部件系统（标签页、面板、停靠布局）

**关键配置文件：**
- `configs/base.tsconfig.json` - TypeScript 基础配置（所有包继承它）
- `configs/base.eslintrc.json` - ESLint 解析器/基础规则
- `configs/build.eslintrc.json` - ESLint 构建规则（各包继承它）
- `configs/mocharc.yml` - Mocha 测试运行器配置
- `configs/nyc.json` - 测试覆盖率配置

## Commit、Issue 与 Pull Request

- 使用 Conventional Commits 风格的主题，与既有历史保持一致：`type(scope): summary`（例如 `fix(plugin-ext): ...`、`feat(ai-registry): ...`、`chore(deps): ...`）。
- 打开 issue 或 PR 时使用 `.github/` 中的模板。
- **变更日志：** 仅破坏性变更需要手动写 `CHANGELOG.md` 条目；一个 PR 是否为破坏性变更在其描述的 `Breaking changes` 一节中声明。非破坏性变更不需要条目，它们会在发布时统一收集，因此不要添加条目，也绝不要在审查时把缺少条目当作问题报告。每个 PR 单独写条目会导致 `CHANGELOG.md` 在众多 PR 间频繁冲突。
- commit 消息、PR 描述、issue 和评论应**简明扼要**——不要凑字数、不要营销话术、不要复述 diff。
- **安全：** 绝不通过 GitHub issue 或 PR 披露漏洞——按照 `SECURITY.md` 报告。此类 issue 一经发现即被删除。
