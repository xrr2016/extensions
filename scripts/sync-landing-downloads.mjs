import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The offline zips are uploaded to a bucket under version-named keys, so every
// landing link to them goes stale on release day. The extension's own version is
// the only source of truth: `--write` aligns the links to it, and the default
// (check) mode is what CI runs — a bump that was never followed by an upload and
// a sync then fails loudly instead of shipping a 404 or an old build.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["apps/prelook-landing/index.html", "apps/prelook-landing/index.md"];
const BROWSERS = ["chrome", "firefox"];
const LINK = new RegExp(
  String.raw`https://prelook\.s3\.bitiful\.net/prelook-[^"'\s]+?-(${BROWSERS.join("|")})\.zip`,
  "g",
);

const version = JSON.parse(
  readFileSync(path.join(ROOT, "apps/prelook/package.json"), "utf8"),
).version;
const args = process.argv.slice(2);
const write = args.includes("--write");
if (args.some((a) => a !== "--write")) {
  console.error("Usage: node scripts/sync-landing-downloads.mjs [--write]");
  process.exit(2);
}

const stale = [];
for (const file of FILES) {
  const source = readFileSync(path.join(ROOT, file), "utf8");
  const rewritten = source.replace(LINK, (match, browser) => {
    const wanted = `https://prelook.s3.bitiful.net/prelook-${version}-${browser}.zip`;
    if (match === wanted) return match;
    stale.push({ file, match, wanted });
    return wanted;
  });
  if (write && rewritten !== source) writeFileSync(path.join(ROOT, file), rewritten);
}

if (!stale.length) {
  console.log(`Landing download links match v${version} (${FILES.length} files)`);
  process.exit(0);
}

const label = write ? "Updated" : "Stale";
console.error(`${label} offline-package links (extension is v${version}):`);
for (const s of stale) console.error(`  - ${s.file}: ${s.wanted}  <-  ${s.match}`);
if (!write) console.error("\nUpload the zips for this version, then run `pnpm sync:landing`.");
process.exit(write ? 0 : 1);
