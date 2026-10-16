# Pull Request

本文档阐明贡献与审查 pull request 的规则与期望。
它以规则列表的形式组织，可以在 PR 中引用这些规则来引导和约束讨论。
如果某条规则本身在讨论中引发困扰，必须在[开发者会议](https://github.com/eclipse-theia/theia/wiki/Dev-Meetings)上复议并更新。

- [**开启 Pull Request**](#opening-a-pull-request)
- [**请求审查**](#requesting-a-review)
- [**审查清单**](#review-checklist)
- [**审查**](#reviewing)
- [**合入**](#landing)
- [**回退**](#reverting)
- [**关闭**](#closing)

## 开启 Pull Request

<a name="pr-template"></a>

- [1.](#pr-template) 每个 PR 描述必须遵循 [PR 模板](https://github.com/eclipse-theia/theia/blob/master/.github/PULL_REQUEST_TEMPLATE.md)

<a name="human-in-the-loop"></a>

- [2.](#human-in-the-loop) 贡献者可以使用任何喜欢的工具来制作贡献，但必须有人类在回路中。贡献者在请其他项目成员审查之前，必须阅读并检查所有 LLM 生成的代码或文本。贡献者始终是作者，并对自己的贡献承担全部责任。贡献者应有足够的信心确保贡献质量足够高，让请求审查是对维护者稀缺时间的良好使用；并且在审查期间，他们应当能自行回答有关其工作的问题。

<a name="design-review"></a>

- [3.](#design-review) 可以在进入详细实现之前提早开启 PR 进行设计审查。
  - 设计审查请求应是一条明确的评论。
  - 此类 PR 应标记为 draft 或使用 WIP 前缀。

<a name="fixups"></a>

- [4.](#fixups) PR 开启_之后_所做的改动应保存在独立 commit 中，直到审查流程结束。这使审查者只需重新审查 PR 中被更新的部分，并判断哪些需要重新测试。"fixup" commit 必须在合并前 squash，以保持干净的历史。

<a name="changelog-entry"></a>

- [5.](#changelog-entry) 只有[破坏性变更](#checklist-breaking-changes)才强制要求变更日志条目，破坏性变更在 PR 描述的 `Breaking changes` 一节中声明。含非破坏性变更的 PR 不应向 [CHANGELOG.md](https://github.com/eclipse-theia/theia/blob/master/CHANGELOG.md) 添加条目；它们的条目会在[发布时](Publishing.md#15-更新变更日志)统一收集。

  > 为什么？这避免了每个 PR 手动写条目导致的 `CHANGELOG.md` 频繁合并冲突。

## 请求审查

<a name="review-reqs"></a>

- [1.](#review-reqs) 满足以下条件时可以请求审查：
  - [PR 模板](#pr-template)已填写完整。
  - 作者已充分测试改动。
  - 作者已按[审查清单](#review-checklist)充分自查。
<a name="review-request-gh"></a>
- [2.](#review-request-gh) 可以[通过 GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/requesting-a-pull-request-review) 显式请求审查。
<a name="review-request-comment"></a>
- [3.](#review-request-comment) 也可以由任意 GitHub 用户以评论形式请求审查。
  - 例如邀请最初提交 issue 的人参与测试。

## 审查清单

<a name="checklist-build-and-test"></a>

- [1.](#checklist-build-and-test) 新代码按照 PR 描述的 `How to test` 一节完成构建与测试。
<a name="checklist-project-org"></a>
- [2.](#checklist-project-org) 新代码符合[项目组织](code-organization.md)与[编码规范](coding-guidelines.md)。
<a name="checklist-breaking-changes"></a>
- [3.](#checklist-breaking-changes) 破坏性变更已说明理由并记录在[变更日志](https://github.com/eclipse-theia/theia/blob/master/CHANGELOG.md)中。
  - PR 是否为破坏性变更在其描述的 `Breaking changes` 一节声明。非破坏性变更无需变更日志条目，参见[变更日志规则](#changelog-entry)：缺少条目不构成审查发现，为非破坏性变更添加的条目应被删除。
<a name="checklist-dependencies"></a>
- [4.](#checklist-dependencies) 新依赖已说明理由并经过[验证](https://github.com/eclipse-theia/theia/wiki/Registering-CQs#wip---new-ecd-theia-intellectual-property-clearance-approach-experimental)。
  - 对于新添加的依赖，我们会运行[许可证检查工作流](../.github/workflows/license-check.yml)，但不以评审模式运行。
    - 如果许可证检查显示新依赖需要评审（即 `ERROR: Found results that aren't part of the baseline! X some-dependency, some-license`），我们需要以评审模式运行许可证检查（`npm run license:check:review`）。
    - 由于当前仓库没有定义 PAT secret，评审模式的许可证检查需要在本地进行——由贡献者（如果其是 Theia committer）或审查者执行。
<a name="checklist-copied-code"></a>
- [5.](#checklist-copied-code) 复制的代码已说明理由并通过 [CQ 批准](https://github.com/eclipse-theia/theia/wiki/Registering-CQs#case-3rd-party-project-code-copiedforked-from-another-project-into-eclipse-theia-maintained-by-us)。
  - 仔细查看为你的 PR 运行的 GitHub action：3pp/dash 许可证检查应为绿色。
  - 如果是红色：很可能意味着你需要创建一个 CQ。
<a name="checklist-copyright"></a>
- [6.](#checklist-copyright) 每个新文件都有恰当的版权声明，包含当前年份与贡献实体（个人或公司）名称。
<a name="checklist-sign-off"></a>
- [7.](#checklist-sign-off) commit 已签署（signed-off）：<https://github.com/eclipse-theia/theia/blob/master/CONTRIBUTING.md#sign-your-work>。
<a name="checklist-meaningful-commits"></a>
- [8.](#checklist-meaningful-commits) 每个 commit 都有有意义的标题以及说明其作用的正文。可以从 PR 的 `What it does` 一节获得启发。
<a name="checklist-commit-history"></a>
- [9.](#checklist-commit-history) commit 历史已 rebase 到 master，且只包含有意义的 commit 与改动（通常越少越好）。
  - 例如，使用 `git pull -r` 或 `git fetch && git rebase` 从 master 获取改动。
<a name="checklist-i18n"></a>
- [10.](#checklist-i18n) 用户可见文案已使用 `nls` 服务国际化。
  - 详情请参阅编码规范中的[国际化/本地化章节](./coding-guidelines.md#internationalizationlocalization)。

## 审查

<a name="reviewing-template"></a>

- [1.](#reviewing-template) 审查者应检查 PR 是否有[恰当的描述](#pr-template)。
<a name="reviewing-fn"></a>
- [2.](#reviewing-fn) 审查者应按照 PR 描述的 `How to test` 一节构建并验证改动。
<a name="reviewing-checklist"></a>
- [3.](#reviewing-checklist) 审查者应确保[审查清单](#review-checklist)中的所有检查均通过。
<a name="reviewing-share"></a>
- [4.](#reviewing-share) 审查者无需确保所有内容，可以只验证一部分并以评论形式提供反馈。
<a name="review-consultation"></a>
- [5.](#review-consultation) 对于实质性改变应用或其组件行为的变更，应向多个贡献组织的代表请求审查，以确保与项目目标一致，并与重要采用者的下游产品兼容。

### 请求变更

<a name="changes-review-reqs"></a>

- [1.](#changes-review-reqs) 如果作者未遵循[审查要求](#review-reqs)，应请求变更。
<a name="changes-no-nit"></a>
- [2.](#changes-no-nit) 不能因审查者的个人偏好而请求变更。
  - 此类变更请求应被驳回。
<a name="changes-no-out-of-scope"></a>
- [3.](#changes-no-out-of-scope) 不能因超出 PR 范围的问题而请求变更。
  - 此类变更请求应被驳回，并应另立 issue 单独处理。
<a name="changes-style-agreement"></a>
- [4.](#changes-style-agreement) 风格与编码偏好不应在 PR 上讨论，而应在[开发者会议](https://github.com/eclipse-theia/theia/wiki/Dev-Meetings)上提出，
  由团队商定后写入[编码规范](coding-guidelines.md)，此后所有贡献者共同遵循。

### 批准

<a name="justifying-approve"></a>

- [1.](#justifying-approve) 每次批准都应附有遵循这些指南的支持性评论。
<a name="dismissing-approve"></a>
- [2.](#dismissing-approve) 没有评论的批准应被驳回。
<a name="approval-finality"></a>
- [3.](#approval-finality) 批准 PR 意味着审查者已准备好合并该 PR。审查者只应批准自己准备好合并的 PR。如果一个 PR 正在被多名审查者审查，对 PR 状态不满意的审查者应阻止其合并，例如将自己的审查标记为 'request changes'。

### 协作

<a name="collaboration-on-pr"></a>

- [1.](#collaboration-on-pr) 如果某项变更请求很重要，但审查者无法详尽阐述，
那么应鼓励审查者打开替代 PR，或在当前 PR 上协作。
<a name="completing-pr"></a>
- [2.](#completing-pr) 如果一个 PR 很重要，但作者无法或不愿处理遗留问题，
维护者可以用额外的 commit 完成 PR，
前提是原作者已接受 [ECA](https://github.com/eclipse-theia/theia/blob/master/CONTRIBUTING.md#eclipse-contributor-agreement) 且其 commit 得到保留——原作者的工作不应被 squash 掉。
<a name="suggesting-help-on-pr"></a>
- [3.](#suggesting-help-on-pr) 审查者应通过评论提供帮助，避免直接介入作者的工作。
<a name="landing-stale-pr"></a>
- [4.](#landing-stale-pr) 如果作者没有回应，则此类评论并非必需。

## 合入

<a name="landing-pr"></a>

- [1.](#landing-pr) 满足以下条件时可以合入 PR：
  - CI 构建成功。
  - 作者已接受 [Eclipse Contributor Agreement](https://github.com/eclipse-theia/theia/blob/master/CONTRIBUTING.md#eclipse-contributor-agreement)。
  - [审查清单](#review-checklist)中的所有检查均获至少一名审查者批准。
  - 没有未解决的审查评论。
<a name="merging-pr"></a>
- [2.](#merging-pr) 满足上述条件的 PR 应及时合并，以避免发布时积压大量已批准 PR。合并 PR 的责任归属于：
  - 作者本人，如果作者是 committer。
  - 作者所在组织的 committer，如果存在。
  - 否则为批准该 PR 的审查者。

## 回退

<a name="reverting-pr"></a>

- [1.](#reverting-pr) 如果 PR 合入后导致回归，
作者与维护者有 2 天时间解决，此后该 PR 必须被回退。

## 关闭

<a name="closing-pr"></a>

- [1.](#closing-pr) 审查者不能无故关闭 PR。
<a name="closing-pr-reasons"></a>
- [2.](#closing-pr-reasons) PR 可能因以下原因被关闭：
  - 它引入的功能本应实现为外部的 Theia 或 VS Code 扩展。
  - 它引入了核心扩展之间的结构性或 API 变更。
  此类变更必须由经验丰富的维护者完成，以避免回归与冗长的审查。
  - 它本应是第三方组件，例如 Theia 不是日志框架或代理服务器。
  - 它更改了开发基础设施，例如测试框架、打包方式等。
  此类变更必须由活跃维护者在[开发者会议](https://github.com/eclipse-theia/theia/wiki/Dev-Meetings)上达成一致后完成。
  - 它违反了[人类在回路](#human-in-the-loop)政策。
