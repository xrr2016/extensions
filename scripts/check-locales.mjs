import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Chrome refuses to load an extension whose message names break the allowed
// charset, and a key missing from one locale falls back to default_locale
// silently — so both checks have to run before the build, not after.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(ROOT, "apps/prelook/public/_locales");
const LEGAL_NAME = /^[A-Za-z0-9_@]+$/;
const REQUIRED_LOCALES = ["zh_CN", "en"];

const errors = [];
const tables = {};

for (const locale of readdirSync(LOCALES_DIR)) {
  const file = path.join(LOCALES_DIR, locale, "messages.json");
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
if (errors.length) {
  console.error(`Locale check failed (${counts}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Locales OK (${counts}, ${everyKey.size} keys)`);
