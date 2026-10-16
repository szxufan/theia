# 如何添加新的自定义插件 API

作为 Theia 开发者，你可能希望让你的应用能够以应用独有的方式被插件扩展。
这将需要超出 VS Code Extension API 和 Theia 插件 API 范围的 API。
你可以通过实现一个 Theia 扩展来做到这一点：该扩展在插件宿主内创建并暴露一个 API 对象。
你的插件可以导入该 API 对象，它暴露一个或多个 API 命名空间。

根据插件宿主的不同，我们可以提供前端或后端插件 API，也可以为扩展或访问后端服务的无头（headless）插件提供 API：

- 在运行于 Node 环境独立进程中的后端插件宿主中，我们调整模块加载机制，使其返回自定义的 API 对象，而不是加载具有特定名称的模块。
每个已连接的 Theia 前端都有一个独立的插件宿主。
- 在通过 web worker 运行于浏览器环境中的前端插件宿主中，我们导入 API 脚本并将其放入全局上下文。
每个已连接的 Theia 前端都有一个独立的插件宿主。
- 同样运行于 Node 环境独立进程中的无头插件宿主，我们同样调整模块加载机制。
当第一个无头插件被部署时（无论是在启动时还是在运行期间后续安装时），唯一的无头插件宿主进程才会被启动。

在本文档中，我们聚焦于自定义后端插件 API 的实现。
无头插件 API 与之类似，同一个 API 也可以同时贡献给后端和无头插件宿主。
后端、前端和无头这三种 API 都可以通过实现并绑定 `ExtPluginApiProvider` 来提供，它应被打包为一个 Theia 扩展。

## 声明你的插件 API 提供方

插件 API 提供方在相应的插件宿主上执行，以添加你的自定义 API 对象和命名空间。
在你的 `package.json` 中添加 `@theia/plugin-ext` 作为依赖。
如果你的插件要向无头插件贡献 API，则还需要添加 `@theia/plugin-ext-headless` 包作为依赖。

Foo 插件 API 提供方示例。
可以看到，它为以前端连接为作用域的后端插件和无头插件提供了由同一脚本初始化的相同 API。
这些 API 初始化脚本可以以任意组合提供，在各自的插件宿主中提供相同或不同的能力，当然，一个都不提供就有些奇怪了。

```typescript
@injectable()
export class FooExtPluginApiProvider implements ExtPluginApiProvider {
    provideApi(): ExtPluginApi {
        return {
            frontendExtApi: {
                initPath: '/path/to/foo/api/implementation.js',
                initFunction: 'fooInitializationFunction',
                initVariable: 'foo_global_variable'
            },
            backendInitPath: path.join(__dirname, 'foo-init'),
            // Provide the same API to headless plugins, too (or a different/subset API)
            headlessInitPath: path.join(__dirname, 'foo-init')
        };
    }
}
```

在后端模块中注册你的插件 API 提供方：

```typescript
    bind(FooExtPluginApiProvider).toSelf().inSingletonScope();
    bind(Symbol.for(ExtPluginApiProvider)).toService(FooExtPluginApiProvider);
```

## 定义你的 API

为了便于使用你的 API，应将其开发为独立的 npm 包，可以轻松导入而无需任何额外依赖，参考 VS Code API 或 Theia 插件 API。

`foo.d.ts` 示例：

```typescript
declare module '@bar/foo' {
    export class Foo { }

    export namespace fooBar {
        export function getFoo(): Promise<Foo>;
    }
}
```

## 实现你的插件 API 提供方

在我们的示例中，我们的目标是为后端提供一个新的 API 对象。
Theia 期望我们在 API 提供方中指定的 `backendInitPath` 或 `headlessInitPath` 以名称 `containerModule` 导出一个 [InversifyJS](https://inversify.io) 的 `ContainerModule`。
该容器模块在插件宿主中配置 Inversify `Container`，用于创建我们的 API 对象。
它还为我们实现了对 Node 模块加载系统的定制，将我们的 API 工厂挂钩到我们所选模块名的导入上。

`node/foo-init.ts` 示例：

```typescript
import { inject, injectable } from '@theia/core/shared/inversify';
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';
import { Plugin } from '@theia/plugin-ext/lib/common/plugin-api-rpc';
import { PluginContainerModule } from '@theia/plugin-ext/lib/plugin/node/plugin-container-module';
import { FooExt } from '../common/foo-api-rpc';
import { FooExtImpl } from './foo-ext-impl';

import * as fooBarAPI from '@bar/foo';

type FooBarApi = typeof fooBarAPI;
type Foo = FooBarApi['Foo'];

const FooBarApiFactory = Symbol('FooBarApiFactory');

// Retrieved by Theia to configure the Inversify DI container when the plugin is initialized.
// This is called when the plugin-host process is forked.
export const containerModule = PluginContainerModule.create(({ bind, bindApiFactory }) => {
    // Bind the implementations of our Ext API interfaces (here just one)
    bind(FooExt).to(FooExtImpl).inSingletonScope();

    // Bind our API factory to the module name by which plugins will import it
    bindApiFactory('@bar/foo', FooBarApiFactory, FooBarApiFactoryImpl);
});
```

## 实现你的 API 对象

我们在模块加载过程中为每个单独的插件创建专属的 API 对象。
如果某个脚本导入了 `@bar/foo`，则该 API 对象会作为模块加载过程的一部分被返回，因此它应当与我们 `*.d.ts` 文件中提供的 API 定义相匹配。
多次导入不会导致创建多个 API 对象，因为 `PluginContainerModule` 会自动为我们缓存 API 实现。

`node/foo-init.ts` 示例（续）：

```typescript
// Creates the @foo/bar API object
@injectable()
class FooBarApiFactoryImpl {
    @inject(RPCProtocol) protected readonly rpc: RPCProtocol;
    @inject(FooExt) protected readonly fooExt: FooExt;

    @postConstruct()
    initialize(): void {
        this.rpc.set(FOO_MAIN_RPC_CONTEXT.FOO_EXT, this.fooExt);
    }

    // The plugin host expects our API factory to export a `createApi()` method
    createApi(plugin: Plugin): FooBarApi {
        const self = this;
        return {
            fooBar: {
                getFoo(): Promise<Foo> {
                    return self.fooExt.getFooImpl();
                }
            }
        };
    };
}
```

在上面的示例中，API 对象创建了一个满足 API 契约的本地对象。
实现细节被该对象隐藏，它可以是一个仅存在于插件宿主内部的本地实现，也可以是使用 `RPCProtocol` 与主应用通信以触发变更、注册功能或获取信息的实现。

### 实现 Main-Ext 通信

在本文档中，我们只重点介绍建立主应用与外部插件宿主之间通信所需的各个部分。
有关与主应用通信的 API 的更完整示例，请查看 [Theia 插件 API](https://github.com/eclipse-theia/theia/blob/master/doc/Plugin-API.md) 的定义。

首先，我们需要在 RPC 协议上建立通信：为我们自己这一侧提供实现，并为对侧生成代理。
代理使用专用的标识符来识别，因此我们先设置它们以及预期的接口。
`Ext` 和 `Main` 接口包含通过 RCP 调用的函数，并且必须以 `$` 开头。
由于通过 RPC 进行的通信是异步的，其结果应始终是 `Promise` 或 `PromiseLike`。

`common/foo-api-rpc.ts` 示例：

```typescript
export const FooMain = Symbol('FooMain');
export interface FooMain {
    $getFooImpl(): Promise<Foo>;
}

export const FooExt = Symbol('FooExt');
export interface FooExt {
    // placeholder for callbacks for the main application to the extension
}

// Plugin host will obtain a proxy using these IDs, main application will register an implementation for it.
export const FOO_PLUGIN_RPC_CONTEXT = {
    FOO_MAIN: createProxyIdentifier<FooMain>('FooMain')
};

// Main application will obtain a proxy using these IDs, plugin host will register an implementation for it.
export const FOO_MAIN_RPC_CONTEXT = {
    FOO_EXT: createProxyIdentifier<FooExt>('FooExt')
};
```

在插件宿主一侧，我们可以在 `createAPIFactory` 实现中注册我们的实现并获取代理：

`plugin/foo-ext.ts` 示例：

```typescript
import { inject, injectable } from '@theia/core/shared/inversify';
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';
import { FooExt, FooMain, FOO_PLUGIN_RPC_CONTEXT } from '../common/foo-api-rpc';

@injectable()
export class FooExtImpl implements FooExt {
    // Main application RCP counterpart
    private proxy: FooMain;

    constructor(@inject(RPCProtocol) rpc: RPCProtocol) {
        // Retrieve a proxy for the main side
        this.proxy = rpc.getProxy(FOO_PLUGIN_RPC_CONTEXT.FOO_MAIN);
    }

    getFooImpl(): Promise<Foo> {
        return this.proxy.$getFooImpl();
    }
}
```

在主应用一侧，我们需要实现 ExtPluginApiProvider 的对等物 `MainPluginApiProvider`，并在浏览器前端模块中暴露它。

> [!NOTE]
> 如果相同的 API 也发布给无头插件，那么 Main 一侧实际上位于 Node 后端而非浏览器前端，因此实现可能
> 位于 `common/` 目录树中，并同时在前端和后端容器模块中注册。
> 或者，如果 API _仅_发布给无头插件，则可以在 `node/` 目录树中实现，并利用仅 Node 后端可用的能力。

`main/browser/foo-main.ts` 示例：

```typescript
@injectable()
export class FooMainImpl implements FooMain {
    @inject(MessageService) protected messageService: MessageService;
    protected proxy: FooExt;

    constructor(@inject(RPCProtocol) rpc: RPCProtocol) {
        // We would use this if we had a need to call back into the plugin-host/plugin
        this.proxy = rpc.getProxy(FOO_MAIN_RPC_CONTEXT.FOO_EXT);
    }

    async $getFooImpl(): Promise<Foo> {
        this.messageService.info('We were called from the plugin-host at the behest of the plugin.');
        return new Foo();
    }
}

@injectable()
export class FooMainPluginApiProvider implements MainPluginApiProvider {
    @inject(MessageService) protected messageService: MessageService;
    @inject(FooMain) protected fooMain: FooMain;

    initialize(rpc: RPCProtocol): void {
        this.messageService.info('Initialize RPC communication for FooMain!');
        rpc.set(FOO_PLUGIN_RPC_CONTEXT.FOO_MAIN, this.fooMain);
    }
}

export default new ContainerModule(bind => {
    bind(MainPluginApiProvider).to(FooMainPluginApiProvider).inSingletonScope();
    bind(FooMain).to(FooMainImpl).inSingletonScope();
});
```

在这个示例中，我们已经可以看到进入主应用一侧的巨大优势：我们可以完全访问 Theia 的各项服务。

## 在插件中使用

在插件中使用该 API 时，用户只需如下使用：

```typescript
import * as foo from '@bar/foo';

foo.fooBar.getFoo();
```

## 添加自定义插件激活事件

创建自定义插件 API 时，可能还需要在特定时间点触发插件的激活。
触发插件激活的事件简称为 `activation events`（激活事件）。
默认情况下，Theia 支持一组内置的激活事件，其中包含 [VS Code 的激活事件](https://code.visualstudio.com/api/references/activation-events)以及一些额外的 Theia 专有事件。
从技术上讲，激活事件不过是在特定时间点触发的一个唯一字符串。
为了让激活事件更具灵活性，Theia 允许你在初始化插件宿主时提供额外的自定义激活事件。
这些额外的事件可由采用者通过 `ADDITIONAL_ACTIVATION_EVENTS` 环境变量指定。
要触发激活事件，你需要调用插件宿主的 `$activateByEvent(eventName)` 方法。

## 打包

在打包我们的应用程序时，我们的初始化函数需要是后端 bundle 的一个专用入口点，以便能够动态加载。
相应地调整 `esbuild.mjs`：

```javascript
import { nodeOptions } from './gen-esbuild.node.mjs';

/**
 * Add our initialization function. If unsure, look at the already generated entries of
 * the nodeOptions where an entry is added for the default 'backend-init-theia' initialization.
 */
nodeOptions.entryPoints['foo-init'] = '@namespace/package/lib/node/foo-init';
```

esbuild 为 `node` 平台输出 CommonJS，因此无需额外配置即可在运行时加载该入口点的导出。
