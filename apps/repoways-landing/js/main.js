(function () {
  "use strict";

  // 词典与 prelook-landing 同一套约定：data-i18n 属性 + 这里的一份 I18N 对象，
  // zh-CN 与 en 必须同步补齐；data-i18n-aria 负责无障碍标签。
  var I18N = {
    "zh-CN": {
      "meta.title": "RepoWays — GitHub 仓库的 12 种打开方式",
      "meta.description":
        "RepoWays 在 GitHub 仓库页的 Code 按钮旁加一枚 Ways 按钮，一键调用能读懂它、图解它、运行它的 12 个工具。免费、开源、零权限。",
      "nav.features": "功能",
      "nav.lang": "切换语言",
      "nav.theme": "切换深浅色",
      "nav.github": "GitHub 仓库",
      "hero.badge": "免费 · 开源 · 零权限",
      "hero.title": "GitHub 仓库的 12 种打开方式",
      "hero.sub": "在任意 GitHub 仓库页一键调用能读懂它、图解它、运行它的工具。",
      "hero.cta": "立即安装",
      "hero.offline": "下载离线包",
      "hero.installMore": "选择其他商店",
      "hero.installOther": "其他商店",
      "features.title": "十二条入口，按你要做的事分四组",
      "features.sub": "菜单里的每一条都是普通链接——点了才跳转，不碰任何抓取。",
      "group.structure": "看懂结构",
      "group.ai": "交给 AI",
      "group.code": "读、改、跑",
      "group.analytics": "看活跃度",
      "way.gitdiagram": "生成架构图",
      "way.depgraph": "看依赖图",
      "way.deepwiki": "看 AI 讲解",
      "way.zread": "看 Zread 导读",
      "way.gitreverse": "导出 AI 提示词",
      "way.gitmcp": "文档转 MCP",
      "way.gitingest": "打包给 AI",
      "way.github1s": "读代码",
      "way.githubdev": "改代码",
      "way.codespaces": "云端开发",
      "way.stackblitz": "跑项目",
      "way.ossinsight": "看活跃度",
      "footer.about": "在 GitHub 仓库页，一键换种方式打开它。",
      "footer.links": "快速链接",
      "footer.contact": "联系",
      "footer.support": "支持",
      "footer.feedback": "反馈与功能许愿",
      "footer.issues": "报告问题",
      "footer.privacy": "隐私政策",
      "footer.rights": "保留所有权利",
      "cta.title": "现在就用起来",
      "cta.sub": "装完即用，不用注册，也不用登录。",
      "store.chrome": "Chrome 应用商店",
      "store.edge": "Edge 扩展",
      "store.firefox": "Firefox 扩展",
    },
    en: {
      "meta.title": "RepoWays — 12 ways to open any GitHub repo",
      "meta.description":
        "RepoWays adds a Ways button next to Code on any GitHub repository page — one click to reach the tools that read, diagram and run it. Free, open source, zero permissions.",
      "nav.features": "Features",
      "nav.lang": "Switch language",
      "nav.theme": "Toggle theme",
      "nav.github": "GitHub repository",
      "hero.badge": "Free · Open source · Zero permissions",
      "hero.title": "12 ways to open any GitHub repo",
      "hero.sub":
        "One click on any GitHub repository to open it with the tools that read, diagram and run it.",
      "hero.cta": "Install now",
      "hero.offline": "Download offline package",
      "hero.installMore": "Choose another store",
      "hero.installOther": "Other stores",
      "features.title": "Twelve entries, in four groups",
      "features.sub":
        "Every row in the menu is a plain link — it only opens when you click it. Nothing is scraped.",
      "group.structure": "Understand it",
      "group.ai": "Feed it to AI",
      "group.code": "Read, edit, run",
      "group.analytics": "Repo pulse",
      "way.gitdiagram": "Architecture diagram",
      "way.depgraph": "List dependencies",
      "way.deepwiki": "AI explainer",
      "way.zread": "Zread walkthrough",
      "way.gitreverse": "AI prompts",
      "way.gitmcp": "Docs as MCP",
      "way.gitingest": "Package for AI",
      "way.github1s": "Read code",
      "way.githubdev": "Edit code",
      "way.codespaces": "Dev environment",
      "way.stackblitz": "Run project",
      "way.ossinsight": "Repo activity",
      "footer.about": "On any GitHub repo, open it a different way.",
      "footer.links": "Quick links",
      "footer.contact": "Contact",
      "footer.support": "Support",
      "footer.feedback": "Feedback & feature requests",
      "footer.issues": "Report an issue",
      "footer.privacy": "Privacy policy",
      "footer.rights": "All rights reserved",
      "cta.title": "Get started now",
      "cta.sub": "Install and go — no sign-up, no login.",
      "store.chrome": "Chrome Web Store",
      "store.edge": "Edge Extension",
      "store.firefox": "Firefox Extension",
    },
  };

  var LANG_KEY = "repoways-landing-lang";
  var stored = null;
  try {
    stored = localStorage.getItem(LANG_KEY);
  } catch {
    /* 隐私模式下存储不可用 */
  }
  var detected = window.__repowaysDetectedLang || "zh-CN";
  var current = stored === "zh-CN" || stored === "en" ? stored : detected;

  var langBtn = document.getElementById("langToggle");

  function applyLang() {
    var dict = I18N[current];
    document.documentElement.lang = current;
    document.title = dict["meta.title"];
    var meta = document.getElementById("metaDescription");
    if (meta) meta.setAttribute("content", dict["meta.description"]);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var text = dict[el.getAttribute("data-i18n")];
      if (text != null) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var label = dict[el.getAttribute("data-i18n-aria")];
      if (label != null) el.setAttribute("aria-label", label);
    });
    if (langBtn) {
      langBtn.textContent = current === "zh-CN" ? "EN" : "中文";
      langBtn.setAttribute("lang", current === "zh-CN" ? "en" : "zh-CN");
    }
  }

  if (langBtn) {
    langBtn.addEventListener("click", function () {
      current = current === "zh-CN" ? "en" : "zh-CN";
      try {
        localStorage.setItem(LANG_KEY, current);
      } catch {
        /* 存不下就只在本次会话生效 */
      }
      applyLang();
    });
  }

  // 深浅色：<head> 内联脚本已按存档/系统落地 data-theme，这里只补交互与地址栏底色同步。
  var THEME_KEY = "repoways-landing-theme";
  var themeBtn = document.getElementById("themeToggle");

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.getElementById("metaThemeColor");
    if (meta) meta.setAttribute("content", t === "dark" ? "#0d1117" : "#ffffff");
    if (themeBtn) themeBtn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
  }

  if (themeBtn) {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    themeBtn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* 存不下就只在本次会话生效 */
      }
      applyTheme(next);
    });
  }

  // 立即安装：按浏览器把 hero 主按钮指到对应商店并换上该浏览器 logo（Firefox→AMO、Edge→Edge 扩展、其余→Chrome）。
  // 与页尾色带三颗商店按钮同一批地址；logo 用 <img> 引文件而非内联（三份 SVG 各自定义了同名渐变 id）。
  // HTML 里默认已是 Chrome，所以禁用 JS 时仍是 Chrome 商店 + Chrome 图标。
  var STORES = {
    chrome: {
      href: "https://chromewebstore.google.com/detail/repoways/ggckmbmffccjplnipncoplieaebbafkc",
      icon: "./assets/browser-chrome.svg",
    },
    edge: {
      href: "https://microsoftedge.microsoft.com/addons/detail/iekccdlhkjfmnioefgbmannknlmdbemb",
      icon: "./assets/browser-edge.svg",
    },
    firefox: {
      href: "https://addons.mozilla.org/zh-CN/firefox/addon/repoways/",
      icon: "./assets/browser-firefox.svg",
    },
  };
  var installBtn = document.getElementById("heroInstall");
  var installMenu = document.getElementById("installMenu");
  var installCaret = document.getElementById("installCaret");
  var store = "chrome";
  if (installBtn) {
    var ua = navigator.userAgent || "";
    store = ua.indexOf("Firefox") !== -1 ? "firefox" : ua.indexOf("Edg") !== -1 ? "edge" : "chrome";
    installBtn.setAttribute("href", STORES[store].href);
    var installIcon = document.getElementById("heroInstallIcon");
    if (installIcon) installIcon.setAttribute("src", STORES[store].icon);
  }

  // 下拉里只列"另外两个"商店：主按钮已经指向当前浏览器那家，菜单把同名的那条隐掉。
  if (installMenu) {
    installMenu.querySelectorAll(".install-menu-item").forEach(function (item) {
      if (item.getAttribute("data-store") === store) item.hidden = true;
    });
  }

  // 点击 caret 开合；点菜单外任意处或按 Esc 收起。caret 的 click 要 stopPropagation，
  // 否则会被下面那条 document 级收起监听立刻判定成"点在外部"而关掉。
  function setMenu(open) {
    if (!installMenu || !installCaret) return;
    installMenu.hidden = !open;
    installCaret.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (installCaret && installMenu) {
    installCaret.addEventListener("click", function (event) {
      event.stopPropagation();
      setMenu(installMenu.hidden);
    });
    document.addEventListener("click", function (event) {
      if (!installMenu.hidden && !installMenu.contains(event.target)) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
  }

  applyLang();
})();
