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
    // AMO's permanent id, pinned here instead of left blank: Firefox updates have
    // to be uploaded against the same id, and a submission without one just makes
    // a second listing. Chrome ignores this block (Prelook ships it in its MV3
    // manifest too), and `data_collection_permissions` is AMO's data-disclosure
    // answer — RepoWays sends nothing anywhere, every row is a plain link.
    browser_specific_settings: {
      gecko: {
        id: "{5c8e71e1-d3c8-4b3c-b44a-3f909a6da4b2}",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
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
    // Must not be the same string as artifactTemplate: Prelook shipped that bug, where
    // `-b firefox` wrote the extension zip and then overwrote it with the sources zip.
    sourcesTemplate: "repoways-{{versionName}}-{{browser}}-sources.zip",
    // WXT does not read `.gitignore` when it assembles the sources package, so anything
    // gitignored still goes to AMO reviewers unless it is named here. Measured: leaving
    // the candidate drafts out put 3 watermarked PNGs / 2.10 MB into the zip (vs 57 KB).
    excludeSources: ["assets/logo-candidates/**"],
  },
});
