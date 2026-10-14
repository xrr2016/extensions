import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPS_DIR = path.join(ROOT, "apps");
const LANDING_SUFFIX = "-landing";

function appDirs() {
  return readdirSync(APPS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());
}

// An extension app is a directory that configures WXT, a landing is its `<name>-landing`
// sibling. These checks discover both instead of listing them: the hardcoded
// `apps/prelook` paths these scripts used carried left every other app ungated, and a
// registry list would just move that failure somewhere nobody has to remember.
export function listApps() {
  return appDirs()
    .filter((entry) => existsSync(path.join(APPS_DIR, entry.name, "wxt.config.ts")))
    .map((entry) => entry.name)
    .sort();
}

export function listLandings() {
  return appDirs()
    .filter((entry) => entry.name.endsWith(LANDING_SUFFIX))
    .map((entry) => entry.name.slice(0, -LANDING_SUFFIX.length))
    .sort();
}

export function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(ROOT, relativePath), "utf8"));
}

// Positional arguments narrow a run to the named apps. An unknown name is an error,
// not a skip — otherwise a typo reports as green.
export function selectApps(argv, available, what) {
  if (argv.length === 0) return available;
  const unknown = argv.filter((name) => !available.includes(name));
  if (unknown.length > 0) {
    console.error(
      `Unknown ${what}: ${unknown.join(", ")} (known: ${available.join(", ") || "none"})`,
    );
    process.exit(2);
  }
  return argv;
}
