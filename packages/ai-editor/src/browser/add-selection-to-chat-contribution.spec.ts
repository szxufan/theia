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
import { MessageService } from '@theia/core/lib/common';
import { MonacoCommandRegistry } from '@theia/monaco/lib/browser/monaco-command-registry';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { AICommandHandlerFactory, ENABLE_AI_CONTEXT_KEY } from '@theia/ai-core/lib/browser';
import { AIChatContribution } from '@theia/ai-chat-ui/lib/browser/ai-chat-ui-contribution';
import { EditorContextMenu } from '@theia/editor/lib/browser';
import {
    ADD_SELECTION_TO_CHAT_COMMAND,
    AddSelectionToChatContribution,
    buildSelectionReference
} from './add-selection-to-chat-contribution';

interface EditCall {
    source: string;
    range: { startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number };
    text: string;
}

function monacoEditor(options: {
    selectedText: string,
    startLine: number,
    endLine: number,
    languageId: string
}): MonacoEditor {
    const selection = {
        isEmpty: (): boolean => options.selectedText.length === 0,
        startLineNumber: options.startLine,
        endLineNumber: options.endLine
    };
    return {
        getResourceUri: () => new URI('file:///workspace/src/app.ts'),
        getControl: () => ({
            getSelection: () => selection,
            getModel: () => ({
                getValueInRange: () => options.selectedText,
                getLanguageId: () => options.languageId
            })
        })
    } as unknown as MonacoEditor;
}

describe('AddSelectionToChatContribution', () => {

    let contribution: AddSelectionToChatContribution;
    let messages: { type: string, text: string }[];
    let openViewCalls: number;
    let inputEdits: EditCall[];
    let inputReady: boolean;
    let activateCalls: number;

    function createContribution(editorForCommand: MonacoEditor): void {
        messages = [];
        openViewCalls = 0;
        inputEdits = [];
        activateCalls = 0;

        const container = new Container();
        container.bind(MonacoCommandRegistry).toConstantValue({
            registerHandler: (_id: string, handler: { execute: (editor: MonacoEditor) => unknown }) => {
                // 直接保存 handler 便于测试触发（绕过 monaco 命令解析层）
                registeredHandler = handler;
            }
        } as unknown as MonacoCommandRegistry);
        container.bind(AICommandHandlerFactory).toConstantValue(
            (handler: unknown) => handler as never);
        container.bind(AIChatContribution).toConstantValue({
            openView: async () => {
                openViewCalls++;
                return {
                    inputWidget: {
                        get editor() {
                            return inputReady ? { getControl: () => inputControl } : undefined;
                        },
                        activate: () => { activateCalls++; }
                    }
                } as never;
            }
        } as unknown as AIChatContribution);
        container.bind(WorkspaceService).toConstantValue({
            getRootPrefixedPath: (uri: URI) => 'ws' + uri.path.toString().replace(/^\/workspace/, '')
        } as unknown as WorkspaceService);
        container.bind(MessageService).toConstantValue({
            info: (text: string) => { messages.push({ type: 'info', text }); },
            warn: (text: string) => { messages.push({ type: 'warn', text }); }
        } as unknown as MessageService);
        container.bind(AddSelectionToChatContribution).toSelf();
        contribution = container.get(AddSelectionToChatContribution);

        const commandRegistry = {
            registerCommand: () => { }
        } as never as Parameters<AddSelectionToChatContribution['registerCommands']>[0];
        contribution.registerCommands(commandRegistry);
        void editorForCommand;
    }

    const inputControl = {
        getPosition: () => ({ lineNumber: 3, column: 5 }),
        executeEdits: (source: string, edits: { range: EditCall['range'], text: string }[]) => {
            inputEdits.push({ source, range: edits[0].range, text: edits[0].text });
            return true;
        }
    };

    let registeredHandler: { execute: (editor: MonacoEditor) => unknown } | undefined;

    beforeEach(() => {
        registeredHandler = undefined;
        inputReady = true;
    });

    describe('buildSelectionReference', () => {

        it('renders a multi-line reference with language fence', () => {
            const reference = buildSelectionReference('ws/src/app.ts', 10, 24, 'typescript', 'const a = 1;');
            expect(reference).to.equal('引用 ws/src/app.ts 第 10-24 行：\n```typescript\nconst a = 1;\n```\n');
        });

        it('renders a single-line reference without a range dash', () => {
            const reference = buildSelectionReference('ws/a.ts', 7, 7, undefined, 'let x;');
            expect(reference).to.include('第 7 行：');
            expect(reference).to.include('```\nlet x;\n```'); // 无语言 id 时围栏为空后缀
        });
    });

    describe('command handler', () => {

        it('inserts the selection snapshot as a reference at the input cursor', async () => {
            createContribution(monacoEditor({ selectedText: 'const a = 1;', startLine: 10, endLine: 12, languageId: 'typescript' }));
            await registeredHandler!.execute(
                monacoEditor({ selectedText: 'const a = 1;', startLine: 10, endLine: 12, languageId: 'typescript' }));

            expect(openViewCalls).to.equal(1);
            expect(inputEdits).to.have.lengthOf(1);
            expect(inputEdits[0].source).to.equal('add-selection-to-chat');
            expect(inputEdits[0].range).to.deep.equal({ startLineNumber: 3, startColumn: 5, endLineNumber: 3, endColumn: 5 });
            expect(inputEdits[0].text).to.equal('引用 ws/src/app.ts 第 10-12 行：\n```typescript\nconst a = 1;\n```\n');
            expect(activateCalls).to.equal(1);
            expect(messages).to.be.empty;
        });

        it('informs and does nothing without a selection', async () => {
            createContribution(monacoEditor({ selectedText: '', startLine: 1, endLine: 1, languageId: 'typescript' }));
            await registeredHandler!.execute(
                monacoEditor({ selectedText: '', startLine: 1, endLine: 1, languageId: 'typescript' }));

            expect(messages).to.have.lengthOf(1);
            expect(messages[0].type).to.equal('info');
            expect(openViewCalls).to.equal(0);
            expect(inputEdits).to.be.empty;
        });

        it('waits for the input editor to mount before inserting', async () => {
            createContribution(monacoEditor({ selectedText: 'let x;', startLine: 2, endLine: 2, languageId: 'typescript' }));
            inputReady = false;
            const execution = registeredHandler!.execute(
                monacoEditor({ selectedText: 'let x;', startLine: 2, endLine: 2, languageId: 'typescript' }));
            await new Promise(resolve => setTimeout(resolve, 120));
            inputReady = true;
            await execution;

            expect(inputEdits).to.have.lengthOf(1);
        });
    });

    describe('menu registration', () => {

        it('registers into the editor context navigation group gated on AI being enabled', () => {
            createContribution(monacoEditor({ selectedText: 'x', startLine: 1, endLine: 1, languageId: 'ts' }));
            const registrations: { path: string[], action: { commandId: string, when?: string } }[] = [];
            const menuRegistry = {
                registerMenuAction: (path: string[], action: { commandId: string, when?: string }) => {
                    registrations.push({ path, action });
                }
            } as never as Parameters<AddSelectionToChatContribution['registerMenus']>[0];

            contribution.registerMenus(menuRegistry);

            expect(registrations).to.have.lengthOf(1);
            expect(registrations[0].path).to.deep.equal(EditorContextMenu.NAVIGATION);
            expect(registrations[0].action.commandId).to.equal(ADD_SELECTION_TO_CHAT_COMMAND.id);
            expect(registrations[0].action.when).to.equal(ENABLE_AI_CONTEXT_KEY);
        });
    });
});
