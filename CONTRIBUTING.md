# 为 Eclipse Theia 做贡献

Theia 是一个采用模块化架构的年轻开源项目。其目标之一是确保我们能够通过扩展来定制和增强任何 Theia 应用。因此，虽然 Theia 主仓库包含一些 IDE 类应用的通用功能（如文件系统或导航视图），但大多数功能并不一定要放进核心仓库，而可以单独开发。

## 我该如何贡献？

下面介绍几种典型的贡献方式。

### 提问

在 Theia GitHub 仓库中打开一个 issue 来提问是完全可以的。问题被回答后我们会将其关闭，并打上 "question" 标签。提问前请先在那里或 [Stack Overflow](https://stackoverflow.com) 上检查该问题是否已被问过。

### 报告缺陷

如果你发现了缺陷，应首先检查它是否已被提交、甚至可能已被修复。如果你找到了一个尚未解决的现有 issue，请补充你的情况。如果找不到现有的缺陷报告，请提交一份新的。无论哪种情况，请提供所有你能分享的信息，以便帮助复现和解决问题。

### 报告功能请求

你可能希望看到某个功能，或者有了一个想法。你可以提交一个请求，我们可以进行讨论。如果这样的功能请求已存在，请添加评论或其他形式的反馈，表明你也感兴趣。同样在这种情况下，任何具体的用例场景都有助于理解其背后的动机，我们不胜感激。

### Pull Request

在你开始为希望合并并作为 Theia 一部分长期维护的内容投入大量时间之前，你应当先通过一个 issue 与团队沟通。只需选择你想处理的 issue，并告诉大家你愿意去做以及你打算如何着手。团队会很乐意为你提供指导和反馈。

我们遵循[这里](https://github.com/eclipse-theia/theia/blob/master/doc/pull-requests.md)描述的贡献与 PR 审查指南。

## 编码规范

我们遵循[这里](doc/coding-guidelines.md)描述的编码规范。

## Eclipse 贡献者协议

在你的贡献能被项目团队接受之前，贡献者必须以电子方式签署 Eclipse 贡献者协议（ECA）。

* <https://www.eclipse.org/legal/ECA.php>

非 Committer 提交的 commit 必须在页脚包含 Signed-off-by 字段，表明作者知晓其贡献提交给本项目的相关条款。非 Committer 还必须拥有 Eclipse Foundation 账户，并且已签署 Eclipse 贡献者协议（ECA）并存档。

更多信息请参阅 Eclipse Committer 手册：
<https://www.eclipse.org/projects/handbook/#resources-commit>

## 签署你的工作

签收（sign-off）是补丁说明末尾的一行简单文字。你的签名证明你编写了该补丁，或者你有权将其作为开源补丁传递下去。规则非常简单：如果你能证明以下内容（来自 [developercertificate.org](https://developercertificate.org/)）：

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
1 Letterman Drive
Suite D4700
San Francisco, CA, 94129

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

那么你只需在每个 git commit 消息中添加一行：

    Signed-off-by: Joe Smith <joe.smith@email.com>

请使用你的真实姓名（抱歉，不接受化名或匿名贡献）。

如果你设置了 `user.name` 和 `user.email` git 配置，就可以使用 `git commit -s` 自动签署 commit。
