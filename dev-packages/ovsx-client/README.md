<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - OVSX CLIENT</h2>

<hr />

</div>

## 描述

`@theia/ovsx-client` 包用于通过 REST API 与 `open-vsx` 交互。
该包允许客户端获取扩展及其元数据、搜索注册表，并
包含根据所提供的受支持 API 版本确定兼容性的必要逻辑。

注意，该客户端仅支持整个 OpenVSX API 的一个子集，仅涵盖
与 Theia 应用程序等客户端相关的部分。

### `OVSXRouterClient`

该类是一个 `OVSXClient`，可以根据某些配置（`OVSXRouterConfig`）将请求委托给子客户端。

```jsonc
{
    "registries": {
        // `[Alias]: URL` pairs to avoid copy pasting URLs down the config
    },
    "use": [
        // List of aliases/URLs to use when no filtering was applied.
    ],
    "rules": [
        {
            "ifRequestContains": "regex matched against various fields in requests",
            "ifExtensionIdMatches": "regex matched against the extension id (without version)",
            "use": [/*
                List of registries to forward the request to when all the
                conditions are matched.

                `null` or `[]` means to not forward the request anywhere.
            */]
        }
    ]
}
```

## 更多信息

- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
