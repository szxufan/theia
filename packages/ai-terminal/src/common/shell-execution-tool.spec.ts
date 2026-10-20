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

import { expect } from 'chai';
import {
    combineAndTruncate,
    truncateLine,
    selectOutputLines,
    splitOutputLines,
    HEAD_LINES,
    TAIL_LINES,
    GRACE_LINES,
    MAX_LINE_LENGTH,
    DEFAULT_READ_MAX_LINES
} from './shell-execution-server';

describe('Shell Execution Tool', () => {
    describe('combineAndTruncate', () => {
        it('should return stdout when no stderr', () => {
            const result = combineAndTruncate('stdout content', '');
            expect(result).to.equal('stdout content');
        });

        it('should return stderr when no stdout', () => {
            const result = combineAndTruncate('', 'stderr content');
            expect(result).to.equal('stderr content');
        });

        it('should combine stdout and stderr with separator', () => {
            const result = combineAndTruncate('stdout content', 'stderr content');
            expect(result).to.equal('stdout content\n--- stderr ---\nstderr content');
        });

        it('should return empty string when both are empty', () => {
            const result = combineAndTruncate('', '');
            expect(result).to.equal('');
        });

        it('should not truncate output within grace area', () => {
            const lineCount = HEAD_LINES + TAIL_LINES + GRACE_LINES;
            const lines = Array.from({ length: lineCount }, (_, i) => `line ${i + 1}`);
            const stdout = lines.join('\n');
            const result = combineAndTruncate(stdout, '');
            expect(result).to.not.include('lines omitted');
            expect(result.split('\n').length).to.equal(lineCount);
        });

        it('should truncate output exceeding grace area', () => {
            const lineCount = HEAD_LINES + TAIL_LINES + GRACE_LINES + 1;
            const lines = Array.from({ length: lineCount }, (_, i) => `line ${i + 1}`);
            const stdout = lines.join('\n');
            const result = combineAndTruncate(stdout, '');
            expect(result).to.include('lines omitted');
        });

        it('should truncate long lines in output', () => {
            const longLine = 'x'.repeat(MAX_LINE_LENGTH + 500);
            const result = combineAndTruncate(longLine, '');
            expect(result).to.include('chars omitted');
            expect(result.length).to.be.lessThan(longLine.length);
        });
    });

    describe('truncateLine', () => {
        it('should not truncate short lines', () => {
            const line = 'short line';
            expect(truncateLine(line)).to.equal(line);
        });

        it('should not truncate lines at exactly MAX_LINE_LENGTH', () => {
            const line = 'x'.repeat(MAX_LINE_LENGTH);
            expect(truncateLine(line)).to.equal(line);
        });

        it('should truncate lines exceeding MAX_LINE_LENGTH', () => {
            const line = 'x'.repeat(MAX_LINE_LENGTH + 100);
            const result = truncateLine(line);
            expect(result).to.include('chars omitted');
            expect(result.length).to.be.lessThan(line.length);
        });

        it('should preserve start and end of truncated lines', () => {
            const start = 'START_';
            const end = '_END';
            const middle = 'x'.repeat(MAX_LINE_LENGTH + 100);
            const line = start + middle + end;
            const result = truncateLine(line);
            expect(result.startsWith(start)).to.be.true;
            expect(result.endsWith(end)).to.be.true;
        });
    });

    describe('splitOutputLines', () => {
        it('splits on newlines and normalizes CRLF', () => {
            expect(splitOutputLines('a\nb\r\nc')).to.deep.equal(['a', 'b', 'c']);
        });
        it('drops the empty line produced by a single trailing newline', () => {
            expect(splitOutputLines('a\nb\n')).to.deep.equal(['a', 'b']);
        });
        it('keeps empty lines in the middle and handles empty text', () => {
            expect(splitOutputLines('a\n\nb')).to.deep.equal(['a', '', 'b']);
            expect(splitOutputLines('')).to.deep.equal([]);
        });
    });

    describe('selectOutputLines', () => {
        const text = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');

        it('returns all lines with original numbers when no options are given', () => {
            const result = selectOutputLines(text, {});
            expect(result).to.not.have.property('error');
            expect((result as { output: string }).output).to.equal(
                Array.from({ length: 10 }, (_, i) => `${i + 1}| line ${i + 1}`).join('\n'));
            expect((result as { totalLines: number }).totalLines).to.equal(10);
            expect((result as { startLine: number }).startLine).to.equal(1);
            expect((result as { endLine: number }).endLine).to.equal(10);
            expect((result as { hasMore: boolean }).hasMore).to.be.false;
            expect((result as { matchedLines?: number }).matchedLines).to.be.undefined;
        });

        it('head keeps the first N lines', () => {
            const result = selectOutputLines(text, { head: 3 }) as { output: string; endLine: number };
            expect(result.output).to.equal('1| line 1\n2| line 2\n3| line 3');
            expect(result.endLine).to.equal(3);
        });

        it('tail keeps the last N lines with original numbering', () => {
            const result = selectOutputLines(text, { tail: 2 }) as { output: string; startLine: number };
            expect(result.output).to.equal('9| line 9\n10| line 10');
            expect(result.startLine).to.equal(9);
        });

        it('fromLine/toLine select an inclusive 1-based range', () => {
            const result = selectOutputLines(text, { fromLine: 4, toLine: 6 }) as { output: string };
            expect(result.output).to.equal('4| line 4\n5| line 5\n6| line 6');
        });

        it('fromLine alone reads to the end', () => {
            const result = selectOutputLines(text, { fromLine: 8 }) as { output: string };
            expect(result.output).to.equal('8| line 8\n9| line 9\n10| line 10');
        });

        it('filter keeps matching lines with original numbering and reports matchedLines', () => {
            const result = selectOutputLines(text, { filter: '^line [135]$' }) as {
                output: string; matchedLines: number;
            };
            expect(result.output).to.equal('1| line 1\n3| line 3\n5| line 5');
            expect(result.matchedLines).to.equal(3);
        });

        it('filter combines with head and tail on the filtered view', () => {
            const withHead = selectOutputLines(text, { filter: '^line [1-5]$', head: 2 }) as { output: string };
            expect(withHead.output).to.equal('1| line 1\n2| line 2');
            const withTail = selectOutputLines(text, { filter: '^line [1-5]$', tail: 2 }) as { output: string };
            expect(withTail.output).to.equal('4| line 4\n5| line 5');
        });

        it('maxLines caps the selection and sets hasMore for pagination', () => {
            const result = selectOutputLines(text, { maxLines: 4 }) as { output: string; hasMore: boolean; endLine: number };
            expect(result.output.split('\n')).to.have.lengthOf(4);
            expect(result.hasMore).to.be.true;
            expect(result.endLine).to.equal(4);

            // Continuing from endLine + 1 yields the remaining lines.
            const page2 = selectOutputLines(text, { fromLine: 5 }) as { output: string; hasMore: boolean };
            expect(page2.output.split('\n')).to.have.lengthOf(6);
            expect(page2.hasMore).to.be.false;
        });

        it('defaults maxLines to the standard read budget', () => {
            const manyLines = Array.from({ length: DEFAULT_READ_MAX_LINES + 50 }, (_, i) => `l${i}`).join('\n');
            const result = selectOutputLines(manyLines, {}) as { output: string; hasMore: boolean };
            expect(result.output.split('\n')).to.have.lengthOf(DEFAULT_READ_MAX_LINES);
            expect(result.hasMore).to.be.true;
        });

        it('reports an empty selection with zero line markers instead of an error', () => {
            const result = selectOutputLines(text, { filter: 'no-such-line' }) as {
                output: string; startLine: number; endLine: number; totalLines: number; matchedLines: number;
            };
            expect(result.output).to.equal('');
            expect(result.startLine).to.equal(0);
            expect(result.endLine).to.equal(0);
            expect(result.totalLines).to.equal(10);
            expect(result.matchedLines).to.equal(0);
        });

        it('truncates overlong lines in the formatted output', () => {
            const longLine = 'y'.repeat(MAX_LINE_LENGTH + 100);
            const result = selectOutputLines(longLine, {}) as { output: string };
            expect(result.output).to.include('chars omitted');
        });

        it('normalizes CRLF line endings', () => {
            const result = selectOutputLines('a\r\nb\r\nc', { tail: 1 }) as { output: string };
            expect(result.output).to.equal('3| c');
        });

        it('rejects combining multiple window selectors', () => {
            const headAndTail = selectOutputLines(text, { head: 2, tail: 2 }) as { error: string };
            expect(headAndTail.error).to.include('at most one window');
            const headAndRange = selectOutputLines(text, { head: 2, fromLine: 1 }) as { error: string };
            expect(headAndRange.error).to.include('at most one window');
            const tailAndRange = selectOutputLines(text, { tail: 2, toLine: 5 }) as { error: string };
            expect(tailAndRange.error).to.include('at most one window');
        });

        it('rejects inverted ranges and non-positive counts', () => {
            const inverted = selectOutputLines(text, { fromLine: 5, toLine: 2 }) as { error: string };
            expect(inverted.error).to.include('toLine');
            const zero = selectOutputLines(text, { head: 0 }) as { error: string };
            expect(zero.error).to.include('positive integer');
            const negative = selectOutputLines(text, { fromLine: -1 }) as { error: string };
            expect(negative.error).to.include('positive integer');
        });

        it('rejects an invalid filter regex with a helpful message', () => {
            const result = selectOutputLines(text, { filter: '(' }) as { error: string };
            expect(result.error).to.include('Invalid "filter" regex');
        });
    });
});
