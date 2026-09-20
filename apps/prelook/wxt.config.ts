import { defineConfig } from "wxt";

// Zen is a Firefox fork, so it has to be launched through the firefox target.
// Keep the path here rather than inline so `dev:zen` in package.json has a
// single place to point at.
const ZEN_BINARY = "C:\\Program Files\\Zen Browser\\zen.exe";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons", "@wxt-dev/analytics/module"],
  manifest: {
    // The name is a brand and identical in both locales, so it stays literal;
    // the description goes through `browser.i18n` (`__MSG_…__` is resolved by
    // the browser from public/_locales/<locale>/messages.json).
    name: "Prelook",
    description: "__MSG_extDescription__",
    // Must match a `_locales` folder name exactly; also the fallback locale
    // for keys missing from the user's browser language. The underscore form
    // is not cosmetic: Chrome rejects `zh-CN` here (it then reports
    // "localization used but no default_locale"), and web-ext accepts `zh_CN`
    // too, so this spelling works on both engines.
    default_locale: "en",
    permissions: ["tabs", "storage", "contextMenus"],
    host_permissions: ["<all_urls>"],
    // Written out by hand because WXT only emits `action` for a popup
    // entrypoint, and the settings now live in a side panel instead. Without it
    // there is no toolbar icon left to click. WXT turns this into
    // `browser_action` for MV2 targets.
    action: {},
    // Required by Firefox AMO for all new extensions. This extension does not
    // collect any user data, so the list is empty.
    browser_specific_settings: {
      gecko: {
        id: "{f256e499-1229-4224-a321-de38e0dc081d}",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
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
    startUrls: [
      "https://tieba.baidu.com/",
      "https://bbs.hupu.com/4860",
      "https://www.xiaoheihe.cn/app/bbs/home/",
      "https://ngabbs.com/thread.php?fid=-152678",
    ],
  },
  autoIcons: {
    baseIconPath: "./assets/logo.webp",
    developmentIndicator: "overlay",
  },
  zip: {
    sourcesTemplate: "prelook-{{versionName}}-{{browser}}{{modeSuffix}}.zip",
    artifactTemplate: "prelook-{{versionName}}-{{browser}}{{modeSuffix}}.zip",
  },
});
