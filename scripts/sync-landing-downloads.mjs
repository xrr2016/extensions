import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, listLandings, readJson, selectApps } from "./apps.mjs";

// The offline zips are named by version, so every landing link to one goes stale on
// release day. The extension's own version is the only source of truth: `--write`
// aligns the links to it, and the default (check) mode is what CI runs — a bump that
// was never followed by an upload and a sync then fails loudly instead of shipping a
// 404 or an old build.
//
// Two hosts, because the two packages live in two places: Firefox is on the bucket,
// Chrome ships inside the landing directory itself, so uploading the site carries it.
// The local form adds an obligation — retyping the filename in the HTML is only half
// the job; a zip with that name has to exist in assets/, or the link 404s while every
// check stays green. And a check that matches nothing is green for the same reason,
// hence REQUIRED: the Chrome offline entry must stay linked from index.html.
//
// Everything below is per app, derived from `apps/<name>-landing`: the extension's
// version, the package filenames, and the bucket host (`<name>.s3.bitiful.net`, which
// is how Prelook's is spelled today). A product with no landing directory simply has
// nothing to check yet — it joins this gate the moment one is created.
const BROWSERS = ["chrome", "firefox"];

function sourcesFor(name) {
  const landing = `apps/${name}-landing`;
  return [
    {
      kind: "bucket",
      pattern: new RegExp(
        String.raw`https://${name}\.s3\.bitiful\.net/${name}-[^"'\s)]+-(${BROWSERS.join("|")})\.zip`,
        "g",
      ),
      link: (version, browser) =>
        `https://${name}.s3.bitiful.net/${name}-${version}-${browser}.zip`,
    },
    {
      kind: "local",
      pattern: new RegExp(
        String.raw`(?:\./)?assets/${name}-[^"'\s)]+-(${BROWSERS.join("|")})\.zip`,
        "g",
      ),
      link: (version, browser) => `./assets/${name}-${version}-${browser}.zip`,
      zip: (version, browser) => `${landing}/assets/${name}-${version}-${browser}.zip`,
    },
  ];
}

const args = process.argv.slice(2);
const write = args.includes("--write");
const named = args.filter((arg) => arg !== "--write");
const apps = selectApps(named, listLandings(), "landing");
if (apps.length === 0) {
  console.log("No apps/<name>-landing directory — nothing to check.");
  process.exit(0);
}

const stale = [];
const missing = new Set();
const rewrites = [];
const summaries = [];

for (const name of apps) {
  const landing = `apps/${name}-landing`;
  const versionPath = `apps/${name}/package.json`;
  if (!existsSync(path.join(ROOT, versionPath))) {
    console.error(`${landing} has no matching ${versionPath} to read a version from.`);
    process.exit(1);
  }
  const version = readJson(versionPath).version;
  const files = [`${landing}/index.html`, `${landing}/index.md`];
  const sources = sourcesFor(name);
  // A landing's primary offline package is the Chrome zip; deleting the block instead
  // of updating it would otherwise pass by matching nothing.
  const required = [{ file: `${landing}/index.html`, browser: "chrome" }];
  const found = new Set();

  for (const file of files) {
    const filePath = path.join(ROOT, file);
    if (!existsSync(filePath)) {
      console.error(`${file} is missing — the check has nothing to read.`);
      process.exit(1);
    }
    const source = readFileSync(filePath, "utf8");
    let rewritten = source;
    for (const { kind, pattern, link, zip } of sources) {
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

  for (const { file, browser } of required) {
    const linked = sources.some(({ kind }) => found.has(`${file}|${browser}|${kind}`));
    if (!linked) {
      console.error(`${file} no longer links the ${browser} offline package.`);
      console.error("If that is deliberate, drop the entry from `required` here.");
      process.exit(1);
    }
  }

  summaries.push(`${name} v${version} (${files.length} files)`);
}

if (missing.size) {
  console.error("Offline packages missing:");
  for (const file of missing) console.error(`  - ${file}`);
  console.error("\nPut the built zip there under exactly that filename.");
  process.exit(1);
}

for (const { file, contents } of rewrites) {
  if (write) writeFileSync(path.join(ROOT, file), contents);
}

if (!stale.length) {
  console.log(`Landing download links current — ${summaries.join(", ")}`);
  process.exit(0);
}

console.error(
  `${write ? "Updated" : "Stale"} offline-package links:`,
);
for (const s of stale) console.error(`  - ${s.file} [${s.kind}]: ${s.wanted}  <-  ${s.match}`);
if (!write) {
  console.error("\nPublish the zips for these versions, then run `pnpm sync:landing`.");
}
process.exit(write ? 0 : 1);
