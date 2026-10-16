import { t } from "@/utils/i18n";
// `?raw` inlines the stylesheet as a string at build time, so the shadow root
// gets it without WXT having to emit a separate CSS entrypoint.
import type { Icon } from "@/utils/icons";
import MENU_STYLE from "@/utils/menu.css?raw";
import { repoFromPath, WAYS, type RepoRef, type Way } from "@/utils/ways";

const HOST_TAG = "repoways-ui";

// GitHub's hashed class names (`Box_6__yyTyGl`, `prc-Button-*`) change on every
// deploy, and the button's label is localised, so neither can be the anchor.
//
// Previously scoped to `#repo-content-turbo-frame` — a turbo-frame that used to
// wrap the repo header row. GitHub is dropping it (observed 2026-10-16: on one
// repo page `querySelector("#repo-content-turbo-frame")` returned null while
// the Code button sat directly under the repo header, and on another repo page
// the same selector still matched — the rollout is partial), which makes the
// frame unsafe to anchor on in either state. The selector is scoped by
// attributes instead. `data-component="Button"` is Primer's own marker on
// real Button instances; without it a stray `data-variant="primary"` button
// elsewhere on the page could be mistaken for the Code button. `aria-haspopup`
// keeps it to the dropdown trigger (not a plain primary action).
const CODE_BUTTON = 'button[data-component="Button"][data-variant="primary"][aria-haspopup="true"]';

// The row's other neighbour — the branch switcher. Shadow DOM can't use
// GitHub's classes, so the only way to look identical to it is to copy its
// resolved styles; that also tracks light/dark without naming a single token.
// An id, not a class: the hashed `prc-Button-*` name rotates on every deploy.
// This one used to be scoped to `#repo-content-turbo-frame` as well; an id is
// already unique on the page, so the ancestor bought nothing and broke on the
// same deploy the Code button's scoping did.
const DONOR = "#ref-picker-repos-header-ref-selector";

// Measured off github.com 2026-10-14: muted fill #f6f8fa, 0.8px #d1d9e0 border,
// 6px radius, `0 12px` padding, 14px/500/21px text, 8px gap between icon, label
// and caret, and a 1px `rgba(31,35,40,.04)` drop shadow (not inset — unlike the
// Code button's inset highlight). Height is taken from the Code button instead:
// the two are both 32px there, and a row where one control is taller than its
// neighbours reads as a bug. The shorthand entries (`border-*`, `border-radius`,
// `padding`) were checked on the live page: each reads back non-empty and
// round-trips through an inline declaration to the same computed value.
//
// `font-family` is on the list although it looks redundant: the label would
// inherit it across the shadow boundary anyway, because github.com puts the
// "Mona Sans VF" stack on `<body>` and the branch switcher's own rule repeats
// it (measured 2026-10-15: donor and body report the same stack). Copying it is
// what keeps the button's typeface pinned to the *button's* rule rather than to
// whatever the page happens to inherit — the same reason every other entry is
// here. `font-weight` is the other half of it, and 500 is what makes the label
// read as a control rather than as body copy.
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
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
];

// GitHub switches theme by rewriting these attributes on `<html>`, with no
// navigation and therefore no `turbo:load` — copied values would go stale.
const THEME_ATTRS = ["data-color-mode", "data-light-theme", "data-dark-theme"];

const SVG_NS = "http://www.w3.org/2000/svg";

// The button's leading mark is RepoWays' own logo (`assets/logo.svg`, the
// editable master), not an Octicon: `primer/octicons` has 399 icons and none of
// them mean "route" (no `route` / `path` / `signpost` / `map` / `compass`), and
// the product's whole point is the fan-out the logo draws — one origin, three
// ways out, heading right. Two edits to the master, and only two: the rounded
// plate (`<rect fill="#0969da">`) is dropped, and its white ink becomes
// `currentColor` — the same move every black-ink mark in utils/icons.ts makes,
// because white would vanish on the light button and a literal black would vanish
// on a dark one. Coordinates are the master's own numbers, which is why the
// viewBox is the master's 1024 grid; and the viewBox is the mark's tight square
// (168..868 across, 162..862 down, both centred on the ink's own 518/512), so the
// glyph fills its 16px box the way an Octicon does instead of floating in the
// plate's old margin.
//
// The ink itself is the master's — one uniform hairline with every node a hollow
// ring, which is the grammar GitHub's `git-branch` octicon uses (asked for
// 2026-10-16: "跟 GitHub 的分支图标类似，细线条，顶端为空心圆形"). That is why
// there is exactly one `<g>` here and no filled twin: strokes and rings carry the
// same `stroke-width` of 64, and a ring at r 64 has its band spanning radius
// 32..96, so the spokes stop 64 short of each node's centre (a round cap reaches
// exactly 96) and each hole stays open. Run a spoke to its node's centre instead
// and the cap fills the hole — the one way to get this wrong.
//
// The spokes are one step lighter than the nodes (2026-10-16: "中间的连线线条颜色
// 还是太深了"). They take Primer's own secondary ink, `--fgColor-muted` (light
// #59636e / dark #9198a1) — the same token the menu rows use for their
// descriptions — rather than a made-up alpha, because it is a real step in the
// scale GitHub is already shipping and it flips with the theme by itself. The
// fallback is `currentColor`, so on a page without the token the mark simply
// stays one colour. `var()` in a *presentation attribute* does resolve inside a
// shadow root (measured: computed stroke is rgb(89,99,110) on the light button),
// so this does not need an inline `style`. Painting order keeps the junctions
// clean: the rings come after the spokes, so each dark band covers the lighter
// cap that reaches into it and there is no seam where they meet.
const LOGO_VIEWBOX = "168 162 700 700";
const SPOKE_STROKE = "var(--fgColor-muted, currentColor)";
const LOGO_BODY =
  `<g fill="none" stroke="currentColor" stroke-width="64" stroke-linecap="round" stroke-linejoin="round">` +
  `<path stroke="${SPOKE_STROKE}" d="M319.8 480.7L644.2 299.3"/>` +
  `<path stroke="${SPOKE_STROKE}" d="M328 512L708 512"/>` +
  `<path stroke="${SPOKE_STROKE}" d="M319.8 543.3L644.2 724.7"/>` +
  `<circle cx="264" cy="512" r="64"/>` +
  `<circle cx="700" cy="268" r="64"/>` +
  `<circle cx="772" cy="512" r="64"/>` +
  `<circle cx="700" cy="756" r="64"/>` +
  `</g>`;
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

// The logo mark for the button's leading slot. Unlike `octicon()` this is not one
// `path`: it is three stroked spokes plus four hollow rings, so the body is parsed
// as markup. `innerHTML` on an SVG element stays in the SVG namespace, which is
// what `<g>` and `<circle>` need — `document.createElement` would land them in
// HTML-land and nothing would render.
function logoMark(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", LOGO_VIEWBOX);
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = LOGO_BODY;
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
  button.append(logoMark(), label, octicon(CARET_PATH));

  const menu = document.createElement("div");
  menu.className = "rw-menu";
  menu.hidden = true;

  let prevGroup: Way["group"] | null = null;
  for (const way of WAYS) {
    // GitHub's ActionList separates *groups*, not rows, and it does so with a
    // divider element of its own rather than with a border on the next row —
    // which is what lets the hairline run the panel's full width while the rows
    // stay 8px in from the edge (see `.rw-divider` in menu.css). The first row of
    // the menu is never preceded by one, so there are exactly (groups - 1) of
    // them, three here.
    if (prevGroup !== null && way.group !== prevGroup) {
      const divider = document.createElement("div");
      divider.className = "rw-divider";
      divider.setAttribute("aria-hidden", "true");
      menu.append(divider);
    }
    prevGroup = way.group;

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

  // 4px and right-flush is what GitHub's own dropdown measures against its
  // anchor; the right edge is what `left` below is computed from. What is *not*
  // GitHub's is when this runs: the panel is `position: fixed`, which pins it to
  // the viewport, while the header row it hangs off scrolls with the document —
  // the repo header is not sticky, so a rect read once at open time leaves the
  // list parked over the commit list instead of hanging off its button.
  const GAP = 4;
  const EDGE = 8;

  const place = () => {
    const rect = button.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = menu;
    const left = Math.max(EDGE, Math.min(rect.right - width, window.innerWidth - width - EDGE));
    // Below is what the anchor asks for; above is the alternative when the whole
    // list cannot fit under it, and the roomier side wins.
    const below = window.innerHeight - rect.bottom - GAP - EDGE;
    const above = rect.top - GAP - EDGE;
    menu.style.left = `${left}px`;
    menu.style.top = `${below < height && above > below ? rect.top - GAP - height : rect.bottom + GAP}px`;
  };

  const show = () => {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    place();
  };

  const hide = () => {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };

  // Click, not hover. GitHub's own `Code` dropdown only appears on press, and a
  // list that opens under a pointer merely passing by the button on its way to
  // `Code` is a menu nobody asked for.
  button.addEventListener("click", () => {
    if (menu.hidden) show();
    else hide();
  });

  // Every row opens its own tab, so the list has done its job once one is
  // pressed; leaving it up would mean dismissing it after every pick.
  menu.addEventListener("click", (event) => {
    const row = event.target as Element | null;
    if (row?.closest(".rw-item")) hide();
  });

  // `window` + capture, not `document` + bubble: a page handler bound earlier can
  // `stopImmediatePropagation` and eat the dismissal (Prelook hit exactly that
  // with its own outside-click close). Events raised inside our shadow tree
  // retarget, but `composedPath()` still lists the host, which is what makes
  // "outside" mean "not our own UI" here.
  const dismiss = (event: Event) => {
    if (!menu.hidden && !event.composedPath().includes(host)) hide();
  };
  const onKey = (event: Event) => {
    if ((event as KeyboardEvent).key === "Escape" && !menu.hidden) hide();
  };
  // The panel is `position: fixed`, so it does not follow the button on its own:
  // a scroll has to be answered by measuring again. `window` + capture, not
  // `document`, because scroll events do not bubble — a capture listener on the
  // window is what hears a scroll raised by any scrolling ancestor, including
  // the document itself. The re-place is synchronous so the panel never paints a
  // frame at the stale position.
  const track = () => {
    if (!menu.hidden) place();
  };
  window.addEventListener("pointerdown", dismiss, true);
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", track, true);
  window.addEventListener("resize", track);

  // The button is rebuilt whenever the page re-renders it away (see `ensure()`
  // below), and these are bound on `window`, so removing the host does not
  // remove them. A leftover one cannot
  // mis-close the new menu — its closure holds the old, detached nodes — but it
  // keeps that whole shadow tree (twelve rows and their inline marks) alive for
  // as long as the tab stays open, which on a SPA is one per navigation.
  return {
    host,
    // The donor this instance mirrored, so a later pass can tell "the same
    // donor" from "a donor that has just been replaced or taken away" without
    // re-reading anything.
    donor,
    restyle,
    destroy: () => {
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", track, true);
      window.removeEventListener("resize", track);
    },
  };
}

// One injection, re-runnable, driven by the document rather than by navigation.
//
// The row is React's — the Code button's parent is a Primer `Box` carrying
// `__reactFiber` keys (read off github.com 2026-10-16) — and a node inserted
// into a React-managed parent is a node React can drop on its next commit. That
// is the bug this replaces: the button appeared, the row's React partial
// finished booting and replaced the row under it a moment later, and the button
// never came back, because `turbo:load` fires on navigation and not on a
// re-render — so a re-render was a state the script could not hear about at
// all. A screen recording of it is 0.4s of button (2026-10-16).
let mounted: ReturnType<typeof createUi> | null = null;

// Removes whatever is standing: ours, or a leftover host from an earlier run of
// the content script (reloading the extension leaves the old one behind with no
// `mounted` pointing at it).
function teardown() {
  mounted?.destroy();
  document.querySelectorAll(HOST_TAG).forEach((el) => el.remove());
  mounted = null;
}

function ensure() {
  const codeButton = document.querySelector<HTMLElement>(CODE_BUTTON);
  const donor = document.querySelector<HTMLElement>(DONOR);

  // Nothing has happened to us: the same slot, the same donor to mirror. This
  // is what makes the watcher below safe to run on every mutation in the page —
  // re-inserting further down is itself a mutation, and the pass it raises
  // lands here — and it is also what keeps `restyle()` from re-running for
  // free. `mounted.donor === donor` covers the other direction: a donor that
  // has just been replaced or taken away reads as a change, and the button
  // rebuilds onto (or off) it.
  if (
    mounted?.host.isConnected &&
    mounted.host.nextElementSibling === codeButton &&
    mounted.donor === donor
  ) {
    return;
  }

  const row = codeButton?.parentElement;
  const repo = repoFromPath(location.pathname);
  if (!codeButton || !row || !repo) {
    // Either off the repo header (another route, or a path that is not a repo)
    // or mid-re-render, with React having taken the row away and not yet put
    // the next one back. Drop our node rather than leave one hanging beside
    // nothing; the mutation that brings the Code button back asks for a new
    // one.
    teardown();
    return;
  }

  teardown();
  mounted = createUi(codeButton, donor, repo);
  row.insertBefore(mounted.host, codeButton);
}

export default defineContentScript({
  matches: ["https://github.com/*"],
  runAt: "document_idle",
  main(ctx) {
    ensure();

    // Re-assert the injection on any structural change. The row above is
    // React's and its depth in the tree is not ours to pin, so the watcher
    // covers the document; `ensure()` is two queries when nothing happened to
    // us, and a callback is raised once per batch of mutations rather than once
    // per record, which is what keeps this affordable at GitHub's mutation rate.
    const tree = new MutationObserver(ensure);
    tree.observe(document.documentElement, { childList: true, subtree: true });

    // Light/dark is a pair of attributes on `<html>`, flipped in place with no
    // navigation and no re-render, so it gets an observer of its own: a restyle
    // reads the donor's computed style — a forced layout, the expensive part of
    // this file — and has to stay rare, while the watcher above has to hear
    // about everything.
    const theme = new MutationObserver(() => mounted?.restyle());
    theme.observe(document.documentElement, { attributeFilter: THEME_ATTRS });

    // The watcher above already answers a re-render; this answers the other
    // half of a soft navigation — the URL. Turbo rewrites `location.pathname`
    // after the new content is in, so a button rebuilt from the mutation that
    // preceded that rewrite would carry the previous repo's links. `turbo:load`
    // fires once the address bar has caught up.
    document.addEventListener("turbo:load", ensure);

    ctx.onInvalidated(() => {
      tree.disconnect();
      theme.disconnect();
      document.removeEventListener("turbo:load", ensure);
    });
  },
});
