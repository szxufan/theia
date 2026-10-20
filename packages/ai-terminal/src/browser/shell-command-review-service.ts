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
import { isWindows } from '@theia/core/lib/common/os';
import { injectable, inject } from '@theia/core/shared/inversify';
import { AiConfigurationService } from '@theia/ai-core';
import { ToolCallReview } from '@theia/ai-chat/lib/common';
import { CommandReviewAgent, CommandReviewResult } from './command-review-agent';
import { ShellCommandAnalyzer } from '../common/shell-command-analyzer';
import {
    AI_COMMAND_REVIEW_AUTO_APPROVE_PREFERENCE,
    AI_COMMAND_REVIEW_ENABLED_PREFERENCE
} from '../common/shell-command-preferences';

/** How long a cached review stays valid; avoids re-querying the model for repeated commands. */
const REVIEW_CACHE_TTL_MS = 10 * 60 * 1000;

interface CachedReview {
    result: CommandReviewResult;
    expires: number;
}

/**
 * Orchestrates the AI review of shell commands awaiting user confirmation: preference gating,
 * static guardrails, result caching, and the auto-approve decision.
 *
 * Auto-approve requires all three guardrails to pass (extremely conservative by design):
 * 1. static: the command contains no dangerous shell patterns (command substitution, -exec, ...),
 * 2. AI: the Command Review agent returned verdict "safe",
 * 3. preference: \`ai-features.terminal.aiCommandReview.autoApprove\` is enabled.
 */
@injectable()
export class ShellCommandReviewService {

    @inject(CommandReviewAgent)
    protected readonly reviewAgent: CommandReviewAgent;

    @inject(ShellCommandAnalyzer)
    protected readonly shellCommandAnalyzer: ShellCommandAnalyzer;

    @inject(AiConfigurationService)
    protected readonly aiConfigurationService: AiConfigurationService;

    protected readonly reviewCache = new Map<string, CachedReview>();

    isReviewEnabled(): boolean {
        return this.aiConfigurationService.get<boolean>(AI_COMMAND_REVIEW_ENABLED_PREFERENCE, true) ?? true;
    }

    /**
     * Reviews `command`; resolves with `undefined` when the review is disabled or unavailable
     * (no model, parse failure, error) — the confirmation flow then proceeds without review info.
     */
    async review(command: string, cwd: string, cancellationToken?: CancellationToken): Promise<ToolCallReview | undefined> {
        if (!this.isReviewEnabled()) {
            return undefined;
        }

        const hasDangerousPatterns = this.shellCommandAnalyzer.containsDangerousPatterns(command);
        const subCommands = this.shellCommandAnalyzer.parseCommand(command);

        let result = this.getCachedReview(command);
        if (!result) {
            result = await this.reviewAgent.review(command, isWindows ? 'cmd.exe' : 'bash', cwd, subCommands, cancellationToken);
            if (!result) {
                return undefined;
            }
            this.reviewCache.set(command, { result, expires: Date.now() + REVIEW_CACHE_TTL_MS });
        }

        const autoApprove = result.verdict === 'safe'
            && !hasDangerousPatterns
            && (this.aiConfigurationService.get<boolean>(AI_COMMAND_REVIEW_AUTO_APPROVE_PREFERENCE, true) ?? true);
        return { ...result, autoApprove };
    }

    protected getCachedReview(command: string): CommandReviewResult | undefined {
        const cached = this.reviewCache.get(command);
        if (!cached) {
            return undefined;
        }
        if (cached.expires < Date.now()) {
            this.reviewCache.delete(command);
            return undefined;
        }
        return cached.result;
    }

}
