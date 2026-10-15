import { readFileSync } from "node:fs";
import { join } from "node:path";

// The one release config in this monorepo. release-it loads its config from the *cwd*,
// and `pnpm release:<app>` runs it inside `apps/<app>` — so every app only carries
//
//   {"extends": "../../release-it.config.mjs"}
//
// and everything a release does is defined here. The app is read off the package that
// lives in the cwd rather than passed in as a flag, which keeps the entry points
// (`pnpm release:prelook`, `pnpm -F @extensions/prelook release`) exactly what they were.
//
// The keys below are not the defaults because the defaults would be wrong here:
//   npm: false            - nothing is published to npm; the npm plugin is also what
//                           would otherwise write the new version into package.json.
//   github.release: false - the GitHub release is created by
//                           .github/workflows/release-*.yml as a draft, so there is
//                           nothing for release-it to attach to.
//   @release-it/bumper    - with the npm plugin off, this is the *only* thing that
//                           writes the bumped version into apps/<app>/package.json,
//                           which is where the zip names are read from. Delete it and
//                           the tag says 1.0.1 while the package still says 1.0.0.

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
const app = String(pkg.name).replace(/^@[^/]+\//, "");

// Per-app extras. The tag name is derived for everyone, so only exceptions live here.
const APPS = {
  // Only Prelook keeps a changelog. The monorepo shares one git history, so
  // auto-changelog run for RepoWays would be filled with Prelook's commits — its
  // release notes come from `gh release create --generate-notes` instead.
  prelook: { hooks: { "after:bump": "pnpx auto-changelog -p" } },
  repoways: {},
};

// An unregistered app means release-it is running somewhere it has no business being
// (the repo root, say), and the silent outcome would be an `extensions-v0.0.1` tag.
// release-it wraps a config error into "Invalid configuration file at <path>", which
// hides this message, so print it before throwing.
if (!Object.hasOwn(APPS, app)) {
  console.error(`release-it.config.mjs: unknown app "${app}" (cwd ${process.cwd()})`);
  throw new Error(`unknown app: ${app}`);
}

/** @type {import("release-it").Config} */
export default {
  // ${version} is release-it's own placeholder and has to survive as a literal, so the
  // tag name is built by concatenation rather than by interpolation.
  git: { tagName: app + "-v${version}" },
  npm: false,
  github: { release: false },
  plugins: { "@release-it/bumper": { out: "package.json" } },
  ...APPS[app],
};
