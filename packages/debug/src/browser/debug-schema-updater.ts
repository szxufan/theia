// *****************************************************************************
// Copyright (C) 2018 TypeFox and others.
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

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { JsonSchemaRegisterContext, JsonSchemaContribution, JsonSchemaDataStore } from '@theia/core/lib/browser/json-schema-store';
import { deepClone, nls } from '@theia/core/lib/common';
import { IJSONSchema } from '@theia/core/lib/common/json-schema';
import URI from '@theia/core/lib/common/uri';
import { DebugService } from '../common/debug-service';
import { debugPreferencesSchema } from '../common/debug-preferences';
import { inputsSchema } from '@theia/variable-resolver/lib/browser/variable-input-schema';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { defaultCompound } from '../common/debug-compound';
import { launchSchemaId } from '../common/launch-preferences';

@injectable()
export class DebugSchemaUpdater implements JsonSchemaContribution {

    protected readonly uri = new URI(launchSchemaId);

    @inject(JsonSchemaDataStore) protected readonly jsonStorage: JsonSchemaDataStore;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(DebugService) protected readonly debug: DebugService;

    @postConstruct()
    protected init(): void {
        this.jsonStorage.setSchema(this.uri, '');
    }

    registerSchemas(context: JsonSchemaRegisterContext): void {
        context.registerSchema({
            fileMatch: ['launch.json'],
            url: this.uri.toString()
        });
        this.workspaceService.updateSchema('launch', { $ref: this.uri.toString() });
    }

    async update(): Promise<void> {
        const types = await this.debug.debugTypes();
        const schema = { ...deepClone(launchSchema) };
        const items = (<IJSONSchema>schema!.properties!['configurations'].items);

        const attributePromises = types.map(type => this.debug.getSchemaAttributes(type));
        for (const attributes of await Promise.all(attributePromises)) {
            for (const attribute of attributes) {
                const properties: typeof attribute['properties'] = {};
                for (const key of ['debugViewLocation', 'openDebug', 'internalConsoleOptions']) {
                    properties[key] = debugPreferencesSchema.properties[`debug.${key}`];
                }
                attribute.properties = Object.assign(properties, attribute.properties);
                items.oneOf!.push(attribute);
            }
        }
        items.defaultSnippets!.push(...await this.debug.getConfigurationSnippets());
        this.jsonStorage.setSchema(this.uri, schema);
    }
}

const launchSchema: IJSONSchema = {
    $id: launchSchemaId,
    type: 'object',
    title: nls.localizeByDefault('启动'),
    required: [],
    default: { version: '0.2.0', configurations: [], compounds: [] },
    properties: {
        version: {
            type: 'string',
            description: nls.localizeByDefault('此文件格式的版本。'),
            default: '0.2.0'
        },
        configurations: {
            type: 'array',
            description: nls.localizeByDefault('配置列表。使用 IntelliSense 添加新配置或编辑现有配置。'),
            items: {
                defaultSnippets: [],
                'type': 'object',
                oneOf: []
            }
        },
        compounds: {
            type: 'array',
            description: nls.localizeByDefault('复合配置列表。每个复合配置引用多个将一起启动的配置。'),
            items: {
                type: 'object',
                required: ['name', 'configurations'],
                properties: {
                    name: {
                        type: 'string',
                        description: nls.localizeByDefault('复合配置的名称。显示在启动配置下拉菜单中。')
                    },
                    configurations: {
                        type: 'array',
                        default: [],
                        items: {
                            oneOf: [{
                                type: 'string',
                                description: nls.localizeByDefault('请使用唯一的配置名称。')
                            }, {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: {
                                        enum: [],
                                        description: nls.localizeByDefault('复合配置的名称。显示在启动配置下拉菜单中。')
                                    },
                                    folder: {
                                        enum: [],
                                        description: nls.localizeByDefault('复合配置所在文件夹的名称。')
                                    }
                                }
                            }]
                        },
                        description: nls.localizeByDefault('将作为此复合配置的一部分启动的配置名称。')
                    },
                    stopAll: {
                        type: 'boolean',
                        default: false,
                        description: nls.localizeByDefault('控制手动终止一个会话时是否停止复合配置的所有会话。')
                    },
                    preLaunchTask: {
                        type: 'string',
                        default: '',
                        description: nls.localizeByDefault('在任何复合配置启动前运行的任务。')
                    }
                },
                default: defaultCompound
            },
            default: [defaultCompound]
        },
        inputs: inputsSchema.definitions!.inputs
    },
    allowComments: true,
    allowTrailingCommas: true,
};
