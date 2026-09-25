/* Prelook landing — i18n、主题切换、滚动高亮、入场动画、按钮涟漪 */
(function () {
  "use strict";

  var I18N = {
    "zh-CN": {
      "nav.features": "功能",
      "nav.install": "安装",
      "nav.sponsor": "赞助",
      "nav.faq": "FAQ",
      "nav.privacy": "隐私政策",
      "nav.github": "GitHub",
      "nav.theme": "切换深浅色主题",
      "nav.lang": "切换语言",
      "nav.menu": "菜单",
      "a11y.skip": "跳到主要内容",

      "hero.title1": "极速预览，",
      "hero.title2": "无需等待",
      "hero.desc":
        "鼠标停在链接上的瞬间，目标页已经开始加载——先预览，再决定要不要打开。",

      // 安装入口：hero 卡片组 + 页尾色带按钮组
      "install.storeLabel": "安装浏览器插件",
      "install.manualLabel": "手动下载",
      "install.manualCard": "GitHub 下载",
      "install.chrome": "Chrome 安装",
      "install.edge": "Edge 安装",
      "install.firefox": "Firefox 安装",
      "install.zipChrome": "离线包（Chrome / Edge）",
      "install.zipFirefox": "离线包（Firefox）",

      "cta.badge": "三个浏览器，同一份代码",
      "cta.title": "现在就用起来",
      "cta.sub": "装完即用，不用注册，也不用登录。",

      "features.title": "沉浸式浏览，不必来回切换",
      "features.subtitle": "十二项能力，全部本地运行，不上传任何数据",

      "f.preview.tag": "核心",
      "f.preview.t": "链接预览",
      "f.preview.d": "悬停链接即浮出内容预览，是否打开由你决定。",
      "f.preview.g1": "悬停即预览",
      "f.preview.g2": "见后再开",
      "f.warm.t": "链接预热",
      "f.warm.d": "悬停瞬间即开始预取目标页，预览与打开更快。",
      "f.warm.g1": "Speculation Rules",
      "f.warm.g2": "原生预取",
      "f.reader.t": "阅读模式",
      "f.reader.d": "无法内嵌的网站自动切换为无干扰阅读视图。",
      "f.reader.g1": "禁嵌兜底",
      "f.reader.g2": "正文提取",
      "f.multi.t": "多窗口预览",
      "f.multi.d": "最多同时打开 6 个预览窗，左右对比阅读。",
      "f.multi.g1": "最多 6 窗",
      "f.multi.g2": "并排对比",
      "f.sidebar.t": "侧边栏模式",
      "f.sidebar.d": "预览窗通高贴边，侧栏堆叠不遮挡正文。",
      "f.sidebar.g1": "通高停靠",
      "f.sidebar.g2": "左右任选",
      "f.search.t": "划词搜索",
      "f.search.d": "选中文字，一键 Google / Bing / 百度 / DuckDuckGo。",
      "f.search.g1": "4 大引擎",
      "f.search.g2": "选中即搜",
      "f.ai.t": "AI 搜索",
      "f.ai.d": "DeepSeek / 豆包 / Kimi / Perplexity，选完即问。",
      "f.ai.g1": "4 家引擎",
      "f.ai.g2": "选中即问",
      "f.track.t": "追踪参数清理",
      "f.track.d": "自动剥掉 utm、fbclid 等追踪参数，还原中转壳里的真实地址。",
      "f.track.g1": "剥离 utm",
      "f.track.g2": "还原真实链接",
      "f.safety.t": "链接风险提示",
      "f.safety.d": "仿冒域名、乱码域名、文字与目标不符时在标题栏给出提醒。",
      "f.safety.g1": "仿冒域名",
      "f.safety.g2": "文字不符",
      "f.trigger.t": "四种触发方式",
      "f.trigger.d": "悬停、Alt+悬停、长按、拖动，按习惯任选。",
      "f.trigger.g1": "Alt 组合",
      "f.trigger.g2": "长按拖动",
      "f.theme.t": "主题与外观",
      "f.theme.d": "深浅色、主题色、窗口配色、位置尺寸与背景模糊随心调。",
      "f.theme.g1": "深浅色",
      "f.theme.g2": "窗口配色",
      "f.privacy.t": "隐私本地化",
      "f.privacy.d": "无账号、无服务器，数据不出本机。",
      "f.privacy.g1": "无账号",
      "f.privacy.g2": "无服务器",

      "sponsor.title": "赞助支持",
      "sponsor.subtitle":
        "Prelook 完全免费、无账号、无服务器。如果它帮到了你，欢迎扫码赞助，支持后续开发。",
      "sponsor.wechat": "微信支付",
      "sponsor.alipay": "支付宝",

      "faq.title": "常见问题",
      "faq.subtitle": "还有疑问？先看这几条。",
      "faq.q1": "预览窗口是空白的怎么办？",
      "faq.a1":
        "部分网站禁止被内嵌，Prelook 会自动切换为阅读模式；若两者都失败，窗口会提供「在新标签页打开」按钮。",
      "faq.q2": "我的数据会被上传吗？",
      "faq.a2":
        "不会。所有预览与设置都发生在本机浏览器内，Prelook 没有账号体系，也不设任何服务器。",
      "faq.q3": "Prelook 收费吗？",
      "faq.a3":
        "完全免费，没有 Pro 版本、没有内购，也没有需要解锁的功能——包括多窗口预览在内全部开放。项目靠赞助维持，赞助纯粹出于自愿。",
      "faq.q4": "预览为什么这么快？",
      "faq.a4":
        "Prelook 使用浏览器原生的 Speculation Rules API：你悬停链接的瞬间就开始预取（甚至预渲染）目标页，预览窗打开时加载的是已经到本地的内容。这一切由浏览器自己调度，扩展不搭建任何中转服务器。",
      "faq.q5": "会不会拖慢浏览器？",
      "faq.a5":
        "不会常驻开销。预热只在指针停留在链接上时触发，指针离开就取消；「性能」里还提供节电模式，可以在用电池时自动关掉预热与背景模糊。",

      "footer.about": "Prelook 悬停即预览，不必再点开。",
      "footer.slogan": "悬停即预览，不必再点开。",
      "footer.links": "快速链接",
      "footer.contact": "联系我们",
      "footer.privacy": "隐私政策",
      "footer.rights": "保留所有权利",
      "footer.top": "回到顶部",
    },

    en: {
      "nav.features": "Features",
      "nav.install": "Install",
      "nav.sponsor": "Sponsor",
      "nav.faq": "FAQ",
      "nav.privacy": "Privacy Policy",
      "nav.github": "GitHub",
      "nav.theme": "Toggle color theme",
      "nav.lang": "Switch language",
      "nav.menu": "Menu",
      "a11y.skip": "Skip to content",

      // 与 zh-CN 那两条逐字对齐："极速预览，无需等待"。
      // title1 结尾的逗号 + 空格不能省：拼接后是 "Fast preview, no waiting"，
      // 少了这个空格两段会粘成 "preview,no"。中文那边同理用的是全角「，」。
      "hero.title1": "Fast preview, ",
      "hero.title2": "no waiting",
      "hero.desc":
        "The instant your cursor lands on a link, its page is already loading — preview first, decide after.",

      // Install entries: hero card groups + closing band buttons
      "install.storeLabel": "Install the extension",
      "install.manualLabel": "Manual download",
      "install.manualCard": "Download from GitHub",
      "install.chrome": "Install for Chrome",
      "install.edge": "Install for Edge",
      "install.firefox": "Install for Firefox",
      "install.zipChrome": "Offline (Chrome / Edge)",
      "install.zipFirefox": "Offline (Firefox)",

      "cta.badge": "Three browsers, one codebase",
      "cta.title": "Get it running today",
      "cta.sub": "Install and go — no sign-up, no login.",

      "features.title": "Immersive browsing, without the back-and-forth",
      "features.subtitle": "Twelve features, all local — nothing is uploaded",

      "f.preview.tag": "Core",
      "f.preview.t": "Link preview",
      "f.preview.d":
        "Hover any link to peek its content; you decide whether to open it.",
      "f.preview.g1": "Peek on hover",
      "f.preview.g2": "Decide after",
      "f.warm.t": "Link warm-up",
      "f.warm.d":
        "Hovered links are prefetched via Speculation Rules for instant previews.",
      "f.warm.g1": "Speculation Rules",
      "f.warm.g2": "Native prefetch",
      "f.reader.t": "Reader mode",
      "f.reader.d":
        "Sites that block embedding are shown as clean article views.",
      "f.reader.g1": "Embed fallback",
      "f.reader.g2": "Article extraction",
      "f.multi.t": "Multi-window preview",
      "f.multi.d": "Open up to 6 previews side by side for comparison reading.",
      "f.multi.g1": "Up to 6 windows",
      "f.multi.g2": "Side by side",
      "f.sidebar.t": "Sidebar mode",
      "f.sidebar.d": "Dock previews full height to either edge, stacked.",
      "f.sidebar.g1": "Full-height dock",
      "f.sidebar.g2": "Left or right",
      "f.search.t": "Selection search",
      "f.search.d":
        "Select text — Google / Bing / Baidu / DuckDuckGo in one click.",
      "f.search.g1": "4 engines",
      "f.search.g2": "Search on select",
      "f.ai.t": "AI search",
      "f.ai.d": "DeepSeek / Doubao / Kimi / Perplexity, ask right away.",
      "f.ai.g1": "4 engines",
      "f.ai.g2": "Ask on select",
      "f.track.t": "Tracking cleanup",
      "f.track.d":
        "Strips utm, fbclid and friends, and unwraps redirect shells back to the real address.",
      "f.track.g1": "Strips utm",
      "f.track.g2": "Unwraps redirects",
      "f.safety.t": "Link risk hints",
      "f.safety.d":
        "Flags look-alike domains, punycode hosts and link text that points somewhere else.",
      "f.safety.g1": "Look-alike domains",
      "f.safety.g2": "Text mismatch",
      "f.trigger.t": "Four trigger modes",
      "f.trigger.d":
        "Hover, Alt+hover, long-press or drag — pick what feels natural.",
      "f.trigger.g1": "Alt combos",
      "f.trigger.g2": "Long-press and drag",
      "f.theme.t": "Themes and appearance",
      "f.theme.d":
        "Light or dark, accent color, window palettes, position, size and backdrop blur.",
      "f.theme.g1": "Light and dark",
      "f.theme.g2": "Window palettes",
      "f.privacy.t": "Privacy-first",
      "f.privacy.d": "No account, no server — data never leaves your device.",
      "f.privacy.g1": "No account",
      "f.privacy.g2": "No server",

      "sponsor.title": "Support the project",
      "sponsor.subtitle":
        "Prelook is completely free — no account, no server. If it helps you, scan a QR code to keep development going.",
      "sponsor.wechat": "WeChat Pay",
      "sponsor.alipay": "Alipay",

      "faq.title": "FAQ",
      "faq.subtitle": "Still curious? Start here.",
      "faq.q1": "The preview window is blank — what now?",
      "faq.a1":
        "Some sites forbid embedding; Prelook switches to reader mode automatically. If both fail, the window offers an open-in-new-tab button.",
      "faq.q2": "Is my data uploaded?",
      "faq.a2":
        "No. Previews and settings live entirely in your browser — no accounts, no servers.",
      "faq.q3": "Does Prelook cost anything?",
      "faq.a3":
        "It is completely free: no Pro tier, no in-app purchases, no locked features — multi-window previews included. The project runs on sponsorships, which are purely optional.",
      "faq.q4": "Why are the previews so fast?",
      "faq.a4":
        "Prelook uses the browser-native Speculation Rules API: the moment you hover a link, prefetching (or prerendering) begins, so the preview window shows content that has already arrived locally. The browser does all the scheduling — the extension runs no servers.",
      "faq.q5": "Will it slow my browser down?",
      "faq.a5":
        "There is no constant overhead. Warm-up fires only while the pointer rests on a link and is cancelled when it leaves; a built-in power-saver mode can drop warm-up and backdrop blur automatically on battery.",

      "footer.about":
        "Prelook is a free extension by 冷石Boy that puts previews right in the browser.",
      "footer.slogan": "Peek first, click later.",
      "footer.links": "Links",
      "footer.contact": "Contact",
      "footer.privacy": "Privacy Policy",
      "footer.rights": "All rights reserved",
      "footer.top": "Back to top",
    },
  };

  var TITLES = {
    "zh-CN": "Prelook — 悬停链接即预览，不必再点开",
    en: "Prelook — Preview any link without leaving the page",
  };

  var DESCRIPTIONS = {
    "zh-CN":
      "Prelook：悬停链接即预览，链接预热秒开，禁嵌站点自动转阅读模式。划词搜索、AI 搜索、多窗口对比，十二项能力全部本地运行，免费且无需账号。",
    en: "Prelook: hover any link to preview it instantly — prefetch on hover, reader mode for embed-blocked sites, selection search, AI search, multi-window compare. Twelve features, all local, free, no account.",
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
  var current =
    savedLang && LANGS.indexOf(savedLang) >= 0 ? savedLang : "zh-CN";

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
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var ph = dict[el.getAttribute("data-i18n-ph")];
      if (ph !== undefined) el.setAttribute("placeholder", ph);
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
  var media = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function chosenTheme() {
    var stored = readStore(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  }

  function systemTheme() {
    return media && media.matches ? "dark" : "light";
  }

  // 移动端地址栏颜色跟主题走（<head> 内联脚本负责首帧，这里负责后续切换）
  var metaTheme = document.getElementById("metaThemeColor");
  function applyMetaTheme(theme) {
    if (metaTheme)
      metaTheme.setAttribute(
        "content",
        theme === "dark" ? "#111318" : "#f8f9fb",
      );
  }

  // aria-pressed 表达当前是否处于深色状态
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

  // 用户没手动选过就跟着系统走（首帧由 <head> 内联脚本负责）
  if (media) {
    var onSystemChange = function () {
      if (!chosenTheme()) {
        var next = systemTheme();
        root.setAttribute("data-theme", next);
        applyMetaTheme(next);
        syncThemeButton();
      }
    };
    if (media.addEventListener)
      media.addEventListener("change", onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  /* ---------- 移动端菜单 ---------- */
  var burger = document.getElementById("navBurger");
  var navMenu = document.getElementById("navMenu");

  function closeNavMenu() {
    if (!navMenu) return;
    navMenu.classList.remove("open");
    if (burger) burger.setAttribute("aria-expanded", "false");
  }

  if (burger && navMenu) {
    burger.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // 点面板外、按 Esc、点任一链接、窗口拉宽，都收起菜单
    document.addEventListener("click", function (event) {
      if (
        navMenu.classList.contains("open") &&
        !event.target.closest(".navbar")
      )
        closeNavMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNavMenu();
    });
    navMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNavMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 880) closeNavMenu();
    });
  }

  /* ---------- 滚动高亮当前区块 ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-menu .nav-link"),
  );
  var spySections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  var SPY_OFFSET = 80; // 与 CSS 的 scroll-margin-top 保持一致

  function updateActiveNav() {
    if (!spySections.length) return;

    var scrollPos = window.scrollY + SPY_OFFSET + 1;
    var activeId = "";

    spySections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) activeId = section.id;
    });

    // 滚到底部时高亮最后一项：页脚较矮，否则永远点不亮。
    // 先确认页面真的能滚——加载途中文档还没被撑高时，"0 + 视口高 >= 文档高"
    // 会成立，于是最后一项（现在是「安装」）会在首屏被误点亮，且要等到下一次
    // 成功的滚动更新才纠正。
    var canScroll =
      document.documentElement.scrollHeight > window.innerHeight + 4;
    var isAtBottom =
      canScroll &&
      window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
    if (isAtBottom) activeId = spySections[spySections.length - 1].id;

    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + activeId;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  var spyTicking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (spyTicking) return;
      spyTicking = true;
      requestAnimationFrame(function () {
        updateActiveNav();
        sweepReveals();
        updateToTop();
        spyTicking = false;
      });
    },
    { passive: true },
  );
  window.addEventListener("resize", function () {
    updateActiveNav();
    sweepReveals();
  });
  updateActiveNav();

  /* ---------- 浮动回到顶部 ---------- */
  var toTopBtn = document.querySelector(".to-top");
  function updateToTop() {
    if (!toTopBtn) return;
    toTopBtn.classList.toggle("is-visible", window.scrollY > 400);
  }
  if (toTopBtn) {
    toTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    updateToTop();
  }

  /* ---------- 滚动入场 ---------- */
  var revealTargets = []
    .concat(
      Array.prototype.slice.call(document.querySelectorAll(".section-header")),
    )
    .concat(
      Array.prototype.slice.call(
        document.querySelectorAll(".features-grid .feature-card"),
      ),
    )
    .concat(
      Array.prototype.slice.call(
        document.querySelectorAll(".sponsor-grid .sponsor-tile"),
      ),
    )
    .concat(
      Array.prototype.slice.call(
        document.querySelectorAll(".faq-list details"),
      ),
    )
    .concat(
      Array.prototype.slice.call(
        document.querySelectorAll(".cta-copy, .cta-art"),
      ),
    )
    .concat(
      Array.prototype.slice.call(document.querySelectorAll(".footer-content")),
    );

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealObserver = null;
  var pendingReveals = [];

  function revealNow(el) {
    el.classList.add("is-visible");
    if (revealObserver) revealObserver.unobserve(el);
  }

  // IntersectionObserver 是"采样"而不是"穿越检测"：快速滚动时某些区块可能
  // 整段跨过视口却一次都没被采样到，那样它会一直停在 opacity:0。
  // 每次滚动再用几何位置兜一遍底，凡是已经进入（或越过）视口的直接点亮。
  function sweepReveals() {
    if (!pendingReveals.length) return;
    var limit = window.innerHeight * 0.92;
    pendingReveals = pendingReveals.filter(function (el) {
      if (el.getBoundingClientRect().top >= limit) return true;
      revealNow(el);
      return false;
    });
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    // 同组卡片按序号错峰出现（最多 350ms），避免整片一起闪
    [".features-grid", ".sponsor-grid"].forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      Array.prototype.slice
        .call(group.children)
        .forEach(function (child, index) {
          child.style.setProperty(
            "--reveal-delay",
            Math.min(index, 5) * 70 + "ms",
          );
        });
    });

    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
    });
    pendingReveals = revealTargets.slice();

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          var i = pendingReveals.indexOf(entry.target);
          if (i >= 0) pendingReveals.splice(i, 1);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
    sweepReveals();
  }

  /* ---------- 按钮涟漪 ---------- */
  if (!reduceMotion) {
    document.addEventListener("pointerdown", function (event) {
      var btn = event.target.closest ? event.target.closest(".btn") : null;
      if (!btn) return;

      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = size + "px";
      ripple.style.height = size + "px";
      ripple.style.left = event.clientX - rect.left - size / 2 + "px";
      ripple.style.top = event.clientY - rect.top - size / 2 + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", function () {
        ripple.remove();
      });
    });
  }
})();
