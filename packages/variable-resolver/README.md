<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - VARIABLE-RESOLVER 扩展</h2>

<hr />

</div>

## 描述

`@theia/variable-resolver` 扩展提供在字符串内部使用 `${variableName}` 语法的变量替换机制。

### 变量贡献点

该扩展提供了一个钩子，允许任何扩展贡献自己的变量。
下面是贡献两个变量的示例：

- `${file}` - 返回当前编辑器中打开的文件的名称
- `${lineNumber}` - 返回当前文件中的当前行号

```typescript
@injectable()
export class EditorVariableContribution implements VariableContribution {

    constructor(
        @inject(EditorManager) protected readonly editorManager: EditorManager
    ) { }

    registerVariables(variables: VariableRegistry): void {
        variables.registerVariable({
            name: 'file',
            description: 'The name of the file opened in the current editor',
            resolve: () => {
                const currentEditor = this.getCurrentEditor();
                if (currentEditor) {
                    return currentEditor.uri.displayName;
                }
                return undefined;
            }
        });
        variables.registerVariable({
            name: 'lineNumber',
            description: 'The current line number in the current file',
            resolve: () => {
                const currentEditor = this.getCurrentEditor();
                if (currentEditor) {
                    return `${currentEditor.cursor.line + 1}`;
                }
                return undefined;
            }
        });
    }

    protected getCurrentEditor(): TextEditor | undefined {
        const currentEditor = this.editorManager.currentEditor;
        if (currentEditor) {
            return currentEditor.editor;
        }
        return undefined;
    }
}
```

注意，变量会被解析为 `MaybePromise<string | undefined>`，这意味着它既可以同步解析，也可以在 Promise 中解析。

### 使用变量解析服务

下面是在自己的插件中使用变量解析服务（Variable Resolver Service）的示例：

```typescript
@injectable()
export class MyService {

    constructor(
        @inject(VariableResolverService) protected readonly variableResolver: VariableResolverService
    ) { }

    async resolve(): Promise<void> {
        const text = 'cursor is in file ${file} on line ${lineNumber}';
        const resolved = await this.variableResolver.resolve(text);
        console.log(resolved);
    }
}
```

如果当前打开的是 `package.json` 文件且光标位于第 5 行，则控制台将输出以下内容：

```sh
cursor is in file package.json on line 5
```

## 更多信息

- [`@theia/variable-resolver` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_variable-resolver.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
