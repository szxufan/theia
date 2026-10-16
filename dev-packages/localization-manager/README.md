<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - LOCALIZATION-MANAGER</h2>

<hr />

</div>

## 描述

`@theia/localization-manager` 包用于轻松为不同语言创建 Theia 及 Theia 扩展的本地化。它有两个主要用例。

首先，它允许使用 `nls-extract` Theia-CLI 命令从代码库中的 `nls.localize` 调用提取本地化键和默认值。以这段代码为例：

```ts
const hi = nls.localize('greetings/hi', 'Hello');
const bye = nls.localize('greetings/bye', 'Bye');
```

它会被转换为这个 JSON 文件（`nls.json`）：

```json
{
  "greetings": {
    "hi": "Hello",
    "bye": "Bye"
  }
}
```

之后，可以使用任何手动或自动的翻译方式将该文件翻译成其他语言。这些 JSON 文件应由 `LocalizationContribution` 读取。

此外，Theia 还提供了一种开箱即用的简单方式，使用 [DeepL API](https://www.deepl.com/docs-api) 翻译生成的 JSON 文件。为此，需要一个 [DeepL 免费或专业帐户](https://www.deepl.com/pro)。使用 Theia-CLI 的 `nls-localize` 命令，可以将目标文件翻译成不同的语言。例如，使用之前的 JSON 文件并以 `fr`（法语）语言调用该命令时，将在翻译源文件所在目录创建如下 `nls.fr.json` 文件：

```json
{
  "greetings": {
    "hi": "Bonjour",
    "bye": "Au revoir"
  }
}
```

只有没有对应翻译的 JSON 条目才会通过 DeepL 翻译。这确保了对已翻译文件的手动修改不会被覆盖，并且只有新的翻译条目才会真正发送到 DeepL。

使用 `theia nls-localize --help` 了解如何使用该命令以及提供 DeepL API 密钥的更多信息。

更多信息请参见[国际化文档](https://theia-ide.org/docs/i18n/)。

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
