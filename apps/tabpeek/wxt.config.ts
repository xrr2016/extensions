import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons", "@wxt-dev/analytics/module"],
  manifest: {
    name: "TabPeek",
    description: "悬停即预览，告别标签海 — 链接悬浮预览、阅读模式、划词搜索",
    permissions: ["tabs", "storage", "contextMenus"],
    host_permissions: ["<all_urls>"],
    // Written out by hand because WXT only emits `action` for a popup
    // entrypoint, and the settings now live in a side panel instead. Without it
    // there is no toolbar icon left to click. WXT turns this into
    // `browser_action` for MV2 targets.
    action: {},
  },
  // `binaries` is keyed by the `-b` browser name, so dev with `pnpm dev:doubao`
  // to hit this entry — a plain `wxt` run still launches Chrome.
  // `startUrls` has no per-browser form (unlike manifest), so this tab opens
  // for every dev target.
  webExt: {
    // binaries: {
    //   doubao: 'C:\\Users\\coldstonestudio\\AppData\\Local\\Doubao\\Application\\app\\Doubao.exe',
    // },
    startUrls: ["https://bbs.hupu.com/4860"],
  },
  autoIcons: {
    developmentIndicator: "overlay",
  },
});
