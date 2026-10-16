// *****************************************************************************
// Copyright (C) 2024 TypeFox and others.
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
import { injectable } from '@theia/core/shared/inversify';

export interface PreferenceLayout {
    id: string;
    label: string;
    children?: PreferenceLayout[];
    settings?: string[];
}

export const COMMONLY_USED_SECTION_PREFIX = 'commonly-used';

export const COMMONLY_USED_LAYOUT = {
    id: COMMONLY_USED_SECTION_PREFIX,
    label: nls.localizeByDefault('常用'),
    settings: [
        'files.autoSave',
        'editor.fontSize',
        'editor.fontFamily',
        'editor.tabSize',
        'editor.renderWhitespace',
        'editor.cursorStyle',
        'editor.multiCursorModifier',
        'editor.insertSpaces',
        'editor.wordWrap',
        'files.exclude',
        'files.associations'
    ]
};

export const DEFAULT_LAYOUT: PreferenceLayout[] = [
    {
        id: 'editor',
        label: nls.localizeByDefault('文本编辑器'),
        settings: ['editor.*'],
        children: [
            {
                id: 'editor.cursor',
                label: nls.localizeByDefault('光标'),
                settings: ['editor.cursor*']
            },
            {
                id: 'editor.find',
                label: nls.localizeByDefault('查找'),
                settings: ['editor.find.*']
            },
            {
                id: 'editor.font',
                label: nls.localizeByDefault('字体'),
                settings: ['editor.font*']
            },
            {
                id: 'editor.format',
                label: nls.localizeByDefault('格式化'),
                settings: ['editor.format*']
            },
            {
                id: 'editor.diffEditor',
                label: nls.localizeByDefault('差异编辑器'),
                settings: ['diffEditor.*']
            },
            {
                id: 'editor.multiDiffEditor',
                label: nls.localizeByDefault('多文件差异编辑器'),
                settings: ['multiDiffEditor.*']
            },
            {
                id: 'editor.minimap',
                label: nls.localizeByDefault('小地图'),
                settings: ['editor.minimap.*']
            },
            {
                id: 'editor.suggestions',
                label: nls.localizeByDefault('建议'),
                settings: ['editor.*suggest*']
            },
            {
                id: 'editor.files',
                label: nls.localizeByDefault('文件'),
                settings: ['files.*']
            }
        ]
    },
    {
        id: 'workbench',
        label: nls.localizeByDefault('工作台'),
        settings: ['workbench.*', 'workspace.*'],
        children: [
            {
                id: 'workbench.appearance',
                label: nls.localizeByDefault('外观'),
                settings: [
                    'workbench.activityBar.*', 'workbench.*color*', 'workbench.fontAliasing', 'workbench.iconTheme', 'workbench.sidebar.location',
                    'workbench.*.visible', 'workbench.tips.enabled', 'workbench.tree.*', 'workbench.view.*'
                ]
            },
            {
                id: 'workbench.breadcrumbs',
                label: nls.localizeByDefault('痕迹导航'),
                settings: ['breadcrumbs.*']
            },
            {
                id: 'workbench.editor',
                label: nls.localizeByDefault('编辑器管理'),
                settings: ['workbench.editor.*']
            },
            {
                id: 'workbench.settings',
                label: nls.localizeByDefault('设置编辑器'),
                settings: ['workbench.settings.*']
            },
            {
                id: 'workbench.zenmode',
                label: nls.localizeByDefault('禅模式'),
                settings: ['zenmode.*']
            },
            {
                id: 'workbench.screencastmode',
                label: nls.localizeByDefault('屏幕演示模式'),
                settings: ['screencastMode.*']
            }
        ]
    },
    {
        id: 'window',
        label: nls.localizeByDefault('窗口'),
        settings: ['window.*'],
        children: [
            {
                id: 'window.newWindow',
                label: nls.localizeByDefault('新建窗口'),
                settings: ['window.*newwindow*']
            }
        ]
    },
    {
        id: 'features',
        label: nls.localizeByDefault('功能'),
        children: [
            {
                id: 'features.accessibilitySignals',
                label: nls.localizeByDefault('辅助功能信号'),
                settings: ['accessibility.signal*']
            },
            {
                id: 'features.accessibility',
                label: nls.localizeByDefault('辅助功能'),
                settings: ['accessibility.*']
            },
            {
                id: 'features.explorer',
                label: nls.localizeByDefault('资源管理器'),
                settings: ['explorer.*', 'outline.*']
            },
            {
                id: 'features.search',
                label: nls.localizeByDefault('搜索'),
                settings: ['search.*']
            },
            {
                id: 'features.debug',
                label: nls.localizeByDefault('调试'),
                settings: ['debug.*', 'launch']
            },
            {
                id: 'features.testing',
                label: nls.localizeByDefault('测试'),
                settings: ['testing.*']
            },
            {
                id: 'features.scm',
                label: nls.localizeByDefault('源代码管理'),
                settings: ['scm.*']
            },
            {
                id: 'features.extensions',
                label: nls.localizeByDefault('扩展'),
                settings: ['extensions.*']
            },
            {
                id: 'features.terminal',
                label: nls.localizeByDefault('终端'),
                settings: ['terminal.*']
            },
            {
                id: 'features.task',
                label: nls.localizeByDefault('任务'),
                settings: ['task.*']
            },
            {
                id: 'features.problems',
                label: nls.localizeByDefault('问题'),
                settings: ['problems.*']
            },
            {
                id: 'features.output',
                label: nls.localizeByDefault('输出'),
                settings: ['output.*']
            },
            {
                id: 'features.comments',
                label: nls.localizeByDefault('评论'),
                settings: ['comments.*']
            },
            {
                id: 'features.remote',
                label: nls.localizeByDefault('远程'),
                settings: ['remote.*']
            },
            {
                id: 'features.timeline',
                label: nls.localizeByDefault('时间线'),
                settings: ['timeline.*']
            },
            {
                id: 'features.toolbar',
                label: nls.localize('theia/preferences/toolbar', '工具栏'),
                settings: ['toolbar.*']
            },
            {
                id: 'features.notebook',
                label: nls.localizeByDefault('笔记本'),
                settings: ['notebook.*', 'interactiveWindow.*']
            },
            {
                id: 'features.mergeEditor',
                label: nls.localizeByDefault('合并编辑器'),
                settings: ['mergeEditor.*']
            },
            {
                id: 'features.chat',
                label: nls.localizeByDefault('聊天'),
                settings: ['chat.*', 'inlineChat.*']
            }
        ]
    },
    {
        id: 'application',
        label: nls.localizeByDefault('应用程序'),
        children: [
            {
                id: 'application.http',
                label: nls.localizeByDefault('HTTP'),
                settings: ['http.*']
            },
            {
                id: 'application.keyboard',
                label: nls.localizeByDefault('键盘'),
                settings: ['keyboard.*']
            },
            {
                id: 'application.update',
                label: nls.localizeByDefault('更新'),
                settings: ['update.*']
            },
            {
                id: 'application.telemetry',
                label: nls.localizeByDefault('遥测'),
                settings: ['telemetry.*']
            },
            {
                id: 'application.settingsSync',
                label: nls.localizeByDefault('设置同步'),
                settings: ['settingsSync.*']
            },
            {
                id: 'application.experimental',
                label: nls.localizeByDefault('实验性'),
                settings: ['application.experimental.*']
            },
            {
                id: 'application.other',
                label: nls.localizeByDefault('其他'),
                settings: ['application.*']
            }
        ]
    },
    {
        id: 'security',
        label: nls.localizeByDefault('安全性'),
        settings: ['security.*'],
        children: [
            {
                id: 'security.workspace',
                label: nls.localizeByDefault('工作区'),
                settings: ['security.workspace.*']
            }
        ]
    },
    {
        id: 'ai-features',
        label: nls.localize('theia/preferences/ai-features', 'AI 功能'),
        children: [
            {
                id: 'ai-features.aiEnablement',
                label: nls.localize('theia/preferences/ai-features/ai-enable', 'AI 启用'),
                settings: ['ai-features.AiEnable.*']
            },
            {
                id: 'ai-features.anthropic',
                label: 'Anthropic',
                settings: ['ai-features.anthropic.*']
            },
            {
                id: 'ai-features.chat',
                label: nls.localizeByDefault('聊天'),
                settings: ['ai-features.chat.*']
            },
            {
                id: 'ai-features.chatGpt',
                label: 'ChatGPT',
                settings: ['ai-features.chatGpt.*']
            },
            {
                id: 'ai-features.copilot',
                label: 'GitHub Copilot',
                settings: ['ai-features.copilot.*']
            },
            {
                id: 'ai-features.codeCompletion',
                label: nls.localize('theia/preferences/ai-features/code-completion', '代码补全'),
                settings: ['ai-features.codeCompletion.*']
            },
            {
                id: 'ai-features.huggingFace',
                label: 'Hugging Face',
                settings: ['ai-features.huggingFace.*']
            },
            {
                id: 'ai-features.mcp',
                label: nls.localizeByDefault('MCP'),
                settings: ['ai-features.mcp.*']
            },
            {
                id: 'ai-features.modelSettings',
                label: nls.localize('theia/preferences/ai-features/model-settings', '模型设置'),
                settings: ['ai-features.modelSettings.*', 'ai-features.languageModelAliases']
            },
            {
                id: 'ai-features.ollama',
                label: 'Ollama',
                settings: ['ai-features.ollama']
            },
            {
                id: 'ai-features.llamafile',
                label: 'Llamafile',
                settings: ['ai-features.llamafile.*']
            },
            {
                id: 'ai-features.openAiCustom',
                label: nls.localize('theia/preferences/ai-features/open-ai-custom', '{0} Custom Models', 'Open AI'),
                settings: ['ai-features.openAiCustom.*']
            },
            {
                id: 'ai-features.openAiOfficial',
                label: nls.localize('theia/preferences/ai-features/open-ai-official', '{0} Official Models', 'Open AI'),
                settings: ['ai-features.openAiOfficial.*']
            },
            {
                id: 'ai-features.promptTemplates',
                label: nls.localize('theia/preferences/ai-features/promptTemplates', '提示词模板'),
                settings: ['ai-features.promptTemplates.*']
            },
            {
                id: 'ai-features.SCANOSS',
                label: 'SCANOSS',
                settings: ['ai-features.SCANOSS.*']
            },
            {
                id: 'ai-features.workspaceFunctions',
                label: nls.localize('theia/preferences/ai-features/workspace-functions', '工作区函数'),
                settings: ['ai-features.workspaceFunctions.*']
            }
        ]

    },
    {
        id: 'extensions',
        label: nls.localizeByDefault('扩展'),
        children: [
            {
                id: 'extensions.hosted-plugin',
                label: nls.localize('theia/preferences/hostedPlugin', '托管插件'),
                settings: ['hosted-plugin.*']
            }
        ]
    }
];

@injectable()
export class PreferenceLayoutProvider {

    getLayout(): PreferenceLayout[] {
        return DEFAULT_LAYOUT;
    }

    getCommonlyUsedLayout(): PreferenceLayout {
        return COMMONLY_USED_LAYOUT;
    }

    hasCategory(id: string): boolean {
        return [...this.getLayout(), this.getCommonlyUsedLayout()].some(e => e.id === id);
    }

    getLayoutForPreference(preferenceId: string): PreferenceLayout | undefined {
        const layout = this.getLayout();
        for (const section of layout) {
            const item = this.findItemInSection(section, preferenceId);
            if (item) {
                return item;
            }
        }
        return undefined;
    }

    protected findItemInSection(section: PreferenceLayout, preferenceId: string): PreferenceLayout | undefined {
        // First check whether any of its children match the preferenceId.
        if (section.children) {
            for (const child of section.children) {
                const item = this.findItemInSection(child, preferenceId);
                if (item) {
                    return item;
                }
            }
        }
        // Then check whether the section itself matches the preferenceId.
        if (section.settings) {
            for (const setting of section.settings) {
                if (this.matchesSetting(preferenceId, setting)) {
                    return section;
                }
            }
        }
        return undefined;
    }

    protected matchesSetting(preferenceId: string, setting: string): boolean {
        if (setting.includes('*')) {
            return this.createRegExp(setting).test(preferenceId);
        }
        return preferenceId === setting;
    }

    protected createRegExp(setting: string): RegExp {
        return new RegExp(`^${setting.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
    }

}
