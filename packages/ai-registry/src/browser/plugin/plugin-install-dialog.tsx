// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH and others.
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
import { nls } from '@theia/core';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { PluginEndorsement, PluginHashMismatch, ResolvedPluginEntry } from '../../common/plugin/plugin-registry-types';

export interface PluginInstallDialogOptions {
    readonly entry: ResolvedPluginEntry;
}

export interface PluginHashMismatchDialogOptions {
    readonly entry: ResolvedPluginEntry;
    readonly mismatch: PluginHashMismatch;
}

/** Injected so no caller imports the DOM-touching `ReactDialog` chain directly. */
export const PluginInstallDialogFactory = Symbol('PluginInstallDialogFactory');
export type PluginInstallDialogFactory = (options: PluginInstallDialogOptions) => PluginInstallDialog;

export const PluginHashMismatchDialogFactory = Symbol('PluginHashMismatchDialogFactory');
export type PluginHashMismatchDialogFactory = (options: PluginHashMismatchDialogOptions) => PluginHashMismatchDialog;

function renderEndorsement(endorsement: PluginEndorsement): string {
    const base = nls.localizeByDefault('{0} · {1}', endorsement.organizationId, endorsement.date);
    return endorsement.viaTrust
        ? nls.localizeByDefault('{0}（{1}）', base, nls.localize('theia/ai-registry/plugin/dialog/viaTrust', '经由 {0}', endorsement.viaTrust))
        : base;
}

/**
 * A plugin is installed whole and its servers start automatically, which is a materially larger
 * decision than installing one skill - so the source, the endorsements and the contained components
 * are all shown before anything is fetched. The counts come from the feed; once on disk, the root
 * wins, which is why the installed card recounts them.
 */
export class PluginInstallDialog extends ReactDialog<boolean> {

    constructor(protected readonly options: PluginInstallDialogOptions) {
        super({
            title: nls.localize('theia/ai-registry/plugin/dialog/install/title', '安装代理插件“{0}”', options.entry.name),
            maxWidth: 520
        });
        this.appendCloseButton(nls.localizeByDefault('取消'));
        this.appendAcceptButton(nls.localizeByDefault('安装'));
    }

    get value(): boolean {
        return true;
    }

    protected render(): React.ReactNode {
        const entry = this.options.entry;
        return (
            <div className="theia-plugin-dialog">
                <div className="theia-plugin-dialog-field">
                    <label>{nls.localizeByDefault('来源')}:</label>
                    <span className="theia-plugin-dialog-value">{this.renderSource(entry)}</span>
                </div>
                <div className="theia-plugin-dialog-field">
                    <label>{nls.localize('theia/ai-registry/plugin/dialog/endorsedBy', '背书方')}:</label>
                    <span className="theia-plugin-dialog-value">
                        {entry.endorsements.length > 0
                            ? entry.endorsements.map(renderEndorsement).join(', ')
                            : nls.localize('theia/ai-registry/plugin/dialog/noEndorsements', '无背书组织')}
                    </span>
                </div>
                {entry.version !== undefined && (
                    <div className="theia-plugin-dialog-field">
                        <label>{nls.localizeByDefault('版本')}:</label>
                        <span className="theia-plugin-dialog-value">{entry.version}</span>
                    </div>
                )}
                {this.renderContents()}
                {entry.containedMcpServers.length > 0 && this.renderMcpWarning()}
            </div>
        );
    }

    protected renderSource(entry: ResolvedPluginEntry): string {
        return entry.sourcePath
            ? nls.localizeByDefault('{0} ({1})', entry.sourceUrl, entry.sourcePath)
            : entry.sourceUrl;
    }

    protected renderContents(): React.ReactNode {
        const { containedSkills, containedMcpServers } = this.options.entry;
        if (containedSkills.length === 0 && containedMcpServers.length === 0) {
            return undefined;
        }
        return (
            <div className="theia-plugin-dialog-section">
                <div className="theia-plugin-dialog-section-title">
                    {nls.localizeByDefault('包含')}
                </div>
                {containedSkills.length > 0 && (
                    <div className="theia-plugin-dialog-field">
                        <label>{nls.localizeByDefault('技能')}:</label>
                        <span className="theia-plugin-dialog-value">{containedSkills.map(skill => skill.name).join(', ')}</span>
                    </div>
                )}
                {containedMcpServers.length > 0 && (
                    <div className="theia-plugin-dialog-field">
                        <label>{nls.localizeByDefault('MCP 服务器')}:</label>
                        <span className="theia-plugin-dialog-value">
                            {containedMcpServers.map(server => server.transport
                                ? nls.localizeByDefault('{0} ({1})', server.name, server.transport)
                                : server.name).join(', ')}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    protected renderMcpWarning(): React.ReactNode {
        return (
            <div className="theia-plugin-dialog-warning">
                <i className="codicon codicon-warning" />
                <span>
                    {nls.localize(
                        'theia/ai-registry/plugin/dialog/mcpWarning',
                        '此插件的 MCP 服务器可以在你的机器上运行任意命令。背书覆盖的是插件整体——'
                        + '其中包含的任何服务器都不会被单独背书。服务器将在安装后自动启动。'
                    )}
                </span>
            </div>
        );
    }
}

/**
 * Shown only when staging a download reported a content-hash mismatch, i.e. the files received do
 * not match what the endorsing organization approved.
 *
 * The wording is deliberately even-handed. A mismatch is expected for up to a day after the plugin's
 * authors commit, because the registry re-reads sources daily and pins no commit, and a repository
 * using `.gitattributes` `export-ignore` produces one permanently. It is also what a compromised
 * source looks like. Nothing in the data separates the cases, so both are stated and the decision
 * stays with the user.
 */
export class PluginHashMismatchDialog extends ReactDialog<boolean> {

    constructor(protected readonly options: PluginHashMismatchDialogOptions) {
        super({
            title: nls.localize('theia/ai-registry/plugin/dialog/mismatch/title', '源已更改'),
            maxWidth: 520
        });
        this.appendCloseButton(nls.localizeByDefault('取消'));
        this.appendAcceptButton(nls.localize('theia/ai-registry/plugin/dialog/mismatch/installAnyway', '仍然安装'));
    }

    get value(): boolean {
        return true;
    }

    protected render(): React.ReactNode {
        const { entry, mismatch } = this.options;
        const endorsement = entry.endorsements[0];
        return (
            <div className="theia-plugin-dialog">
                <div className="theia-plugin-dialog-paragraph">
                    {endorsement
                        ? nls.localize(
                            'theia/ai-registry/plugin/dialog/mismatch/endorsed',
                            '为“{0}”下载的文件与 {1} 在 {2} 背书的内容不一致。',
                            entry.name,
                            endorsement.organizationId,
                            endorsement.date
                        )
                        : nls.localize(
                            'theia/ai-registry/plugin/dialog/mismatch/unendorsed',
                            '为“{0}”下载的文件与注册表发布的内容哈希不一致。',
                            entry.name
                        )}
                </div>
                <div className="theia-plugin-dialog-paragraph">
                    {nls.localize(
                        'theia/ai-registry/plugin/dialog/mismatch/explanation',
                        '在插件作者提交后的最多一天内出现这种情况是正常的，因为注册表每天重新读取源码且不锁定提交；'
                        + '从压缩包中排除文件的仓库则会永久出现这种情况。它也是源被入侵时的表现。'
                    )}
                </div>
                <div className="theia-plugin-dialog-field">
                    <label>{nls.localize('theia/ai-registry/plugin/dialog/mismatch/expected', '已背书')}:</label>
                    <span className="theia-plugin-dialog-hash">{mismatch.expected}</span>
                </div>
                <div className="theia-plugin-dialog-field">
                    <label>{nls.localize('theia/ai-registry/plugin/dialog/mismatch/actual', '已接收')}:</label>
                    <span className="theia-plugin-dialog-hash">{mismatch.actual}</span>
                </div>
            </div>
        );
    }
}
