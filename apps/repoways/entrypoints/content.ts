import { t } from "@/utils/i18n";
// `?raw` inlines the stylesheet as a string at build time, so the shadow root
// gets it without WXT having to emit a separate CSS entrypoint.
import MENU_STYLE from "@/utils/menu.css?raw";
import type { Icon } from "@/utils/icons";
import { repoFromPath, WAYS, type RepoRef } from "@/utils/ways";

const HOST_TAG = "repoways-ui";

// GitHub's hashed class names (`Box_6__yyTyGl`, `prc-Button-*`) change on every
// deploy, and the button's label is localised, so neither can be the anchor.
// This selector matched exactly one element on a repo page and nothing on
// /issues, which is what keeps non-repo routes out without a path denylist.
const CODE_BUTTON = '#repo-content-turbo-frame button[data-variant="primary"][aria-haspopup="true"]';

const HIDE_DELAY_MS = 150;

// The row's other neighbour — the branch switcher. Shadow DOM can't use
// GitHub's classes, so the only way to look identical to it is to copy its
// resolved styles; that also tracks light/dark without naming a single token.
// An id, not a class: the hashed `prc-Button-*` name rotates on every deploy.
const DONOR = "#repo-content-turbo-frame #ref-picker-repos-header-ref-selector";

// Measured off github.com 2026-10-14: muted fill #f6f8fa, 0.8px #d1d9e0 border,
// 6px radius, `0 12px` padding, 14px/500/21px text, 8px gap between icon, label
// and caret, and a 1px `rgba(31,35,40,.04)` drop shadow (not inset — unlike the
// Code button's inset highlight). Height is taken from the Code button instead:
// the two are both 32px there, and a row where one control is taller than its
// neighbours reads as a bug. The shorthand entries (`border-*`, `border-radius`,
// `padding`) were checked on the live page: each reads back non-empty and
// round-trips through an inline declaration to the same computed value.
const DONOR_PROPS = [
  "background-color",
  "box-shadow",
  "color",
  "border-width",
  "border-style",
  "border-color",
  "border-radius",
  "padding",
  "gap",
  "font-size",
  "font-weight",
  "line-height",
];

// GitHub switches theme by rewriting these attributes on `<html>`, with no
// navigation and therefore no `turbo:load` — copied values would go stale.
const THEME_ATTRS = ["data-color-mode", "data-light-theme", "data-dark-theme"];

const SVG_NS = "http://www.w3.org/2000/svg";

// The button's leading glyph is hand-authored, not an Octicon: `primer/octicons`
// has 399 icons and none of them mean "route" (no `route` / `path` / `signpost` /
// `map` / `compass`), so this is our own two-node L-shaped path — origin
// bottom-left, destination top-right — drawn on the 16px grid with octicon
// weights (2.5px ring radius, 1.25px band and stroke). The caret *is* copied from
// the branch button's markup, so the trailing half of the button still reads as
// GitHub's.
const ROUTE_PATH =
  "M4 10a2.5 2.5 0 1 1 0 5a2.5 2.5 0 1 1 0-5Z" +
  "M4 11.25a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 1 0 0-2.5Z" +
  "M12.5 1.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 1 1 0-5Z" +
  "M12.5 2.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 1 0 0-2.5Z" +
  "M3.125 4h1.75v6.125H3.125Z" +
  "M4 3.125h6.125v1.75H4Z";
const CARET_PATH =
  "m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z";

function octicon(path: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<path d="${path}"></path>`;
  return svg;
}

// A destination's own mark, from utils/icons.ts. `innerHTML` on an SVG element
// parses in the SVG namespace, which is what the `<image>` / `<g>` bodies need —
// `document.createElement` would put them in HTML-land and nothing would render.
function brandIcon(icon: Icon): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", icon.viewBox);
  svg.setAttribute("class", "rw-icon");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = icon.body;
  return svg;
}

function createUi(codeButton: HTMLElement, donor: HTMLElement | null, repo: RepoRef) {
  const host = document.createElement(HOST_TAG);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${MENU_STYLE}</style>`;

  const wrap = document.createElement("div");
  wrap.className = "rw";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "rw-btn";
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");

  // Only the height comes from the Code button; every other visual property is
  // mirrored off the branch switcher so the row reads as one control family.
  button.style.height = getComputedStyle(codeButton).height;

  const restyle = () => {
    if (!donor) return;
    const style = getComputedStyle(donor);
    for (const prop of DONOR_PROPS) {
      const value = style.getPropertyValue(prop);
      // A blank read means the shorthand could not serialize (a side carries a
      // value the shorthand can't express). Leaving the stylesheet's token
      // fallback in place beats writing an empty declaration.
      if (value) button.style.setProperty(prop, value);
    }
  };
  restyle();

  const label = document.createElement("span");
  label.textContent = t("button.label");
  button.append(octicon(ROUTE_PATH), label, octicon(CARET_PATH));

  const menu = document.createElement("div");
  menu.className = "rw-menu";
  menu.hidden = true;

  for (const way of WAYS) {
    const item = document.createElement("a");
    item.className = "rw-item";
    item.href = way.url(repo);
    item.target = "_blank";
    item.rel = "noopener noreferrer";

    // The destination's mark, then its name: one group, because the icon belongs
    // to the title rather than floating beside it. What the service does to the
    // repo is the description on the right, muted — GitHub's own ActionList order.
    const name = document.createElement("span");
    name.className = "rw-name";
    name.textContent = way.service;

    const lead = document.createElement("span");
    lead.className = "rw-lead";
    lead.append(brandIcon(way.icon), name);

    const desc = document.createElement("span");
    desc.className = "rw-desc";
    desc.textContent = t(way.labelKey);

    item.append(lead, desc);
    menu.append(item);
  }

  wrap.append(button, menu);
  root.append(wrap);

  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const show = () => {
    clearTimeout(hideTimer);
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    const rect = button.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8));
    menu.style.left = `${left}px`;
    // 4px and right-flush is what GitHub's own dropdown measures against its
    // anchor; the right edge is what `left` above is computed from.
    menu.style.top = `${rect.bottom + 4}px`;
  };

  const hide = () => {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };

  wrap.addEventListener("pointerenter", show);
  wrap.addEventListener("pointerleave", () => {
    hideTimer = setTimeout(hide, HIDE_DELAY_MS);
  });
  button.addEventListener("click", () => {
    if (menu.hidden) show();
    else hide();
  });

  return { host, restyle };
}

let mounted: ReturnType<typeof createUi> | null = null;

function mount() {
  document.querySelectorAll(HOST_TAG).forEach((el) => el.remove());
  mounted = null;

  const codeButton = document.querySelector<HTMLElement>(CODE_BUTTON);
  const row = codeButton?.parentElement;
  if (!codeButton || !row) return;

  const repo = repoFromPath(location.pathname);
  if (!repo) return;

  // The donor lives in the same turbo frame but not in this flex row, hence the
  // frame-scoped id selector rather than a walk sideways from the Code button.
  const donor = document.querySelector<HTMLElement>(DONOR);

  mounted = createUi(codeButton, donor, repo);
  row.insertBefore(mounted.host, codeButton);
}

export default defineContentScript({
  matches: ["https://github.com/*"],
  main(ctx) {
    mount();
    // Repo pages are a SPA: switching tabs replaces the turbo frame without a
    // document reload, so the injected button has to be re-added each render.
    document.addEventListener("turbo:load", mount);

    // Light/dark is a pair of attributes on <html>, flipped in place with no
    // navigation and no `turbo:load`. Without this the copied paint keeps the
    // palette from before the switch: a white button on a dark page.
    const observer = new MutationObserver(() => mounted?.restyle());
    observer.observe(document.documentElement, { attributeFilter: THEME_ATTRS });
    ctx.onInvalidated(() => observer.disconnect());
  },
});
