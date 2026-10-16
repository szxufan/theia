# Eclipse Theia 发布指南

本指南详细介绍维护者发布 Eclipse Theia 的步骤，包括发布前准备、发布流程、发布后步骤以及故障排除。

## 目录

1. [发布前步骤](#1-发布前步骤)
   - [1.1 公布发布计划](#11-公布发布计划)
   - [1.2 检查发布准备工单](#12-检查发布准备工单)
   - [1.3 本地化](#13-本地化)
   - [1.4 准备发布分支](#14-准备发布分支)
   - [1.5 更新变更日志](#15-更新变更日志)
2. [发布流程](#2-发布流程)
   - [2.1 执行发布](#21-执行发布)
   - [2.2 社区发布](#22-社区发布)
3. [发布后步骤](#3-发布后步骤)
   - [3.1 Eclipse 发布](#31-eclipse-发布)
   - [3.2 公布发布完成](#32-公布发布完成)
   - [3.3 更新未来里程碑](#33-更新未来里程碑)
   - [3.4 合并网站 PR](#34-合并网站-pr)
   - [3.5 发布 GitHub Pages](#35-发布-github-pages)
   - [3.6 更新主要依赖](#36-更新主要依赖)
   - [3.7 NPM 升级](#37-npm-升级)
   - [3.8 Electron 更新](#38-electron-更新)
4. [故障排除](#4-故障排除)
   - [发布期间的失败](#41-发布期间的失败)

## 1. 发布前步骤
<!-- release: both -->

### 1.1 公布发布计划
<!-- release: both -->

#### 1.1.1 次版本发布 1.x.0
<!-- release: minor -->

- 在发布前两天向开发者和社区发出预告。

##### 1.1.1.1 GH Discussion
<!-- release: minor -->

- 在 GitHub Discussions 的 [Release Announcements 分类](https://github.com/eclipse-theia/theia/discussions/new?category=release-announcements)中发布公告。

    标题：

    ```md
    Eclipse Theia v{{version}}
    ```

    正文：

    ```md
    Hey everyone 👋,

    The Eclipse Theia v{{version}} release is scheduled for **{{releaseDate}}**.

    Please use the Endgame issue below to track what’s included.
    If you have any nearly-complete PRs that should to be part of the release, please mention it in the endgame issue before we start:

    - https://github.com/eclipse-theia/theia/issues/{{currentEndgameIssueNumber}}

    We'll post updates when the release begins and again once it’s finished.
    Please avoid merging pull requests until we confirm the release is complete.
    ```

  - 将讨论置顶到 Release Announcement 分类

- 参考[这个示例](https://github.com/eclipse-theia/theia/discussions/14547)。

##### 1.1.1.2 theia-dev 邮件列表
<!-- release: minor -->

- 同时向 [the `theia-dev` 邮件列表](mailto:theia-dev@eclipse.org)发送邮件（别忘了附上讨论链接）：

    主题：

    ```md
    Eclipse Theia version v{{version}}
    ```

    正文：

    ```md
    Hi everyone,

    The Eclipse Theia v{{version}} release is scheduled for {{releaseDate}}!
    You can follow the progress of the release here: https://github.com/eclipse-theia/theia/discussions/{{discussionNumber}}
    ```

#### 1.1.2 补丁版本发布 1.x.z
<!-- release: patch -->

- 在发布前几小时向开发者和社区发出预告。
- 使用该[发布讨论](#111-次版本发布-1x0)并发表评论宣布补丁发布：<https://github.com/eclipse-theia/theia/discussions/{{discussionNumber}}>

  ```md
  We are preparing the patch release Eclipse Theia v{{version}}

  Follow the endgame checklist here:
  - https://github.com/eclipse-theia/theia/issues/{{patchEndgameIssueNumber}}

  We'll post an update once the release is finished.
  ```

### 1.2. 检查发布准备工单
<!-- release: both -->

检查准备发布时需要处理的工单：

- 处理/解决位于以下位置的所有工单：<https://github.com/eclipse-theia/theia/labels/toDoWithRelease>
  - 例如新添加包在 npm 上的首次发布。

### 1.3 本地化
<!-- release: minor -->

- 在发布前执行 `nls` 更新（[示例](https://github.com/eclipse-theia/theia/pull/14373)）。
- 通过 GitHub Actions 触发自动翻译工作流（[工作流链接](https://github.com/eclipse-theia/theia/actions/workflows/translation.yml)）。
- 对机器人创建的分支执行 force-push 以正确触发 CI。
- PR 获批后，使用 `Squash and merge` 完成合并。
- 恢复分支 `bot/translation-update`。

### 1.4 准备发布分支
<!-- release: minor -->

- 检出包含最新改动的 `master`：

  ```bash
  git pull
  ```

- 确认最新改动已就位：

  ```bash
  git log
  ```

- 按 `release/major.minor.x` 模式创建分支（例如 `release/1.55.x`）。

  ```md
  release/{{majorMinor}}.x
  ```

### 1.5 更新变更日志
<!-- release: minor -->

为自上次发布以来的非破坏性变更添加条目。破坏性变更应由 PR 添加，而非在发布期间添加。

将变更日志改动以如下消息提交到发布分支：

```bash
docs: update changelog for {{version}}
```

格式：

- 版本与日期作为 H2 标题（例如 `## 1.55.0 - 10/31/2024`）。
- 条目应：
  - 以所属扩展名为前缀（例如 `[core]`）。
  - 以小写字母开头并使用过去时（例如 'added support...'）。
  - 按字母顺序排列。
  - 附上对应 pull request 的链接。
  - 适用时注明贡献方（例如 Contributed on behalf of x）。
  - 示例：`[core] added support for Node 20.x [#pr-number](<link-to-pr>) - Contributed on behalf of x`。
- 破坏性变更应放在单独的章节（标题：`<a name="breaking_changes_1.55.0">[Breaking Changes:](#breaking_changes_1.55.0)</a>`）。

## 2. 发布流程
<!-- release: both -->

### 2.1 执行发布
<!-- release: both -->

- 确保准备好的发布分支已推送。

### 2.1.1 GH Discussion 公告
<!-- release: minor -->

- 次版本发布（x.x.0）公告
  - 在[发布讨论](#111-次版本发布-1x0)中发表评论，宣布发布开始：<https://github.com/eclipse-theia/theia/discussions/{{discussionNumber}}>

    ```md
    The release will start now. We'll post an update once it has completed.
    Please avoid merging pull requests until we confirm the release is complete.
    ```

### 2.1.2 新添加的 Theia 包——首次发布到 NPM
<!-- release: both -->

_注意：_ 在发布工作流能发布新的 `@theia` 包之前，必须由 Theia committer 手动发布一次。
这是由于最近要求 npm 发布使用受信任工作流的变更所致。

建议先发布该新包的一个 next 版本，然后我们就可以通过推荐的发布工作流正常发布正式版。
- 要在本地发布，你需要：
  - 确保已登录 NPM（`npm login`；NPM 会提示输入 OTP（一次性密码）或安全密钥）。
  - 准备好你的 2FA，因为发布过程需要 OTP 才能完成。
- 运行 `npm run publish:next`
  - 可选：如果你从发布脚本中移除 `--yes` 参数，发布过程会在每一步要求你确认后才继续。

发布到 NPM 后，请按如下方式更新该包的设置：
- 准备好你的安全密钥或 2FA
- 访问 `https://www.npmjs.com/package/@theia/<new-package>/access`
- 受信任的 `Publisher` > 选择 `GitHub Actions publisher` > 输入我们发布工作流（`publish-ci.yml`）所需的字段
- 将 `Publishing access` 设为 `Require two-factor authentication and disallow tokens (recommended)`

可选：对 `next` 版本触发一次发布工作流，以验证工作流能按预期发布新包。

### 2.1.3 选项 1（推荐）：通过 GH WORKFLOW 执行发布
<!-- release: both -->

_注意：_ 该发布方式是首选，因为包在 GitHub Actions 上使用 NPM 发布的受信任工作流构建并带溯源签名。

- 运行 [_Publish packages to NPM_](https://github.com/eclipse-theia/theia/actions/workflows/publish-ci.yml) 工作流
- 选择发布分支（即 `release/{{majorMinor}}.x`）
- 选择相应的发布类型；若是对旧版本的补丁，请勾选对应的输入选项。

_注意：_ 如果自动发布失败（例如漏掉步骤 2.1.2 导致某些包未发布），可以转到选项 2 在本地执行发布。
已发布的包会被跳过，缺失的包届时会被发布。

### 2.1.3.1 检查包更新 PR
<!-- release: both -->

- 工作流会自动创建一个 PR 来更新发布分支的包版本，示例见[此处](https://github.com/eclipse-theia/theia/pull/16438)
- 按 PR 中的说明操作，确保所有包版本已更新，并将提交作者改为你自己。
- 等待检查通过，然后使用 `Rebase and Merge` 合并。

### 2.1.4 选项 2：在本地执行发布
<!-- release: both -->

_注意：_ 在本地发布将向 NPM 发布未签名的包。

### 2.1.4.1 在本地准备发布
<!-- release: both -->

- 确保已检出发布分支（即 `release/{{majorMinor}}.x`）。

- 清理工作目录：

  ```bash
  git clean -xdf
  ```

- 构建改动：

  ```bash
  npm install && npm run build
  ```

- 确认改动已构建（确保 `@theia` 扩展有各自的 `lib/` 目录）。

### 2.1.4.2 在本地发布
<!-- release: both -->

- 发布访问的设置已更改为推荐的 'Require two-factor authentication and disallow tokens (recommended)'。
- 要在本地发布，你需要：
  - 确保已登录 NPM（`npm login`；NPM 会提示输入 OTP（一次性密码）或安全密钥）。
  - 准备好你的 2FA，因为发布过程需要 OTP 才能完成。
- 可选：如果你从发布脚本中移除 `--yes` 参数，发布过程会在每一步要求你确认后才继续。
- 例如，一次发布运行大致如下：

  ```bash
  npm run publish:next
  lerna notice
  ...
  lerna info

  Found 1 package to publish:
  - @theia/some-package => x.y.z

  ✔ Are you sure you want to publish these packages? Yes
  lerna info publish Publishing packages to npm...
  ✔ This operation requires a one-time password: <enter your OTP>
  lerna success published @theia/some-package x.y.z
  lerna notice 
  lerna notice 📦  @theia/some-package@x.y.z
  lerna notice === Tarball Contents === 
  ...
  lerna notice 
  Successfully published:
  - @theia/some-package@x.y.z
  lerna success published 1 package
  Done in ...s.
  ```

### 2.1.4.2.1 次版本发布 1.x.0
<!-- release: minor -->

- 执行发布：

  ```bash
  npm run publish:latest
  ```

  选择相应的版本。

- 验证包已发布到 npm 且标签正确。（例如检查 core 包 <https://www.npmjs.com/package/@theia/core?activeTab=versions>）

- 移除认证令牌：

  ```bash
  npm logout
  ```

### 2.1.4.2.2 补丁版本发布 1.x.z
<!-- release: patch -->

  _注意：_ 对更早版本的补丁发布（例如存在 1.56.0 时发布 1.55.1），使用：

  ```bash
  npm run publish:patch
  ```
  
  对当前版本的补丁则使用：

  ```bash
  npm run publish:latest
  ```

- 验证包已发布到 npm 且标签正确。（例如检查 core 包 <https://www.npmjs.com/package/@theia/core?activeTab=versions>）

- 移除认证令牌：

  ```bash
  npm logout
  ```

### 2.1.4.3 准备发布分支
<!-- release: both -->

- 确保仍检出着发布分支（即 `release/{{majorMinor}}.x`）。

- 在一个 commit 中更新 `packages/core/README.md`（[示例](https://github.com/eclipse-theia/theia/commit/21fa2ec688e4a8bcf10203d6dc0f730af43a7f58)）。

  提交消息：
  
  ```md
  core: update re-exports for v{{version}}
  ```

- 将其他改动放在名为 `v{version}` 的 commit 中。
- 确保把所有包更新到新版本（搜索并替换）

  提交消息：
  
  ```md
  v{{version}}
  ```

- 推送分支。

### 2.1.5 本地依赖
<!-- release: both -->

- 发布分支更新后（包版本更新）：
  - 获取 `native dependencies`
    - 在发布分支上运行 [_Package Native Dependencies_](https://github.com/eclipse-theia/theia/actions/workflows/native-dependencies.yml) GitHub Action（等待期间可以继续其他工作）。
    - 下载构建产物（位于构建概览页面底部）。
    - 解压下载的文件夹。
    - 暂且保留这些依赖，稍后需要用到。

### 2.1.6 创建针对主分支的发布 PR
<!-- release: minor -->

- 创建指向 main 的 PR（补丁发布无需）：<https://github.com/eclipse-theia/theia/compare>
  
  PR 标题：
  
  ```md
  Theia v{{version}}
  ```

  - 等待批准。
  - 使用 `Rebase and Merge` 合并（**切勿 `Squash and Merge`**）。
  - 恢复发布分支。

- 示例参见：<https://github.com/eclipse-theia/theia/pull/16333>

### 2.1.7 创建附注 Git 标签
<!-- release: both -->

- 合并后为发布提交打标签（补丁发布直接在发布分支上打）：

  ```bash
  git tag -a v{{version}} ${sha} -m "v{{version}}"
  ```

  _注：_ 标签必须是附注标签（annotated），否则可能破坏发布。检查以下命令的输出是 `tag` 而非 `commit`。

  ```bash
  git for-each-ref refs/tags | grep 'v{{version}}' | awk '{print $2}'
  ```

- 推送标签：

  ```bash
  git push origin v{{version}}
  ```

### 2.1.8 创建 GH Release——次版本发布 1.x.0
<!-- release: minor -->

- 创建 GitHub release：
  - 在[发布页面](https://github.com/eclipse-theia/theia/releases/new)起草 release。
  - 选择相应的 `tag` 并填入下方的发布标题。
  - 为贡献者使用 `generate release notes`，并按既往发布格式排版。
  - 引用 `changelog` 与破坏性变更。
  - 附上 _Native Dependencies_ 构建产物（解压后的 zip）。
    - native-dependencies-darwin-arm64.zip
    - native-dependencies-darwin-x64.zip
    - native-dependencies-linux-x64.zip
    - native-dependencies-win32-x64.zip
  - 将该 release 标记为 `latest`
  - 选择 _"Publish Release"_。
  - 详情参见 [GitHub 文档](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository#creating-a-release)。

发布标题：

```md
Eclipse Theia v{{version}}
```

### 2.1.9 创建 GH Release——补丁版本发布 1.x.z
<!-- release: patch -->

- 创建 GitHub release：
  - 在[发布页面](https://github.com/eclipse-theia/theia/releases/new)起草 release。
  - 选择相应的 `tag` 并填入下方的发布标题。
  - 检查上一个 tag 是否正确。
  - 使用 `Generate release notes` 生成变更日志链接。
  - 附上 _Native Dependencies_ 构建产物（解压后的 zip）。
    - native-dependencies-darwin-arm64.zip
    - native-dependencies-darwin-x64.zip
    - native-dependencies-linux-x64.zip
    - native-dependencies-win32-x64.zip
  - 可选：将该 release 标记为 `latest`（_对旧版本的补丁请取消勾选！！_）。
  - 选择 _"Publish Release"_。
  - 详情参见 [GitHub 文档](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository#creating-a-release)。

发布标题：

```md
Eclipse Theia v{{version}}
```

发布正文：

```md
Based on https://github.com/eclipse-theia/theia/tree/v{{majorMinor}}.X

Includes the following fixes:
- <list of commits>

**Full Changelog**: should be generated via 'Generate release notes'
```

### 2.2 社区发布
<!-- release: both -->

社区发布遵循与常规发布相同的流程。请遵循 [2.1 执行发布](#21-执行发布)。

## 3. 发布后步骤
<!-- release: both -->

### 3.1 Eclipse 发布
<!-- release: minor -->

- 登录 [Eclipse Foundation Theia 项目页面](https://projects.eclipse.org/projects/ecd.theia)。
- 从菜单选择 `Release` / `Create a new release`。
  - `Release Date`：填写日期。
  - `Name`：填写版本（例如 `1.55.0`）。
- 进入 Edit -> Project Plan
  - 将变更日志链接添加到 `deliverables`（链接文本 `Release Notes`）。
  - 将破坏性变更链接添加到 `compatibility`（链接文本 `Breaking Changes`）。
- 保存更改并通过检查项目页面确认。

### 3.2 公布发布完成
<!-- release: both -->

### 3.2.1 次版本发布 1.x.0
<!-- release: minor -->

- 关闭 endgame issue：使用下面的评论作为关闭评论。

- 更新[发布讨论](#111-次版本发布-1x0)并发表评论宣布发布完成：<https://github.com/eclipse-theia/theia/discussions/{{discussionNumber}}>

  ```md
  The [{{version}} release](https://github.com/eclipse-theia/theia/releases/tag/v{{version}}) has completed, thank you to everyone that participated and contributed!
  ```

- 将该消息标记为答案

- 将讨论从 Release Announcement 分类取消置顶

- 同时向 [the `theia-dev` 邮件列表](mailto:theia-dev@eclipse.org)发送邮件：

    主题：

    ```md
    Eclipse Theia v{{version}} release
    ```

    正文：

    ```md
    Hi everyone,

    The Eclipse Theia v{{version}} release has been published!
    See the release on GitHub for more information: https://github.com/eclipse-theia/theia/releases/tag/v{{version}}

    Thank you to everyone that participated and contributed!
    ```

### 3.2.2 补丁版本发布 1.x.z
<!-- release: patch -->

- 关闭 endgame issue：使用下面的评论作为关闭评论。

- 更新[发布讨论](#111-次版本发布-1x0)并发表评论宣布发布完成：<https://github.com/eclipse-theia/theia/discussions/{{discussionNumber}}>

  ```md
  The [{{version}} patch release](https://github.com/eclipse-theia/theia/releases/tag/v{{version}}) has completed, thank you to everyone that participated and contributed!
  ```

- 将该消息标记为答案

- 同时向 [the `theia-dev` 邮件列表](mailto:theia-dev@eclipse.org)发送邮件：

    主题：

    ```md
    Eclipse Theia v{{version}} patch release
    ```

    正文：

    ```md
    Hi everyone,

    The Eclipse Theia v{{version}} patch release has been published!
    See the release on GitHub for more information: https://github.com/eclipse-theia/theia/releases/tag/v{{version}}

    Thank you to everyone that participated and contributed!
    ```

### 3.3 更新未来里程碑
<!-- release: minor -->

- 关闭当前发布[里程碑](https://github.com/eclipse-theia/theia/milestones)。
- 如果尚不存在，则创建接下来两个里程碑。发布通常在每月最后一个星期四，可能有例外。

### 3.4 合并网站 PR
<!-- release: minor -->

- 合并所有[带 `merge with next release` 标签的网站 PR](https://github.com/eclipse-theia/theia-website/labels/merge%20with%20next%20release)

### 3.5 发布 GitHub Pages
<!-- release: minor -->

- 使用 [GitHub Pages 工作流](https://github.com/eclipse-theia/theia/actions/workflows/publish-api-doc-gh-pages.yml)通过 `manual_dispatch` 作业手动发布 `latest` 文档。

### 3.6 更新主要依赖
<!-- release: minor -->

每次发布后，检查以下主要依赖是否有版本更新：

- [Node.js](https://nodejs.org/en/download/releases/) - 关注 LTS 版本与安全更新
- [React](https://react.dev/versions) - 查看最新稳定版本

Electron 不在此次检查之列，因为它在每次发布后都会更新，参见 [3.8 Electron 更新](#38-electron-更新)。

对每个需要更新的依赖，使用以下模板[创建工单](https://github.com/eclipse-theia/theia/issues/new?template=feature_request.md)：

标题：

```md
Update [DEPENDENCY_NAME] to version X.Y.Z
```

描述：

```md
Update [DEPENDENCY_NAME] to stay up-to-date and consume (security) fixes.

- Current version: [CURRENT_VERSION]
- Target version: [TARGET_VERSION]

After updating the dependency, please [open a ticket for the Theia IDE](https://github.com/eclipse-theia/theia-ide/issues/new?template=feature_request.md) and assign the `toDoWithRelease` and `dependencies` labels.
This indicates that the update needs to be done in Theia IDE as well and ensures it will be addressed with the next release.
```

如果某些更新需要一起进行（例如新 electron 版本要求更新的 node 版本），可以把工单归组。

将工单指派给 @ndoschek。

工单创建后，@ndoschek 会评估并将其指派给合适的人实现。

### 3.7 NPM 升级
<!-- release: minor -->

发布后在仓库上执行 `npm upgrade` 以更新 `package-lock.json`。该升级有助于：

- 更准确地反映采用者在发布期间会拉取的内容。
- 以我们声明的版本范围验证依赖。
- 修复依赖的已知安全漏洞。

执行升级：

- 在仓库根目录运行 `npm upgrade --save`。除更新 `package-lock.json` 外，它还会把所有 `package.json`（根目录与子包）中的依赖版本范围对齐到 package-lock.json 中解析出的版本。这确保持有旧锁文件的采用者被迫至少拉取最低兼容版本，而不是停留在较旧的锁定版本上（如果升级需要代码改动，旧版本可能与更新后的代码不兼容）。
- 修复任何编译错误、类型错误和失败的测试。
- 携改动打开 PR（[示例](https://github.com/eclipse-theia/theia/pull/15688)）。
- 在本地运行许可证检查评审
- 等待 "IP Check" 完成（[示例](https://gitlab.eclipse.org/eclipsefdn/emo-team/iplab/-/issues/9377)）。

在发布后执行这些操作有助于我们发现新依赖的问题，并为依赖的许可证检查留出时间。

### 3.8 Electron 更新
<!-- release: minor -->

与 NPM 升级一起，在每次发布后将 Electron 更新到其最新[稳定版本](https://www.electronjs.org/releases/stable)：

- 查阅[破坏性变更](https://www.electronjs.org/docs/latest/breaking-changes)并调整代码。对于新的大版本，在变更日志中添加破坏性变更条目。
- 更新 `packages/electron` 和 `examples/electron` 中的确切 `electron` 版本，并将 `.github/workflows/native-dependencies.yml` 中的 Node.js 版本与其匹配。
- 打开单独的 PR（[示例](https://github.com/eclipse-theia/theia/pull/18150)），在 Linux、macOS 和 Windows 上测试，并运行许可证检查。
- [为 Theia IDE 创建工单](https://github.com/eclipse-theia/theia-ide/issues/new?template=feature_request.md)，并打上 `toDoWithRelease` 与 `dependencies` 标签。

## 4. 故障排除
<!-- release: both -->

### 4.1 发布期间的失败
<!-- release: both -->

如果 `lerna` 在发布期间失败（例如 socket 错误），使用以下命令重置并重试：

- 重置仓库：

  ```bash
  git reset --hard
  ```

- 只重新发布未发布的包：

  ```bash
  npx lerna publish from-package --no-git-reset --no-git-tag-version --no-push
  ```
