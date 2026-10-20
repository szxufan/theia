// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability as set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { ConfirmDialog } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { nls, PreferenceScope, PreferenceService } from '@theia/core';
import { CHAT_VIEW_FULL_ACCESS_ACKNOWLEDGED } from './chat-view-preferences';

export const FullAccessConfirmationService = Symbol('FullAccessConfirmationService');
export interface FullAccessConfirmationService {
    isAcknowledged(): boolean;
    /**
     * Shows the one-time confirmation dialog for the `full` permission mode unless already
     * acknowledged; resolves with the user's decision and persists the acknowledgment.
     */
    confirmFullAccess(): Promise<boolean>;
}

@injectable()
export class FullAccessConfirmationServiceImpl implements FullAccessConfirmationService {

    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

    isAcknowledged(): boolean {
        return !!this.preferenceService.get<boolean>(CHAT_VIEW_FULL_ACCESS_ACKNOWLEDGED, false);
    }

    async confirmFullAccess(): Promise<boolean> {
        if (this.isAcknowledged()) {
            return true;
        }
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/chat-ui/fullAccessConfirmation/title', '启用完全访问模式？'),
            msg: nls.localize('theia/ai/chat-ui/fullAccessConfirmation/msg',
                '完全访问模式下，AI 将直接修改文件并执行命令，不再弹出任何确认（包括高风险 Shell 命令）。\n\n'
                + '建议使用版本控制（例如 Git），以便审查和回退更改。'),
            ok: nls.localize('theia/ai/chat-ui/fullAccessConfirmation/ok', '启用完全访问'),
            cancel: nls.localize('theia/ai/chat-ui/fullAccessConfirmation/cancel', '取消')
        });
        const confirmed = await dialog.open();
        if (confirmed === true) {
            await this.preferenceService.set(CHAT_VIEW_FULL_ACCESS_ACKNOWLEDGED, true, PreferenceScope.User);
        }
        return confirmed === true;
    }
}
