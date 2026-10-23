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

import { listByKeywords, ToolProvider, ToolRequest } from '@theia/ai-core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { URI } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { SkillService } from '@theia/ai-core/lib/browser/skill-service';
import { parseSkillFile } from '@theia/ai-core/lib/common/skill';
import { GET_SKILL_FILE_CONTENT_FUNCTION_ID, LIST_SKILLS_FUNCTION_ID } from '../common/workspace-functions';

@injectable()
export class ListSkills implements ToolProvider {
    static ID = LIST_SKILLS_FUNCTION_ID;

    @inject(SkillService)
    protected readonly skillService: SkillService;

    getTool(): ToolRequest {
        return {
            id: ListSkills.ID,
            name: ListSkills.ID,
            description: '按名称和描述列出可用技能。技能提供可复用的指令和领域知识；' +
                `用 ${GET_SKILL_FILE_CONTENT_FUNCTION_ID} 加载合适的技能。` +
                '传入包含任务中几个关键字的 query，可只获取名称或描述匹配任一关键字的技能，最匹配的排在前面。' +
                '省略 query 则列出全部技能。',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: '可选的空格分隔关键字，与技能名称和描述进行不区分大小写的匹配（例如 \'refactor test\'）'
                    }
                },
                required: []
            },
            handler: (arg_string: string) => this.listSkills(arg_string)
        };
    }

    protected async listSkills(arg_string: string): Promise<string> {
        const query: unknown = arg_string ? JSON.parse(arg_string).query : undefined;
        const keywords = typeof query === 'string' ? query.trim() : '';
        const entries = this.skillService.getSkills().map(skill => ({ name: skill.qualifiedName, description: skill.description }));
        return listByKeywords(entries, keywords) ?? (keywords
            ? `No skill matches '${keywords}'. Retry with other keywords or without a query to list all skills.`
            : 'No skills available.');
    }
}

@injectable()
export class GetSkillFileContent implements ToolProvider {
    static ID = GET_SKILL_FILE_CONTENT_FUNCTION_ID;

    @inject(SkillService)
    protected readonly skillService: SkillService;

    @inject(FileService)
    protected readonly fileService: FileService;

    getTool(): ToolRequest {
        return {
            id: GetSkillFileContent.ID,
            name: GetSkillFileContent.ID,
            description: '按技能名称返回技能文件的内容。用它读取 ' +
                `${LIST_SKILLS_FUNCTION_ID} 或 available_skills 中列出的技能的完整指令。` +
                '如果返回的技能以确切名称或 /<skill-name> 语法引用了另一个可用技能，在相关或被要求时' +
                '用同一工具加载该技能。' +
                '技能名称不带前导斜杠，且必须与已发现的技能之一匹配。',
            parameters: {
                type: 'object',
                properties: {
                    skillName: {
                        type: 'string',
                        description: '要获取的技能的确切名称，不带前导斜杠（例如 \'pdf-processing\'）'
                    }
                },
                required: ['skillName']
            },
            handler: (arg_string: string) => this.getSkillFileContent(arg_string)
        };
    }

    private async getSkillFileContent(arg_string: string): Promise<string> {
        const args = JSON.parse(arg_string);
        const skillName: string = args.skillName;

        const skill = this.skillService.getSkill(skillName);

        if (!skill) {
            return JSON.stringify({ error: `Skill not found: ${skillName}` });
        }

        try {
            const skillFileUri = URI.fromFilePath(skill.location);
            const fileContent = await this.fileService.read(skillFileUri);
            const parsed = parseSkillFile(fileContent.value);
            return parsed.content;
        } catch (error) {
            return JSON.stringify({ error: `Failed to load skill content: ${error}` });
        }
    }
}
