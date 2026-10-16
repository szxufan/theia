<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - TASK 扩展</h2>

<hr />

</div>

## 描述

`@theia/task` 扩展允许在应用程序后端执行脚本或二进制程序。

任务启动配置可以在 `.theia/tasks.json` 中针对每个工作区独立定义。如果存在该文件，客户端打开工作区时会自动加载它，并监视其变更。可以通过触发 "Run Task"（运行任务）命令（快捷键 F1）来执行任务。随后会显示已知任务的列表，选择其中一个即可触发执行。

每个任务配置如下所示：

``` json
{
    "label": "Test task - list workspace files recursively",
    "type": "shell",
    "command": "ls",
    "args": [
        "-alR"
    ],
    "options": {
        "cwd": "${workspaceFolder}"
    },
    "windows": {
        "command": "cmd.exe",
        "args": [
            "/c",
            "dir",
            "/s"
        ]
    }
}
```

*label*：标识任务的唯一字符串。当需要选择要运行的任务配置时，显示给用户的就是它。

*type*：决定执行任务所使用的进程类型，可以是 "process" 或 "shell"。"shell" 类型进程的输出可以显示在 Theia 前端的终端组件中。如果类型设置为 "process"，则任务运行时不显示输出。

*command*：要执行的实际命令或脚本。如果命令能在系统路径中找到，则可以不带路径（例如 "ls"）；也可以使用绝对路径，此时不存在歧义；还可以使用相对路径，此时将相对于 cwd 解析。例如 "./task" 会被解释为工作区根目录下名为 "task" 的脚本或二进制程序。

*args*：字符串列表，每一项都是传递给命令的一个参数。

*options*：执行命令时使用的命令选项。在此处可以提供：

- *cwd*：当前工作目录，任务的命令将在此目录中执行。等同于在命令行中运行命令之前先 "cd" 到该目录。它可以包含变量 *${workspaceFolder}*，该变量会在执行时被替换为当前工作区的路径。如果未定义，默认设置为工作区根目录。
- *env*：被执行程序或 shell 的环境变量。如果省略，则使用父进程的环境变量。
- *shell*：任务类型为 `shell` 时的 shell 配置，用户可以通过 *shell* 指定要使用的 shell，并通过 *args* 指定传递给 shell 可执行文件以使命令模式运行的参数。

默认情况下，上述 *command* 和 *args* 在所有平台上都适用。然而，同一个任务并不总能在 Unix 和 Windows 上以相同的方式表达，例如命令和/或参数可能不同。如果任务需要同时在 Linux、macOS 和 Windows 上工作，最好将命令、命令参数和选项分开定义。

*windows*：如果定义了 *windows*，当任务在 Windows 后端执行时，其中的命令、命令参数和选项（即 *windows.command*、*windows.args* 和 *windows.options*）将优先于 *command*、*args* 和 *options*。

*osx*：如果定义了 *osx*，当任务在 macOS 后端执行时，其中的命令、命令参数和选项（即 *osx.command*、*osx.args* 和 *osx.options*）将优先于 *command*、*args* 和 *options*。

*linux*：如果定义了 *linux*，当任务在 Linux 后端执行时，其中的命令、命令参数和选项（即 *linux.command*、*linux.args* 和 *linux.options*）将优先于 *command*、*args* 和 *options*。

下面是一个可用于测试任务的 tasks.json 示例。只需将此内容添加到 theia 源码目录下的 `.theia` 目录中：

``` json
{
    // Some sample Theia tasks
    "tasks": [
        {
            "label": "[Task] short running test task (~3s)",
            "type": "shell",
            "command": "./task",
            "args": [
                "default 1",
                "default 2",
                "default 3"
            ],
            "options": {
                "cwd": "${workspaceFolder}/packages/task/src/node/test-resources/"
            },
            "windows": {
                "command": "cmd.exe",
                "args": [
                    "/c",
                    "task.bat",
                    "windows abc"
                ]
            },
            "linux": {
                "args": [
                    "linux 1",
                    "linux 2",
                    "linux 3"
                ]
            }
        },
        {
            "label": "[Task] long running test task (~300s)",
            "type": "shell",
            "command": "./task-long-running",
            "args": [],
            "options": {
                "cwd": "${workspaceFolder}/packages/task/src/node/test-resources/"
            },
            "windows": {
                "command": "cmd.exe",
                "args": [
                    "/c",
                    "task-long-running.bat"
                ]
            }
        },
        {
            "label": "[Task] recursively list files from workspace root",
            "type": "shell",
            "command": "ls",
            "args": [
                "-alR"
            ],
            "options": {
                "cwd": "${workspaceFolder}"
            },
            "windows": {
                "command": "cmd.exe",
                "args": [
                    "/c",
                    "dir",
                    "/s"
                ]
            }
        },
        {
            "label": "[Task] Echo a string",
            "type": "shell",
            "command": "bash",
            "args": [
                "-c",
                "echo 1 2 3"
            ],
            "options": {
                "cwd": "${workspaceFolder}"
            }
        }
    ]
}
```

## 变量替换

以下属性支持使用 `${variableName}` 语法的变量：

- `command`
- `args`
- `options.cwd`
- `windows.command`
- `windows.args`
- `windows.options.cwd`
- `osx.command`
- `osx.args`
- `osx.options.cwd`
- `linux.command`
- `linux.args`
- `linux.options.cwd`

详细文档请参见[这里](https://www.theia-ide.org/doc/index.html)。

## 贡献点

该扩展提供以下贡献点：

- `browser/TaskContribution` - 允许扩展提供自己的任务格式，和/或以编程方式向系统提供任务

```typescript
export interface TaskContribution {
    registerResolvers?(resolvers: TaskResolverRegistry): void;
    registerProviders?(providers: TaskProviderRegistry): void;
}
```

- `node/TaskRunnerContribution` - 允许扩展提供自己运行/终止任务的方式

```typescript
export interface TaskRunnerContribution {
    registerRunner(runners: TaskRunnerRegistry): void;
}
```

## 更多信息

- [`@theia/task` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_task.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
