<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI MCP SERVER 扩展</h2>

<hr />

</div>

## 描述

本包为 Theia 提供 Model Context Protocol（MCP）服务器功能，使 AI 工具能够访问 Theia 的服务和工作区信息。

### 功能特性

- **HTTP 传输**：使用 StreamableHTTPServerTransport 的 RESTful HTTP API 进行 MCP 通信
- **后端 MCP 贡献**：注册仅后端可用的工具、资源和提示词
- **前端 MCP 贡献**：注册可访问前端服务的、仅前端可用的工具、资源和提示词
- **前端-后端委托**：允许通过后端 MCP 服务器暴露前端贡献

### 开发设置

#### 启动 MCP 服务器

1. 启动 Theia 应用程序
2. MCP 服务器将自动启动，并可在 `/mcp` 路径访问，例如 `http://localhost:3000/mcp`

### API 端点

- `POST /mcp` - MCP 协议端点（用于所有 MCP 协议操作）

### 架构

MCP 服务器架构由以下部分组成：

1. **HTTP 传输层**：使用 StreamableHTTPServerTransport 管理 HTTP 连接
2. **MCP 服务器**：处理 MCP 协议消息的核心服务器实现
3. **后端贡献**：在 Node.js 后端上运行的扩展
4. **前端贡献**：在浏览器前端中运行的扩展
5. **前端-后端桥接**：连接前端和后端的 RPC 机制

### 创建后端贡献

后端贡献运行在 Node.js 后端中，可以访问后端服务：

```typescript
@injectable()
export class MyBackendContribution implements MCPBackendContribution {
    @inject(ILogger)
    protected readonly logger: ILogger;
    
    async configure(server: McpServer): Promise<void> {
        // Register a tool
        server.tool('my-backend-tool', {
            type: 'object',
            properties: {
                input: { type: 'string' }
            }
        }, async (args) => {
            this.logger.info('my-backend-tool called with args:', args);
            return {
                content: [{ type: 'text', text: 'Result from backend' }]
            };
        });
        
        // Register a resource
        server.resource(
            'my-resource',
            'theia://resource-uri',
            async (uri) => {
                return {
                    content: 'Resource content'
                };
            }
        );
        
        // Register a prompt
        server.prompt(
            'my-prompt',
            'Prompt description',
            {}, // Arguments schema
            async (args) => {
                return {
                    messages: [{
                        role: 'user',
                        content: { type: 'text', text: 'Prompt content' }
                    }]
                };
            }
        );
    }
}
```

在后端模块中注册该贡献：

```typescript
bind(MyBackendContribution).toSelf().inSingletonScope();
bind(MCPBackendContribution).toService(MyBackendContribution);
```

### 创建前端贡献

前端贡献运行在浏览器中，可以访问前端服务：

```typescript
@injectable()
export class MyFrontendContribution implements MCPFrontendContribution {
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;
    
    async getTools(): Promise<Tool[]> {
        return [{
            name: 'workspace-info',
            description: 'Get workspace info',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        }];
    }
    
    async getTool(name: string): Promise<ToolProvider | undefined> {
        if (name === 'workspace-info') {
            return {
                handler: async () => {
                    const roots = await this.workspaceService.roots;
                    return { 
                        roots: roots.map(r => r.resource.toString()) 
                    };
                },
                inputSchema: z.object({})
            };
        }
    }
    
    async getResources(): Promise<Resource[]> {
        return [{
            name: 'Workspace Information',
            uri: 'workspace://info',
            description: 'Workspace info',
            mimeType: 'application/json'
        }];
    }
    
    async readResource(uri: string): Promise<unknown> {
        if (uri === 'workspace://info') {
            const roots = await this.workspaceService.roots;
            return { roots: roots.map(r => r.resource.toString()) };
        }
    }
    
    async getPrompts(): Promise<Prompt[]> {
        return [{
            name: 'workspace-context',
            description: 'Generate workspace context',
            arguments: []
        }];
    }
    
    async getPrompt(name: string, args: unknown): Promise<PromptMessage[]> {
        if (name === 'workspace-context') {
            return [{
                role: 'user',
                content: { type: 'text', text: 'Workspace context information' }
            }];
        }
    }
}
```

在前端模块中注册该贡献：

```typescript
bind(MyFrontendContribution).toSelf().inSingletonScope();
bind(MCPFrontendContribution).toService(MyFrontendContribution);
```

### 安全注意事项

- MCP 服务器通过 HTTP 暴露 Theia 的功能
- 仅在受信任的环境中启用该服务器
- 在生产环境中考虑增加身份验证和授权
- 在你的贡献中限制对敏感操作的访问

## 更多信息

- [`@theia/ai-mcp-server` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-mcp-server.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
