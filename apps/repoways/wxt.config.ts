import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/auto-icons"],
  manifest: {
    // The name is a brand and identical in both locales, so it stays literal;
    // only the description goes through `browser.i18n` (`__MSG_…__`).
    // GitHub's trademark rules: the brand may not lead the name and must not
    // imply endorsement, so "GitHub" appears once, inside the description.
    name: "RepoWays",
    description: "__MSG_extDescription__",
    // Underscore form is mandatory: Chrome rejects `zh-CN` here (and reports
    // "localization used but no default_locale"), web-ext accepts `zh_CN`.
    // Also the fallback locale for keys missing from the browser language.
    default_locale: "en",
    // No `action` on purpose: the UI lives inside the repo page as a content
    // script overlay, so there is no popup entrypoint and no toolbar button.
  },
  // Generation is skipped with a warning until `assets/logo.webp` exists, so
  // the build stays green while the icon is still artwork-pending.
  autoIcons: {
    baseIconPath: "./assets/logo.webp",
    developmentIndicator: "overlay",
  },
  webExt: {
    startUrls: ["https://github.com/xrr2016/extensions"],
  },
  zip: {
    artifactTemplate: "repoways-{{versionName}}-{{browser}}{{modeSuffix}}.zip",
    // Identical to artifactTemplate and the sources zip overwrites the extension zip.
    sourcesTemplate: "repoways-{{versionName}}-{{browser}}-sources.zip",
  },
});
