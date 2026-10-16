<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI CHAT 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-chat` 扩展为 Theia 提供语言模型聊天（chat）的概念。
它是 `@theia/ai-chat-ui` 提供聊天 UI 的基础。

## 工具上下文模式

实现工具处理器时，根据工具是否需要聊天专属功能，有两种模式：

### 通用工具（无聊天依赖）

对于只需要取消支持等基本上下文的工具：

```typescript
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';

@injectable()
export class MyGenericTool implements ToolProvider {
    getTool(): ToolRequest {
        return {
            id: 'myTool',
            name: 'myTool',
            description: 'A generic tool',
            parameters: { type: 'object', properties: {} },
            handler: async (args: string, ctx?: ToolInvocationContext) => {
                if (ctx?.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled' });
                }
                // Tool implementation
                return 'result';
            }
        };
    }
}
```

### 聊天绑定工具（需要聊天会话）

对于需要访问聊天会话、请求模型或响应的工具：

```typescript
import { assertChatContext, ChatToolContext } from '@theia/ai-chat';
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core';

@injectable()
export class MyChatTool implements ToolProvider {
    getTool(): ToolRequest {
        return {
            id: 'myChatTool',
            name: 'myChatTool',
            description: 'A chat-bound tool',
            parameters: { type: 'object', properties: {} },
            handler: async (args: string, ctx?: ToolInvocationContext) => {
                assertChatContext(ctx); // Throws if not in chat context
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled' });
                }
                // Access chat-specific features
                const sessionId = ctx.request.session.id;
                ctx.request.session.changeSet.addElements(...);
                return 'result';
            }
        };
    }
}
```

`assertChatContext()` 函数既是运行时校验器，也是 TypeScript 类型守卫，确保上下文是带有 `request` 和 `response` 属性的 `ChatToolContext`。

## 更多信息

- [`@theia/ai-chat` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-chat.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
