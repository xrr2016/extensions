> 完整文档索引见 [llms.txt](./llms.txt)。

# Prelook

悬停链接即预览，无需等待。鼠标停在链接上的瞬间，目标页已经开始加载——先预览，再决定要不要打开。

## 功能特性

沉浸式浏览，不必来回切换。

- **链接预览**（核心）：悬停链接即浮出内容预览，是否打开由你决定。
- **链接预热**：悬停瞬间即开始预取目标页，预览与打开更快（Speculation Rules、原生预取）。
- **阅读模式**：无法内嵌的网站自动切换为无干扰阅读视图（禁嵌兜底、正文提取）。
- **多窗口预览**：最多同时打开 6 个预览窗，左右对比阅读。
- **划词搜索**：选中文字，一键 Google / Bing / 百度 / DuckDuckGo。
- **AI 搜索**：DeepSeek / 豆包 / Kimi / Perplexity，选完即问。
- **四种触发方式**：悬停、Alt+悬停、长按、拖动，按习惯任选。
- **侧边栏模式**：预览窗通高贴边，侧栏堆叠不遮挡正文。
- **追踪参数清理**：自动剥掉 utm、fbclid 等追踪参数，还原中转壳里的真实地址。
- **链接风险提示**：仿冒域名、乱码域名、文字与目标不符时在标题栏给出提醒。
- **隐私本地化**：无账号、无服务器，数据不出本机。
- **主题与外观**：深浅色、主题色、窗口配色、位置尺寸与背景模糊随心调。

## 常见问题

**预览窗口是空白的怎么办？**
部分网站禁止被内嵌，Prelook 会自动切换为阅读模式；若两者都失败，窗口会提供「在新标签页打开」按钮。

**我的数据会被上传吗？**
不会。所有预览与设置都发生在本机浏览器内，Prelook 没有账号体系，也不设任何服务器。

**Prelook 收费吗？**
完全免费，没有 Pro 版本、没有内购，也没有需要解锁的功能——包括多窗口预览在内全部开放。项目靠赞助维持，赞助纯粹出于自愿。

**预览为什么这么快？**
Prelook 使用浏览器原生的 Speculation Rules API：你悬停链接的瞬间就开始预取（甚至预渲染）目标页，预览窗打开时加载的是已经到本地的内容。这一切由浏览器自己调度，扩展不搭建任何中转服务器。

**会不会拖慢浏览器？**
不会常驻开销。预热只在指针停留在链接上时触发，指针离开就取消；「性能」里还提供节电模式，可以在用电池时自动关掉预热与背景模糊。

## 安装

支持 Chrome / Edge / Firefox，以及离线包安装。

- [Chrome 安装](https://chromewebstore.google.com/detail/bakhoimjnmigalolahgmbeflgifobeho)
- [Edge 安装](https://microsoftedge.microsoft.com/addons/detail/cfaoggmjcpfmmklonlgjbjgihnenfmmk)
- [Firefox 安装](https://addons.mozilla.org/zh-CN/firefox/addon/prelook/)
- [离线包（Chrome / Edge）](https://prelook.s3.bitiful.net/prelook-1.4.0-chrome.zip)
- [离线包（Firefox）](https://prelook.s3.bitiful.net/prelook-1.4.0-firefox.zip)
- [GitHub 下载](https://github.com/xrr2016/extensions)

装完即用，不用注册，也不用登录。

## 赞助支持

项目靠赞助维持（微信、支付宝、Ko-fi），赞助纯粹出于自愿。

## 相关页面

- [Prelook 隐私政策](privacy.md)

## 联系

- [GitHub](https://github.com/coldstoneboy)
- [QQ 群](https://www.qq.com/)
- © 2026 冷石Boy · 保留所有权利 · [粤ICP备2026134562号](https://beian.miit.gov.cn/)

