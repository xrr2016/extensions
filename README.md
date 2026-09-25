# Extensions — 浏览器插件 monorepo

多浏览器插件工作区（**pnpm workspace**，根包名 `extensions`）。`apps/` 下按「每个产品两个目录」扁平排列：插件本体 + 产品落地页。

| 目录 | 说明 |
| --- | --- |
| [`apps/prelook/`](apps/prelook/) | **Prelook** — 悬停链接预览扩展（Chrome / Edge MV3、Firefox MV2），WXT 0.21 + Vue 3 |
| [`apps/prelook-landing/`](apps/prelook-landing/) | **Prelook 产品官网** — 纯静态落地页（零构建、整目录部署） |

---

## 技术栈

| 领域 | 选型 | 版本 |
| --- | --- | --- |
| 包管理 | pnpm（workspace） | 12 |
| 插件框架 | WXT | ^0.21.3 |
| UI | Vue | ^3.5.29 |
| 构建 / 开发服务器 | Vite | ^8.1（落地页 ^8.3） |
| 语言 | TypeScript（`vue-tsc` 类型检查） | ^5.9.3 |
| 浏览器目标 | Chrome / Edge（MV3）、Firefox（MV2，web-ext） | ^10.5.0 |
| 图标生成 | `@wxt-dev/auto-icons` | ^1.1.2 |
| 分析（可选） | `@wxt-dev/analytics` | ^0.5.6 |
| 质量工具 | `oxlint` / `oxfmt`、release-it | ^1.83 / ^0.68 |

落地页运行期**零依赖**：纯 HTML/CSS/JS，Vite 只作开发服务器（`appType: 'mpa'`），不产生构建产物——`index.html` / `privacy.html` + `css/` `js/` `assets/` 原样即部署物。

---

## 项目架构

### 三个上下文与消息协议

content script 拿不到的部分能力（跨域抓取、开标签页等）都通过 `browser.runtime.sendMessage` 转发给 background（消息名统一 `prelook:` 前缀）：

```mermaid
flowchart LR
    A[content script<br/>悬停判定 + Shadow UI 装配] -->|prelook:fetch| B[background SW<br/>fetch 预检 / 开标签页]
    A -->|prelook:openTab| B
    B -->|prelook:preview<br/>右键菜单触发| A
    C[sidepanel<br/>设置面板] -->|local:prelook_settings<br/>chrome.storage.local| A
```

| 消息 | 方向 | 作用 |
| --- | --- | --- |
| `prelook:fetch` | content → background | 抓取目标页并判定 `canEmbed`（响应头 XFO / CSP），返回标题/图标/HTML 供 iframe 或阅读模式渲染 |
| `prelook:openTab` | content/preview → background | 在新标签页打开（支持后台打开） |
| `prelook:preview` | background → content | 右键菜单「在预览窗/侧边栏打开」触发 |

### 一次悬停预览的数据流

1. content 命中链接 → `speculation.onIntent(url)` 预热 → 延迟定时器（悬停/Alt+悬停/长按带光标处倒计时进度条）
2. 定时器到期 → 懒建 shadow host → 插入骨架屏窗口 → 发 `prelook:fetch`
3. background 抓取并判定 `canEmbed`（12s 超时、HTML 截断 2MB）
4. 可内嵌 → 渲染 iframe（8s 未触发 load 才转阅读模式兜底）；不可内嵌 → 阅读模式（`extract.ts`，sanitize 白名单）或错误页
5. 指针移开 → 400ms 宽限后自动关闭（可被关闭触发器 / 固定状态改变）

### Shadow UI

预览窗、划词工具条、提示全在一个 `createShadowRootUi(ctx, { name: 'prelook-ui' })` 的 shadow root 内定位（`position: fixed`），由 CSS 变量 `--tp-accent / --tp-w / --tp-h / --tp-blur` 驱动外观，不改动宿主页面 DOM。

---

## 快速开始

在**仓库根目录**执行（脚本经 `pnpm -F` 转发到子包）：

```bash
pnpm install           # 安装并链接 workspace（首次克隆/目录改名后必跑）
pnpm dev:prelook       # Chrome 开发模式，产物在 apps/prelook/.output/chrome-mv3-dev/
pnpm dev:prelook:firefox   # Firefox 开发模式（firefox-mv2-dev/）
pnpm build:prelook     # 生产构建（pnpm build 聚合全部子包）
pnpm compile:prelook   # 类型检查（vue-tsc --noEmit；pnpm compile 聚合）
pnpm zip:prelook       # 打包上架 zip（zip:prelook:firefox 同）
pnpm landing:prelook   # 官网开发服务器 http://127.0.0.1:4173（CSS 就地热更新）
```

> workspace 子包的 `postinstall`（`wxt prepare`）会生成 `apps/<name>/.wxt/tsconfig.json`，`tsconfig.json` 正是 `extends` 它——**没跑过 install 就编译会失败**。

**多浏览器开发**：`wxt.config.ts` 的 `webExt.binaries` 按 `-b` 传入的浏览器名取值，新增浏览器在 `binaries` 加一条同名键 + 根 package.json 加一个 `dev:<name>` 脚本即可；非 firefox/safari 一律按 MV3 构建。Zen Browser 是例外（Firefox 内核）：把 `binaries.firefox` 指向 Zen 主程序，用 `wxt -b firefox`。

---

## 目录结构

```
apps/
  <name>/                    # 插件本体，包名 @extensions/<name>；@/ 别名指到这里
    wxt.config.ts            # manifest（权限/名称/描述/action）唯一定义处
    entrypoints/
      background.ts          # SW：fetch 预检、开标签页（消息中枢）
      content.ts             # 悬停/点击/长按判定 + Shadow UI 装配
      sidepanel/             # 设置面板（侧边栏，点工具栏图标打开）
    components/              # 跨入口复用组件（SponsorSection.vue）
    utils/                   # storage / preview / selection / extract / speculation / i18n / tracking / safety / theme / power
    public/_locales/         # 界面词条 zh_CN/messages.json + en/messages.json
    assets/icon.png          # 唯一图标源图（auto-icons 生成各尺寸）
    test/                    # repro-hover.html 回归页、demo/ 演示视频录制台
  <name>-landing/            # 落地页，包名 @extensions/<name>-landing
    index.html privacy.html  css/ js/ assets/  vite.config.js
```

---

## 核心功能（Prelook）

- **链接预览**：悬停链接浮出页面内预览窗（iframe 优先，被禁嵌站点自动切阅读模式）
- **触发方式**：悬停 / Alt+悬停 / 长按 / 拖动链接（带延迟的模式有倒计时进度条），另有右键菜单「在预览窗 / 侧边栏打开」
- **划词搜索**：选中文字弹出工具条——Web 搜索（Google / Bing / DuckDuckGo）+ AI 搜索（DeepSeek / 豆包 / Kimi / Perplexity）+ 翻译（Bing 在预览窗内、Google 在新标签页）
- **链接预热**：基于 Speculation Rules API（`document.speculationRules.addRules()`），悬停瞬间预取/预渲染目标页（Firefox 无此能力，自动降级为 no-op）
- **链接保护**：URL 跟踪参数剥离（还原中转壳 + 剥 `utm_*`/`gclid` 等自解释参数）+ 本地启发式风险提示（域名仿冒、文字与目标不符等，只提示、不拦截）
- **多窗口预览**：最多同时开 6 个预览窗，可并排比对
- **固定窗口**：头部图钉一键固定，鼠标移开也不关闭；可开「自动固定」
- **弹窗主题**：8 套配色预设（灰白 / 深色 / 浅灰 / 蓝 / 绿 / 紫 / 粉 + 自定义），卡片即窗口缩略图
- **深浅主题**：预览窗、划词条等页面内 UI 支持深色 / 浅色 / 跟随系统
- **高度可定制**：窗口尺寸（视口百分比 / 像素，可拖角调整）、位置（含侧边栏停靠）、背景模糊（百分比）、关闭触发器（点外部 / 移开指针 / 滚动）、节电模式与减少动画
- **完全免费**：无账号、无服务器、无付费版本，全部功能开放

---

## 开发工作流

- 单产品脚本见「快速开始」；`pnpm compile` / `pnpm build` 聚合全部子包。
- **新增插件接入**：建 `apps/<name>/`（可复制 prelook 骨架）→ 改 `wxt.config.ts` manifest 与包名（`@extensions/<name>`）→ 根 package.json 注册 `dev/build/zip/compile/landing:<name>` 脚本 → 建 `apps/<name>-landing/` → 把插件 `assets/icon.png` 复制一份到 landing `assets/`。
- **发布**：`release-it` 只切 `prelook-v*` tag（`release: false`）；`.github/workflows/release.yml` 在 push 该 tag 时校验版本一致性 → 类型检查 → `zip:prelook` + `zip:prelook:firefox` → 产物作为 run artifact 并挂到 draft release（商店自动提交已注释，暂未启用）。

---

## 编码约定（关键约定）

- **`tp-` 前缀是曾用名 TabPeek 的缩写，刻意保留**（预览窗的 CSS 变量/类名/host 属性共 200 多处，全在 shadow DOM 内、用户看不见，改名收益为零风险实打实，别「顺手改对」）。外部可见标识符才随改名走：包名、存储键 `local:prelook_settings`、消息前缀 `prelook:`、host 标签 `prelook-ui` 等。
- **i18n**：词条在 `public/_locales/zh_CN/messages.json` 与 `en/messages.json`，经 `browser.i18n` 读取（`utils/i18n.ts` 只是薄封装）。调用点写扁平点号 key，`_locales` 里键为下划线形式（`preview.close` → `preview_close`），改任一边都要同步；zh_CN 与 en 必须同时补齐。语言跟随浏览器 UI，**运行时不可切换**。
- **设置与存储**：`settingsItem = local:prelook_settings`。新增设置项要同时改 `PrelookSettings` + `DEFAULT_SETTINGS` + `clampSettings`，并在设置面板加控件、两个 locale 补词条。**所有读取设置的地方都要过 `clampSettings`**；延迟类设置存储恒为毫秒，面板再换算成秒。
- **manifest**：权限/名称只改各 app 的 `wxt.config.ts`；`.output/`、`.wxt/` 是生成物，不要编辑。`storage` / `browser` 是 WXT 自动导入的全局，直接裸用。
- **内容安全**：阅读模式的正文是 `innerHTML` 直接注入 shadow DOM，`extract.ts` 的 `sanitize()` 是安全边界（白名单属性、剥 `javascript:`、相对 URL 补全），不得削弱。
- **质量**：`oxlint` / `oxfmt` 用于 lint 与格式化；`vue-tsc --noEmit` 做类型检查。

---

## 测试

项目**没有自动化测试框架**（根 package.json 无 test 脚本），回归靠类型检查 + 手动复现页：

```bash
pnpm install && pnpm compile:prelook && pnpm build:prelook   # 类型 + 构建

# 词条对齐检查（zh_CN 与 en 键集合一致）
node -e "const a=Object.keys(require('./apps/prelook/public/_locales/zh_CN/messages.json')).sort(),b=Object.keys(require('./apps/prelook/public/_locales/en/messages.json')).sort();console.log('zh-only',a.filter(k=>!b.includes(k)),'en-only',b.filter(k=>!a.includes(k)))"
```

- **悬停链路回归**：改 `entrypoints/content.ts` / `utils/preview.ts` 后先 `pnpm build:prelook`，再从**仓库根目录**起静态服务器打开 `apps/prelook/test/repro-hover.html`（页面 mock chrome API + 引用 `.output` 真实产物），确认日志出现 `windows in shadow: 1`。
- **发布构建**：`release.yml` 里 push `prelook-v*` tag 时会先跑 `pnpm compile`（保证上架产物可编译），再打两个浏览器的 zip 并挂到 draft release。
- 注意：无头 + `--virtual-time-budget` 下浏览器不派发 scroll 事件也不推进 CSS 过渡，验证滚动相关行为要用实时模式。

---

## 贡献 / 新插件接入

见「开发工作流」的新插件接入清单。改代码时请遵守「编码约定」一节：词条双语同步、设置走 `clampSettings`、manifest 只动 `wxt.config.ts`、不在 shadow DOM 里引入宿主页面依赖。悬停/预览链路改动务必跑一遍 `repro-hover.html` 回归。

---

## 赞助

Prelook 收入来源只有赞助（无付费版本）：

- 爱发电 — <https://ifdian.net/a/coldstoneboy>
- Patreon — <https://patreon.com/coldstoneboy>

入口在设置面板底部（`SponsorSection.vue`）与落地页 `#sponsor` 段 + 页脚。

---

## License

本仓库目前**未声明开源许可证**（根目录无 LICENSE 文件，`package.json` 标记为私有）。
