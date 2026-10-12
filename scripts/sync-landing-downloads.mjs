import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The offline zips are named by version, so every landing link to one goes stale
// on release day. The extension's own version is the only source of truth:
// `--write` aligns the links to it, and the default (check) mode is what CI runs —
// a bump that was never followed by an upload and a sync then fails loudly instead
// of shipping a 404 or an old build.
//
// Two hosts, because the two packages live in two places: Firefox is on the bucket,
// Chrome ships inside the landing directory itself, so uploading the site carries it.
// The local form adds an obligation — retyping the filename in the HTML is only half
// the job; a zip with that name has to exist in assets/, or the link 404s while every
// check stays green. And a check that matches nothing is green for the same reason,
// hence REQUIRED: the Chrome offline entry must stay linked from index.html.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANDING = "apps/prelook-landing";
const FILES = [`${LANDING}/index.html`, `${LANDING}/index.md`];
const BROWSERS = ["chrome", "firefox"];
const ASSET_DIR = `${LANDING}/assets`;
const REQUIRED = [{ file: `${LANDING}/index.html`, browser: "chrome" }];

const SOURCES = [
  {
    kind: "bucket",
    pattern: new RegExp(
      String.raw`https://prelook\.s3\.bitiful\.net/prelook-[^"'\s)]+-(${BROWSERS.join("|")})\.zip`,
      "g",
    ),
    link: (version, browser) =>
      `https://prelook.s3.bitiful.net/prelook-${version}-${browser}.zip`,
  },
  {
    kind: "local",
    pattern: new RegExp(
      String.raw`(?:\./)?assets/prelook-[^"'\s)]+-(${BROWSERS.join("|")})\.zip`,
      "g",
    ),
    link: (version, browser) => `./assets/prelook-${version}-${browser}.zip`,
    zip: (version, browser) => `${ASSET_DIR}/prelook-${version}-${browser}.zip`,
  },
];

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
const missing = new Set();
const found = new Set();
const rewrites = [];

for (const file of FILES) {
  const source = readFileSync(path.join(ROOT, file), "utf8");
  let rewritten = source;
  for (const { kind, pattern, link, zip } of SOURCES) {
    rewritten = rewritten.replace(pattern, (match, browser) => {
      const wanted = link(version, browser);
      found.add(`${file}|${browser}|${kind}`);
      if (match !== wanted) stale.push({ file, kind, match, wanted });
      if (zip) {
        const zipPath = path.join(ROOT, zip(version, browser));
        if (!existsSync(zipPath)) missing.add(zip(version, browser));
      }
      return wanted;
    });
  }
  if (rewritten !== source) rewrites.push({ file, contents: rewritten });
}

// A link that was deleted instead of rewritten would otherwise pass by matching nothing.
for (const { file, browser } of REQUIRED) {
  const linked = SOURCES.some(
    ({ kind }) => found.has(`${file}|${browser}|${kind}`),
  );
  if (!linked) {
    console.error(`${file} no longer links the ${browser} offline package.`);
    console.error("If that is deliberate, drop the entry from REQUIRED here.");
    process.exit(1);
  }
}

if (missing.size) {
  console.error(`Offline packages missing (extension is v${version}):`);
  for (const file of missing) console.error(`  - ${file}`);
  console.error("\nPut the built zip there under exactly that filename.");
  process.exit(1);
}

for (const { file, contents } of rewrites) {
  if (write) writeFileSync(path.join(ROOT, file), contents);
}

if (!stale.length) {
  console.log(`Landing download links match v${version} (${FILES.length} files)`);
  process.exit(0);
}

console.error(
  `${write ? "Updated" : "Stale"} offline-package links (extension is v${version}):`,
);
for (const s of stale) console.error(`  - ${s.file} [${s.kind}]: ${s.wanted}  <-  ${s.match}`);
if (!write) {
  console.error("\nPublish the zips for this version, then run `pnpm sync:landing`.");
}
process.exit(write ? 0 : 1);
