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

import { AIVariableContext, AIVariableResolutionRequest } from '@theia/ai-core';
import { AIVariableCompletionContext, FrontendVariableService } from '@theia/ai-core/lib/browser';
import { codiconArray } from '@theia/core/lib/browser';
import { nls, QuickInputService, QuickPickItem } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as monaco from '@theia/monaco-editor-core';
import {
    AIVariable,
    AIVariableContribution,
    AIVariableResolver,
    ResolvedAIContextVariable
} from '@theia/ai-core/lib/common/variable-service';
import { DocSetService } from './doc-set-service';

/** `#docs` / `#docs:<标题>`：附加文档集清单或单篇文档全文。 */
export const DOC_SET_VARIABLE: AIVariable = {
    id: 'doc-set-provider',
    description: nls.localize('theia/ai/web/docSetVariable/description', '用户维护的参考文档集'),
    name: 'docs',
    label: nls.localize('theia/ai/web/docSetVariable/label', '文档集'),
    iconClasses: codiconArray('book'),
    isContextVariable: true,
    args: [{ name: 'title', description: nls.localize('theia/ai/web/docSetVariable/title/description', '要附加的文档标题。') }]
};

/** 提示词变量 `{{docSet}}`：注入文档集清单（供能力片段使用，无文档时为空）。 */
export const DOC_SET_SUMMARY_VARIABLE: AIVariable = {
    id: 'doc-set-summary',
    description: nls.localize('theia/ai/web/docSetSummaryVariable/description', '文档集清单文本'),
    name: 'docSet'
};

@injectable()
export class DocSetVariableContribution implements AIVariableContribution, AIVariableResolver {

    @inject(DocSetService)
    protected readonly docSetService: DocSetService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    registerVariables(service: FrontendVariableService): void {
        service.registerResolver(DOC_SET_VARIABLE, this);
        service.registerResolver(DOC_SET_SUMMARY_VARIABLE, this);
        service.registerArgumentPicker(DOC_SET_VARIABLE, this.pickDocument.bind(this));
        service.registerArgumentCompletionProvider(DOC_SET_VARIABLE, this.provideCompletions.bind(this));
    }

    async canResolve(request: AIVariableResolutionRequest, _: AIVariableContext): Promise<number> {
        return request.variable.name === DOC_SET_VARIABLE.name || request.variable.name === DOC_SET_SUMMARY_VARIABLE.name
            ? 1
            : 0;
    }

    async resolve(request: AIVariableResolutionRequest, _: AIVariableContext): Promise<ResolvedAIContextVariable | undefined> {
        if (request.variable.name === DOC_SET_SUMMARY_VARIABLE.name) {
            const contextValue = await this.docSetService.summaryText();
            return { variable: request.variable, value: 'docs', contextValue };
        }
        if (request.variable.name !== DOC_SET_VARIABLE.name) {
            return undefined;
        }
        if (request.arg === undefined) {
            const contextValue = await this.docSetService.summaryText();
            return { variable: request.variable, value: nls.localizeByDefault('文档集'), contextValue };
        }
        const entry = (await this.docSetService.list()).find(candidate => candidate.title === request.arg);
        if (!entry) {
            return undefined;
        }
        const content = await this.docSetService.readContent(entry);
        if (content === undefined) {
            return undefined;
        }
        return { variable: request.variable, value: entry.title, contextValue: content };
    }

    protected async pickDocument(): Promise<string | undefined> {
        const entries = await this.docSetService.list();
        if (entries.length === 0) {
            return undefined;
        }
        const items: (QuickPickItem & { title: string })[] = entries.map(entry => ({
            label: entry.title,
            description: entry.source,
            title: entry.title
        }));
        const selection = await this.quickInputService.showQuickPick(items, {
            placeholder: nls.localize('theia/ai/web/docSetVariable/pickPlaceholder', '选择要附加的文档')
        });
        return (selection as { title: string } | undefined)?.title;
    }

    protected async provideCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        matchString?: string
    ): Promise<monaco.languages.CompletionItem[] | undefined> {
        const context = AIVariableCompletionContext.get(DOC_SET_VARIABLE.name, model, position, matchString);
        if (!context) {
            return undefined;
        }
        const { userInput, range, prefix } = context;
        const entries = (await this.docSetService.list())
            .filter(entry => !userInput || entry.title.toLowerCase().includes(userInput.toLowerCase()));
        return entries.map((entry, index) => ({
            label: entry.title,
            kind: monaco.languages.CompletionItemKind.Reference,
            range,
            // 内联 #docs:<标题> 语法会被聊天请求解析器直接解析，无需附加到上下文面板
            insertText: `${prefix}${entry.title}`,
            filterText: userInput,
            sortText: `ZZ${index.toString().padStart(4, '0')}_${entry.title}`
        }));
    }
}
