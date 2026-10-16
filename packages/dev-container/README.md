<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - DEV-CONTAINER 扩展</h2>

<hr />

</div>

## 描述

`@theia/dev-container` 扩展提供创建、启动和连接开发容器的功能，类似于
[vscode Dev Containers 扩展](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)。

完整的 devcontainer.json Schema 可在[这里](https://containers.dev/implementors/json_reference/)找到。
目前尚未实现配置文件的全部属性。以下是已实现的属性：

- name
- Image
- dockerfile/build.dockerfile
- build.context
- location
- forwardPorts
- mounts
- containerEnv
- remoteEnv
- remoteUser
- shutdownAction
- postCreateCommand
- postStartCommand

实现方式或如何实现更多属性请参见 `main-container-creation-contributions.ts`。

此外，还增加了对 `composeUpArgs` devcontainer.json 属性的支持，用于为 `docker compose up` 调用附加额外参数。
用法：`"composeUpArgs": ["--force-recreate"]`

## 更多信息

- [`@theia/dev-container` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_dev-container.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
