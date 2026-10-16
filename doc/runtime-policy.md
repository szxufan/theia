# Node.js

## 版本支持策略

我们致力于支持 Node.js 当前的 _Active LTS_ 版本。

参见 <https://nodejs.org/en/about/releases/> 了解 Node.js 各版本的状态。

我们建议将环境配置为使用 Node.js _Active LTS_ 运行 Theia，但任何受支持的版本也应可用。否则请提交 issue：<https://github.com/eclipse-theia/theia/issues/new/choose>。

注意，你应使用的 Node.js 版本取决于你自己项目的依赖：Theia 之外的包可能有自己的要求，因此我们尝试支持一个合理的范围，让采用者能够满足此类约束。

## 更新流程

- 遵循 Node.js LTS 节奏，当新的 Node.js 版本成为 _Active LTS_ 时启动更新。
- 对最老的受支持 Node 版本使用 `@types/node`（向后兼容）。
- 更新 CI 矩阵以纳入要支持的新 Node.js 版本。
- 更新引用推荐 Node 版本的文档。
- 更新 CHANGELOG。

# Electron

## 版本支持策略

我们致力于使用 Electron 最新的 _Stable Release_。

参见 <https://www.electronjs.org/releases/stable> 查看最新的 Electron 稳定版本。

注意，从知识产权（IP）角度审清新的 Electron 版本需要大量工作，可能让我们稍有滞后。

采用者只需升级自己的 Theia 版本，即可从 Electron 版本升级中获益。

## 更新流程

- 每次发布 Theia 后，与 NPM 升级一起更新到 Electron 最新的 _Stable Release_（参见发布指南中的 [3.8 Electron 更新](Publishing.md#38-electron-更新)）。
- 检查新 Electron 版本是否存在潜在的 IP 问题。
- 更新框架依赖以面向新的 Electron 版本。
- 更新代码库以替换/使用新的 Electron API。
- 更新 CHANGELOG。

# VS Code 扩展支持

如果你计划支持 VS Code 扩展，建议确保 Node 和/或 Electron 与 VS Code 的 Node 运行时匹配，
后者取决于 VS Code 最终使用的 Electron 版本。

你应在 [VS Code 仓库](https://github.com/microsoft/vscode)中查找该信息。

VS Code 扩展旨在运行于 VS Code，开发者可能使用其扩展所运行运行时中的任何 API。所以如果他们预期运行在 Node 16 上，就可能使用 Node 16 的 API。把你的 Theia 应用运行在
Node 14 上则意味着某些插件功能可能因 Node 运行时缺少 API 而无法工作。
