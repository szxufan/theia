// *****************************************************************************
// Copyright (C) 2025 Lonti.com Pty Ltd.
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

import { AIVariable } from '@theia/ai-core/lib/common/variable-service';
import { nls } from '@theia/core';

export const FILE: AIVariable = {
    id: 'codeCompletionFile',
    name: 'codeCompletionFile',
    description: nls.localize('theia/ai/completion/fileVariable/description', '正在编辑的文件的 URI。仅在代码补全上下文中可用。'),
};

export const PREFIX: AIVariable = {
    id: 'codeCompletionPrefix',
    name: 'codeCompletionPrefix',
    description: nls.localize('theia/ai/completion/prefixVariable/description', '当前光标位置之前的代码。仅在代码补全上下文中可用。'),
};

export const SUFFIX: AIVariable = {
    id: 'codeCompletionSuffix',
    name: 'codeCompletionSuffix',
    description: nls.localize('theia/ai/completion/suffixVariable/description', '当前光标位置之后的代码。仅在代码补全上下文中可用。'),
};

export const LANGUAGE: AIVariable = {
    id: 'codeCompletionLanguage',
    name: 'codeCompletionLanguage',
    description: nls.localize('theia/ai/completion/languageVariable/description', '正在编辑的文件的 languageId。仅在代码补全上下文中可用。'),
};
