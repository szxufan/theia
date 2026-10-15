// *****************************************************************************
// Copyright (C) 2026 the fork maintainers and others.
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

import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ILogger } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { LocalizationProvider } from '@theia/core/lib/node/i18n/localization-provider';
import { HostedPluginLocalizationService } from './hosted-plugin-localization-service';
import { DeployedPlugin } from '../../common';

class TestHostedPluginLocalizationService extends HostedPluginLocalizationService {

    readonly warnings: string[] = [];
    readonly errors: string[] = [];

    constructor(configDir: string, currentLanguage = 'en') {
        super();
        Object.assign(this, {
            envVariables: <EnvVariablesServer>{
                getConfigDirUri: () => Promise.resolve(FileUri.create(configDir).toString())
            },
            localizationProvider: <LocalizationProvider><unknown>{
                getCurrentLanguage: () => currentLanguage
            },
            logger: <ILogger><unknown>{
                warn: (message: string) => this.warnings.push(message),
                error: (message: string) => this.errors.push(message)
            }
        });
    }

    get fallbackDir(): string | undefined {
        return this.cacheDirFallback;
    }

    async cacheDir(): Promise<string> {
        return this.getLocalizationCacheDir();
    }
}

describe('HostedPluginLocalizationService#initialize', function (): void {

    const tempRoots: string[] = [];

    function makeTempRoot(): string {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'theia-localization-service-'));
        tempRoots.push(root);
        return root;
    }

    after(() => {
        for (const root of tempRoots) {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('resolves `ready` and uses the shared cache directory when it can be cleaned', async () => {
        const configDir = makeTempRoot();
        const service = new TestHostedPluginLocalizationService(configDir);
        service.initialize();
        await service.ready;

        expect(service.fallbackDir).to.be.undefined;
        expect(await service.cacheDir()).to.equal(path.join(configDir, 'localization-cache'));
        expect(service.warnings).to.be.empty;
        expect(service.errors).to.be.empty;
    });

    it('resolves `ready` and falls back to a process-local cache directory when the shared cache directory cannot be cleaned', async () => {
        const configDir = makeTempRoot();
        // Simulate a locked/unusable shared cache directory: `emptyDir` fails on a path that is a file.
        fs.writeFileSync(path.join(configDir, 'localization-cache'), 'locked by another instance');
        const service = new TestHostedPluginLocalizationService(configDir, 'zh-cn');
        tempRoots.push(path.join(os.tmpdir(), `theia-localization-cache-${process.pid}`));
        try {
            service.initialize();
            // Must resolve even though the shared cache directory cannot be prepared,
            // otherwise plugin deployment (and with it frontend startup) would hang forever.
            await service.ready;

            expect(service.fallbackDir).to.equal(path.join(os.tmpdir(), `theia-localization-cache-${process.pid}`));
            expect(await service.cacheDir()).to.equal(service.fallbackDir);
            expect(service.warnings).to.have.length(1);
            expect(service.errors).to.be.empty;

            // The service must stay fully functional with the fallback cache directory.
            const pluginDir = makeTempRoot();
            const plugin = <DeployedPlugin><unknown>{
                metadata: { model: { id: 'vscode-language-pack-zh-hans', packageUri: FileUri.create(pluginDir).toString() } },
                contributes: {
                    localizations: [{
                        languageId: 'zh-cn',
                        translations: [{ id: 'vscode', path: 'translations.json' }]
                    }]
                }
            };
            await service.buildTranslationConfig([plugin]);

            const configFile = path.join(service.fallbackDir!, 'zh-cn', 'nls.config.zh-cn.json');
            expect(fs.existsSync(configFile)).to.be.true;
            expect(JSON.parse(fs.readFileSync(configFile, 'utf8'))).to.deep.equal({
                vscode: path.join(pluginDir, 'translations.json')
            });
            const nlsConfig = service.getNlsConfig();
            expect(nlsConfig.locale).to.equal('zh-cn');
            expect(nlsConfig._translationsConfigFile).to.equal(configFile);
        } finally {
            if (service.fallbackDir) {
                fs.rmSync(service.fallbackDir, { recursive: true, force: true });
            }
        }
    });
});
