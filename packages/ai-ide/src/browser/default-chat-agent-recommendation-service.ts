// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
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

import { injectable } from '@theia/core/shared/inversify';
import { ChatAgentRecommendationService, RecommendedAgent } from '@theia/ai-chat/lib/common';
import { nls } from '@theia/core/lib/common/nls';
import { CoderAgentId } from './coder-agent';
import { ArchitectAgentId } from './architect-agent';

@injectable()
export class DefaultChatAgentRecommendationService implements ChatAgentRecommendationService {

    getRecommendedAgents(): RecommendedAgent[] {
        return [
            {
                id: CoderAgentId,
                label: nls.localize('theia/ai/chat/agent/coder', '编码'),
                description: nls.localize('theia/ai/chat/agent/coder/description', '代码生成与修改')
            },
            {
                id: ArchitectAgentId,
                label: nls.localize('theia/ai/chat/agent/architect', '架构'),
                description: nls.localize('theia/ai/chat/agent/architect/description', '高层设计与架构')
            },
            {
                id: 'Universal',
                label: nls.localize('theia/ai/chat/agent/universal', '通用'),
                description: nls.localize('theia/ai/chat/agent/universal/description', '通用助手')
            }
        ];
    }
}
