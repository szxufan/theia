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

import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { codicon } from '@theia/core/lib/browser';
import { DisposableCollection, Emitter, Event, nls } from '@theia/core';
import { AutonomyMode } from '@theia/ai-chat';
import { ChatService } from '@theia/ai-chat/lib/common/chat-service';
import { ChatBannerProvider } from './chat-banner-provider';

/**
 * Strip shown above the chat content while the active session runs in a non-default
 * autonomy mode (`plan` or `yolo`), so the elevated or restricted behavior is always
 * visible. Follows the active session and its settings changes.
 */
@injectable()
export class AutonomyModeChatBanner implements ChatBannerProvider {

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

    protected get activeAutonomyMode(): AutonomyMode | undefined {
        return this.chatService.getActiveSession()?.model.settings?.commonSettings?.autonomyMode;
    }

    renderBanner(): React.ReactNode | undefined {
        const mode = this.activeAutonomyMode;
        if (mode === undefined || mode === 'default') {
            return undefined;
        }
        const isYolo = mode === 'yolo';
        const title = isYolo
            ? nls.localize('theia/ai/chat-ui/autonomyBanner/yoloTitle', '全自动模式：工具确认将自动放行')
            : nls.localize('theia/ai/chat-ui/autonomyBanner/planTitle', '计划模式：写操作已被禁止');
        const tooltip = isYolo
            ? nls.localize('theia/ai/chat-ui/autonomyBanner/yoloTooltip',
                '此会话的工具调用确认将自动放行（Shell 执行等高危工具除外）。可通过会话设置切换回来。')
            : nls.localize('theia/ai/chat-ui/autonomyBanner/planTooltip',
                '此会话中代理无法执行写文件、运行命令等修改性工具，只能读取与规划。可通过会话设置切换回来。');
        return <div
            className={`theia-ai-autonomy-mode-strip ${isYolo ? 'is-yolo' : 'is-plan'}`}
            title={tooltip}
            role='status'
            aria-live='polite'>
            <span className={`theia-ai-autonomy-mode-strip-icon ${codicon(isYolo ? 'zap' : 'symbol-enum')}`}></span>
            <span className='theia-ai-autonomy-mode-strip-title'>{title}</span>
        </div>;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
