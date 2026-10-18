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
});
