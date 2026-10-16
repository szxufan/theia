# 锁文件维护

用一次普通安装重新生成 `package-lock.json`：

```sh
npm install
```

然后检查结果：

```sh
git diff --stat package-lock.json
node scripts/verify-lockfile-platforms.js
```

该校验器同样在 CI 中运行，因此无法通过以下检查的锁文件无法合并。

## 保持 `allowScripts` 同步

npm 在运行依赖的安装脚本之前，会先查阅根 `package.json` 中的 `allowScripts` 允许列表。因此添加、移除或更新依赖可能需要修改 `allowScripts`：

- 带有安装脚本的新依赖：脚本必需（本地绑定、下载的二进制）则添加为 `true`；脚本只是装饰性或未使用则添加为 `false`。记录为 `false` 还能让 `npm install` 不再出现提示。
- 不再有安装脚本的依赖必须从列表中移除。

npm 11 对未列出的依赖只打印一条提示并仍然运行其脚本，因此遗漏很容易被忽略。`--strict-allow-scripts` 会把该提示变为硬错误，npm 12 预期将把它作为默认行为——届时缺失 `true` 条目会阻止本地模块构建。校验器会用 `hasInstallScript` 把允许列表与锁文件中的每个条目交叉核对，未列出或过期的条目会导致失败，因此在改动依赖后请运行它。

## 平台相关条目

锁文件必须描述 CI 构建所用的每个平台，而不只是重新生成它的那台主机：

1. **平台相关的可选依赖**，如 `@esbuild/darwin-arm64`、`@parcel/watcher-linux-x64-musl` 或 `@nx/nx-win32-x64-msvc`。如果缺失，受影响平台上的 `npm ci` 无法解析该包。
2. Linux 条目上的 **`libc` 字段**（`"libc": ["glibc"]` 或 `"libc": ["musl"]`）。没有它们，Alpine 或其他基于 musl 的镜像上的 `npm ci` 无法选择正确的二进制。

与 Node 24 和 Node 26 捆绑的 npm 11.19 无论如何都会写入这些条目。随不再受支持的 Node 22 发布的 npm 10 则会裁剪它们，即使此前 CI 是绿的，也会在受影响平台上弄坏 CI。当前没有受支持的 Node 版本会再裁剪，但全局安装的较旧 npm 仍可能与受支持的 Node 搭配使用，因此校验器持续断言提交的锁文件携带 `libc` 字段。如果该检查失败，请用受支持的 Node 版本捆绑的 npm 重新生成锁文件。
