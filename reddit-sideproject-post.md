# Reddit r/SideProject 发布帖

> 已按社区规则撰写：
> - 标题采用版规要求的格式 `[项目名] - [简短描述]`
> - 定位为「分享 + 求反馈」，避免硬推销话术
> - 不虚构下载量/评价/用户数
> - 链接以真实商店地址模板给出，上架后替换占位符即可

---

## 标题（Title）

```
[Prelook] - A hover-link preview browser extension that shows you where a link goes before you click it
```

## 正文（Body）

Prelook is a browser extension that previews a link **before** you click it — just hover, and a floating window opens with the page's real content, right where your cursor is. No more clicking into a random link, losing your place, and realizing you just wasted a tab (and your attention) on something irrelevant.

**Why I built it**

Tabs are cheap, but attention isn't. Between link-farming, redirects, and 40 open tabs, I kept losing context on the page I was actually reading. I wanted a "look before I leap" that never makes me leave the current page. This is also my first browser extension (built with WXT + Vue 3), and honestly a big part of the fun was learning how much care goes into MV3 extension engineering.

**What it does**

- **Flexible triggers** — hover, Alt+hover, long-press, or drag-to-open an in-page floating preview window; every trigger is configurable.
- **Smart preview** — renders the real target in an iframe when possible; if a site blocks embedding (X-Frame-Options / CSP), it automatically falls back to a clean **reading-mode** extraction instead of showing a dead error box.
- **Link pre-warming** — uses Speculation Rules to prefetch/prerender the target, so the page is often already loaded by the time you decide to click.
- **Text-selection tools** — select any text and search the web, query an AI assistant, or translate it, all from a little toolbar where you are.
- **Multi-window preview** — compare up to 6 links side by side.
- **Link-safety hints** — flags obvious domain-spoofing / mismatch tricks (punycode, brand lookalikes) and strips tracking parameters.
- **Privacy by default** — everything runs locally in your browser; no accounts, no sign-up, no data collection.

**Fully free**

No Pro tier, no license keys, no paywall. If it saves you time and you want to support it, there are optional sponsor links — but the extension itself is free, forever.

**Links**

- Website: https://prelook.coldstoneboy.cn/
- Chrome Web Store: https://chromewebstore.google.com/detail/prelook/bakhoimjnmigalolahgmbeflgifobeho
- Edge Add-ons: https://microsoftedge.microsoft.com/addons/detail/prelook/cfaoggmjcpfmmklonlgjbjgihnenfmmk
- Firefox Add-ons: https://addons.mozilla.org/zh-CN/firefox/addon/prelook/
- GitHub: https://github.com/xrr2016/extensions

I'd genuinely appreciate constructive feedback — what you'd add, change, or any bug you hit. This is my first extension and I really want to hear from real users. Thanks for reading!

---

## 链接占位符替换表（发布前替换）

| 用途 | 标准 URL 模板 | 说明 |
| --- | --- | --- |
| 官网 | `https://prelook.coldstoneboy.cn/` | 已填写 |
| Chrome Web Store | `https://chromewebstore.google.com/detail/prelook/bakhoimjnmigalolahgmbeflgifobeho` | 已填写 |
| Edge Add-ons | `https://microsoftedge.microsoft.com/addons/detail/prelook/cfaoggmjcpfmmklonlgjbjgihnenfmmk` | 已填写 |
| Firefox Add-ons | `https://addons.mozilla.org/zh-CN/firefox/addon/prelook/` | 已填写（英文帖可改用无语言前缀的 `https://addons.mozilla.org/firefox/addon/prelook/`） |
| GitHub | `https://github.com/xrr2016/extensions` | 已填写 |
