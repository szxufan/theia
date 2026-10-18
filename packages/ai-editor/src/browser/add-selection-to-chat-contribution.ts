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

import { AICommandHandlerFactory, ENABLE_AI_CONTEXT_KEY } from '@theia/ai-core/lib/browser';
import { AIChatContribution } from '@theia/ai-chat-ui/lib/browser/ai-chat-ui-contribution';
import { Command, CommandContribution, CommandRegistry, MessageService } from '@theia/core/lib/common';
import { codicon } from '@theia/core/lib/browser';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorContextMenu } from '@theia/editor/lib/browser';
import { MonacoCommandRegistry, MonacoEditorCommandHandler } from '@theia/monaco/lib/browser/monaco-command-registry';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { WorkspaceService } from '@theia/workspace/lib/browser';

export const ADD_SELECTION_TO_CHAT_COMMAND: Command = {
    id: 'ai-editor.addSelectionToChat',
    label: '将选中代码添加到聊天'
};

/** 输入框的 Monaco 编辑器在 React 挂载后才存在，轮询等待其就绪。 */
const INPUT_EDITOR_WAIT_TIMEOUT_MS = 2000;
const INPUT_EDITOR_POLL_INTERVAL_MS = 50;

/** 组装插入聊天输入框的引用文本：定位行 + 语言围栏的选区快照。 */
export function buildSelectionReference(
    relativePath: string,
    startLine: number,
    endLine: number,
    languageId: string | undefined,
    text: string
): string {
    const lineRange = startLine === endLine ? `第 ${startLine} 行` : `第 ${startLine}-${endLine} 行`;
    return `引用 ${relativePath} ${lineRange}：\n\`\`\`${languageId ?? ''}\n${text}\n\`\`\`\n`;
}

/**
 * Editor context-menu entry that inserts the current selection as a quoted reference into the
 * main chat input (unlike「Ask AI」, which sends immediately in a fresh session). The selection
 * snapshot is captured at click time, so later editor changes do not alter what was referenced.
 */
@injectable()
export class AddSelectionToChatContribution implements CommandContribution, MenuContribution {

    @inject(MonacoCommandRegistry)
    protected readonly monacoCommandRegistry: MonacoCommandRegistry;

    @inject(AICommandHandlerFactory)
    protected readonly commandHandlerFactory: AICommandHandlerFactory;

    @inject(AIChatContribution)
    protected readonly chatContribution: AIChatContribution;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ADD_SELECTION_TO_CHAT_COMMAND);
        this.monacoCommandRegistry.registerHandler(
            ADD_SELECTION_TO_CHAT_COMMAND.id,
            this.wrapMonacoHandler(this.handler())
        );
    }

    protected handler(): MonacoEditorCommandHandler {
        return {
            execute: (editor: MonacoEditor) => this.addSelectionToChat(editor),
            isEnabled: () => true
        };
    }

    protected wrapMonacoHandler(handler: MonacoEditorCommandHandler): MonacoEditorCommandHandler {
        const wrapped = this.commandHandlerFactory(handler);
        return {
            execute: wrapped.execute,
            isEnabled: wrapped.isEnabled
        };
    }

    protected async addSelectionToChat(editor: MonacoEditor): Promise<void> {
        const control = editor.getControl();
        const selection = control.getSelection();
        const model = control.getModel();
        const text = selection && model ? model.getValueInRange(selection).trim() : '';
        if (!selection || selection.isEmpty() || !text) {
            this.messageService.info('请先选中要添加的代码。');
            return;
        }
        const uri = editor.getResourceUri();
        const relativePath = this.workspaceService.getRootPrefixedPath(uri) ?? uri.path.toString();
        const reference = buildSelectionReference(
            relativePath,
            selection.startLineNumber,
            selection.endLineNumber,
            model?.getLanguageId(),
            text
        );

        const chatView = await this.chatContribution.openView({ activate: true });
        const inputControl = await this.waitForInputEditor(() => chatView.inputWidget.editor);
        if (!inputControl) {
            this.messageService.warn('聊天输入框尚未就绪，请稍后重试。');
            return;
        }
        const position = inputControl.getPosition();
        inputControl.executeEdits('add-selection-to-chat', [{
            range: {
                startLineNumber: position?.lineNumber ?? 1,
                startColumn: position?.column ?? 1,
                endLineNumber: position?.lineNumber ?? 1,
                endColumn: position?.column ?? 1
            },
            text: reference
        }]);
        chatView.inputWidget.activate();
    }

    /**
     * The chat input's Monaco instance only exists once its React subtree has mounted, which can
     * happen shortly after `openView` resolves. Poll the getter briefly instead of failing silently.
     */
    protected async waitForInputEditor(
        getEditor: () => SimpleMonacoEditorLike | undefined
    ): Promise<ChatInputEditorControl | undefined> {
        const deadline = Date.now() + INPUT_EDITOR_WAIT_TIMEOUT_MS;
        let editor = getEditor();
        while (!editor && Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, INPUT_EDITOR_POLL_INTERVAL_MS));
            editor = getEditor();
        }
        return editor?.getControl();
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(EditorContextMenu.NAVIGATION, {
            commandId: ADD_SELECTION_TO_CHAT_COMMAND.id,
            label: ADD_SELECTION_TO_CHAT_COMMAND.label,
            icon: codicon('comment-discussion'),
            when: ENABLE_AI_CONTEXT_KEY
        });
    }
}

/**
 * Minimal structural slices of `SimpleMonacoEditor` / its control, so the wait helper stays
 * testable and free of the duplicated monaco-editor-core typings in this workspace.
 */
interface SimpleMonacoEditorLike {
    getControl(): ChatInputEditorControl;
}

interface ChatInputEditorControl {
    getPosition(): { lineNumber: number, column: number } | null | undefined;
    executeEdits(source: string, edits: {
        range: { startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number },
        text: string
    }[]): boolean;
}
