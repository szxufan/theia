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

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
enableJSDOM();

import { expect } from 'chai';
import {
    MarkdownChatResponseContentImpl,
    ToolCallChatResponseContentImpl
} from '@theia/ai-chat/lib/common';
import { chunkResponseContent, summarizeToolCalls } from './tool-call-group';

function toolCall(name: string, finished = true, denied = false): ToolCallChatResponseContentImpl {
    return new ToolCallChatResponseContentImpl(
        `call-${name}`, name, '{}', finished,
        denied ? { denied: true, reason: '测试拒绝' } : undefined
    );
}

describe('tool-call-group', () => {

    describe('chunkResponseContent', () => {

        it('groups consecutive finished tool call runs of two or more', () => {
            const chunks = chunkResponseContent([
                new MarkdownChatResponseContentImpl('开头'),
                toolCall('writeFileContent'),
                toolCall('shellExecute'),
                new MarkdownChatResponseContentImpl('中间说明'),
            ]);

            expect(chunks).to.have.lengthOf(3);
            expect(chunks[0].kind).to.equal('single');
            expect(chunks[1]).to.deep.include({ kind: 'toolCalls', startIndex: 1 });
            expect(chunks[1].kind === 'toolCalls' && chunks[1].contents).to.have.lengthOf(2);
            expect(chunks[2].kind).to.equal('single');
        });

        it('keeps runs with unfinished calls ungrouped so progress stays visible', () => {
            const chunks = chunkResponseContent([
                toolCall('writeFileContent'),
                toolCall('shellExecute', false),
            ]);

            expect(chunks.map(chunk => chunk.kind)).to.deep.equal(['single', 'single']);
        });

        it('keeps a lone finished tool call as a single chunk', () => {
            const chunks = chunkResponseContent([
                toolCall('writeFileContent'),
                new MarkdownChatResponseContentImpl('结尾'),
            ]);

            expect(chunks.map(chunk => chunk.kind)).to.deep.equal(['single', 'single']);
        });

        it('preserves original indices for single chunks', () => {
            const chunks = chunkResponseContent([
                toolCall('writeFileContent'),
                toolCall('shellExecute'),
                toolCall('shellExecute'),
            ]);

            expect(chunks).to.have.lengthOf(1);
            expect(chunks[0].kind === 'toolCalls' && chunks[0].startIndex).to.equal(0);
        });
    });

    describe('summarizeToolCalls', () => {

        it('counts calls and aggregates per-tool counts', () => {
            const summary = summarizeToolCalls([
                toolCall('writeFileContent'),
                toolCall('shellExecute'),
                toolCall('shellExecute'),
            ]);

            expect(summary).to.equal('已执行 3 次工具调用 · writeFileContent、shellExecute ×2');
        });

        it('appends a denial count when calls were denied', () => {
            const summary = summarizeToolCalls([
                toolCall('writeFileContent', true, true),
                toolCall('writeFileContent'),
            ]);

            expect(summary).to.equal('已执行 2 次工具调用 · writeFileContent ×2 · 拒绝 1');
        });
    });
});
