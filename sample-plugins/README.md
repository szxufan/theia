# Theia 示例插件

一组由 Theia 用来检验插件运行时的极简 VS Code 扩展。每个插件位于 `sample-namespace/` 下。大多数插件注册一个简单的 `Hello from <plugin-name>` 命令；其余的演示特定的运行时变体（仅浏览器、ESM、无头）或特定的 API，并在它们各自的 README 中说明如何验证。

## 在 Theia 示例应用程序中测试示例插件

将插件文件夹复制到已部署的 `plugins` 目录中。这些插件是普通的、未打包的 VS Code 扩展，因此不需要打包步骤。

1. 可选：通过 `npm run download:plugins` 下载已打包的 VS Code 内置插件。
2. 将插件复制到已部署的 `plugins` 目录：

    ```sh
    cp -r sample-plugins/sample-namespace/<plugin-name> plugins/
    ```

3. 启动示例应用，例如：

    ```sh
    npm run start:browser
    ```

4. 打开命令面板并运行 `Hello from <plugin-name>`，或执行插件自身 README 中的步骤。

## 将示例插件打包为 `.vsix`

只有在需要检验 `Install from VSIX...` 流程，或要把示例插件交给本仓库之外的人时才需要。其他情况请优先按上述方式复制文件夹。

`build` 脚本会按需通过 `npx` 获取 `vsce`，因此首次运行需要网络访问。它缓存在 `~/.npm/_npx` 下并在此后被复用，不会全局安装，也不会加入本仓库。

1. 在插件文件夹内：

    ```sh
    npm run build
    ```

    这会运行 `npx @vscode/vsce@3 package --no-dependencies`，并在源文件旁边生成一个 `<plugin-name>-<version>.vsix`。

2. 启动 Theia，例如 `npm run start:browser`。
3. 打开扩展（Extensions）视图。
4. 使用 `...` 菜单并选择 `Install from VSIX...`，然后选择构建出的 `.vsix`。
5. 打开命令面板并运行 `Hello from <plugin-name>` 进行验证。
