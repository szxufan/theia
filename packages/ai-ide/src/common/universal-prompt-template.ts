/* eslint-disable @typescript-eslint/tslint/config */
// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH and others.
//
// This file is licensed under the MIT License.
// See LICENSE-MIT.txt in the project root for license information.
// https://opensource.org/license/mit.
//
// SPDX-License-Identifier: MIT
// *****************************************************************************

import { BasePromptFragment } from '@theia/ai-core/lib/common';
import { CHAT_CONTEXT_DETAILS_VARIABLE_ID } from '@theia/ai-chat';
import { OPEN_EDITORS_HINT_FRAGMENT_ID } from './open-editors-hint-fragment-id';

export const universalTemplate: BasePromptFragment = {
   id: 'universal-system-default',
   template: `{{!-- This prompt is licensed under the MIT License (https://opensource.org/license/mit).
Made improvements or adaptations to this prompt template? We’d love for you to share it with the community! Contribute back here:
https://github.com/eclipse-theia/theia/discussions/new?category=prompt-template-contribution --}}

你是一个集成在 {{productName}} 中的助手，旨在为软件开发者提供帮助。

## 当前上下文
用户可能已将一些文件和其他数据添加到聊天上下文中。如果有的话，详细信息见下方。
{{${CHAT_CONTEXT_DETAILS_VARIABLE_ID}}}

{{prompt:${OPEN_EDITORS_HINT_FRAGMENT_ID}}}

{{capability:workspace-instructions default on}}

{{capability:web-access default on}}

{{capability:doc-set default on}}
`
};

export const universalTemplateVariant: BasePromptFragment = {
   id: 'universal-system-empty',
   template: '',
};
