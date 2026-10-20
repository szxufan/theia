// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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

import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { codicon } from '@theia/core/lib/browser';
import { DisposableCollection, Emitter, Event, nls } from '@theia/core';
import { resolvePermissionSettings } from '@theia/ai-chat';
import { ChatService } from '@theia/ai-chat/lib/common/chat-service';
import { ChatBannerProvider } from './chat-banner-provider';

/**
 * Strip shown above the chat content while the active session runs in an elevated or
 * restricted state — plan mode enabled or the `full` permission mode active — so the
 * special behavior is always visible. Follows the active session and its settings changes.
 */
@injectable()
export class PermissionModeChatBanner implements ChatBannerProvider {

    readonly priority = 900;

    @inject(ChatService)
    protected readonly chatService: ChatService;

    protected readonly toDispose = new DisposableCollection();
    protected readonly sessionTracker = new DisposableCollection();
    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    @postConstruct()
    protected init(): void {
        this.toDispose.push(this.sessionTracker);
        this.toDispose.push(this.chatService.onSessionEvent(() => this.trackActiveSession()));
        this.trackActiveSession();
    }

    protected trackActiveSession(): void {
        this.sessionTracker.dispose();
        const session = this.chatService.getActiveSession();
        if (session) {
            this.sessionTracker.push(session.model.onDidChange(change => {
                if ((change as { kind?: string }).kind === 'settingsChanged') {
                    this.onDidChangeEmitter.fire();
                }
            }));
        }
        this.onDidChangeEmitter.fire();
    }

    renderBanner(): React.ReactNode | undefined {
        const session = this.chatService.getActiveSession();
        const { permissionMode, planMode } = resolvePermissionSettings(
            session?.model.settings?.commonSettings
        );
        if (planMode) {
            const title = nls.localize('theia/ai/chat-ui/permissionBanner/planTitle', '计划模式：写操作已被禁止');
            const tooltip = nls.localize('theia/ai/chat-ui/permissionBanner/planTooltip',
                '此会话中代理无法执行写文件、运行命令等修改性工具，只能读取与规划。可在聊天输入栏的权限模式选择器中关闭。');
            return <div
                className='theia-ai-autonomy-mode-strip is-plan'
                title={tooltip}
                role='status'
                aria-live='polite'>
                <span className={`theia-ai-autonomy-mode-strip-icon ${codicon('symbol-enum')}`}></span>
                <span className='theia-ai-autonomy-mode-strip-title'>{title}</span>
            </div>;
        }
        if (permissionMode === 'full') {
            const title = nls.localize('theia/ai/chat-ui/permissionBanner/fullTitle', '完全访问：所有操作自动执行，不再确认');
            const tooltip = nls.localize('theia/ai/chat-ui/permissionBanner/fullTooltip',
                '此会话中 AI 修改文件、执行命令（含高风险命令）均自动放行。建议配合版本控制使用。可通过权限模式选择器切换回来。');
            return <div
                className='theia-ai-autonomy-mode-strip is-full'
                title={tooltip}
                role='status'
                aria-live='polite'>
                <span className={`theia-ai-autonomy-mode-strip-icon ${codicon('zap')}`}></span>
                <span className='theia-ai-autonomy-mode-strip-title'>{title}</span>
            </div>;
        }
        return undefined;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
