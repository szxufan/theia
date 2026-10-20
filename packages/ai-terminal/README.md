<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI TERMINAL 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-terminal` 扩展为终端视图提供一个浮层。\
该浮层可用于向专用的 `TerminalAgent` 询问终端命令的建议。

它还提供 `shellExecute` 与 `shellExecuteBackground` 工具，允许 AI 智能体在宿主系统上运行命令并原生读取输出。

## Shell 执行工具（shellExecute）

`shellExecute` 是 action 式工具：`execute` 在获得用户确认后于宿主系统执行 shell 命令，`read` 凭 `execute` 返回的 `resultId` 反复读取该次执行的保留输出。

### 安全性

默认情况下，每条命令都需要用户明确批准。该工具标记了 `confirmAlwaysAllow`，当用户尝试启用自动批准时会显示额外的警告对话框。`read` 动作只读缓冲、不执行任何东西，自动放行（计划模式下也允许）。

> **警告**：该工具拥有完整的系统访问权限。请仅在隔离环境（容器、虚拟机）中启用自动批准。

### 功能特性

- `execute`：执行任意 shell 命令（Linux/macOS 上的 bash，Windows 上的 cmd/PowerShell），可配置工作目录与超时（默认 2 分钟，最长 10 分钟），支持取消
- `execute` 结果附带 `resultId`、`totalLines` 与 `truncated` 标记；预览仍按首尾各 50 行截断
- `read`：按行寻址反复读取输出片段，选项如下（窗口 head/tail/fromLine-toLine 三选一，filter 与 maxLines 可与之组合）

| 选项 | 说明 |
| --- | --- |
| `filter` | 正则，只保留匹配行并保留原始行号（grep -n 式） |
| `stream` | 读哪个流：`combined`（默认，含 `--- stderr ---` 分隔行）/ `stdout` / `stderr` |
| `head` / `tail` | 过滤后视图的前 / 后 N 行 |
| `fromLine` / `toLine` | 原始 1-based 闭区间行号范围 |
| `maxLines` | 单次读取行数上限（默认 200、上限 2000），截断时 `hasMore=true`，用 `fromLine=endLine+1` 翻页 |

- 输出保留策略：每次执行的 stdout/stderr 各保留前 1MB，最近 10 次执行可通过 `resultId` 读取
- 提示词引导 AI 优先用上述原生读取选项翻看输出，而不是在命令里拼 `grep`/`head`/`tail`/`wc -l`/`sed`

## 命令审查代理（Command Review）

当 shell 命令未被 `checkAutoAction` 自动放行、即将弹出确认界面时，内置的「命令审查」代理（非聊天代理，不出现在代理选择器，可在 AI 配置视图中为 `command-review` 用途指定模型）会对命令做一次安全审查：

- **判定 safe（极保守）**：提示词把 safe 严格限定为纯只读、零副作用命令（列目录、打印文件、只读 git 查询、查版本等），任何不确定一律 risky；
- **自动放行**需三重守卫全部通过：AI 判定 safe + 命令不含静态危险模式（`$()`、反引号、`-exec` 等，含危险模式的命令永不自动放行）+ 偏好 `ai-features.terminal.aiCommandReview.autoApprove` 开启；
- **判定 risky**（或 safe 但含危险模式）时，确认界面展示 AI 给出的「命令作用」与「风险点」（简体中文），由用户决策；审查期间允许/拒绝按钮始终可用；
- 审查限时 30 秒，失败/超时/禁用时确认流程完全不受影响。

偏好设置（`ai-features.terminal.aiCommandReview.*`）：

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 启用命令审查 |
| `autoApprove` | `true` | 允许判定无风险的只读命令免确认执行；关闭后审查仅用于展示 |

审查覆盖 `shellExecute` 的 `execute` 与 `shellExecuteBackground` 的 `start`（后台任务的审查结论显示在通用确认卡上）；实现上 ai-chat 提供 `ToolCallReviewer` 贡献点（`FrontendChatToolRequestService` 在确认等待期调用），ai-terminal 注册 `ShellCommandReviewer` 实现。

## Shell 后台任务工具（shellExecuteBackground）

面向长时命令（构建、watch、dev server）：`start` 立即返回 `taskId`，`status` 查询状态，`stop` 终止进程树；`read` 支持两种模式：

- **增量轮询**：`fromOffset` 字符偏移（从 0 开始，响应含下一偏移与 `eof`），适合跟踪活任务新增输出；
- **行模式**：与 `shellExecute` 的 `read` 相同的读取选项（filter/head/tail/fromLine/toLine/maxLines/stream），作用于目前累计的全部输出。

`start` 与 `shellExecute` 的 `execute` 共用同一套允许/拒绝模式确认策略；其余动作自动放行。

## 更多信息

- [`@theia/ai-terminal` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai_terminal.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
