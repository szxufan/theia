# plugin-esm-mjs

一个通过 `.mjs` 文件扩展名以 ECMAScript 模块形式交付的示例 VS Code 扩展。

与 `plugin-esm` 不同，本示例**没有**在
`package.json` 中设置 `"type": "module"`。`extension.mjs` 上的 `.mjs` 扩展名
就足以告诉 Node 将该文件作为 ESM 加载。Theia 通过检查入口
点的扩展名来检测这一点，并分发到 `import()` 而非 `require()`。
