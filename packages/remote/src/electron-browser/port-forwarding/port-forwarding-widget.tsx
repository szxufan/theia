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

import * as React from '@theia/core/shared/react';
import { ReactNode } from '@theia/core/shared/react';
import { OpenerService, ReactWidget } from '@theia/core/lib/browser';
import { nls, URI } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ForwardedPort, PortForwardingService } from './port-forwarding-service';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';

export const PORT_FORWARDING_WIDGET_ID = 'port-forwarding-widget';

@injectable()
export class PortForwardingWidget extends ReactWidget {

    @inject(PortForwardingService)
    protected readonly portForwardingService: PortForwardingService;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    @postConstruct()
    protected init(): void {
        this.id = PORT_FORWARDING_WIDGET_ID;
        this.node.tabIndex = -1;
        this.title.label = nls.localizeByDefault('端口');
        this.title.caption = this.title.label;
        this.title.closable = true;
        this.update();

        this.portForwardingService.onDidChangePorts(() => this.update());
    }

    protected render(): ReactNode {
        if (this.portForwardingService.forwardedPorts.length === 0) {
            return <div>
                <p style={{ marginLeft: 'calc(var(--theia-ui-padding) * 2)' }}>
                    {nls.localizeByDefault('暂无转发的端口。转发端口即可通过互联网访问本地运行的服务。\n[转发端口]({0})').split('\n')[0]}
                </p>
                {this.renderForwardPortButton()}
            </div>;
        }

        return <div>
            <table className='port-table'>
                <thead>
                    <tr>
                        <th className='port-table-header'>{nls.localizeByDefault('端口')}</th>
                        <th className='port-table-header'>{nls.localizeByDefault('标签')}</th>
                        <th className='port-table-header'>{nls.localizeByDefault('地址')}</th>
                        <th className='port-table-header'>{nls.localizeByDefault('来源')}</th>
                    </tr>
                </thead>
                <tbody>
                    {this.portForwardingService.forwardedPorts.map(port => (
                        <tr key={port.address && port.localPort ? `${port.address}:${port.localPort}` : 'editing'}>
                            {this.renderPortColumn(port)}
                            <td>{port.label ?? ''}</td>
                            {this.renderAddressColumn(port)}
                            <td>{port.origin ? nls.localizeByDefault(port.origin) : ''}</td>
                        </tr>
                    ))}
                    {!this.portForwardingService.forwardedPorts.some(port => port.editing) && <tr><td>{this.renderForwardPortButton()}</td></tr>}
                </tbody>
            </table>
        </div>;
    }

    protected renderForwardPortButton(): ReactNode {
        return <button className='theia-button' onClick={() => {
            this.portForwardingService.forwardNewPort('User Forwarded');
            this.update();
        }
        }>{nls.localizeByDefault('转发端口')}</button>;
    }

    protected renderAddressColumn(port: ForwardedPort): ReactNode {
        const address = `${port.address ?? '0.0.0.0'}:${port.localPort}`;
        return <td>
            <div className='button-cell'>
                <span style={{ flexGrow: 1 }} className='forwarded-address' onClick={async e => {
                    if (e.ctrlKey) {
                        const uri = new URI(`http://${address}`);
                        (await this.openerService.getOpener(uri)).open(uri);
                    }
                }} title={nls.localizeByDefault('跟踪链接') + ' (ctrl/cmd + click)'}>
                    {port.localPort ? address : ''}
                </span>
                {
                    port.localPort &&
                    <span className='codicon codicon-clippy action-label' title={nls.localizeByDefault('复制本地地址')} onClick={() => {
                        this.clipboardService.writeText(address);
                    }}></span>
                }
            </div>
        </td>;
    }

    protected renderPortColumn(port: ForwardedPort): ReactNode {
        return port.editing ?
            <td><PortEditingInput port={port} service={this.portForwardingService} /></td> :
            <td>
                <div className='button-cell'>
                    <span style={{ flexGrow: 1 }}>{port.localPort}</span>
                    <span className='codicon codicon-close action-label' title={nls.localizeByDefault('停止转发端口')} onClick={() => {
                        this.portForwardingService.removePort(port);
                        this.update();
                    }}></span>
                </div>
            </td>;
    }

}

function PortEditingInput({ port, service }: { port: ForwardedPort, service: PortForwardingService }): React.JSX.Element {
    const [error, setError] = React.useState(false);
    return <input className={`theia-input forward-port-button${error ? ' port-edit-input-error' : ''}`} port-edit-input-error={error}
        autoFocus defaultValue={port.address ? `${port.address}:${port.localPort}` : port.localPort ?? ''}
        placeholder={nls.localizeByDefault('端口号或地址（例如 3000 或 10.10.10.10:2000）。')}
        onKeyDown={e => e.key === 'Enter' && !error && service.updatePort(port, e.currentTarget.value)}
        onKeyUp={e => setError(!service.isValidAddress(e.currentTarget.value))}></input>;

}
