# Chrome Web Store — 主机权限理由（每次上架提交复用）

## 背景：为什么零 API 权限仍被要求填这一栏

RepoWays 的 manifest 没有任何 `permissions` / `host_permissions`（见 `apps/repoways/wxt.config.ts`），
但 content script 的 `content_scripts[].matches` 是 `["https://github.com/*"]`。

Chrome 把「主机权限」的定义管得比 `permissions` 数组更宽：**content_scripts 的 `matches` 本身就是一条主机权限**
（它授权扩展在 github.com 注入代码、读写页面 DOM）。只要 manifest 从任意来源声明了主机授权，
CWS 开发者后台就会弹出「需请求主机权限的理由」这一栏，并挂上「涉及主机权限，可能需深入审核」的黄色警告。
这不是误报，是必填项；理由写得清楚通常几天内过审。

## 远程代码声明

「您正在使用远程代码吗？」选 **否**。12 枚品牌图标全部内联（`data:` 位图或 SVG 路径，见 `utils/icons.ts`），
不加载任何远程代码。

## 需请求主机权限的理由（优先用英文版）

### English

RepoWays has a single purpose: it injects a "Ways" button next to the Code button on GitHub
repository pages, which opens a menu of 12 links to third-party tools (diagrams, AI readers,
online editors, analytics). That button must be inserted into the DOM of a GitHub repository page,
so the extension requires exactly one host permission, `https://github.com/*`. It requests no API
permissions, reads no repository content or user data, and performs no network fetching — all 12
entries are plain `<a target="_blank">` links opened in a new browser tab on user click. Without
this host permission the extension cannot function at all.

### 中文

本扩展的唯一功能是在 GitHub 仓库页的 Code 按钮旁注入一枚「Ways」按钮，点击后展开 12 个第三方工具
（图解 / AI 阅读 / 在线运行 / 数据分析）的入口链接。该按钮必须插入 GitHub 仓库页的 DOM，因此只需要
`https://github.com/*` 这一条主机权限。扩展不申请任何 API 权限，不读取仓库内容或用户数据，不发起任何
网络抓取——12 个入口都是普通的 `<a target="_blank">` 链接，由用户点击后在浏览器新标签页打开。
移除该主机权限会使扩展完全无法工作。

## 复用提醒

若入口数量、`matches` 范围或功能定位发生变化，本文件里的数字与措辞要同步更新，否则理由与实际 manifest
不符会被审核打回。核对来源：`apps/repoways/wxt.config.ts` 的 `content_scripts`、`utils/ways.ts` 的入口清单。
