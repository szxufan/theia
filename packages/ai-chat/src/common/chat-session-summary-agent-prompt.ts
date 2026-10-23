/* eslint-disable @typescript-eslint/tslint/config  */
// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH and others.
//
// This file is licensed under the MIT License.
// See LICENSE-MIT.txt in the project root for license information.
// https://opensource.org/license/mit.
//
// SPDX-License-Identifier: MIT

import { CHANGE_SET_SUMMARY_VARIABLE_ID } from './context-variables';

export const CHAT_SESSION_SUMMARY_PROMPT = {
    id: 'chat-session-summary-system',
    defaultVariant: {
        id: 'chat-session-summary-system-default',
        template: '{{!-- !-- This prompt is licensed under the MIT License (https://opensource.org/license/mit).\n' +
            'Made improvements or adaptations to this prompt template? We\'d love for you to share it with the community! Contribute back here:  ' +
            'https://github.com/eclipse-theia/theia/discussions/new?category=prompt-template-contribution --}}\n\n' +
            '你是一个负责总结 AI 代理聊天会话、供后续使用的聊天代理。' +
            '请回顾上方的对话并生成一份简明的总结，涵盖所有关键细节，' +
            '包括全部需求、决策与待办事项。' +
            '总结必须足够全面，以便工作流能够无缝衔接。' +
            '该总结主要供其他 AI 代理使用，请面向 AI 代理组织你的回答。' +
            '同时请考虑系统消息。' +
            '务必包含所有必要的上下文信息，并使用唯一的引用（如 URI、文件路径等）。' +
            '如果对话围绕某个任务展开，请描述该任务的状态，即已完成的内容与尚未完成的内容。' +
            '如果会话中打开了变更集，请描述建议变更的状态。' +
            `\n\n{{${CHANGE_SET_SUMMARY_VARIABLE_ID}}}`,
    }
};
