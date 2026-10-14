import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, listApps, selectApps } from "./apps.mjs";

// A green build is not a loadable extension: Prelook's `action` only exists because
// wxt.config.ts writes it by hand (WXT emits it for a popup entrypoint, and the
// settings live in a side panel), and every other key below is likewise easy to lose
// without any type error. This script reads the built manifest and fails the build the
// way the browser would.
//
// What "loadable" means is per product, so the expectations are keyed by app: RepoWays
// is content-script only, and having *no* action and *no* permissions is the design —
// assert its shape the other way. An app directory with no entry here is an error
// rather than a pass, which is what stops a third product from sliding through CI
// ungated the way RepoWays did under the old hardcoded paths.
const OUTPUT_DIR = { chrome: "chrome-mv3", firefox: "firefox-mv2" };

function injectedIntoGithub(manifest) {
  // The whole product is this one injection: if `matches` drifts, the extension
  // installs, runs and shows nothing.
  return (manifest.content_scripts ?? []).some(
    (entry) =>
      (entry.matches ?? []).includes("https://github.com/*") &&
      Array.isArray(entry.js) &&
      entry.js.length > 0,
  );
}

const noAction = (manifest) => manifest.action == null && manifest.browser_action == null;
const noPanel = (manifest) =>
  manifest.side_panel == null && manifest.sidebar_action == null &&
  manifest.options_ui == null && manifest.options_page == null;
const noPermissions = (manifest) =>
  (manifest.permissions ?? []).length === 0 && (manifest.host_permissions ?? []).length === 0;

const SPECS = {
  prelook: {
    chrome: {
      manifest_version: 3,
      permissions: ["storage", "sidePanel"],
      checks: {
        action: (manifest) => manifest.action != null,
        "side_panel.default_path": (manifest) =>
          typeof manifest.side_panel?.default_path === "string",
        "background.service_worker": (manifest) =>
          typeof manifest.background?.service_worker === "string",
      },
    },
    firefox: {
      manifest_version: 2,
      permissions: ["storage"],
      checks: {
        browser_action: (manifest) => manifest.browser_action != null,
        "sidebar_action.default_panel": (manifest) =>
          typeof manifest.sidebar_action?.default_panel === "string",
        "background.scripts": (manifest) =>
          Array.isArray(manifest.background?.scripts) && manifest.background.scripts.length > 0,
      },
    },
  },
  repoways: {
    chrome: {
      manifest_version: 3,
      permissions: [],
      checks: {
        "content_scripts on github.com": injectedIntoGithub,
        "no toolbar action": noAction,
        "no panel entrypoint": noPanel,
        "no permissions": noPermissions,
      },
    },
    firefox: {
      manifest_version: 2,
      permissions: [],
      checks: {
        "content_scripts on github.com": injectedIntoGithub,
        "no toolbar action": noAction,
        "no panel entrypoint": noPanel,
        "no permissions": noPermissions,
      },
    },
  },
};

const argv = process.argv.slice(2);
const targets = [];
const named = [];
// Store uploads need an icon, and auto-icons silently skips generation when
// `baseIconPath` is missing (one WARN, build stays green). CI should not demand an
// icon for a product still pending artwork, so this is opt-in: the release workflow
// passes it, because a tag is the point where "not listable yet" becomes a failure.
let requireIcons = false;
for (let index = 0; index < argv.length; index += 1) {
  if (argv[index] === "--target") {
    const value = argv[index + 1];
    if (!OUTPUT_DIR[value]) {
      console.error(
        `--target wants one of ${Object.keys(OUTPUT_DIR).join("|")}, got "${value}"`,
      );
      process.exit(2);
    }
    targets.push(value);
    index += 1;
    continue;
  }
  if (argv[index] === "--require-icons") {
    requireIcons = true;
    continue;
  }
  named.push(argv[index]);
}
if (argv.includes("--target") && targets.length === 0) process.exit(2);

const apps = selectApps(named, listApps(), "app");
const plan = [];
const unregistered = [];
for (const app of apps) {
  if (!SPECS[app]) {
    unregistered.push(app);
    continue;
  }
  for (const target of targets.length ? targets : Object.keys(SPECS[app]))
    plan.push({ app, target });
}

if (unregistered.length) {
  console.error(
    `No manifest spec for: ${unregistered.join(", ")} — add one to SPECS in scripts/check-manifest.mjs`,
  );
  console.error("The spec is short: a content-script-only product needs four predicates.");
  process.exit(1);
}

// Every path the manifest points at has to be in the output directory. `__MSG_x__`,
// `0.0.0` and `https://github.com/*` cannot match this shape, so a plain walk of the
// strings is enough to catch the real cases: icons, `default_path`, `service_worker`,
// `content-scripts/*.js`.
const FILE_REF = /^[\w.-]+(?:\/[\w.-]+)*\.(?:js|css|html|png|svg|json)$/;

function collectFileRefs(value, found) {
  if (typeof value === "string") {
    if (FILE_REF.test(value)) found.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFileRefs(item, found);
    return;
  }
  if (value && typeof value === "object") {
    for (const inner of Object.values(value)) collectFileRefs(inner, found);
  }
}

const errors = [];
const checked = [];

for (const { app, target } of plan) {
  const label = `${app}/${target}`;
  const spec = SPECS[app][target];
  if (!spec) {
    errors.push(`${label}: SPECS.${app} has no "${target}" entry (only ${Object.keys(SPECS[app]).join(", ")})`);
    continue;
  }
  const dir = path.join(ROOT, "apps", app, ".output", OUTPUT_DIR[target]);
  const manifestPath = path.join(dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    errors.push(
      `${label}: no manifest at ${path.relative(ROOT, manifestPath)} — run \`pnpm build:${app}${
        target === "firefox" ? ":firefox" : ""
      }\` first`,
    );
    continue;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const local = [];

  if (manifest.manifest_version !== spec.manifest_version)
    local.push(
      `manifest_version is ${manifest.manifest_version}, expected ${spec.manifest_version}`,
    );

  for (const [name, ok] of Object.entries(spec.checks))
    if (!ok(manifest)) local.push(`check failed: ${name}`);

  const granted = new Set(manifest.permissions ?? []);
  for (const permission of spec.permissions)
    if (!granted.has(permission)) local.push(`permission "${permission}" is not granted`);

  for (const ref of collectRefs(manifest)) {
    if (!existsSync(path.join(dir, ref))) local.push(`manifest references ${ref}, not in the build`);
  }

  if (requireIcons && Object.keys(manifest.icons ?? {}).length === 0)
    local.push("no `icons` in the manifest — auto-icons skipped, store upload would reject it");

  // default_locale must name an existing _locales folder, or Chrome rejects the
  // manifest while still reporting the error as "localization used without
  // default_locale".
  const locale = manifest.default_locale;
  if (typeof locale !== "string" || !locale) {
    local.push("default_locale is missing");
  } else if (!existsSync(path.join(dir, "_locales", locale, "messages.json"))) {
    local.push(`default_locale "${locale}" has no _locales/${locale}/messages.json in the build`);
  } else {
    const table = JSON.parse(
      readFileSync(path.join(dir, "_locales", locale, "messages.json"), "utf8"),
    );
    for (const [key, value] of Object.entries(manifest)) {
      const refs = [...String(JSON.stringify(value)).matchAll(/__MSG_([A-Za-z0-9_@]+)__/g)].map(
        (m) => m[1],
      );
      for (const ref of refs)
        if (!(ref in table))
          local.push(`manifest.${key} references __MSG_${ref}__, which ${locale} does not define`);
    }
  }

  if (local.length) errors.push(`${label}:\n    ${local.join("\n    ")}`);
  else
    checked.push(
      `${label} OK (v${manifest.version}${granted.size ? `, ${[...granted].join("/")}` : ", no permissions"})`,
    );
}

function collectRefs(manifest) {
  const found = new Set();
  collectFileRefs(manifest, found);
  return found;
}

if (errors.length) {
  console.error("Manifest check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

for (const line of checked) console.log(`Manifest ${line}`);
