// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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

import { nls } from '@theia/core/lib/common/nls';
import { ReasoningLevel } from '../common/language-model';

export function reasoningLevelLabel(level: ReasoningLevel): string {
    switch (level) {
        case 'off': return nls.localizeByDefault('关闭');
        case 'none': return nls.localizeByDefault('无');
        case 'minimal': return nls.localizeByDefault('极低');
        case 'low': return nls.localizeByDefault('低');
        case 'medium': return nls.localizeByDefault('中');
        case 'high': return nls.localizeByDefault('高');
        case 'xhigh': return nls.localizeByDefault('极高');
        case 'max': return nls.localizeByDefault('最大');
        case 'auto': return nls.localizeByDefault('自动');
    }
}

export function reasoningLevelDescription(level: ReasoningLevel): string | undefined {
    switch (level) {
        case 'off': return nls.localize('theia/ai/core/reasoning/offDescription',
            '省略显式推理力度，允许使用提供商默认值或原始请求设置；在 Ollama 上则禁用思考。');
        case 'none': return nls.localize('theia/ai/core/reasoning/noneDescription', '明确请求不进行推理。');
        default: return undefined;
    }
}
