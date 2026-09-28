/**
 * Picks up the page's own accent colour so a preview window can be tinted to
 * match it (the "auto" window theme). Everything here is read-only and cheap,
 * and every step is optional: whatever cannot be resolved leaves the caller with
 * `null`, which means "fall back to the default theme colour".
 *
 * Sources, in order of confidence:
 *  - `<meta name="theme-color">` — the site's declared brand colour. Material
 *    Design / PWA sites publish it, and it is the only value a site hands over on
 *    purpose. Works even for markup parsed without a window.
 *  - A common CSS custom property (`--theme-color`, `--primary`, …) — what a site
 *    actually paints with, when it never declared anything. Needs computed styles
 *    for a live document, or the author CSS text for a parsed one.
 *  - The most frequent explicit `color` among the page's links — the last resort
 *    before giving up, and the reason this probe is capped at a few dozen nodes.
 */

/** Names a site is likely to give its brand colour. Checked against `:root` and
 *  `<body>` first, then any element carrying inline styles (frameworks often set
 *  them there). */
const ACCENT_VARS = [
  "--theme-color",
  "--theme-color-primary",
  "--primary-color",
  "--primary",
  "--main-color",
  "--brand-color",
  "--brand",
  "--accent-color",
  "--accent",
  "--link-color",
];

/** How many link colours get sampled at most. Reading `color` forces style
 *  resolution, so this is deliberately small — the sample only has to reveal an
 *  accent that repeats, not describe the whole page. */
const MAX_COLOR_SAMPLES = 40;

/** An accent needs to show up this many times before it counts as "the page's
 *  colour" rather than one individually styled link. */
const MIN_COLOR_HITS = 3;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Accepts `#rgb`/`#rrggbb` and `rgb()`/`rgba()` — the two forms meta
 *  theme-color, custom properties and computed styles all report in. Anything
 *  else (hsl(), oklch(), named colours) is out of scope: those only ever appear
 *  authored inside a stylesheet, where the browser resolves them to `rgb()`
 *  before we read them back. */
function parseColor(value: string | null | undefined): Rgb | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw)?.[1];
  if (hex) {
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(raw);
  if (fn) {
    const [r, g, b] = [Number(fn[1]), Number(fn[2]), Number(fn[3])];
    if ([r, g, b].every((n) => Number.isFinite(n))) return { r, g, b };
  }
  return null;
}

function hslChannels(rn: number, gn: number, bn: number): { h: number; s: number; l: number } {
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** HSL string, because that is the one format both `--tp-accent` consumers and
 *  `color-mix()` understand, and it keeps the hue exact after tuning. */
function toHsl(color: Rgb): string {
  const { h, s, l } = hslChannels(color.r / 255, color.g / 255, color.b / 255);
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

/** True for grey/black/white: no usable hue to carry into the window chrome. */
function isNeutral(color: Rgb): boolean {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  // Chroma alone would call `#0b0f19` — a very dark navy brand colour — grey,
  // because its channels differ by only 14/255. So keep anything whose channels
  // are not simply equal, and drop near-white on top: tinting with it is
  // indistinguishable from not tinting at all.
  if (color.r === color.g && color.g === color.b) return true;
  if (max - min < 8) return true;
  return min > 236;
}

/**
 * Normalises the tone so an extracted colour behaves like a hand-picked preset.
 * Sites declare brand colours for *their own* surfaces — text on white, buttons,
 * favicons — which are often near-black, washed-out pastel, or bright enough to
 * turn the header glass muddy. The hue is kept exactly; only lightness (and a
 * little saturation on the pale end) is pulled into the band the presets live in.
 */
function tuneForChrome(color: Rgb): Rgb {
  const { h, s, l } = hslChannels(color.r / 255, color.g / 255, color.b / 255);
  // Same clamp idea as a design system's "primary 500": readable on either app
  // theme, without ever going dark enough to read as a shadow.
  const light = Math.min(68, Math.max(34, Math.round(l * 100)));
  // Pastel brands (#ffd9e6 pink) lose their identity once mixed at 7%, so nudge
  // the weak ones up; already-saturated colours are left alone.
  const sat = Math.min(92, Math.max(s * 100, s < 0.35 ? 45 : 0)) / 100;
  return hslToRgb(h, sat, light / 100);
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Parse → drop neutrals → normalise the tone → serialise. */
function accept(color: Rgb | null | undefined): string | null {
  if (!color || isNeutral(color)) return null;
  return toHsl(tuneForChrome(color));
}

/**
 * A document or an element inside one — `querySelectorAll` and the style probes
 * work the same way on both, so the caller may hand over a whole document (the
 * host page, a same-origin iframe, a parsed fetch reply) or just its `<html>`.
 */
export type AccentScope = Document | Element;

/** One `var(--x)` hop, as authored: no fallback value, no extra arguments. */
const VAR_REF = /^\s*var\(\s*(--[a-z0-9_-]+)\s*\)\s*$/i;

/** A literal colour inside a stylesheet declaration, for the no-cascade probe. */
const COLOR_DECL = /(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i;

/** Realm-safe document test: a same-origin iframe's `Document` is neither an
 *  `instanceof` the host page's `Document` nor built by the same constructor (it
 *  reports `HTMLDocument` from its own realm), so identity checks across realms
 *  are hopeless. An element can never have a `documentElement`, but every real
 *  document does — that alone separates the two. */
function isDocument(value: AccentScope): value is Document {
  return !!(value as Document).documentElement;
}

/** The window whose engine can resolve styles for nodes of `doc`, or `null` when
 *  none can: markup parsed by `DOMParser` has no cascade at all, and Chrome's
 *  `getComputedStyle` hands back empty strings for it instead of throwing — so
 *  without this check a real colour would silently read as "nothing found". */
function styleViewFor(doc: Document | null): Window | null {
  if (!doc) return null;
  // A same-origin iframe reports its own `contentWindow`; a cross-origin one
  // returns null here, which is exactly the answer we want.
  return doc.defaultView ?? null;
}

/** Pull the declaration for `name` out of a `style="…"` attribute. */
function inlineDeclaration(el: Element, name: string): string | null {
  const attr = el.getAttribute("style");
  if (!attr) return null;
  // Custom-property names cannot contain ":" or ";", so splitting on those stays
  // faithful even when the value carries commas (as `rgb()` does).
  for (const part of attr.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim().toLowerCase() === name.toLowerCase()) {
      return part.slice(idx + 1).trim() || null;
    }
  }
  return null;
}

/**
 * Read a custom property off `el`, following `var()` references by hand.
 *
 * `getComputedStyle().getPropertyValue("--x")` returns the declaration as
 * authored for a non-inherited property, so a site that writes
 * `--primary: var(--brand)` yields a useless `"var(--brand)"`. The jump is to
 * wherever that name is actually declared — which for an inherited custom
 * property is anywhere up the tree, hence the walk. Bounded and cycle-guarded,
 * because a malformed chain must never turn into a loop on a hover path.
 */
function readCustomProperty(
  el: Element,
  name: string,
  live: boolean,
  view?: Window | null,
): string | null {
  let current: Element | null = el;
  let target = name;
  const seen = new Set<string>();
  for (let depth = 0; depth < 24 && current; depth += 1) {
    let raw = "";
    if (live) {
      // Use the scope's own window when it has one: the previewed page may be a
      // same-origin iframe, whose styles the host window cannot resolve.
      const cs = view ? view.getComputedStyle(current) : getComputedStyle(current);
      raw = cs.getPropertyValue(target).trim();
    } else {
      raw = inlineDeclaration(current, target)?.trim() ?? "";
    }
    if (!raw) {
      current = current.parentElement;
      continue;
    }
    // A value that is itself a colour wins immediately; anything else may be a
    // `var()` reference worth chasing, or noise we cannot use.
    if (parseColor(raw)) return raw;
    const ref = VAR_REF.exec(raw)?.[1];
    if (!ref || seen.has(ref.toLowerCase())) return null;
    seen.add(ref.toLowerCase());
    target = ref;
    current = current.parentElement;
  }
  return null;
}

/** First of the known brand-variable names on `el` that resolves to a colour. */
function accentFromElement(el: Element, live: boolean, view?: Window | null): string | null {
  for (const name of ACCENT_VARS) {
    const hit = accept(parseColor(readCustomProperty(el, name, live, view)));
    if (hit) return hit;
  }
  return null;
}

/** Class selectors in this document's own stylesheets that declare one of the
 *  brand-variable names, so their elements can be probed directly. Only simple
 *  `.class` chains are accepted: anything more exotic is not worth a
 *  `querySelector`, and a bad selector must never throw. */
function declaredVariableSelectors(scope: AccentScope): string[] {
  const doc = isDocument(scope) ? scope : scope.ownerDocument;
  if (!doc) return [];
  const found: string[] = [];
  for (const sheet of doc.styleSheets) {
    let rules: CSSRuleList | null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet: reading it throws
    }
    if (!rules) continue;
    collectVariableSelectors(rules, found);
    if (found.length >= 8) return found;
  }
  return found;
}

/** Walk a rule list, descending into grouping rules (`@media`, `@scope`, …),
 *  which is where a framework's theme block usually sits. */
function collectVariableSelectors(rules: Iterable<CSSRule>, found: string[]): void {
  for (const rule of Array.from(rules)) {
    if (found.length >= 8) return;
    const nested = (rule as CSSGroupingRule).cssRules;
    if (nested) {
      collectVariableSelectors(nested, found);
      continue;
    }
    const selector = rule instanceof CSSStyleRule ? rule.selectorText : "";
    if (!selector) continue;
    if (!ACCENT_VARS.some((v) => rule.cssText.includes(`${v}:`))) continue;
    for (const part of selector.split(",")) {
      const sel = part.trim();
      if (/^\.[\w-]+(?:\s*>\s*\.[\w-]+)*$/.test(sel) && sel.length <= 64) found.push(sel);
    }
  }
}

/**
 * The places a brand variable actually lives: `:root`/`<html>` (where a
 * stylesheet declares it), `<body>` (some sites put them there instead), any
 * element carrying inline styles (where frameworks set them at runtime), and the
 * first element matching each class selector that declares one in this document's
 * own CSS. Walking every node would cost a full style flush on a hover path, so
 * the last group is discovered from the CSS text — free of the cascade — instead
 * of by probing elements.
 */
function accentHosts(scope: AccentScope): Element[] {
  const hosts: Element[] = [];
  if (isDocument(scope)) {
    if (scope.documentElement) hosts.push(scope.documentElement);
    if (scope.body && scope.body !== scope.documentElement) hosts.push(scope.body);
  } else {
    hosts.push(scope);
  }
  for (const el of scope.querySelectorAll<HTMLElement>("*[style]")) {
    hosts.push(el);
    if (hosts.length > 16) break;
  }
  for (const sel of declaredVariableSelectors(scope)) {
    try {
      const el = scope.querySelector(sel);
      if (el && !hosts.includes(el)) hosts.push(el);
    } catch {
      /* a selector the browser rejects — skip it */
    }
    if (hosts.length > 24) break;
  }
  return hosts;
}

/** Custom-property lookup across the accent hosts above. */
function customProperty(scope: AccentScope, live: boolean, view?: Window | null): string | null {
  for (const el of accentHosts(scope)) {
    const hit = accentFromElement(el, live, view);
    if (hit) return hit;
  }
  return null;
}

/**
 * Last resort for markup with no live cascade (a fetch reply parsed by
 * `DOMParser`): scan the author CSS text for a brand variable holding a colour.
 * External stylesheets never load in a parsed document, so this only ever sees
 * `<style>` blocks — which is where a site's theme variables live in practice.
 */
function declaredVariableStyles(scope: AccentScope): string | null {
  for (const el of scope.querySelectorAll<HTMLElement>("style")) {
    const text = el.textContent;
    if (!text) continue;
    for (const name of ACCENT_VARS) {
      // Custom-property names are case-sensitive; anchoring on the exact spelling
      // keeps `--primary-dark` from answering for `--primary`.
      const at = text.indexOf(`${name}:`);
      if (at < 0) continue;
      const value = text.slice(at + name.length + 1, at + name.length + 40);
      // A value that is itself a `var()` reference needs the cascade we do not
      // have here, so skip it rather than guess.
      if (/^\s*var\(/i.test(value)) continue;
      const hit = accept(parseColor(COLOR_DECL.exec(value)?.[1]));
      if (hit) return hit;
    }
  }
  return null;
}

/** The colour the most links share, if any repeats enough to be called a theme. */
function dominantLinkColor(
  scope: AccentScope,
  live: boolean,
  view?: Window | null,
): string | null {
  const counts = new Map<string, number>();
  let seen = 0;
  for (const el of scope.querySelectorAll<HTMLElement>("a[href]")) {
    if (seen >= MAX_COLOR_SAMPLES) break;
    seen += 1;
    // A link's colour is normally inherited from `--primary`/`--link-color`
    // rather than set on it, so reading the variables off the link itself catches
    // both cases in one pass — and no element nested inside another anchor is
    // ever visited, because querySelectorAll returns non-overlapping subtrees.
    const style = view ? view.getComputedStyle(el) : getComputedStyle(el);
    let parsed = live ? parseColor(style.color) : null;
    // Read the variables straight off this link: a custom property inherits, so
    // its value is already resolved here — no ancestor walk needed.
    let rgbFromVars: Rgb | null = null;
    if (!parsed || isNeutral(parsed)) {
      for (const name of ACCENT_VARS) {
        const raw = live
          ? style.getPropertyValue(name).trim()
          : inlineDeclaration(el, name)?.trim() ?? "";
        const candidate = parseColor(raw);
        if (candidate && !isNeutral(candidate)) {
          rgbFromVars = candidate;
          break;
        }
      }
    }
    // A variable that resolves to a colour beats a neutral inherited `color`.
    if (rgbFromVars && (!parsed || isNeutral(parsed))) parsed = rgbFromVars;
    if (!parsed || isNeutral(parsed)) continue;
    const key = `${parsed.r},${parsed.g},${parsed.b}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bestKey: string | null = null;
  let bestCount = MIN_COLOR_HITS - 1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  if (!bestKey) return null;
  const [r, g, b] = bestKey.split(",").map(Number);
  return accept({ r: r ?? 0, g: g ?? 0, b: b ?? 0 });
}

/**
 * Best guess at the accent of `scope` (the host page, a same-origin frame, or a
 * parsed fetch reply). `null` — the caller should fall back to the default theme
 * colour.
 */
export function extractPageAccent(scope: AccentScope): string | null {
  try {
    const declared = accept(
      parseColor(scope.querySelector<HTMLMetaElement>('meta[name="theme-color" i]')?.content),
    );
    if (declared) return declared;
    const doc = isDocument(scope) ? scope : scope.ownerDocument;
    const view = styleViewFor(doc);
    if (view) return customProperty(scope, true, view) ?? dominantLinkColor(scope, true, view);
    // No cascade to read: inline declarations and the author CSS text are all
    // that survives. The host page still gets probed afterwards (see preview.ts).
    return customProperty(scope, false, null) ?? declaredVariableStyles(scope);
  } catch {
    // Cross-origin/opaque documents and hostile pages can throw out of
    // querySelectorAll/getComputedStyle; an unknown colour is just "no colour".
    return null;
  }
}

/**
 * The same extraction run against the page Prelook is standing on, for windows
 * whose own content carries nothing readable (cross-origin iframe embeds, failed
 * fetches, power-saving mode with no preflight).
 */
export function extractHostAccent(): string | null {
  return extractPageAccent(document);
}
