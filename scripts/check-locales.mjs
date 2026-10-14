import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, listApps, selectApps } from "./apps.mjs";

// Chrome refuses to load an extension whose message names break the allowed
// charset, and a key missing from one locale falls back to default_locale
// silently — so both checks have to run before the build, not after.
const LEGAL_NAME = /^[A-Za-z0-9_@]+$/;
const REQUIRED_LOCALES = ["zh_CN", "en"];

const failures = [];
const passed = [];
const skipped = [];

for (const app of selectApps(process.argv.slice(2), listApps(), "app")) {
  const dir = path.join(ROOT, "apps", app, "public", "_locales");
  if (!existsSync(dir)) {
    skipped.push(app);
    continue;
  }

  const errors = [];
  const tables = {};

  for (const locale of readdirSync(dir)) {
    const file = path.join(dir, locale, "messages.json");
    // `zh-CN` as a directory name (or as `default_locale`) is a hard reject from
    // Chrome, phrased as "localization used without default_locale".
    if (locale.includes("-"))
      errors.push(`locale dir "${locale}" must use the underscore form (zh_CN)`);
    if (!existsSync(file)) {
      errors.push(`${locale}/: no messages.json`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch (cause) {
      errors.push(`${locale}/messages.json: ${cause.message}`);
      continue;
    }
    tables[locale] = data;
    for (const [key, entry] of Object.entries(data)) {
      if (!LEGAL_NAME.test(key)) errors.push(`${locale}: illegal message name "${key}"`);
      if (typeof entry?.message !== "string" || !entry.message.trim())
        errors.push(`${locale}: "${key}" has an empty message`);
    }
  }

  for (const locale of REQUIRED_LOCALES)
    if (!tables[locale]) errors.push(`required locale "${locale}" is missing`);

  const everyKey = new Set(Object.values(tables).flatMap((t) => Object.keys(t)));
  for (const locale of Object.keys(tables))
    for (const key of everyKey)
      if (!(key in tables[locale])) errors.push(`${locale} is missing "${key}"`);

  const counts = Object.entries(tables)
    .map(([l, t]) => `${l}=${Object.keys(t).length}`)
    .join(" ");
  if (errors.length) failures.push({ app, counts, errors });
  else passed.push(`${app} (${counts}, ${everyKey.size} keys)`);
}

if (failures.length) {
  console.error("Locale check failed:");
  for (const failure of failures) {
    console.error(`  ${failure.app} (${failure.counts}):`);
    for (const error of failure.errors) console.error(`    - ${error}`);
  }
  process.exit(1);
}

for (const line of passed) console.log(`Locales OK — ${line}`);
for (const app of skipped) console.log(`Locales skipped — ${app} (no public/_locales)`);
