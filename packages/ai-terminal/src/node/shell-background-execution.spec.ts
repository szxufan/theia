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
import { ShellExecutionServerImpl } from './shell-execution-server-impl';

describe('ShellExecutionServerImpl background tasks', () => {

    let server: ShellExecutionServerImpl;

    beforeEach(() => {
        server = new ShellExecutionServerImpl();
    });

    /** Waits until the task finished, at the latest after `timeoutMs`. */
    async function waitForFinish(taskId: string, timeoutMs = 10000): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const status = await server.getStatus(taskId);
            if (status && !status.running) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Task did not finish in time');
    }

    it('starts a command in the background and reports its completion', async () => {
        const { taskId } = await server.start({ command: `"${process.execPath}" -e "console.log('hello background')"` });
        expect(taskId).to.be.a('string');

        await waitForFinish(taskId);
        const status = await server.getStatus(taskId);
        expect(status!.running).to.be.false;
        expect(status!.exitCode).to.equal(0);

        const output = await server.readOutput(taskId, 0);
        expect(output.output).to.contain('hello background');
        expect(output.eof).to.be.true;
    });

    it('reads output incrementally by offset', async () => {
        const { taskId } = await server.start({ command: `"${process.execPath}" -e "console.log('first'); console.log('second')"` });
        await waitForFinish(taskId);

        const first = await server.readOutput(taskId, 0);
        expect(first.output).to.contain('first');
        expect(first.output).to.contain('second');
        expect(first.eof).to.be.true;

        const rest = await server.readOutput(taskId, first.offset);
        expect(rest.output).to.equal('');
        expect(rest.eof).to.be.true;
    });

    it('stops a running task', async () => {
        const { taskId } = await server.start({
            command: `"${process.execPath}" -e "console.log('started'); setTimeout(() => {}, 60000)"`
        });
        // Wait until the process has produced output, so we know it is running.
        let output = '';
        for (let i = 0; i < 50 && !output; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            output = (await server.readOutput(taskId, 0)).output;
        }
        expect(output).to.contain('started');

        expect(await server.stop(taskId)).to.be.true;
        await waitForFinish(taskId);
        const status = await server.getStatus(taskId);
        expect(status!.running).to.be.false;
        expect(status!.error).to.not.be.undefined;

        // Stopping again reports false; the task is no longer running.
        expect(await server.stop(taskId)).to.be.false;
    });

    it('reports unknown task ids', async () => {
        expect(await server.getStatus('does-not-exist')).to.be.undefined;
        try {
            await server.readOutput('does-not-exist', 0);
            expect.fail('readOutput should have thrown');
        } catch (error) {
            expect((error as Error).message).to.contain('does-not-exist');
        }
        expect(await server.stop('does-not-exist')).to.be.false;
    });

    it('rejects a non-absolute cwd', async () => {
        try {
            await server.start({ command: 'echo hi', cwd: 'relative/path' });
            expect.fail('start should have thrown');
        } catch (error) {
            expect((error as Error).message).to.contain('non-absolute cwd');
        }
    });

    describe('readTaskOutputLines', () => {
        it('reads background task output with line options and eof', async () => {
            const { taskId } = await server.start({
                command: `"${process.execPath}" -e "console.log('alpha'); console.log('beta'); console.error('gamma')"`
            });
            await waitForFinish(taskId);

            // Combined stream: alpha, beta, '--- stderr ---', gamma.
            const tail = await server.readTaskOutputLines(taskId, { tail: 3 });
            expect(tail).to.not.have.property('error');
            expect((tail as { output: string }).output).to.contain('beta');
            expect((tail as { output: string }).output).to.contain('gamma');
            expect((tail as { eof: boolean }).eof).to.be.true;

            const stderrOnly = await server.readTaskOutputLines(taskId, { stream: 'stderr' });
            expect((stderrOnly as { output: string }).output).to.contain('gamma');
            expect((stderrOnly as { output: string }).output).to.not.contain('alpha');
        });

        it('reports an error object for unknown task ids', async () => {
            const result = await server.readTaskOutputLines('does-not-exist', { tail: 5 });
            expect((result as { error: string }).error).to.contain('does-not-exist');
        });
    });

    describe('completed execution reads', () => {
        const SCRIPT = `"${process.execPath}" -e "for (let i = 1; i <= 30; i++) { console.log('row ' + i); }"`;

        it('retains finished executions and reads them by id with all options', async () => {
            const result = await server.execute({ command: SCRIPT, executionId: 'exec-1' });
            expect(result.success).to.be.true;
            expect(result.totalLines).to.equal(30);
            expect(result.truncated).to.be.false;

            const head = await server.readResult('exec-1', { head: 3 });
            expect((head as { output: string }).output).to.equal('1| row 1\n2| row 2\n3| row 3');

            const tail = await server.readResult('exec-1', { tail: 2 });
            expect((tail as { output: string }).output).to.equal('29| row 29\n30| row 30');

            const range = await server.readResult('exec-1', { fromLine: 10, toLine: 12 });
            expect((range as { output: string }).output).to.equal('10| row 10\n11| row 11\n12| row 12');

            const filtered = await server.readResult('exec-1', { filter: '^row 12$' });
            expect((filtered as { output: string }).output).to.equal('12| row 12');
            expect((filtered as { matchedLines: number }).matchedLines).to.equal(1);
        });

        it('marks results truncated when the preview would drop lines', async () => {
            const longScript = `"${process.execPath}" -e "for (let i = 1; i <= 300; i++) { console.log('r' + i); }"`;
            const result = await server.execute({ command: longScript, executionId: 'exec-long' });
            expect(result.totalLines).to.equal(300);
            expect(result.truncated).to.be.true;

            const page1 = await server.readResult('exec-long', { maxLines: 100 }) as { output: string; hasMore: boolean; endLine: number };
            expect(page1.hasMore).to.be.true;
            expect(page1.endLine).to.equal(100);
            const page2 = await server.readResult('exec-long', { fromLine: 101 }) as { output: string; hasMore: boolean };
            expect(page2.hasMore).to.be.false;
            expect(page2.output).to.contain('300| r300');
        });

        it('evicts the oldest results beyond the retention cap', async function (): Promise<void> {
            this.timeout(30000); // spawns 11 real node processes sequentially
            for (let i = 0; i < 11; i++) {
                await server.execute({ command: `"${process.execPath}" -e "console.log(${i})"`, executionId: `evict-${i}` });
            }
            const oldest = await server.readResult('evict-0', {});
            expect((oldest as { error: string }).error).to.contain('evict-0');
            const newest = await server.readResult('evict-10', { head: 1 });
            expect((newest as { output: string }).output).to.contain('10');
        });

        it('reports an error object for unknown result ids', async () => {
            const result = await server.readResult('never-ran', {});
            expect((result as { error: string }).error).to.contain('never-ran');
        });

        it('rejects invalid read options with an error object instead of throwing', async () => {
            await server.execute({ command: `"${process.execPath}" -e "console.log('x')"`, executionId: 'exec-opts' });
            const result = await server.readResult('exec-opts', { head: 1, tail: 1 });
            expect((result as { error: string }).error).to.include('at most one window');
        });
    });
});
