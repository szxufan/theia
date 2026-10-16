<br/>
<div id="theia-logo" align="center">
    <br />
    <img src="https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia-logo-gray.svg?sanitize=true" alt="Theia Logo" width="300"/>
    <h3>云与桌面 IDE 框架</h3>
</div>

<div id="badges" align="center">

  [![欢迎 PR](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-curved)](https://github.com/eclipse-theia/theia/labels/help%20wanted)
  [![构建状态](https://github.com/eclipse-theia/theia/actions/workflows/ci-cd.yml/badge.svg?branch=master)](https://github.com/eclipse-theia/theia/actions/workflows/ci-cd.yml?query=branch%3Amaster)
  [![发布 VS Code 内置扩展](https://github.com/eclipse-theia/vscode-builtin-extensions/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/eclipse-theia/vscode-builtin-extensions/actions/workflows/build.yml?query=branch%3Amaster)
  [![开放问题](https://img.shields.io/badge/Open-questions-blue.svg?style=flat-curved)](https://github.com/eclipse-theia/theia/discussions/categories/q-a)
  [![开放缺陷](https://img.shields.io/badge/Open-bugs-red.svg?style=flat-curved)](https://github.com/eclipse-theia/theia/labels/bug)

Eclipse Theia 是一个可扩展的框架，用于使用最先进的 Web 技术开发功能完备的多语言云与桌面 IDE 及工具。

</div>

- [网站](#网站)
- [代码仓库](#代码仓库)
- [发布版本](#发布版本)
- [项目范围](#项目范围)
- [路线图](#路线图)
- [快速上手](#快速上手)
- [参与贡献](#参与贡献)
- [反馈](#反馈)
- [文档](#文档)
- [许可证](#许可证)
- [商标](#商标)

<div style='margin:0 auto;width:60%;'>

![Theia](https://raw.githubusercontent.com/eclipse-theia/theia/master/doc/images/theia-screenshot.png)

</div>

## 网站

[访问 Eclipse Theia 网站](http://www.theia-ide.org)了解更多信息以及 [Theia 文档](http://www.theia-ide.org/docs)。

## 代码仓库

这是 Eclipse Theia 项目的主仓库，包含 Theia 平台的源代码。请在本仓库中发起关于 Theia 的通用讨论、缺陷报告与功能请求。Theia 项目还包括其他仓库，例如[构建 Theia IDE 的制品仓库](https://github.com/eclipse-theia/theia-blueprint)和 [Theia 网站](https://github.com/eclipse-theia/theia-website)。另请参阅 [Theia 项目所有仓库总览](https://github.com/eclipse-theia)。

## 发布版本

- [所有可用版本](https://github.com/eclipse-theia/theia/releases)均发布在 GitHub 上，并附有变更日志。
- Theia 网站上链接了[详细的发布公告](https://theia-ide.org/resources/)。
- Theia 网站上列出了[社区发布版本](https://theia-ide.org/releases/)。
- 更多信息请[访问发布网站](https://theia-ide.org/releases/)。

## 项目范围

- 支持构建基于浏览器的和桌面端的 IDE 及工具
- 为采用者提供高度灵活的架构
- 支持 VS Code 扩展协议
- 在厂商中立的开源治理下开发

[更多项目目标详情](https://theia-ide.org/docs/project_goals/)请见 Theia 网站。

## 路线图

请参阅[我们的路线图](https://github.com/eclipse-theia/theia/wiki/Eclipse-Theia-Roadmap)，了解当前项目目标与即将发布的版本概览。

## 快速上手

这里提供了采用 Theia 的常见场景指南与示例：

- [了解如何上手](https://theia-ide.org/#gettingstarted)——Theia 网站
- [开发 Theia 应用——你自己的 IDE/工具](https://theia-ide.org/docs/composing_applications/)
- [了解 Theia 的扩展机制](https://theia-ide.org/docs/extensions/)
- [开发 VS Code 风格的扩展](https://theia-ide.org/docs/authoring_vscode_extensions/)
- [开发 Theia 扩展](https://theia-ide.org/docs/authoring_extensions/)
- [在 Theia 中测试 VS Code 扩展](https://github.com/eclipse-theia/theia/wiki/Testing-VS-Code-extensions)
- [使用 Electron 打包桌面版 Theia 应用](https://theia-ide.org/docs/blueprint_documentation/)

## 参与贡献

阅读以下内容，了解如何参与改进 Theia：

- Fork 本仓库并[从源码运行示例](doc/Developing.md#quick-start)
- 熟悉[开发工作流](doc/Developing.md)、[编码规范](doc/coding-guidelines.md)、[行为准则](CODE_OF_CONDUCT.md)，并[签署 Eclipse 贡献者协议](CONTRIBUTING.md#eclipse-contributor-agreement)
- 找一个 issue 来处理并提交 pull request
  - 第一次为开源做贡献？挑选一个[新手友好 issue](https://github.com/eclipse-theia/theia/labels/good%20first%20issue)，熟悉 GitHub 贡献流程。
  - 第一次为 Theia 做贡献？挑选一个[初学者友好 issue](https://github.com/eclipse-theia/theia/labels/beginners)，熟悉代码库与我们的贡献流程。
  - 想成为 Committer？解决一个能证明你理解 Theia 目标与架构的 issue。[这里](https://github.com/eclipse-theia/theia/labels/help%20wanted)是个不错的起点。此外，请查看我们的[路线图](https://github.com/eclipse-theia/theia/wiki/Eclipse-Theia-Roadmap)，让你的贡献与当前项目目标保持一致。
- 找不到合适的 issue？可以寻找缺陷、错别字和缺失的功能。

## 反馈

阅读以下内容，了解如何与 Theia 社区互动：

- 在 [GitHub](https://github.com/eclipse-theia/theia/discussions) 上参与讨论。
- 通过 [GitHub issues](https://github.com/eclipse-theia/theia/issues/new/choose) 提问、请求新功能或报告缺陷。
- 通过 👍 表情为现有 GitHub issue 投票。我们会定期查看有投票的 issue！
- 为仓库点亮 Star 以示支持。
- 在 [X](https://x.com/theia_ide) 上关注 Theia。
- 加入[每周开发者会议](https://github.com/eclipse-theia/theia/wiki/Dev-Meetings)

## 文档

- [API 文档](https://eclipse-theia.github.io/theia/docs/next/index.html)
- [通用文档](https://theia-ide.org/docs/)
- [VS Code API 兼容性报告](https://eclipse-theia.github.io/vscode-theia-comparator/status.html)
- 实用链接：
  - [开发指南](doc/Developing.md)
  - [测试](doc/Testing.md)
  - [迁移指南](doc/Migration.md)
  - [API 集成测试](doc/api-testing.md)
  - [编码规范](doc/coding-guidelines.md)
  - [代码组织](doc/code-organization.md)
  - [插件与 VSCode API](doc/Plugin-API.md)

## SBOM

为了增强供应链安全并让用户清晰了解项目组件，Eclipse Theia 现在为每个发布版本生成软件物料清单（SBOM）。这些清单会发布到 Eclipse Foundation SBOM 注册表中，访问说明与使用详情请参阅[文档](https://eclipse-csi.github.io/security-handbook/sbom/registry.html)。

## 许可证

- [Eclipse 公共许可证 2.0（Eclipse Public License 2.0）](LICENSE-EPL)
- [一 (Secondary) GNU 通用公共许可证第 2 版（附带 GNU Classpath 例外）](LICENSE-GPL-2.0-ONLY-CLASSPATH-EXCEPTION)

## 商标

"Theia" 是 **Eclipse Foundation 的商标**。[了解更多](https://www.eclipse.org/theia)
