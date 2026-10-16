// *****************************************************************************
// Copyright (C) 2019 Red Hat, Inc. and others.
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
// This file is inspired by VSCode and partially copied from https://github.com/Microsoft/vscode/blob/1.33.1/src/vs/workbench/contrib/tasks/common/problemMatcher.ts
// 'problemMatcher.ts' copyright:
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as Ajv from '@theia/core/shared/ajv';
import debounce = require('p-debounce');
import { postConstruct, injectable, inject } from '@theia/core/shared/inversify';
import { JsonSchemaContribution, JsonSchemaDataStore, JsonSchemaRegisterContext } from '@theia/core/lib/browser/json-schema-store';
import { deepClone, Emitter, nls } from '@theia/core/lib/common';
import { IJSONSchema } from '@theia/core/lib/common/json-schema';
import { inputsSchema } from '@theia/variable-resolver/lib/browser/variable-input-schema';
import URI from '@theia/core/lib/common/uri';
import { ProblemMatcherRegistry } from './task-problem-matcher-registry';
import { TaskDefinitionRegistry } from './task-definition-registry';
import { TaskServer, asVariableName } from '../common';
import { UserStorageUri } from '@theia/userstorage/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { JSONObject } from '@theia/core/shared/@lumino/coreutils';
import { taskSchemaId } from '../common/task-preferences';

@injectable()
export class TaskSchemaUpdater implements JsonSchemaContribution {

    @inject(JsonSchemaDataStore)
    protected readonly jsonSchemaData: JsonSchemaDataStore;

    @inject(ProblemMatcherRegistry)
    protected readonly problemMatcherRegistry: ProblemMatcherRegistry;

    @inject(TaskDefinitionRegistry)
    protected readonly taskDefinitionRegistry: TaskDefinitionRegistry;

    @inject(TaskServer)
    protected readonly taskServer: TaskServer;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected readonly onDidChangeTaskSchemaEmitter = new Emitter<void>();
    readonly onDidChangeTaskSchema = this.onDidChangeTaskSchemaEmitter.event;

    protected readonly uri = new URI(taskSchemaId);

    @postConstruct()
    protected init(): void {
        this.jsonSchemaData.setSchema(this.uri, '');
        this.updateProblemMatcherNames();
        this.updateSupportedTaskTypes();
        // update problem matcher names in the task schema every time a problem matcher is added or disposed
        this.problemMatcherRegistry.onDidChangeProblemMatcher(() => this.updateProblemMatcherNames());
        // update supported task types in the task schema every time a task definition is registered or removed
        this.taskDefinitionRegistry.onDidRegisterTaskDefinition(() => this.updateSupportedTaskTypes());
        this.taskDefinitionRegistry.onDidUnregisterTaskDefinition(() => this.updateSupportedTaskTypes());
    }

    registerSchemas(context: JsonSchemaRegisterContext): void {
        context.registerSchema({
            fileMatch: ['tasks.json', UserStorageUri.resolve('tasks.json').toString()],
            url: this.uri.toString()
        });
        this.workspaceService.updateSchema('tasks', { $ref: this.uri.toString() });
    }

    readonly update = debounce(() => this.doUpdate(), 0);
    protected doUpdate(): void {
        taskConfigurationSchema.anyOf = [processTaskConfigurationSchema, ...customizedDetectedTasks, ...customSchemas];

        const schema = this.getTaskSchema();
        this.doValidate = new Ajv().compile(schema);
        this.jsonSchemaData.setSchema(this.uri, schema);
        this.onDidChangeTaskSchemaEmitter.fire(undefined);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate(data: any): boolean {
        return !!this.doValidate && !!this.doValidate(data);
    }
    protected doValidate: Ajv.ValidateFunction | undefined;

    /**
     * Adds given task schema to `taskConfigurationSchema` as `oneOf` subschema.
     * Replaces existed subschema by given schema if the corresponding `$id` properties are equal.
     *
     * Note: please provide `$id` property for subschema to have ability remove/replace it.
     * @param schema subschema for adding to `taskConfigurationSchema`
     */
    addSubschema(schema: IJSONSchema): void {
        const schemaId = schema.$id;
        if (schemaId) {
            this.doRemoveSubschema(schemaId);
        }

        customSchemas.push(schema);
        this.update();
    }

    /**
     * Removes task subschema from `taskConfigurationSchema`.
     *
     * @param arg `$id` property of subschema
     */
    removeSubschema(arg: string): void {
        const isRemoved = this.doRemoveSubschema(arg);
        if (isRemoved) {
            this.update();
        }
    }

    /**
     * Removes task subschema from `customSchemas`, use `update()` to apply the changes for `taskConfigurationSchema`.
     *
     * @param arg `$id` property of subschema
     * @returns `true` if subschema was removed, `false` otherwise
     */
    protected doRemoveSubschema(arg: string): boolean {
        const index = customSchemas.findIndex(existed => !!existed.$id && existed.$id === arg);
        if (index > -1) {
            customSchemas.splice(index, 1);
            return true;
        }
        return false;
    }

    /** Returns an array of task types that are registered, including the default types */
    async getRegisteredTaskTypes(): Promise<string[]> {
        const serverSupportedTypes = await this.taskServer.getRegisteredTaskTypes();
        const browserSupportedTypes = this.taskDefinitionRegistry.getAll().map(def => def.taskType);
        const allTypes = new Set([...serverSupportedTypes, ...browserSupportedTypes]);
        return Array.from(allTypes.values()).sort();
    }

    private updateSchemasForRegisteredTasks(): void {
        customizedDetectedTasks.length = 0;
        const definitions = this.taskDefinitionRegistry.getAll();
        definitions.forEach(def => {
            const customizedDetectedTask: IJSONSchema = {
                type: 'object',
                required: ['type'],
                properties: {}
            };
            const taskType = {
                ...defaultTaskType,
                enum: [def.taskType],
                default: def.taskType,
                description: nls.localizeByDefault('要自定义的任务类型')
            };
            customizedDetectedTask.properties!.type = taskType;
            const required = def.properties.required || [];
            def.properties.all.forEach(taskProp => {
                if (required.find(requiredProp => requiredProp === taskProp)) { // property is mandatory
                    customizedDetectedTask.required!.push(taskProp);
                }
                customizedDetectedTask.properties![taskProp] = { ...def.properties.schema.properties![taskProp] };
            });
            customizedDetectedTask.properties!.label = taskLabel;
            customizedDetectedTask.properties!.problemMatcher = problemMatcher;
            customizedDetectedTask.properties!.presentation = presentation;
            customizedDetectedTask.properties!.options = commandOptionsSchema;
            customizedDetectedTask.properties!.group = group;
            customizedDetectedTask.properties!.detail = detail;
            customizedDetectedTask.additionalProperties = true;
            customizedDetectedTasks.push(customizedDetectedTask);
        });
    }

    /** Returns the task's JSON schema */
    getTaskSchema(): IJSONSchema & { default: JSONObject } {
        return {
            type: 'object',
            default: { version: '2.0.0', tasks: [] },
            properties: {
                version: {
                    type: 'string',
                    default: '2.0.0',
                    description: nls.localizeByDefault("此配置的版本号。")
                },
                tasks: {
                    type: 'array',
                    items: {
                        ...deepClone(taskConfigurationSchema)
                    },
                    description: nls.localizeByDefault('任务配置。通常是对外部任务运行器中已定义任务的补充。')
                },
                inputs: inputsSchema.definitions!.inputs
            },
            additionalProperties: false,
            allowComments: true,
            allowTrailingCommas: true,
        };
    }

    /** Gets the most up-to-date names of problem matchers from the registry and update the task schema */
    private updateProblemMatcherNames(): void {
        const matcherNames = this.problemMatcherRegistry.getAll().map(m => asVariableName(m.name));
        problemMatcherNames.length = 0;
        problemMatcherNames.push(...matcherNames);
        this.update();
    }

    private async updateSupportedTaskTypes(): Promise<void> {
        this.updateSchemasForRegisteredTasks();
        this.update();
    }
}

const commandSchema: IJSONSchema = {
    type: 'string',
    description: nls.localizeByDefault('要执行的命令。可以是外部程序或 Shell 命令。')
};

const commandArgSchema: IJSONSchema = {
    type: 'array',
    description: nls.localizeByDefault('调用此任务时传递给命令的参数。'),
    items: {
        type: 'string'
    }
};

const commandOptionsSchema: IJSONSchema = {
    type: 'object',
    description: nls.localizeByDefault('附加命令选项'),
    properties: {
        cwd: {
            type: 'string',
            description: nls.localize('theia/task/schema/commandOptions/cwd',
                "The current working directory of the executed program or script. If omitted Theia's current workspace root is used."),
            default: '${workspaceFolder}'
        },
        env: {
            type: 'object',
            description: nls.localizeByDefault("执行的程序或 Shell 的环境。如果省略，则使用父进程的环境。")
        },
        shell: {
            type: 'object',
            description: nls.localizeByDefault('配置要使用的 Shell。'),
            properties: {
                executable: {
                    type: 'string',
                    description: nls.localizeByDefault('要使用的 Shell。')
                },
                args: {
                    type: 'array',
                    description: nls.localizeByDefault('Shell 参数。'),
                    items: {
                        type: 'string'
                    }
                }
            }
        }
    }
};

const problemMatcherNames: string[] = [];
const defaultTaskTypes = ['shell', 'process'];
const supportedTaskTypes = [...defaultTaskTypes];
const taskLabel: IJSONSchema = {
    type: 'string',
    description: nls.localizeByDefault("任务的用户界面标签")
};
const defaultTaskType: IJSONSchema = {
    type: 'string',
    enum: supportedTaskTypes,
    default: defaultTaskTypes[0],
    description: nls.localizeByDefault('定义任务是作为进程运行，还是作为 Shell 内的命令运行。')
} as const;
const commandAndArgs = {
    command: commandSchema,
    args: commandArgSchema,
    options: commandOptionsSchema
};

const group: IJSONSchema = {
    oneOf: [
        {
            type: 'string',
            enum: ['build', 'test', 'none'],
            enumDescriptions: [
                nls.localizeByDefault("将任务标记为可通过“运行生成任务”命令访问的生成任务。"),
                nls.localizeByDefault("将任务标记为可通过“运行测试任务”命令访问的测试任务。"),
                nls.localizeByDefault('将任务分配到任何组')
            ]
        },
        {
            type: 'object',
            properties: {
                kind: {
                    type: 'string',
                    default: 'none',
                    description: nls.localizeByDefault("任务的执行组。"),
                    enum: ['build', 'test', 'none'],
                    enumDescriptions: [
                        nls.localizeByDefault("将任务标记为可通过“运行生成任务”命令访问的生成任务。"),
                        nls.localizeByDefault("将任务标记为可通过“运行测试任务”命令访问的测试任务。"),
                        nls.localizeByDefault('将任务分配到任何组')
                    ]
                },
                isDefault: {
                    type: 'boolean',
                    default: false,
                    description: nls.localizeByDefault('定义此任务是否为该组中的默认任务，或用于匹配应触发此任务的文件的 glob。')
                }
            }
        }
    ],
    description: nls.localizeByDefault(
        'Defines to which execution group this task belongs to. It supports "build" to add it to the build group and "test" to add it to the test group.')
};

const problemPattern: IJSONSchema = {
    default: {
        regexp: '^([^\\\\s].*)\\\\((\\\\d+,\\\\d+)\\\\):\\\\s*(.*)$',
        file: 1,
        location: 2,
        message: 3
    },
    type: 'object',
    properties: {
        regexp: {
            type: 'string',
            description: nls.localizeByDefault('用于在输出中查找错误、警告或信息的正则表达式。')
        },
        kind: {
            type: 'string',
            description: nls.localizeByDefault('模式是否匹配位置（文件和行）或仅匹配文件。')
        },
        file: {
            type: 'integer',
            description: nls.localizeByDefault('文件名的匹配组索引。如果省略，则使用 1。')
        },
        location: {
            type: 'integer',
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault("问题位置的匹配组索引。有效的位置模式为：(line)、(line,column) 和 (startLine,startColumn,endLine,endColumn)。如果省略，则假定为 (line,column)。")
        },
        line: {
            type: 'integer',
            description: nls.localizeByDefault("问题行的匹配组索引。默认为 2")
        },
        column: {
            type: 'integer',
            description: nls.localizeByDefault("问题行字符的匹配组索引。默认为 3")
        },
        endLine: {
            type: 'integer',
            description: nls.localizeByDefault("问题结束行的匹配组索引。默认为 undefined")
        },
        endColumn: {
            type: 'integer',
            description: nls.localizeByDefault("问题结束行字符的匹配组索引。默认为 undefined")
        },
        severity: {
            type: 'integer',
            description: nls.localizeByDefault("问题严重性的匹配组索引。默认为 undefined")
        },
        code: {
            type: 'integer',
            description: nls.localizeByDefault("问题代码的匹配组索引。默认为 undefined")
        },
        message: {
            type: 'integer',
            description: nls.localizeByDefault('消息的匹配组索引。如果省略，在指定位置时默认为 4，否则默认为 5。')
        },
        loop: {
            type: 'boolean',
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault('在多行匹配器循环中指示此模式是否在循环中执行（只要它匹配）。只能在多行模式的最后一个模式上指定。')
        }
    }
};

const multiLineProblemPattern: IJSONSchema = {
    type: 'array',
    items: problemPattern
};

const watchingPattern: IJSONSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        regexp: {
            type: 'string',
            description: nls.localizeByDefault('用于检测后台任务开始或结束的正则表达式。')
        },
        file: {
            type: 'integer',
            description: nls.localizeByDefault('文件名的匹配组索引。可以省略。')
        },
    }
};

const patternType: IJSONSchema = {
    anyOf: [
        {
            type: 'string',
            description: nls.localizeByDefault('已贡献或预定义模式的名称')
        },
        problemPattern,
        multiLineProblemPattern
    ],
    description: nls.localizeByDefault('问题模式或已贡献/预定义问题模式的名称。如果指定了 base，则可以省略。')
};

const problemMatcherObject: IJSONSchema = {
    type: 'object',
    properties: {
        base: {
            type: 'string',
            enum: problemMatcherNames,
            description: nls.localizeByDefault('要使用的基础问题匹配器的名称。')
        },
        owner: {
            type: 'string',
            description: nls.localize('theia/task/schema/problemMatcherObject/owner',
                "The owner of the problem inside Theia. Can be omitted if base is specified. Defaults to 'external' if omitted and base is not specified.")
        },
        source: {
            type: 'string',
            description: nls.localizeByDefault("描述此诊断来源的人类可读字符串，例如 'typescript' 或 'super lint'。")
        },
        severity: {
            type: 'string',
            enum: ['error', 'warning', 'info'],
            description: nls.localizeByDefault("捕获问题的默认严重性。如果模式未定义严重性的匹配组，则使用此值。")
        },
        applyTo: {
            type: 'string',
            enum: ['allDocuments', 'openDocuments', 'closedDocuments'],
            description: nls.localizeByDefault('控制在文本文档上报告的问题仅应用于已打开的文档、已关闭的文档还是所有文档。')
        },
        pattern: patternType,
        fileLocation: {
            oneOf: [
                {
                    type: 'string',
                    enum: ['absolute', 'relative', 'autoDetect']
                },
                {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            ],
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault('定义应如何解释问题模式中报告的文件名。相对 fileLocation 可以是数组，其中数组的第二个元素是相对文件位置的路径。search 的 fileLocation 模式会在第二个元素（如未指定则为当前工作区目录）的 include/exclude 属性所指定目录内执行深度（且可能开销较大）的文件系统搜索。')
        },
        background: {
            type: 'object',
            additionalProperties: false,
            description: nls.localizeByDefault('用于跟踪在后台任务上处于活动状态的匹配器开始和结束的模式。'),
            properties: {
                activeOnStart: {
                    type: 'boolean',
                    description: nls.localizeByDefault(
                        'If set to true the background monitor starts in active mode. This is the same as outputting a line that matches beginsPattern when the task starts.')
                },
                beginsPattern: {
                    oneOf: [
                        {
                            type: 'string'
                        },
                        watchingPattern
                    ],
                    description: nls.localizeByDefault('如果在输出中匹配，则表示后台任务开始。')
                },
                endsPattern: {
                    oneOf: [
                        {
                            type: 'string'
                        },
                        watchingPattern
                    ],
                    description: nls.localizeByDefault('如果在输出中匹配，则表示后台任务结束。')
                }
            }
        },
        watching: {
            type: 'object',
            additionalProperties: false,
            deprecationMessage: nls.localizeByDefault('watching 属性已弃用。请改用 background。'),
            description: nls.localizeByDefault('用于跟踪监视匹配器开始和结束的模式。'),
            properties: {
                activeOnStart: {
                    type: 'boolean',
                    description: nls.localizeByDefault(
                        'If set to true the watcher starts in active mode. This is the same as outputting a line that matches beginsPattern when the task starts.')
                },
                beginsPattern: {
                    oneOf: [
                        {
                            type: 'string'
                        },
                        watchingPattern
                    ],
                    description: nls.localizeByDefault('如果在输出中匹配，则表示监视任务开始。')
                },
                endsPattern: {
                    oneOf: [
                        {
                            type: 'string'
                        },
                        watchingPattern
                    ],
                    description: nls.localizeByDefault('如果在输出中匹配，则表示监视任务结束。')
                }
            }
        }
    }
};

const problemMatcher: IJSONSchema = {
    anyOf: [
        {
            type: 'string',
            enum: problemMatcherNames
        },
        {
            type: 'array',
            items: {
                type: 'string',
                enum: problemMatcherNames
            }
        },
        problemMatcherObject,
        {
            type: 'array',
            items: problemMatcherObject
        }
    ],
    description: nls.localizeByDefault('要使用的问题匹配器。可以是字符串、问题匹配器定义，或由字符串和问题匹配器组成的数组。')
};

const presentation: IJSONSchema = {
    type: 'object',
    default: {
        echo: true,
        reveal: 'always',
        focus: false,
        panel: 'shared',
        showReuseMessage: true,
        clear: false
    },
    description: nls.localizeByDefault("配置用于呈现任务输出并读取其输入的面板。"),
    additionalProperties: true,
    properties: {
        echo: {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('控制是否将执行的命令回显到面板。默认为 true。')
        },
        focus: {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('控制面板是否获取焦点。默认为 false。设置为 true 时面板也会被显示。')
        },
        reveal: {
            type: 'string',
            enum: ['always', 'silent', 'never'],
            enumDescriptions: [
                nls.localizeByDefault('执行此任务时始终显示终端。'),
                nls.localizeByDefault('仅在任务出错退出或问题匹配器发现错误时显示终端。'),
                nls.localizeByDefault('执行此任务时从不显示终端。')
            ],
            default: 'always',
            description: nls.localizeByDefault(
                'Controls whether the terminal running the task is revealed or not. May be overridden by option "revealProblems". Default is "always".')
        },
        panel: {
            type: 'string',
            enum: ['shared', 'dedicated', 'new'],
            enumDescriptions: [
                nls.localize('theia/task/schema/presentation/panel/shared', '终端是共享的，其他任务运行的输出会添加到同一终端中。'),
                // eslint-disable-next-line max-len
                nls.localize('theia/task/schema/presentation/panel/dedicated', '终端专用于特定任务。如果再次执行该任务，终端将被重用。但是，其他任务的输出将显示在另一个终端中。'),
                nls.localize('theia/task/schema/presentation/panel/new', '该任务的每次执行都使用一个全新的干净终端。')
            ],
            default: 'shared',
            description: nls.localizeByDefault('控制面板在任务之间共享、专用于此任务，还是每次运行时新建一个。')
        },
        showReuseMessage: {
            type: 'boolean',
            default: true,
            description: nls.localize('theia/task/schema/presentation/showReuseMessage', '控制是否显示"任务将重用终端"消息。')
        },
        clear: {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('控制执行任务前是否清空终端。')
        }
    }
};

const detail: IJSONSchema = {
    type: 'string',
    description: nls.localizeByDefault('任务的可选描述，将显示在“运行任务”快速选择中作为详细信息。')
};

const taskIdentifier: IJSONSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        type: {
            type: 'string',
            description: nls.localizeByDefault('任务标识符。')
        }
    }
};

const processTaskConfigurationSchema: IJSONSchema = {
    type: 'object',
    required: ['type', 'label', 'command'],
    properties: {
        label: taskLabel,
        type: defaultTaskType,
        ...commandAndArgs,
        isBackground: {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('执行的任务是否保持活动状态并在后台运行。')
        },
        dependsOn: {
            anyOf: [
                {
                    type: 'string',
                    description: nls.localizeByDefault('此任务依赖的另一个任务。')
                },
                taskIdentifier,
                {
                    type: 'array',
                    description: nls.localizeByDefault('此任务依赖的其他任务。'),
                    items: {
                        anyOf: [
                            {
                                type: 'string'
                            },
                            taskIdentifier
                        ]
                    }
                }
            ],
            description: nls.localizeByDefault('表示另一个任务的字符串，或此任务依赖的其他任务数组。')
        },
        dependsOrder: {
            type: 'string',
            enum: ['parallel', 'sequence'],
            enumDescriptions: [
                nls.localizeByDefault('并行运行所有依赖任务。'),
                nls.localizeByDefault('按顺序运行所有依赖任务。'),
            ],
            default: 'parallel',
            description: nls.localizeByDefault('确定此任务依赖任务的执行顺序。注意此属性不具有递归性。')
        },
        windows: {
            type: 'object',
            description: nls.localizeByDefault('Windows 特定的命令配置'),
            properties: commandAndArgs
        },
        osx: {
            type: 'object',
            description: nls.localizeByDefault('Mac 特定的命令配置'),
            properties: commandAndArgs
        },
        linux: {
            type: 'object',
            description: nls.localizeByDefault('Linux 特定的命令配置'),
            properties: commandAndArgs
        },
        group,
        problemMatcher,
        presentation,
        detail,
    },
    additionalProperties: true
};

const customizedDetectedTasks: IJSONSchema[] = [];
const customSchemas: IJSONSchema[] = [];

const taskConfigurationSchema: IJSONSchema = {
    $id: taskSchemaId,
    anyOf: [processTaskConfigurationSchema, ...customizedDetectedTasks, ...customSchemas]
};
