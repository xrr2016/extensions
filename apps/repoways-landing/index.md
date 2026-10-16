# RepoWays

RepoWays 是一款免费、开源的浏览器扩展（Chrome / Edge，MV3）。它在任意 GitHub 仓库页的
`Code` 按钮左边注入一枚 `Ways` 按钮，点击展开十二条入口，全部是由 `owner/repo`
现拼出来的普通链接——不抓取、不申请任何浏览器权限、不收集任何数据。

> One click on any GitHub repository to open it with the tools that read, diagram and run it.

## 十二条入口

| 分组 | 服务 | 用途 | 链接形状 |
| --- | --- | --- | --- |
| 看懂结构 | GitDiagram | 生成架构图 | `https://gitdiagram.com/{owner}/{repo}` |
| 看懂结构 | Dependency Graph | 看依赖图 | `https://github.com/{owner}/{repo}/network/dependencies` |
| 交给 AI | DeepWiki | 看 AI 讲解 | `https://deepwiki.com/{owner}/{repo}` |
| 交给 AI | Zread | 看 Zread 导读 | `https://zread.ai/{owner}/{repo}` |
| 交给 AI | GitReverse | 导出 AI 提示词 | `https://gitreverse.com/{owner}/{repo}` |
| 交给 AI | GitMCP | 文档转 MCP | `https://gitmcp.io/{owner}/{repo}` |
| 交给 AI | Gitingest | 打包给 AI | `https://gitingest.com/{owner}/{repo}` |
| 读、改、跑 | GitHub1s | 读代码 | `https://github1s.com/{owner}/{repo}` |
| 读、改、跑 | GitHub.dev | 改代码 | `https://github.dev/{owner}/{repo}` |
| 读、改、跑 | Codespaces | 云端开发 | `https://codespaces.new/{owner}/{repo}` |
| 读、改、跑 | StackBlitz | 跑项目 | `https://stackblitz.com/github/{owner}/{repo}` |
| 看活跃度 | OSSInsight | 看活跃度 | `https://ossinsight.io/analyze/{owner}/{repo}` |

## 安装（离线包）

1. 下载 `./assets/repoways-1.0.3-chrome.zip` 并解压到一个文件夹；
2. 打开 `chrome://extensions`，在右上角开启「开发者模式」；
3. 点「加载已解压的扩展程序」，选中该文件夹；
4. 打开任意 `github.com` 仓库页，`Code` 按钮左边的 `Ways` 即生效（Edge 同样适用）。

## 隐私与源码

- 零权限：manifest 不声明任何权限，无后台页；菜单每行都是 `<a target="_blank">`。
- 源码：https://github.com/xrr2016/extensions （`apps/repoways/`）

© 2026 冷石Boy · 粤ICP备2026134562号
