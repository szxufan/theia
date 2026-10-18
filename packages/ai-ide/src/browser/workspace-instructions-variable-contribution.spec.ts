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

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { expect } from 'chai';
import { URI, Emitter } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangeType } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import {
    WORKSPACE_INSTRUCTIONS_MAX_TOTAL_CHARS,
    WORKSPACE_INSTRUCTIONS_VARIABLE,
    WorkspaceInstructionsVariableContribution
} from './workspace-instructions-variable-contribution';

disableJSDOM();

describe('WorkspaceInstructionsVariableContribution', () => {

    let contribution: WorkspaceInstructionsVariableContribution;
    let files: Map<string, string>;
    let readCounts: Map<string, number>;
    let existsCounts: Map<string, number>;
    let fileChangeEmitter: Emitter<{ uri: string; type: FileChangeType }>;
    let roots: URI[];

    beforeEach(() => {
        files = new Map();
        readCounts = new Map();
        existsCounts = new Map();
        fileChangeEmitter = new Emitter();
        roots = [new URI('file:///workspace/project-a')];

        const fileService = {
            exists: async (uri: URI) => {
                const key = uri.toString();
                existsCounts.set(key, (existsCounts.get(key) ?? 0) + 1);
                return files.has(key);
            },
            readFile: async (uri: URI) => {
                const key = uri.toString();
                if (!files.has(key)) {
                    throw new Error('File not found: ' + key);
                }
                readCounts.set(key, (readCounts.get(key) ?? 0) + 1);
                return { value: files.get(key) };
            },
            onDidFilesChange: fileChangeEmitter.event
        } as unknown as FileService;

        const container = new Container();
        container.bind(FileService).toConstantValue(fileService);
        container.bind(WorkspaceService).toConstantValue({
            tryGetRoots: () => roots.map(root => ({ resource: root })),
            onWorkspaceChanged: () => ({ dispose: () => { } })
        } as unknown as WorkspaceService);
        container.bind(WorkspaceInstructionsVariableContribution).toSelf();

        contribution = container.get(WorkspaceInstructionsVariableContribution);
    });

    const resolve = async () => {
        const resolved = await contribution.resolve({ variable: WORKSPACE_INSTRUCTIONS_VARIABLE }, {} as never);
        return resolved?.value ?? '';
    };

    const fireChange = (uri: string, type: FileChangeType): void => {
        fileChangeEmitter.fire({
            contains: (candidate: URI, t?: FileChangeType) => candidate.toString() === uri && (t === undefined || t === type)
        } as never);
    };

    const setFile = (root: URI, name: string, content: string): void => {
        files.set(root.resolve(name).toString(), content);
    };

    it('prefers AGENTS.md over AGENT.md and CLAUDE.md', async () => {
        const root = roots[0];
        setFile(root, 'CLAUDE.md', 'claude-wins');
        setFile(root, 'AGENT.md', 'agent-wins');
        setFile(root, 'AGENTS.md', 'agents-wins');
        const value = await resolve();
        expect(value).to.contain('agents-wins');
        expect(value).to.not.contain('agent-wins');
        expect(value).to.not.contain('claude-wins');
    });

    it('falls back to AGENT.md then CLAUDE.md', async () => {
        const root = roots[0];
        setFile(root, 'CLAUDE.md', 'claude-wins');
        expect((await resolve())).to.contain('claude-wins');

        files.clear();
        setFile(root, 'AGENT.md', 'agent-wins');
        contribution['cachedEntries'].clear();
        expect((await resolve())).to.contain('agent-wins');
    });

    it('returns an empty value when no instruction file exists', async () => {
        expect(await resolve()).to.equal('');
    });

    it('labels each root section in a multi-root workspace', async () => {
        roots = [new URI('file:///workspace/project-a'), new URI('file:///workspace/project-b')];
        setFile(roots[0], 'AGENTS.md', 'instructions of a');
        setFile(roots[1], 'AGENTS.md', 'instructions of b');
        const value = await resolve();
        expect(value).to.contain('project-a/AGENTS.md');
        expect(value).to.contain('instructions of a');
        expect(value).to.contain('project-b/AGENTS.md');
        expect(value).to.contain('instructions of b');
    });

    it('truncates the total content and marks the cut', async () => {
        setFile(roots[0], 'AGENTS.md', 'x'.repeat(WORKSPACE_INSTRUCTIONS_MAX_TOTAL_CHARS + 100));
        const value = await resolve();
        expect(value.length).to.be.lessThan(WORKSPACE_INSTRUCTIONS_MAX_TOTAL_CHARS + 500);
        expect(value).to.contain('已截断');
    });

    it('caches file contents across resolutions', async () => {
        setFile(roots[0], 'AGENTS.md', 'cached content');
        await resolve();
        await resolve();
        expect(readCounts.get(roots[0].resolve('AGENTS.md').toString())).to.equal(1);
    });

    it('re-reads a file after it changed on disk', async () => {
        const key = roots[0].resolve('AGENTS.md').toString();
        files.set(key, 'first');
        expect(await resolve()).to.contain('first');

        files.set(key, 'second');
        fireChange(key, FileChangeType.UPDATED);
        expect(await resolve()).to.contain('second');
        expect(readCounts.get(key)).to.equal(2);
    });

    it('drops a deleted file from the result', async () => {
        const key = roots[0].resolve('AGENTS.md').toString();
        files.set(key, 'to be deleted');
        expect(await resolve()).to.contain('to be deleted');

        files.delete(key);
        fireChange(key, FileChangeType.DELETED);
        expect(await resolve()).to.equal('');
    });

    it('does not resolve other variables', async () => {
        const resolved = await contribution.resolve(
            { variable: { ...WORKSPACE_INSTRUCTIONS_VARIABLE, name: 'somethingElse' } }, {} as never);
        expect(resolved).to.be.undefined;
    });
});
