# 插件工作区

多浏览器插件 monorepo（pnpm workspace）。当前包含：

- **[TabPeek](apps/tabpeek/)** — 悬停即预览，告别标签海（WXT + Vue 3，MV3，Chrome/Edge/Firefox）
- **[TabPeek 官网](apps/tabpeek-landing/)** — 纯静态落地页（零构建，可直接部署）

## TabPeek 功能

- **链接预览**：悬停链接浮出预览窗（iframe 优先，被禁嵌站点自动切阅读模式）
- **划词搜索**：选中文字弹出工具条，普通搜索（Google/Bing/百度/DuckDuckGo）与 AI 搜索（DeepSeek/豆包/Kimi）
- **链接预热**：基于 Speculation Rules API，悬停瞬间预取/预渲染目标页（Firefox 自动降级）
- **可定制**：触发方式（悬停 / Alt+悬停 / 点击 / Alt+单击 / 长按 / 拖动链接，有延迟的模式带倒计时进度条）、悬停高亮链接、关闭触发器（点外部 / 移开指针 / 滚动）、窗口尺寸（视口百分比，可拖角调整）/位置（含侧边栏）、主题色、背景模糊（百分比，指针在预览窗上时生效）、中/英界面
- **URL 跟踪保护**：打开链接时剥离 utm_* / gclid 等追踪参数，并还原已知的中转跳转壳
- **链接风险提示**：本地启发式识别域名伪装、文字与目标不符等可疑特征，只在预览窗标题栏提示、不拦截
- **隐私本地化**
- **多窗口预览**：最多同时打开 6 个预览窗（侧边栏模式下并排堆叠）
- **深浅主题**：设置页与预览窗、划词条等页面内 UI 支持深色 / 浅色 / 跟随系统
- **弹窗主题**：预览窗配色预设（灰白 / 深色 / 浅灰 / 蓝 / 绿 / 紫 / 粉 + 自定义颜色），卡片即窗口缩略图
- **固定窗口**：预览窗头部图钉一键固定，鼠标移开也不关闭，多个窗口可以并排比对（可开启「自动固定」让新窗口默认带上）
- **完全免费**：无账号、无服务器、无付费版本，全部功能开放；欢迎通过[爱发电](https://ifdian.net/a/coldstoneboy)或 [Patreon](https://patreon.com/coldstoneboy)赞助

## 开发（仓库根目录执行）

```bash
pnpm install
pnpm dev:tabpeek          # Chrome 开发模式，加载 apps/tabpeek/.output/chrome-mv3-dev/
pnpm dev:tabpeek:firefox  # Firefox 开发模式
pnpm dev:tabpeek:doubao   # 豆包浏览器开发模式（路径见 wxt.config.ts 的 webExt.binaries）
pnpm build:tabpeek        # 生产构建（pnpm build 聚合全部子包）
pnpm compile:tabpeek      # 类型检查（pnpm compile 聚合）
pnpm zip:tabpeek          # 打包上架 zip
pnpm landing:tabpeek      # 官网本地预览 http://127.0.0.1:4173
```

## 赞助

TabPeek 没有任何付费版本，也没有服务器成本之外的开销。如果想支持开发：

- 爱发电 — https://ifdian.net/a/coldstoneboy
- Patreon — https://patreon.com/coldstoneboy

## 目录

- `apps/tabpeek/entrypoints/` — 扩展入口（background / content / popup 设置页）
- `apps/tabpeek/utils/` — 预览窗、划词、阅读模式提取、i18n、存储
- `apps/tabpeek/assets/locales/` — 界面词条（zh-CN / en）
- `apps/tabpeek-landing/` — 产品官网（纯静态 HTML/CSS/JS，可直接部署 GitHub Pages）

新增插件请参考 [AGENTS.md](AGENTS.md) 的接入清单。

