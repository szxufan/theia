// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses as set forth in such availability conditions are set forth in the
// Eclipse Public License v. 2.0 are satisfied: GNU General Public License,
// version 2 with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { CancellationToken } from '@theia/core';
import { injectable, inject } from '@theia/core/shared/inversify';
import { ToolCallReview, ToolCallReviewer } from '@theia/ai-chat/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { resolveShellCwd } from './abstract-shell-execution-tool';
import { ShellCommandReviewService } from './shell-command-review-service';
import {
    SHELL_EXECUTION_FUNCTION_ID,
    SHELL_EXECUTE_BACKGROUND_FUNCTION_ID
} from '../common/shell-execution-server';

/**
 * Bridges the ai-chat {@link ToolCallReviewer} contribution point to the shell command review.
 * Only commands that actually execute something are reviewed: `shellExecute` action "execute"
 * and `shellExecuteBackground` action "start". Read-only actions never start a review.
 */
@injectable()
export class ShellCommandReviewer implements ToolCallReviewer {

    @inject(ShellCommandReviewService)
    protected readonly reviewService: ShellCommandReviewService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    canReview(toolId: string, args: string | undefined): boolean {
        try {
            const parsed = args === undefined ? undefined : JSON.parse(args) as { action?: string };
            if (toolId === SHELL_EXECUTION_FUNCTION_ID) {
                const action = parsed?.action ?? (parsed !== undefined && 'resultId' in parsed && !('command' in parsed) ? 'read' : 'execute');
                return action === 'execute';
            }
            if (toolId === SHELL_EXECUTE_BACKGROUND_FUNCTION_ID) {
                return parsed?.action === 'start';
            }
        } catch {
            // Unparseable arguments of a shell tool: review them (the tool call itself will fail anyway).
            return toolId === SHELL_EXECUTION_FUNCTION_ID;
        }
        return false;
    }

    async review(toolId: string, args: string | undefined, cancellationToken: CancellationToken): Promise<ToolCallReview | undefined> {
        try {
            const parsed = args === undefined ? undefined : JSON.parse(args) as { command?: string; cwd?: string };
            const command = parsed?.command;
            if (!command) {
                return undefined;
            }
            let cwd: string;
            try {
                cwd = resolveShellCwd(this.workspaceService, parsed?.cwd);
            } catch {
                cwd = '';
            }
            return await this.reviewService.review(command, cwd, cancellationToken);
        } catch {
            return undefined; // A review glitch must never break the confirmation flow.
        }
    }

}
