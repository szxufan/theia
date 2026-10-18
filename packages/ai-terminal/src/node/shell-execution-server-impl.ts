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

import * as path from 'path';
import { injectable } from '@theia/core/shared/inversify';
import { spawn, ChildProcess, execSync } from 'child_process';
import { generateUuid } from '@theia/core';
import {
    ShellExecutionServer, ShellExecutionRequest, ShellExecutionResult,
    ShellTaskOutput, ShellTaskStartRequest, ShellTaskStartResult, ShellTaskStatus
} from '../common/shell-execution-server';

const DEFAULT_TIMEOUT = 120000; // 2 minutes
const MAX_TIMEOUT = 600000;     // 10 minutes
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

interface BackgroundTask {
    process: ChildProcess;
    command: string;
    stdout: string;
    stderr: string;
    startedAt: number;
    finishedAt: number | undefined;
    exitCode: number | undefined;
    error: string | undefined;
}

@injectable()
export class ShellExecutionServerImpl implements ShellExecutionServer {

    protected readonly runningProcesses = new Map<string, ChildProcess>();
    protected readonly canceledExecutions = new Set<string>();
    protected readonly backgroundTasks = new Map<string, BackgroundTask>();

    async execute(request: ShellExecutionRequest): Promise<ShellExecutionResult> {
        const { command, cwd, timeout, executionId } = request;
        if (cwd && !path.isAbsolute(cwd)) {
            throw new Error(
                `Shell execution backend received a non-absolute cwd: '${cwd}'. ` +
                'The frontend must resolve cwd to an absolute path before sending it to the backend.'
            );
        }
        const effectiveTimeout = Math.min(timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT);
        const startTime = Date.now();

        return new Promise<ShellExecutionResult>(resolve => {
            let stdout = '';
            let stderr = '';
            let killed = false;

            const childProcess = spawn(command, [], {
                cwd,
                shell: true,
                detached: process.platform !== 'win32',
                windowsHide: true,
                env: process.env,
            });

            if (executionId) {
                this.runningProcesses.set(executionId, childProcess);
            }

            childProcess.stdout?.on('data', (data: Buffer) => {
                if (stdout.length < MAX_OUTPUT_SIZE) {
                    stdout += data.toString();
                }
            });

            childProcess.stderr?.on('data', (data: Buffer) => {
                if (stderr.length < MAX_OUTPUT_SIZE) {
                    stderr += data.toString();
                }
            });

            const timeoutId = setTimeout(() => {
                killed = true;
                this.killProcessTree(childProcess);
            }, effectiveTimeout);

            childProcess.on('close', (code, signal) => {
                clearTimeout(timeoutId);

                if (executionId) {
                    this.runningProcesses.delete(executionId);
                }

                const duration = Date.now() - startTime;
                const wasCanceledByUser = executionId ? this.canceledExecutions.has(executionId) : false;
                if (executionId) {
                    this.canceledExecutions.delete(executionId);
                }

                if (signal || killed) {
                    if (wasCanceledByUser) {
                        resolve({
                            success: false,
                            exitCode: undefined,
                            stdout,
                            stderr,
                            error: 'Command canceled by user',
                            duration,
                            canceled: true,
                            resolvedCwd: cwd,
                        });
                    } else {
                        resolve({
                            success: false,
                            exitCode: undefined,
                            stdout,
                            stderr,
                            error: `Command timed out after ${effectiveTimeout}ms`,
                            duration,
                            resolvedCwd: cwd,
                        });
                    }
                } else if (code === 0) {
                    resolve({
                        success: true,
                        exitCode: 0,
                        stdout,
                        stderr,
                        duration,
                        resolvedCwd: cwd,
                    });
                } else {
                    resolve({
                        success: false,
                        exitCode: code ?? undefined,
                        stdout,
                        stderr,
                        duration,
                        resolvedCwd: cwd,
                    });
                }
            });

            childProcess.on('error', (error: Error) => {
                clearTimeout(timeoutId);

                if (executionId) {
                    this.runningProcesses.delete(executionId);
                    this.canceledExecutions.delete(executionId);
                }

                resolve({
                    success: false,
                    exitCode: undefined,
                    stdout,
                    stderr,
                    error: error.message,
                    duration: Date.now() - startTime,
                    resolvedCwd: cwd,
                });
            });
        });
    }

    async cancel(executionId: string): Promise<boolean> {
        const childProcess = this.runningProcesses.get(executionId);
        if (childProcess) {
            this.canceledExecutions.add(executionId);
            this.killProcessTree(childProcess);
            this.runningProcesses.delete(executionId);
            return true;
        }
        return false;
    }

    async start(request: ShellTaskStartRequest): Promise<ShellTaskStartResult> {
        const { command, cwd } = request;
        if (cwd && !path.isAbsolute(cwd)) {
            throw new Error(
                `Shell execution backend received a non-absolute cwd: '${cwd}'. ` +
                'The frontend must resolve cwd to an absolute path before sending it to the backend.'
            );
        }
        const taskId = generateUuid();
        const task: BackgroundTask = {
            process: spawn(command, [], {
                cwd,
                shell: true,
                detached: process.platform !== 'win32',
                windowsHide: true,
                env: process.env,
            }),
            command,
            stdout: '',
            stderr: '',
            startedAt: Date.now(),
            finishedAt: undefined,
            exitCode: undefined,
            error: undefined
        };
        this.backgroundTasks.set(taskId, task);
        task.process.stdout?.on('data', (data: Buffer) => {
            if (task.stdout.length < MAX_OUTPUT_SIZE) {
                task.stdout += data.toString();
            }
        });
        task.process.stderr?.on('data', (data: Buffer) => {
            if (task.stderr.length < MAX_OUTPUT_SIZE) {
                task.stderr += data.toString();
            }
        });
        task.process.on('close', (code, signal) => {
            task.finishedAt = Date.now();
            task.exitCode = signal || code === null ? undefined : code;
            if (signal && !task.error) {
                task.error = `Process terminated by signal ${signal}`;
            }
        });
        task.process.on('error', (error: Error) => {
            task.finishedAt = Date.now();
            task.error = error.message;
        });
        return { taskId };
    }

    async getStatus(taskId: string): Promise<ShellTaskStatus | undefined> {
        const task = this.backgroundTasks.get(taskId);
        if (!task) {
            return undefined;
        }
        return {
            taskId,
            command: task.command,
            running: task.finishedAt === undefined,
            exitCode: task.exitCode,
            startedAt: task.startedAt,
            finishedAt: task.finishedAt,
            error: task.error
        };
    }

    async listTasks(): Promise<ShellTaskStatus[]> {
        const statuses = await Promise.all([...this.backgroundTasks.keys()].map(taskId => this.getStatus(taskId)));
        return statuses.filter((status): status is ShellTaskStatus => status !== undefined);
    }

    async readOutput(taskId: string, fromOffset: number): Promise<ShellTaskOutput> {
        const task = this.backgroundTasks.get(taskId);
        if (!task) {
            throw new Error(`No background task with id '${taskId}'.`);
        }
        // Combined view: stdout followed by stderr. Offsets refer to this combined text.
        const combined = task.stderr
            ? `${task.stdout}\n--- stderr ---\n${task.stderr}`
            : task.stdout;
        const offset = Math.max(0, Math.min(fromOffset, combined.length));
        // The returned chunk always reaches the current end of the combined output, so once the
        // task has finished there is nothing more to come.
        return {
            output: combined.substring(offset),
            offset: combined.length,
            eof: task.finishedAt !== undefined
        };
    }

    async stop(taskId: string): Promise<boolean> {
        const task = this.backgroundTasks.get(taskId);
        if (!task || task.finishedAt !== undefined) {
            return false;
        }
        // Record the intent before killing: on Windows, taskkill surfaces as a plain non-zero
        // exit code rather than a signal, so the close handler alone cannot tell kills apart.
        task.error = 'Task stopped by user';
        this.killProcessTree(task.process);
        return true;
    }

    protected killProcessTree(childProcess: ChildProcess): void {
        if (!childProcess.pid) {
            return;
        }

        try {
            if (process.platform === 'win32') {
                execSync(`taskkill /pid ${childProcess.pid} /T /F`, { stdio: 'ignore' });
            } else {
                process.kill(-childProcess.pid, 'SIGTERM');
            }
        } catch {
            try {
                childProcess.kill('SIGKILL');
            } catch {
                // Process may already be dead
            }
        }
    }
}
