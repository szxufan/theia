// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-v2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { codicon } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import * as React from '@theia/core/shared/react';
import { ChatResponseContent, ToolCallChatResponseContent } from '@theia/ai-chat/lib/common';

export type ResponseContentChunk =
    | { kind: 'single'; content: ChatResponseContent; index: number }
    | { kind: 'toolCalls'; contents: ToolCallChatResponseContent[]; startIndex: number };

/**
 * Splits response content into render chunks: runs of at least two consecutive tool calls that
 * have all finished become one `toolCalls` chunk; everything else is passed through unchanged.
 * Runs containing unfinished calls stay ungrouped so live progress stays visible while streaming.
 */
export function chunkResponseContent(contents: readonly ChatResponseContent[]): ResponseContentChunk[] {
    const chunks: ResponseContentChunk[] = [];
    let i = 0;
    while (i < contents.length) {
        if (ToolCallChatResponseContent.is(contents[i])) {
            let end = i;
            while (end < contents.length && ToolCallChatResponseContent.is(contents[end])) {
                end++;
            }
            const run = contents.slice(i, end) as ToolCallChatResponseContent[];
            if (run.length >= 2 && run.every(call => call.finished)) {
                chunks.push({ kind: 'toolCalls', contents: run, startIndex: i });
            } else {
                for (let k = i; k < end; k++) {
                    chunks.push({ kind: 'single', content: contents[k], index: k });
                }
            }
            i = end;
        } else {
            chunks.push({ kind: 'single', content: contents[i], index: i });
            i++;
        }
    }
    return chunks;
}

/** One-line Chinese summary of a finished tool-call run, e.g. `已执行 3 次工具调用 · writeFileContent ×2、shellExecute · 拒绝 1`. */
export function summarizeToolCalls(contents: readonly ToolCallChatResponseContent[]): string {
    const counts = new Map<string, number>();
    let denied = 0;
    for (const call of contents) {
        const name = call.name ?? '?';
        counts.set(name, (counts.get(name) ?? 0) + 1);
        if (ToolCallChatResponseContent.isDenialResult(call.result)) {
            denied++;
        }
    }
    const parts = [
        nls.localize('theia/ai/chat-ui/toolCallGroup/count', '已执行 {0} 次工具调用', String(contents.length))
    ];
    const breakdown = [...counts.entries()].map(([name, count]) => count > 1 ? `${name} ×${count}` : name).join('、');
    if (breakdown) {
        parts.push(breakdown);
    }
    if (denied > 0) {
        parts.push(nls.localize('theia/ai/chat-ui/toolCallGroup/denied', '拒绝 {0}', String(denied)));
    }
    return parts.join(' · ');
}

interface ToolCallGroupProps {
    contents: ToolCallChatResponseContent[];
    summary: string;
    renderPart: (content: ChatResponseContent) => React.ReactNode;
}

/** Collapsed-by-default container for a finished run of tool calls. */
export const ToolCallGroup: React.FC<ToolCallGroupProps> = ({ contents, summary, renderPart }) => {
    const [open, setOpen] = React.useState(false);
    return <details
        className='theia-toolCall-group'
        open={open}
        onToggle={event => setOpen((event.target as HTMLDetailsElement).open)}>
        <summary>
            <span className={`theia-toolCall-group-icon ${codicon('collapse-all')}`}></span>
            {summary}
        </summary>
        <div className='theia-toolCall-group-items'>
            {contents.map(renderPart)}
        </div>
    </details>;
};
