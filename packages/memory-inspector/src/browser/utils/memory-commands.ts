/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
 ********************************************************************************/

import { Command } from '@theia/core';
import { nls } from '@theia/core/lib/common/nls';

export const MemoryCommand: Command = { id: 'memory-inspector-command' };
export const MemoryCategory = nls.localize('theia/memory-inspector/memoryCategory', '内存检查器');

export const ViewVariableInMemoryCommand: Command = {
    id: 'view-variable-in-memory',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/viewVariable', '在内存检查器中显示变量'),
};

export const ViewVariableInRegisterViewCommand: Command = {
    id: 'view-variable-in-register-view',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/showRegister', '在内存检查器中显示寄存器'),
};

export const ResetModifiedCellCommand: Command = {
    id: 'reset-modified-cell',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/resetValue', '重置值'),
};

export const CreateNewMemoryViewCommand: Command = {
    id: 'create-new-memory-view',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/createNewMemory', '新建内存检查器'),
    iconClass: 'memory-view-icon toolbar',
};

export const FollowPointerTableCommand: Command = {
    id: 'follow-pointer-table',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/followPointer', '跟随指针'),
};

export const FollowPointerDebugCommand: Command = {
    id: 'follow-pointer-debug',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/followPointerMemory', '在内存检查器中跟随指针'),
};

export const CreateNewRegisterViewCommand: Command = {
    id: 'create-new-register-view',
    category: MemoryCategory,
    label: nls.localize('theia/memory-inspector/command/createNewRegisterView', '新建寄存器视图'),
    iconClass: 'register-view-icon toolbar',
};

export const RegisterSetVariableCommand: Command = {
    id: 'register-set-variable-value',
    category: MemoryCategory,
    label: nls.localizeByDefault('设置值')
};

export const ToggleDiffSelectWidgetVisibilityCommand: Command = {
    id: 'toggle-diff-select-visibility',
    iconClass: 'codicon codicon-git-compare',
};
