<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - MONACO 扩展</h2>

<hr />

</div>

## 描述

`@theia/monaco` 扩展负责集成 [monaco-editor](https://microsoft.github.io/monaco-editor/)。\
包括：

- 全功能代码编辑器
- 差异编辑器（diff editor）
- 代码片段
- textmate 语法（主题注册表、服务）

## Monaco 版本升级

本包旨在充当 `@theia/monaco-editor-core` 包（本项目对 VSCode 团队发布的 `monaco-editor-core` 包的打包封装）与应用程序其余部分之间的接口。当我们升级到新版本的 `monaco-editor-core` 时，需要对本包进行格外彻底的检查。为便于完成该过程，此处概述了执行 Monaco 升级的步骤。

### 准备 VSCode 一侧

1. 克隆 VSCode 仓库，并确保配置了以下远程仓库：

- <https://github.com/microsoft/vscode.git> - VSCode 官方仓库。
- <https://github.com/eclipsesource/ms-vscode.git> - 用于构建 `@theia/monaco-editor-core` 的 fork。

2. 在 VSCode 官方仓库中找到最新的发布标签，并在 fork 中找到最新的升级分支。

 > 撰写本文时，最新的发布标签是 `1.108.2`，升级分支是 `monaco_uplift_1.108.2`（<https://github.com/eclipsesource/ms-vscode/tree/monaco_uplift_1.108.2>）

3. 检出该发布标签，cherry pick 升级分支的最新提交，并解决所有冲突。

 > 在解决冲突并对 VSCode 仓库进行修改时，请确保升级分支上最终只有一个提交，以便下一位协作者更容易进行 rebase。

4. 尝试构建。目前这意味着运行 `npm install` 和 `npm run gulp editor-distro`。
5. 修复出现的所有构建错误。
6. 修改 `build/monaco/package.json` 中的版本号

#### 当前状态

- build/gulpfile.editor.js：对 treeshaking 和输出目标的各种修改（shakeLevel 0 —— 仅文件级别，不支持类成员级别的摇树优化）。
- build/lib/standalone.js/ts：对 sourcemap 和声明输出的修改（`declaration: true`、`sourceMap: true`、`moduleResolution: Classic`）。
- src/vs/base/browser/dompurify/dompurify.js：改为 CommonJS 而非 ESM 的修改（添加了 `module.exports`）。
- src/vs/base/common/marked/marked.js：改为 CommonJS 而非 ESM 的修改（添加了 `module.exports`）。
- src/vs/base/common/platform.ts：通过 `$globalThis.addEventListener` 检查为非浏览器环境对 `setTimeout0` 加以保护。
- build/monaco/esm.core.js：在 `editor.all.ts` 中添加了 `embeddedDiffEditorWidget` 导入。

### 准备 Theia 一侧

初步测试时，将依赖指向本地的 VSCode 会更容易。

1. 按照[上述](#准备-vscode-一侧)步骤构建 `monaco-editor-core`。
2. 找到各 `package.json` 中所有对 `@theia/monaco-editor-core` 的引用，并将其版本替换为 `"file:/<your-path-to>/vscode/out-monaco-editor-core"`。

> 使用 `file:` 意味着如果你随后在 VSCode 一侧做了修改，只需重新构建 VSCode，再重新构建 Theia 即可看到效果。

3. 删除 `node_modules`，运行 `npm install` 并构建 Theia。
4. 修复所有构建错误。
5. 取消注释 `examples/api-samples/src/browser/monaco-editor-preferences/monaco-editor-preference-extractor.ts` 中的 `bindMonacoPreferenceExtractor` 函数，并运行其中的命令。根据需要修复 `EditorGeneratedPreferenceSchema`，并视情况在 `MonacoFrontendApplicationContribution` 中增加或移除校验。
6. 查找那些标明强制类型或其他代码异味的注释——它们会阻止在本应抛出构建错误的地方抛出错误——并确认相关断言仍然成立。

> 如果你添加了这些内容，请用 @monaco-uplift 标记，以便日后更容易找到。更好的做法是：如果能移除它们，就移除！通常原因是混用了私有 API 和公共 API 的导入，公共 API 往往无法满足私有声明。

7. 全面测试应用程序——确保一切仍正常工作。

> 可能还需要更新我们使用的各个 `vscode` 相关依赖，以匹配 VSCode 的当前状态。成功采用新的 Monaco 版本未必需要升级所有（或任何一个）依赖，但如果某些行为莫名异常，检查依赖是一个合理的切入点。请检查：
>
> - `vscode-languageserver-protocol`
> - `vscode-oniguruma`
> - `vscode-textmate`
> - `vscode-uri`

### 发布测试版本

当你确认一切正常后，需要发布新的 `@theia/monaco-editor-core` 以供测试。
可以在 VSCode fork 的 `out-monaco-editor-core/` 目录中使用 `npm pack` 创建 tarball，然后发布它。
包发布后，将你的各 `package.json` 指向该测试版本，确认一切仍正常工作，然后创建 PR。

## 更多信息

- [`@theia/monaco` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_monaco.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>

# Theia - Monaco 扩展

详细文档请参见[这里](https://www.theia-ide.org/doc/index.html)。

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)
