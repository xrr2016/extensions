# AGENTS.md

## 项目概述

**多浏览器插件 monorepo**（pnpm workspace，根包名 `extensions`）。`apps/` 下按"每个产品两个目录"扁平排列：插件本体 + 落地页。当前产品：

- **TabPeek** — 悬停链接预览扩展（MV3，Chrome/Edge/Firefox），WXT 0.21 + Vue 3。核心能力：悬停/Alt+悬停/点击/长按触发页面内悬浮预览窗（iframe 优先、禁嵌站点自动切阅读模式）、链接预热、划词搜索（普通 + AI）、全量设置页、多窗口预览（最多 6 窗）。**全部功能免费**，没有 Pro/授权码/付费体系，只在 popup 与 landing 放了爱发电 + Patreon 赞助入口。
- **tabpeek-landing** — 纯静态产品官网（零构建，直接部署）。词典以 `data-i18n` 属性 + `js/main.js` 内的 `I18N` 对象独立维护；赞助卡片是真实外链（`#sponsor` 段落 + 页脚各一份），下载按钮仍是 `href="#"` 占位。

## 常用命令

在**仓库根目录**执行（脚本经 `pnpm -F` 转发到子包）：

| 命令 | 作用 |
| --- | --- |
| `pnpm install` | 安装并链接 workspace（首次克隆/目录改名后必跑，见下） |
| `pnpm dev:tabpeek` / `pnpm dev:tabpeek:firefox` | 开发模式，产物在 `apps/tabpeek/.output/chrome-mv3-dev/`（firefox 为 `firefox-mv2-dev/`） |
| `pnpm dev:tabpeek:doubao` | 开发模式，改用本机豆包浏览器（Chromium 147），产物在 `.output/doubao-mv3-dev/` |
| `pnpm build:tabpeek` / `pnpm build:tabpeek:firefox` | 生产构建，产物在 `apps/tabpeek/.output/chrome-mv3/`（firefox 为 `firefox-mv2/`） |
| `pnpm zip:tabpeek` / `pnpm zip:tabpeek:firefox` | 打包上架 zip |
| `pnpm compile:tabpeek` | 单产品类型检查（`vue-tsc --noEmit`） |
| `pnpm compile` / `pnpm build` | 聚合：对全部子包 `--if-present` 执行 |
| `pnpm landing:tabpeek` | 官网本地预览（http://127.0.0.1:4173 ，**根目录是 `apps/tabpeek-landing`**） |

包管理器固定 **pnpm**（workspace 根有 `pnpm-lock.yaml`）。workspace 子包自身的 `postinstall`（`wxt prepare`）会正常执行，并生成 `apps/<name>/.wxt/tsconfig.json`——`tsconfig.json` 正是 `extends` 它，所以**没跑过 install 就编译会失败**。

`apps/tabpeek/node_modules/` 里是指向 pnpm store 的**符号链接，写死绝对路径**：把仓库目录改名或移动（例如 `tabpeek/` → `extensions/`）后它们会集体失效，表现为"模块找不到"。跑一次 `pnpm install` 即可重建链接。

**多浏览器启动**：`wxt.config.ts` 的 `webExt.binaries` 是**按 `-b` 传入的浏览器名取值**的映射（内部即 `binaries[browser]` → `chromiumBinary`），所以自定义浏览器必须让**映射键与 `-b` 参数同名**。当前 `doubao` 键指向本机豆包浏览器主程序，只有 `pnpm dev:tabpeek:doubao`（`wxt -b doubao`）会命中，直接 `wxt` 仍启动 Chrome。新增浏览器照此加一条键 + 一个 `dev:<name>` 脚本即可；浏览器名不是 firefox/safari 时一律按 MV3 构建，产物目录随之变成 `.output/<name>-mv3[-dev]/`。同层的 `webExt.startUrls` 决定 dev 启动时打开的页面（当前是虎扑测试帖）：它**没有按浏览器区分的形式**（只有 `manifest` 支持 `UserManifestFn` 那种 `env.browser` 函数），配了就对所有 dev 目标生效。

## 目录结构

```
pnpm-workspace.yaml          # packages: ['apps/*']
apps/
  <name>/                    # 插件本体，包名 @extensions/<name>；工程根 = 此目录，@/ 别名指到这里
    wxt.config.ts            # manifest（权限/名称/描述）唯一定义处
    tsconfig.json            # extends ./.wxt/tsconfig.json（生成物）
    entrypoints/
      background.ts          # SW：fetch 预检、开标签页（消息中枢）
      content.ts             # 悬停/点击/长按判定 + Shadow UI 装配
      popup/                 # App.vue（全部设置项）+ index.html + main.ts + style.css
    utils/
      storage.ts             # 设置类型/默认值/夹取 + settingsItem + 引擎表
      preview.ts             # 预览窗系统（DOM 手动构建 + STYLE 字符串 + 固定/倒计时条）
      selection.ts           # 划词搜索工具条
      extract.ts             # 阅读模式正文提取 + sanitize 白名单
      speculation.ts         # Speculation Rules 预热
      i18n.ts                # 扁平 key 查表
    assets/locales/          # 界面词条 zh-CN.json / en.json（与 WXT 的 locales/ 无关）
    public/icon/             # 16/32/48/96/128 图标，WXT 自动写入 manifest
    test/repro-hover.html    # mock chrome API 的悬停链路回归页（引用 .output 真实产物）
  <name>-landing/            # 落地页，包名 @extensions/<name>-landing，零依赖
    index.html  css/  js/  assets/  scripts/serve.mjs
```

**新增插件接入清单**：建 `apps/<name>/`（可复制 tabpeek 骨架）→ 改 `wxt.config.ts` manifest 与 package.json 名（`@extensions/<name>`）→ 根 package.json 注册 `dev/build/zip/compile/landing:<name>` 脚本 → 建 `apps/<name>-landing/` → 图标从 `public/icon/` 拷到 landing `assets/`。

## 运行期架构

### 三个上下文与消息协议

content script 拿不到部分能力（见"陷阱"），所有跨上下文调用都走 `browser.runtime.sendMessage`，**消息名统一 `tabpeek:` 前缀**，处理函数集中在 `entrypoints/background.ts`：

| 消息 | 方向 | 载荷 / 回复 |
| --- | --- | --- |
| `tabpeek:fetch` | content → background | `{ url }` → `{ ok, canEmbed, finalUrl?, title?, description?, favicon?, html?, error? }` |
| `tabpeek:openTab` | content/preview → background | `{ url, background? }` → `{ ok: boolean }`（`background:true` 时非激活打开） |

`tabpeek:fetch` 的 `hostOrigin` 由 background 从 `sender.tab.url` 推导，用于 XFO / CSP `frame-ancestors` 判定；未知消息一律返回 `undefined`（表示不接管）。

### 一次悬停预览的数据流

1. content 判定命中链接 → `speculation.onIntent(url)` 预热 → 起延迟定时器（`hoverDelayMs`，`longPress` 模式改用 `longPressMs`）→ 延迟期间在光标处显示倒计时进度条（`preview.startProgress/cancelProgress`；hover/altHover/longPress 都有，`click` 是立即打开故无倒计时；条在光标上方，顶部空间不足时翻到下方）。
2. 定时器到期 → `ensureUi()`（懒建 shadow host）→ `preview.open()` 插入骨架屏窗口 → 发 `tabpeek:fetch`。
3. background 抓取页面并判定 `canEmbed`（12s 超时、`credentials:'omit'`、`redirect:'follow'`、HTML 截断 2MB）。
4. 可内嵌 → 渲染 iframe；**8s 未触发 load** 才转阅读模式兜底。
5. 不可内嵌 → 有 HTML 走 `extract.ts` 阅读模式，否则错误页（带「在新标签页打开」）。
6. 抓取本身失败（网络错误）时 `canEmbed` 未知，按"宁可一试"仍渲染 iframe。

鼠标离开时 `releaseExcept()` 不是立即关窗，而是给 **400ms 宽限**再关，避免指针穿过缝隙时窗口闪没。

### 预览窗固定

窗口头部三个按钮：`pin` / `open`（新标签页打开）/ `close`，靠 `data-act` 分派（`preview.ts` 的 `head` click 监听）。点 pin 把 `win.pinned` 置位，效果有两条：`releaseExcept()` 直接跳过（指针移开不再进 400ms 宽限），`open()` 的驱逐循环也只挑`!pinned`的窗口关闭。**所有存活窗口都固定住时，新预览直接不打开**（`if (!victim) return;`）——宁可这次不弹，也不悄悄删掉用户明确要留的窗口，这一点在改动驱逐逻辑时要保持。

固定状态只存在于 DOM 生命周期内（页面跳转/刷新即消失），不落存储。按钮外观由 `.tp-pin` / `.tp-on` 控制：固定时图标转正并染成主题色，未固定时旋转 45°，所以两个状态除了颜色还有形状差异。`syncHeaderButtons()` 统一维护三个按钮的 `title` 与 `aria-pressed`，`refreshTitlesAndBadges()` 就是遍历它，因此换语言时 tooltip 会跟着更新（词条 `preview.pin` / `preview.unpin`）。

### 设置与存储

- `settingsItem` = `local:tabpeek_settings`，定义在 `utils/storage.ts`。
- 新增设置项要同时改三处：`TabPeekSettings` + `DEFAULT_SETTINGS` + `clampSettings`，并在 popup `App.vue` 加控件、两个 locale 补词条。
- `clampSettings` 的边界：`hoverDelayMs` 100–2000（默认 500）、`longPressMs` 200–2000（600）、`width` 320–1200（560）、`height` 240–900（480）、`blurPx` 0–20、`minSelectionChars` 1–20、`maxWindows` 1–6（默认 3）。**所有读取设置的地方都要过 `clampSettings`**，content 与 popup 都这么做。
- 枚举取值：`triggerMode` = hover / altHover / click / longPress；`position` = link / mouse / bottom-right / bottom-left / top-right / center / sidebar；`sidebarSide` = left / right；`speculationMode` = off / prefetch / prerender；`language` = zh-CN / en。
- 搜索引擎表 `SEARCH_ENGINES`（google/bing/baidu/duckduckgo）与 `AI_ENGINES`（copilot/gemini/doubao/kimi）也在这里，URL 模板用 `%s` 占位。

### 多窗口

`s.maxWindows` 是普通设置项，上界 `MAX_WINDOWS_LIMIT = 6`，由 `clampSettings` 夹取（content 与 popup 都过一遍）。曾经有 Pro 分级（非 Pro 强制 1 窗），随 Pro 一起移除：现在没有授权校验，`maxWindows()` 直接返回设置值。

## 关键约定与陷阱

- **storage / browser 导入**：两者都是 WXT 自动导入的全局，直接裸用（`storage.defineItem`、`browser.runtime`）。`wxt/storage` 子路径不存在；确需显式导入时用 `wxt/utils/storage`。**manifest 必须有 `storage` 权限**，否则 `getValue/setValue` 静默 reject，表现为"设置永远不保存"（popup 的 `load()` catch 里专门打了这条日志）。
- **popup 里 watch(ref(对象)) 默认不深度监听**：v-model 改嵌套属性不会触发保存，必须 `{ deep: true }`，并在 `visibilitychange→hidden` 时强制 flush（防抖未到期就关窗会丢最后一次变更）。
- **Shadow UI**：`createShadowRootUi(ctx, { name:'tabpeek-ui', position:'inline', append:'last', css })`；窗口/工具条全在单个 shadow root 内定位（position:fixed），CSS 变量 `--tp-accent/--tp-w/--tp-h/--tp-blur` 驱动外观。content 里按标签名 `tabpeek-ui` 判断"指针是否悬停在我们自己的 UI 上"。z-index 从 2147483640 起分层（overlay < 窗口 < 划词条 < 触发倒计时条）；倒计时条是 `pointer-events:none`，否则悬停倒计时期间它会吃掉 pointerover 把悬停自己的定时器取消掉。
- **链接预热只用 `document.speculationRules.addRules()`**，不要改成注入 `<script type="speculationrules">`——内联标签会受页面 CSP 限制；能力缺失（Firefox）时整条路径必须保持 no-op。规则分两层：一次性的 `source:'heuristics'` 规则（prerender 用 `conservative`，prefetch 用 `moderate`）+ 每个 URL 一条 `eagerness:'immediate'`（靠 `intentDone` 去重，避免重复注入）。
- **iframe 能否内嵌必须由 background 预检响应头**（跨域 iframe 对 Chrome 错误页同样触发 load，无法事后检测）；`X-Frame-Options: SAMEORIGIN` 的重定向前后 origin 用 `res.url` 判断。加载超时（8s）才走阅读模式兜底。
- **阅读模式的内容是 `innerHTML` 直接注入 shadow DOM 的**，所以 `extract.ts` 的 `sanitize()` 是安全边界而非美化步骤：只保留 `a[href]` / `img[src,alt]` 白名单属性，剥掉 `javascript:` 链接，并把相对 URL 用 `finalUrl` 补全。改提取逻辑时不要削弱这一步。
- **长按模式有一次性的点击抑制**：`suppressClickUrl` 让"长按开预览"后紧跟着的那次 click 被 `preventDefault + stopPropagation` 吃掉，只在释放后首次点击生效。拖动超过 12px 视为滚动意图，会取消长按。
- **popup 的 radio 组必须带 `name`**（triggerMode / position / sidebarSide / speculationMode / language）：`name` 才让浏览器把它们当原生单选组，方向键切换、读屏播报"N 选 1"都靠它。缺 `name` 时 Vue 仍会在 re-render 时回写 `checked`，鼠标点击看不出问题，但原生分组语义没了。触发方式那一组是 `.seg-btns` 分段按钮（`input` 视觉隐藏 + `label` 上色，选中态用 `settings.x === 值` 绑 `.on`），其余仍是原生圆点。
- **新增界面文案**：`utils/i18n.ts` 是扁平 key（`t('preview.close')`），zh-CN 与 en 必须同时补齐；popup 模板里的动态 key 是 `trigger.${mode}` / `position.${p}` / `sidebarSide.${side}` / `speculation.${m}` 模式，另有 `t(`sponsor.${s.id}`)` 这种模板拼 key 的写法。
- **content script 匹配** `<all_urls>` 且仅 main frame（WXT 默认不写 `all_frames`）；`entrypoints/content.ts` 中 `runAt`（camelCase），WXT 0.21 不认 `run_at`。**改 manifest 权限后必须重载扩展并刷新目标网页**，旧页面里的 content script 已失效。
- Manifest 改动（权限/名称）只改各 app 的 `wxt.config.ts`；`.output/`、`.wxt/` 是生成物，不要编辑。
- `apps/<name>-landing/` 与插件零依赖共享（词典在 landing `js/main.js` 内独立维护），仅 `assets/` 图标是从 `public/icon/` 拷贝的副本——`assets/icon-128.png` ← `icon/128.png`、`assets/favicon-32.png` ← `icon/32.png`，改图标记得两边同步。

## 回归自检

项目**没有自动化测试框架**（根 `package.json` 无 test/lint 脚本），回归靠类型检查 + 手动复现页：

```bash
pnpm install && pnpm compile:tabpeek && pnpm build:tabpeek   # 类型 + 构建
node -e "const a=Object.keys(require('./apps/tabpeek/assets/locales/zh-CN.json')).sort(),b=Object.keys(require('./apps/tabpeek/assets/locales/en.json')).sort();console.log('zh-only',a.filter(k=>!b.includes(k)),'en-only',b.filter(k=>!a.includes(k)))"
```

悬停链路回归：改 `entrypoints/content.ts` / `utils/preview.ts` 后，先 `pnpm build:tabpeek`，再从**仓库根目录**起静态服务器打开 `apps/tabpeek/test/repro-hover.html`（页面里的 chrome mock 必须提供 `runtime.connect` 与 `storage.<area>.onChanged`：前者是 `@wxt-dev/analytics` 在入口启动时调用的，缺了会让整个 content script 在挂监听前就抛错，日志表现为 `host present: false`；后者是 `@wxt-dev/storage` 监听设置变化用的，注意是**按区域**的 `chrome.storage.local.onChanged`，不是 `chrome.storage.onChanged`）（mock chrome API + 引用 `.output` 真实产物），确认日志出现 `windows in shadow: 1`。

> 注意：`pnpm landing:tabpeek` 的服务根是 `apps/tabpeek-landing`，用它访问复现页会 404。复现页必须从仓库根起服务（`npx serve .` 或任意等价方式），这样页面里的 `../.output/...` 相对路径才解析得到。

## 附加模块（analytics / auto-icons）

- 图标走 `@wxt-dev/auto-icons`：源图 `assets/icon.png`，产物写 `.output/<browser>/icons/<size>.png` 并覆盖 manifest 的 `icons`（默认尺寸 128/48/32/16，**没有 96**，要保留就显式配 `sizes`）。`public/icon/` 里那套是历史遗留的第二份拷贝，popup 头部 `<img src="/icon/32.png">` 还指着它。
- `app.config.ts` 是运行时应用配置（`defineAppConfig` 由 WXT 自动导入，不用手写 import）。**文件存在就必须有 default export**，空文件会让构建直接失败：`[MISSING_EXPORT] "default" is not exported by "app.config.ts"`。
- `@wxt-dev/analytics` 会把客户端代码注入各入口（含 content script 与 popup），在**模块求值阶段**就调用 `runtime.connect` 连后台。也就是说这个调用一旦抛错，整个入口在挂任何监听之前就挂掉——排查“什么都不响应”时先看这里。GA4 需要 `WXT_GA_API_SECRET` 与真实 `measurementId`。

## 收费现状

没有付费版本：Pro / 授权码 / Ed25519 验签体系已整体移除（`utils/license.ts`、`scripts/gen-license.mjs`、`tabpeek:pro` 消息、popup 授权区、发码脚本都删了），多窗口预览对所有人开放。收入来源只有赞助，入口有两处：popup 的「赞助支持」段（用 `browser.tabs.create` 打开——popup 里 `target="_blank"` 不可靠）与 landing 的 `#sponsor` 段 + 页脚，链接固定为爱发电 `https://ifdian.net/a/coldstoneboy`、Patreon `https://patreon.com/coldstoneboy`。landing 的下载按钮仍是 `href="#"` 占位。

`apps/tabpeek/scripts/private-key.json`（已 gitignore）是旧体系的残留，已无任何代码引用，可自行删除。
