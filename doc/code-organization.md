# 代码组织

代码全部以 [TypeScript](https://github.com/microsoft/typescript) 实现。在按功能包组织代码的顶层文件夹内，我们区分以下平台：

- `common/*`：只依赖基础 JavaScript API、可在所有目标环境中运行的源代码。
- `browser/*`：依赖 `browser` API（如访问 DOM）的源代码。
  - 可使用来自：`common` 的代码。
- `browser-only/*`：依赖 `browser` API（如访问 DOM）且不依赖 Node 后端的源代码。
  - 可使用来自：`common` 的代码。
- `node/*`：依赖 [`nodejs`](https://nodejs.org) API 的源代码。
  - 可使用来自：`common` 的代码。
- `electron-node/*`：依赖 [`nodejs`](https://nodejs.org) API 的 Electron 专属源代码。
  - 可使用来自：`common`、`node` 的代码。
- `electron-browser/*`：依赖 [Electron 渲染进程](https://github.com/atom/electron/tree/master/docs#modules-for-the-renderer-process-web-page) API 的源代码。
  - 可使用来自：`common`、`browser` 的代码。
- `electron-main/*`：依赖 [Electron 主进程](https://github.com/atom/electron/tree/master/docs#modules-for-the-main-process) API 的源代码。
  - 可使用来自：`electron-node`、`common`、`node` 的代码。
