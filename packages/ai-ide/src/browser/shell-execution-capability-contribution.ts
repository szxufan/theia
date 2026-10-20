// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PromptService } from '@theia/ai-core/lib/common';
import { SHELL_EXECUTE_BACKGROUND_FUNCTION_ID, SHELL_EXECUTION_FUNCTION_ID } from '@theia/ai-terminal/lib/common/shell-execution-server';
import { LIST_TASKS_FUNCTION_ID, RUN_TASK_FUNCTION_ID } from '../common/workspace-functions';
import { nls } from '@theia/core';

@injectable()
export class ShellExecutionCapabilityContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.promptService.addBuiltInPromptFragment({
            id: 'shell-execution',
            template: this.buildTemplate()
        });
    }

    protected buildTemplate(): string {
        const label = nls.localize('theia/ai/ide/shellExecutionCapability/name', 'Shell 执行');
        const description = nls.localize('theia/ai/ide/shellExecutionCapability/description',
            '允许代理在主机系统上运行任意 shell 命令。随后代理可以委派执行 \
            不可作为任务使用的脚本、查询系统信息，以及执行没有专用工具可用的操作。');

        return `---
name: ${label}
description: ${description}
---
## Shell Execution

You have access to the ~{${SHELL_EXECUTION_FUNCTION_ID}} tool, which lets you run arbitrary shell commands on the host system and capture their output.

### When to use shell execution

Use ~{${SHELL_EXECUTION_FUNCTION_ID}} **only when no better-suited tool exists** for the task:

- **Prefer tasks over shell execution** for compiling, building, linting, testing, or any operation that has a corresponding workspace task. \
Always check available tasks with ~{${LIST_TASKS_FUNCTION_ID}} first and run them with ~{${RUN_TASK_FUNCTION_ID}} instead of invoking the build tool directly.
- **Prefer dedicated tools** for file reading, searching, or editing — use the file and search tools provided rather than \`cat\`, \`grep\`, or \`sed\` for workspace files.

Appropriate use cases for ~{${SHELL_EXECUTION_FUNCTION_ID}}:
- Running a command for which no workspace task exists (e.g., a one-off script, \`git\` operations, installing a dependency)
- Efficient bulk operations that are impractical with the file editing tools (e.g., \`sed\`/\`awk\` for mass search-and-replace across many files)
- Querying system or environment information (e.g., checking installed tool versions, environment variables)
- Running scripts (bash, python, node, etc.) that are part of the task

### Inspect output with the tool's native read options — not shell filters

**Do not pipe commands through \`grep\`, \`head\`, \`tail\`, \`wc -l\`, or \`sed\` just to shape or limit output.**
Run the plain command once, then re-read exactly the part you need via the tool's \`read\` action:
- \`filter\` (regex) keeps only matching lines, preserving original line numbers — use it instead of \`grep\`
- \`head\`/\`tail\` take the first/last N lines — use instead of \`head\`/\`tail\` flags
- \`fromLine\`/\`toLine\` read a specific line range, \`maxLines\` caps each read
- reads are repeatable and paginated (\`hasMore\` → continue with \`fromLine = endLine + 1\`), so you can \
narrow down without re-running the command

Command-side filtering is only needed when a command's output exceeds the 1MB-per-stream retention cap.

### Important constraints

- **Do not start long-running or blocking processes** (e.g., dev servers, file watchers, long builds) with this tool — \
use launch configurations or the ~{${SHELL_EXECUTE_BACKGROUND_FUNCTION_ID}} tool for those.
- Commands require **user approval** before execution. The user sees the exact command and can approve, deny, or cancel it.
- Output previews are truncated to the first and last 50 lines; when \`truncated\` is true, follow up with the \`read\` action \
instead of re-running the command with different flags.

## Background Shell Tasks

For commands that run long or keep running (builds taking minutes, watch modes, dev servers), use \
~{${SHELL_EXECUTE_BACKGROUND_FUNCTION_ID}} instead: it starts the command in the background, returns a taskId at once, \
and lets you read output and stop the process later. Poll every few seconds rather than in a tight loop, and always stop \
tasks you no longer need.

Two read modes are available for background tasks:
- Incremental polling: \`action: "read"\` with an increasing \`fromOffset\` — cheap for tailing live output.
- Line-based selection: the same native read options as ~{${SHELL_EXECUTION_FUNCTION_ID}} (\`filter\`, \`head\`, \`tail\`, \
\`fromLine\`/\`toLine\`, \`maxLines\`) over the output accumulated so far — again, prefer these over \`grep\`/\`head\`/\`tail\` \
pipes in the started command.`;
    }
}
