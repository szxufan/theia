// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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
import { nls } from '@theia/core';
import { WORKSPACE_INSTRUCTIONS_VARIABLE } from './workspace-instructions-variable-contribution';

/**
 * Contributes the `workspace-instructions` prompt fragment: the resolved contents of the
 * workspace's instruction files (AGENTS.md etc.), discovered by
 * {@link WorkspaceInstructionsVariableContribution}. The fragment body is the variable alone,
 * so it collapses to nothing when the workspace has no instruction files.
 */
@injectable()
export class WorkspaceInstructionsCapabilityContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.promptService.addBuiltInPromptFragment({
            id: WorkspaceInstructionsCapabilityContribution.FRAGMENT_ID,
            template: this.buildTemplate()
        });
    }

    static readonly FRAGMENT_ID = 'workspace-instructions';

    protected buildTemplate(): string {
        const name = nls.localize('theia/ai/ide/workspaceInstructionsCapability/name', '工作区指令');
        const description = nls.localize('theia/ai/ide/workspaceInstructionsCapability/description',
            '把工作区根目录下的项目指令文件（AGENTS.md、AGENT.md 或 CLAUDE.md）内容自动注入系统提示词。');

        return `---
name: ${name}
description: ${description}
---
{{${WORKSPACE_INSTRUCTIONS_VARIABLE.name}}}`;
    }
}
