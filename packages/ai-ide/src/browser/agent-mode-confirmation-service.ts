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

import {
    MarkdownChatResponseContentImpl,
    MutableChatRequestModel,
    QuestionResponseContentImpl
} from '@theia/ai-chat/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { nls, PreferenceScope, PreferenceService } from '@theia/core';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { PREFERENCE_NAME_AGENT_MODE_ENABLED } from '../common/ai-ide-preferences';

export const AgentModeConfirmationService = Symbol('AgentModeConfirmationService');
export interface AgentModeConfirmationService {
    isAcknowledged(): boolean;
    requestConfirmation(request: MutableChatRequestModel): Promise<boolean>;
}

@injectable()
export class AgentModeConfirmationServiceImpl implements AgentModeConfirmationService {

    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

    isAcknowledged(): boolean {
        return !!this.preferenceService.get<boolean>(PREFERENCE_NAME_AGENT_MODE_ENABLED, false);
    }

    async requestConfirmation(request: MutableChatRequestModel): Promise<boolean> {
        const deferred = new Deferred<boolean>();

        const agentModeLabel = nls.localize('theia/ai/ide/agentModeConfirmation/continueAgentMode', '继续使用代理模式');
        const editModeLabel = nls.localize('theia/ai/ide/agentModeConfirmation/continueEditMode', '继续使用编辑模式');

        request.response.response.addContent(new MarkdownChatResponseContentImpl(
            nls.localize('theia/ai/ide/agentModeConfirmation/msg',
                '您即将使用**代理模式**。在此模式下，代理可以自主**读取、创建和修改文件** '
                + '而无需对每项更改请求确认。\n\n'
                + '我们建议使用**版本控制**（例如 Git），以便您轻松审查和回退任何更改。\n\n'
                + '如果您希望更多的控制，可以改为继续使用**编辑模式**，'
                + '在该模式下更改将以建议的形式呈现，由您来应用。\n\n'
                + '您希望如何继续？')
        ));

        request.response.response.addContent(new QuestionResponseContentImpl(
            nls.localize('theia/ai/ide/agentModeConfirmation/info',
                '继续使用代理模式将保存您的确认。您以后可以随时通过 `ai-features.agentMode.enabled` 设置撤销。\n\n'
                + '继续使用编辑模式会将您的默认模式更改为编辑模式。\n\n'
                + '您可以随时通过模式选择器或 AI 配置更改模式。'),
            [{ text: agentModeLabel }, { text: editModeLabel }],
            request,
            async selectedOption => {
                if (selectedOption.text === agentModeLabel) {
                    await this.preferenceService.set(PREFERENCE_NAME_AGENT_MODE_ENABLED, true, PreferenceScope.User);
                    request.response.stopWaitingForInput();
                    deferred.resolve(true);
                } else {
                    request.response.stopWaitingForInput();
                    deferred.resolve(false);
                }
            }
        ));

        const progressMessage = request.response.addProgressMessage({
            content: nls.localize('theia/ai/ide/agentModeConfirmation/waiting', '等待确认...'),
            show: 'whileIncomplete'
        });
        request.response.waitForInput();

        return deferred.promise.then(result => {
            request.response.updateProgressMessage({ ...progressMessage, show: 'untilFirstContent', status: 'completed' });
            request.response.response.clearContent();
            return result;
        });
    }
}
