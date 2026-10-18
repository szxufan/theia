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
import { QuickInputService } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { AIVariableContext, AIVariableResolutionRequest } from '@theia/ai-core/lib/common/variable-service';
import { DocSetEntry, DocSetService } from './doc-set-service';
import { DOC_SET_SUMMARY_VARIABLE, DOC_SET_VARIABLE, DocSetVariableContribution } from './doc-set-variable-contribution';

describe('DocSetVariableContribution', () => {

    let contribution: DocSetVariableContribution;
    let docs: DocSetEntry[];

    beforeEach(() => {
        docs = [];
        const container = new Container();
        container.bind(DocSetService).toConstantValue({
            list: async () => docs,
            summaryText: async () => docs.length === 0 ? '' : `共 ${docs.length} 篇文档`,
            readContent: async (entry: DocSetEntry) => `全文：${entry.title}`,
            add: async () => { throw new Error('not implemented'); },
            remove: async () => false
        } as unknown as DocSetService);
        container.bind(QuickInputService).toConstantValue({} as QuickInputService);
        container.bind(DocSetVariableContribution).toSelf();
        contribution = container.get(DocSetVariableContribution);
    });

    const context = {} as AIVariableContext;
    const request = (variable: typeof DOC_SET_VARIABLE, arg?: string): AIVariableResolutionRequest => ({ variable, arg });

    it('only resolves its own variables', async () => {
        expect(await contribution.canResolve(request(DOC_SET_VARIABLE), context)).to.equal(1);
        expect(await contribution.canResolve(request(DOC_SET_SUMMARY_VARIABLE), context)).to.equal(1);
        expect(await contribution.canResolve(request({ ...DOC_SET_VARIABLE, name: 'other' }), context)).to.equal(0);
    });

    it('resolves #docs without argument to the summary listing', async () => {
        docs = [{ title: 'guide', source: 'https://example.com', file: 'guide.md', addedAt: 1, charCount: 10 }];

        const resolved = await contribution.resolve(request(DOC_SET_VARIABLE), context);
        expect(resolved?.contextValue).to.equal('共 1 篇文档');
    });

    it('resolves #docs:<title> to the document content', async () => {
        docs = [{ title: 'guide', source: 'https://example.com', file: 'guide.md', addedAt: 1, charCount: 10 }];

        const resolved = await contribution.resolve(request(DOC_SET_VARIABLE, 'guide'), context);
        expect(resolved?.value).to.equal('guide');
        expect(resolved?.contextValue).to.equal('全文：guide');
    });

    it('returns undefined for unknown titles', async () => {
        docs = [];
        expect(await contribution.resolve(request(DOC_SET_VARIABLE, 'missing'), context)).to.be.undefined;
    });

    it('resolves {{docSet}} to empty text without documents', async () => {
        const resolved = await contribution.resolve(request(DOC_SET_SUMMARY_VARIABLE), context);
        expect(resolved?.contextValue).to.equal('');
    });
});
