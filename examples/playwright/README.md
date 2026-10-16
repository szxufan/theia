<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - PLAYWRIGHT</h2>

<hr />

</div>

## 描述

Theia 🎭 Playwright 是一个基于 [Playwright](https://github.com/microsoft/playwright) 的[页面对象（page object）](https://martinfowler.com/bliki/PageObject.html)框架，用于为基于 [Theia](https://github.com/eclipse-theia/theia) 的应用程序开发系统测试。下面可以看到它的实际效果。

<div style='margin:0 auto;width:70%;'>

![Theia System Testing in Action](./docs/images/teaser.gif)

</div>

Theia 🎭 Playwright 的页面对象对 Theia 的用户界面做了抽象，封装了用户界面交互、等待条件等的细节，帮助你的测试更加简洁、可维护和稳定。
准备好看一个[示例](./docs/GETTING_STARTED.md)了吗？

与 Theia 应用程序的实际交互使用 TypeScript 编写的 🎭 Playwright 实现。因此，我们可以利用 [Playwright 的优势](https://playwright.dev/)，在所有现代浏览器上以无头（headless）或有头（headful）模式运行或调试测试。
更多信息请查看 [Playwright 的文档](https://playwright.dev/docs/intro)。

这个页面对象框架不仅覆盖 Theia 的通用能力，例如处理视图、快速命令面板、文件资源管理器等。
它还是[可扩展的](./docs/EXTENSIBILITY.md)，你可以为自定义的 Theia 组件（例如自定义视图、编辑器、菜单等）添加专用的页面对象。

## 文档

- [入门](./docs/GETTING_STARTED.md)
- [可扩展性](./docs/EXTENSIBILITY.md)
- [Theia 🎭 Playwright 模板](https://github.com/eclipse-theia/theia-playwright-template)
- [构建和开发 Theia 🎭 Playwright](./docs/DEVELOPING.md)

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)
- [Playwright - GitHub](https://github.com/microsoft/playwright)
- [Playwright - Website](https://playwright.dev)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
