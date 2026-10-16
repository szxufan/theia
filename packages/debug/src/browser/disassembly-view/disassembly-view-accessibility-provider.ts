// *****************************************************************************
// Copyright (C) 2022 Ericsson and others.
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

import { nls } from '@theia/core';
import { IListAccessibilityProvider } from '@theia/monaco-editor-core/esm/vs/base/browser/ui/list/listWidget';
import { DisassembledInstructionEntry } from './disassembly-view-utilities';

// This file is adapted from https://github.com/microsoft/vscode/blob/c061ce5c24fc480342fbc5f23244289d633c56eb/src/vs/workbench/contrib/debug/browser/disassemblyView.ts

export class AccessibilityProvider implements IListAccessibilityProvider<DisassembledInstructionEntry> {

    getWidgetAriaLabel(): string {
        return nls.localizeByDefault('反汇编视图');
    }

    getAriaLabel(element: DisassembledInstructionEntry): string | null {
        let label = '';

        const instruction = element.instruction;
        if (instruction.address !== '-1') {
            label += `${nls.localizeByDefault('地址')}: ${instruction.address}`;
        }
        if (instruction.instructionBytes) {
            label += `, ${nls.localizeByDefault('字节')}: ${instruction.instructionBytes}`;
        }
        label += `, ${nls.localizeByDefault('指令')}: ${instruction.instruction}`;

        return label;
    }
}
