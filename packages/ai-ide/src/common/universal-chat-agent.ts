// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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

import { LanguageModelRequirement } from '@theia/ai-core/lib/common';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { AbstractStreamParsingChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { ILogger, nls } from '@theia/core';
import { universalTemplate, universalTemplateVariant } from './universal-prompt-template';

export const UniversalChatAgentId = 'Universal';
@injectable()
export class UniversalChatAgent extends AbstractStreamParsingChatAgent {
    @inject(ILogger) @named('ai-ide:UniversalChatAgent')
    protected override readonly logger: ILogger;

   id: string = UniversalChatAgentId;
   name = UniversalChatAgentId;
   displayName = nls.localize('theia/ai/chat/universal/displayName', '通用');
   languageModelRequirements: LanguageModelRequirement[] = [{
      purpose: 'chat',
      identifier: 'default/universal',
   }];
   protected defaultLanguageModelPurpose: string = 'chat';
   override description = nls.localize('theia/ai/chat/universal/description', '此代理旨在通过为一般编程和软件开发问题提供简洁准确的'
      + '回答来帮助软件开发者。它也是用户可能提出的任何通用'
      + '问题的后备。通用代理目前默认没有任何上下文，即它无法'
      + '访问当前的用户上下文或工作区。');

   override prompts = [{ id: 'universal-system', defaultVariant: universalTemplate, variants: [universalTemplateVariant] }];
   protected override systemPromptId: string = 'universal-system';
   override iconClass: string = 'codicon codicon-comment';
}
