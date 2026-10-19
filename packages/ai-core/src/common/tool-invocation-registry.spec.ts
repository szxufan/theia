// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the
// Eclipse Public License v. 2.0 are satisfied: GNU General Public License,
// version 2 with the Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import 'reflect-metadata';

import { expect } from 'chai';
import { ToolInvocationRegistryImpl, ToolProvider } from './tool-invocation-registry';
import { ToolRequest } from './language-model';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';

describe('ToolInvocationRegistryImpl', () => {

    let getToolCalls: number;
    let providers: ToolProvider[];
    let registry: ToolInvocationRegistryImpl;
    let changeEvents: number;

    function tool(id: string): ToolRequest {
        return {
            id,
            name: id,
            providerName: 'test',
            parameters: { type: 'object', properties: {} }
        } as ToolRequest;
    }

    beforeEach(() => {
        getToolCalls = 0;
        changeEvents = 0;
        providers = [
            { getTool: () => { getToolCalls++; return tool('tool-a'); } },
            { getTool: () => { getToolCalls++; return tool('tool-b'); } }
        ];
        registry = new ToolInvocationRegistryImpl();
        const fields = registry as unknown as Record<string, unknown>;
        fields['providers'] = { getContributions: () => providers };
        fields['logger'] = new MockLogger();
        registry.onDidChange(() => changeEvents++);
    });

    it('构造时不解析 ToolProvider（延迟注册，避免构造期循环依赖）', () => {
        expect(getToolCalls).to.equal(0);
    });

    it('首次读取时注册全部工具，且不重复注册', () => {
        const all = registry.getAllFunctions();
        expect(all.map(t => t.id)).to.have.members(['tool-a', 'tool-b']);
        expect(getToolCalls).to.equal(2);
        registry.getAllFunctions();
        expect(getToolCalls).to.equal(2);
    });

    it('getFunction / getFunctions 同样触发延迟注册', () => {
        expect(registry.getFunction('tool-a')?.id).to.equal('tool-a');
        expect(getToolCalls).to.equal(2);
        expect(registry.getFunctions('tool-b').map(t => t.id)).to.deep.equal(['tool-b']);
    });

    it('初始注册不触发 onDidChange，后续注册/注销触发', () => {
        registry.getAllFunctions();
        expect(changeEvents).to.equal(0);
        registry.registerTool(tool('tool-c'));
        expect(changeEvents).to.equal(1);
        registry.unregisterTool('tool-a');
        expect(changeEvents).to.equal(2);
        expect(registry.getAllFunctions().map(t => t.id)).to.have.members(['tool-b', 'tool-c']);
    });

    it('unregisterTool / unregisterAllTools 前先完成延迟注册', () => {
        registry.unregisterTool('tool-a');
        expect(getToolCalls).to.equal(2);
        expect(registry.getAllFunctions().map(t => t.id)).to.deep.equal(['tool-b']);
        registry.unregisterAllTools('test');
        expect(registry.getAllFunctions()).to.be.empty;
    });
});
