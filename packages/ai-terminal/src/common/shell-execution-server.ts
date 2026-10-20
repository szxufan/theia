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

export const SHELL_EXECUTION_FUNCTION_ID = 'shellExecute';
export const SHELL_EXECUTE_BACKGROUND_FUNCTION_ID = 'shellExecuteBackground';

export const ShellExecutionServer = Symbol('ShellExecutionServer');
export const shellExecutionPath = '/services/shell-execution';

export interface ShellExecutionRequest {
    command: string;
    /** Working directory. Resolved to an absolute path on the frontend before sending to the backend. */
    cwd?: string;
    timeout?: number; // milliseconds
    /** Unique ID for this execution, used for cancellation */
    executionId?: string;
}

export interface ShellExecutionResult {
    success: boolean;
    exitCode: number | undefined;
    stdout: string;
    stderr: string;
    error?: string;
    /** Execution duration in milliseconds */
    duration: number;
    /** Whether the execution was canceled by user action (not timeout) */
    canceled?: boolean;
    /** The resolved working directory where the command was executed */
    resolvedCwd?: string;
    /** Total lines of the combined output; lets the model decide whether a follow-up read is worthwhile. */
    totalLines?: number;
    /** True when the preview handed to the model omits lines/characters (or the 1MB stream cap dropped data). */
    truncated?: boolean;
}

/** A background shell task started via {@link ShellExecutionServer.start}. */
export interface ShellTaskStartRequest {
    command: string;
    /** Working directory. Resolved to an absolute path on the frontend before sending to the backend. */
    cwd?: string;
}

export interface ShellTaskStartResult {
    taskId: string;
}

export interface ShellTaskStatus {
    taskId: string;
    /** The command line this task runs, when known. */
    command?: string;
    running: boolean;
    exitCode: number | undefined;
    /** Epoch milliseconds. */
    startedAt: number;
    /** Epoch milliseconds; undefined while running. */
    finishedAt: number | undefined;
    error?: string;
}

/**
 * Incremental output of a background task: everything written since `fromOffset`, plus the
 * offset to continue reading from. `eof` is `true` once the task finished and all output was read.
 */
export interface ShellTaskOutput {
    output: string;
    offset: number;
    eof: boolean;
}

export interface ShellExecutionServer {
    execute(request: ShellExecutionRequest): Promise<ShellExecutionResult>;
    cancel(executionId: string): Promise<boolean>;

    /**
     * Line-based read of a completed foreground execution's retained output. Unknown ids answer
     * with an error object instead of throwing so the model can self-correct.
     */
    readResult(resultId: string, options?: OutputReadOptions): Promise<ShellOutputReadResult | ShellOutputReadError>;
    /**
     * Line-based read of a background task's accumulated output. Unknown ids answer with an
     * error object instead of throwing so the model can self-correct.
     */
    readTaskOutputLines(taskId: string, options?: OutputReadOptions): Promise<ShellOutputReadResult | ShellOutputReadError>;

    /** Starts a command in the background and returns immediately with a task handle. */
    start(request: ShellTaskStartRequest): Promise<ShellTaskStartResult>;
    getStatus(taskId: string): Promise<ShellTaskStatus | undefined>;
    /** Statuses of all background tasks known to this server (for the AI task panel). */
    listTasks(): Promise<ShellTaskStatus[]>;
    /** Reads combined output (stdout, then stderr) from the given character offset. */
    readOutput(taskId: string, fromOffset: number): Promise<ShellTaskOutput>;
    stop(taskId: string): Promise<boolean>;
}

export interface ShellExecutionToolResult {
    success: boolean;
    exitCode: number | undefined;
    output: string;
    error?: string;
    duration: number;
    cwd?: string;
    /** Handle for re-reading this execution's retained output via the shellExecute "read" action. */
    resultId?: string;
    /** Total lines of the combined output. */
    totalLines?: number;
    /** True when `output` is a truncated preview of the retained output. */
    truncated?: boolean;
    /** Follow-up guidance for the model when the preview was truncated. */
    hint?: string;
}

export interface ShellExecutionCanceledResult {
    canceled: true;
    output?: string;
    duration?: number;
}

export namespace ShellExecutionToolResult {
    export function is(obj: unknown): obj is ShellExecutionToolResult {
        return !!obj && typeof obj === 'object' &&
            'success' in obj && typeof (obj as ShellExecutionToolResult).success === 'boolean' &&
            'duration' in obj && typeof (obj as ShellExecutionToolResult).duration === 'number';
    }
}

export namespace ShellExecutionCanceledResult {
    export function is(obj: unknown): obj is ShellExecutionCanceledResult {
        return !!obj && typeof obj === 'object' &&
            'canceled' in obj && (obj as ShellExecutionCanceledResult).canceled === true;
    }
}

export const HEAD_LINES = 50;
export const TAIL_LINES = 50;
export const GRACE_LINES = 10;
export const MAX_LINE_LENGTH = 1000;

/**
 * Line and line-length budget applied to combined command output. The defaults suit the
 * general-purpose `shellExecute` tool, where output is often a long build or test log and only
 * the beginning and the end carry information. Tools whose output is meaningful as a whole
 * (e.g. a diff) should raise these limits.
 */
export interface OutputTruncationOptions {
    /** Number of leading lines to keep. Default {@link HEAD_LINES}. */
    headLines?: number;
    /** Number of trailing lines to keep. Default {@link TAIL_LINES}. */
    tailLines?: number;
    /** Extra lines tolerated before truncation kicks in at all. Default {@link GRACE_LINES}. */
    graceLines?: number;
    /** Maximum length of a single line before its middle is elided. Default {@link MAX_LINE_LENGTH}. */
    maxLineLength?: number;
}

export function truncateLine(line: string, maxLineLength: number = MAX_LINE_LENGTH): string {
    if (line.length <= maxLineLength) {
        return line;
    }
    const halfLength = Math.floor((maxLineLength - 30) / 2);
    const omittedCount = line.length - halfLength * 2;
    return `${line.slice(0, halfLength)} ... [${omittedCount} chars omitted] ... ${line.slice(-halfLength)}`;
}

export function combineAndTruncate(stdout: string, stderr: string, options?: OutputTruncationOptions): string {
    const head = options?.headLines ?? HEAD_LINES;
    const tail = options?.tailLines ?? TAIL_LINES;
    const grace = options?.graceLines ?? GRACE_LINES;
    const maxLineLength = options?.maxLineLength ?? MAX_LINE_LENGTH;

    const trimmedStdout = stdout.trim();
    const trimmedStderr = stderr.trim();

    let output = trimmedStdout;
    if (trimmedStderr) {
        output = output
            ? `${output}\n--- stderr ---\n${trimmedStderr}`
            : trimmedStderr;
    }

    if (!output) {
        return output;
    }

    const lines = output.split('\n');

    if (lines.length <= head + tail + grace) {
        return lines.map(line => truncateLine(line, maxLineLength)).join('\n');
    }

    const headLines = lines.slice(0, head).map(line => truncateLine(line, maxLineLength));
    const tailLines = lines.slice(-tail).map(line => truncateLine(line, maxLineLength));
    const omittedCount = lines.length - head - tail;

    return [...headLines, `\n... [${omittedCount} lines omitted] ...\n`, ...tailLines].join('\n');
}

/** Default and hard cap for {@link OutputReadOptions.maxLines}. */
export const DEFAULT_READ_MAX_LINES = 200;
export const MAX_READ_LINES = 2000;

/**
 * Line-based selection over retained command output, shared by the read paths of
 * `shellExecute` and `shellExecuteBackground`. The window selectors are mutually exclusive:
 * pick at most one of `head`, `tail`, or the `fromLine`/`toLine` range. `filter` and `maxLines`
 * combine with any window.
 */
export interface OutputReadOptions {
    /** Regex source; only matching lines are kept. Line numbers stay original (grep -n style). */
    filter?: string;
    /** Which stream to read. Default 'combined' (stdout, then a '--- stderr ---' separator, then stderr). */
    stream?: 'combined' | 'stdout' | 'stderr';
    /** First N lines of the (filtered) view. */
    head?: number;
    /** Last N lines of the (filtered) view. */
    tail?: number;
    /** Start of a 1-based inclusive range on original line numbers. */
    fromLine?: number;
    /** End of a 1-based inclusive range on original line numbers. */
    toLine?: number;
    /** Maximum number of lines returned per read. Default {@link DEFAULT_READ_MAX_LINES}, capped at {@link MAX_READ_LINES}. */
    maxLines?: number;
}

/** A successful line-based read: selected lines plus the metadata needed to paginate. */
export interface ShellOutputReadResult {
    /** The selected lines, each prefixed with its original line number as `N| text`. */
    output: string;
    /** Total lines of the selected stream, before filtering and windowing. */
    totalLines: number;
    /** Number of lines matching `filter`, when a filter was given. */
    matchedLines?: number;
    /** Original line number of the first returned line; 0 when nothing matched. */
    startLine: number;
    /** Original line number of the last returned line; 0 when nothing matched. */
    endLine: number;
    /** True when more lines in the selection were cut off by `maxLines`; continue with `fromLine = endLine + 1`. */
    hasMore: boolean;
    /** Background tasks only: true once the task has finished. */
    eof?: boolean;
}

export namespace ShellOutputReadResult {
    export function is(obj: unknown): obj is ShellOutputReadResult {
        return !!obj && typeof obj === 'object' &&
            'output' in obj && typeof (obj as ShellOutputReadResult).output === 'string' &&
            'totalLines' in obj && typeof (obj as ShellOutputReadResult).totalLines === 'number' &&
            'hasMore' in obj && typeof (obj as ShellOutputReadResult).hasMore === 'boolean';
    }
}

/** An unsuccessful read; returned (not thrown) so the model can correct its arguments. */
export interface ShellOutputReadError {
    error: string;
}

/**
 * Splits output text into lines the way the read paths count them: CRLF is normalized and a
 * single trailing newline does not produce an extra empty line.
 */
export function splitOutputLines(text: string): string[] {
    if (text === '') {
        return [];
    }
    const lines = text.split('\n').map(line => line.endsWith('\r') ? line.slice(0, -1) : line);
    if (lines.length > 1 && lines[lines.length - 1] === '') {
        lines.pop();
    }
    return lines;
}

/**
 * Applies {@link OutputReadOptions} to `text` and returns the selected lines or an error object
 * for invalid combinations (head+tail, range+head/tail, toLine<fromLine, invalid regex, or
 * non-positive counts). Pure; used by the backend for both completed executions and background tasks.
 */
export function selectOutputLines(text: string, options: OutputReadOptions): ShellOutputReadResult | ShellOutputReadError {
    const { filter, head, tail, fromLine, toLine } = options;
    const maxLines = Math.max(1, Math.min(options.maxLines ?? DEFAULT_READ_MAX_LINES, MAX_READ_LINES));

    const hasRange = fromLine !== undefined || toLine !== undefined;
    const windowCount = (head !== undefined ? 1 : 0) + (tail !== undefined ? 1 : 0) + (hasRange ? 1 : 0);
    if (windowCount > 1) {
        return { error: 'Specify at most one window: head, tail, or fromLine/toLine.' };
    }
    for (const [name, value] of [['head', head], ['tail', tail], ['fromLine', fromLine], ['toLine', toLine], ['maxLines', options.maxLines]] as const) {
        if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
            return { error: `"${name}" must be a positive integer (got ${value}).` };
        }
    }
    if (fromLine !== undefined && toLine !== undefined && toLine < fromLine) {
        return { error: `"toLine" (${toLine}) must not be smaller than "fromLine" (${fromLine}).` };
    }

    let regex: RegExp | undefined;
    if (filter !== undefined) {
        try {
            regex = new RegExp(filter);
        } catch (e) {
            return { error: `Invalid "filter" regex '${filter}': ${e instanceof Error ? e.message : String(e)}` };
        }
    }

    const allLines = splitOutputLines(text);
    let entries = allLines.map((line, index) => ({ n: index + 1, text: line }));
    if (regex) {
        entries = entries.filter(entry => regex.test(entry.text));
    }
    const matchedLines = regex ? entries.length : undefined;

    let window = entries;
    if (hasRange) {
        const from = Math.max(1, fromLine ?? 1);
        const to = toLine ?? Number.MAX_SAFE_INTEGER;
        window = entries.filter(entry => entry.n >= from && entry.n <= to);
    } else if (head !== undefined) {
        window = entries.slice(0, head);
    } else if (tail !== undefined) {
        window = entries.slice(-tail);
    }

    const hasMore = window.length > maxLines;
    const selected = hasMore ? window.slice(0, maxLines) : window;

    return {
        output: selected.map(entry => `${entry.n}| ${truncateLine(entry.text)}`).join('\n'),
        totalLines: allLines.length,
        matchedLines,
        startLine: selected.length > 0 ? selected[0].n : 0,
        endLine: selected.length > 0 ? selected[selected.length - 1].n : 0,
        hasMore
    };
}
