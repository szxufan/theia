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

import { bindToolProvider } from '@theia/ai-core/lib/common/tool-invocation-registry';
import { PreferenceContribution } from '@theia/core/lib/common/preferences';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { aiWebPath, WebServer } from '../common/web-protocol';
import { webPreferences } from '../common/web-preferences';
import { WebAccessCapabilityContribution } from './web-access-capability-contribution';
import { WebFetchTool } from './web-fetch-tool';
import { WebSearchTool } from './web-search-tool';

export default new ContainerModule(bind => {
    bind(WebServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<WebServer>(aiWebPath);
    }).inSingletonScope();

    bindToolProvider(WebFetchTool, bind);
    bindToolProvider(WebSearchTool, bind);

    bind(FrontendApplicationContribution).to(WebAccessCapabilityContribution);

    bind(PreferenceContribution).toConstantValue({ schema: webPreferences });
});
