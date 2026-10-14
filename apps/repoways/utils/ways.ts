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
  url: (repo: RepoRef) => string;
};

export const WAYS: Way[] = [
  {
    labelKey: "ways.diagram",
    service: "GitDiagram",
    icon: ICONS.gitdiagram,
    url: (r) => `https://gitdiagram.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.explainer",
    service: "DeepWiki",
    icon: ICONS.deepwiki,
    url: (r) => `https://deepwiki.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.zread",
    service: "Zread",
    icon: ICONS.zread,
    url: (r) => `https://zread.ai/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.prompts",
    service: "GitReverse",
    icon: ICONS.gitreverse,
    url: (r) => `https://gitreverse.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.package",
    service: "Gitingest",
    icon: ICONS.gitingest,
    url: (r) => `https://gitingest.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.read",
    service: "GitHub1s",
    icon: ICONS.github1s,
    url: (r) => `https://github1s.com/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.edit",
    service: "GitHub.dev",
    icon: ICONS.githubdev,
    url: (r) => `https://github.dev/${r.owner}/${r.repo}`,
  },
  {
    labelKey: "ways.run",
    service: "StackBlitz",
    icon: ICONS.stackblitz,
    url: (r) => `https://stackblitz.com/github/${r.owner}/${r.repo}`,
  },
];
