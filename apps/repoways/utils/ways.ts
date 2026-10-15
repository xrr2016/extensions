import { ICONS, type Icon } from "@/utils/icons";

export type RepoRef = { owner: string; repo: string };

export function repoFromPath(pathname: string): RepoRef | null {
  const [, owner, repo] = pathname.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
}

export type Way = {
  labelKey: string;
  service: string;
  icon: Icon;
  group: "structure" | "ai" | "code" | "analytics";
  url: (repo: RepoRef) => string;
};

// The rows stay in this order and content.ts draws a hairline wherever `group`
// changes, so the array is already partitioned into four contiguous blocks:
//   structure  — what the repo is made of (diagram + the two dependency views)
//   ai         — read / summarise / feed it to a model
//   code       — browse, edit, and run the source
//   analytics  — how the repo has moved over time
export const WAYS: Way[] = [
  {
    labelKey: "ways.diagram",
    service: "GitDiagram",
    icon: ICONS.gitdiagram,
    group: "structure",
    url: (r) => `https://gitdiagram.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.depgraph",
    service: "Dependency Graph",
    icon: ICONS.depgraph,
    group: "structure",
    url: (r) => `https://github.com/${r.owner}/${r.repo}/network/dependencies`,
  },
  {
    labelKey: "ways.depsdev",
    service: "deps.dev",
    icon: ICONS.depsdev,
    group: "structure",
    // The project key is `owner/repo` with the slash left percent-encoded.
    url: (r) => `https://deps.dev/project/github/${r.owner}%2F${r.repo}`,
  },
  {
    labelKey: "ways.explainer",
    service: "DeepWiki",
    icon: ICONS.deepwiki,
    group: "ai",
    url: (r) => `https://deepwiki.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.zread",
    service: "Zread",
    icon: ICONS.zread,
    group: "ai",
    url: (r) => `https://zread.ai/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.prompts",
    service: "GitReverse",
    icon: ICONS.gitreverse,
    group: "ai",
    url: (r) => `https://gitreverse.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.mcp",
    service: "GitMCP",
    icon: ICONS.mcp,
    group: "ai",
    url: (r) => `https://gitmcp.io/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.package",
    service: "Gitingest",
    icon: ICONS.gitingest,
    group: "ai",
    url: (r) => `https://gitingest.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.search",
    service: "Sourcegraph",
    icon: ICONS.sourcegraph,
    group: "code",
    url: (r) => `https://sourcegraph.com/github.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.read",
    service: "GitHub1s",
    icon: ICONS.github1s,
    group: "code",
    url: (r) => `https://github1s.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.edit",
    service: "GitHub.dev",
    icon: ICONS.githubdev,
    group: "code",
    url: (r) => `https://github.dev/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.codespaces",
    service: "Codespaces",
    icon: ICONS.codespaces,
    group: "code",
    // The short link GitHub publishes for this; it 301s to
    // github.com/codespaces/new itself.
    url: (r) => `https://codespaces.new/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.run",
    service: "StackBlitz",
    icon: ICONS.stackblitz,
    group: "code",
    url: (r) => `https://stackblitz.com/github/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.ossinsight",
    service: "OSSInsight",
    icon: ICONS.ossinsight,
    group: "analytics",
    url: (r) => `https://ossinsight.io/analyze/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.stars",
    service: "Star History",
    icon: ICONS.starhistory,
    group: "analytics",
    url: (r) => `https://star-history.com/${r.owner}/${r.repo}`,
  },
];
