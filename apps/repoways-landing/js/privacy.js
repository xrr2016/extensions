(function () {
  "use strict";

  // 隐私政策页词典：与 index.html 的 main.js 同一套约定（data-i18n + I18N 对象，
  // zh-CN 与 en 同步补齐），共用 localStorage 键 repoways-landing-lang。
  var I18N = {
    "zh-CN": {
      "meta.title": "RepoWays 隐私政策",
      "meta.description":
        "RepoWays 隐私政策：扩展零权限、零采集、不联网，不收集任何个人信息。",
      "pr.nav.home": "返回首页",
      "pr.nav.lang": "切换语言",
      "pr.nav.theme": "切换深浅色",
      "pr.nav.github": "GitHub 仓库",
      "pr.title": "RepoWays 隐私政策",
      "pr.effective": "生效日期：2026 年 10 月 16 日",
      "pr.summary":
        "一句话概括：RepoWays 不收集任何个人信息。扩展不申请任何浏览器权限、不发起任何网络请求、不写入任何存储，也不设账号或统计。",
      "pr.s1t": "1. 我们收集什么",
      "pr.s1p":
        "什么都不收集。RepoWays 不采集你的浏览记录、不读取页面内容、不追踪行为，也不向开发者或任何第三方上传数据。扩展代码开源，可自行核验。",
      "pr.s2t": "2. 扩展做了什么",
      "pr.s2p":
        "它只在 GitHub 仓库页的 Code 按钮旁插入一枚 Ways 按钮。点开后的每一条入口，都是按当前仓库的 owner/repo 现拼出来的普通链接——只有当你亲自点击时，浏览器才会打开对应的第三方网站。扩展本身不抓取、不代理、不上传任何内容。",
      "pr.s3t": "3. 权限",
      "pr.s3p":
        "零权限。扩展的清单里没有任何 permissions，也没有 host_permissions；它不申请存储、标签页、网络或任何主机访问权限。",
      "pr.s4t": "4. 存储",
      "pr.s4p":
        "扩展不写入任何存储。本隐私政策所在的官网只把你选择的语言与深浅色偏好保存在你浏览器的 localStorage（键名 repoways-landing-lang 与 repoways-landing-theme）里，用于下次访问时保持同一档位；它们只存于你的设备，不会上传。",
      "pr.s5t": "5. 第三方网站",
      "pr.s5p":
        "你主动点击的菜单条目会带你前往 GitDiagram、DeepWiki、GitHub.dev、StackBlitz 等第三方网站，这些站点各自适用其隐私政策。RepoWays 不会在你与这些站点之间的请求里加入任何追踪参数或标识。",
      "pr.s6t": "6. 政策更新",
      "pr.s6p": "如本政策发生变更，我们会在此页面发布更新版本，并在顶部注明新的生效日期。",
      "pr.s7t": "7. 联系我们",
      "pr.s7p": "如对本政策有任何疑问，可通过 GitHub 仓库与我们联系。",
      "pr.foot.about": "在 GitHub 仓库页，一键换种方式打开它。",
      "pr.foot.links": "快速链接",
      "pr.foot.home": "首页",
      "pr.foot.features": "功能",
      "pr.foot.privacy": "隐私政策",
      "pr.foot.contact": "联系",
      "pr.foot.support": "支持",
      "pr.foot.feedback": "反馈与功能许愿",
      "pr.foot.issues": "报告问题",
      "pr.foot.rights": "保留所有权利",
    },
    en: {
      "meta.title": "RepoWays Privacy Policy",
      "meta.description":
        "RepoWays privacy policy: the extension requests zero permissions, collects nothing and makes no network requests — no personal information is gathered.",
      "pr.nav.home": "Back to home",
      "pr.nav.lang": "Switch language",
      "pr.nav.theme": "Toggle theme",
      "pr.nav.github": "GitHub repository",
      "pr.title": "RepoWays Privacy Policy",
      "pr.effective": "Effective: October 16, 2026",
      "pr.summary":
        "In one line: RepoWays collects no personal information. The extension requests no browser permissions, makes no network requests, stores nothing, and has no accounts or analytics.",
      "pr.s1t": "1. What we collect",
      "pr.s1p":
        "Nothing. RepoWays does not gather your browsing history, read page content, track behaviour, or upload any data to the developer or any third party. The extension is open source and can be verified.",
      "pr.s2t": "2. What the extension does",
      "pr.s2p":
        "It only inserts a Ways button next to Code on a GitHub repository page. Every entry in the menu is a plain link built from the current repository's owner/repo — a third-party site opens only when you click it yourself. The extension itself never scrapes, proxies or uploads anything.",
      "pr.s3t": "3. Permissions",
      "pr.s3p":
        "Zero permissions. The manifest declares no permissions and no host_permissions; it does not ask for storage, tabs, networking or host access.",
      "pr.s4t": "4. Storage",
      "pr.s4p":
        "The extension writes nothing to storage. The website hosting this policy stores only your chosen language and theme in your browser's localStorage (keys repoways-landing-lang and repoways-landing-theme) so they persist across visits; they stay on your device and are never uploaded.",
      "pr.s5t": "5. Third-party sites",
      "pr.s5p":
        "Entries you click take you to third-party sites such as GitDiagram, DeepWiki, GitHub.dev and StackBlitz, each governed by its own privacy policy. RepoWays adds no tracking parameters or identifiers to the requests between you and those sites.",
      "pr.s6t": "6. Policy updates",
      "pr.s6p":
        "If this policy changes, we publish the updated version on this page and note the new effective date at the top.",
      "pr.s7t": "7. Contact",
      "pr.s7p":
        "Questions about this policy? Reach us through the GitHub repository.",
      "pr.foot.about": "On any GitHub repo, open it a different way.",
      "pr.foot.links": "Quick links",
      "pr.foot.home": "Home",
      "pr.foot.features": "Features",
      "pr.foot.privacy": "Privacy policy",
      "pr.foot.contact": "Contact",
      "pr.foot.support": "Support",
      "pr.foot.feedback": "Feedback & feature requests",
      "pr.foot.issues": "Report an issue",
      "pr.foot.rights": "All rights reserved",
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

  // 深浅色：与 index.html 共用 repoways-landing-theme 键；<head> 内联脚本已落地 data-theme，
  // 这里只补交互与地址栏底色同步。
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

  applyLang();
})();
