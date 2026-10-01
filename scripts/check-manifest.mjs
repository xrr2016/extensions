import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// A green build is not a loadable extension: `action` only exists because
// wxt.config.ts writes it by hand (WXT emits it for a popup entrypoint, and the
// settings live in a side panel), and every other key below is likewise easy to
// lose without any type error. This script reads the built manifest and fails
// the build the way the browser would.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIREMENTS = {
  chrome: {
    output: "apps/prelook/.output/chrome-mv3",
    manifest_version: 3,
    checks: {
      action: (m) => m.action !== undefined && m.action !== null,
      "side_panel.default_path": (m) => typeof m.side_panel?.default_path === "string",
      "background.service_worker": (m) => typeof m.background?.service_worker === "string",
    },
    permissions: ["storage", "sidePanel"],
  },
  firefox: {
    output: "apps/prelook/.output/firefox-mv2",
    manifest_version: 2,
    checks: {
      browser_action: (m) => m.browser_action !== undefined && m.browser_action !== null,
      "sidebar_action.default_panel": (m) => typeof m.sidebar_action?.default_panel === "string",
      "background.scripts": (m) =>
        Array.isArray(m.background?.scripts) && m.background.scripts.length > 0,
    },
    permissions: ["storage"],
  },
};

const target = process.argv[2];
const spec = REQUIREMENTS[target];
if (!spec) {
  console.error(
    `Usage: node scripts/check-manifest.mjs <${Object.keys(REQUIREMENTS).join("|")}> [outputDir]`,
  );
  process.exit(2);
}

const dir = path.resolve(ROOT, process.argv[3] ?? spec.output);
const manifestPath = path.join(dir, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error(
    `No manifest at ${manifestPath} — run \`pnpm build:prelook${target === "firefox" ? ":firefox" : ""}\` first.`,
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const errors = [];

if (manifest.manifest_version !== spec.manifest_version)
  errors.push(
    `manifest_version is ${manifest.manifest_version}, expected ${spec.manifest_version}`,
  );

for (const [label, ok] of Object.entries(spec.checks))
  if (!ok(manifest)) errors.push(`missing ${label}`);

const granted = new Set(manifest.permissions ?? []);
for (const permission of spec.permissions)
  if (!granted.has(permission)) errors.push(`permission "${permission}" is not granted`);

// default_locale must name an existing _locales folder, or Chrome rejects the
// manifest while still reporting the error as "localization used without
// default_locale".
const locale = manifest.default_locale;
if (typeof locale !== "string" || !locale) {
  errors.push("default_locale is missing");
} else if (!existsSync(path.join(dir, "_locales", locale, "messages.json"))) {
  errors.push(`default_locale "${locale}" has no _locales/${locale}/messages.json in the build`);
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
        errors.push(`manifest.${key} references __MSG_${ref}__, which ${locale} does not define`);
  }
}

if (errors.length) {
  console.error(`${target} manifest check failed:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`${target} manifest OK (v${manifest.version}, ${[...granted].join("/")})`);
