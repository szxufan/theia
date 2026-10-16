// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH and others.
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

import { nls, CommandHandler, DisposableCollection, MessageService, QuickInputService, Disposable } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { DebugViewModel } from '../view/debug-view-model';
import { TreeElementNode } from '@theia/core/lib/browser/source-tree';
import { DebugDataBreakpoint } from '../model/debug-data-breakpoint';
import { DataBreakpoint, DataBreakpointSource, DataBreakpointSourceType } from './breakpoint-marker';
import { DebugProtocol } from '@vscode/debugprotocol';
import { BreakpointManager } from './breakpoint-manager';
import { TreeNode, Widget } from '@theia/core/lib/browser';
import { DebugBreakpointsWidget } from '../view/debug-breakpoints-widget';

// Adapted from https://github.com/microsoft/vscode/blob/9c883243a89e7ec3b730d3746fbb1e836d5e4f52/src/vs/workbench/contrib/debug/browser/breakpointsView.ts#L1506-L1625

@injectable()
export class AddOrEditDataBreakpointAddress implements CommandHandler {
    @inject(DebugViewModel)
    protected readonly viewModel: DebugViewModel;
    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;
    @inject(MessageService)
    protected readonly messageService: MessageService;
    @inject(BreakpointManager)
    protected readonly breakpointManager: BreakpointManager;

    isEnabled(node?: TreeElementNode): boolean {
        return !!this.viewModel.currentSession?.capabilities.supportsDataBreakpoints
            && this.viewModel.currentSession?.capabilities.supportsDataBreakpointBytes !== false
            && this.isAddressBreakpointOrDebugWidget(node);
    }

    isVisible(node?: TreeElementNode): boolean {
        return this.isEnabled(node);
    }

    protected isAddressBreakpointOrDebugWidget(candidate?: unknown): boolean {
        return !candidate ? true // Probably command palette
            : TreeNode.is(candidate) && TreeElementNode.is(candidate)
                ? candidate.element instanceof DebugDataBreakpoint && candidate.element.origin.source.type === DataBreakpointSourceType.Address
                : candidate instanceof Widget
                    ? candidate instanceof DebugBreakpointsWidget
                    : false;
    }

    async execute(node?: TreeElementNode): Promise<void> {
        const existingBreakpoint = TreeElementNode.is(node) && node.element instanceof DebugDataBreakpoint ? node.element : undefined;
        const session = this.viewModel.currentSession;
        if (!session) {
            return;
        }

        let defaultValue = undefined;
        if (existingBreakpoint?.origin.source.type === DataBreakpointSourceType.Address) {
            defaultValue = `${existingBreakpoint.origin.source.address} + ${existingBreakpoint.origin.source.bytes}`;
        }

        const quickInput = this.quickInputService;
        const range = await this.getRange(defaultValue);
        if (!range) {
            return;
        }

        const info = await session.sendRequest('dataBreakpointInfo', { asAddress: true, name: range.address, bytes: range.bytes })
            .then(({ body }) => body)
            .catch(e => { this.messageService.error(nls.localizeByDefault('无法在 {0} 处设置数据断点: {1}', range.address, e.message)); });
        if (!info?.dataId) {
            return;
        }

        let accessType: DebugProtocol.DataBreakpointAccessType = 'write';
        if (info.accessTypes && info.accessTypes?.length > 1) {
            const accessTypes = info.accessTypes.map(type => ({ label: type }));
            const selectedAccessType = await quickInput.pick(accessTypes, { placeHolder: nls.localizeByDefault('选择要监视的访问类型') });
            if (!selectedAccessType) {
                return;
            }

            accessType = selectedAccessType.label;
        }

        const src: DataBreakpointSource = { type: DataBreakpointSourceType.Address, ...range };
        if (existingBreakpoint) {
            this.breakpointManager.removeDataBreakpoint(existingBreakpoint);
        }

        this.breakpointManager.addDataBreakpoint(DataBreakpoint.create({ dataId: info.dataId, accessType }, { ...info, canPersist: true }, src));
    }

    private getRange(defaultValue?: string): Promise<{ address: string, bytes: number } | undefined> {
        return new Promise(resolve => {
            const disposables = new DisposableCollection();
            const addDisposable = <T extends Disposable>(disposable: T): T => {
                disposables.push(disposable);
                return disposable;
            };
            const input = addDisposable(this.quickInputService.createInputBox());
            input.prompt = nls.localizeByDefault('输入要在其中中断的内存范围');
            input.placeholder = nls.localizeByDefault('绝对范围（0x1234 - 0x1300）或某地址之后的字节范围（0x1234 + 0xff）');
            if (defaultValue) {
                input.value = defaultValue;
                input.valueSelection = [0, defaultValue.length];
            }
            addDisposable(input.onDidChangeValue(e => {
                const err = this.parseAddress(e, false);
                input.validationMessage = err?.error;
            }));
            addDisposable(input.onDidAccept(() => {
                const r = this.parseAddress(input.value ?? '', true);
                if ('error' in r) {
                    input.validationMessage = r.error;
                } else {
                    resolve(r);
                }
                input.dispose();
            }));
            addDisposable(input.onDidHide(() => {
                resolve(undefined);
                disposables.dispose();
            }));
            input.ignoreFocusOut = true;
            input.show();
        });
    }

    private parseAddress(range: string, isFinal: false): { error: string } | undefined;
    private parseAddress(range: string, isFinal: true): { error: string } | { address: string; bytes: number };
    private parseAddress(range: string, isFinal: boolean): { error: string } | { address: string; bytes: number } | undefined {
        const parts = /^(\S+)\s*(?:([+-])\s*(\S+))?/.exec(range);
        if (!parts) {
            return { error: nls.localizeByDefault('地址应为 "[起始] - [结束]" 或 "[起始] + [字节数]" 形式的数字范围') };
        }

        const isNum = (e: string) => isFinal ? /^0x[0-9a-f]*|[0-9]*$/i.test(e) : /^0x[0-9a-f]+|[0-9]+$/i.test(e);
        const [, startStr, sign = '+', endStr = '1'] = parts;

        for (const n of [startStr, endStr]) {
            if (!isNum(n)) {
                return { error: nls.localizeByDefault('数字必须是十进制整数或以 \"0x\" 开头的十六进制值，但得到 {0}', n) };
            }
        }

        if (!isFinal) {
            return;
        }

        const start = BigInt(startStr);
        const end = BigInt(endStr);
        const address = `0x${start.toString(16)}`;
        if (sign === '-') {
            return { address, bytes: Number(start - end) };
        }

        return { address, bytes: Number(end) };
    }
}
