<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - GETTING-STARTED 扩展</h2>

<hr />

</div>

## 描述

`@theia/getting-started` 扩展贡献了一个默认的 `getting-started`（入门）组件，每当在没有工作区的情况下打开应用程序、或者显式打开该组件（通过菜单或命令）时，都会显示它。

`getting-started` 组件提供了实用的命令和功能，帮助用户快速上手应用程序。例如：

- `open commands`（打开命令）：用于快速打开文件、文件夹和工作区的命令。
- `recent workspaces`（最近的工作区）：列出最近使用的工作区，便于快速访问。
- `settings commands`（设置命令）：用于打开首选项和键盘快捷键组件的命令。
- `help`（帮助）：指向文档和/或指南的有用链接。

## 演练（Walkthroughs）

该组件还列出了可用的演练：引导式、多步骤的入门介绍，其进度会在会话之间被记住。它们来自两个来源，处理方式相同：

- VS Code 扩展，通过其清单中的 `contributes.walkthroughs` 部分。
- Theia 扩展，通过 `WalkthroughProvider` 贡献点。

Theia 扩展通过绑定一个提供方来贡献演练：

```ts
@injectable()
export class MyWalkthroughProvider implements WalkthroughProvider {
    getWalkthroughs(): WalkthroughDefinition[] {
        return [{
            id: 'my-extension.getting-started',
            title: 'Get started with my feature',
            description: 'Set it up and learn how to work with it.',
            icon: 'sparkle',
            steps: [{
                id: 'configure',
                title: 'Configure the feature',
                // Trusted markdown, so `command:` links work.
                description: 'Open the [settings](command:my-extension.openSettings) and pick a mode.',
                completionEvents: ['onContext:myExtension.isConfigured']
            }]
        }];
    }
}

bind(WalkthroughProvider).to(MyWalkthroughProvider).inSingletonScope();
```

这些 ID 会被原样使用，因此它们在整个应用程序中必须唯一；插件贡献的演练由 `<pluginId>.<walkthroughId>` 标识，提供方不得模仿这种形式。演练内容会随时间变化的提供方可以暴露一个可选的 `onDidChange` 事件，以便重新收集演练。

当某个步骤的 `completionEvents` 之一被触发时，该步骤即告完成。除 `onContext:` 之外，还有 `onCommand:`、
`onSettingChanged:`、`onView:`、`onLink:` 和 `extensionInstalled:`，与 VS Code 演练
贡献保持一致。优先选择能描述用户已达成之事的事件，这样即使某个用户在打开演练之前就完成了相应工作，该步骤也会被勾选。没有任何完成事件的步骤需要手动标记为完成。

演练可以从该组件打开，也可以通过接受演练 ID 的 `walkthrough.open` 命令打开。

## 更多信息

- [`@theia/getting-started` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_getting-started.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
