# plugin-lm-tools

一个示例 Theia/VS Code 插件，通过注册三个语言模型工具来演示 `lm.registerTool` API。

## 工具

### sample-getCurrentTime

- **描述：** 以 ISO 格式返回当前日期和时间。
- **输入：** 无（空对象）。
- **输出：** ISO 8601 时间戳字符串。

### sample-calculateSum

- **描述：** 计算数字数组的和。
- **输入：** `{ "numbers": [1, 2, 3] }`
- **输出：** 形如 `"The sum of [1, 2, 3] is 6."` 的字符串。

### sample-getSystemInfo

- **描述：** 返回系统信息，包括平台、Node.js 版本和运行时长。
- **输入：** 无（空对象）。
- **输出：** 混合内容：一个文本部分和一个包含系统详情的 JSON 数据部分。

## 测试

1. 构建并启动 Theia browser 应用程序。
2. 打开 **AI Configuration** 视图，验证三个工具都出现在 Tools 部分
3. 使用启用了这些工具的智能体，让它报出当前时间或对数字求和。
4. 检查渲染出的工具调用以验证结果

## 许可证

EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
