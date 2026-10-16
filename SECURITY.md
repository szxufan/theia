# 安全策略

本 Eclipse Foundation 项目遵循 [Eclipse Foundation 漏洞报告政策](https://www.eclipse.org/security/policy/)。

## 如何报告漏洞

如果你认为在本仓库中发现了漏洞，请通过协调披露方式向我们报告。

**请勿通过公开的 issue、讨论或 pull request 报告安全漏洞。**

请改为在 Eclipse Foundation 漏洞报告跟踪器中创建一个[机密 issue](https://gitlab.eclipse.org/security/vulnerability-reports/-/issues/new?issuable_template=new_vulnerability)。

你可以在 [Eclipse Foundation 安全页面](https://www.eclipse.org/security/)上找到有关报告与披露的更多信息。

请尽可能多地提供以下列出的信息，以帮助我们更好地理解并解决问题：

* 问题类型（例如缓冲区溢出、SQL 注入或跨站脚本）
* 受影响的版本
* 问题的影响，包括攻击者可能如何利用它
* 复现问题的分步说明
* 受影响源代码的位置（tag/分支/commit 或直接 URL）
* 与问题表现相关的源文件完整路径
* 复现问题所需的配置
* 与此问题相关的日志文件（如果可能）
* 概念验证或漏洞利用代码（如果可能）

这些信息将帮助我们更快地对你的报告进行分类处理。

## 受支持的版本

Eclipse Theia 按月度节奏发布。安全修复会在下一个即将发布的版本中处理，不会向后移植到之前已发布的版本。
