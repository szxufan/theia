// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH and others.
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

import { nls } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common';

/**
 * These preferences are not intended to reflect real settings.
 * They are placeholders to redirect users to the appropriate widget
 * in case the user looks in the preferences editor UI to find the configuration.
 */
export const AiConfigurationPreferences: PreferenceSchema = {
    properties: {
        'ai-features.agentSettings.details': {
            type: 'null',
            markdownDescription: nls.localize('theia/ai/ide/agent-description',
                '在 [AI 配置视图]({0})中配置 AI 代理设置，包括启用状态、LLM 选择、提示词模板自定义以及自定义代理创建。',
                'command:aiConfiguration:open'
            )
        },
        'ai-features.promptTemplates.details': {
            type: 'null',
            markdownDescription: nls.localize('theia/ai/ide/prompt-template-description',
                '在 [AI 配置视图]({0})中为 AI 代理选择提示词变体并自定义提示词模板。',
                'command:aiConfiguration:open'
            )
        },
        'ai-features.modelSelection.details': {
            type: 'null',
            markdownDescription: nls.localize('theia/ai/ide/model-selection-description',
                '在 [AI 配置视图]({0})中为每个 AI 代理选择所使用的大语言模型 (LLM)。',
                'command:aiConfiguration:open'
            )
        }
    }
};
