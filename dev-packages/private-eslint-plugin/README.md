<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - ESLINT PLUGIN</h2>

<hr />

</div>

## 描述

`@theia/eslint-plugin` 贡献对 Eclipse Theia 开发有用的规则。
该插件通过静态分析帮助在开发过程中发现问题，包括代码质量、潜在问题和代码异味。

## 规则

### `annotation-check`

Inversify >=6.1 要求为可注入类的所有构造函数参数添加注解，否则会抛出运行时错误。
该规则检查可注入类的所有构造函数参数是否都用 `@inject`、`@unmanaged` 或 `@multiInject` 进行了注解。

### `localization-check`

该规则防止以下与本地化相关的问题：

- 使用错误的默认值调用 `nls.localizeByDefault` 函数。
- 不必要地调用 `nls.localize`，而它本可以被 `nls.localizeByDefault` 替代。

### `named-logger-check`

该规则强制执行[日志指南](https://github.com/eclipse-theia/theia/tree/master/doc/coding-guidelines.md#logging)：

- `@injectable()` 类必须通过注入的 `ILogger` 记录日志，而不是 `console.log`、`console.info`、`console.warn`、`console.error`、`console.debug` 或 `console.trace`。没有 `ILogger` 对应方法的控制台方法（例如 `console.time` 或 `console.group`）是允许的。
- 注入的 `ILogger` 必须带有 `@named` 装饰器，其值遵循 `[optional-purpose]package-name:class-name#optional-suffix` 格式。包片段会对照最近的 `package.json` 的 `name`（不含 npm 作用域）进行检查，类片段对照外围类进行检查。非字符串字面量的 `@named` 值不做检查。

没有 `ILogger` 绑定的代码通过 ESLint 本身而非规则本身豁免：

- `electron-main` 运行时在 `configs/errors.eslintrc.json` 的 `overrides` 中被关闭，因为 Electron 主容器不绑定 `ILogger`。
- 个别文件（例如控制台日志记录器和日志配置解析器）带有内联的 `eslint-disable @theia/named-logger-check` 及原因说明。

### `no-src-import`

该规则防止使用 `/src/` 而非 `/lib/` 进行导入，因为这会导致构建失败。
该规则帮助开发者更容易地识别由错误导入导致的构建错误的原因。

### `preload-localization-check`

preload 阶段在本地化数据被加载之前运行，因此 NLS API 在该阶段产出的每个字符串都会以英文捕获，并在会话的其余时间保持未翻译。
该规则报告 preload 阶段中在加载期间（直接或通过其导入的模块）读取本地化字符串的模块。
"加载期间"是指模块的顶层，包括命名空间体、装饰器和静态字段，但不包括函数体——函数体只在其被调用时才运行。

preload 阶段的模块是 `theiaExtensions` 中声明的 `preload`、`frontendPreload` 和 `frontendOnlyPreload` 入口点，以及生成的前端 `index.js` 在运行 `Preloader` 之前所需（require）的模块。
后者列在 [`util/preload-phase-modules.json`](./util/preload-phase-modules.json) 中，这是添加 `@theia/application-manager` 的 `FrontendGenerator` 会在结束该阶段的 `await preload(container)` 之前开始 require 的模块的唯一地方。
与其让该列表靠人工保持同步，`util/preload-phase-modules.spec.js` 会为每个目标运行该生成器，获取它在该调用之前实际 require 的模块，并在两者出现偏差时失败，同时指出需要添加或移除的模块。
`additionalEntryPoints` 选项为两者添加更多入口点。

问题会报告在入口点上，报告在引入违规模块的那个导入上，因为那正是可以修复它的地方：从声明所需符号的模块导入它们，而不是通过诸如 `@theia/core/lib/common` 之类的 barrel 文件。
只分析入口点，因此在导入图深处添加的加载期 NLS 调用会在入口点被 lint 时报告，而带 `--cache` 的运行会跳过它，直到入口点本身发生变化。
CI 在不带缓存的情况下进行 lint，因此始终会报告它；在本地，`npx lerna run lint -- --no-cache` 也可以做到，在向 preload 阶段的模块推送变更之前值得运行它——因为每次这样的变更都会重新引入偏差。

TypeScript 编译器会擦除的导入（即仅类型导入，以及其绑定从未被作为值使用的具名导入）在运行时不引入任何内容，因此不会被跟踪。
由 `emitDecoratorMetadata`（整个仓库都用它编译）发射到被装饰声明元数据中的类型会被视为值：被装饰属性的类型，以及被装饰成员和被装饰类构造函数的参数类型和返回类型。
此类位置上擦除为 `Object` 的类型（例如某个接口）会被作为 `Object` 发射，其导入最终还是会被擦除——只有编译器能判断这一点，因此这些导入也会被跟踪。

#### `runtime-import-check`

该规则防止从为不兼容运行时而设的文件夹导入。
该检查强制执行框架的[代码组织指南](https://github.com/eclipse-theia/theia/wiki/Code-Organization)，防止可能在下游引起不可预见问题的无效导入。

#### `shared-dependencies`

该规则防止以下情况：

- 防止隐式使用 `@theia/core` 的共享依赖。
- 防止扩展依赖某个共享依赖而不从 `@theia/core` 重用它。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
