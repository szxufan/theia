# plugin-esm

一个以 ECMAScript 模块（ESM）形式提供的示例 VS Code 扩展。

其 `package.json` 声明了 `"type": "module"`，因此 Node 将 `extension.js`
视为 ESM。入口点使用 `import * as vscode from 'vscode'` 和
`export function activate(...)`，而不是 CommonJS 的 `require` / `exports`。

这反映了近期的 VS Code 内置扩展（例如 `vscode.github`）的打包方式。
加载它可以检验 Theia 插件宿主的 ESM 支持。
