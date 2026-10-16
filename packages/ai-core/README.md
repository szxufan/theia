<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - AI CORE 扩展</h2>

<hr />

</div>

## 描述

`@theia/ai-core` 扩展是 Theia 中所有 AI 集成的基础。
它管理语言模型的集成，并提供智能体（agent）、提示词（prompt）、AI 变量和技能（skill）等核心概念。

### 技能（Skills）

技能为 AI 智能体提供可复用的指令和领域知识。技能是一个包含 `SKILL.md` 文件的目录，该文件带有 YAML frontmatter（名称、描述）和 markdown 内容。

#### 技能目录

技能从多个位置发现，按优先级顺序处理（重复时以先出现者为准）：

1. **工作区：** 工作区根目录下的 `.prompts/skills/` 和 `.agents/skills/`（项目专属技能）
2. **用户配置：** `ai-features.skills.skillDirectories` 首选项中列出的目录
3. **全局：** `~/.theia/skills/`（产品配置文件夹）和 `~/.agents/skills/`（用户主目录）

#### 技能结构

每个技能必须位于自己的目录中，且目录名与技能名称一致：

```text
skills/
├── my-skill/
│   └── SKILL.md
└── another-skill/
    └── SKILL.md
```

#### 用法

- 在智能体的提示词中加入 `{{skills}}`，以 XML 形式（名称和描述）注入可用技能
- 智能体可以使用 `getSkillFileContent` 工具并通过技能名称读取完整的技能内容

Theia AI 功能的启用由 AI 首选项管理，这些首选项由 `@theia/ai-core-ui` 贡献。
基于 Theia 的应用程序要么包含 `@theia/ai-core-ui`，要么自行绑定其中包含的首选项 schema。

## 更多信息

- [`@theia/ai-core` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_ai-core.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
