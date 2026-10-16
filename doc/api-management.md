# API 管理

> 以下指导仅适用于 Theia 框架自身的代码。最终产品通过使用私有可见性可以获得更好的开发体验。

- [**稳定性**](#stability)
  - [**实验性**](#experimental)
  - [**稳定**](#stable)
- [**定稿**](#finalization)
- [**弃用**](#deprecation)

Theia 是一个尽可能拥抱开放、可扩展与可定制性的框架：

- API 对客户端默认公共可见。
- API 对扩展者默认受保护（protected）。
- 从不使用禁止运行时访问内部结构的语言构造。

通常，版本管理围绕 API 可见性构建。
特别是，当公共 API 被破坏时就需要新的大版本发布。

由于所有 API 或多或少都是公共的，遵循常规方法对 Theia 并不可行。
那会拖慢 API 创新、积累技术债，或要求大量大版本发布。

因此，我们只要求在 _稳定_ API 被破坏时才发布大版本。
破坏 _实验性_ API 允许发生在次版本发布中。

## 稳定性

从概念上讲，一个 API 由采用者使用或扩展 Theia 时所依赖的全部假设构成。
稳定 API 基于不会改变的假设。
API 是公共的还是内部的、被大量使用还是从未使用，都无关紧要。

> 例如，语言服务器协议（LSP）依赖 URI 和位置等数据类型，
因为它们不随语言而变化。这保证了它的稳定性。

API 稳定性通过添加 `@experimental` 或 `@stable` js-doc 标签显式标示。

显式稳定性标签应附带 `@since` 标签，标明 API 何时添加。
`@stable` 标签应注明 API 自哪个版本起定稿。

没有稳定性标签的 API 视为实验性，无需 `@since` 标签。

```ts
/**
 * 开发实验性 API 时不需要任何注解。
 */
export interface ExperimentalInterface {
}

/**
 * @since 0.1.0
 * @stable since 1.0.0
 */
export interface StableInterface {

    /**
     * 与 `StableInterface` 相同。
     */
    stableMethod(): void;

    /**
     * 向稳定 API 添加新 API 必须显式声明。
     *
     * @since 1.1.0
     * @experimental
     */
    experimentalMethod(): void;

}

```

### 实验性

- 所有新 API 都应始终以**实验性**方式添加，因为很难一次性把[稳定 API](#stable) 设计正确。
- 实验性 API 不需要稳定性标签，但向[稳定 API](#stable) 添加新成员时应显式注解。
- 实验性 API 不需要详尽的文档。但这并不意味着明显之处不应记录。
- 实验性 API 不遵循 [semver](https://semver.org/#spec-item-8) 语义。
- 如果实验性 API 未被广泛采用，可以在不经过[弃用周期](#deprecation)的情况下更改或移除。
- 采用程度应通过内部客户端的数量或基于 Theia 贡献者与 committer 的反馈来衡量。

### 稳定

- [实验性 API](#experimental) 可以通过[定稿周期](#finalization)晋级为 `stable`。
- 稳定 API 应基于不太可能改变的设计决策。
- 稳定 API 应有足够的采用程度。
- 稳定 API 应有恰当的文档。
- 稳定 API 必须遵循 [semver](https://semver.org/#spec-item-8) 语义。
- 只能以向后兼容的方式更改。
- 只能通过[弃用周期](#deprecation)移除。

## 定稿

API 定稿应通过带 `api-finalization` 标签的 GitHub issue 请求。
此类请求应通过遵循 [PR 指南](https://github.com/eclipse-theia/theia/blob/master/doc/pull-requests.md#pull-requests)的 pull request 解决。

定稿意味着对 API 的采用程度、稳定性和文档进行审查。
没有获得足够的经验就无法判断稳定性，
而没有 API 的稳定性也无法先给出稳定的文档。

如果采用程度不足，则应推迟定稿。
如果它此后仍未被采用，应考虑将 API 从框架移到由请求采用的采用者管理的另一个仓库。

> 为什么？设想 LSP 有一个只能被一个工具支持的特性。
把这样的特性移到工具专属的 LSP 扩展
而非让协议臃肿是合理的。框架同理：
如果 API 只被一个采用者添加并使用，那么这样的 API 必须移交给该采用者。
这保证了该采用者对此类 API 的控制权，并缩减框架的 API 面。

如果 API 基于可能改变的设计决策，
那么可以推迟定稿，直到此类决策被解决。

> 为什么？有些设计决策只是暂时可能改变，例如
应使用哪种布局框架。一旦被解决，
这样的设计决策就变得基础、不可更改，并可以被采用。

如果无法如此，则应重构 API 以隐藏这些假设。

> 为什么？有些设计决策本质上就是可变的，例如对 LSP 而言，
某个具体语言的符号种类。这种情况下，
应把 API 改为操作抽象的符号数据类型，以隐藏具体符号。

如果采用程度与 API 稳定性均已确立，
则应审查并补全文档。

## 弃用

API 弃用通过添加 `@deprecated` js-doc 标签标示。
弃用标签应注明自哪个版本起弃用，解释原因以及应改用什么。

```ts
/**
 * @since 0.1.0
 * @stable since 1.0.0
 * @deprecated since 1.1.0 - because that and that, use that instead
 */
export interface DeprecatedStableInterface {

}
```

已弃用的[稳定 API](#stable) 可在下一个 _大_ 版本中移除

已弃用的[实验性 API](#experimental) 可在下一个 _次_ 版本中移除

破坏性变更应记录在 [CHANGELOG](../CHANGELOG.md) 中。每项破坏性变更都应向采用者说明理由，
并指导应改用什么。
