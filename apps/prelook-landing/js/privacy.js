/* Prelook landing — 隐私政策页：主题切换 + 中英语言切换 */
(function () {
  "use strict";

  var I18N = {
    "zh-CN": {
      "a11y.skip": "跳到主要内容",
      "pr.nav.home": "返回首页",
      "pr.nav.theme": "切换深浅色主题",
      "pr.nav.lang": "切换语言",

      "pr.title": "Prelook 隐私政策",
      "pr.effective": "生效日期：2026 年 9 月 20 日",
      "pr.lead": "感谢你使用 Prelook。本政策说明 Prelook 浏览器扩展（下称「扩展」）以及 Prelook 官网（下称「网站」）如何处理你的数据。",
      "pr.summary": "一句话概括：Prelook 不收集你的任何个人信息。扩展没有账号体系、不设自有服务器，所有设置与绝大多数处理都在你的设备本地完成。",

      "pr.s1t": "1. 我们收集什么",
      "pr.s1p1": "我们不收集任何个人身份信息。Prelook 不采集浏览历史、不追踪上网行为、不读取通讯录或文件，也不向开发者或任何第三方服务器上传任何数据。",
      "pr.s1p2": "扩展不包含广告、不包含远程代码、不加载外部脚本，全部功能免费。",

      "pr.s2t": "2. 扩展处理的数据",
      "pr.s2intro": "扩展仅在本地处理下列数据，用于实现其核心功能：",
      "pr.s2li1t": "设置",
      "pr.s2li1d": "你的偏好设置（触发方式、预览窗尺寸、主题、搜索引擎等）保存在浏览器本地的 chrome.storage.local 中，仅存于你的设备，不会上传。卸载扩展即删除。",
      "pr.s2li2t": "悬停链接的 URL 与目标页内容",
      "pr.s2li2d": "当你悬停、长按、拖动或通过右键菜单触发预览时，扩展会读取该链接地址，并由后台直接向目标网站请求页面内容，用于在预览窗中渲染（可内嵌时用 iframe，禁嵌站点自动切换阅读模式）。该请求不带你的 Cookie（credentials: 'omit'），由扩展直接从你的浏览器发往目标网站，不经过任何中转服务器。",
      "pr.s2li3t": "链接预热",
      "pr.s2li3d": "当你开启预热后，悬停的链接会通过浏览器原生的 Speculation Rules API 预取或预渲染，由浏览器直接向目标网站发起请求。你可以在扩展「性能」设置中随时关闭。",
      "pr.s2li4t": "划词搜索与翻译",
      "pr.s2li4d": "当你选中文字并点击搜索或翻译按钮时，选中文字会按你的选择发送给对应的搜索引擎或翻译服务（Google、Bing、DuckDuckGo、DeepSeek、豆包、Kimi、Perplexity、Google 翻译、Bing 翻译等）。这是你主动触发的操作；其中 DeepSeek、豆包、Kimi 三家仅打开其首页，文字由扩展复制到你的剪贴板、由你自行粘贴。",
      "pr.s2li5t": "追踪参数清理与链接风险提示",
      "pr.s2li5d": "剥离 utm_*、fbclid 等追踪参数、还原中转壳地址、判定链接是否存在仿冒风险，全部在本机完成，不发送任何数据。",

      "pr.s3t": "3. 数据的存储",
      "pr.s3li1": "扩展设置存储于浏览器本地存储（chrome.storage.local）；",
      "pr.s3li2": "网站的主题与语言偏好存储于你浏览器的 localStorage；",
      "pr.s3li3": "以上数据均不离开你的设备。",

      "pr.s4t": "4. 第三方服务",
      "pr.s4p1": "划词搜索、AI 搜索与翻译在你主动触发时，会将你选中的文字发送给你选择的第三方服务。这些服务分别适用其各自的隐私政策：Google（policies.google.com/privacy）、Microsoft Bing（privacy.microsoft.com）、DuckDuckGo（duckduckgo.com/privacy），以及 DeepSeek、豆包、Kimi、Perplexity 各服务官网的隐私政策。",
      "pr.s4p2": "扩展本身不向这些服务之外的任何第三方披露你的数据。",

      "pr.s5t": "5. 权限说明",
      "pr.s5intro": "扩展申请的权限均用于实现核心功能：",
      "pr.s5li1": "storage：在本地保存你的设置；",
      "pr.s5li2": "tabs 与 contextMenus：在新标签页打开目标、提供右键菜单；",
      "pr.s5li3": "<all_urls> 主机权限：预览功能需要对任意悬停的链接发起预览请求（请求不带 Cookie）。",

      "pr.s6t": "6. 数据安全",
      "pr.s6p1": "扩展代码开源、全部功能免费，不包含远程代码、不加载外部脚本、不投放广告。由于数据几乎不离开你的设备，本地数据的安全取决于你设备本身的安全状况。",

      "pr.s7t": "7. 你的选择与控制",
      "pr.s7li1": "你可以随时在扩展设置中关闭预热、划词搜索等功能；",
      "pr.s7li2": "卸载扩展会删除其全部本地数据；",
      "pr.s7li3": "网站的主题与语言偏好可在浏览器设置中清除站点数据后重置。",

      "pr.s8t": "8. 政策更新",
      "pr.s8p1": "如本政策发生变更，我们会在此页面发布更新版本，并在页面顶部注明生效日期。",

      "pr.s9t": "9. 联系我们",
      "pr.s9p1": "如对本政策有任何疑问，可通过 GitHub（github.com/coldstoneboy）与我们联系。",

      "pr.foot.home": "首页",
      "pr.foot.privacy": "隐私政策",
      "pr.foot.rights": "保留所有权利",
      "pr.foot.top": "回到顶部",
    },

    en: {
      "a11y.skip": "Skip to content",
      "pr.nav.home": "Home",
      "pr.nav.theme": "Toggle color theme",
      "pr.nav.lang": "Switch language",

      "pr.title": "Prelook Privacy Policy",
      "pr.effective": "Effective date: September 20, 2026",
      "pr.lead": "Thank you for using Prelook. This policy explains how the Prelook browser extension (the “Extension”) and the Prelook website (the “Site”) handle your data.",
      "pr.summary": "In one sentence: Prelook does not collect any of your personal information. The Extension has no accounts and runs no servers — all settings and nearly all processing happen locally on your device.",

      "pr.s1t": "1. What we collect",
      "pr.s1p1": "We do not collect any personally identifiable information. Prelook does not read your browsing history, track your activity, access your contacts or files, or upload any data to the developer or any third-party server.",
      "pr.s1p2": "The Extension contains no ads, no remote code and no external scripts, and every feature is free.",

      "pr.s2t": "2. Data the Extension processes",
      "pr.s2intro": "The Extension processes the following data locally, solely to provide its core features:",
      "pr.s2li1t": "Settings",
      "pr.s2li1d": "Your preferences (trigger mode, preview size, theme, search engines, etc.) are stored in chrome.storage.local in your browser — on your device only, never uploaded. Uninstalling the Extension deletes them.",
      "pr.s2li2t": "Hovered link URLs and target page content",
      "pr.s2li2d": "When you hover, long-press, drag or use the context menu to trigger a preview, the Extension reads the link address and its background script requests the page content directly from the target site, so it can be rendered in the preview window (iframe when embeddable, automatic reader mode for sites that block embedding). The request carries no cookies (credentials: 'omit') and goes straight from your browser to the target site through no intermediary server.",
      "pr.s2li3t": "Link warm-up",
      "pr.s2li3d": "When warm-up is enabled, hovered links are prefetched or prerendered via the browser-native Speculation Rules API, and the browser sends those requests directly to the target site. You can turn this off at any time in the Extension's Performance settings.",
      "pr.s2li4t": "Selection search and translation",
      "pr.s2li4d": "When you select text and click a search or translate button, the selected text is sent, per your choice, to the matching search engine or translation service (Google, Bing, DuckDuckGo, DeepSeek, Doubao, Kimi, Perplexity, Google Translate, Bing Translator, etc.). This only happens when you explicitly trigger it; for DeepSeek, Doubao and Kimi the Extension merely opens their home page and copies the text to your clipboard for you to paste.",
      "pr.s2li5t": "Tracking cleanup and link risk hints",
      "pr.s2li5d": "Stripping utm_* and fbclid parameters, unwrapping redirect shells, and flagging potentially spoofed links all happen locally — no data is sent anywhere.",

      "pr.s3t": "3. Where data is stored",
      "pr.s3li1": "Extension settings are kept in the browser's local storage (chrome.storage.local);",
      "pr.s3li2": "The Site's theme and language preferences are kept in your browser's localStorage;",
      "pr.s3li3": "None of this data ever leaves your device.",

      "pr.s4t": "4. Third-party services",
      "pr.s4p1": "Selection search, AI search and translation send your selected text to the third-party service you choose, only when you trigger them. Those services are governed by their own privacy policies: Google (policies.google.com/privacy), Microsoft Bing (privacy.microsoft.com), DuckDuckGo (duckduckgo.com/privacy), and the policies on the official sites of DeepSeek, Doubao, Kimi and Perplexity.",
      "pr.s4p2": "The Extension discloses your data to no third party beyond those services.",

      "pr.s5t": "5. Permissions",
      "pr.s5intro": "Every permission the Extension requests exists to power a core feature:",
      "pr.s5li1": "storage — to keep your settings on your device;",
      "pr.s5li2": "tabs and contextMenus — to open targets in new tabs and provide the context menu;",
      "pr.s5li3": "<all_urls> host permission — previews need to request any link you hover (cookies are not sent).",

      "pr.s6t": "6. Data security",
      "pr.s6p1": "The Extension's code is open source and free, contains no remote code, loads no external scripts and shows no ads. Because the data barely leaves your device, the security of local data depends on the security of your own device.",

      "pr.s7t": "7. Your choices and control",
      "pr.s7li1": "You can disable warm-up, selection search and other features at any time in the Extension's settings;",
      "pr.s7li2": "Uninstalling the Extension removes all of its local data;",
      "pr.s7li3": "The Site's theme and language preferences reset when you clear site data in your browser settings.",

      "pr.s8t": "8. Changes to this policy",
      "pr.s8p1": "If this policy changes, we will publish the updated version on this page and note the effective date at the top.",

      "pr.s9t": "9. Contact",
      "pr.s9p1": "If you have any questions about this policy, reach us on GitHub (github.com/coldstoneboy).",

      "pr.foot.home": "Home",
      "pr.foot.privacy": "Privacy Policy",
      "pr.foot.rights": "All rights reserved",
      "pr.foot.top": "Back to top",
    },
  };

  var TITLES = {
    "zh-CN": "Prelook 隐私政策",
    en: "Prelook Privacy Policy",
  };

  var DESCRIPTIONS = {
    "zh-CN":
      "Prelook 隐私政策：扩展不收集任何个人信息，无账号、无服务器，所有设置与处理均在本机完成。",
    en: "Prelook Privacy Policy: the extension collects no personal information — no accounts, no servers; all settings and processing stay on your device.",
  };

  var LANG_KEY = "prelook-landing-lang";
  var THEME_KEY = "prelook-landing-theme";
  var LANGS = ["zh-CN", "en"];

  function readStore(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null; /* 隐私模式下存储不可用 */
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* 忽略 */
    }
  }

  /* ---------- 语言 ---------- */
  var savedLang = readStore(LANG_KEY);
  var current = savedLang && LANGS.indexOf(savedLang) >= 0 ? savedLang : "zh-CN";

  var langBtn = document.getElementById("langToggle");

  function applyLang() {
    var dict = I18N[current];

    document.documentElement.lang = current;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var text = dict[el.getAttribute("data-i18n")];
      if (text !== undefined) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var label = dict[el.getAttribute("data-i18n-aria")];
      if (label !== undefined) el.setAttribute("aria-label", label);
    });

    if (langBtn) {
      langBtn.textContent = current === "zh-CN" ? "EN" : "中文";
      langBtn.setAttribute("lang", current === "zh-CN" ? "en" : "zh-CN");
    }
    document.title = TITLES[current];
    var desc = document.getElementById("metaDescription");
    if (desc && DESCRIPTIONS[current])
      desc.setAttribute("content", DESCRIPTIONS[current]);
    writeStore(LANG_KEY, current);
  }

  if (langBtn) {
    langBtn.addEventListener("click", function () {
      current = current === "zh-CN" ? "en" : "zh-CN";
      applyLang();
    });
  }
  applyLang();

  /* ---------- 主题 ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function chosenTheme() {
    var stored = readStore(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  }

  function systemTheme() {
    return media && media.matches ? "dark" : "light";
  }

  var metaTheme = document.getElementById("metaThemeColor");
  function applyMetaTheme(theme) {
    if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#111318" : "#f8f9fb");
  }

  function syncThemeButton() {
    if (!themeBtn) return;
    themeBtn.setAttribute(
      "aria-pressed",
      root.getAttribute("data-theme") === "dark" ? "true" : "false",
    );
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      writeStore(THEME_KEY, next);
      applyMetaTheme(next);
      syncThemeButton();
    });
    syncThemeButton();
  }

  if (media) {
    var onSystemChange = function () {
      if (!chosenTheme()) {
        var next = systemTheme();
        root.setAttribute("data-theme", next);
        applyMetaTheme(next);
        syncThemeButton();
      }
    };
    if (media.addEventListener) media.addEventListener("change", onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }
})();
