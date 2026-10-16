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

import { ChatResponsePartRenderer } from '@theia/ai-chat-ui/lib/browser/chat-response-part-renderer';
import { ResponseNode } from '@theia/ai-chat-ui/lib/browser/chat-tree-view';
import { ChatResponseContent, ToolCallChatResponseContent } from '@theia/ai-chat/lib/common';
import { codicon, LabelProvider } from '@theia/core/lib/browser';
import { URI } from '@theia/core/lib/common/uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ReactNode } from '@theia/core/shared/react';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { ClaudeCodeToolCallChatResponseContent } from '../claude-code-tool-call-content';
import { CollapsibleToolRenderer } from './collapsible-tool-renderer';
import { nls, ILogger } from '@theia/core';

interface GrepToolInput {
    pattern: string;
    path?: string;
    output_mode?: keyof typeof GREP_OUTPUT_MODES;
    glob?: string;
    type?: string;
    '-i'?: boolean;
    '-n'?: boolean;
    '-A'?: number;
    '-B'?: number;
    '-C'?: number;
    multiline?: boolean;
    head_limit?: number;
}

const GREP_OUTPUT_MODES = {
    'content': nls.localize('theia/ai/claude-code/grepOutputModes/content', '内容'),
    'files_with_matches': nls.localize('theia/ai/claude-code/grepOutputModes/filesWithMatches', '匹配的文件'),
    'count': nls.localize('theia/ai/claude-code/grepOutputModes/count', '计数')
};

@injectable()
export class GrepToolRenderer implements ChatResponsePartRenderer<ToolCallChatResponseContent> {

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(ILogger) @named('ai-claude-code:GrepToolRenderer')
    protected readonly logger: ILogger;

    canHandle(response: ChatResponseContent): number {
        if (ClaudeCodeToolCallChatResponseContent.is(response) && response.name === 'Grep') {
            return 15; // Higher than default ToolCallPartRenderer (10)
        }
        return -1;
    }

    render(response: ToolCallChatResponseContent, parentNode: ResponseNode): ReactNode {
        try {
            const input = JSON.parse(response.arguments || '{}') as GrepToolInput;
            return <GrepToolComponent
                input={input}
                workspaceService={this.workspaceService}
                labelProvider={this.labelProvider}
            />;
        } catch (error) {
            this.logger.warn('Failed to parse Grep tool input:', error);
            return <div className="claude-code-tool error">{nls.localize('theia/ai/claude-code/failedToParseGrepToolData', '解析 Grep 工具数据失败')}</div>;
        }
    }
}

const GrepToolComponent: React.FC<{
    input: GrepToolInput;
    workspaceService: WorkspaceService;
    labelProvider: LabelProvider;
}> = ({ input, workspaceService, labelProvider }) => {
    const getSearchScope = (): string => {
        if (input.path) {
            return input.path.split('/').pop() || input.path;
        }
        return nls.localize('theia/ai/claude-code/project', '项目');
    };

    const getWorkspaceRelativePath = async (filePath: string): Promise<string> => {
        try {
            const absoluteUri = new URI(filePath);
            const workspaceRelativePath = await workspaceService.getWorkspaceRelativePath(absoluteUri);
            return workspaceRelativePath || '';
        } catch {
            return '';
        }
    };

    const [relativePath, setRelativePath] = React.useState<string>('');

    React.useEffect(() => {
        if (input.path) {
            getWorkspaceRelativePath(input.path).then(setRelativePath);
        }
    }, [input.path]);

    const getOptionsInfo = (): { label: string; count: number } => {
        const options = [];
        if (input['-i']) { options.push(nls.localize('theia/ai/claude-code/grepOptions/caseInsensitive', '忽略大小写')); }
        if (input['-n']) { options.push(nls.localize('theia/ai/claude-code/grepOptions/lineNumbers', '行号')); }
        if (input['-A']) { options.push(nls.localize('theia/ai/claude-code/grepOptions/linesAfter', '后 {0} 行'), input['-A']); }
        if (input['-B']) { options.push(nls.localize('theia/ai/claude-code/grepOptions/linesBefore', '前 {0} 行', input['-B'])); }
        if (input['-C']) { options.push(nls.localize('theia/ai/claude-code/grepOptions/linesContext', '前后各 {0} 行', input['-C'])); }
        if (input.multiline) { options.push(nls.localize('theia/ai/claude-code/grepOptions/multiLine', '多行')); }
        if (input.glob) { options.push(nls.localize('theia/ai/claude-code/grepOptions/glob', 'glob：{0}', input.glob)); }
        if (input.type) { options.push(nls.localize('theia/ai/claude-code/grepOptions/type', '类型：{0}', input.type)); }
        if (input.head_limit) { options.push(nls.localize('theia/ai/claude-code/grepOptions/headLimit', '限制：{0}', input.head_limit)); }

        return {
            label: options.length > 0 ? options.join(', ') : '',
            count: options.length
        };
    };

    const optionsInfo = getOptionsInfo();

    const compactHeader = (
        <>
            <div className="claude-code-tool header-left">
                <span className="claude-code-tool title">{nls.localize('theia/ai/claude-code/searching', '正在搜索')}</span>
                <span className={`${codicon('search')} claude-code-tool icon`} />
                <span className="claude-code-tool pattern">"{input.pattern}"</span>
                <span className="claude-code-tool scope">{nls.localizeByDefault('在 {0} 中', getSearchScope())}</span>
                {relativePath && <span className="claude-code-tool relative-path">{relativePath}</span>}
            </div>
            <div className="claude-code-tool header-right">
                {input.output_mode && input.output_mode !== 'files_with_matches' && (
                    <span className="claude-code-tool badge">{GREP_OUTPUT_MODES[input.output_mode]}</span>
                )}
                {optionsInfo.count > 0 && (
                    <span className="claude-code-tool badge" title={optionsInfo.label}>
                        {optionsInfo.count > 1
                            ? nls.localize('theia/ai/claude-code/optionsCount', '{0} 个选项', optionsInfo.count)
                            : nls.localize('theia/ai/claude-code/oneOption', '1 个选项')}
                    </span>
                )}
            </div>
        </>
    );

    const expandedContent = (
        <div className="claude-code-tool details">
            <div className="claude-code-tool detail-row">
                <span className="claude-code-tool detail-label">{nls.localizeByDefault('模式')}</span>
                <code className="claude-code-tool detail-value">"{input.pattern}"</code>
            </div>
            <div className="claude-code-tool detail-row">
                <span className="claude-code-tool detail-label">{nls.localize('theia/ai/claude-code/searchPath', '搜索路径')}</span>
                <code className="claude-code-tool detail-value">{input.path || nls.localize('theia/ai/claude-code/projectRoot', '项目根目录')}</code>
            </div>
            {input.output_mode && (
                <div className="claude-code-tool detail-row">
                    <span className="claude-code-tool detail-label">{nls.localizeByDefault('模式')}</span>
                    <span className="claude-code-tool detail-value">{GREP_OUTPUT_MODES[input.output_mode]}</span>
                </div>
            )}
            {input.glob && (
                <div className="claude-code-tool detail-row">
                    <span className="claude-code-tool detail-label">{nls.localize('theia/ai/claude-code/fileFilter', '文件过滤器')}</span>
                    <code className="claude-code-tool detail-value">{input.glob}</code>
                </div>
            )}
            {input.type && (
                <div className="claude-code-tool detail-row">
                    <span className="claude-code-tool detail-label">{nls.localize('theia/ai/claude-code/fileType', '文件类型')}</span>
                    <span className="claude-code-tool detail-value">{input.type}</span>
                </div>
            )}
            {optionsInfo.label && (
                <div className="claude-code-tool detail-row">
                    <span className="claude-code-tool detail-label">{nls.localizeByDefault('选项')}</span>
                    <span className="claude-code-tool detail-value">{optionsInfo.label}</span>
                </div>
            )}
        </div>
    );

    return (
        <CollapsibleToolRenderer
            compactHeader={compactHeader}
            expandedContent={expandedContent}
        />
    );
};
