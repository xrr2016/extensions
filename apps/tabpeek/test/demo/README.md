# 演示视频录制台

落地页 hero 右侧那段视频（`apps/tabpeek-landing/assets/demo.mp4`）从这里录出来。

录它**不需要把扩展装进浏览器**。`index.html` 是一个真实感的博客文章页，自己带一份
`mock.js` 顶掉 background，然后原样加载 `.output/chrome-mv3/content-scripts/content.js`
——所以画面里的倒计时进度条、预览窗、开窗动效、阅读模式兜底全是线上那份代码，
只有 `tabpeek:fetch` 的响应来自 `mock.js` 里的表。这样录制是离线且可重复的，也不受
被预览站点 `X-Frame-Options` 的影响。

## 文件

| 文件                             | 用途                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| `index.html`                     | 被录的宿主页（「比特手记」那篇文章），内嵌 `mock.js` + 真实 content.js   |
| `mock.js`                        | chrome API 替身；同时预置 `tabpeek_settings` 与 `tabpeek:fetch` 的应答表 |
| `demo.css`                       | 宿主页样式                                                              |
| `article-1.html` / `article.css` | 预览窗 iframe 里真正渲染的那篇文章                                      |
| `favicon-*.svg`                  | 预览窗标题栏里的小图标                                                  |

两个被悬停的链接：

- `#link-internal` → `article-1.html`（同源，`canEmbed: true`，走 iframe 预览）
- `#link-external` → MDN 的 Speculation Rules 文档（`mock.js` 里标成 `canEmbed: false`，
  走阅读模式，标题栏会出现「阅读模式」徽章）

`#link-internal` 的 href 由一段内联脚本按当前端口算出来，并且把 `127.0.0.1` 换成
`localhost`：IP 字面量主机正是 TabPeek 自己的风险提示会点亮的那一条，那样录出来标题栏会
挂一个 ⚠ 徽章，那是录制环境的产物而不是链接本身的问题。

## 重录

```bash
pnpm build:tabpeek                                   # 先出最新产物，录的是 .output 里的 content.js
cd <仓库根> && python -m http.server 4180 --bind 127.0.0.1
```

在内置浏览器里打开 `http://127.0.0.1:4180/apps/tabpeek/test/demo/index.html`，视口 1200×800，
然后按下面的动作表录（`showCursor: true`，`fps: 25`，`settleMs: 900`）：

```js
[
  { type: 'move', x: 150, y: 470, durationMs: 550, delayAfterMs: 450 }, // 从左侧页边进场
  { type: 'move', x: 402, y: 250, durationMs: 450, delayAfterMs: 150 }, // 挪到链接正上方
  { type: 'move', x: 402, y: 320, durationMs: 260, delayAfterMs: 3900 }, // 落进链接：倒计时→开窗→停留
  { type: 'move', x: 960, y: 140, durationMs: 620, delayAfterMs: 1200 }, // 移开，窗口关闭
  { type: 'move', x: 687, y: 500, durationMs: 450, delayAfterMs: 150 },
  { type: 'move', x: 687, y: 577, durationMs: 260, delayAfterMs: 3900 }, // 第二个链接：阅读模式
  { type: 'move', x: 140, y: 700, durationMs: 620, delayAfterMs: 1400 },
]
```

两个必须踩对的坑：

- **窗口位置由"指针进入链接的那一点"决定，不是终点。** `beginHover()` 记的是
  `pointerover` 那一刻的 `clientX`，之后在同一个链接内部移动不会再触发 pointerover。
  所以要让窗口落在预期位置，就**从链接正上方竖直落进去**（先移到同一个 x、更小的 y，再下移）。
  横着滑进去会在链接的左/右边缘就记下坐标，窗口整体偏掉 200–300px。
- **录制期间 `requestAnimationFrame` 必须真的在跑**，否则 `open()` 里那两帧 rAF 回调不会执行、
  `.tp-in` 加不上，窗口会一直停在 `opacity: 0`——录出来是"什么都没有"。开始前先
  `await (await browser.capabilities.get("visibility")).set(true)`，并确认页面里
  `requestAnimationFrame` 能回调。验证时再看一眼抽帧，别只看录制的 `status`。

## 转码与裁剪

```bash
# 全画幅交付件（保留为原始证据）
ffmpeg -y -i recordings/tabpeek-demo.webm \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 25 -movflags +faststart -an \
  recordings/tabpeek-demo.mp4

# 落地页那一版：裁掉顶部导航，让预览窗在 hero 里占得更大
ffmpeg -y -i recordings/tabpeek-demo.webm -vf "crop=928:700:80:76" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -r 25 -movflags +faststart -an \
  ../../tabpeek-landing/assets/demo.mp4

# poster 取"窗口已经开着"的那一帧
ffmpeg -y -ss 5.2 -i recordings/tabpeek-demo.webm -vf "crop=928:700:80:76" -frames:v 1 \
  -c:v libwebp -quality 82 ../../tabpeek-landing/assets/demo-poster.webp
```

裁剪框来自窗口的实际落位：内部链接那窗在 x 102–702、外部链接那窗在 x 387–987，y 上取标题
（86）下取窗口底（746），于是 `crop=928:700:80:76`。**改文案、改 `mock.js` 里的
`width`/`height`、或换视口之后都要重新量再改这个框**，否则会切掉窗口的一条边。
