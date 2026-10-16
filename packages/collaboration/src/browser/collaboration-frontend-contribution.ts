// *****************************************************************************
// Copyright (C) 2024 TypeFox and others.
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

import '../../src/browser/style/index.css';

import {
    CancellationToken, CancellationTokenSource, Command, CommandContribution, CommandRegistry, MessageService, nls, PreferenceService, Progress, QuickInputService, QuickPickItem,
    URI
} from '@theia/core';
import { inject, injectable, optional, postConstruct } from '@theia/core/shared/inversify';
import { AuthMetadata, AuthProvider, ConnectionProvider, FormAuthProvider, initializeProtocol, SocketIoTransportProvider, WebAuthProvider } from 'open-collaboration-protocol';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CollaborationInstance, CollaborationInstanceFactory } from './collaboration-instance';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { CollaborationWorkspaceService } from './collaboration-workspace-service';
import { StatusBar, StatusBarAlignment, StatusBarEntry } from '@theia/core/lib/browser/status-bar';
import { codiconArray } from '@theia/core/lib/browser/widgets/widget';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';

initializeProtocol({
    cryptoModule: window.crypto
});

export const COLLABORATION_CATEGORY = '协作';

export namespace CollaborationCommands {
    export const CREATE_ROOM: Command = {
        id: 'collaboration.create-room'
    };
    export const JOIN_ROOM: Command = {
        id: 'collaboration.join-room'
    };
    export const SIGN_OUT: Command = {
        id: 'collaboration.sign-out',
        label: nls.localizeByDefault('注销'),
        category: COLLABORATION_CATEGORY,
    };
}

export interface CollaborationAuthQuickPickItem extends QuickPickItem {
    provider: AuthProvider;
}

export const COLLABORATION_STATUS_BAR_ID = 'statusBar.collaboration';

export const COLLABORATION_AUTH_TOKEN = 'THEIA_COLLAB_AUTH_TOKEN';
export const COLLABORATION_SERVER_URL = 'COLLABORATION_SERVER_URL';
export const DEFAULT_COLLABORATION_SERVER_URL = 'https://api.open-collab.tools/';

@injectable()
export class CollaborationFrontendContribution implements CommandContribution {

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(QuickInputService) @optional()
    protected readonly quickInputService?: QuickInputService;

    @inject(EnvVariablesServer)
    protected readonly envVariables: EnvVariablesServer;

    @inject(CollaborationWorkspaceService)
    protected readonly workspaceService: CollaborationWorkspaceService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    @inject(CollaborationInstanceFactory)
    protected readonly collaborationInstanceFactory: CollaborationInstanceFactory;

    protected currentInstance?: CollaborationInstance;

    @postConstruct()
    protected init(): void {
        this.setStatusBarEntryDefault();
    }

    protected async createConnectionProvider(): Promise<ConnectionProvider> {
        const serverUrl = await this.getCollaborationServerUrl();
        return new ConnectionProvider({
            url: serverUrl,
            client: FrontendApplicationConfigProvider.get().applicationName,
            fetch: window.fetch.bind(window),
            authenticationHandler: (token, meta) => this.handleAuth(serverUrl, token, meta),
            transports: [SocketIoTransportProvider],
            userToken: localStorage.getItem(COLLABORATION_AUTH_TOKEN) ?? undefined
        });
    }

    protected async handleAuth(serverUrl: string, token: string, metaData: AuthMetadata): Promise<boolean> {
        const hasAuthProviders = Boolean(metaData.providers.length);
        if (!hasAuthProviders && metaData.loginPageUrl) {
            if (metaData.loginPageUrl) {
                this.windowService.openNewWindow(metaData.loginPageUrl, { external: true });
                return true;
            } else {
                this.messageService.error(nls.localize('theia/collaboration/noAuth', '服务器未提供任何身份验证方法。'));
                return false;
            }
        }
        if (!this.quickInputService) {
            return false;
        }
        const quickPickItems: CollaborationAuthQuickPickItem[] = metaData.providers.map(provider => ({
            label: provider.label.message,
            detail: provider.details?.message,
            provider
        }));
        const item = await this.quickInputService.pick(quickPickItems, {
            title: nls.localize('theia/collaboration/selectAuth', '选择身份验证方法'),
        });
        if (item) {
            switch (item.provider.type) {
                case 'form':
                    return this.handleFormAuth(serverUrl, token, item.provider);
                case 'web':
                    return this.handleWebAuth(serverUrl, token, item.provider);
            }
        }
        return false;
    }

    protected async handleFormAuth(serverUrl: string, token: string, provider: FormAuthProvider): Promise<boolean> {
        const fields = provider.fields;
        const values: Record<string, string> = {
            token
        };

        for (const field of fields) {
            let placeHolder: string;
            if (field.placeHolder) {
                placeHolder = field.placeHolder.message;
            } else {
                placeHolder = field.label.message;
            }
            placeHolder += field.required ? '' : `（${nls.localize('theia/collaboration/optional', '可选')}）`;
            const value = await this.quickInputService!.input({
                prompt: field.label.message,
                placeHolder,
            });
            // Test for thruthyness to also test for empty string
            if (value) {
                values[field.name] = value;
            } else if (field.required) {
                this.messageService.error(nls.localize('theia/collaboration/fieldRequired', '{0} 字段为必填项。登录已中止。', field.label.message));
                return false;
            }
        }
        const endpointUrl = new URI(serverUrl).resolve(provider.endpoint);
        const response = await fetch(endpointUrl.toString(true), {
            method: 'POST',
            body: JSON.stringify(values),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            this.messageService.info(nls.localize('theia/collaboration/loginSuccessful', '登录成功。'));
        } else {
            this.messageService.error(nls.localize('theia/collaboration/loginFailed', '登录失败。'));
        }
        return response.ok;
    }

    protected async handleWebAuth(serverUrl: string, token: string, provider: WebAuthProvider): Promise<boolean> {
        const uri = new URI(serverUrl).resolve(provider.endpoint).withQuery('token=' + token);
        this.windowService.openNewWindow(uri.toString(true), { external: true });
        return true;
    }

    protected async onStatusDefaultClick(): Promise<void> {
        const items: QuickPickItem[] = [];
        if (this.workspaceService.opened) {
            items.push({
                label: nls.localize('theia/collaboration/createRoom', '创建新的协作会话'),
                iconClasses: codiconArray('add'),
                execute: () => this.commands.executeCommand(CollaborationCommands.CREATE_ROOM.id)
            });
        }
        items.push({
            label: nls.localize('theia/collaboration/joinRoom', '加入协作会话'),
            iconClasses: codiconArray('vm-connect'),
            execute: () => this.commands.executeCommand(CollaborationCommands.JOIN_ROOM.id)
        });
        await this.quickInputService?.showQuickPick(items, {
            placeholder: nls.localize('theia/collaboration/selectCollaboration', '选择协作选项')
        });
    }

    protected async onStatusSharedClick(code: string): Promise<void> {
        const items: QuickPickItem[] = [{
            label: nls.localize('theia/collaboration/invite', '邀请他人'),
            detail: nls.localize('theia/collaboration/inviteDetail', '复制邀请代码，与他人共享以加入会话。'),
            iconClasses: codiconArray('clippy'),
            execute: () => this.displayCopyNotification(code)
        }];
        if (this.currentInstance) {
            // TODO: Implement readonly mode
            // if (this.currentInstance.readonly) {
            //     items.push({
            //         label: nls.localize('theia/collaboration/enableEditing', 'Enable Workspace Editing'),
            //         detail: nls.localize('theia/collaboration/enableEditingDetail', 'Allow collaborators to modify content in your workspace.'),
            //         iconClasses: codiconArray('unlock'),
            //         execute: () => {
            //             if (this.currentInstance) {
            //                 this.currentInstance.readonly = false;
            //             }
            //         }
            //     });
            // } else {
            //     items.push({
            //         label: nls.localize('theia/collaboration/disableEditing', 'Disable Workspace Editing'),
            //         detail: nls.localize('theia/collaboration/disableEditingDetail', 'Restrict others from making changes to your workspace.'),
            //         iconClasses: codiconArray('lock'),
            //         execute: () => {
            //             if (this.currentInstance) {
            //                 this.currentInstance.readonly = true;
            //             }
            //         }
            //     });
            // }
        }
        items.push({
            label: nls.localize('theia/collaboration/end', '结束协作会话'),
            detail: nls.localize('theia/collaboration/endDetail', '终止会话，停止内容共享，并撤销他人的访问权限。'),
            iconClasses: codiconArray('circle-slash'),
            execute: () => this.currentInstance?.dispose()
        });
        await this.quickInputService?.showQuickPick(items, {
            placeholder: nls.localize('theia/collaboration/whatToDo', '您想与其他协作者一起做什么？')
        });
    }

    protected async onStatusConnectedClick(code: string): Promise<void> {
        const items: QuickPickItem[] = [{
            label: nls.localize('theia/collaboration/invite', '邀请他人'),
            detail: nls.localize('theia/collaboration/inviteDetail', '复制邀请代码，与他人共享以加入会话。'),
            iconClasses: codiconArray('clippy'),
            execute: () => this.displayCopyNotification(code)
        }];
        items.push({
            label: nls.localize('theia/collaboration/leave', '离开协作会话'),
            detail: nls.localize('theia/collaboration/leaveDetail', '断开与当前协作会话的连接并关闭工作区。'),
            iconClasses: codiconArray('circle-slash'),
            execute: () => this.currentInstance?.dispose()
        });
        await this.quickInputService?.showQuickPick(items, {
            placeholder: nls.localize('theia/collaboration/whatToDo', '您想与其他协作者一起做什么？')
        });
    }

    protected async setStatusBarEntryDefault(): Promise<void> {
        await this.setStatusBarEntry({
            text: '$(codicon-live-share) ' + nls.localize('theia/collaboration/collaborate', '协作'),
            tooltip: nls.localize('theia/collaboration/startSession', '启动或加入协作会话'),
            onclick: () => this.onStatusDefaultClick()
        });
    }

    protected async setStatusBarEntryShared(code: string): Promise<void> {
        await this.setStatusBarEntry({
            text: '$(codicon-broadcast) ' + nls.localizeByDefault('已共享'),
            tooltip: nls.localize('theia/collaboration/sharedSession', '已共享协作会话'),
            onclick: () => this.onStatusSharedClick(code)
        });
    }

    protected async setStatusBarEntryConnected(code: string): Promise<void> {
        await this.setStatusBarEntry({
            text: '$(codicon-broadcast) ' + nls.localizeByDefault('已连接'),
            tooltip: nls.localize('theia/collaboration/connectedSession', '已连接到协作会话'),
            onclick: () => this.onStatusConnectedClick(code)
        });
    }

    protected async setStatusBarEntry(entry: Omit<StatusBarEntry, 'alignment'>): Promise<void> {
        await this.statusBar.setElement(COLLABORATION_STATUS_BAR_ID, {
            ...entry,
            alignment: StatusBarAlignment.LEFT,
            priority: 5
        });
    }

    protected async getCollaborationServerUrl(): Promise<string> {
        const serverUrlVariable = await this.envVariables.getValue(COLLABORATION_SERVER_URL);
        const serverUrlPreference = this.preferenceService.get<string>('collaboration.serverUrl');
        return serverUrlVariable?.value || serverUrlPreference || DEFAULT_COLLABORATION_SERVER_URL;
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(CollaborationCommands.CREATE_ROOM, {
            execute: async () => {
                const cancelTokenSource = new CancellationTokenSource();
                const progress = await this.messageService.showProgress({
                    text: nls.localize('theia/collaboration/creatingRoom', '正在创建会话'),
                    options: {
                        cancelable: true
                    }
                }, () => cancelTokenSource.cancel());
                try {
                    const authHandler = await this.createConnectionProvider();
                    const roomClaim = await authHandler.createRoom({
                        reporter: info => progress.report({ message: info.message }),
                        abortSignal: this.toAbortSignal(cancelTokenSource.token)
                    });
                    if (roomClaim.loginToken) {
                        localStorage.setItem(COLLABORATION_AUTH_TOKEN, roomClaim.loginToken);
                    }
                    this.currentInstance?.dispose();
                    const connection = await authHandler.connect(roomClaim.roomToken);
                    this.currentInstance = this.collaborationInstanceFactory({
                        role: 'host',
                        connection
                    });
                    this.currentInstance.onDidClose(() => {
                        this.setStatusBarEntryDefault();
                    });
                    const roomCode = roomClaim.roomId;
                    this.setStatusBarEntryShared(roomCode);
                    this.displayCopyNotification(roomCode, true);
                } catch (err) {
                    await this.messageService.error(nls.localize('theia/collaboration/failedCreate', '创建房间失败：{0}', err.message));
                } finally {
                    progress.cancel();
                }
            }
        });
        commands.registerCommand(CollaborationCommands.JOIN_ROOM, {
            execute: async () => {
                let joinRoomProgress: Progress | undefined;
                const cancelTokenSource = new CancellationTokenSource();
                try {
                    const authHandler = await this.createConnectionProvider();
                    const id = await this.quickInputService?.input({
                        placeHolder: nls.localize('theia/collaboration/enterCode', '输入协作会话代码')
                    });
                    if (!id) {
                        return;
                    }
                    joinRoomProgress = await this.messageService.showProgress({
                        text: nls.localize('theia/collaboration/joiningRoom', '正在加入会话'),
                        options: {
                            cancelable: true
                        }
                    }, () => cancelTokenSource.cancel());
                    const roomClaim = await authHandler.joinRoom({
                        roomId: id,
                        reporter: info => joinRoomProgress?.report({ message: info.message }),
                        abortSignal: this.toAbortSignal(cancelTokenSource.token)
                    });
                    joinRoomProgress.cancel();
                    if (roomClaim.loginToken) {
                        localStorage.setItem(COLLABORATION_AUTH_TOKEN, roomClaim.loginToken);
                    }
                    this.currentInstance?.dispose();
                    const connection = await authHandler.connect(roomClaim.roomToken, roomClaim.host);
                    this.currentInstance = this.collaborationInstanceFactory({
                        role: 'guest',
                        connection
                    });
                    this.currentInstance.onDidClose(() => {
                        this.setStatusBarEntryDefault();
                    });
                    this.setStatusBarEntryConnected(roomClaim.roomId);
                } catch (err) {
                    joinRoomProgress?.cancel();
                    await this.messageService.error(nls.localize('theia/collaboration/failedJoin', '加入房间失败：{0}', err.message));
                }
            }
        });
        commands.registerCommand(CollaborationCommands.SIGN_OUT, {
            execute: async () => {
                localStorage.removeItem(COLLABORATION_AUTH_TOKEN);
            }
        });
    }

    protected toAbortSignal(...tokens: CancellationToken[]): AbortSignal {
        const controller = new AbortController();
        tokens.forEach(token => token.onCancellationRequested(() => controller.abort()));
        return controller.signal;
    }

    protected async displayCopyNotification(code: string, firstTime = false): Promise<void> {
        navigator.clipboard.writeText(code);
        const notification = nls.localize('theia/collaboration/copiedInvitation', '邀请代码已复制到剪贴板。');
        if (firstTime) {
            // const makeReadonly = nls.localize('theia/collaboration/makeReadonly', 'Make readonly');
            const copyAgain = nls.localize('theia/collaboration/copyAgain', '再次复制');
            const copyResult = await this.messageService.info(
                notification,
                // makeReadonly,
                copyAgain
            );
            // if (copyResult === makeReadonly && this.currentInstance) {
            //     this.currentInstance.readonly = true;
            // }
            if (copyResult === copyAgain) {
                navigator.clipboard.writeText(code);
            }
        } else {
            await this.messageService.info(
                notification
            );
        }
    }
}
