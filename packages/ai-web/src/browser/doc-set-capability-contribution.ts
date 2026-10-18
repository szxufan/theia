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

import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PromptService } from '@theia/ai-core';

/**
 * Contributes the built-in `doc-set` prompt fragment: a short pointer listing the user's
 * reference documents (via the `{{docSet}}` variable) so agents know `#docs` is available.
 * Renders as empty when no documents are collected.
 */
@injectable()
export class DocSetCapabilityContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.promptService.addBuiltInPromptFragment({
            id: 'doc-set',
            template: `---
name: 文档集
description: 为对话提供用户沉淀的参考文档（URL 抓取或本地文件），可在输入框用 #docs 附加全文。
---

{{docSet}}`
        });
    }
}
