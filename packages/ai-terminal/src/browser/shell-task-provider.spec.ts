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

import { expect } from 'chai';
import { Container } from '@theia/core/shared/inversify';
import { ShellExecutionServer, ShellTaskOutput, ShellTaskStatus } from '../common/shell-execution-server';
import { ShellTaskProvider } from './shell-task-provider';

describe('ShellTaskProvider', () => {

    let provider: ShellTaskProvider;
    let statuses: ShellTaskStatus[];
    let outputs: Map<string, string>;
    let stopped: string[];

    beforeEach(() => {
        statuses = [];
        outputs = new Map();
        stopped = [];
        const container = new Container();
        container.bind(ShellExecutionServer).toConstantValue({
            listTasks: async () => statuses,
            readOutput: async (taskId: string, fromOffset: number): Promise<ShellTaskOutput> => {
                const output = outputs.get(taskId) ?? '';
                return { output: output.substring(fromOffset), offset: output.length, eof: true };
            },
            stop: async (taskId: string) => {
                stopped.push(taskId);
                return true;
            }
        } as unknown as ShellExecutionServer);
        container.bind(ShellTaskProvider).toSelf();
        provider = container.get(ShellTaskProvider);
    });

    it('maps running, completed and failed tasks', async () => {
        statuses = [
            { taskId: 't1', command: 'npm run dev', running: true, exitCode: undefined, startedAt: 1, finishedAt: undefined },
            { taskId: 't2', command: 'npm test', running: false, exitCode: 0, startedAt: 1, finishedAt: 2 },
            { taskId: 't3', command: 'npm build', running: false, exitCode: 1, startedAt: 1, finishedAt: 2 },
            { taskId: 't4', command: 'npm crash', running: false, exitCode: undefined, startedAt: 1, finishedAt: 2, error: 'boom' }
        ];

        const tasks = await provider.listTasks();
        expect(tasks.map(task => task.state)).to.deep.equal(['running', 'completed', 'error', 'error']);
        expect(tasks[0].title).to.equal('npm run dev');
        expect(tasks[1].detail).to.include('0');
    });

    it('detects a local preview URL from the task output', async () => {
        statuses = [{ taskId: 't1', command: 'vite', running: true, exitCode: undefined, startedAt: 1, finishedAt: undefined }];
        outputs.set('t1', 'VITE v5 ready in 300 ms\n➜  Local:   http://localhost:5173/\n');

        const tasks = await provider.listTasks();
        expect(tasks[0].previewUrl).to.equal('http://localhost:5173/');
    });

    it('returns the output tail for the 查看输出 action', async () => {
        outputs.set('t1', 'a'.repeat(20000));
        const output = await provider.readOutput('t1');
        expect(output).to.have.lengthOf(8192);
    });

    it('stops a task through the shell server', async () => {
        await provider.stopTask('t1');
        expect(stopped).to.deep.equal(['t1']);
    });
});
