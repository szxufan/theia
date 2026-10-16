# Theia - 文件下载

为 `Files`（文件）导航器提供文件下载贡献点。

支持单个和多个文件下载。

 1. 单个文件将按原样下载。
 2. 文件夹将打包为 tar 归档下载。
 3. 下载多个文件时，将使用最近的公共父目录名称作为归档名称。
 4. 从多个磁盘下载多个文件时（例如 Windows 上的 `C:\` 和 `D:\`），将按磁盘分别应用规则 `3.`，然后再将各个 tar 打包为一个 tar。

### REST API

- 要下载单个文件或文件夹，请使用以下端点：`GET /files/?uri=/encoded/file/uri/to/the/resource`。
  - 示例：`curl -X GET http://localhost:3000/files/?uri=file:///Users/akos.kitta/git/theia/package.json`。

- 要下载多个文件（来自同一文件夹），请使用 `PUT /files/` 端点，并携带 `application/json` 内容类型请求头及以下请求体格式：

    ```json
    {
        "uri": [
            "/encoded/file/uri/to/the/resource",
            "/another/encoded/file/uri/to/the/resource"
        ]
    }
    ```

   ```
   curl -X PUT -H "Content-Type: application/json" -d '{ "uris": ["file:///Users/akos.kitta/git/theia/package.json", "file:///Users/akos.kitta/git/theia/README.md"] }' http://localhost:3000/files/
   ```

## 许可证

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)
