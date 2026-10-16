# 测试

## 运行测试

运行之前，请确保先用 `compile` 或 `watch` 脚本编译测试。

在 theia 上运行测试请执行：

`npm run test`

这会运行所有在 CI 中启用的测试。

如果你想运行某个特定 Theia 扩展的全部测试，请从根目录执行以下命令：

`npx lerna run test --scope @theia/extension-name`

如果你想为测试启用 watch 模式，请在目标 Theia 扩展的 `package.json` 中添加如下 npm script：

```json
  "test:watch": "theiaext test:watch"
```

编辑 `package.json` 之后，可以用以下命令以 watch 模式运行测试：

`npx lerna run test:watch --scope @theia/extension-name`

## 测试目录结构

测试目录结构如下：

- `src/node/foo.ts`：待测试的代码。
- `src/node/foo.spec.ts`：foo.ts 的单元测试。
- `src/node/test/test-helper.ts`：任何 mock、fixture 或工具性测试代码
 放在这里。
- `src/node/foo.slow-spec.ts`：任何运行缓慢的测试（如集成
 测试）都应如此命名，以便被排除。
- `src/browser/foo.ui-spec.ts`：UI 测试。
- `test-resources`：测试所需的任何资源，如配置
 文件或脚本。
- `test-resources/ui`：UI 测试资源。
- `test-resources/slow`：慢速测试资源。

## 发布

### 已发布的测试文件

命名为 `foo.spec.ts` 的单元测试会被发布，因为它们同时也
作为文档之用。

### 不发布

- `*ui-spec.ts`
- `*slow-spec.ts`
- `test-resources`
