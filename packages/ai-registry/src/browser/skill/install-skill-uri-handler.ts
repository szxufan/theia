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

import { MessageService, nls } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { ConfirmDialog } from '@theia/core/lib/browser/dialogs';
import { OpenHandler } from '@theia/core/lib/browser/opener-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { RegistryFetchService } from '../../common/registry-fetch-service';
import { ResolvedSkillEntry } from '../../common/skill/skill-registry-types';
import { SkillInstallService } from './skill-install-service';
import { InstallSkillUriConfiguration } from './install-skill-uri-configuration';

const ID_PARAM = 'id';

/**
 * Handles `theia://install-skill?id=<skillId>` deep links. The URL is intentionally
 * minimal: the source, name and content hash are all read from the configured AI registry
 * by id, so the user installs exactly what the registry currently publishes.
 *
 * Unlike the MCP handler, the registry lookup lives in this same package, so the handler
 * consults the fetch service directly instead of going through a bridge interface.
 */
@injectable()
export class InstallSkillUriHandler implements OpenHandler {

    readonly id = 'install-skill-uri-handler';

    @inject(InstallSkillUriConfiguration)
    protected readonly configuration: InstallSkillUriConfiguration;

    @inject(RegistryFetchService)
    protected readonly fetchService: RegistryFetchService;

    @inject(SkillInstallService)
    protected readonly installService: SkillInstallService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    canHandle(uri: URI): number {
        return uri.scheme === this.configuration.getScheme()
            && uri.authority === this.configuration.getAuthority()
            ? 500
            : 0;
    }

    async open(uri: URI): Promise<object | undefined> {
        const skillId = this.extractSkillId(uri);
        if (!skillId) {
            this.messageService.error(nls.localize(
                'theia/ai-registry/skill/installUri/missingId',
                '安装链接缺少必需的 "id" 参数。'
            ));
            return undefined;
        }
        let entries: ResolvedSkillEntry[];
        try {
            entries = await this.fetchService.getSkillEntries();
        } catch {
            this.messageService.error(nls.localize(
                'theia/ai-registry/skill/installUri/fetchFailed',
                '无法加载 AI 注册表以安装技能“{0}”。',
                skillId
            ));
            return undefined;
        }
        const entry = entries.find(candidate => candidate.skillId === skillId);
        if (!entry) {
            this.messageService.error(nls.localize(
                'theia/ai-registry/skill/installUri/unknownId',
                '技能“{0}”未列在你的 AI 注册表中。',
                skillId
            ));
            return undefined;
        }
        if (!await this.confirmInstall(entry)) {
            return undefined;
        }
        try {
            await this.installService.install(entry);
            this.messageService.info(nls.localize(
                'theia/ai-registry/skill/installUri/success',
                '已从 AI 注册表安装技能“{0}”。',
                entry.name
            ));
        } catch (error) {
            this.messageService.error(error instanceof Error ? error.message : String(error));
        }
        return undefined;
    }

    protected async confirmInstall(entry: ResolvedSkillEntry): Promise<boolean> {
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai-registry/skill/installUri/confirm/title', '安装技能'),
            msg: nls.localize(
                'theia/ai-registry/skill/installUri/confirm/msg',
                '通过从 {1} 下载文件来安装技能“{0}”吗？',
                entry.name,
                entry.sourceUrl
            ),
            ok: nls.localizeByDefault('安装'),
            cancel: nls.localizeByDefault('取消')
        });
        return !!await dialog.open();
    }

    protected extractSkillId(uri: URI): string | undefined {
        return new URLSearchParams(uri.query).get(ID_PARAM)?.trim() || undefined;
    }
}
