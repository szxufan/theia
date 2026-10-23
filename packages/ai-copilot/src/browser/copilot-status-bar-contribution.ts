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

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { StatusBar, StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar-types';
import { Disposable, DisposableCollection, nls, PreferenceService } from '@theia/core';
import { AIActivationService } from '@theia/ai-core/lib/browser';
import { CopilotAuthService, CopilotAuthState } from '../common/copilot-auth-service';
import { CopilotCommands } from './copilot-command-contribution';
import { COPILOT_ENABLED_PREF } from '../common/copilot-preferences';

const COPILOT_STATUS_BAR_ID = 'copilot-auth-status';

/**
 * Frontend contribution that displays GitHub Copilot authentication status in the status bar.
 */
@injectable()
export class CopilotStatusBarContribution implements FrontendApplicationContribution, Disposable {

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    @inject(CopilotAuthService)
    protected readonly authService: CopilotAuthService;

    @inject(AIActivationService)
    protected readonly activationService: AIActivationService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected authState: CopilotAuthState = { isAuthenticated: false };
    protected readonly toDispose = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.toDispose.push(this.authService.onAuthStateChanged(state => {
            this.authState = state;
            this.updateStatusBar();
        }));
        this.toDispose.push(this.activationService.onDidChangeActiveStatus(() => {
            this.updateStatusBar();
        }));
        this.toDispose.push(this.preferenceService.onPreferenceChanged(event => {
            if (event.preferenceName === COPILOT_ENABLED_PREF) {
                this.updateStatusBar();
            }
        }));
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    onStart(): void {
        this.authService.getAuthState().then(state => {
            this.authState = state;
            this.updateStatusBar();
        });
    }

    protected updateStatusBar(): void {
        // 仅在已登录时显示账户状态；未登录时不占用状态栏（登录入口保留在命令面板与 AI 配置界面）。
        if (!this.activationService.isActive || !this.preferenceService.get<boolean>(COPILOT_ENABLED_PREF, true)
            || !this.authState.isAuthenticated) {
            this.statusBar.removeElement(COPILOT_STATUS_BAR_ID);
            return;
        }

        const accountLabel = this.authState.accountLabel ?? 'GitHub';
        this.statusBar.setElement(COPILOT_STATUS_BAR_ID, {
            text: `$(github) ${accountLabel}`,
            tooltip: nls.localize('theia/ai/copilot/statusBar/signedIn',
                '已登录 GitHub Copilot，账户为 {0}。点击登出。', accountLabel),
            alignment: StatusBarAlignment.RIGHT,
            priority: 100,
            command: CopilotCommands.SIGN_OUT.id
        });
    }
}
