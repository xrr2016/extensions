import { defineConfig } from "wxt";

// Zen is a Firefox fork, so it has to be launched through the firefox target.
// Keep the path here rather than inline so `dev:zen` in package.json has a
// single place to point at.
const ZEN_BINARY = "C:\\Program Files\\Zen Browser\\zen.exe";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons", "@wxt-dev/analytics/module"],
  manifest: {
    name: "Prelook",
    description: "悬停链接即预览，不必再点开 — 链接预热秒开、阅读模式、划词搜索、风险提示",
    default_locale: "zh-CN",
    permissions: ["tabs", "storage", "contextMenus"],
    host_permissions: ["<all_urls>"],
    // Written out by hand because WXT only emits `action` for a popup
    // entrypoint, and the settings now live in a side panel instead. Without it
    // there is no toolbar icon left to click. WXT turns this into
    // `browser_action` for MV2 targets.
    action: {},
  },
  // `binaries` is keyed by the `-b` browser name, so a plain `wxt` run still
  // launches Chrome and `pnpm dev:prelook:doubao` hits that entry.
  // Zen is the one exception to "the key matches the flag": it is a Firefox
  // fork, so only `-b firefox` can drive it (WXT reads `binaries.firefox` for
  // that target and treats every other name as Chromium). A `zen` key would be
  // passed to web-ext as `chromiumBinary`, and `-b zen` builds a Chrome MV3
  // manifest (background.service_worker + side_panel) that Zen cannot load.
  // Firefox itself is not installed here, so its slot holds Zen.
  // `startUrls` has no per-browser form (unlike manifest), so this tab opens
  // for every dev target.
  webExt: {
    binaries: {
      doubao: "C:\\Users\\coldstonestudio\\AppData\\Local\\Doubao\\Application\\app\\Doubao.exe",
      firefox: ZEN_BINARY,
    },
    startUrls: ["https://bbs.hupu.com/4860"],
  },
  autoIcons: {
    baseIconPath: "./assets/logo.webp",
    developmentIndicator: "overlay",
  },
});
