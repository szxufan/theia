# AI Llamafile 集成

AI Llamafile 包提供一个集成，允许用户在 Theia IDE 中管理和交互 Llamafile 语言模型。

## 功能特性

- 启动和停止 Llamafile 语言服务器。

## 命令

### 启动 Llamafile

- **命令 ID：** `llamafile.start`
- **标签：** `Start Llamafile`
- **功能：** 允许你从已配置 Llamafile 的列表中选择并启动一个 Llamafile 语言服务器。

### 停止 Llamafile

- **命令 ID：** `llamafile.stop`
- **标签：** `Stop Llamafile`
- **功能：** 允许你从当前正在运行的 Llamafile 列表中选择并停止一个 Llamafile 语言服务器。

## 用法

1. **启动 Llamafile 语言服务器：**

    - 使用命令面板调用 `Start Llamafile`。
    - 会出现一个快速选择菜单，列出已配置的 Llamafile。
    - 选择一个 Llamafile 以启动其语言服务器。

2. **停止 Llamafile 语言服务器：**

    - 使用命令面板调用 `Stop Llamafile`。
    - 快速选择菜单会显示当前正在运行的 Llamafile 列表。
    - 选择一个 Llamafile 以停止其语言服务器。

## 依赖

本扩展依赖 `@theia/ai-core` 包以获得 AI 相关的服务和功能。

## 配置

请确保在首选项设置中正确配置你的 Llamafile。
该设置是一个对象数组，其中每个对象使用一个便于阅读的名称、文件 URI 以及启动服务器的端口来定义一个 llamafile。

配置示例：

```json
{
    "ai-features.llamafile.llamafiles": [
        {
            "name": "MyLlamaFile",
            "uri": "file:///path/to/my.llamafile",
            "port": 30000
        }
    ]
}
```
