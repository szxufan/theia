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

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
enableJSDOM();
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
try { FrontendApplicationConfigProvider.set({}); } catch { /* 已由其他 spec 设置 */ }

import { expect } from 'chai';
import { Emitter } from '@theia/core';
import { Container } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { AiPreviewWidget, PREVIEW_REFRESH_DEBOUNCE_MS } from './ai-preview-widget';

describe('AiPreviewWidget', () => {

    let widget: AiPreviewWidget;
    let filesChanged: Emitter<unknown>;
    let reloadCount: () => number;

    beforeEach(() => {
        filesChanged = new Emitter<unknown>();
        const container = new Container();
        container.bind(FileService).toConstantValue({
            onDidFilesChange: (listener: (e: unknown) => void) => filesChanged.event(listener)
        } as unknown as FileService);
        container.bind(AiPreviewWidget).toSelf();
        widget = container.get(AiPreviewWidget);
        reloadCount = () => (widget as unknown as { reloadCount: number }).reloadCount;
    });

    it('normalizes addresses without a scheme', () => {
        widget.openUrl('localhost:5173');
        expect((widget as unknown as { url: string }).url).to.equal('http://localhost:5173');

        widget.openUrl('https://example.com/app');
        expect((widget as unknown as { url: string }).url).to.equal('https://example.com/app');
    });

    it('ignores empty addresses', () => {
        widget.openUrl('   ');
        expect((widget as unknown as { url: string | undefined }).url).to.be.undefined;
    });

    it('debounces file-change reloads into a single refresh', done => {
        widget.openUrl('http://localhost:5173');
        const before = reloadCount();

        filesChanged.fire({});
        filesChanged.fire({});
        filesChanged.fire({});
        expect(reloadCount()).to.equal(before); // 防抖窗口内不刷新

        setTimeout(() => {
            expect(reloadCount()).to.equal(before + 1); // 三次事件只触发一次刷新
            done();
        }, PREVIEW_REFRESH_DEBOUNCE_MS + 100);
    });

    it('does not auto-refresh when the option is disabled', done => {
        widget.openUrl('http://localhost:5173');
        (widget as unknown as { autoRefresh: boolean }).autoRefresh = false;
        const before = reloadCount();

        filesChanged.fire({});
        setTimeout(() => {
            expect(reloadCount()).to.equal(before);
            done();
        }, PREVIEW_REFRESH_DEBOUNCE_MS + 100);
    });
});
