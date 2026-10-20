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

import { CancellationToken } from '@theia/core/lib/common/cancellation';

/**
 * The outcome of an AI review of a tool call that is about to be confirmed by the user.
 * `purpose` and `risks` are user-facing and must be localized (Simplified Chinese in this fork).
 */
export interface ToolCallReview {
    verdict: 'safe' | 'risky';
    /** One or two sentences describing what the command actually does. */
    purpose: string;
    /** Concrete risk points; empty for a safe verdict. */
    risks: string[];
    /**
     * True only when the reviewer's own guardrails (static analysis, preferences, ...) all agree
     * that this call may be auto-approved. The confirmation flow then confirms without user click.
     */
    autoApprove: boolean;
}

/**
 * Contribution point for reviewing tool calls while they await user confirmation. Reviewers run
 * after `checkAutoAction` declined to decide (i.e., right when the confirmation UI is shown):
 * a `safe` verdict with `autoApprove` auto-confirms the call, anything else only enriches the
 * confirmation UI with the review result via `updateResult({ aiReview })`.
 */
export const ToolCallReviewer = Symbol('ToolCallReviewer');

export interface ToolCallReviewer {
    /** Whether this reviewer is responsible for the given tool call (parse args to decide). */
    canReview(toolId: string, args: string | undefined): boolean;
    /**
     * Performs the review. Resolves with `undefined` when no result is available
     * (disabled, failure, timeout) — the confirmation flow then proceeds unchanged.
     */
    review(toolId: string, args: string | undefined, cancellationToken: CancellationToken): Promise<ToolCallReview | undefined>;
}

/**
 * Payload written to a tool call's result via `updateResult` so confirmation UIs can render the
 * review state. `pending` shows an "AI reviewing" indicator, `done` carries the verdict.
 */
export interface AiReviewInfo {
    status: 'pending' | 'done';
    verdict?: 'safe' | 'risky';
    purpose?: string;
    risks?: string[];
}

export namespace AiReviewInfo {
    export function is(obj: unknown): obj is AiReviewInfo {
        return !!obj && typeof obj === 'object' &&
            'status' in obj && typeof (obj as AiReviewInfo).status === 'string' &&
            ((obj as AiReviewInfo).status === 'pending' || (obj as AiReviewInfo).status === 'done');
    }
}

/** Extracts the review payload from a tool call result object, if present. */
export function getAiReviewOfResult(result: unknown): AiReviewInfo | undefined {
    if (!!result && typeof result === 'object' && 'aiReview' in result) {
        const review = (result as { aiReview?: unknown }).aiReview;
        if (AiReviewInfo.is(review)) {
            return review;
        }
    }
    return undefined;
}
