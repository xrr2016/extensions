# AGENTS.md

## 项目概述

**多浏览器插件 monorepo**（pnpm workspace，根包名 `extensions`）。`apps/` 下按"每个产品两个目录"扁平排列：插件本体 + 落地页。当前产品：

- **Prelook** — 悬停链接预览扩展（MV3，Chrome/Edge/Firefox），WXT 0.21 + Vue 3。**产品曾用名 TabPeek，2026-09-16 整体改名**——改名撞车是因为 Chrome Web Store 上已有一款同名扩展（`hcheung-code`，做的是悬停预览标签组，站 site tabpeek.com），所以任何带 `Tab` 前缀的名字都会被当成那款产品。核心能力：悬停/Alt+悬停/点击/长按触发页面内悬浮预览窗（iframe 优先、禁嵌站点自动切阅读模式）、链接预热、划词搜索（普通 + AI）、全量设置面板（侧边栏）、多窗口预览（最多 6 窗）。**全部功能免费**，没有 Pro/授权码/付费体系，只在侧边栏设置面板与 landing 放了爱发电 + Patreon 赞助入口。
- **prelook-landing** — 纯静态产品官网（零构建，直接部署），版式参考 `yuumi.coldstoneboy.cn`：**令牌驱动的设计系统**（`css/style.css` 顶部的 `--primary/--bg-*/--text-*/--shadow-*/--spacing-*/--radius-*`，与参考站同一套命名）、固定模糊导航栏 + 下划线 scroll-spy、`install(hero) → features → speed → reviews → sponsor → faq → cta-band → footer` 的区块顺序（锚点只有六个：`#features`/`#speed`/`#reviews`/`#sponsor`/`#faq`/`#get`，**hero 故意不带 id**——它就是首屏，给它锚点等于让导航"跳到你已经在的地方"；**没有独立的安装区块**，安装按钮在 hero 左栏与页尾色带各一份，导航与页脚那一条「安装」一律指向页尾色带的 `#get`；`.cta-band` 是整段饱和色块，**不在深浅交替的序列里**，所以它前后的 faq / footer 仍按原样式交替），**区块底色严格深浅交替**（`--bg-secondary` 与 `--bg-primary` 逐段切换，卡片永远取与所在区块相反的那一档），所以**插入新段落要把后面几段的底色整体翻一遍**，否则会出现两段同色连成一片、看不出分段。`#reviews` 是三栏评价墙（`.reviews-grid` 用 CSS `columns` 而不是 grid——卡片高矮不一时才能排成参考图那种错落感），**里面六条全是标注了"（占位）"的占位文案，不是真实评价**：Prelook 尚未上架、没有任何真实评价，所以刻意不编造昵称与五星好评；上线前必须逐条换成可核实的原文（`reviews.rN.name` / `reviews.rN.text` 两个语言都要改，并替换头像右下角的浏览器图标），**不要为了版式好看而杜撰或改写原话**。**深浅双主题**由 `data-theme` 驱动（`<head>` 内联脚本先落地，避免首帧闪白；用户没手动选过就跟随系统），选择存 `localStorage.prelook-landing-theme`。词典以 `data-i18n` 属性 + `js/main.js` 内的 `I18N` 对象独立维护（zh-CN 与 en 必须同步补齐，`data-i18n-aria` 负责无障碍标签）；赞助卡片是真实外链（`#sponsor` 段落 + 页脚各一份）。安装入口是**四颗等权按钮**（`.install-btn`：Chrome / Edge / Firefox / 手动安装，`href="#"` 占位，词条 `install.chrome|edge|firefox|manual`），出现两次——hero 左栏的 `.hero-actions` 和页尾色带的 `.cta-actions`，两处都是两列网格、同一套样式；**刻意不给 Chrome 任何强调样式**——那会暗示"只该装 Chrome"；前三颗挂 `assets/browser-chrome.svg` / `browser-edge.svg` / `browser-firefox.svg`（Wikimedia Commons 的官方多色 logo，**必须用 `<img>` 引文件而不是内联**：Chrome 与 Edge 的 SVG 都定义了 `id="a"/"b"/"c"` 的渐变，内联进同一个文档会互相覆盖），第四颗是内联的"外链"线性图标。用**两列网格而不是一行四颗**——hero 文字栏只有 ~557px，一行塞不下四颗带图标的按钮；`.install-btn` 本身按两列来定尺寸（字号 15px、`white-space: nowrap`——否则最长的"Firefox 安装"会折成两行把按钮顶高），`≤380px` 才退回一行一颗（再宽一点两列都放得下：390px 的手机上两列各 159px 仍然不挤）。**页尾色带**（`.cta-band`）构图参照 maxfoc.us：左边是胶囊徽章 + 大标题 + 一行副文案 + 这四颗按钮，右边是一段**纯 CSS 插画**（`.cta-art`：两个歪着的窗口，后面那个是深色浏览器框、前面那个是浅色预览窗，正好是产品自己的剪影）。插画用「前一层负 margin 压住后一层」而不是绝对定位——窗口高度由骨架线内容决定，绝对定位要按内容高度算偏移，加一行线就得重算。色带在浅色/深色各有一版渐变（`.cta-band` + `[data-theme="dark"] .cta-band`），带上的按钮固定白底深字（取 `--bg-primary` 会在深色主题里变成四块近黑色补丁）；`≤820px` 色带才立成一列、文案居中（断点压这么低是因为 768–960 还放得下左右两栏，提前立起来只会让色带上下空出一大片），`≤600px` 直接隐藏插画——留着它这一段会占掉整整一屏，而这一段的意义就是那四颗按钮。**页脚**是「logo + 字标 + 一句话」加四栏（快速链接 / 赞助 / 联系 / 条款，栏用的是等宽网格而不是靠 gap 撑开的 flex；**「快速链接」那一栏与页头导航是同一份清单、同一个顺序**——功能 / 极速 / 评价 / 赞助 / FAQ / 安装，两处一起改，别只动一边），最下面一行左边版权、右边 `.footer-meta`（备案号 + 回到顶部）。**备案号 `粤ICP备2026134562号` 是硬编码的法定标识**：不进词典（中英两种语言都原样显示），而且**必须链到 `https://beian.miit.gov.cn/`**——这是备案要求，不是"顺手给个出处"，别把它翻译掉或改成别的链接。`footer.slogan` 是词典里一条没人引用的历史遗留，留着没删。**hero 右侧是一段真实录屏**（`assets/demo.mp4`，裁剪到 928×700；poster `assets/demo-poster.webp`），不是 CSS 画的示意图——它是把 `.output/chrome-mv3/content-scripts/content.js` 原样加载进一个 mock 掉 background 的演示页录下来的，重录步骤在 `apps/prelook/test/demo/README.md`。视频默认静音自动播 + 循环，右下角一枚播放/暂停按钮（`#demoToggle`，词条 `hero.videoPlay`/`hero.videoPause`，`applyLang` 里会按当前播放状态重算文案），`prefers-reduced-motion: reduce` 时不自动播、停在 poster 上；**录屏内容永远是浅色页面，所以视频和那枚按钮都不跟深浅主题走**（按钮故意写死浅色，取主题令牌会在深色下糊在白色录屏上）。旧的纯 CSS 假预览窗（`.preview-window` / `.mock-*` / `@keyframes float|shimmer|loadbar`）与三张浮动卡片（`.floating-cards` / `.float-card`）连同 `hero.float1t…float3v` 六条词条已整体删除；`@media (max-width: 768px)` 原本把 `.hero-visual` 整个 `display: none`，现在改成 `order: 2`——演示视频在手机上照样出现，只是挪到标题与四颗安装按钮之后。滚动入场用 IntersectionObserver + 每帧几何兜底（`sweepReveals`：IO 是采样而非穿越检测，快速滚动会漏，兜底保证没有区块停在 `opacity:0`）。导航高亮的"滚到底点亮最后一项"那条兜底（`isAtBottom`）**必须先确认页面真的能滚**（`scrollHeight > innerHeight + 4`）：加载途中文档还没被撑高时 `0 + 视口高 >= 文档高` 会成立，于是最后一项会在首屏被误点亮，而且得等下一次成功的滚动更新才纠正。不引外部字体（Google Fonts 在国内不可达），用系统字体栈。

## 常用命令

在**仓库根目录**执行（脚本经 `pnpm -F` 转发到子包）：

| 命令                                                | 作用                                                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                      | 安装并链接 workspace（首次克隆/目录改名后必跑，见下）                                                                                                                                                          |
| `pnpm dev:prelook` / `pnpm dev:prelook:firefox`     | 开发模式，产物在 `apps/prelook/.output/chrome-mv3-dev/`（firefox 为 `firefox-mv2-dev/`）                                                                                                                       |
| `pnpm dev:prelook:doubao`                           | 开发模式，改用本机豆包浏览器（Chromium 147），产物在 `.output/doubao-mv3-dev/`                                                                                                                                 |
| `pnpm dev:prelook:zen`                              | 开发模式，改用本机 Zen Browser（Firefox 内核，与 `dev:prelook:firefox` 同一条命令），产物在 `.output/firefox-mv2-dev/`                                                                                         |
| `pnpm build:prelook` / `pnpm build:prelook:firefox` | 生产构建，产物在 `apps/prelook/.output/chrome-mv3/`（firefox 为 `firefox-mv2/`）                                                                                                                               |
| `pnpm zip:prelook` / `pnpm zip:prelook:firefox`     | 打包上架 zip                                                                                                                                                                                                   |
| `pnpm compile:prelook`                              | 单产品类型检查（`vue-tsc --noEmit`）                                                                                                                                                                           |
| `pnpm compile` / `pnpm build`                       | 聚合：对全部子包 `--if-present` 执行                                                                                                                                                                           |
| `pnpm landing:prelook`                              | 官网本地预览（http://127.0.0.1:4173 ，**根目录是 `apps/prelook-landing`**）。⚠️ 目前不可用：它转发的 `apps/prelook-landing` `dev` 脚本（连同 `scripts/serve.mjs`）已被删除，跑之前先补回来或改用别的静态服务器 |

包管理器固定 **pnpm**（workspace 根有 `pnpm-lock.yaml`）。workspace 子包自身的 `postinstall`（`wxt prepare`）会正常执行，并生成 `apps/<name>/.wxt/tsconfig.json`——`tsconfig.json` 正是 `extends` 它，所以**没跑过 install 就编译会失败**。

> **pnpm 12 的 `allowBuilds` 陷阱**：pnpm 12 默认拦下依赖的构建脚本，并且只要 `pnpm-workspace.yaml` 里有**任何一条非布尔的 `allowBuilds`**，它就直接让整个 install 失败（`ERR_PNPM_IGNORED_BUILDS`）——本仓库曾躺着一条 `'@wxt-dev/analytics': set this to true or false` 的占位串，等于**任何人在任何机器上 `pnpm install` 都是红的**。现在写死为 `false`（保持不执行：那个 postinstall 只是给 analytics 自己跑 `wxt prepare`，Prelook 需要的 `.wxt` 产物由 `apps/prelook` 自己的 postinstall 生成）。新增被拦下的依赖时照此补一条布尔值，别让占位串进仓库。

`apps/prelook/node_modules/` 里是指向 pnpm store 的**符号链接，写死绝对路径**：把仓库目录改名或移动（例如 `prelook/` → `extensions/`）后它们会集体失效，表现为"模块找不到"。跑一次 `pnpm install` 即可重建链接。

**多浏览器启动**：`wxt.config.ts` 的 `webExt.binaries` 是**按 `-b` 传入的浏览器名取值**的映射（内部即 `binaries[browser]` → `chromiumBinary`），所以自定义浏览器必须让**映射键与 `-b` 参数同名**。当前 `doubao` 键指向本机豆包浏览器主程序，只有 `pnpm dev:prelook:doubao`（`wxt -b doubao`）会命中，直接 `wxt` 仍启动 Chrome。新增浏览器照此加一条键 + 一个 `dev:<name>` 脚本即可；浏览器名不是 firefox/safari 时一律按 MV3 构建，产物目录随之变成 `.output/<name>-mv3[-dev]/`。

**Zen Browser 是这条规则唯一的例外**，因为它和 doubao 不同、是 **Firefox 内核**：WXT 只在 `browser === 'firefox'` 时读 `binaries.firefox` 并把 web-ext 的 `target` 设成 `firefox-desktop`，其余名字一律当 Chromium（`binaries[browser]` → `chromiumBinary`，`target: 'chromium'`）。所以写一个 `zen` 键是**没有用的**：`wxt -b zen` 会产出 Chrome MV3 清单（`background.service_worker` + `side_panel` + `sidePanel` 权限），Zen 一条都加载不了。正确做法是让 **`binaries.firefox` 指向 Zen 主程序**（本机没装真正的 Firefox，所以这个槽位归 Zen），脚本用 `pnpm dev:prelook:zen`（内部就是 `wxt -b firefox`，与 `dev:prelook:firefox` 等价，多一个名字只为好找），产物走 `.output/firefox-mv2-dev/`。装了真 Firefox 之后想让两者并存就只能改这一行——WXT 没有"按名字给 firefox 目标指定 binary"的入口。

同层的 `webExt.startUrls` 决定 dev 启动时打开的页面（当前是虎扑测试帖）：它**没有按浏览器区分的形式**（只有 `manifest` 支持 `UserManifestFn` 那种 `env.browser` 函数），配了就对所有 dev 目标生效。

## 目录结构

```
pnpm-workspace.yaml          # packages: ['apps/*']
apps/
  <name>/                    # 插件本体，包名 @extensions/<name>；工程根 = 此目录，@/ 别名指到这里
    wxt.config.ts            # manifest（权限/名称/描述/action）唯一定义处
    tsconfig.json            # extends ./.wxt/tsconfig.json（生成物）
    entrypoints/
      background.ts          # SW：fetch 预检、开标签页（消息中枢）
      content.ts             # 悬停/点击/长按判定 + Shadow UI 装配
      sidepanel/             # 设置面板（点工具栏图标打开）：App.vue（4 个 tab 的全部设置项 + 共用底部赞助块）+ index.html + main.ts + style.css
    components/              # 跨入口复用的 Vue 组件（当前只有 SponsorSection.vue，sidepanel 用）
    utils/
      storage.ts             # 设置类型/默认值/夹取 + settingsItem + 引擎表
      preview.ts             # 预览窗系统（DOM 手动构建 + STYLE 字符串 + 固定/倒计时条）
      selection.ts           # 划词搜索工具条
      extract.ts             # 阅读模式正文提取 + sanitize 白名单
      speculation.ts         # Speculation Rules 预热
      i18n.ts                # 扁平 key 查表
    assets/locales/          # 界面词条 zh-CN.json / en.json（与 WXT 的 locales/ 无关）
    assets/icon.png          # 唯一图标源图（@wxt-dev/auto-icons 用它生成各尺寸）
    test/repro-hover.html    # mock chrome API 的悬停链路回归页（引用 .output 真实产物）
    test/demo/               # 落地页 hero 那段演示视频的录制台（mock background + 真实 content.js）
  <name>-landing/            # 落地页，包名 @extensions/<name>-landing，零依赖
    index.html  css/  js/  assets/
```

**新插件接入清单**：建 `apps/<name>/`（可复制 prelook 骨架）→ 改 `wxt.config.ts` manifest 与 package.json 名（`@extensions/<name>`）→ 根 package.json 注册 `dev/build/zip/compile/landing:<name>` 脚本 → 建 `apps/<name>-landing/` → 把插件 `assets/icon.png` 复制一份到 landing `assets/`（插件的各尺寸由 auto-icons 从这一张生成，landing 直接用原图）。

## 运行期架构

### 三个上下文与消息协议

content script 拿不到部分能力（见"陷阱"），所有跨上下文调用都走 `browser.runtime.sendMessage`，**消息名统一 `prelook:` 前缀**，处理函数集中在 `entrypoints/background.ts`：

| 消息              | 方向                         | 载荷 / 回复                                                                                                                                                                                  |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prelook:fetch`   | content → background         | `{ url }` → `{ ok, canEmbed, finalUrl?, title?, description?, favicon?, html?, error? }`                                                                                                     |
| `prelook:openTab` | content/preview → background | `{ url, background? }` → `{ ok: boolean }`（`background:true` 时非激活打开）                                                                                                                 |
| `prelook:preview` | **background → content**     | `{ url, sidebar }` → 无回复。右键菜单点「在预览窗/侧边栏打开」时由 background 发给该标签页，content 自己按 url 找 `<a>` 的 rect（找不到就用视口中心），再 `preview.open({ …info, sidebar })` |

`prelook:fetch` 的 `hostOrigin` 由 background 从 `sender.tab.url` 推导，用于 XFO / CSP `frame-ancestors` 判定；未知消息一律返回 `undefined`（表示不接管）。

### 一次悬停预览的数据流

1. content 判定命中链接 → `speculation.onIntent(url)` 预热 → 起延迟定时器（`hoverDelayMs`，`longPress` 模式改用 `longPressMs`）→ 延迟期间在光标处显示倒计时进度条（`preview.startProgress/cancelProgress`；hover/altHover/longPress 都有，`click` 是立即打开故无倒计时；条在光标上方，顶部空间不足时翻到下方）。
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

`click` 与 `altClick` 共用同一个 capture 阶段的 click 监听，靠修饰键区分：`click` 要求不带修饰键，`altClick` 要求**只**带 Alt（Ctrl / Meta / Shift 一律让给浏览器，Ctrl+单击仍是"新标签页打开"）。要留意 **Chrome 里 Alt+单击链接的默认行为是"下载目标"**，`preventDefault()` 顺手把它接管过来——这正是这个模式能用的前提，别为了"保留下载"去掉它。

和 `click` 模式的区别是刻意设计的：`click` 模式下普通单击就被预览接管、不会跳转；`altClick` 模式下普通单击照旧导航（实测过），只有按住 Alt 才走预览。另外注意 `altHover` 模式下按住 Alt 移动鼠标本身就会触发预览，所以用键盘模拟"Alt+单击"时容易看到两个窗口——那是 altHover 正常工作，不是 altClick 串味。

### 拖动触发（drag 模式）

`triggerMode: 'drag'` 时，**按住链接拖动超过 `DRAG_INTENT_PX`（12px）就打开预览**——"打开"发生在拖动过程中而不是松手时，和 longPress 的"按住期间就打开"保持一致；松手后那次 click 由既有的 `suppressClickUrl` 吃掉，所以不会跳转（实测过：拖完再点链接，页面不导航）。几个关键点：

- `DRAG_INTENT_PX` 同时被两处复用：drag 模式用它判定"开始拖"，longPress 模式用它判定"这不是长按，取消"——同一个位移，两种模式下的相反含义都是刻意的，改的时候别只顾一边。
- 必须拦掉浏览器原生的链接拖动：`dragstart` 里对 `a[href]` 调 `preventDefault()`（**只在 drag 模式**），否则原生拖拽会话会接管手势、pointermove/pointerup 不再派发，整套判定就废了。不拦的话也没法用原生 `dragend` 代替——原生拖放松手可能直接导航。
- 一次手势只开一个预览（触发后立刻 `dragCandidate = null`）；`cancelPress()` 里也清它，所以 pointerup/pointercancel/下一次 pointerdown 都会重置。
- 没拖够距离就松手 = 普通点击，什么都不会发生；从非链接处开始拖也不触发。

### 预览窗出现/消失动效

照搬腾讯云控制台弹窗那套（也就是 TDesign 的 motion token）：进入 `.2s cubic-bezier(0, 0, .15, 1)`（减速，`opacity 0→1` 同时 `transform: scale(.92) → none`），退出 `.16s cubic-bezier(.38, 0, .24, 1)`（加速，`scale(1 → .96)` + 淡出），遮罩走 `.2s linear`。两个时长写在 `.tp-win` 自己的 `--tp-in-motion` / `--tp-out-motion` 上，改一处即可。

- **`.tp-in` 必须把 `transform` 落回 `none`**：真正留在元素上的 transform 会让它自己成为 backdrop root，头部毛玻璃就只能采样到窗口自己（窗口根节点没有背景）——毛玻璃会静默失效。所以 `--tp-in-motion` 用 transition 而不是 keyframes 动画，`transform: none` 是终态。
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
- `closeOnOutsideClick` 在 `content.ts` 用 capture 阶段的 `pointerdown` 实现：`composedPath()` 里出现 `PRELOOK-UI` 就当作点在自家 UI 上（包括预览窗内的 iframe），否则 `preview.dismissUnpinned()`。用 pointerdown 而不是 click，是为了按下即响应。
- `closeOnScroll` 挂在 `preview.ts` 已有的 scroll 监听里（那个监听同时负责让悬停高亮跟着链接走）。**注意无头 + `--virtual-time-budget` 下浏览器不派发 scroll 事件**，验证滚动相关行为必须用实时模式（CDP 不加虚拟时间），否则会误判成"滚动不关闭"。

`dismissUnpinned()` 与 `releaseExcept()` 都会跳过 `pinned` 窗口——固定就是"别自动关"的意思，加新关闭路径时也要照此跳过。另外固定住所有窗口会顶到 `maxWindows` 上限，此时新预览不打开并弹 `preview.pinLimit` 提示，三件套是连在一起的。

### 弹窗主题（预览窗配色预设）

`windowTheme` 选定一套预览窗配色，取值见 `WINDOW_THEMES`（gray / midnight / silver / blue / green / purple / pink / custom）。两个关键约定：

- **令牌驱动**：预览窗的表面色/文字色不再写死，而是 `:host` 上的 `--tp-base / --tp-ink / --tp-surface / --tp-line / --tp-soft`（`--tp-line`、`--tp-soft` 由 `--tp-ink` 与 `--tp-surface` 用 `color-mix` 推导）。深色主题只改 `--tp-base`、`--tp-ink` 两个默认值，窗口规则全读令牌。`applyWindowTheme(root, preset, customColor)` 把预设写进**每个窗口 root 的内联变量**（内联优先，所以能压过主题默认值）：`kind: 'tint'` 的预设写 `--tp-surface: color-mix(in srgb, var(--tp-accent) 7%, var(--tp-base))`——**混到底色而不是写死白色**，这样深色主题下选浅色预设会得到"深底 + 淡淡的主色"，而不是一块刺眼的白色；`kind: 'dark'` 的预设直接给 `surface` / `ink`，无视应用主题（"深色"那张卡就是这个）。
- **窗口配色只属于窗口**：`themeColor` 是**插件自己 UI 的强调色**（设置面板、链接高亮框、倒计时条、划词条——由 `selection.ts` / `applyVisualVars()` 里的 `overlay`、`highlight`、`progressBar` 分别写到各自元素上），只在「设置」tab 的「主题色」取色器里改；`windowTheme` 绝不写回它。窗口的强调色由 `applyWindowTheme()` 统一写：预设用自己的 `accent`，`custom` 用另一个独立设置项 `windowColor`（弹窗主题卡片里那张铅笔卡的取色器改的就是它）。因此 `applyVisualVars()` 和 `open()` **都不再给窗口 root 写 `--tp-accent`**，新增窗口上色的地方也别绕开 `applyWindowTheme` 自己写，否则同一个窗口会一半按预设、一半按插件主题色。历史包袱：旧数据里 `themeColor` 曾被预设强制改写（`clampSettings` 里那行已删），解耦后老用户的窗口配色保持原样，插件的强调色则停在最后一次被预设改写的值上——想改回默认色在「设置」tab 里点一下即可。
- **头部毛玻璃**：`.tp-head` 是半透明填充（`--tp-glass`，默认 78%，叠一层 14% 主色渐隐）+ `backdrop-filter: blur(14px) saturate(1.5)`。**前提是 `.tp-win` 自己不再画背景**：根节点只要是不透明表面，模糊采样到的就是那块表面而不是它后面的页面，毛玻璃会变成看不见的空转——所以不透明表面搬到了 `.tp-body` 上（阅读模式、骨架屏、错误页都在它里面），圆角仍靠根节点的 `overflow: hidden` 裁切。头部的四个按钮共用一套细描边图标（`ICON_ATTRS`：24 网格、`stroke-width: 1.9`、`fill: none`），**别再加 `-webkit-` 前缀**（本插件不发行 Safari，全项目也没有前缀）；图标按钮的 hover 与固定态是「混向 transparent」而不是混向 `--tp-surface`，混向 surface 会在玻璃条上压出一块不透明色块。没装 `backdrop-filter` 或省电模式关掉模糊时（见「节电模式」），`--tp-glass` 升到 100% + `backdrop-filter: none`，条子退回不透明，而不是让用户隔着一层没模糊的玻璃看页面。

设置面板「预览窗」tab 里的卡片是 4 列网格的窗口缩略图（`.win-themes` + `.mini*`），每张卡用自己的 `--card-accent` 上色（`custom` 那张取 `windowColor`，所以拖色时会实时跟着变），`custom` 那张是铅笔图标 + 内嵌 `<input type="color">`；选中项用 `color-mix(accent 30%, transparent)` 做外圈高亮。工具提示的名字来自 `windowTheme.<id>` 词条，新增预设要同步补两处 locale。

### 外观主题（深/浅/跟随系统）

`theme` = system / light / dark，默认 **system**（跟随系统）。解析逻辑集中在 `utils/theme.ts`：`resolveTheme(mode)` + `watchTheme(getMode, onChange)`（回调先立刻跑一次，之后仅在 `getMode()` 仍返回 `system` 时响应 `prefers-color-scheme` 变化，返回 disposer）。两处落地方式不同：

- **设置面板**（侧边栏，独立文档）：解析结果写到 `document.documentElement.dataset.theme`，深色样式是 **`style.css` 末尾的 `html[data-theme='dark'] …` 覆盖块**（含 `html[data-theme='dark'] body` 的底色）。面板的样式基本都在 `style.css` 里当全局 CSS 写（`App.vue` 没有样式块）——`body` / `#app` 这类选择器在组件 scoped 块里够不到，硬写只会多出一堆 `:global()`。**唯一例外是 `SponsorSection.vue`**（自带 `<style scoped>`，把赞助卡片样式收在组件里）；代价是 scoped 会给每个选择器加一层 `[data-v-…]`、**特异性整体抬高**，所以它的深色覆盖也必须写在组件内（那份深色取值正是按这个特异性重复的），否则会被面板级的 `html[data-theme='dark'] section` 抢回去。切换设置时要 `themeDispose?.()` 再重新 `watchTheme`，`onUnmounted` 也要释放。
- **页面内 shadow UI**（预览窗、阅读模式、划词条、提示）：`content.ts` 在 `onMount` 里拿到 `shadow.host`，把解析结果写成 **host 上的 `data-tp-theme`**（两份 UI 共用一个 shadow root，所以一个属性就够）。**预览窗内部不再用 `data-tp-theme` 直接写规则，而是走上面那组令牌**（`:host` 定义 `--tp-base/--tp-ink` 默认值，深色主题只改这两个默认值）；只有划词条、提示条这类窗口之外的 UI 还用 `:host([data-tp-theme='dark'])` 覆盖。设置变更时同样要重订阅，`ctx.onInvalidated` 里释放。

**改深色样式时的坑**：为了压过浅色规则，覆盖选择器要带 `html[data-theme='dark']` / `:host([data-tp-theme='dark'])`，于是特异性变成 (0,1,1) 这一档，会和 `.seg-btns label.on` / `.theme-cards label.on` 这类 (0,2,1) 的选中态**打平**——平手时靠源码顺序，深色块在后面，深色下选中项就会丢掉主题色填充。所以必须同时为 `.on` 写一条更高特异性的深色规则（现有代码里那三组就是这么来的），新增可选中控件时别忘了照做。

### 节电模式与减少动画

扩展改不了浏览器自己的节电/动画开关，这两项是**约束 Prelook 自身开销**的档位，解析集中在 `utils/power.ts`：`resolvePowerState(mode, onBattery, reduceMotion)` + `watchPower(getSettings, onChange)`（照 `watchTheme` 的模样写，回调先立刻跑一次，返回 disposer）。降级后的 `PowerState { level, reduceMotion }` 只有三档 `off / on / max`，**它只会拿走功能，绝不会打开设置里关着的东西**。

- `powerSaver` = off / on / max / auto（`POWER_MODES`，设置面板下拉顺序即 `auto` 在前）。`auto` 只影响 `level` 的计算：`navigator.getBattery()` 报到 `charging === false` 时当作 `on`，其余（API 缺失、promise reject、市电）一律当作不降级——**报错猜成"在省电"会把功能悄悄关掉，猜成"市电"只是少省一点**。
- 三档剥夺的东西：`on` = 关链接预热（`warmupSettings()` 直接返回 `speculationMode: "off"` 的副本，`speculation.ts` 因此完全不用改）+ 关背景模糊（`blurStrength()` 返回 0，设置值不动）+ 关预览窗头部毛玻璃（`frostDisabled()` → 窗口 root 加 `tp-nofrost`，`--tp-glass` 升到 100% 且去掉 `backdrop-filter`）；`max` = 在 `on` 基础上再关链接高亮（`highlightWanted()`）、跳过 `prelook:fetch` 预检直接 `renderIframe()`（没有标题/图标/阅读模式兜底，禁嵌站点只能失败），并且**隐含 `reduceMotion`**（见下）。两个效果类开关都同时覆盖「设置变更」与「电源变化」两条路径：`applyVisualVars()` 的窗口循环里就带着 `tp-nofrost`，`open()` 建窗时也要写一次，漏掉任一处都会出现"新开的窗口还带着毛玻璃"。
- `reduceMotion` 是三条来源的合流：`settings.reduceMotion`、系统 `prefers-reduced-motion: reduce`、以及 `level === "max"`（在 `resolvePowerState` 里合，调用方只读这个布尔值，不关心是谁要求的）。落地方式是 `content.ts` 把它写进 **host 的 `data-tp-motion`**（与 `data-tp-theme` 同一套机制），`preview.ts` 的 CSS 里 `:host([data-tp-motion])` 一刀切断 `.tp-overlay` / `.tp-win` / `.tp-hl` / `.tp-pin svg` / `.tp-resize` 的过渡与骨架屏动画；**JS 内联写的过渡 CSS 管不到**，所以倒计时进度条要在 `startProgress()` 里自己提前返回。窗口退出的 `exitMs()` 也随之归零（`FADE_SLACK_MS` 保留那一帧余量），`place()` 之类的布局数学不受影响。
- 电池/系统偏好变化时只走 `preview.applyPower()`（重算模糊与高亮），**不重新 `place()` 窗口**——插拔电源不该把用户拖过位置的窗口挪走。同理设置变更时 `content.ts` 要 `powerDispose?.()` 后重新 `watchPower`（和 `themeDispose` 并列），`ctx.onInvalidated` 里释放。

### 悬停高亮链接

`highlightLinks` 开启时，指针下的链接会被 shadow root 里的一层 `.tp-hl` 框住（`open()` 之外唯一会跟着指针动的元素，和倒计时条同一类）。要点：

- 页面上**不改任何 DOM**，高亮是覆盖层：`position: fixed` + 2px 主题色描边 + 12% 透明底色，尺寸取 `锚点 rect` 四边各外扩 2px（全局 `box-sizing: border-box`，描边画在框内，所以是 ±2 而不是 ±0）。`--tp-accent` 得显式设在元素上——shadow root 自身没有这个变量，不定就永远落到默认蓝。
- `z-index: 2147483640`，append 在遮罩之后、窗口之前：所以它盖在模糊遮罩之上、但永远在预览窗之下；`pointer-events: none` 是必须的，它就压在链接上，能命中就会把悬停本身掐掉。
- 判定沿用 `anchorHref()`，因此禁用站点、非 http 链接、扩展关闭时都不会高亮；`applySettings` 里关掉开关会立即隐藏。
- `scroll`（capture + passive）只重算高亮位置，**不重新 `place()` 窗口**——窗口是 fixed 的，跟着页面滚走会打断正在阅读的预览；`resize` 才同时重排两者。链接若已从 DOM 移除，`placeHighlight()` 会自行收起并清引用。
- 注意无头 + `--virtual-time-budget` 下浏览器不派发 scroll 事件（也不推进 CSS 过渡），验证要跑实时模式，否则会误判成"滚动不跟随"。

### 预览窗固定

窗口头部四个按钮：`pin` / `reload`（重新 fetch + 重渲染，iframe 会换成一个新元素，阅读模式会重新提取）/ `open`（新标签页打开）/ `close`，靠 `data-act` 分派（`preview.ts` 的 `head` click 监听）。点 pin 把 `win.pinned` 置位，效果有两条：`releaseExcept()` 直接跳过（指针移开不再进 400ms 宽限），`open()` 的驱逐循环也只挑`!pinned`的窗口关闭。**所有存活窗口都固定住时，新预览不打开，而是在光标处弹一条提示**（`showNotice('preview.pinLimit', …)`）：文案走 i18n（zh 带 `{max}` 占位、en 不带数字，避免 `max=1` 时出现 \"All 1 slots\"），2.6s 自动消失，重复触发会重置计时并跟随新的光标位置。提示和倒计时条一样是 `pointer-events: none`——否则它会挡住 hover、把触发自己取消掉（见下面陷阱）。宁可这次不弹，也不悄悄删掉用户明确要留的窗口，这一点在改动驱逐逻辑时要保持。

`autoPin` 打开时，**新建**的窗口直接以 `pinned` 出生（`preview.ts` 的 open 里 `pinned: settings().autoPin`），`syncHeaderButtons()` 随后把图钉按钮的 `.on`/`aria-pressed`/tooltip 一起同步，所以界面不会与状态脱节。刻意**不**在设置变更时给已打开的窗口补固定：那样容易瞬间顶到窗口上限，之后新预览全被拦住。

和窗口上限的联动要注意：固定窗口不参与驱逐，所以 autoPin + 达到 `maxWindows` 之后新预览不会再打开，此时会弹 `preview.pinLimit` 提示告诉用户去取消固定或关窗——这正是那条提示存在的意义，别把这条路径改成静默返回。

固定状态只存在于 DOM 生命周期内（页面跳转/刷新即消失），不落存储。按钮外观由 `.tp-pin` / `.tp-on` 控制：固定时图标转正并染成主题色，未固定时旋转 45°，所以两个状态除了颜色还有形状差异。`syncHeaderButtons()` 统一维护三个按钮的 `title` 与 `aria-pressed`，`refreshTitlesAndBadges()` 就是遍历它，因此换语言时 tooltip 会跟着更新（词条 `preview.pin` / `preview.unpin`）。

### 设置面板（侧边栏）

设置界面是**侧边栏**（`entrypoints/sidepanel/`），没有 popup 入口了。WXT 按目标浏览器把它写成两套 manifest：Chrome MV3 → `side_panel.default_path` 并**自动追加 `sidePanel` 权限**，Firefox → `sidebar_action.default_panel`。两个刻意的后果：

- **`manifest.action` 必须手写**（`wxt.config.ts` 里的 `action: {}`）：工具栏 `action` 只由 popup 入口生成，删掉 popup 后不写这一句，扩展在工具栏上就没有图标可点。MV2 目标由 WXT 的 `convertActionToMv2()` 转成 `browser_action`。
- **图标点击由 `background.ts` 的 `bindIconToPanel()` 接**：Chrome/Edge 走 `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`——这是"声明式"的，一旦设置，`action.onClicked` 就再也不会触发，所以别指望用它做别的事；Firefox 完全没有 `sidePanel` API，只能在自己的点击监听里调 `sidebarAction.open()`，而且 MV2 的事件挂在 `browserAction` 而不是 `action` 上。`sidebarAction` 不在共享类型里，所以整段是"拓宽类型 + 运行时探测"，新浏览器接入时保持这个写法，别假设某个命名空间一定存在。

`App.vue` 把设置分成 4 个 tab（`TABS` = preview / settings / performance / protect），标签是 `.tabs` 里的文字 tab（选中项强调色文字 + 2px 底部下划线；`.tabs` 纵向裁剪溢出，别用负 margin 把下划线推出盒外）（`role="tablist"` + 每个 `role="tab"`，面板 `v-if` 切换 + `role="tabpanel"`），标签文案来自 `panel.tab.<id>`。分组是**按功能**而不是原 popup 的顺序：「预览窗」（id 是 `preview`）装总开关、触发方式、关闭触发器、位置/尺寸/模糊/弹窗主题/多窗口——触发方式和窗口外观都是"预览窗怎么出现、长什么样"，拆成两个 tab 只会让人来回点；「设置」（id 是 `settings`）是划词搜索 + 应用主题（深浅）与**主题色**（插件强调色，`themeColor`）与插件语言这类"改完就生效、不涉及预览行为"的通用项，以及末尾的「恢复默认设置」按钮；预热与节电在「性能」；链接保护与禁用站点在「保护」。新增设置项时放进语义最接近的那个 tab。

赞助卡片是**每个 tab 共用的底部块**：抽成了 `components/SponsorSection.vue`（收 `lang` prop，自己查词条，因此切语言会自动跟着变），只写一次，落在 `main` 里所有面板之后、不在任何 `role="tabpanel"` 内部——面板是 `v-if` 互斥的，所以这一个实例就总在当前 tab 的下方，不需要每个 tab 复制一份。它也因此不属于任何 tab 的内容（读屏把它当页脚内容，这是对的）——原来那个「关于」tab 就是为它存在的，已删除。组件自带 `<style scoped>`（`.sponsor-section` / `.sponsor` 与它们的深色覆盖都在组件里），但卡片外观（背景 / 内边距 / 圆角 / 边框）仍来自面板全局的 `section` 规则，所以它只有在设置面板里才完整。它是面板最末一块（「恢复默认设置」按钮在「设置」tab 里，见下），沉底靠三件套：`#app { display:flex; flex-direction:column; min-height:100vh }` + `main { flex:1 }` + `.sponsor-section { margin-top:auto }`——内容比面板矮时它贴住底边不留空白，内容更高时它就是滚动区的最后一块（内层 `.flex-1` 让面板区自己吃掉剩余高度，所以不会把内容拉长）。`*{box-sizing:border-box}` 保证 `#app` 的 `padding-bottom` 算在 100vh 内，否则面板会凭空多出一条滚动条。**「恢复默认设置」是「设置」tab 最后一个 section 里的一个盒状按钮**（`.btn-reset`，唯一的红色破坏性控件；它原先在底部的 `footer` 里——`footer` 规则已随之下线，那段共用的尾巴上只剩赞助卡）。

样式仍是 `style.css` 里的全局 CSS（`App.vue` 没有样式块；赞助卡片自带 scoped 块，见上），和原 popup 一致。为新布局做的改动：`body` 去掉固定宽度/`max-height`（面板宽度由浏览器决定，用户可拖）；**`.topbar` 里只剩 tab 条**——原来那行 `.hd`（logo + `Prelook` 标题 + EN/中 快捷切换按钮）整行删掉了，`.hd` / `.hd img` / `.hd h1` / `.spacer` / `.link` 五条规则随之失去引用并被删（`.link` 是它的文字按钮样式，现在面板里唯一的按钮样式是盒状的 `.btn-reset`）。因此**切语言只剩「设置」tab 里的单选**。sticky 挂在 `.topbar` 上（tab 条是切换分区的唯一入口，必须一直可见），`.tabs` 横向滚动、`.tabs .chip` 加 `font-family: inherit`（否则按钮回落到 UA 默认字体，和页面其余部分不一致），且因为它是唯一一行，内边距是四周对称的 `10px 12px`。界面词条前缀是 **`panel.*`**（`panel.enabled` / `panel.section.*` / `panel.tab.*`），`menu.popup` 那条是另一回事（右键菜单里"在预览窗打开"），别顺手改名。

### 设置与存储

- `settingsItem` = `local:prelook_settings`，定义在 `utils/storage.ts`。
- 新增设置项要同时改三处：`PrelookSettings` + `DEFAULT_SETTINGS` + `clampSettings`，并在 sidepanel `App.vue` 的对应 tab 里加控件、两个 locale 补词条。
- 两个颜色设置各有归属，别混：`themeColor` = 插件 UI 的强调色（「设置」tab 的「主题色」），`windowColor` = 弹窗主题选 `custom` 时的窗口强调色（那张铅笔卡里的取色器）。两者都用 `<input type="color">` 编辑（值恒为 `#rrggbb`），`clampSettings` 里只做 `|| DEFAULT_SETTINGS.x` 兜底、不做格式校验。**没有任何代码把其中一个写成另一个**——这是刻意的，改「弹窗主题」不该把整个插件换色。
- `clampSettings` 的边界：`hoverDelayMs` 100–2000（默认 500）、`longPressMs` 200–2000（600）、`width` / `height` 20–100（视口百分比，默认 40 / 55）、`blurStrength` 0–100（百分比，默认 0 关闭）、`minSelectionChars` 1–20、`maxWindows` 1–6（默认 3）。**所有读取设置的地方都要过 `clampSettings`**，content 与 sidepanel 都这么做。
- **单位约定**：延迟类设置**存储永远是毫秒**（`hoverDelayMs` / `longPressMs`，定时器直接用），只有设置面板的滑块与读数换成秒（`App.vue` 里两个 writable computed 做 `×1000 / ÷1000` 换算，`toFixed(2)` 去浮点噪声），这样不需要迁移老数据。宽高反过来，**存储就是视口百分比**，`clampSettings` 里 `clampWindowPercent()` 会把历史遗留的像素值（>100 只可能是 px）按固定参考视口 1440×900 折算一次——不能用 `innerWidth` 折算，因为设置面板的视口不是被浏览的页面，同一份数据在两处会算出不同百分比。
- 宽高百分比最终由 `--tp-w` / `--tp-h` 两个 CSS 变量生效（`place()` 不再写内联 px 尺寸），而 `place()` 里的定位数学需要像素，所以走 `windowSize()` 按当前视口把百分比换算成 px；`preview.ts` 注册了 `resize` 监听重新 `place()` 所有非手动拖拽过的窗口，否则视口一变、窗口长大了却还停在旧坐标上可能出屏。
- 枚举取值：`triggerMode` = hover / altHover / longPress / drag（click / altClick 已移除，`clampSettings` 对存量坏值回落到 `DEFAULT_SETTINGS.triggerMode`）；`position` = link / mouse / bottom-right / bottom-left / top-right / center-top / center / center-bottom / sidebar；`sidebarSide` = left / right；`speculationMode` = off / prefetch / prerender；`powerSaver` = auto / on / max / off；`language` = zh-CN / en。`powerSaver` 的夹取不能照抄"坏值回落到最省事的那档"：它每个取值都要拿去比较，回落到 `off` 会让省电功能静默失效，所以坏值一律回落到 `DEFAULT_SETTINGS.powerSaver`。
- 搜索引擎表 `SEARCH_ENGINES`（google/bing/duckduckgo）与 `AI_ENGINES`（deepseek/doubao/kimi/perplexity）也在这里。`SEARCH_ENGINES` 是**单选**（`searchEngine` 一个 id，设置面板用与触发方式同款的联合按钮组；划词工具条只渲染一个「Web 搜索」按钮，tooltip 是引擎名；`clampSettings` 对无效 id 与旧版 `searchEngines` 多选数组回落到数组里第一个有效项，再退默认 google）。URL 模板用 `%s` 占位；**DeepSeek/Kimi/豆包三条故意不带 `%s`**——它们的前端不读任何问题类 query 参数，所以划词工具条对这三家改为「先把选中文字写进剪贴板，再打开各自主页」（DeepSeek `https://chat.deepseek.com/`、Kimi `https://kimi.moonshot.cn/`、豆包 `https://www.doubao.com/chat/`），用户在新对话里 Ctrl+V。判断逻辑就在 `selection.ts` 的 `open()`：模板含 `%s` 就替换，否则走 `copyText()`（`navigator.clipboard` 在 http 页缺失时退回 `execCommand('copy')`）。换引擎时别给这三家把 `%s` 补上，补了就等于把文字丢了。
- `skipImages`（默认 false，「预览窗」tab 开关）在 content 的 `anchorHref()` 里过滤图片链接（链接内含 `<img>` 或 href 路径以图片扩展名结尾，见 `isImageLink()`），悬停/长按/拖拽一律不触发；右键菜单「在预览窗打开」走 `anchorInfoFor()`，不受此开关影响。

### 多窗口

`s.maxWindows` 是普通设置项，上界 `MAX_WINDOWS_LIMIT = 6`，由 `clampSettings` 夹取（content 与 sidepanel 都过一遍）。曾经有 Pro 分级（非 Pro 强制 1 窗），随 Pro 一起移除：现在没有授权校验，`maxWindows()` 直接返回设置值。

## 关键约定与陷阱

- **`tp-` 是曾用名 TabPeek 的缩写，刻意保留**：预览窗的 CSS 变量（`--tp-accent/--tp-w/--tp-h/--tp-blur/--tp-base/--tp-ink…`）、类名（`.tp-win/.tp-in/.tp-out/.tp-overlay/.tp-hl…`）和 host 属性（`data-tp-theme/--tp-motion`）全都还叫 `tp-*`，一共 200 多处。2026-09-16 产品改名成 Prelook 时**没有跟着换成 `pl-`**：这些名字全在 shadow DOM 内部、用户看不见，而漏改一个选择器就会静默弄丢毛玻璃 / 悬停高亮 / 出入动效（没有类型检查会报错），收益为零、风险实打实。所以看到 `tp-` 别以为是另一个产品，也别"顺手改对"。真正跟着改名走的是这些**外部可见的标识符**：包名 `@extensions/prelook`、存储键 `local:prelook_settings`、消息前缀 `prelook:`、shadow host 标签 `prelook-ui`（`composedPath()` 里比对的是大写形式 `PRELOOK-UI`）、预检响应头 `x-prelook-origin`、右键菜单 id `prelook-*`、landing 的两个 localStorage 键。**因为还没上架、没有存量用户，存储键改名不需要写迁移**——这条时间窗只有一次，发版之后再改就得背着旧键或补一段迁移代码了。
- **storage / browser 导入**：两者都是 WXT 自动导入的全局，直接裸用（`storage.defineItem`、`browser.runtime`）。`wxt/storage` 子路径不存在；确需显式导入时用 `wxt/utils/storage`。**manifest 必须有 `storage` 权限**，否则 `getValue/setValue` 静默 reject，表现为"设置永远不保存"（sidepanel 的 `load()` catch 里专门打了这条日志）。
- **设置面板里 watch(ref(对象)) 默认不深度监听**：v-model 改嵌套属性不会触发保存，必须 `{ deep: true }`，并在 `visibilitychange→hidden` 时强制 flush（防抖未到期就被收起会丢最后一次变更）。
- **Shadow UI**：`createShadowRootUi(ctx, { name:'prelook-ui', position:'inline', append:'last', css })`；窗口/工具条全在单个 shadow root 内定位（position:fixed），CSS 变量 `--tp-accent/--tp-w/--tp-h/--tp-blur` 驱动外观。content 里按标签名 `prelook-ui` 判断"指针是否悬停在我们自己的 UI 上"。z-index 从 2147483640 起分层（overlay < 窗口 < 划词条 < 触发倒计时条/上限提示）；倒计时条是 `pointer-events:none`，否则悬停倒计时期间它会吃掉 pointerover 把悬停自己的定时器取消掉。
- **链接预热只用 `document.speculationRules.addRules()`**，不要改成注入 `<script type="speculationrules">`——内联标签会受页面 CSP 限制；能力缺失（Firefox）时整条路径必须保持 no-op。规则分两层：一次性的 `source:'heuristics'` 规则（prerender 用 `conservative`，prefetch 用 `moderate`）+ 每个 URL 一条 `eagerness:'immediate'`（靠 `intentDone` 去重，避免重复注入）。
- **iframe 能否内嵌必须由 background 预检响应头**（跨域 iframe 对 Chrome 错误页同样触发 load，无法事后检测）；`X-Frame-Options: SAMEORIGIN` 的重定向前后 origin 用 `res.url` 判断。加载超时（8s）才走阅读模式兜底。
- **阅读模式的内容是 `innerHTML` 直接注入 shadow DOM 的**，所以 `extract.ts` 的 `sanitize()` 是安全边界而非美化步骤：只保留 `a[href]` / `img[src,alt]` 白名单属性，剥掉 `javascript:` 链接，并把相对 URL 用 `finalUrl` 补全。改提取逻辑时不要削弱这一步。
- **长按模式有一次性的点击抑制**：`suppressClickUrl` 让"长按开预览"后紧跟着的那次 click 被 `preventDefault + stopPropagation` 吃掉，只在释放后首次点击生效。拖动超过 12px 视为滚动意图，会取消长按。
- **设置面板的 radio 组必须带 `name`**（triggerMode / position / sidebarSide / speculationMode / language）：`name` 才让浏览器把它们当原生单选组，方向键切换、读屏播报"N 选 1"都靠它。缺 `name` 时 Vue 仍会在 re-render 时回写 `checked`，鼠标点击看不出问题，但原生分组语义没了。触发方式那一组是 `.seg-btns` 分段按钮（`input` 视觉隐藏 + `label` 上色，选中态用 `settings.x === 值` 绑 `.on`；**六个选项，用的是 3 列网格、2 行**），其余仍是原生圆点。
- **新增界面文案**：`utils/i18n.ts` 是扁平 key（`t('preview.close')`），zh-CN 与 en 必须同时补齐；sidepanel `App.vue` 模板里的动态 key 是 `panel.tab.${tab}` / `trigger.${mode}` / `position.${p}` / `sidebarSide.${side}` / `speculation.${m}` 模式，另有 `t(`sponsor.${s.id}`)` 这种模板拼 key 的写法。
- **content script 匹配** `<all_urls>` 且仅 main frame（WXT 默认不写 `all_frames`）；`entrypoints/content.ts` 中 `runAt`（camelCase），WXT 0.21 不认 `run_at`。 manifest 权限是 `tabs` / `storage` / `contextMenus`（右键菜单），**加权限后必须重载扩展**。**改 manifest 权限后必须重载扩展并刷新目标网页**，旧页面里的 content script 已失效。
- Manifest 改动（权限/名称）只改各 app 的 `wxt.config.ts`；`.output/`、`.wxt/` 是生成物，不要编辑。
- `apps/<name>-landing/` 与插件零依赖共享（词典在 landing `js/main.js` 内独立维护），图标是**同一张图的拷贝**：landing 的 `assets/icon.png` 就是插件 `assets/icon.png`（auto-icons 的源图）**原样复制**过来的，`index.html` 里三处引用同一份文件——`<link rel="icon">`（站点图标）、导航栏 logo（36px）、页脚 logo（40px）。原样用是刻意的：省掉一套需要手工重新导出的派生尺寸（历史上 landing 放的是 128/32 两张独立导出图，结果和插件图标完全不是同一个设计——绿色拼图 vs 现在的紫罗兰"页面+放大镜"——谁也没发现），代价是 favicon 也要下整张 190KB 的源图。**插件图标一改就要重新 `cp apps/prelook/assets/icon.png apps/prelook-landing/assets/icon.png`**；landing 是独立部署的静态站，不能写 `../prelook/assets/icon.png` 这种跨目录路径。
- hero 视频的**源材料不进仓库**：`recordings/`（`prelook-demo.webm` 原始录制 + 全画幅 mp4）已 gitignore，跟着仓库走的只有 `apps/prelook-landing/assets/demo.mp4` 与 `demo-poster.webp` 两个成品。重录时有两个坑必须踩对——**指针"进入"链接的那一点**决定窗口落位（`pointerover` 记的坐标，之后就固定了：要从链接正上方竖直落进去，横着滑会在链接边缘就记下坐标、窗口整体偏掉 200–300px），以及**录制期间 `requestAnimationFrame` 必须真的在跑**（`open()` 里那两帧 rAF 没跑就加不上 `.tp-in`，窗口停在 `opacity: 0`，录出来空无一物）。完整步骤和 ffmpeg 裁剪框的算法见 `apps/prelook/test/demo/README.md`。

## 回归自检

项目**没有自动化测试框架**（根 `package.json` 无 test/lint 脚本），回归靠类型检查 + 手动复现页：

```bash
pnpm install && pnpm compile:prelook && pnpm build:prelook   # 类型 + 构建
node -e "const a=Object.keys(require('./apps/prelook/assets/locales/zh-CN.json')).sort(),b=Object.keys(require('./apps/prelook/assets/locales/en.json')).sort();console.log('zh-only',a.filter(k=>!b.includes(k)),'en-only',b.filter(k=>!a.includes(k)))"
```

这套检查已经固化在 CI 里（`.github/workflows/ci.yml`，push 到 main 与 PR 时跑）：`pnpm install --frozen-lockfile` → `pnpm compile` → 词条对齐 → Chrome/Edge 与 Firefox 两个目标各构建一次 → **构建产物 manifest 冒烟检查**。最后一步是因为"构建成功"并不等于"插件能用"：它断言 `chrome-mv3` 有 `action` / `side_panel.default_path` / `background.service_worker` / `storage`+`sidePanel` 权限，`firefox-mv2` 有 `browser_action` / `sidebar_action.default_panel` / `background.scripts`。这些键任何一个掉了（`action` 就是典型：它全靠 `wxt.config.ts` 手写，见上）构建照样绿，但装进浏览器就用不了——所以宁可让 CI 红。**改动这些检查时注意每一步都要能在干净克隆上跑通**，别依赖本地生成物。

`.github/workflows/release.yml` 在 release published 时构建上架用的 zip：先校验 tag 与 `apps/prelook/package.json` 的 `version` 一致（`v` 前缀可有可无，不一致直接红——zip 文件名和 manifest 的 version 都来自 package.json，对不上就等于发布了一个版本错位的产物），再 `pnpm zip:prelook` + `pnpm zip:prelook:firefox`，产物同时传成 run artifact 并用 `gh release upload` 挂到该 release 上（`workflow_dispatch` 可手动跑，只出 artifact 不动 release）。注意 WXT 生成的 zip 名是 `<根包名><子包名>-<版本>-<浏览器>.zip`，即 `extensionsprelook-0.1.0-chrome.zip`；嫌难看在 `wxt.config.ts` 里配 `zip.name` 可以改（改之前先确认不会打乱既有上传流程）。

悬停链路回归：改 `entrypoints/content.ts` / `utils/preview.ts` 后，先 `pnpm build:prelook`，再从**仓库根目录**起静态服务器打开 `apps/prelook/test/repro-hover.html`（页面里的 chrome mock 必须提供 `runtime.connect` 与 `storage.<area>.onChanged`：前者是 `@wxt-dev/analytics` 在入口启动时调用的，缺了会让整个 content script 在挂监听前就抛错，日志表现为 `host present: false`；后者是 `@wxt-dev/storage` 监听设置变化用的，注意是**按区域**的 `chrome.storage.local.onChanged`，不是 `chrome.storage.onChanged`）（mock chrome API + 引用 `.output` 真实产物），确认日志出现 `windows in shadow: 1`。

> 注意：`pnpm landing:prelook` 的服务根是 `apps/prelook-landing`，用它访问复现页会 404。复现页必须从仓库根起服务（`npx serve .` 或任意等价方式），这样页面里的 `../.output/...` 相对路径才解析得到。`apps/prelook/test/demo/` 同理（它是落地页 hero 那段视频的录制台，见那里的 README）。

hero 那段视频**要求服务端支持 Range 请求**：没有 Range，浏览器拖不动进度条，Safari 更会直接拒绝播放一个服务端不声明 `accept-ranges` 的媒体文件。这一条很容易漏——`python -m http.server` 就没有（用它验证时会看到"能播但拖不动刻度"）。**服务端资源本来在 `apps/prelook-landing/scripts/serve.mjs`，连同 `apps/<name>-landing` 的 `dev` 脚本一起已被删除**，所以 `pnpm landing:prelook`（根脚本仍指向那个 `dev`）目前跑不起来；要恢复本地预览，就让新的静态服务器满足 Range + 认识 `video/mp4`，或者把那两样补回来。

## 附加模块（analytics / auto-icons）

- 图标走 `@wxt-dev/auto-icons`：源图 `assets/icon.png`，产物写 `.output/<browser>/icons/<size>.png` 并覆盖 manifest 的 `icons`（默认尺寸 128/48/32/16，**没有 96**，要保留就显式配 `sizes`）。这是插件图标的**唯一来源**——历史上还有一份 `public/icon/`（16/32/48/128 四个 png，原给设置面板头部的 `<img src="/icon/32.png">` 用），那个引用随面板头部一起删掉后已无人引用，整目录已删除；landing 的 `assets/icon.png` 是这张源图的拷贝（见「关键约定」一节），改了源图记得同步过去。
- `app.config.ts` 是运行时应用配置（`defineAppConfig` 由 WXT 自动导入，不用手写 import）。**文件存在就必须有 default export**，空文件会让构建直接失败：`[MISSING_EXPORT] "default" is not exported by "app.config.ts"`。
- `@wxt-dev/analytics` 会把客户端代码注入各入口（content script、sidepanel **和 background SW** 都验证过），在**模块求值阶段**就调用 `runtime.connect`。也就是说这个调用一旦抛错，整个入口在挂任何监听之前就挂掉——排查“什么都不响应”时先看这里。GA4 需要 `WXT_GA_API_SECRET` 与真实 `measurementId`。

## 右键菜单

`background.ts` 里建三层菜单：`prelook-root`（`contexts: ['link']`，标题 `menu.root`）下挂 `prelook-open-popup` 与 `prelook-open-sidebar`。Chrome 不会本地化菜单标题，所以标题由 `settingsItem` 里存的 `language` 经 `translate()` 生成，并在 `onInstalled` 与语言变化时重建（`removeAll()` 后再 `create()`，避免 id 重复报错）。

点击后 background 只发 `prelook:preview` 给该 tab，预览窗本体仍由 content 脚本创建（UI 在 shadow root 里，background 碰不到）。两个刻意的决定：**菜单命令无视 `enabled` 与禁用站点**——用户是从浏览器 UI 明确点的，静默不做事比不尊重设置更糟；**「在预览窗打开」是强制浮动窗**，即使用户的 `position` 设成了侧边栏（`AnchorInfo.sidebar` 因此是**三态**：`true` 强制侧边栏、`false` 强制浮动且当配置位置就是 sidebar 时退回 `center`、`undefined` 跟随设置）。对同一个 url 再下一次命令会改掉已开窗口的停靠方式（`existing.sidebar = info.sidebar` 后 `place()`），所以「先浮动打开、再改成侧边栏」是生效的。

注意侧边栏的 `height` 只能由 `.tp-sidebar` 类提供，**不要在 `place()` 里写内联 `height: 100vh`**：浮动与侧边栏互相切换时内联样式不会自己消失，窗口会一直保持满高。同理，切到侧边栏时 `place()` 会清掉 `manualSize` 与内联 width/height，否则拖拽改过尺寸的窗口会带着浮动尺寸被停靠。多窗堆叠偏移是 `order * 窗口宽`，窗口很宽时靠后的那几个会排到视口外（历史行为，非 bug 但值得知道）。

## 收费现状

没有付费版本：Pro / 授权码 / Ed25519 验签体系已整体移除（`utils/license.ts`、`scripts/gen-license.mjs`、`prelook:pro` 消息、popup 授权区、发码脚本都删了），多窗口预览对所有人开放。收入来源只有赞助，入口有两处：设置面板「关于」tab 的「赞助支持」段（用 `browser.tabs.create` 打开——面板里 `target="_blank"` 不可靠）与 landing 的 `#sponsor` 段 + 页脚，链接固定为爱发电 `https://ifdian.net/a/coldstoneboy`、Patreon `https://patreon.com/coldstoneboy`。landing 的安装按钮仍是 `href="#"` 占位（四个浏览器入口都在 hero 里）。

`apps/prelook/scripts/private-key.json`（已 gitignore）是旧体系的残留，已无任何代码引用，可自行删除。
