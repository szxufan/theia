// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
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
import { codicon } from '@theia/core/lib/browser';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import * as React from '@theia/core/shared/react';
import URI from '@theia/core/lib/common/uri';

export class WorkspaceTrustDialog extends ReactDialog<boolean> {
    protected confirmed = true;

    constructor(protected readonly folderUris: URI[]) {
        super({
            title: '',
            maxWidth: 500
        });

        this.node.classList.add('workspace-trust-dialog');

        this.appendCloseButton(nls.localizeByDefault('不，我不信任这些作者'));
        this.appendAcceptButton(nls.localizeByDefault('是，我信任这些作者'));
        this.controlPanel.removeChild(this.errorMessageNode);
    }

    get value(): boolean {
        return this.confirmed;
    }

    protected override handleEscape(): boolean | void {
        this.confirmed = false;
        this.accept();
    }

    override close(): void {
        this.confirmed = false;
        this.accept();
    }

    protected render(): React.ReactNode {
        return (
            <div className="workspace-trust-content">
                <div className="workspace-trust-header">
                    <i className={codicon('shield')}></i>
                    <div className="workspace-trust-title">
                        {nls.localizeByDefault('是否信任此文件夹中文件的作者？')}
                    </div>
                </div>
                <div className="workspace-trust-description">
                    {nls.localize(
                        'theia/workspace/trustDialogMessage',
                        '如果您信任这些作者，此文件夹中的代码可能会被执行，包括任务、调试配置、扩展和 AI 功能。'
                    )}
                </div>
                <div className="workspace-trust-description">
                    {nls.localize(
                        'theia/workspace/trustDialogRestricted',
                        '如果您不信任这些作者，工作区将以受限模式打开，该模式会禁用这些功能，以防范潜在的有害代码。'
                    )}
                </div>
                <div className="workspace-trust-description">
                    <a href="https://theia-ide.org/docs/workspace_trust/"
                        title="https://theia-ide.org/docs/workspace_trust/"
                        target="_blank"
                        rel="noopener noreferrer">
                        {nls.localize('theia/workspace/trustLearnMore', '详细了解 Theia 的工作区信任机制')}
                    </a>
                </div>
                {this.folderUris.length > 0 && (
                    <div className="workspace-trust-folder">
                        <ul className="workspace-trust-folder-list">
                            {this.folderUris.map(uri => {
                                const stringified = uri.path.fsPath();
                                return (
                                    <li key={stringified}>
                                        {stringified}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        );
    }
}
