<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI CHAT UI 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-chat-ui` 扩展提供 `AI Chat`（AI 聊天）视图。\
`AI Chat 视图`可用于方便地与语言模型交流。

它基于 `@theia/ai-chat`。

## 自定义工具渲染器

要为特定工具创建专用渲染器，请实现 `ChatResponsePartRenderer` 接口，且其优先级高于默认的 `ToolCallPartRenderer`（优先级为 `10`）：

```typescript
@injectable()
export class MyToolRenderer implements ChatResponsePartRenderer<ToolCallChatResponseContent> {
    canHandle(response: ChatResponseContent): number {
        if (ToolCallChatResponseContent.is(response) && response.name === 'my_tool_id') {
            return 15;
        }
        return -1;
    }

    render(response: ToolCallChatResponseContent, parentNode: ResponseNode): ReactNode {
        // Custom rendering logic
    }
}
```

对于自定义确认 UI，请使用 `ToolConfirmationActions` 组件来复用带下拉选项的标准"允许/拒绝"按钮：

```typescript
import { ToolConfirmationActions } from '@theia/ai-chat-ui/lib/browser/chat-response-renderer/tool-confirmation';

<ToolConfirmationActions
    toolName="my_tool"
    toolRequest={toolRequest}
    onAllow={(mode) => response.confirm()}
    onDeny={(mode) => response.deny()}
/>
```

## 更多信息

- [`@theia/ai-chat-ui` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-chat-ui.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
