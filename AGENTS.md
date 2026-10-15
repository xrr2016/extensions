# AGENTS.md

## 项目概述

**多浏览器插件 monorepo**（pnpm workspace，根包名 `extensions`）。`apps/` 下按"每个产品两个目录"扁平排列：插件本体 + 落地页。当前产品：

- **Prelook** — 悬停链接预览扩展（MV3，Chrome/Edge/Firefox），WXT 0.21 + Vue 3。**产品曾用名 TabPeek，2026-09-16 整体改名**——改名撞车是因为 Chrome Web Store 上已有一款同名扩展（`hcheung-code`，做的是悬停预览标签组，站 site tabpeek.com），所以任何带 `Tab` 前缀的名字都会被当成那款产品。核心能力：悬停/Alt+悬停/单击/Alt+单击/悬停+空格/长按/拖动触发页面内悬浮预览窗（iframe 优先、禁嵌站点自动切阅读模式）、链接预热、划词搜索（普通 + AI + 翻译）、全量设置面板（侧边栏）、多窗口预览（最多 6 窗）。**全部功能免费**，没有 Pro/授权码/付费体系，只在侧边栏设置面板与 landing 放了爱发电 + Ko-fi 赞助入口（Patreon 那一条已下线，代码里已无引用）。
- **prelook-landing** — 纯静态产品官网（零构建、整目录直接部署；本地预览用 Vite 起开发服务器，只服务不打包，见「常用命令」里的 `pnpm landing:prelook`），线上域名 `prelook.coldstoneboy.cn`。版式参考 `yuumi.coldstoneboy.cn`：**令牌驱动的设计系统**（`css/style.css` 顶部的 `--primary/--bg-*/--text-*/--shadow-*/--spacing-*/--radius-*`，与参考站同一套命名）、固定模糊导航栏 + 下划线 scroll-spy、不引外部字体（Google Fonts 在国内不可达），用系统字体栈。

  - **区块顺序**（`index.html`）：`hero(#main) → features → faq → sponsor → cta-band(#get) → footer`。**导航与页脚「快速链接」那一栏是同一份清单、同一个顺序**（功能 / FAQ / 赞助 / 安装 = `#features`/`#faq`/`#sponsor`/`#get`），两处一起改、别只动一边；导航右侧另有一条 privacy 外链。**`#speed`（速度对比）与 `#reviews`（三栏评价墙）已整体下线**，连同 `.reviews-grid` 与 `reviews.rN.*` 词条——扩展没有可核实的真实评价，**不要为了版式把评价墙加回来，更不要杜撰昵称与五星好评**。
  - **区块底色严格深浅交替**（`--bg-secondary` 与 `--bg-primary` 逐段切换，卡片永远取与所在区块相反的那一档），所以**插入新段落要把后面几段的底色整体翻一遍**，否则会出现两段同色连成一片、看不出分段。`.cta-band` 是整段饱和色块，**不在深浅交替的序列里**，所以它前后的 faq / footer 仍按原样式交替。
  - **安装入口有两份**：hero 的 `.install-grid`（`.install-card` 卡片——Chrome / Edge / Firefox 三张商店卡 + 一张「手动下载」离线包）与页尾色带的 `.cta-actions`（`.install-btn` 按钮）。**商店链接已经是真实地址**（Chrome Web Store `bakhoimjnmigalolahgmbeflgifobeho`、Edge `cfaoggmjcpfmmklonlgjbjgihnenfmmk`、AMO `/firefox/addon/prelook/`），不再是 `href="#"` 占位。**刻意不给 Chrome 任何强调样式**——那会暗示"只该装 Chrome"。前三张卡挂 `assets/browser-chrome.svg` / `browser-edge.svg` / `browser-firefox.svg`（Wikimedia Commons 的官方多色 logo，**必须用 `<img>` 引文件而不是内联**：Chrome 与 Edge 的 SVG 都定义了 `id="a"/"b"/"c"` 的渐变，内联进同一个文档会互相覆盖），「手动下载」那颗是内联的下载线性图标。**Chrome 离线包随站点自己走**（`./assets/prelook-<版本>-chrome.zip`，文件就在 landing 的 `assets/` 里、和站点一起直传），Firefox 那条仍指 bucket（`https://prelook.s3.bitiful.net/prelook-<版本>-firefox.zip`，因为 landing 上没有 Firefox 的 zip）。**版本号不要手改**：`pnpm sync:landing` 会按 `apps/prelook/package.json` 的 version 同时重写这两种形式的链接，并且**断言本地那个 zip 真的在 `assets/` 里**（改完链接没放文件 = 绿着 404，正是这条门禁要挡的）。发版顺序见「回归自检」：先把 zip 就位/上传、再 sync。
  - **页尾色带**（`.cta-band`）构图参照 maxfoc.us：左边是胶囊徽章 + 大标题 + 一行副文案 + 那几颗按钮，右边是一段**纯 CSS 插画**（`.cta-art`：两个歪着的窗口，后面那个是深色浏览器框、前面那个是浅色预览窗，正好是产品自己的剪影）。插画用「前一层负 margin 压住后一层」而不是绝对定位——窗口高度由骨架线内容决定，绝对定位要按内容高度算偏移，加一行线就得重算。色带在浅色/深色各有一版渐变（`.cta-band` + `[data-theme="dark"] .cta-band`），带上的按钮固定白底深字（取 `--bg-primary` 会在深色主题里变成几块近黑色补丁）；`≤820px` 色带才立成一列、文案居中（断点压这么低是因为 768–960 还放得下左右两栏，提前立起来只会让色带上下空出一大片），`≤600px` 直接隐藏插画——留着它这一段会占掉整整一屏，而这一段的意义就是那几颗按钮。
  - **深浅双主题**由 `data-theme` 驱动（`<head>` 内联脚本先落地，避免首帧闪白；用户没手动选过就跟随系统），选择存 `localStorage.prelook-landing-theme`。
  - **词典**以 `data-i18n` 属性 + `js/main.js` 内的 `I18N` 对象独立维护（zh-CN 与 en 必须同步补齐，`data-i18n-aria` 负责无障碍标签）。`footer.slogan` 是词典里一条没人引用的历史遗留，留着没删。
  - **赞助区**是爱发电官方嵌入页（`leaflet` 是爱发电的嵌入页、不发 `X-Frame-Options`，所以能内嵌；主页统一写 `https://afdian.com/a/coldstoneboy`）+ Ko-fi 徽章（`assets/kofi.jpg` → `https://ko-fi.com/J1R627B7UA`）并排，页脚再各给一条链接；设置面板那份是 `components/SponsorSection.vue`，同样的两个入口。**爱发电只写 `afdian.com`**（`ifdian.net` 是同服务的老域名，两种写法并存看起来像两个账号）。**Patreon 已整体下线**，代码里没有任何引用，别加回来。
  - **页脚**是「logo + 字标 + 一句话」加**两栏**（快速链接 / 联系；栏用的是等宽网格而不是靠 gap 撑开的 flex；「快速链接」那一栏与页头导航是同一份清单、同一个顺序），最下面一行左边版权、右边 `.footer-meta`（备案号 + 回到顶部）。**备案号 `粤ICP备2026134562号` 是硬编码的法定标识**：不进词典（中英两种语言都原样显示），而且**必须链到 `https://beian.miit.gov.cn/`**——这是备案要求，不是"顺手给个出处"，别把它翻译掉或改成别的链接。
  - **站点 logo 与图标取的是 `assets/logo.webp`**（另有 `favicon.svg` / `favicon.ico` / `apple-touch-icon.png`）——**landing 目录里没有 `icon.png`**，那套命名已经跟着换标一起作废；插件图标源图是 `apps/prelook/assets/logo.webp`（见「附加模块」）。
  - **Agent 面向的第二份内容**：`llms.txt`、`index.md`、`privacy.md`、`robots.txt`、`sitemap.xml` / `sitemap-index.xml`，以及 `index.html` 顶部那段指向它们的 `.agent-directive`。**改面向人的文案要连 `index.md` / `privacy.md` 一起改**，否则人和 agent 看到的是两套。`Accept: text/markdown` 的内容协商在 dev 由 `vite.config.js` 的 `serveMarkdownNegotiation()` 做（线上交给部署层，步骤见 `deploy-agent-content-negotiation.md`），命名约定是每个 `.html` 配一个同名 `.md`。
  - **滚动入场**用 IntersectionObserver + 每帧几何兜底（`sweepReveals`：IO 是采样而非穿越检测，快速滚动会漏，兜底保证没有区块停在 `opacity:0`）。导航高亮的"滚到底点亮最后一项"那条兜底（`isAtBottom`）**必须先确认页面真的能滚**（`scrollHeight > innerHeight + 4`）：加载途中文档还没被撑高时 `0 + 视口高 >= 文档高` 会成立，于是最后一项会在首屏被误点亮，而且得等下一次成功的滚动更新才纠正。
  - **hero 已经没有录屏了**：`assets/demo.mp4` 与 `demo-poster.webp`、`#demoToggle`、`.hero-visual`、`hero.videoPlay/videoPause` 词条，以及更早那套纯 CSS 假预览窗（`.preview-window` / `.mock-*` / `@keyframes float|shimmer|loadbar`）与三张浮动卡片（`.floating-cards` / `.float-card`，连 `hero.float1t…float3v` 六条词条）都已删除。`apps/prelook/test/demo/`（那段视频的录制台）**因此暂时没有引用方**——留着只是为了将来重录，别以为 landing 还在用它，也别只在 landing 里补个 `<video>` 就宣布"视频回来了"。
- **RepoWays** — 第二款扩展，**已有第一版功能**（2026-10-14 从 WXT vanilla-TS 模板起步，包名 `@extensions/repoways`）：在 GitHub 仓库页的 `Code` 按钮**左边**注入一枚按钮（文字是 `Ways`，中英两份词条同值，品牌化的短词不翻译），悬停展开十五条入口（按功能分 4 组：structure＝GitDiagram / Dependency Graph / deps.dev，ai＝DeepWiki / Zread / GitReverse / GitMCP / Gitingest，code＝Sourcegraph / GitHub1s / GitHub.dev / Codespaces / StackBlitz，analytics＝OSSInsight / Star History；2026-10-15 由十条加到十五条，新增 Dependency Graph / deps.dev / GitMCP / Codespaces / OSSInsight），链接由 `utils/ways.ts` 按 `owner/repo` 现拼，纯 `<a target="_blank">`、不碰任何抓取。三处与 Prelook 刻意不同：**UI 走 content script 注入页面**（不是 popup/sidepanel，但 shadow DOM 那套抗页面干扰的经验仍然适用）、**没有 popup 入口也就没有 `action`**（工具栏不留按钮，所以 prelook 那条"删掉 popup 要手写 `action: {}`"在这里**不要照抄**——那条是为侧边栏产品补图标用的）、**vanilla TS**（`compile` 是 `tsc --noEmit`，真上 Vue 了才换 `vue-tsc` + `@wxt-dev/module-vue`）。图标源图 `apps/repoways/assets/logo.webp` **还没到位**，`@wxt-dev/auto-icons` 已装已配；实测它在缺文件时只打一条 WARN 并跳过生成，所以构建照绿。命名合规（已按 GitHub 商标规则实测）：品牌词不打头、`name` 就是字面量 `RepoWays`、"GitHub" 只在 description 出现一次，图标不得用 Octocat / invertocat。**`apps/repoways-landing/` 与 `landing:repoways` 脚本都还不存在**，别以为已经接入。
  - **锚点是 `#repo-content-turbo-frame button[data-variant="primary"][aria-haspopup="true"]`**，不是 class：GitHub 的 CSS-module 哈希名（`Box_6__yyTyGl`、`prc-Button-*`）每次部署都换，按钮文字又跟随界面本地化，两者都当不了锚。实测它在仓库页命中恰好 1 个、在 `/issues` 命中 0 个——**"找不到 Code 按钮"本身就是非仓库页的判据**，所以没有路径黑名单。仓库页切 tab 是 Turbo SPA 导航（文档不重载），所以 `mount()` 挂在 `turbo:load` 上，且进来先移除旧 host 再注入，保证全站只有一枚。
  - **配色只读 GitHub 自己的 Primer 变量，而且要取新命名那一套**。2026-10-14 在 github.com 上逐个量过：**老那一族 `--color-btn-bg` / `--color-fg-default` / `--color-bg-overlay` 已经不存在了**（只有 `--shadow-resting-medium` 还活着），照老名字写就等于永远落到字面兜底色——深色模式下会是一块白底菜单压在深色页面上。兜底字面值取 GitHub 的浅色值，自定义属性会穿过 shadow 边界继承进来，所以不需要 `adoptedStyleSheets` 或手工同步。**浮层那组变量是照 GitHub 自己那个 `Code` 下拉（Primer `AnchoredOverlay` + `ActionList`）量的**：底色 `--overlay-bgColor`（浅 `#fff` / 深 `#010409`，注意**不是** `--bgColor-overlay`——后者实测解析为空，写错就等于面板没有底色）、那圈描边加投影是 `--shadow-floating-small` 一层搞定、**面板没有 `border`**（1px 环是 shadow 的第一层）、圆角 `--borderRadius-large`（12px）、行圆角 `--borderRadius-medium`（6px）、行悬停 `--control-transparent-bgColor-hover`（`#818b981a` / `#656c7633`）。行是 32px 高 + `6px 8px` 内边距 + 14px 字号，**行间不画分隔线；只有分组交界处画一条 0.8px `--borderColor-default` 的发丝线**（`.rw-group-start`：`border-top` + `margin-top: 4px` 让它读作接缝而非某行的边；token 跟着深浅色翻，所以发丝线也是免费的。`content.ts` 只给"与上一行 `group` 不同"的那一行加这个 class，所以首行永远不带、菜单恰好 (组数−1)=3 条接缝）。每行**左边服务名（`--fgColor-default`）、右边描述（`--fgColor-muted` 12px）**，这是用户 2026-10-14 明确要求的顺序（原先反过来）。GitHub 行文字实测是 `#25292e`，比 `--fgColor-default` 的 `#1f2328` 浅一档，肉眼不可辨、且深色下两者同值，所以走变量。
  - **面板宽度是内容驱动的，不是写死的 400px**（用户 2026-10-14 第二轮反馈"这弹窗不要这么宽"）。一行就是"图标 + 服务名 + 一句短描述"，定宽 400 等于把大半块面板花在空白上：`width: max-content` + `min-width: 220px` + `max-width: min(320px, 100vw - 16px)`。加了图标、并扩到十五条后实测 zh_CN 262.93px、en 300.7px（en 最长那行已经是 "Dependency Graph" + "List its dependencies"，不再是早先的 Zread 那条；后加的 OSSInsight 行服务名和描述都更短，所以两种语言的宽度和 320 上限那 ~19px 余量都没动），**两份现有词条都碰不到 320 的上限**，220 也不再是"最短那份落到的值"、只是给极短词条兜底的 guard；视口那条 clamp 取代了原来定宽自带的"不出屏"。因为宽度是文字测量结果、跟着机器字体走，回归台**不再钉一个数字**，改钉这条不变量：`面板宽 === 最长那一行 + 两侧 8px`（容差 0.5px）再加 `220 ≤ w ≤ 320`，字体换了也不会假失败——这是从"把实测值写死成断言"里改过来的，别再退回钉字面宽度。
  - **一行 = `.rw-lead`（品牌图标 + 服务名）+ `.rw-desc`**（用户 2026-10-14 第六轮："参考 GitHub 的样式，去掉右边的小箭头，改用目标网站的图标，放在每一项标题左侧"）。上一版那枚描述末尾的 octicon `arrow-right`（曾硬写在词条里的 `↗` 字符的替代品，默认 `opacity: 0`、`:hover`/`:focus-visible` 才亮、占位不移除）**整条删掉了**：节点、`ARROW_PATH`、以及 CSS 里那两条 `opacity: 1` 规则都不在了，回归台有一条专门查它没回来。图标和名字用 `.rw-lead`（`gap: 8px`，GitHub ActionList 的图标-标签间距）包成一个组，行自己的 `gap: 16px` 就只分左、右两半——**图标属于标题，不是飘在旁边的一条装饰**。
  - **十五枚品牌图标在 `utils/icons.ts` 里，是内联 SVG，不是 `public/` 里的文件**。原因：content script 的 shadow DOM 画在宿主文档里，它加载的每张图都受 github.com 的 CSP 管，实测那条是 `img-src 'self' data: blob: github.githubassets.com` —— **`data:` 放行、`chrome-extension://` 不放行**，所以 `<img src="/icons/x.png">` 会静默不响。八张位图因此是内联 `<svg>` 里的 `data:image/png` `<image>`，七张有 SVG 源图的直接内联标记（压根不是网络加载）。已在真仓库页验过：shadow root 里那个 `<image href="data:image/png;base64,…">` 不触发 `error`、控制台也没有 CSP 报错。三条改写约定（源 favicon 一条都不满足）：**只留 `<svg>` 的子元素**（不要嵌套 `<svg>`/`<defs>`/`<title>`/`class`，shadow 里没有样式表去命中 class）、**品牌画成纯黑的那些形状改 `fill="currentColor"`**（黑墨在深色面板上等于隐形，而 currentColor 拿的是行文字色、本身就是 Primer 变量、免费跟着翻）、**品牌发了两枚 favicon 的（GitHub1s）改用 `fill="light-dark(#13227a,#0a84ff)"`**——实测 `light-dark()` 在 shadow root 里当**普通 presentation attribute** 就能解析，翻 `data-color-mode` 会重新解析，所以图标这一路不需要 `MutationObserver`。取图过程见那个文件顶部的注释（GitDiagram 取 ICO 里 32×32 那一档而不是自带的 16×16、DeepWiki 在 Vercel 盾后面 curl 全 429 只能用浏览器里取、GitHub.dev 那档是 32bpp BMP DIB 得手解像素重编 PNG、Sourcegraph 的 `favicon.ico` 其实是 `image/svg+xml` 而且 curl 会被 Cloudflare 拦成 403 只能从浏览器里取、Star History 那枚是 64×64 RGBA PNG 重编成 32×32）。**后加这两枚都不需要 `currentColor` 或 `light-dark()` 处理**——Sourcegraph 是自家橙 `#FF5543`、Star History 是品牌绿，深色面板上都可辨，16px 点阵图各验过一遍。**OSSInsight 同理**：取它 `favicon.png`（128×128）后在浏览器 canvas 里 `drawImage` 到 32×32（`imageSmoothingQuality: 'high'`）、`toDataURL` 编成 `data:image/png`，图形是黄底屏幕 + 白色节点图，品牌色在深色面板上辨得清，所以同样保留原配色、不改 `currentColor`。回归台另有一条查"位图图标一律是 `data:image/png` 内联 `href`"，把 CSP 那条约束变成了门禁而不只是注释。商标立场：这些是对方的自有标识、用来指明身份，和 GitHub 自己那个下拉里用法一致；Octocat / invertocat 仍然不碰。
  - **shadow root 里必须自己写一遍 `box-sizing: border-box` 的全局 reset**（`utils/menu.css` 顶部那条 `*, *::before, *::after`）。`box-sizing` 不是继承属性，页面上 GitHub 那个全局 reset 穿不进 shadow 边界，漏了它所有盒子都变成 content-box：面板量出来 236px（`min-width: 220px` 只算内容宽，再加两侧 8px padding）、行高 44px（`min-height: 32px` 是内容高，再加 `6px` 上下内边距），抄来的 padding + height 也对不上。这两条都是回归台量 rect 时抓出来的（236/44 是把 reset 覆盖回 `content-box` 实测出来的，不是推算），而 rect **必须在浮层展开后才可量**（`hidden` 元素一律报 0×0）。
  - **但那套变量只管菜单；按钮本体是"抄"来的**。用户要求按钮长得和旁边的分支切换器一样（2026-10-14 三连要求：先"跟 Go to file 一样"，再"弹窗跟 GitHub 一样"，最后"用仓库分支按钮一样的样式 + 加一个路由 SVG 图标"），而 shadow DOM 用不了页面的 class，所以 `content.ts` 现取 `#repo-content-turbo-frame #ref-picker-repos-header-ref-selector`（实测恰好 1 个，`/issues` 0 个）的**计算样式**、把 12 条属性逐个 `setProperty` 到按钮上：`background-color / box-shadow / color / border-width / border-style / border-color / border-radius / padding / gap / font-size / font-weight / line-height`。实测值是 `#f6f8fa`（即 `--bgColor-muted`）+ `0.8px solid #d1d9e0` + 6px 圆角 + `0 12px` 内边距 + `8px` gap + `14px/500/21px` + `rgba(31,35,40,.04) 0 1px 0`（**不是 inset**，和 Code 按钮那条 inset 高光线不一样）。**`height` 不在这份名单里、单独取 Code 按钮的**（两者实测都是 `32px`，但行高由 Code 那一颗说了算）。用 `border-*` / `padding` / `gap` 这类**简写**读回再写入，已在真页面上验过：每条都非空、且经内联声明往返回来与 donor 的计算值逐字符相同。donor 缺失时 `restyle()` 直接返回，落到 `menu.css` 里那组按分支按钮量的**字面兜底值**（而且能走变量的都走变量，所以那条路径在深色下也跟着翻）。深浅色是 `<html>` 上的 `data-color-mode` / `data-light-theme` / `data-dark-theme` 属性翻转，**没有导航也就没有 `turbo:load`**，抄来的值会留在旧配色（浅灰按钮压在深色页上），所以装了个 `MutationObserver` 盯着这三个属性重抄；`ContentScriptContext` 没有 `observe()` 助手，得自己 `ctx.onInvalidated(() => observer.disconnect())`。
  - **按钮里两枚图标的来历不一样**：后面的 caret 是从分支按钮 DOM 里逐字符抄的 octicon `d`（Primer 那枚新 caret `m4.427 7.427…`，不是老的 `triangle-down`——压在 500 字重的标签旁边显粗）；**前面的"路由"图标是自己画的**，因为 `primer/octicons` 根本没有这一档语义——2026-10-14 拉了 `icons/` 目录数过：**399 个图标名里没有 `route` / `path` / `signpost` / `map` / `compass`**（最接近的 `workflow`/`graph`/`node`/`share`/`arrow-switch`/`milestone` 都差意思，`git-branch` 则是"分支"不是"路径"）。所以那颗是自制图形：16 网格里两个 2.5px 半径的空心圆 + L 形连线（起点左下、终点右上），描边与圆环壁厚 1.25px 取的是 octicon 自己的粗细，`fill-rule` 用 nonzero（外圆顺时针、内孔逆时针，别改成 evenodd——那样连线压过圆环会挖出洞）。结构是 `图标 / Ways / 箭头` 三个子节点，SVG 不带文字所以 `textContent` 仍是 `Ways`。**自绘图标怎么"看见"**：这台机器的 `take_screenshot` 报 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`，改用 `canvas` + `new Path2D(d)` + `ctx.fill(path,'nonzero')`，把 `getImageData` 的 alpha 打成 ASCII 方块图（16 与放大 2 倍各打一张）——**必须同时在 16px 下打**，只在放大图上看不到"2px 的孔被抗锯齿糊成一团"这种真尺寸下才出现的问题（第一版壁厚 0.75px 就是这么暴露的）。回归台里那条检查只钉 `d` 的前缀和连线子路径，改图形要连着改。octicon 是 MIT 图标集、抄路径不涉及商标问题（禁的是 Octocat / invertocat 那个吉祥物），自绘的那枚更不涉及。

## 常用命令

在**仓库根目录**执行（脚本经 `pnpm -F` 转发到子包）：

| 命令                                                | 作用                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install`                                      | 安装并链接 workspace（首次克隆/目录改名后必跑，见下）                                                                                                                    |
| `pnpm dev:prelook` / `pnpm dev:prelook:firefox`     | 开发模式，产物在 `apps/prelook/.output/chrome-mv3-dev/`（firefox 为 `firefox-mv2-dev/`）                                                                                 |
| `pnpm -F @extensions/prelook exec wxt -b doubao`    | 开发模式，改用本机豆包浏览器（Chromium 147），产物在 `.output/doubao-mv3-dev/`。**根上已无 `dev:prelook:doubao` 脚本**（曾经有，已删）                                     |
| `pnpm build:prelook` / `pnpm build:prelook:firefox` | 生产构建，产物在 `apps/prelook/.output/chrome-mv3/`（firefox 为 `firefox-mv2/`）                                                                                         |
| `pnpm zip:prelook` / `pnpm zip:prelook:firefox`     | 打包上架 zip（名字见 `wxt.config.ts` 的 `zip.artifactTemplate`：`prelook-<版本>-<浏览器>.zip`）                                                                          |
| `pnpm compile:prelook`                              | 单产品类型检查（`vue-tsc --noEmit`）                                                                                                                                     |
| `pnpm compile` / `pnpm build` / `pnpm build:firefox`| 聚合：对全部子包 `--if-present` 执行（`build` 出各 app 的 chrome 产物，`build:firefox` 出 firefox 产物，CI 两个都跑）                                                  |
| `pnpm landing:prelook`                              | 官网开发服务器（Vite，http://127.0.0.1:4173 ，**根目录是 `apps/prelook-landing`**）：css 改动就地热更新（换掉 `<link>`，不刷新页面、不丢滚动位置），js/html 改动整页刷新 |
| `pnpm dev:repoways` / `build:repoways` / `zip:repoways`（各带 `:firefox`） | 第二款扩展 RepoWays 的同一套三件套，产物在 `apps/repoways/.output/<browser>-mv3[-dev]/`（firefox 为 `firefox-mv2`）。**没有 `landing:repoways`**：`apps/repoways-landing/` 还没建，脚本刻意不注册，指过去就是空转 |
| `pnpm compile:repoways`                             | RepoWays 类型检查（`tsc --noEmit`，vanilla TS 所以不是 `vue-tsc`）                                                                                                        |
| `pnpm lint`                                         | `oxlint apps scripts`（只报 error 才非零退出；当前 4 条 warning，见「关键约定」里那条 `no-useless-spread` 的说明）                                                    |
| `pnpm fmt` / `pnpm fmt:check`                       | `oxfmt` 格式化 / 只检查。**注意仓库目前不满足 oxfmt 默认风格（30/56 文件会有改动）且没有 `.oxfmtrc.json`**，所以 CI 不跑 `fmt:check`；想全面重排是一次独立的大提交，别夹在功能改动里 |
| `pnpm verify:locales`                               | `_locales` 体检：键名字符集合合法、locale 目录名用下划线（`zh-CN` 会被 Chrome 直接拒）、zh_CN 与 en 键完全对齐、message 非空。**遍历全部 app**（`scripts/apps.mjs` 从 `apps/*/wxt.config.ts` 发现），可 `node scripts/check-locales.mjs repoways` 单跑 |
| `pnpm verify:manifest`                              | 遍历**全部 app × 两个目标**的构建产物做 manifest 冒烟断言。单跑用 `node scripts/check-manifest.mjs [app ...] [--target chrome\|firefox] [--require-icons]`（老的 `<chrome\|firefox> [dir]` 形态已作废）。产物目录不存在 = 报错不是跳过；**app 在 `SPECS` 里没有条目也直接报错**，第三个产品不会静默漏检。`--require-icons` 只给发版 workflow 用（CI 不带，见「发版链路」） |
| `pnpm verify:landing`                               | 断言每个 `apps/<name>-landing/` 里的离线包链接版本 == 对应 `apps/<name>/package.json` 的 version，并且本地那份 `assets/<name>-<版本>-chrome.zip` 真的存在。没有 landing 目录的产品不参与 |
| `pnpm sync:landing`                                 | 上面那条的写入版：按 package.json 版本重写 `index.html` / `index.md` 里的离线包链接（bucket 形式 `https://<name>.s3.bitiful.net/<name>-…` 与本地 `./assets/…` 形式都改，两者都按产品名拼）                                   |
| `pnpm release:prelook` / `pnpm release:repoways`    | 各自只改版本号 + 打 tag（`prelook-v*` / `repoways-v*`），release 本体由对应 workflow 建成草稿。**RepoWays 的 `.release-it.json` 故意不带 auto-changelog 钩子和 bumper**，理由见「发版链路」 |

包管理器固定 **pnpm**（workspace 根有 `pnpm-lock.yaml`）。workspace 子包自身的 `postinstall`（`wxt prepare`）会正常执行，并生成 `apps/<name>/.wxt/tsconfig.json`——`tsconfig.json` 正是 `extends` 它，所以**没跑过 install 就编译会失败**。

> **pnpm 12 的 `allowBuilds` 陷阱**：pnpm 12 默认拦下依赖的构建脚本，并且只要 `pnpm-workspace.yaml` 里有**任何一条非布尔的 `allowBuilds`**，它就直接让整个 install 失败（`ERR_PNPM_IGNORED_BUILDS`）——本仓库曾躺着一条 `'@wxt-dev/analytics': set this to true or false` 的占位串，等于**任何人在任何机器上 `pnpm install` 都是红的**。现在写死为 `false`（保持不执行：那个 postinstall 只是给 analytics 自己跑 `wxt prepare`，Prelook 需要的 `.wxt` 产物由 `apps/prelook` 自己的 postinstall 生成）。新增被拦下的依赖时照此补一条布尔值，别让占位串进仓库。

`apps/prelook/node_modules/` 里是指向 pnpm store 的**符号链接，写死绝对路径**：把仓库目录改名或移动（例如 `prelook/` → `extensions/`）后它们会集体失效，表现为"模块找不到"。跑一次 `pnpm install` 即可重建链接。

**多浏览器启动**：`wxt.config.ts` 的 `webExt.binaries` 是**按 `-b` 传入的浏览器名取值**的映射（内部即 `binaries[browser]` → `chromiumBinary`），所以自定义浏览器必须让**映射键与 `-b` 参数同名**。当前 `doubao` 键指向本机豆包浏览器主程序，只有 `-b doubao` 会命中（**根上已无 `dev:prelook:doubao` 脚本，跑法见上面表里那一行**），直接 `wxt` 仍启动 Chrome。新增浏览器照此加一条键 + 一个 `dev:<name>` 脚本即可；浏览器名不是 firefox/safari 时一律按 MV3 构建，产物目录随之变成 `.output/<name>-mv3[-dev]/`。

**Zen Browser 是这条规则唯一的例外**，因为它和 doubao 不同、是 **Firefox 内核**：WXT 只在 `browser === 'firefox'` 时读 `binaries.firefox` 并把 web-ext 的 `target` 设成 `firefox-desktop`，其余名字一律当 Chromium（`binaries[browser]` → `chromiumBinary`，`target: 'chromium'`）。所以写一个 `zen` 键是**没有用的**：`wxt -b zen` 会产出 Chrome MV3 清单（`background.service_worker` + `side_panel` + `sidePanel` 权限），Zen 一条都加载不了。正确做法是让 **`binaries.firefox` 指向 Zen 主程序**（本机没装真正的 Firefox，所以这个槽位归 Zen），跑法就是 `pnpm dev:prelook:firefox`（`wxt -b firefox`；`dev:prelook:zen` 那个别名脚本已删，别再照名字去找），产物走 `.output/firefox-mv2-dev/`。装了真 Firefox 之后想让两者并存就只能改这一行——WXT 没有"按名字给 firefox 目标指定 binary"的入口。

同层的 `webExt.startUrls` 决定 dev 启动时打开的页面（当前是一组真实测试站点：linux.sb、贴吧、虎扑帖子、reddit、小黑盒信息流、NGA、B 站视频——每个各踩一条链路：禁嵌站点、卡片流含 `<img>` 的链接、长文兜底等）：它**没有按浏览器区分的形式**（只有 `manifest` 支持 `UserManifestFn` 那种 `env.browser` 函数），配了就对所有 dev 目标生效。

## 目录结构

```
pnpm-workspace.yaml          # packages: ['apps/*', 'packages/*']（packages/ 目录还没建，是留给将来的）
apps/
  <name>/                    # 插件本体，包名 @extensions/<name>；工程根 = 此目录，@/ 别名指到这里
    wxt.config.ts            # manifest（权限/名称/描述/action）唯一定义处
    tsconfig.json            # extends ./.wxt/tsconfig.json（生成物）
    entrypoints/
      background.ts          # SW：fetch 预检、开标签页（消息中枢）
      content.ts             # 悬停/点击/长按判定 + Shadow UI 装配
      sidepanel/             # 设置面板（点工具栏图标打开）：App.vue（4 个 tab：preview / search / history / settings + 共用底部赞助块）+ index.html + main.ts + style.css
    components/              # 面板复用的 Vue 组件：SponsorSection（赞助块）+ ColorInput / DropdownSelect / RadioGroup / SliderInput / ToggleSwitch（设置项控件）
    utils/
      storage.ts             # 设置类型/默认值/夹取 + settingsItem + 引擎表
      preview/                 # 预览窗系统（拆为目录，`@/utils/preview` 解析到 index.ts）：
        index.ts               #   createPreviewSystem：窗口生命周期 + place/主题/加载流（DOM 手动构建）
        types.ts               #   AnchorInfo / WindowInstance / PreviewSystem / PreviewDeps 等类型
        constants.ts           #   超时/动效/尺寸等常量
        icons.ts               #   头部四枚细描边图标（静态 SVG 串）
        style.css              #   PREVIEW_STYLE 整段 shadow-CSS（`?raw` 内联成字符串）
        widgets.ts             #   三个指针浮层：倒计时条 / notice toast / 悬停高亮框
      selection.ts           # 划词搜索工具条（样式在同目录 selection.css，`?raw` 导入）
      extract.ts             # 阅读模式正文提取 + sanitize 白名单
      translate.ts           # 内联翻译：Google 公开 JSON 接口的 background 客户端
      speculation.ts         # Speculation Rules 预热
      i18n.ts                # browser.i18n.getMessage 的薄封装（点号 key → messages.json 消息名）
      pageAccent.ts          # 从页面自己取强调色（`auto` 弹窗主题）：theme-color meta → 常见 CSS 变量 → 链接颜色众数；取不到就 null 回落默认色
      theme.ts               # resolveTheme / watchTheme（深浅三档，system 为默认）
      power.ts               # resolvePowerState / watchPower（节电三档 + reduceMotion 合流）
      safety.ts              # assessLink 钓鱼特征提示（只读，不拦截）
      tracking.ts            # stripTracking：剥追踪参数 + 解中转壳
    public/_locales/         # 界面词条 en/messages.json + zh_CN/messages.json（浏览器原生 i18n，WXT 原样打进产物根目录的 _locales/；default_locale 是 **en**）
    public/kofi.jpg          # 设置面板赞助块里 Ko-fi 徽章的图（`/kofi.jpg`，WXT 把 public 原样拷进产物根）
    assets/logo.webp         # 唯一图标源图（@wxt-dev/auto-icons 用它生成各尺寸；`assets/logo-candidates/` 是换标时的候选稿）
    test/repro-hover.html    # mock chrome API 的悬停链路回归页（引用 .output 真实产物）
    test/demo/               # 落地页 hero 那段演示视频的录制台（mock background + 真实 content.js）——**视频已从 landing 撤下，目前无引用方**
  <name>-landing/            # 落地页，包名 @extensions/<name>-landing，运行期零依赖（vite 只是 devDependency）
    index.html  privacy.html  css/  js/  assets/  vite.config.js
    llms.txt  index.md  privacy.md  robots.txt  sitemap.xml  sitemap-index.xml   # agent 面向的第二份内容，改文案要同步
  repoways/                  # 第二款扩展：包名 @extensions/repoways，vanilla TS、不引 Vue
    wxt.config.ts            # 无 action、无 permissions（纯 content script）；auto-icons 已配但在等 assets/logo.webp；AMO 永久 id 与 data_collection_permissions 写死在 browser_specific_settings；zip.excludeSources 挡掉候选稿（见「新插件接入清单」）
    .release-it.json         # tagName `repoways-v${version}`、`github.release: false`；**没有** auto-changelog 钩子和 bumper，理由见「发版链路」
    assets/logo-candidates/  # 换标候选稿（gitignored，同时被 excludeSources 挡在源码包外）；定稿是 assets/logo.webp，那个要进仓库
    entrypoints/content.ts   # matches 只有 https://github.com/*：找 Code 按钮 → shadow DOM 插 `Ways` 按钮（自绘路由图标 + 标签 + 抄来的 caret，样式逐属性抄分支切换器）+ 悬停浮层（每行 `.rw-lead`＝品牌图标 + 服务名，右边 `.rw-desc`，group 变化处给该行加 `.rw-group-start`）+ 盯 `data-color-mode` 的 MutationObserver
    utils/menu.css           # 浮层样式，`?raw` 内联成字符串交给 shadow root（**不能放 entrypoints/ 下**，会被当成 CSS 入口单独产出一个文件）；顶部自带 `box-sizing` reset（不跨 shadow 边界继承）；面板按内容定宽（220 guard / 320 上限）；`.rw-group-start` 画组间发丝线（0.8px `--borderColor-default` + 4px margin-top）；`.rw-btn` 那组只兜 donor 缺席的情况
    utils/icons.ts           # 十五枚品牌图标的内联 SVG（八张位图是 `data:image/png` 的 `<image>`，七张是路径）；github.com 的 CSP 放行 `data:`、拦 `chrome-extension://`，所以图标只能内联、`public/` 那条路走不通
    utils/ways.ts            # 十五条入口的 labelKey / service / icon（取自 icons.ts）/ group（structure|ai|code|analytics 四档）/ url(owner, repo)；按组排成 4 段连续块，content.ts 靠 group 变化画发丝线；repoFromPath 从 pathname 取仓库
    utils/i18n.ts            # browser.i18n.getMessage 的薄封装（点号 key → 消息名，动态键要 as 断言）
    public/_locales/         # en + zh_CN，17 条（extDescription + button.label + ways.* 十五条；`button_label` 两份都是 `Ways`）
    test/repro-menu.html     # mock chrome.i18n + 引用 .output 真实产物的回归台，见「回归自检」
```

**新插件接入清单**：建 `apps/<name>/`（可复制 prelook 骨架）→ 改 `wxt.config.ts` manifest 与 package.json 名（`@extensions/<name>`）→ 根 package.json 注册 `dev/build/zip/compile/landing:<name>` 脚本 → **在 `scripts/check-manifest.mjs` 的 `SPECS` 里给这个 app 写 chrome + firefox 两条形状**（没有条目 `pnpm verify:manifest` 直接红，这是刻意的：产品的 manifest 形状没人写下来就等于没门禁；`verify:locales` 与 `verify:landing` 按目录自动发现、不需要登记）→ 建 `apps/<name>-landing/` → 图标**两边各导一份**（插件用 `apps/prelook/assets/logo.webp`，各尺寸由 auto-icons 从它生成；landing 用自己的 `assets/logo.webp` 给导航/页脚/`og:image`，外加手工重导的 `favicon.svg` / `favicon.ico` / `apple-touch-icon.png`）。这两份不是同一个文件、仓库里也没有导出脚本，所以**别指望 `cp` 一张就完事**。landing 是独立部署的静态站，不能写 `../prelook/assets/...` 这种跨目录路径。

> 抄 prelook 的 `wxt.config.ts` 时有三处**必须改**，照抄就是抄走 bug：① `zip.artifactTemplate` 与 `zip.sourcesTemplate` 不能写成同一条字符串（prelook 自己就撞了，见「发版链路」），sources 那条要带字面量 `-sources`；② `webExt.binaries` 里 doubao/Zen 那两个绝对路径是本机专属，新产品要么换成自己的 `startUrls`、要么先删；③ `zip.excludeSources` 要按新产品自己的 gitignored 文件重列——WXT 打包**不看 `.gitignore`**，prelook 那份排除表（候选稿 + `scripts/private-key.json`）对新 app 一条都不对，凡是不想交给 AMO 审核方的东西都得自己点名。当前进度：`apps/repoways/` 已走完清单前四步（包名 + 根脚本 + 真 manifest 与双语 `_locales` + `SPECS` 登记，所以它从 2026-10-14 起在 CI 上有门禁了），**landing 与 `landing:repoways` 尚未创建**；它的 `webExt` 只配了 `startUrls`，没有 binaries。`excludeSources` 已经补上并且**量过两侧**：三张带水印的 logo 候选稿落进 `assets/logo-candidates/` 之后，`pnpm zip:repoways:firefox` 出的源码包从 11 个文件 / 57 KB 涨到 **14 个文件 / 2.10 MB**（`unzip -l` 里就是那三张 PNG），加 `excludeSources: ["assets/logo-candidates/**"]` 后回到 11 文件 / 29 KB。同一条目录也写进了 `apps/repoways/.gitignore`，但**那两条管的是两件不同的事**：gitignore 决定它进不进仓库，`excludeSources` 决定它进不进给审核方的包——只有前者的话，包照样带着 2 MB 草稿出去。

## 运行期架构

### 三个上下文与消息协议

content script 拿不到部分能力（见"陷阱"），所有跨上下文调用都走 `browser.runtime.sendMessage`，**消息名统一 `prelook:` 前缀**，处理函数集中在 `entrypoints/background.ts`：

| 消息                | 方向                         | 载荷 / 回复                                                                                                                                                                                  |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prelook:fetch`     | content → background         | `{ url }` → `{ ok, canEmbed, finalUrl?, title?, description?, favicon?, html?, error? }`                                                                                                     |
| `prelook:openTab`   | content/preview → background | `{ url, background? }` → `{ ok: boolean }`（`background:true` 时非激活打开）                                                                                                                 |
| `prelook:translate` | content → background         | `{ text, to }` → `{ ok, translated?, sourceLang?, error? }`（内联翻译，见「划词翻译」）                                                                                                      |
| `prelook:preview`   | **background → content**     | `{ url, sidebar }` → 无回复。右键菜单点「在预览窗/侧边栏打开」时由 background 发给该标签页，content 自己按 url 找 `<a>` 的 rect（找不到就用视口中心），再 `preview.open({ …info, sidebar })` |

`prelook:fetch` 的 `hostOrigin` 由 background 从 `sender.tab.url` 推导，用于 XFO / CSP `frame-ancestors` 判定；未知消息一律返回 `undefined`（表示不接管）。

### 一次悬停预览的数据流

1. content 判定命中链接 → `speculation.onIntent(url)` 预热 → 起延迟定时器（`hoverDelayMs`，`longPress` 模式改用 `longPressMs`）→ 延迟期间在光标处显示倒计时进度条（`preview.startProgress/cancelProgress`；hover/altHover/hoverSpace/longPress 都有，`click`/`altClick` 是立即打开故无倒计时；条在光标上方，顶部空间不足时翻到下方）。
2. 定时器到期 → `ensureUi()`（懒建 shadow host）→ `preview.open()` 插入骨架屏窗口 → 发 `prelook:fetch`。
3. background 抓取页面并判定 `canEmbed`（12s 超时、`credentials:'omit'`、`redirect:'follow'`、HTML 截断 2MB）。
4. 可内嵌 → 渲染 iframe；**8s 未触发 load** 才转阅读模式兜底。
5. 不可内嵌 → 有 HTML 走 `extract.ts` 阅读模式，否则错误页（带「在新标签页打开」）。
6. 抓取本身失败（网络错误）时 `canEmbed` 未知，按"宁可一试"仍渲染 iframe。

鼠标离开时 `releaseExcept()` 不是立即关窗，而是给 **400ms 宽限**再关，避免指针穿过缝隙时窗口闪没。

### Alt + 悬停（altHover 模式）

判定是"指针在链接上 **且** Alt 按住"，**不关心先后**：`pointerover` 时带 Alt 就走主路径，指针已经停在链接上、之后才按 Alt 则由 `keydown` 起同一套倒计时——否则"先悬停后按 Alt"永远不会触发，因为指针不动时浏览器不会再派发 `pointerover`。两条路径都调 `beginHover()`，指针位置取自 `pointerover` 时记下的 `hoverTarget`（`toAnchorInfo` 的 rect 是调用那一刻现取的，所以中间滚动过也用的是新鲜坐标；`hoverTarget` 在指针移到非链接、移出文档时置空）。

两个配套细节：

- **松开 Alt 会取消还没到期的倒计时**（`keyup` → `clearHoverTimer()`），这样"按住 Alt"在整个延迟期间都是必要条件。代价是改了旧行为：过去 Alt+悬停起表后、延迟内松开 Alt，预览照样会开，现在不会（已开出的窗口不受影响——和指针路径一致，只有移开指针/点外部才关，所以不会有"松手瞬间窗口闪没"）。
- `keydown` 必须判 `event.repeat`：Alt 按住时会一直自动重复，而倒计时一到期 `hoveringUrl` 就被清空，这时候再来一次重复事件就会重新起表、把已经开好的窗口又 `open()` 一遍（`open()` 对已存在的 URL 只是重排位置、不重抓，但仍会把用户拖过的窗口拽回锚点）。

### Alt + 单击（altClick 模式）

**altClick 在指针层接管，不是靠 click**：Alt+按下可预览链接时，`pointerdown`（window 捕获）就 `preventDefault()` 并记下起点，`pointerup` 位移 ≤ `DRAG_INTENT_PX` 才 `preview.open()`。为什么不能只看 click——**按住 Alt 时手一抖（几像素）就变成选择拖拽**：click 根本不派发，基于 click 的 altClick 静默失灵，而拖出的选区会就地弹划词工具条（与划词功能正面冲突，实测复现）。`preventDefault()` 掉 pointerdown 同时掐断"选区起点 + 后续 click 默认（下载/导航）"，两条都以 pointerup 收口。位移超阈值的拖拽什么都不做（选区与导航已被抑制，页面原地不动）。

click 监听（window 捕获）里的 altClick 分支**仍在**，但角色变了：Chromium 实测**取消 pointerdown 并不会阻止 click 派发**，所以那次 click 照样到达。pointerdown 会顺手置一个 `altGesture` 标志，click 监听看到它就**只 `preventDefault` 掉下载/导航默认、不再开窗**（开窗与否已由 pointerup 按位移裁决——否则超阈值的拖拽会被这次 click 复活）。标志在 pointerdown/pointercancel 时重置。**别删这个分支**：删了 Alt+单击会触发下载。纯键盘 Alt+Enter 没有指针阶段、标志为假，由 click 监听自己负责开窗。

`click` 模式（不带 Alt）仍走同一个 click 监听：`click` 要求不带修饰键，`altClick` 要求**只**带 Alt（Ctrl / Meta / Shift 一律让给浏览器，Ctrl+单击仍是"新标签页打开"）。

这两个监听**必须绑在 `window` 且用 `{ capture: true }` 对象形式**，两个坑叠在一起曾让 altClick"在虎扑这类站点上完全不生效"（本地无拦截页却正常，极具迷惑性）：

- **绑 `document` 会被页面抢跑**：论坛/SPA 常在 `document` 捕获阶段自己 `addEventListener('click', …, true)` 做客户端路由并 `stopImmediatePropagation()`；content script 跑在 `document_idle`，注册永远晚于页面的 document-start 脚本，于是被静默掐掉、点击照常导航。捕获路径是 `window → document → … → target`，绑在 `window` 就抢在任何 document 监听之前，与注册先后无关。
- **裸布尔 `true` 会静默丢掉 capture**：`ctx.addEventListener(target, type, handler, options)` 内部是 `target.addEventListener(type, handler, { ...options, signal })`，而 `{ ...true }` 展开成 `{}`——capture 标志没了、监听退化成冒泡阶段，正好是被上面那个拦截器杀死的阶段。所以凡是想要捕获，第四个参数一律写 `{ capture: true }`，别图省事写 `true`。（`selection.ts` 一直是对象形式，所以没踩到；`preview.ts` 里用的是原生 `window.addEventListener`，裸布尔合法。）

和 `click` 模式的区别是刻意设计的：`click` 模式下普通单击就被预览接管、不会跳转；`altClick` 模式下普通单击照旧导航（实测过），只有按住 Alt 才走预览。另外注意 `altHover` 模式下按住 Alt 移动鼠标本身就会触发预览，所以用键盘模拟"Alt+单击"时容易看到两个窗口——那是 altHover 正常工作，不是 altClick 串味。

### 悬停 + 空格（hoverSpace 模式）

指针停在链接上、再按一下 Space 起 `beginHover()` 的同一套倒计时（和 altHover 共用 `hoverDelayMs`、`hoverTarget`、`keydown` 监听）。与 altHover 的关键差别是 Space 是**离散键**而非按住修饰键，所以倒计时一旦起表就让它走完、松开 Space 不取消（`keyup` 只处理 altHover 的 Alt）。三个配套细节：

- **必须 `preventDefault()` 掉 Space 的默认页面滚动**：否则链接会在倒计时期间从指针底下滚走，`pointerover`/`pointerout` 把刚起的表取消掉。即使表已在跑（或自动重复）也照吞——判据是"当前 mode 是 hoverSpace 且指针在链接上且不在可编辑目标里"，不看 `hoveringUrl`。
- **不能劫持表单里的 Space**：`isEditableTarget()` 判 `closest('input, textarea, select, button')` 或 `isContentEditable`，命中就放行给页面（Space 该激活复选框/滚动 textarea，不该开预览）。纯键盘 Tab 到链接时 `hoverTarget` 是 null（只有 `pointerover` 会写它），所以"焦点在链接上按 Space"天然走不到这条路径。
- `pointerover` 里对 hoverSpace 加了"同 URL 保活"分支（`triggerAllows(event) || hoveringUrl === hoverTarget.url`）：指针在同一链接的子元素间移动会反复派发 `pointerover`，若按 altHover 的严格判定会 `clearHoverTimer()` 打断倒计时；hoverSpace 没有 keyup 清零，靠这个分支让 `beginHover()` 命中 `hoveringUrl === hit.url` 的提前返回、保住正在跑的表。

### 拖动触发（drag 模式）

`triggerMode: 'drag'` 时，**按住链接拖动超过 `DRAG_INTENT_PX`（12px）就打开预览**——"打开"发生在拖动过程中而不是松手时，和 longPress 的"按住期间就打开"保持一致；松手后那次 click 由既有的 `suppressClickUrl` 吃掉，所以不会跳转（实测过：拖完再点链接，页面不导航）。几个关键点：

- `DRAG_INTENT_PX` 同时被两处复用：drag 模式用它判定"开始拖"，longPress 模式用它判定"这不是长按，取消"——同一个位移，两种模式下的相反含义都是刻意的，改的时候别只顾一边。
- 必须拦掉浏览器原生的链接拖动：`dragstart` 里对 `a[href]` 调 `preventDefault()`（**只在 drag 模式**），否则原生拖拽会话会接管手势、pointermove/pointerup 不再派发，整套判定就废了。不拦的话也没法用原生 `dragend` 代替——原生拖放松手可能直接导航。
- 一次手势只开一个预览（触发后立刻 `dragCandidate = null`）；`cancelPress()` 里也清它，所以 pointerup/pointercancel/下一次 pointerdown 都会重置。
- 没拖够距离就松手 = 普通点击，什么都不会发生；从非链接处开始拖也不触发。

### 预览窗出现/消失动效

照搬腾讯云控制台弹窗那套（也就是 TDesign 的 motion token）：进入 `.2s cubic-bezier(0, 0, .15, 1)`（减速，`opacity 0→1` 同时 `transform: scale(.92) → none`），退出 `.16s cubic-bezier(.38, 0, .24, 1)`（加速，`scale(1 → .96)` + 淡出），遮罩走 `.2s linear`。两个时长写在 `.tp-win` 自己的 `--tp-in-motion` / `--tp-out-motion` 上，改一处即可。

- **`.tp-in` 必须把 `transform` 落回 `none`**：动效结束后留在元素上的 transform 会让窗口永远是合成层兼 containing block，毫无收益。所以 `--tp-in-motion` 用 transition 而不是 keyframes 动画，`transform: none` 是终态。（还有条更硬的理由：标题栏用 `backdrop-filter` 采样页面时，live transform 会把窗口变成它自己的 backdrop root、毛玻璃静默失效——开窗头 ~200ms 内标题条糊的是窗口正文而不是页面，等 `.tp-in` 落地才恢复。）
- 缩放原点由 `place()` 按 `lastPointer` 写入（`originPercent()` 把指针位置折算成窗口内的百分比，clamp 到 0–100），窗口是从链接/光标处长出来的，而不是从自己中心。侧边栏停靠时改成贴边中线（右停靠 `100% 50%`、左停靠 `0% 50%`）。`place()` 在 `manualPosition` 时直接返回，所以手动拖过的窗口保留上一次的原点——无所谓，动效只在开窗/关窗时可见。
- 基础态是 `opacity: 0` + `scale(.92)`；创建后等**两帧 rAF** 再加 `.tp-in`（和倒计时条同一套理由：先让初始态落地，否则过渡不触发）。关闭时加 `.tp-out`（自带 `pointer-events: none`），`setTimeout(…, EXIT_MS + 40)` 之后才真正 `remove()`。`EXIT_MS` 必须和 CSS 里的 `.16s` 对齐。
- 刚出现的那 200ms 里窗口上挂着 transform，此时 `getBoundingClientRect()` 报的是缩放后的视觉盒——头部拖拽用的是它（只有"窗口刚出现就按住标题栏"才会碰到，随后自动恢复），角落手柄因此改用 `offsetWidth/offsetHeight`（布局尺寸，不受 transform 影响）。
- `closeWindow(win, animate = true)`：`win.closed` 立即置位、同时从 `windows` 数组里摘掉，所以消失中的窗口**不再计数、不参与 `place()` 重排、也点不动**，只是元素多留约 200ms（iframe 也是等动效走完才置 `about:blank`，否则会在过程里闪一下空白）。`destroy()` 走 `animate = false`，扩展失效/页面卸载时立刻摘除不做动画。驱逐（超上限）走的也是这条路径，所以新旧窗口是交叉淡入淡出，不会堆积幽灵节点。
- 模糊遮罩 `.tp-overlay` 由 `display` 切换改为 `.tp-on` 透明度过渡，统一由 `syncOverlay()` 决定（`blurPx > 0 && 还有未关闭的窗口`）。这里顺手**修掉一个旧 bug**：过去 `open()` 会点亮遮罩而 `closeWindow()` 从不熄灭，开了背景模糊的用户把预览窗全关掉后，整页会一直灰着直到改设置。

### 预览窗尺寸与背景效果

- 右下角 `.tp-resize` 手柄拖拽改大小：尺寸存进 `win.manualSize`（像素），`sizeFor(win)` 在布局数学里优先用它、否则回落到宽高百分比；`place()` 不再写内联尺寸，所以手动尺寸不会被设置变更或视口 resize 冲掉，但**切到侧边栏时会主动清掉**（见上）。手柄在侧边栏模式下 `display: none`。最小 240×160，最大视口减 16。
- 背景效果从固定 px 的 `blurPx` 改成百分比 `blurStrength`（0–100）：`--tp-blur = 强度/100 × 14px`、`--tp-dim = 强度/100 × 0.5`，两个都由 `applyVisualVars()` 写。**遮罩只在鼠标指针位于某个预览窗内时才显示**（`win.hovered`，由窗口 root 的 mouseover/mouseout 维护，`syncOverlay()` 据此开关），所以页面在你不看它的时候立刻恢复清晰。注意 `mouseout` 同时会 `releaseExcept()` 启动 400ms 自动关闭——这是既有行为，不要为了"移开指针只关模糊"去动它。
- 老配置里的 `blurPx` 会被折算一次（×5）。坑在于调用方都先 `{ ...DEFAULT_SETTINGS, ...stored }` 合并，默认值会把 `blurStrength` 填成 0，所以判断不能写成 `s.blurStrength ?? 老值`（永远走不到老值）——要判"新值 > 0"。`clampSettings` 同时把 `blurPx` 从返回对象里剔除，否则它会一直被存回去、每次读都把用户后来设的 0 复活成老值。

### URL 跟踪保护（`utils/tracking.ts`）

`stripTracking(url)` 先**还原中转壳再剥参数**（壳里套壳的情况走两遍，深度上限 3 防环），`stripTracking` 只处理 http(s)，解析失败一律原样返回。

- **全局参数表只收"自解释"的名字**（`utm_*` / `pk_` / `mtm_` / `hsa_` / `oly_` 前缀 + `gclid` / `fbclid` / `msclkid` / `mc_eid` / `mkt_tok` / `_hsenc` / `_gl` 之类）。`ref`、`source`、`si`、`s`、`t`、`spm`、`scm` 这类短名字**故意不收**——它们在很多站点是功能性参数，剥错就是打不开页面。想覆盖它们需要按域名的规则表，这是明确的下一步而不是疏漏。
- **中转壳表的 `path` 是必须的**：`google.com/url?q=` 要还原，`google.com/search?q=` 绝不能碰（把搜索词当成目标地址解出来就出大事了）。测试里专门留了这条用例。
- 应用点只有三处，都是"Prelook 自己要发起访问"的地方：content 的 `anchorHref()`（**在这里洗一次，keep/find/open/fetch 后面比较的都是同一个值**，否则窗口会因为 URL 不一致而找不到）、右键菜单的 `anchorInfoFor()`、以及 background 的 `prelook:openTab`（兜底，按 `stripTracking` 设置决定，预览抓取因此也不会带上追踪参数）。开关关闭时三处都放行原地址。

### 链接风险提示（`utils/safety.ts`）

`assessLink(href, anchorText)` 纯本地判定，返回一个 `RiskReason` 或 `null`：`userinfo`（`apple.com@evil.tld`）、`punycode`（`xn--` 或非 ASCII 域名）、`brandMismatch`（域名里出现品牌词但不属于该品牌，或"诱导词 + 链接文字带品牌"）、`textMismatch`（显示的文字写着另一个域名）、`ipHost`、`shortener`。只读：**不拦截、不弹窗**，只在预览窗标题栏加一个 `⚠` 徽章（`.tp-risk`，文字随语言走 `syncHeaderButtons`）。

判定要克制，宁可漏也不要误报——这是"提示"不是"判罪"：合法品牌官网（`www.paypal.com`）、只有诱导词没有品牌的普通域名（`secure.example.com`）都**不**提示，`lure` 检查必须与链接文字里的品牌同时命中才成立。文案也照着这个定位写：说的是"域名疑似仿冒""文字与目标不符"，**不说"这是恶意网站"**——没有威胁情报源就抓不到"已知恶意"，能抓的只是伪装手法，这一点在改动文案时别丢。

### 关闭触发器

三个独立开关（`closeOnOutsideClick` / `closeOnMouseLeave` / `closeOnScroll`，默认全开）决定预览窗什么时候自动关掉。实现分散在两处，且语义都是"**只关未固定的窗口**"：

- `closeOnMouseLeave` 直接**关掉整条自动关闭路径**：`releaseExcept()` 开头就 `if (!settings().closeOnMouseLeave) return;`。这一条同时管住"指针移开链接"和"指针移出窗口"两种 mouse-leave 场景，因为两者都走 `releaseExcept`。关掉后窗口会一直留着，直到别的触发器或用户手动关闭。
- `closeOnOutsideClick` 在 `content.ts` 用捕获阶段的 `pointerdown` 实现（同样绑 `window` + `{ capture: true }`，理由见「Alt + 单击」一节：抗住页面自己的 document 捕获拦截）：`composedPath()` 里出现 `PRELOOK-UI` 就当作点在自家 UI 上（包括预览窗内的 iframe），否则 `preview.dismissUnpinned()`。用 pointerdown 而不是 click，是为了按下即响应。
- `closeOnScroll` 挂在 `preview.ts` 已有的 scroll 监听里（那个监听同时负责让悬停高亮跟着链接走）。**注意无头 + `--virtual-time-budget` 下浏览器不派发 scroll 事件**，验证滚动相关行为必须用实时模式（CDP 不加虚拟时间），否则会误判成"滚动不关闭"。

`dismissUnpinned()` 与 `releaseExcept()` 都会跳过 `pinned` 窗口——固定就是"别自动关"的意思，加新关闭路径时也要照此跳过。另外固定住所有窗口会顶到 `maxWindows` 上限，此时新预览不打开并弹 `preview.pinLimit` 提示，三件套是连在一起的。

### 弹窗主题（预览窗配色预设）

`windowTheme` 选定一套预览窗配色，取值见 `WINDOW_THEMES`（`utils/storage.ts`，**13 项**：silver / blue / gray / green / purple / pink / orange / cyan / red / amber / midnight / custom / auto，默认 **silver**）。两个关键约定：

- **令牌驱动**：预览窗的表面色/文字色不再写死，而是 `:host` 上的 `--tp-base / --tp-ink / --tp-surface / --tp-line / --tp-soft`（`--tp-line`、`--tp-soft` 由 `--tp-ink` 与 `--tp-surface` 用 `color-mix` 推导）。深色主题只改 `--tp-base`、`--tp-ink` 两个默认值，窗口规则全读令牌。`applyWindowTheme(root, preset, customColor)` 把预设写进**每个窗口 root 的内联变量**（内联优先，所以能压过主题默认值）：`kind: 'tint'` 的预设写 `--tp-surface: color-mix(in srgb, var(--tp-accent) 7%, var(--tp-base))`——**混到底色而不是写死白色**，这样深色主题下选浅色预设会得到"深底 + 淡淡的主色"，而不是一块刺眼的白色；`kind: 'dark'` 的预设直接给 `surface` / `ink`，无视应用主题（"深色"那张卡就是这个）。
- **窗口配色只属于窗口**：`themeColor` 是**插件自己 UI 的强调色**（设置面板、链接高亮框、倒计时条、划词条——由 `selection.ts` / `applyVisualVars()` 里的 `overlay`、`highlight`、`progressBar` 分别写到各自元素上），只在「设置」tab 的「主题色」取色器里改；`windowTheme` 绝不写回它。窗口的强调色由 `applyWindowTheme()` 统一写：预设用自己的 `accent`，`custom` 用另一个独立设置项 `windowColor`（弹窗主题卡片里那张铅笔卡的取色器改的就是它）。因此 `applyVisualVars()` 和 `open()` **都不再给窗口 root 写 `--tp-accent`**，新增窗口上色的地方也别绕开 `applyWindowTheme` 自己写，否则同一个窗口会一半按预设、一半按插件主题色。历史包袱：旧数据里 `themeColor` 曾被预设强制改写（`clampSettings` 里那行已删），解耦后老用户的窗口配色保持原样，插件的强调色则停在最后一次被预设改写的值上——想改回默认色在「设置」tab 里点一下即可。
- **标题栏是整宽的 liquid glass 条**：`.tp-head` 是一条 `position: absolute` + `top/left/right: 0`、贯通整窗宽度的标题条，条高只有一个旋钮 `--tp-head-height`（写在 `:host`，**当前 30px**），而 `.tp-body` 拿**同一个变量当 `padding-top`** 把内容让开。这两半必须一起动，而且 `.tp-head` 只能绝对定位——回到流里再叠上那份 padding，内容会被压低两倍条高。实心表面全部由 `.tp-body` 提供（`.tp-win` 根节点 `background: none`、无 `padding-top`）。玻璃填充 = 层叠自绘 + 真模糊：顶部高光渐入底部沉影（混向 transparent，深浅主题通用）+ 淡主色着色 + `color-mix(--tp-surface var(--tp-glass), transparent)` 半透明表面，`box-shadow` 一条上缘内高光给出玻璃厚度，底部 1px `--tp-line` 分隔线。`--tp-glass`（默认 72%）**必须写在 `.tp-win` 而不是 `:host`**：那条 `color-mix` 要按**当前窗口自己的** `--tp-surface` 来混，而 `applyWindowTheme()` 是把 `--tp-surface` 以内联样式写在窗口 root 上的，写在 `:host` 就永远读不到（深色主题卡/彩色主题卡的标题栏会全部退化成默认白底）。节电 `tp-nofrost` 把 `--tp-glass` 升到 100% 并关掉 backdrop（省掉的就是模糊这份 GPU 开销，正文也不再隔着半透明层显示）；`@supports not (backdrop-filter)` 同样兜底转不透明。**条子底下到底是什么**：`.tp-body` 的实心表面铺满整窗，所以标题条采的从来是窗口自己画的东西——iframe 那一档条子底下只有那层表面（`--tp-glass` 72% 在这里只改色调浓淡，看起来就是实心条），阅读/翻译那一档正文真的从玻璃底下滚过，模糊才有内容可采。老文档里那条"开窗头 ~200ms 窗口是自己的 backdrop root、采到正文而不是页面"的已知代价随之没有了（现在采正文正是预期），别为它加特判。分组是 `.tp-head-info`（左：图标 + 标题 + 徽章，`flex: 1` 吃掉剩余宽度、`min-width: 0` + `overflow: hidden` 让长标题省略号，标题字号 10px）、`.tp-head-pin`（图钉单独一组）与 `.tp-head-actions`（重载 / 新标签页 / 关闭），后两组 `flex: none` 贴右缘，两组自身**不带 padding**，好让按钮铺满整条高度。右侧两组用 `align-items: stretch`。骨架屏 / 阅读模式 / 错误页 / 翻译卡是 `position: absolute; inset: 0` 铺在 `.tp-body` 上的，而 `inset: 0` 量的是 body 的 **padding box**——所以 body 那份 `padding-top` 对这四处面板**完全不起作用**，它们照样从窗口顶端铺开，避让全靠自己的顶部 padding（骨架屏 44 = 条高 30 + 14、阅读模式 46 = + 16、错误页 40 = + 10、翻译卡 44 = + 14）。iframe 反过来：它在流里、`padding-top` 对它生效，所以内容从条子下方开始、不会被铬件遮住。**改 `--tp-head-height` 要连着核这四处 padding**，否则要么正文压进条子里，要么空出一段看不出原因的留白——条高 32 时实测 iframe 顶边 33、阅读正文顶边 47，两套顶线差 14px 就是这么来的。`.tp-head` 带 `z-index: 3`，压过同为定位元素的 `.tp-body`。**窗口拖拽的句柄仍是 `.tp-head-info`**（`cursor: grab` + `pointerdown` 绑在它上面）：它 `flex: 1` 铺满左侧空白，所以"按住标题栏空白处拖动"是天然生效的。**双击标题条 = 把预览内容拉回顶部**：`dblclick` 绑在 `.tp-head` 而不是句柄 `.tp-head-info`；实测三个分组正好铺满整条（438.4 = `tp-head-info` 342.7 + `tp-head-pin` 23.9 + `tp-head-actions` 71.8；这组数是在开窗动效还没落地时量的，所以都是 `scale(.92)` 之后的视觉盒——23.9 就是 CSS 里那 26px 乘 .92，别拿它去对样式表），所以落点永远是分组或其子元素，绑在 `head` 上的意义是标题、favicon、徽章这些子元素的双击会冒泡上来被接住；命中 `[data-act]`（图钉 / 重载 / 新标签页 / 关闭，四颗各 26px 铺满右侧两组）一律跳过，所以回顶只在标题那一侧生效。完整手势序列（pointerdown/up + click 两轮，最后 dblclick）实测不会把窗口标成 `manualPosition`、`style.left` 一动不动，所以双击不会污染"按网站记住窗口位置"那份几何。滚的是**我们自己渲染的面板**（`scrollToTop()` 找 `.tp-reader` / `.tp-trans`），**iframe 预览做不到**——那是跨源文档，宿主页面滚不动它（`contentWindow.scrollTo` 直接 SecurityError），要覆盖它只能给 content script 加 `all_frames`，代价是全网每个 iframe 都跑一份 Prelook；所以"双击没反应"是有意的边界，不是 bug，别顺手当缺陷修。`behavior` 跟 `reduceMotion` 走（`smooth` / `auto`，与 `exitMs()` 同源）。头部按钮共用一套细描边图标（`ICON_ATTRS`：24 网格、`stroke-width: 1.9`、`fill: none`），**别再加 `-webkit-` 前缀**；`.tp-btn` 是 `width: 26px; height: 100%; border-radius: 0` 的**扁平热区**（图标 13px）——最外侧那颗的圆角由窗口的 `overflow: hidden` 直接切出来。hover 是"混向 transparent"的浅灰（混向 `--tp-surface` 会看不见），**关闭按钮单独一档：hover 时 `#e81123` 底 + 白字**（原生 Windows 的销毁色），选择器用 `.tp-btn[data-act='close']:hover`，靠既有的 `data-act` 分派、不需要额外加 class。图钉固定态 `.tp-pin.tp-on` 保留淡淡的主题色填充，让状态一眼可读。

设置面板「预览窗」tab 里的卡片是 4 列网格的窗口缩略图（`.win-themes` + `.mini*`），每张卡用自己的 `--card-accent` 上色（`custom` 那张取 `windowColor`，所以拖色时会实时跟着变），`custom` 那张是铅笔图标 + 内嵌 `<input type="color">`；选中项用 `color-mix(accent 30%, transparent)` 做外圈高亮。**`auto` 故意不在这排卡片里**：`WINDOW_THEMES.filter(id !== "auto")`（`App.vue` 的 `WINDOW_THEME_CARDS`，它自己没有缩略图可画），而是落在网格下方一枚 `.auto-theme` 单选（`name="windowTheme"`，所以方向键仍能在一组里走）。它取的颜色来自 `utils/pageAccent.ts`（theme-color meta → 常见 CSS 变量 → 链接颜色众数），取不到就用该项的 `accent`（与 `windowColor` 默认的银灰同值，所以"auto 但没取到色"看起来就是默认主题）。工具提示的名字来自 `windowTheme.<id>` 词条，新增预设要同步补两处 locale。

### 外观主题（深/浅/跟随系统）

`theme` = system / light / dark，默认 **system**（跟随系统）。解析逻辑集中在 `utils/theme.ts`：`resolveTheme(mode)` + `watchTheme(getMode, onChange)`（回调先立刻跑一次，之后仅在 `getMode()` 仍返回 `system` 时响应 `prefers-color-scheme` 变化，返回 disposer）。两处落地方式不同：

- **设置面板**（侧边栏，独立文档）：解析结果写到 `document.documentElement.dataset.theme`，深色样式是 **`style.css` 末尾的 `html[data-theme='dark'] …` 覆盖块**（含 `html[data-theme='dark'] body` 的底色）。面板的样式基本都在 `style.css` 里当全局 CSS 写（`App.vue` 没有样式块）——`body` / `#app` 这类选择器在组件 scoped 块里够不到，硬写只会多出一堆 `:global()`。**唯一例外是 `SponsorSection.vue`**（自带 `<style scoped>`，把赞助卡片样式收在组件里）；代价是 scoped 会给每个选择器加一层 `[data-v-…]`、**特异性整体抬高**，所以它的深色覆盖也必须写在组件内（那份深色取值正是按这个特异性重复的），否则会被面板级的 `html[data-theme='dark'] section` 抢回去。切换设置时要 `themeDispose?.()` 再重新 `watchTheme`，`onUnmounted` 也要释放。
- **页面内 shadow UI**（预览窗、阅读模式、划词条、提示）：`content.ts` 在 `onMount` 里拿到 `shadow.host`，把解析结果写成 **host 上的 `data-tp-theme`**（两份 UI 共用一个 shadow root，所以一个属性就够）。**预览窗内部不再用 `data-tp-theme` 直接写规则，而是走上面那组令牌**（`:host` 定义 `--tp-base/--tp-ink` 默认值，深色主题只改这两个默认值）；只有划词条、提示条这类窗口之外的 UI 还用 `:host([data-tp-theme='dark'])` 覆盖。设置变更时同样要重订阅，`ctx.onInvalidated` 里释放。

**改深色样式时的坑**：为了压过浅色规则，覆盖选择器要带 `html[data-theme='dark']` / `:host([data-tp-theme='dark'])`，于是特异性变成 (0,1,1) 这一档，会和 `.seg-btns label.on` / `.theme-cards label.on` 这类 (0,2,1) 的选中态**打平**——平手时靠源码顺序，深色块在后面，深色下选中项就会丢掉主题色填充。所以必须同时为 `.on` 写一条更高特异性的深色规则（现有代码里那三组就是这么来的），新增可选中控件时别忘了照做。

### 节电模式与减少动画

扩展改不了浏览器自己的节电/动画开关，这两项是**约束 Prelook 自身开销**的档位，解析集中在 `utils/power.ts`：`resolvePowerState(mode, onBattery, reduceMotion)` + `watchPower(getSettings, onChange)`（照 `watchTheme` 的模样写，回调先立刻跑一次，返回 disposer）。降级后的 `PowerState { level, reduceMotion }` 只有三档 `off / on / max`，**它只会拿走功能，绝不会打开设置里关着的东西**。

- `powerSaver` = off / on / max / auto（`POWER_MODES`，设置面板下拉顺序即 `auto` 在前）。`auto` 只影响 `level` 的计算：`navigator.getBattery()` 报到 `charging === false` 时当作 `on`，其余（API 缺失、promise reject、市电）一律当作不降级——**报错猜成"在省电"会把功能悄悄关掉，猜成"市电"只是少省一点**。
- 三档剥夺的东西：`on` = 关链接预热（`warmupSettings()` 直接返回 `speculationMode: "off"` 的副本，`speculation.ts` 因此完全不用改）+ 关背景模糊（`blurStrength()` 返回 0，设置值不动）+ 关预览窗标题栏玻璃（`frostDisabled()` → 窗口 root 加 `tp-nofrost`，标题条的 `--tp-glass` 升到 100%、填充转不透明并关掉 `backdrop-filter`——模糊是 GPU 开销，且文字不该在省电时坐在生内容上）；`max` = 在 `on` 基础上再关链接高亮（`highlightWanted()`）、跳过 `prelook:fetch` 预检直接 `renderIframe()`（没有标题/图标/阅读模式兜底，禁嵌站点只能失败），并且**隐含 `reduceMotion`**（见下）。两个效果类开关都同时覆盖「设置变更」与「电源变化」两条路径：`applyVisualVars()` 的窗口循环里就带着 `tp-nofrost`，`open()` 建窗时也要写一次，漏掉任一处都会出现"新开的窗口还带着毛玻璃"。
- `reduceMotion` 是三条来源的合流：`settings.reduceMotion`、系统 `prefers-reduced-motion: reduce`、以及 `level === "max"`（在 `resolvePowerState` 里合，调用方只读这个布尔值，不关心是谁要求的）。落地方式是 `content.ts` 把它写进 **host 的 `data-tp-motion`**（与 `data-tp-theme` 同一套机制），`preview.ts` 的 CSS 里 `:host([data-tp-motion])` 一刀切断 `.tp-overlay` / `.tp-win` / `.tp-hl` / `.tp-pin svg` / `.tp-resize` 的过渡与骨架屏动画；**JS 内联写的过渡 CSS 管不到**，所以倒计时进度条要在 `startProgress()` 里自己提前返回。窗口退出的 `exitMs()` 也随之归零（`FADE_SLACK_MS` 保留那一帧余量），`place()` 之类的布局数学不受影响。
- 电池/系统偏好变化时只走 `preview.applyPower()`（重算模糊与高亮），**不重新 `place()` 窗口**——插拔电源不该把用户拖过位置的窗口挪走。同理设置变更时 `content.ts` 要 `powerDispose?.()` 后重新 `watchPower`（和 `themeDispose` 并列），`ctx.onInvalidated` 里释放。

### 悬停高亮链接

`highlightLinks` 开启时，指针下的链接会被 shadow root 里的一层 `.tp-hl` 框住（`open()` 之外唯一会跟着指针动的元素，和倒计时条同一类）。要点：

- 页面上**不改任何 DOM**，高亮是覆盖层：`position: fixed` + 主题色描边 + 12% 透明底色。描边的**线型/粗细/圆角都可自定义**（`highlightStyle` = solid / dashed、`highlightWidth` 1–6px、`highlightRadius` 0–16px，`clampSettings` 夹取）：CSS `.tp-hl` 读 `--tp-hlw` / `--tp-hlr` 两个令牌（默认值与 DEFAULT_SETTINGS 一致），线型走 `.tp-dashed` 类。**外扩量必须跟着边框宽度走**——`place()` 是"锚点 rect 四边各外扩 `borderWidth`"（全局 `box-sizing: border-box`，描边画在框内，所以环的内沿正好压在链接上；外扩 2 时 `insetDelta=0`），而 `borderWidth` 由 `applyVisual` 从同一个 `highlightWidth` 镜像过来，改设置后 `applySettings` 会先 `applyVisual` 再让下一次 `place()` 用新值。`--tp-accent` 得显式设在元素上——shadow root 自身没有这个变量，不定就永远落到默认蓝。
- `z-index: 2147483640`，append 在遮罩之后、窗口之前：所以它盖在模糊遮罩之上、但永远在预览窗之下；`pointer-events: none` 是必须的，它就压在链接上，能命中就会把悬停本身掐掉。
- 判定沿用 `anchorHref()`，因此禁用站点、非 http 链接、扩展关闭时都不会高亮；`applySettings` 里关掉开关会立即隐藏。
- `scroll`（capture + passive）只重算高亮位置，**不重新 `place()` 窗口**——窗口是 fixed 的，跟着页面滚走会打断正在阅读的预览；`resize` 才同时重排两者。链接若已从 DOM 移除，`placeHighlight()` 会自行收起并清引用。
- 注意无头 + `--virtual-time-budget` 下浏览器不派发 scroll 事件（也不推进 CSS 过渡），验证要跑实时模式，否则会误判成"滚动不跟随"。

### 预览窗固定

窗口头部四个按钮：`pin` / `reload`（重新 fetch + 重渲染，iframe 会换成一个新元素，阅读模式会重新提取）/ `open`（新标签页打开，同时关掉本窗口——交给真实标签页后预览就完成使命了；它是显式点击，不受 `pinned` 的"别自动关"豁免，和 `close` 一致）/ `close`，靠 `data-act` 分派（`preview.ts` 的 `head` click 监听）。点 pin 把 `win.pinned` 置位，效果有两条：`releaseExcept()` 直接跳过（指针移开不再进 400ms 宽限），`open()` 的驱逐循环也只挑`!pinned`的窗口关闭。**所有存活窗口都固定住时，新预览不打开，而是在光标处弹一条提示**（`notice('preview.pinLimit', …)`）：文案走 i18n（zh 的 messages.json 用位置占位 `$1`、由 `translate` 的第二参按插入顺序代入；en 不带数字，避免 `max=1` 时出现 "All 1 slots"），2.6s 自动消失，重复触发会重置计时并跟随新的光标位置。提示和倒计时条一样是 `pointer-events: none`——否则它会挡住 hover、把触发自己取消掉（见下面陷阱）。宁可这次不弹，也不悄悄删掉用户明确要留的窗口，这一点在改动驱逐逻辑时要保持。

`autoPin` 打开时，**新建**的窗口直接以 `pinned` 出生（`preview.ts` 的 open 里 `pinned: settings().autoPin`），`syncHeaderButtons()` 随后把图钉按钮的 `.on`/`aria-pressed`/tooltip 一起同步，所以界面不会与状态脱节。刻意**不**在设置变更时给已打开的窗口补固定：那样容易瞬间顶到窗口上限，之后新预览全被拦住。

和窗口上限的联动要注意：固定窗口不参与驱逐，所以 autoPin + 达到 `maxWindows` 之后新预览不会再打开，此时会弹 `preview.pinLimit` 提示告诉用户去取消固定或关窗——这正是那条提示存在的意义，别把这条路径改成静默返回。

固定状态只存在于 DOM 生命周期内（页面跳转/刷新即消失），不落存储。按钮外观由 `.tp-pin` / `.tp-on` 控制：固定时图标转正并染成主题色，未固定时旋转 45°，所以两个状态除了颜色还有形状差异。`syncHeaderButtons()` 统一维护三个按钮的 `title` 与 `aria-pressed`，`refreshTitlesAndBadges()` 就是遍历它（词条 `preview.pin` / `preview.unpin`，经 `browser.i18n` 取，语言跟随浏览器、会话内不变）。

### 设置面板（侧边栏）

设置界面是**侧边栏**（`entrypoints/sidepanel/`），没有 popup 入口了。WXT 按目标浏览器把它写成两套 manifest：Chrome MV3 → `side_panel.default_path` 并**自动追加 `sidePanel` 权限**，Firefox → `sidebar_action.default_panel`。两个刻意的后果：

- **`manifest.action` 必须手写**（`wxt.config.ts` 里的 `action: {}`）：工具栏 `action` 只由 popup 入口生成，删掉 popup 后不写这一句，扩展在工具栏上就没有图标可点。MV2 目标由 WXT 的 `convertActionToMv2()` 转成 `browser_action`。
- **图标点击由 `background.ts` 的 `bindIconToPanel()` 接**：Chrome/Edge 走 `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`——这是"声明式"的，一旦设置，`action.onClicked` 就再也不会触发，所以别指望用它做别的事；Firefox 完全没有 `sidePanel` API，只能在自己的点击监听里调 `sidebarAction.open()`，而且 MV2 的事件挂在 `browserAction` 而不是 `action` 上。`sidebarAction` 不在共享类型里，所以整段是"拓宽类型 + 运行时探测"，新浏览器接入时保持这个写法，别假设某个命名空间一定存在。

`App.vue` 把设置分成 4 个 tab（`TABS` = preview / search / history / settings），标签是 `.tabs` 里的文字 tab（选中项强调色文字 + 2px 底部下划线；`.tabs` 纵向裁剪溢出，别用负 margin 把下划线推出盒外）（`role="tablist"` + 每个 `role="tab"`，面板 `v-if` 切换 + `role="tabpanel"`），标签文案来自 `panel.tab.<id>`。分组是**按功能**而不是原 popup 的顺序：**「预览窗」（id 是 `preview`）**装总开关、触发方式、关闭触发器、位置/尺寸（含 `sizeUnit`）/背景模糊/悬停高亮/弹窗主题/多窗口/`skipImages`/`rememberWindowGeom`——都是"预览窗怎么出现、长什么样"这一类；**「划词」（id 是 `search`）**只有划词设置那一个 section（开关、Web 搜索引擎单选、AI 引擎、翻译引擎、最小字数）；**「历史」（id 是 `history`）**是预览历史（`historyEnabled` 开关 + 列表 + 单条删除 + 清空）；**「设置」（id 是 `settings`）**是链接预热、链接保护、节电与动画、禁用站点、外观主题（深浅 + `themeColor`）与末尾的「恢复默认设置」。原来的「性能」和「保护」两个 tab 已合并进「设置」，别再用那两个旧名字写文档或加词条。新增设置项时放进语义最接近的那个 tab。

赞助卡片是**每个 tab 共用的底部块**：抽成了 `components/SponsorSection.vue`（不收任何 prop，自己经 `browser.i18n` 查词条），只写一次，落在 `main` 里所有面板之后、不在任何 `role="tabpanel"` 内部——面板是 `v-if` 互斥的，所以这一个实例就总在当前 tab 的下方，不需要每个 tab 复制一份。它也因此不属于任何 tab 的内容（读屏把它当页脚内容，这是对的）——原来那个「关于」tab 就是为它存在的，已删除。组件自带 `<style scoped>`（`.sponsor-section` / `.sponsor` 与它们的深色覆盖都在组件里），但卡片外观（背景 / 内边距 / 圆角 / 边框）仍来自面板全局的 `section` 规则，所以它只有在设置面板里才完整。它是面板最末一块（「恢复默认设置」按钮在「设置」tab 里，见下），沉底靠三件套：`#app { display:flex; flex-direction:column; min-height:100vh }` + `main { flex:1 }` + `.sponsor-section { margin-top:auto }`——内容比面板矮时它贴住底边不留空白，内容更高时它就是滚动区的最后一块（内层 `.flex-1` 让面板区自己吃掉剩余高度，所以不会把内容拉长）。`*{box-sizing:border-box}` 保证 `#app` 的 `padding-bottom` 算在 100vh 内，否则面板会凭空多出一条滚动条。**「恢复默认设置」是「设置」tab 最后一个 section 里的一个盒状按钮**（`.btn-reset`，唯一的红色破坏性控件；它原先在底部的 `footer` 里——`footer` 规则已随之下线，那段共用的尾巴上只剩赞助卡）。

样式仍是 `style.css` 里的全局 CSS（`App.vue` 没有样式块；赞助卡片自带 scoped 块，见上），和原 popup 一致。为新布局做的改动：`body` 去掉固定宽度/`max-height`（面板宽度由浏览器决定，用户可拖）；**`.topbar` 里只剩 tab 条**——原来那行 `.hd`（logo + `Prelook` 标题 + EN/中 快捷切换按钮）整行删掉了，`.hd` / `.hd img` / `.hd h1` / `.spacer` / `.link` 五条规则随之失去引用并被删（`.link` 是它的文字按钮样式，现在面板里唯一的按钮样式是盒状的 `.btn-reset`）。**面板里没有语言开关**——i18n 已迁到浏览器原生 `browser.i18n`，语言跟随浏览器 UI 语言、运行时不可切换。sticky 挂在 `.topbar` 上（tab 条是切换分区的唯一入口，必须一直可见），`.tabs` 横向滚动、`.tabs .chip` 加 `font-family: inherit`（否则按钮回落到 UA 默认字体，和页面其余部分不一致），且因为它是唯一一行，内边距是四周对称的 `10px 12px`。界面词条前缀是 **`panel.*`**（`panel.enabled` / `panel.section.*` / `panel.tab.*`），`menu.popup` 那条是另一回事（右键菜单里"在预览窗打开"），别顺手改名。

### 设置与存储

- `settingsItem` = `local:prelook_settings`，定义在 `utils/storage.ts`。
- **按网站记住窗口位置**（`rememberWindowGeom`，默认 true，「预览窗」tab"其他设置"里的开关）：几何存在独立键 `local:prelook_win_geom`（`windowGeomItem`，hostname → `{x,y,w,h}` 视口像素，上限 `GEOM_MAX_HOSTS` = 60，`putHostGeom` 靠"delete + 重新插入"维持 LRU 序）。**键是宿主页面 `location.hostname`，不是被预览的 URL**（后者每个链接都不同，记了没用）。应用点在 `open()` 的三条路径（新建 / 重新聚焦已有窗口 / `applySettings` 重排）——`applyRememberedGeom()` 写 `manualPosition + manualSize + 内联 left/top/width/height` 后 `place()` 自然跳过，所以它**压过**位置/尺寸设置；保存点在头部拖动 pointerup（仅当真的移动过）与角落缩放手势结束（`saveHostGeom`，写前重新 getValue 合并避免多标签页互相覆盖）。三条刻意约束：**侧边栏停靠窗口既不应用也不保存**（停靠几何由 `place()` 全权决定）；应用时按**当前视口**夹取（在大屏上记的盒子不能在小窗口里出屏）；关掉开关只是不再应用/保存，已存的映射原样保留。
- **预览历史开关**（`historyEnabled`，默认 true，「历史」tab 顶部的开关）：门控在 `preview.ts` 的两个写入点——`open()` 里创建窗口时 `recordHistory`（读的是开窗那刻的 `s.historyEnabled`），以及 `loadFlow` 里补标题/图标的 `updateHistoryMeta`（读 `settings().historyEnabled`，关掉就没有条目可补）。关掉只是**不再记录**，已有的 `local:prelook_history` 列表原样保留、历史 tab 照常能看能删能清空；`App.vue` 空列表文案按开关切换 `history.empty`（没记录）/ `history.disabled`（已关闭）。
- 新增设置项要同时改三处：`PrelookSettings` + `DEFAULT_SETTINGS` + `clampSettings`，并在 sidepanel `App.vue` 的对应 tab 里加控件、两个 `_locales/*/messages.json` 补词条（键名用下划线形式，见「新增界面文案」）。
- 两个颜色设置各有归属，别混：`themeColor` = 插件 UI 的强调色（「设置」tab 的「主题色」），`windowColor` = 弹窗主题选 `custom` 时的窗口强调色（那张铅笔卡里的取色器）。两者都用 `<input type="color">` 编辑（值恒为 `#rrggbb`），`clampSettings` 里只做 `|| DEFAULT_SETTINGS.x` 兜底、不做格式校验。**没有任何代码把其中一个写成另一个**——这是刻意的，改「弹窗主题」不该把整个插件换色。
- `clampSettings` 的边界：`hoverDelayMs` 100–2000（默认 500）、`longPressMs` 200–2000（600）、`width` / `height` 百分比 20–100（默认 40 / 55）、`widthPx` / `heightPx` 像素 200–2000（默认 640 / 480，随 `sizeUnit` 生效）、`blurStrength` 0–100（百分比，默认 0 关闭）、`minSelectionChars` 1–20、`maxWindows` 1–6（默认 3）、`highlightWidth` 1–6（默认 2）、`highlightRadius` 0–16（默认 4）。**所有读取设置的地方都要过 `clampSettings`**，content 与 sidepanel 都这么做。
- **单位约定**：延迟类设置**存储永远是毫秒**（`hoverDelayMs` / `longPressMs`，定时器直接用），只有设置面板的滑块与读数换成秒（`App.vue` 里两个 writable computed 做 `×1000 / ÷1000` 换算，`toFixed(2)` 去浮点噪声），这样不需要迁移老数据。预览窗宽高支持两种单位（`sizeUnit` = percent / px，默认 percent），**两套值各自独立记忆**：百分比存 `width`/`height`（20–100 视口百分比），像素存 `widthPx`/`heightPx`（`WINDOW_PX_MIN/MAX` = 200–2000），切单位不换算、不覆盖对方；`clampWindowPercent()` 会把历史遗留的像素值（>100 只可能是 px）按固定参考视口 `LEGACY_VP_W/H`（1440×900）折算一次——**百分比↔px 换算一律用这对参考视口，不能用 `innerWidth`**，因为设置面板的视口不是被浏览的页面（`clampSettings` 里对 `sizeUnit==="px"` 且缺少 px 字段的存量数据做一次性 seed 迁移）。
- 宽高百分比最终由 `--tp-w` / `--tp-h` 两个 CSS 变量生效（`place()` 不再写内联 px 尺寸），而 `place()` 里的定位数学需要像素，所以走 `windowSize()` 按当前视口把百分比换算成 px；`preview.ts` 注册了 `resize` 监听重新 `place()` 所有非手动拖拽过的窗口，否则视口一变、窗口长大了却还停在旧坐标上可能出屏。
- 枚举取值：`triggerMode` = hover / click / altHover / altClick / hoverSpace / longPress / drag（`clampSettings` 对存量坏值回落到 `DEFAULT_SETTINGS.triggerMode`）；`position` = top-left / bottom-right / bottom-left / top-right / center-top / center / center-bottom / sidebar（link / mouse 已移除，`clampSettings` 对存量旧值回落到 `DEFAULT_SETTINGS.position`）；`sidebarSide` = left / right；`speculationMode` = off / prefetch / prerender；`powerSaver` = auto / on / max / off。（`language` 设置项已随原生 i18n 迁移移除，`clampSettings` 会把它从存量数据里剥掉。）`powerSaver` 的夹取不能照抄"坏值回落到最省事的那档"：它每个取值都要拿去比较，回落到 `off` 会让省电功能静默失效，所以坏值一律回落到 `DEFAULT_SETTINGS.powerSaver`。
- 搜索引擎表 `SEARCH_ENGINES`（google/bing/duckduckgo）与 `AI_ENGINES`（deepseek/doubao/kimi/perplexity）也在这里。`SEARCH_ENGINES` 是**单选**（`searchEngine` 一个 id，设置面板用与触发方式同款的联合按钮组；划词工具条只渲染一个「Web 搜索」按钮，tooltip 是引擎名；`clampSettings` 对无效 id 与旧版 `searchEngines` 多选数组回落到数组里第一个有效项，再退默认 google）。URL 模板用 `%s` 占位；**DeepSeek/Kimi/豆包三条故意不带 `%s`**——它们的前端不读任何问题类 query 参数，所以划词工具条对这三家改为「先把选中文字写进剪贴板，再打开各自主页」（DeepSeek `https://chat.deepseek.com/`、Kimi `https://kimi.moonshot.cn/`、豆包 `https://www.doubao.com/chat/`），用户在新对话里 Ctrl+V。判断逻辑就在 `selection.ts` 的 `open()`：模板含 `%s` 就替换，否则走 `copyText()`（`navigator.clipboard` 在 http 页缺失时退回 `execCommand('copy')`）。换引擎时别给这三家把 `%s` 补上，补了就等于把文字丢了。
- **划词翻译**（`TRANSLATE_ENGINES` = google / bing）的落点由引擎表决定，它不是偏好而是站点事实。三种形态：
  - **`inline: true`（google）**：`translate.google.com` 回 `X-Frame-Options: SAMEORIGIN`，它的**页面**永远进不了 iframe，但它的公开 JSON 接口 `translate.googleapis.com/translate_a/single?client=gtx` 是 CORS 全开的（实测 `Access-Control-Allow-Origin: *`，**因此不需要任何新权限**），于是预览窗里渲染我们自己的**译文卡片**：请求由 background 发（`prelook:translate` → `utils/translate.ts`，10s 超时、文本截断 5000 字符、`credentials:'omit'`——从 content script 直发会受页面 CSP 限制并泄漏宿主 origin），响应 `r[0]` 是分段的 `[译文, 原文, …]`、`r[2]` 是识别出的源语言。卡片走 `.tp-trans`（原文 / 译文 / meta 行"识别为：英语"+ 复用 `preview.openTab` 的逃生按钮）。`AnchorInfo.inlineTranslate = {text, to}` 建窗时存进 `WindowInstance`，`loadFlow` 在**最前面短路**整条 fetch/embed 判定树，所以头部**重载按钮会重发同一个翻译请求**（实测）而不是退化成 iframe；请求失败 → `showError(win, "translate.failed")`。这条路径**不受节电 `max` 影响**（那是砍预检抓取用的，内联翻译没有别的可显示内容）。
  - **`openIn: "preview"`（bing）**：直接把翻译站页面嵌进 iframe（该功能最初的形态）。窗口带 `translate` 标记：`loadFlow` 判定 `!canEmbed`（以及 iframe 8s 超时的 `fallbackToReader()`）时**必须跳过阅读模式**——翻译站是应用不是文章，阅读模式只会把应用外壳当正文抓出来——改为 `showError(win, "preview.embedBlocked")`；这是给 Bing 万一改主意的兜底。
  - **`openIn: "tab"`**：交给真实标签页（受理「在后台标签页打开」）。google 表里仍保留这个值和站点 URL，它就是卡片上那颗「在新标签页打开」按钮要去的地方。
    选中文字由 `%s` 塞进 URL，目标语言由 `%t` 取（`browser.i18n.getUILanguage()` 以 zh 开头 → 中文，否则英文；源语言一律 auto），两家对同一目标语言的写法不同（`tl=zh-CN` / `to=zh-Hans`），所以码表挂在各自的 `lang` 上——**每条引擎都必须给 `lang`**，URL 模板的 `%t` 和内联接口的 `tl=` 都取自它（`selection.ts` 的 `targetLang()` 是两者共用的入口）。引擎选项是设置面板「划词」tab 里的单选（`translateEngine`），引擎名走词条 `translate.<id>`；默认引擎仍是 **bing**，有道那条已删，存量数据里的 `translateEngine: "youdao"` 由 `clampSettings` 回落到默认。
- **「文字已复制」提示**：AI 引擎里 Kimi/豆包/DeepSeek 的模板没有 `%s`，`selection.ts` 的 `open()` 会先把选中文字写进剪贴板、再打开各自主页，**并在工具栏原位弹一条 `selection.aiCopied`**（「已复制选中文字，在新标签页粘贴即可」）——新标签页是个空白输入框，没有任何迹象表明文字已经就位，这条提示补的就是这个断层；模板带 `%s` 的引擎（Perplexity、Web 搜索）不复制也不提示。落地方式是 `PreviewSystem.notice(key, x, y, params?)`（原 `showNotice`，DOM 元素改名 `noticeEl`，和「预览窗全被固定」那条提示共用同一个 toast，`pointer-events: none`、2.6s 自动消失），由 `SelectionDeps.notify` 暴露给工具条；坐标必须在 `hide()` **之前**测量——工具条一隐藏就量到 0×0。
- **划词条的指向小箭头**：`.tp-sel::after` 是一个 10px 的旋转方块（`.tp-arrow-down` 挂下边框+右边框、`.tp-arrow-up` 挂上边框+左边框，另两边宽 0——否则会在条子内部画出一道线），**填充与描边都走 `inherit`**，所以深色主题不需要额外规则（`background`/`border-color` 跟着 `.tp-sel` 走）。横向位置由 `show()` 写在 `--tp-arrow-x` 上，值为**相对条子左边缘**的偏移；夹取下限是 `barHeight / 2 + 8`（半个条高就是胶囊圆角的半径，箭头最左点又外扩约 7px，贴着圆角会把一小片没有描边的白斜角戳到轮廓外面），所以条子特别窄时退化成居中（`Math.min(…, bw / 2)`）。竖向上条子本来就在选区上方/下方留 8px，箭头探出约 6px，剩 1–2px 缝。`y < 8` 翻到下方时同时翻转箭头方向，两个类是互斥 toggle，别只写一个。
- `skipImages`（默认 false，「预览窗」tab 开关）在 content 的 `anchorHref()` 里过滤图片链接（只看 href 路径是否以图片扩展名结尾，见 `isImageLink()`），悬停/长按/拖拽一律不触发；右键菜单「在预览窗打开」走 `anchorInfoFor()`，不受此开关影响。**判据里刻意不含「链接内含 `<img>`」**：卡片式信息流（如小黑盒 `xiaoheihe.cn/app/bbs/home`）把整条帖子连同缩略图包在一个 `<a>` 里，按「含图即跳过」会让整条信息流全部失效。

### 多窗口

`s.maxWindows` 是普通设置项，上界 `MAX_WINDOWS_LIMIT = 6`，由 `clampSettings` 夹取（content 与 sidepanel 都过一遍）。曾经有 Pro 分级（非 Pro 强制 1 窗），随 Pro 一起移除：现在没有授权校验，`maxWindows()` 直接返回设置值。

## 关键约定与陷阱

- **`tp-` 是曾用名 TabPeek 的缩写，刻意保留**：预览窗的 CSS 变量（`--tp-accent/--tp-w/--tp-h/--tp-blur/--tp-base/--tp-ink…`）、类名（`.tp-win/.tp-in/.tp-out/.tp-overlay/.tp-hl…`）和 host 属性（`data-tp-theme/--tp-motion`）全都还叫 `tp-*`，一共 200 多处。2026-09-16 产品改名成 Prelook 时**没有跟着换成 `pl-`**：这些名字全在 shadow DOM 内部、用户看不见，而漏改一个选择器就会静默弄丢毛玻璃 / 悬停高亮 / 出入动效（没有类型检查会报错），收益为零、风险实打实。所以看到 `tp-` 别以为是另一个产品，也别"顺手改对"。真正跟着改名走的是这些**外部可见的标识符**：包名 `@extensions/prelook`、存储键 `local:prelook_settings`、消息前缀 `prelook:`、shadow host 标签 `prelook-ui`（`composedPath()` 里比对的是大写形式 `PRELOOK-UI`）、预检响应头 `x-prelook-origin`、右键菜单 id `prelook-*`、landing 的两个 localStorage 键。**扩展已经上架（线上 1.8.0，见「收费与上架现状」），所以现在动任何存储键都必须写迁移**——过去这里写的是"还没上架、改名不需要迁移"，那条时间窗已经用完了，别再照老文档以为改名是免费的。
- **storage / browser 导入**：两者都是 WXT 自动导入的全局，直接裸用（`storage.defineItem`、`browser.runtime`）。`wxt/storage` 子路径不存在；确需显式导入时用 `wxt/utils/storage`。**manifest 必须有 `storage` 权限**，否则 `getValue/setValue` 静默 reject，表现为"设置永远不保存"（sidepanel 的 `load()` catch 里专门打了这条日志）。
- **设置面板里 watch(ref(对象)) 默认不深度监听**：v-model 改嵌套属性不会触发保存，必须 `{ deep: true }`，并在 `visibilitychange→hidden` 时强制 flush（防抖未到期就被收起会丢最后一次变更）。
- **Shadow UI**：`createShadowRootUi(ctx, { name:'prelook-ui', position:'inline', append:'last', css })`；窗口/工具条全在单个 shadow root 内定位（position:fixed），CSS 变量 `--tp-accent/--tp-w/--tp-h/--tp-blur` 驱动外观。content 里按标签名 `prelook-ui` 判断"指针是否悬停在我们自己的 UI 上"。z-index 从 2147483640 起分层（overlay < 窗口 < 划词条 < 触发倒计时条/上限提示）；倒计时条是 `pointer-events:none`，否则悬停倒计时期间它会吃掉 pointerover 把悬停自己的定时器取消掉。
- **链接预热只用 `document.speculationRules.addRules()`**，不要改成注入 `<script type="speculationrules">`——内联标签会受页面 CSP 限制；能力缺失（Firefox）时整条路径必须保持 no-op。规则分两层：一次性的 `source:'heuristics'` 规则（prerender 用 `conservative`，prefetch 用 `moderate`）+ 每个 URL 一条 `eagerness:'immediate'`（靠 `intentDone` 去重，避免重复注入）。
- **iframe 能否内嵌必须由 background 预检响应头**（跨域 iframe 对 Chrome 错误页同样触发 load，无法事后检测）；`X-Frame-Options: SAMEORIGIN` 的重定向前后 origin 用 `res.url` 判断。加载超时（8s）才走阅读模式兜底。
- **阅读模式的内容是 `innerHTML` 直接注入 shadow DOM 的**，所以 `extract.ts` 的 `sanitize()` 是安全边界而非美化步骤：只保留 `a[href]` / `img[src,alt]` 白名单属性，剥掉 `javascript:` 链接，并把相对 URL 用 `finalUrl` 补全。改提取逻辑时不要削弱这一步。
- **长按模式有一次性的点击抑制**：`suppressClickUrl` 让"长按开预览"后紧跟着的那次 click 被 `preventDefault + stopPropagation` 吃掉，只在释放后首次点击生效。拖动超过 12px 视为滚动意图，会取消长按。
- **设置面板的 radio 组必须带 `name`**（triggerMode / position / sidebarSide / speculationMode）：`name` 才让浏览器把它们当原生单选组，方向键切换、读屏播报"N 选 1"都靠它。缺 `name` 时 Vue 仍会在 re-render 时回写 `checked`，鼠标点击看不出问题，但原生分组语义没了。触发方式那一组是 `.seg-btns` 分段按钮（`input` 视觉隐藏 + `label` 上色，选中态用 `settings.x === 值` 绑 `.on`；**七个选项，用的是 3 列网格**），其余仍是原生圆点。
- **新增界面文案**：词条在 `public/_locales/zh_CN/messages.json` 与 `en/messages.json`，经 `browser.i18n` 读取（`utils/i18n.ts` 只是薄封装：查表、`|| key` 兜底、把 `{值}` 参数代入 `$1` 位置占位）。调用点仍写扁平点号 key（`t('preview.close')`），**消息名只允许 `A-Za-z0-9_@`，所以 `_locales` 文件里的键是点号换下划线后的形式**（`preview_close`），封装在运行时做同一替换——改任何一边都要同步。zh_CN 与 en 必须同时补齐（`pnpm verify:locales`，CI 每次都跑：查键名字符集合、两边对齐、message 非空）。语言**不能运行时切换**：`browser.i18n` 跟随浏览器 UI 语言，匹配不到就回落 `default_locale`（**当前是 `en`**，见 `wxt.config.ts` 的 `default_locale: "en"`，所以**en 那份词条是唯一不能缺的**，zh_CN 缺键只会让中文浏览器用户看到英文）。这正是旧 `language` 设置项被移除的原因，别再往设置里加语言开关。**locale 目录名与 `default_locale` 必须是下划线形式（`zh_CN`）**：Chrome 会直接拒绝 `zh-CN`（报错还很迷惑——"使用了本地化但未指定 default_locale"），web-ext 对 `zh_CN` 也放行，两端唯一安全的写法就是它。消息文本里的字面 `$` 必须写成 `$$`。`wxt prepare` 会把消息名生成进 `getMessage` 的字面量联合类型，动态 key 只能 `as` 断言。manifest 的 `description` 用 `__MSG_extDescription__`（name 是品牌词、双语相同，保持字面量）。sidepanel 的 `<html lang>` 与 `<title>` 在 `main.ts` 里按 `browser.i18n.getUILanguage()` 重打。测试台（`test/repro-hover.html`、`test/demo/mock.js`）的 chrome mock 必须提供 `i18n.getUILanguage` 与同步的 `getMessage`（两者都从 `.output/chrome-mv3/_locales/zh_CN/messages.json` 同步 XHR 读真实词条）。
- **content script 匹配** `<all_urls>` 且仅 main frame（WXT 默认不写 `all_frames`）；`entrypoints/content.ts` 中 `runAt`（camelCase），WXT 0.21 不认 `run_at`。 manifest 权限是 `tabs` / `storage` / `contextMenus`（右键菜单），**加权限后必须重载扩展**。**改 manifest 权限后必须重载扩展并刷新目标网页**，旧页面里的 content script 已失效。
- Manifest 改动（权限/名称）只改各 app 的 `wxt.config.ts`；`.output/`、`.wxt/` 是生成物，不要编辑。
- **`pnpm lint` 剩下的 4 条 warning 是有意的，别按提示"顺手修"**：`unicorn(no-useless-spread)` 在三处（`utils/extract.ts:59` 的 `[...el.attributes]`、`utils/preview/index.ts:428` 与 `:1032` 的 `[...windows]`）都是**必需的**——循环体会把节点从被迭代的集合里摘掉（sanitize 剥属性、`closeWindow()` 从 `windows` 里 splice），直接迭代活集合会跳过元素。第四条 `eslint(no-control-regex)` 是 `utils/safety.ts:109` 的 `/[^\u0000-\u007f]/`，它存在的意义就是"域名里有非 ASCII 字符"，改成 `\P{ASCII}` 要带 `u` 标志、可读性更差。CI 只挡 error、不 `--deny-warnings`，正是为了给这类判断留余地；真要清就得逐条确认后写 disable 注释，别连着代码语义一起改。（landing 的 `js/main.js` / `js/privacy.js` 里那四处没用到的 `catch (e)` 已改成可选 catch 绑定，那批是真冗余。）
- `apps/<name>-landing/` 与插件零依赖共享（词典在 landing `js/main.js` 内独立维护）。**图标不再是同一张文件的拷贝**：landing 用的是自己的 `assets/logo.webp`（导航 36px、页脚 48px、`og:image` / `twitter:image` 也指它）配 `favicon.svg` / `favicon.ico` / `apple-touch-icon.png`，插件那边是 `apps/prelook/assets/logo.webp` 交给 auto-icons 生成各尺寸。两边是**同一次换标的两份导出文件**，所以**改图标要改两处，而且 landing 那三张 favicon 得手工重导**（仓库里没有导出脚本）。历史上这里是"把插件的 `icon.png` 原样 cp 过来一份"，那套约定已随换标作废——**`icon.png` 在两个目录里都不存在了**，别再按老名字找、也别写 `cp .../icon.png` 这类命令；landing 是独立部署的静态站，不能写 `../prelook/assets/...` 这种跨目录路径。
- **hero 那段录屏已经不在 landing 上了**：`assets/demo.mp4` 与 `demo-poster.webp` 已删，页面里没有任何 `<video>`，hero 只有文字 + 安装卡片（右侧靠 `.hero-bg` 的网格底纹）。录制台 `apps/prelook/test/demo/` 与原始素材约定（`recordings/` 已 gitignore）**先留着**，将来重录时那两个坑仍然成立——**指针"进入"链接的那一点**决定窗口落位（`pointerover` 记的坐标，之后就固定了：要从链接正上方竖直落进去，横着滑会在链接边缘就记下坐标、窗口整体偏掉 200–300px），以及**录制期间 `requestAnimationFrame` 必须真的在跑**（`open()` 里那两帧 rAF 没跑就加不上 `.tp-in`，窗口停在 `opacity: 0`，录出来空无一物）。完整步骤和 ffmpeg 裁剪框的算法见 `apps/prelook/test/demo/README.md`。

## 回归自检

项目**没有单元测试框架**（没有 test 脚本，业务逻辑靠手动复现页回归），但有三条机械检查，全部在 CI 上跑，本地也能单跑：

```bash
pnpm install --frozen-lockfile
pnpm verify:locales                 # 每个 app 的 _locales：键名合法 + zh_CN/en 对齐 + message 非空
pnpm compile && pnpm lint           # 类型检查 + oxlint（4 条 warning 不会让 CI 红）
pnpm build && pnpm build:firefox    # 全部 app × 两个目标
pnpm verify:manifest                # 每个 app 按自己的形态断言 manifest
pnpm verify:landing                 # 每个 landing：离线包链接版本 == package.json，且本地 assets zip 存在
```

上面这一串就是 `.github/workflows/ci.yml` 的内容（push 到 main 与 PR 时跑；检查脚本本体在仓库根的 `scripts/` 下，所以本地和 CI 看到的是同一份逻辑）。**这三个脚本都是"遍历"而不是"盯着 prelook"**（2026-10-14 参数化收口的）：`scripts/apps.mjs` 从 `apps/*/wxt.config.ts` 发现产品、从 `apps/*-landing` 发现落地页，所以第三款扩展建目录的那天就自动进门禁，加产品的人不需要改脚本；代价是**登记表必须存在**——`check-manifest.mjs` 的 `SPECS` 里没有这个 app 就直接红（宁可红也不静默跳过），反过来 `verify:locales` 对没有 `public/_locales` 的 app 打一行 skipped。**改动这些检查时注意每一步都要能在干净克隆上跑通**，别依赖本地生成物（`verify:manifest` 依赖前面那两步构建，产物目录不存在是报错不是跳过，CI 里顺序是有意的）。manifest 冒烟那一步的理由是"构建成功"并不等于"插件能用"，而"能用"的形状**按产品不同**：prelook/chrome 断言 `action` / `side_panel.default_path` / `background.service_worker` / `storage`+`sidePanel` 权限，prelook/firefox 断言 `browser_action` / `sidebar_action.default_panel` / `background.scripts`；repoways 反过来断言**没有** action、**没有**面板入口、**一个权限都没有**（零权限是它的隐私卖点，被依赖偷偷加进来就该红），外加 `content_scripts` 的 `matches` 里必须有 `https://github.com/*`——这条漂了就是"装上但什么都不显示"。两者共用的底线：`manifest_version` 对得上目标、`default_locale` 在产物里真有对应的 `_locales/<locale>/messages.json`、manifest 里引用的每个 `__MSG_x__` 在该 locale 里存在、以及 **manifest 指向的每个文件路径真的在产物目录里**（`icons/16.png`、`sidepanel.html`、`background.js`、`content-scripts/content.js`；auto-icons 缺源图时会 WARN 并跳过图标生成，这条以前查不住）。这些键任何一个掉了构建照样绿，但装进浏览器就用不了——所以宁可让 CI 红。**CI 故意不跑 `fmt:check`**：oxfmt 默认风格与现有代码不一致（30/56 文件会被改动），先加配置、再单独一次大提交重排，之后才谈得上把它变成门禁。参数化之后做过三条反向验证，确认门禁真的会红：往 `repoways/.output/chrome-mv3/manifest.json` 里塞 `action` + `permissions` + 改掉 `matches` → 四条断言一起失败；把 landing 里的 `prelook-1.8.0-chrome.zip` 写成 1.7.0 → stale + 缺 zip 两级失败；临时建一个没有 SPECS 条目的 `apps/zz-probe/wxt.config.ts` → `verify:manifest` 退出码 1。

发版链路分两段。`pnpm release:prelook`（`apps/prelook/.release-it.json`）**只做版本号 + 打 tag**：`tagName: "prelook-v${version}"`、`github.release: false`（所以 release 本体不由 release-it 建）、`after:bump` 跑 `auto-changelog -p`、`@release-it/bumper` 把版本同步进 package.json。tag 一推上去就触发 `.github/workflows/release.yml`——它只订阅 `prelook-v*`，所以 monorepo 里将来别的 app 打自己的 tag 不会误跑它。workflow 里先 `pnpm compile`（tag 可以跑在 CI 前面，不能假定这条 tree 还过类型检查），再 `pnpm zip:prelook` + `pnpm zip:prelook:firefox`，产物传成 run artifact，并用 `gh release create --draft` + `gh release upload` 挂上去，**发布本身仍是一次人工点击**（`workflow_dispatch` 可手动跑同一套，只出 artifact 不动 release）。zip 文件名来自 `wxt.config.ts` 的 `zip.artifactTemplate` / `zip.sourcesTemplate`，扩展包是 `prelook-<版本>-<浏览器>.zip`，Firefox 另出一个 `prelook-<版本>-<浏览器>-sources.zip`（AMO 审核要）。**这里刚修掉一个实打实的发版 bug（2026-10-14）**：这两条模板曾经写成**同一条字符串**，于是 `pnpm zip:prelook:firefox` 先把扩展包落成 `prelook-<版本>-firefox.zip`，随后**被源码包同名覆盖**——磁盘上只剩一个 343 KB 的 firefox.zip，`unzip -l` 里是 `entrypoints/*.ts`、`wxt.config.ts`、CHANGELOG.md，`manifest.json` 计数为 0。换句话说 Firefox 那条链路此前**从未产出过可上传 AMO 的扩展包**（老文档说的"多出一个 -sources.zip"并不成立，两个包是在抢同一个文件名）。现在 sources 模板带字面量 `-sources`，两个包并存且内容各自正确；**新插件抄这份 config 时别把这条改回去**（见「新插件接入清单」的抄送陷阱）。另有一个**已处理的泄露面**：WXT 组装源码包时**完全不看 `.gitignore`**（`resolve-config.mjs:202-208` 的默认排除只有 `**/node_modules`、`**/web-ext.config.ts`、`**/__tests__/**`、测试文件、`.output`），而用户配的 `zip.excludeSources` 是**追加**到这份默认表、不是覆盖它。所以凡是躺在 gitignore 里的文件都会原样进源码包、随 AMO 上传交给审核方。审计整包时实测抓到两类：`assets/logo-candidates/**`（换标候选稿、`prompts/*.txt`、`ark-probe.py`、`run-candidate.ps1` 共 8 个文件）和 **`scripts/private-key.json`——旧授权体系那把 gitignored 私钥，就在 1.8.0 那份源码包里**。现在 `excludeSources: ["assets/logo-candidates/**", "scripts/private-key.json"]`，源码包从 58 个文件降到 49（343 KB → 330 KB），扩展包不受影响（实测 13 个文件，`manifest.json` + 4 枚 icons 齐全）。**这把私钥本身仍躺在机器上、没有任何代码引用它**，AGENTS.md 早就写过它可直接删——从包里排除只是止血，删掉才是收口。**注意：老文档里写的"先校验 tag 与 package.json 的 version 一致"那一步在当前 workflow 里并不存在**，别以为有这道保险；版本号唯一的真源就是 `apps/prelook/package.json`。

RepoWays 的发版链路是**另一个文件**：`.github/workflows/release-repoways.yml` 只订阅 `repoways-v*`（`pnpm release:repoways` → `apps/repoways/.release-it.json` 的 `tagName: "repoways-v${version}"`，同样 `github.release: false`，tag 归 release-it、release 本体归 workflow）。**刻意没有并进 `release.yml`**：那份服务的是已经上架的 1.8.0，把第二个产品塞进去等于让线上产品的发布通道跟着本地实验一起改。与 prelook 那份有三处不同，第一处差点埋掉整条链路：

- **`@release-it/bumper` 不能当"模板残留"删掉**（第一次接线时就删了，是 release-it 的 dry-run 把它抓出来的）。`npm: false` 之后 release-it 核心**不写任何 package.json**：写版本那句 `npm version <x> --no-git-tag-version` 就住在 npm 插件里（`lib/plugin/npm/npm.js:89-95`），插件一关就没有这次写入。产物侧的证据也在仓库里：prelook 的 `37efa9c Release 1.8.0` 提交正好改了 `apps/prelook/package.json` 那一行版本。**没有 bumper 的 tag 是空头的**——标签叫 `repoways-v1.0.1`，`apps/repoways/package.json` 却停在旧版本号，而 workflow 是"tag 触发 + 按 package.json 命名 zip"，版本号唯一的真源就此和 release 对不上。补回插件后 dry-run 里明确多出一行 `Writing version to package.json`。
- **只删了 `after:bump` 的 `auto-changelog -p`**：monorepo 共用一条 git 历史，auto-changelog 会把 prelook 的提交整段灌进 repoways 的 CHANGELOG。发布说明的来源改成 workflow 里的 `gh release create --generate-notes`，所以没有 CHANGELOG 不影响上架。
- **多一步 `node scripts/check-manifest.mjs repoways --require-icons`**（prelook 那条链路目前**没有** manifest 检查）。`--require-icons` 只在发版 workflow 里给，不在 CI 里给：`assets/logo.webp` 还没到位时 auto-icons 只 WARN、构建照绿、包里**一个图标都没有**，而三个商店的上传页都会直接拒掉无图标的包。CI 容忍"美术还没定稿"，tag 不容忍。实测两侧：不带 flag → 两条 OK；带 flag → chrome 与 firefox 各报一条、退出码 1。

**tag 是怎么到 GitHub 的（本机根本没有 GitHub remote）**：`git remote -v` 只有 `cnb → https://cnb.cool/coldstoneboy/extensions`，`branch.main.remote` 也是它，所以 release-it 的 `git push --follow-tags` 推的是 cnb；落到 cnb 之后由仓库根 `.cnb.yml` 里那条 `tencentcom/git-sync` 同步到 `https://github.com/xrr2016/extensions.git`，并带 `push_tags: true`——**tag 是靠这一步才到达 GitHub、才触发 `.github/workflows/*` 的**。所以"发版 workflow 怎么没跑"第一件事是去 cnb 看那条 sync 成没成功，而不是怀疑 Actions 的触发条件。dry-run 里还看到两个坑：

- **交互提示的版本不读这个 app 的 package.json**：release-it 打印 `Let's release extensions (0.0.0...1.0.0)`，名字取 git 根的 `package.json`（根包 `extensions` 压根没有 `version` 字段，所以显示 0.0.0），真正的 `latestVersion` 来自 `git describe --tags --match=<app>-v*`。prelook 有 `prelook-v1.8.0`，所以它的 patch 提示是 1.8.1；**repoways 第一次发版时还没有任何 `repoways-v*` tag，提示会给成 0.0.1 / 0.1.0 / 1.0.0**，手滑选 patch 就把 1.0.0 降成 0.0.1。第一版**显式给版本号**：`pnpm release:repoways 1.0.0`（dry-run 验过：写出 tag `repoways-v1.0.0` 并写 package.json）。
- 仓库里还有一个历史遗留的畸形 tag **`prelook-vv1.0.3`**（多打了一个 v），它同样匹配 `prelook-v*` 这条 glob。目前没有危害（`git describe` 按可达性选出的仍是真的 1.8.0），但按 tag 前缀列举的脚本可能把它捞进来。删远端 tag 动的是共享仓库，要删得用户点头。
- **`--require-icons` 之外还有一条本地 glob 风险**：`.output/*.zip` 在**本机**会连着上一版本的 zip 一起匹配到（版本号 bump 之后 WXT 并不会清掉旧 zip，实测 `1.0.0` 构建后 `0.0.0` 那三个还躺在 `.output/`），所以本地手工打包前要先把旧的删干净，否则挂到 release 上的是一堆混着旧版本的附件。CI 是干净克隆，不受这条影响。

版本号已升到 `1.0.0`（第一个要上架的版本，`0.x` 不适合出现在商店里），AMO 的永久 id 直接写死在 `wxt.config.ts` 的 `browser_specific_settings.gecko.id`（`{5c8e71e1-d3c8-4b3c-b44a-3f909a6da4b2}`）而不是留空：留空提交会新建一个 listing，之后每次更新都得对着那个新 id 传；`data_collection_permissions.required: ["none"]` 是 AMO 的数据收集披露（这产品哪儿都不发，每行都是普通链接）。Chrome 会忽略整段 `browser_specific_settings`，prelook 的 MV3 产物里也带着它，已验证不报错。

**发版收尾目前全是手工**，顺序照下面走：① 商店侧各自上传（Chrome Web Store / Edge Addons / AMO）；② 把 `prelook-<版本>-chrome.zip` **复制进 `apps/prelook-landing/assets/` 并提交**（同时删掉上一版本那份，否则每发一版就在这里多留 ~320 KB 的死重；离线包是给进不了商店的用户兜底的，随站点直传所以它必须是仓库里的文件，CI 在干净克隆上跑 `verify:landing` 会查它），Firefox 那条仍走 bucket，把 `prelook-<版本>-firefox.zip` 传到 `prelook.s3.bitiful.net`（历史上 chrome 漏传过两个版本，landing 上就一直挂着 1.6.0）；③ `pnpm sync:landing` 按 package.json 改写 landing 的离线包链接（**顺序不能反**：先让 zip 就位再 sync，反了就是 `verify:landing` 红——它现在既比版本也查本地文件在不在，不会再绿着指向一个不存在的对象）；④ 整目录部署 landing；⑤ 确认 CI 全绿。

悬停链路回归：改 `entrypoints/content.ts` / `utils/preview/` 后，先 `pnpm build:prelook`，再从**仓库根目录**起静态服务器打开 `apps/prelook/test/repro-hover.html`（页面里的 chrome mock 必须提供 `runtime.connect` 与 `storage.<area>.onChanged`：前者是 `@wxt-dev/analytics` 在入口启动时调用的，缺了会让整个 content script 在挂监听前就抛错，日志表现为 `host present: false`；后者是 `@wxt-dev/storage` 监听设置变化用的，注意是**按区域**的 `chrome.storage.local.onChanged`，不是 `chrome.storage.onChanged`）（mock chrome API + 引用 `.output` 真实产物），确认日志出现 `windows in shadow: 1`。

RepoWays 注入回归：改 `apps/repoways/entrypoints/content.ts` / `utils/menu.css` / `utils/icons.ts` / `utils/ways.ts` / `_locales` 后，先 `pnpm build:repoways`，再从仓库根起服务打开 `apps/repoways/test/repro-menu.html`，页面自己打印 30 条 PASS/FAIL（`window.__fail` 是失败条目数）。四点让它区别于 prelook 那台：**产物里没有 URL 匹配**（`matches` 只活在 manifest，bundle 一加载就无条件跑 `main()`），所以 mock 只需要 `chrome.runtime.id` 与同步的 `chrome.i18n.getMessage`（词条从 `.output/chrome-mv3/_locales/zh_CN/messages.json` 同步 XHR 取真值，测的是出厂文案不是抄本）；页面必须 `history.replaceState` 成 `/owner/repo` 形状的路径，**且 `.output` 的绝对路径要在 replaceState 之前算好**（否则动态插入的 `<script>` 会按新 URL 解析、直接 404 —— 同一件事在回归台外面做临时探测也会踩：replaceState 之后别再 `new URL("../.output/…", location.href)`，从那个已注入的 `<script src>` 反推 `.output` 根，否则 fetch 拿到的是 404 的 HTML、报错长得像 JSON 解析坏了）；模拟悬停要把 `pointerenter` 派到 `.rw` 外层而不是按钮上——`pointerenter` 不冒泡，真实指针进入按钮时浏览器是给外层单独派发一次的，派错元素只会得到"菜单不展开"的假失败。**量几何的那条（面板贴着最长行、行 32px、图标 16×16）必须排在 `pointerenter` 展开之后**——`hidden` 元素的 rect 一律是 0×0，放前面会得到一条看着像样式写坏了的假失败；计算样式不受 `hidden` 影响，所以圆角/内边距/底色/阴影那些对账照旧排在展开前。**图标只有"结构性"的验法**（`querySelector` + 计算尺寸 + 十行 `innerHTML.length` 去重等于 10）：in-app Browser 拿不到截图、合成事件进不了 `:hover`，所以像素层面谁也没验，图标"16px 下认不认得出"是另外用 `canvas` 把每张图打点阵图量的（`drawImage` 到 16×16、`getImageData` 转 ASCII，浅色 `#fff` 与深色 `#010409` 各一遍，`currentColor` 和 `light-dark()` 按该档背景手工代入），那条不在回归台里。**样式表还能反过来验"某个东西确实没了"**：`.rw-arrow` 那条检查同时查 DOM 节点和 `root.styleSheets[0].cssRules` 里的选择器，两边都为 0 才算过（上一版的箭头是"淡出不是移除"，这一版要求真删）。**样式对账那几条靠 fixture 里的分支切换器 donor（`#ref-picker-repos-header-ref-selector`，和产物里 `DONOR` 同一条选择器） 和按 `data-color-mode` 分档的 Primer token 区块**（与真 GitHub 同一套属性名，所以翻 `data-color-mode` 会同时验到 `MutationObserver` 重抄这条路）；断言是逐属性比 `button` 与 donor 的计算值，浅、深各一遍，再摘掉 donor 查字面兜底、装回去查重新挂载又跟上——**donor 复原必须写 `insertBefore(donor, codeButton)`，别存 `donor.nextElementSibling`**，那个兄弟节点就是我们自己注入的 host，每次重挂载都会被移除、引用跟着失效（`NotFoundError`）。**字面色值那条检查不再钉 `borderTopWidth === "0.8px"`**：Chrome 把边框宽度吸附到整数设备像素才序列化，同一条 `border: 0.8px` 声明在 DPR 1.25 读回 `0.8px`、在 DPR 1 读回 `1px`（同一个文件、同一次会话里两种都量到过，所以钉任何一个字符串都是钉机子），现在改成现场放一个带**同一种简写声明**的探针元素、比 `bare.borderTopWidth === declared`——回落真丢了边框会读到 `0px`，照样红。还有一条**异步尾巴里不要 `await requestAnimationFrame`**：in-app Browser 的表面是 hidden 的，rAF 根本不跑，整台回归会永远停在 `running…` 且没有任何报错（看着像页面慢）；等一个 `setTimeout(0)` 就够了，`MutationObserver` 的回调是微任务、早已跑完。尾巴现在挂了 `error` / `unhandledrejection` 两条兜底，抛错会写成 FAIL 而不是静默。

> 注意：`pnpm landing:prelook` 的服务根是 `apps/prelook-landing`，用它访问复现页会 404。复现页必须从仓库根起服务（`npx serve .` 或任意等价方式），这样页面里的 `../.output/...` 相对路径才解析得到。`apps/prelook/test/demo/` 同理（它是落地页 hero 那段视频的录制台，见那里的 README）。

将来 hero 再放视频的话，那段视频**要求服务端支持 Range 请求**：没有 Range，浏览器拖不动进度条，Safari 更会直接拒绝播放一个服务端不声明 `accept-ranges` 的媒体文件。这一条很容易漏——`python -m http.server` 就没有（用它验证时会看到"能播但拖不动刻度"）。现在本地预览走 `pnpm landing:prelook`（Vite，配置在 `apps/prelook-landing/vite.config.js`）：Vite 自己处理分段请求（`206` + `Content-Range`），但**只对 206 写 `Accept-Ranges`**，所以那份配置里有一个 `acceptRangesForMedia()` 按扩展名给 200 全量响应也补上 `Accept-Ranges: bytes`——**当前页面已经没有内嵌视频，这个插件是留着当通用兜底的，别顺手删**：删了在 Chrome 上照样看不出问题（Chrome 不看这个头也会发 Range 请求），只有 Safari 会直接拒绝播放。`video/mp4` 的 MIME 由 Vite 自带的 mime 表给出，不用另外配。

landing **只把 Vite 当开发服务器**，没有构建步骤：`index.html` / `privacy.html` + `css/` `js/` `assets/` + 那批 agent 文件（`llms.txt` / `index.md` / `privacy.md` / `robots.txt` / `sitemap*.xml`）原样就是部署物（整目录直传），`vite.config.js` 里 `root` 就是这一层，所以 dev 与线上看到的是同一批文件、同一套相对路径（`./assets/...`）。两个刻意的后果：**不要给它加 `build` 脚本**——根 `pnpm build` 是 `pnpm -r --if-present build`，一加就会连带产出 `dist/`，等于凭空多出一条和"整目录直传"并行的部署路径，迟早有人部署错那一份；`appType: 'mpa'`（多页静态站，未知路径 404 而不是回落到 index.html）。热更新行为：`css` 走 css-update（Vite client 就地换掉 `<link>`，**不刷新页面**，所以调样式时不丢滚动位置），`js` / `html` 改动走整页刷新。

## 附加模块（analytics / auto-icons）

- 图标走 `@wxt-dev/auto-icons`：**源图是 `assets/logo.webp`**（`wxt.config.ts` 里 `autoIcons.baseIconPath` 指的就是它，`developmentIndicator: "overlay"` 所以 dev 构建的图标带角标），产物写 `.output/<browser>/icons/<size>.png` 并覆盖 manifest 的 `icons`（默认尺寸 128/48/32/16，**没有 96**，要保留就显式配 `sizes`）。这是插件图标的**唯一来源**——历史上还有一份 `public/icon/`（16/32/48/128 四个 png，原给设置面板头部的 `<img src="/icon/32.png">` 用），那个引用随面板头部一起删掉后已无人引用，整目录已删除；`assets/logo-candidates/` 是换标时的候选稿，不参与构建。landing 那份 `assets/logo.webp` 是**另一次导出、不是同一张文件**（见「关键约定」），改了源图两边都要动。
- `app.config.ts` 是运行时应用配置（`defineAppConfig` 由 WXT 自动导入，不用手写 import）。**文件存在就必须有 default export**，空文件会让构建直接失败：`[MISSING_EXPORT] "default" is not exported by "app.config.ts"`。
- `@wxt-dev/analytics` 会把客户端代码注入各入口（content script、sidepanel **和 background SW** 都验证过），在**模块求值阶段**就调用 `runtime.connect`。也就是说这个调用一旦抛错，整个入口在挂任何监听之前就挂掉——排查“什么都不响应”时先看这里。GA4 需要 `WXT_GA_API_SECRET` 与真实 `measurementId`。

## 右键菜单

`background.ts` 里建三层菜单：`prelook-root`（`contexts: ['link']`，标题 `menu.root`）下挂 `prelook-open-popup` 与 `prelook-open-sidebar`。Chrome 不会本地化菜单标题，所以标题由 `translate()`（`browser.i18n`，跟随浏览器语言）生成，并在 `onInstalled` 时重建（`removeAll()` 后再 `create()`，避免 id 重复报错；原生 i18n 会话内不会变，不再有"语言变化触发重建"那回事）。

点击后 background 只发 `prelook:preview` 给该 tab，预览窗本体仍由 content 脚本创建（UI 在 shadow root 里，background 碰不到）。两个刻意的决定：**菜单命令无视 `enabled` 与禁用站点**——用户是从浏览器 UI 明确点的，静默不做事比不尊重设置更糟；**「在预览窗打开」是强制浮动窗**，即使用户的 `position` 设成了侧边栏（`AnchorInfo.sidebar` 因此是**三态**：`true` 强制侧边栏、`false` 强制浮动且当配置位置就是 sidebar 时退回 `center`、`undefined` 跟随设置）。对同一个 url 再下一次命令会改掉已开窗口的停靠方式（`existing.sidebar = info.sidebar` 后 `place()`），所以「先浮动打开、再改成侧边栏」是生效的。

注意侧边栏的 `height` 只能由 `.tp-sidebar` 类提供，**不要在 `place()` 里写内联 `height: 100vh`**：浮动与侧边栏互相切换时内联样式不会自己消失，窗口会一直保持满高。同理，切到侧边栏时 `place()` 会清掉 `manualSize` 与内联 width/height，否则拖拽改过尺寸的窗口会带着浮动尺寸被停靠。多窗堆叠偏移是 `order * 窗口宽`，窗口很宽时靠后的那几个会排到视口外（历史行为，非 bug 但值得知道）。

## 收费与上架现状

**没有付费版本**：Pro / 授权码 / Ed25519 验签体系已整体移除（`utils/license.ts`、`scripts/gen-license.mjs`、`prelook:pro` 消息、popup 授权区、发码脚本都删了），多窗口预览对所有人开放。收入来源只有赞助，入口有两块：**设置面板最底部的 `components/SponsorSection.vue`**（GitHub 星标条 + 爱发电嵌入 iframe `https://afdian.com/leaflet?slug=coldstoneboy` + Ko-fi 徽章 `https://ko-fi.com/J1R627B7UA`；外链在这里就是普通 `<a target="_blank" rel="noopener noreferrer">`，扩展页面开新标签是正常路径，不需要绕 `browser.tabs.create`）与 **landing 的 `#sponsor` 段 + 页脚**（同一份 leaflet 嵌入 + Ko-fi）。爱发电统一写 `afdian.com`——`ifdian.net` 是同一服务的旧域名，两种写法混着放会让人以为是两个账号。**Patreon 已下线**，代码里没有任何引用。

**扩展已经上架**：Chrome Web Store（`chromewebstore.google.com/detail/bakhoimjnmigalolahgmbeflgifobeho`）、Edge Addons（`microsoftedge.microsoft.com/addons/detail/cfaoggmjcpfmmklonlgjbjgihnenfmmk`）、Firefox AMO（`addons.mozilla.org/…/addon/prelook/`），线上版本 1.8.0。这条推翻了过去写在文档里的两个前提，改东西时按新前提想：**① 存储键改名不再免费**——已有存量用户，动 `local:prelook_settings` 这类键名必须写迁移（见「关键约定」的 `tp-` 那条，已按现实改过）；**② landing 不该再有 `href="#"` 占位，也不该出现任何杜撰的评价**（带"（占位）"的评价墙区块已随之删除，别加回来）。

`apps/prelook/scripts/private-key.json`（已 gitignore，所以不在仓库里）是旧授权体系的残留，已无任何代码引用，可直接删掉。**但它一直躺在本机磁盘上，而且直到 2026-10-14 之前都会被 `wxt zip -b firefox` 打进源码包**（WXT 不看 `.gitignore`）——现在已由 `zip.excludeSources` 排除，见「发版链路」。排除只是让它不再外流，文件本身仍是无人使用的死料，删掉才干净。
