<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia.svg?sanitize=true' alt='theia-ext-logo' width='100px' />

<h2>ECLIPSE THEIA - REMOTE 扩展</h2>

<hr />

</div>

## 描述

本包实现了使用 Theia 连接远程系统的功能。
它提供的特性类似于 Microsoft 为 VSCode 提供的热门扩展 `Remote-SSH`、`Dev Containers` 或 `WSL`。

## 包架构

下面解释任意远程连接的基本流程。以远程 SSH 功能为例进行说明：

1. 当用户运行 `SSH: Connect to Host...` 命令时，我们会将主机信息发送到本地后端。
对应的 `RemoteSSHConnectionProvider` 作用于当前连接，并可以向用户请求额外的信息，例如 SSH 密钥的口令（passphrase）。
2. 当 `RemoteSSHConnectionProvider` 获得所需的全部信息后，它会创建 SSH 连接，并将该连接注册到通用的 `RemoteConnectionService`。
每种 `RemoteConnection` 类型都实现了一个能够处理三种消息的接口，用于与远程系统交互：
    1. 在远程系统的 shell 中执行命令
    2. 将数据复制到远程
3. 连接建立后，会在远程系统上执行一个设置过程：
    1. 识别远程平台（即 Windows、macOS 或 Linux）。后续所有步骤都需要此信息。
    2. 建立多个用于存储应用程序及其依赖的目录。
    3. 为远程平台下载并安装正确的 Node.js 版本。
    4. 打包本地后端，复制到远程后端并解包。
        1. 每个 Theia 扩展都可以注册 `RemoteCopyContribution` 绑定，用于从当前系统复制某些文件。
        该贡献点用于在所有操作系统中都会用到的文件。
        2. 它们还可以注册 `RemoteNativeDependencyContribution` 绑定，用于为远程系统下载并复制原生依赖。
        下载的文件是按平台区分的。
    5. 使用步骤 3 中安装的 node 版本，我们现在启动后端应用程序的 `main.js`。
    我们以 `--port=0` 启动后端，让它搜索任意可用端口。它会将端口号打印到控制台。
    设置过程要么返回设置错误，要么返回远程系统上远程服务器的端口。
4. 远程服务器/端口就绪后，后端会在随机端口上建立一个本地代理服务器。
它指示 `RemoteConnection` 对象将发往该代理服务器的所有 HTTP 请求转发到远程服务器。
5. 后端将以一个新的本地代理端口响应 (1) 中的初始请求。前端将该端口设置到 URL 中并重新加载自身。
6. 前端现在通过连接本地代理端口连接到远程后端。
7. 前端随后执行其正常的消息生命周期，与后端服务建立连接。
尽管这些后端服务位于不同的远程系统上，前端会像对待本地后端一样处理它们。

## 更多信息

- [`@theia/remote` 的 API 文档](https://eclipse-theia.github.io/theia/docs/next/modules/_theia_remote.html)
- [Theia - GitHub](https://github.com/eclipse-theia/theia)
- [Theia - Website](https://theia-ide.org/)

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## 商标

"Theia" 是 Eclipse Foundation 的商标
<https://www.eclipse.org/theia>
