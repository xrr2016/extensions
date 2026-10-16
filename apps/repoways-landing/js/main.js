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
      "nav.install": "安装",
      "nav.lang": "切换语言",
      "hero.badge": "免费 · 开源 · 零权限",
      "hero.title": "GitHub 仓库的 12 种打开方式",
      "hero.sub": "在任意 GitHub 仓库页一键调用能读懂它、图解它、运行它的工具。",
      "hero.cta": "下载离线包",
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
      "install.title": "四步装好",
      "install.sub": "用离线包安装，适用于 Chrome 与 Edge。",
      "install.step1": "下载离线包，解压到一个文件夹",
      "install.step2": "打开 chrome://extensions，在右上角开启「开发者模式」",
      "install.step3": "点「加载已解压的扩展程序」，选中刚才的文件夹",
      "install.step4": "打开任意 GitHub 仓库页，Code 左边的 Ways 就是它",
      "install.button": "下载 Chrome 离线包",
      "install.note": "解压后的文件夹请保留：浏览器是按文件夹加载扩展的，删掉它就失效了。",
      "assure.perm.title": "零权限",
      "assure.perm.body": "不申请任何浏览器权限，也不后台联网。",
      "assure.link.title": "纯链接",
      "assure.link.body": "十二条入口全是由仓库地址拼出来的普通链接。",
      "assure.data.title": "不收集",
      "assure.data.body": "没有统计、没有账号、没有任何数据上传。",
      "footer.about": "在 GitHub 仓库页，一键换种方式打开它。",
      "footer.links": "快速链接",
      "footer.contact": "联系",
      "footer.rights": "保留所有权利",
    },
    en: {
      "meta.title": "RepoWays — 12 ways to open any GitHub repo",
      "meta.description":
        "RepoWays adds a Ways button next to Code on any GitHub repository page — one click to reach the tools that read, diagram and run it. Free, open source, zero permissions.",
      "nav.features": "Features",
      "nav.install": "Install",
      "nav.lang": "Switch language",
      "hero.badge": "Free · Open source · Zero permissions",
      "hero.title": "12 ways to open any GitHub repo",
      "hero.sub":
        "One click on any GitHub repository to open it with the tools that read, diagram and run it.",
      "hero.cta": "Download",
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
      "install.title": "Up and running in a few steps",
      "install.sub": "Install from the offline package — works on Chrome and Edge.",
      "install.step1": "Download the offline package and unzip it into a folder",
      "install.step2": "Open chrome://extensions and turn on “Developer mode” (top right)",
      "install.step3": "Click “Load unpacked” and select that folder",
      "install.step4": "Open any GitHub repository — Ways sits right next to Code",
      "install.button": "Download the Chrome package",
      "install.note":
        "Keep the unzipped folder: the browser loads the extension from it, so deleting it uninstalls.",
      "assure.perm.title": "Zero permissions",
      "assure.perm.body": "Requests no browser permissions and never phones home.",
      "assure.link.title": "Plain links",
      "assure.link.body": "All twelve entries are ordinary URLs built from the repository path.",
      "assure.data.title": "No data collected",
      "assure.data.body": "No analytics, no accounts, no uploads. None.",
      "footer.about": "On any GitHub repo, open it a different way.",
      "footer.links": "Quick links",
      "footer.contact": "Contact",
      "footer.rights": "All rights reserved",
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

  applyLang();
})();
