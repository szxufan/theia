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
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
try { FrontendApplicationConfigProvider.set({}); } catch { /* 已由其他 spec 设置 */ }

import { expect } from 'chai';
import { URI } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { QuickFileSelectService } from '@theia/file-search/lib/browser/quick-file-select-service';
import { QuickInputService } from '@theia/core';
import { AIVariableResolutionRequest, AIVariableContext } from '@theia/ai-core/lib/common/variable-service';
import {
    FOLDER_VARIABLE,
    WORKSPACE_VARIABLE,
    WorkspaceChatVariableContribution
} from './workspace-chat-variable-contribution';

interface TestStat {
    name: string;
    isDirectory: boolean;
    resource: URI;
    children?: TestStat[];
}

function stat(name: string, root: URI, isDirectory = false, children: TestStat[] = []): TestStat {
    return { name, isDirectory, resource: root.resolve(name), children };
}

describe('WorkspaceChatVariableContribution', () => {

    let contribution: WorkspaceChatVariableContribution;
    let resolveResults: Map<string, TestStat>;
    let existsResults: Set<string>;
    let roots: URI[];

    beforeEach(() => {
        resolveResults = new Map();
        existsResults = new Set();
        roots = [new URI('file:///workspace')];

        const container = new Container();
        container.bind(FileService).toConstantValue({
            resolve: async (uri: URI) => {
                const result = resolveResults.get(uri.toString());
                if (!result) {
                    throw new Error('Not Found: ' + uri.toString());
                }
                return result;
            },
            exists: async (uri: URI) => existsResults.has(uri.toString())
        } as unknown as FileService);
        container.bind(WorkspaceService).toConstantValue({
            tryGetRoots: () => roots.map(resource => ({ resource })),
            getRootPrefixedPath: (uri: URI) => {
                const path = uri.path.toString();
                if (path === '/workspace') {
                    return 'ws';
                }
                return 'ws' + path.replace(/^\/workspace/, '');
            }
        } as unknown as WorkspaceService);
        container.bind(QuickInputService).toConstantValue({} as QuickInputService);
        container.bind(QuickFileSelectService).toConstantValue({} as QuickFileSelectService);
        container.bind(WorkspaceChatVariableContribution).toSelf();

        contribution = container.get(WorkspaceChatVariableContribution);
    });

    const context = {} as AIVariableContext;
    const request = (variable: typeof WORKSPACE_VARIABLE | typeof FOLDER_VARIABLE, arg?: string): AIVariableResolutionRequest =>
        ({ variable, arg });

    it('only resolves its own variables', async () => {
        expect(await contribution.canResolve(request(WORKSPACE_VARIABLE), context)).to.equal(1);
        expect(await contribution.canResolve(request(FOLDER_VARIABLE), context)).to.equal(1);
        expect(await contribution.canResolve(request({ ...WORKSPACE_VARIABLE, name: 'other' }), context)).to.equal(0);
    });

    it('resolves #workspace to a directory overview of all roots', async () => {
        const root = new URI('file:///workspace');
        const src = root.resolve('src');
        resolveResults.set(src.toString(), {
            name: 'src', isDirectory: true, resource: src,
            children: [stat('main.ts', src)]
        });
        resolveResults.set(root.toString(), {
            name: 'workspace', isDirectory: true, resource: root,
            children: [
                stat('src', root, true),
                stat('readme.md', root)
            ]
        });

        const resolved = await contribution.resolve(request(WORKSPACE_VARIABLE), context);
        expect(resolved?.contextValue).to.equal('ws\nsrc/\n  main.ts\nreadme.md');
    });

    it('returns undefined for #workspace without workspace roots', async () => {
        roots = [];
        expect(await contribution.resolve(request(WORKSPACE_VARIABLE), context)).to.be.undefined;
    });

    it('resolves #folder by workspace-relative path and lists deeper levels', async () => {
        const src = new URI('file:///workspace/src');
        const components = src.resolve('components');
        resolveResults.set(components.toString(), {
            name: 'components', isDirectory: true, resource: components,
            children: [stat('button.tsx', components)]
        });
        resolveResults.set(src.toString(), {
            name: 'src', isDirectory: true, resource: src,
            children: [
                stat('components', src, true),
                stat('index.ts', src)
            ]
        });
        existsResults.add(src.toString());

        // 根目录名为 workspace，按「根名/相对路径」形式解析
        const resolved = await contribution.resolve(request(FOLDER_VARIABLE, 'workspace/src'), context);
        expect(resolved?.value).to.equal('ws/src');
        expect(resolved?.contextValue).to.equal('ws/src\ncomponents/\n  button.tsx\nindex.ts');
    });

    it('returns undefined for #folder when the argument cannot be resolved', async () => {
        expect(await contribution.resolve(request(FOLDER_VARIABLE, 'ws/missing'), context)).to.be.undefined;
        expect(await contribution.resolve(request(FOLDER_VARIABLE), context)).to.be.undefined;
    });

    it('truncates oversized trees and appends a note', async () => {
        const root = new URI('file:///workspace');
        resolveResults.set(root.toString(), {
            name: 'workspace', isDirectory: true, resource: root,
            children: Array.from({ length: 600 }, (_, i) => stat(`file-${i}.txt`, root))
        });

        const resolved = await contribution.resolve(request(WORKSPACE_VARIABLE), context);
        const lines = (resolved?.contextValue ?? '').split('\n');
        expect(lines).to.have.lengthOf(502); // 根标题 + 500 个条目 + 截断说明
        expect(lines[lines.length - 1]).to.include('已截断');
    });
});
