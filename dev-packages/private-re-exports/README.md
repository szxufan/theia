# `@theia/re-export`

用于重导出依赖的工具包。

当你使用并暴露某个依赖的一些 API，并且希望
你的依赖方获得与你完全相同的符号时，这会很有用。

## `package.json`

你可以通过 `package.json` 文件中的 `theiaReExports` 键配置
`theia-re-export` CLI 如何生成重导出：

```json
{
    "theiaReExports": {
        "destination": {
            "export *": [
                "packages that export via *"
            ],
            "export =": [
                "packages that export via ="
            ],
            "copy": "other-package#destination"
        }
    }
}
```

### `transitive`

如果你想从一个同样重导出其自身依赖的包中重导出包。我们在 `@theia/core` 中使用这种方式，
以简化某些可选的 Electron 专属依赖的消费。

### `export *`

以 `export const x = ...` 形式导出其符号的包。

### `export =`

以命名空间形式（如 `export = ...`）导出其符号的包。
