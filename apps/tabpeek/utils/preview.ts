import { extractReaderContent, renderReaderInto } from "@/utils/extract";
import type { I18n } from "@/utils/i18n";
import type { PowerState } from "@/utils/power";
import type { RiskReason } from "@/utils/safety";
import {
  WINDOW_THEMES,
  clampSettings,
  type TabPeekSettings,
  type WindowThemePreset,
} from "@/utils/storage";

export interface AnchorInfo {
  url: string;
  rect: DOMRect;
  pointer: { x: number; y: number };
  /** Offline risk hint for this link, shown read-only in the header */
  risk?: RiskReason;
  /** Sidebar override for this window, used by the browser context menu:
   *  `true` forces the sidebar, `false` forces a floating window (falling back
   *  to `center` when the configured position is the sidebar), `undefined`
   *  follows `settings.position`. */
  sidebar?: boolean;
}

interface FetchReply {
  ok: boolean;
  canEmbed: boolean;
  finalUrl?: string;
  title?: string;
  favicon?: string;
  html?: string;
}

interface WindowInstance {
  id: number;
  url: string;
  root: HTMLElement;
  body: HTMLElement;
  titleEl: HTMLElement;
  faviconEl: HTMLImageElement;
  readerBadge: HTMLElement;
  riskBadge: HTMLElement;
  headEl: HTMLElement;
  closeTimer?: ReturnType<typeof setTimeout>;
  loadTimer?: ReturnType<typeof setTimeout>;
  /** Pending removal of the element after its fade-out */
  fadeTimer?: ReturnType<typeof setTimeout>;
  /** Size set by dragging the corner grip, in pixels */
  manualSize?: { w: number; h: number };
  iframe?: HTMLIFrameElement;
  fetchResult?: FetchReply;
  closed: boolean;
  manualPosition: boolean;
  /** `undefined` follows settings; `true`/`false` override the sidebar mode */
  sidebar?: boolean;
  risk?: RiskReason;
  /** Pointer is inside this window — drives the backdrop focus effect */
  hovered: boolean;
  /** Pinned windows survive pointer release and are never evicted */
  pinned: boolean;
  pinBtnEl: HTMLButtonElement;
  reloadBtnEl: HTMLButtonElement;
  openBtnEl: HTMLButtonElement;
  closeBtnEl: HTMLButtonElement;
  lastPointer: { x: number; y: number };
  lastAnchorTop: number;
  lastAnchorBottom: number;
}

export interface PreviewSystem {
  open(info: AnchorInfo): void;
  keep(url: string): void;
  releaseExcept(url: string | null): void;
  /** Countdown bar shown at the pointer while a trigger delay elapses */
  startProgress(x: number, y: number, durationMs: number): void;
  cancelProgress(): void;
  /** Frame the hovered link; `null` hides it */
  highlightLink(anchor: Element | null): void;
  /** Close every unpinned window at once (outside click / scroll triggers) */
  dismissUnpinned(): void;
  applySettings(s: TabPeekSettings): void;
  /** Re-apply the effects the power state gates (backdrop blur, highlight) */
  applyPower(): void;
  destroy(): void;
}

const IFRAME_LOAD_TIMEOUT_MS = 8_000;
const AUTO_CLOSE_GRACE_MS = 400;
/** The window header's four icons; static markup, no user input involved. One
 *  thin-stroke set at a 24 grid, so pin / reload / open / close keep the same
 *  weight and optical size. */
const ICON_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const PIN_ICON = `<svg ${ICON_ATTRS}><path d="M10 3h4v6l3 3v2H7v-2l3-3z"/><path d="M12 14v7"/></svg>`;
const RELOAD_ICON = `<svg ${ICON_ATTRS}><polyline points="22 4 22 10 16 10"/><path d="M19.5 15a8 8 0 1 1-1.9-8.3L22 10"/></svg>`;
/** Arrow up and out — the same meaning as the ↗ glyph this replaced. */
const OPEN_ICON = `<svg ${ICON_ATTRS}><path d="M7 17 17 7"/><polyline points="8 7 17 7 17 16"/></svg>`;
const CLOSE_ICON = `<svg ${ICON_ATTRS}><path d="M6 6l12 12M18 6 6 18"/></svg>`;

/** Smallest size the corner grip can drag a window down to. */
const MIN_RESIZE_W = 240;
const MIN_RESIZE_H = 160;

/** Backdrop strength (the `blurStrength` percentage) → blur radius and dim. */
const MAX_BLUR_PX = 14;
const MAX_DIM = 0.5;

/** Window fade-in/out duration; keep in sync with the .tp-win transition. */
const FADE_MS = 180;
/** Teardown delay after the fade; also the "no fade" case's frame of slack. */
const FADE_SLACK_MS = 40;

/** How long the "every slot is pinned" notice stays on screen. */
const NOTICE_MS = 2600;

/** Distance between the pointer and the trigger countdown bar. */
const PROGRESS_BAR_GAP = 18;
/** Only used if the bar cannot be measured (display:none fallback). */
const PROGRESS_BAR_FALLBACK_W = 72;
const PROGRESS_BAR_FALLBACK_H = 6;

const STYLE = `
:host {
  all: initial;
  /* Window surface tokens. The app theme sets the defaults; a window theme
     preset overrides them per window (inline, so it always wins). */
  --tp-base: #fff;
  --tp-ink: #1f2328;
  --tp-surface: #fff;
  --tp-line: color-mix(in srgb, var(--tp-ink) 12%, transparent);
  --tp-soft: color-mix(in srgb, var(--tp-ink) 7%, var(--tp-surface));
  /* Opacity of the frosted header's fill. Below 100% the page behind the window
     shows through it, which is what the blur has to sample; anything that
     switches the blur off raises this to 100% instead. */
  --tp-glass: 78%;
}
:host([data-tp-theme='dark']) {
  --tp-base: #1e2126;
  --tp-ink: #e6e8eb;
  --tp-surface: #1e2126;
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
.tp-overlay {
  position: fixed; inset: 0; z-index: 2147483640; pointer-events: none;
  backdrop-filter: blur(var(--tp-blur, 0px));
  background: rgba(0, 0, 0, var(--tp-dim, 0));
  opacity: 0; transition: opacity .18s ease;
}
.tp-overlay.tp-on { opacity: 1; }
.tp-win {
  position: fixed; z-index: 2147483641; display: flex; flex-direction: column;
  width: var(--tp-w, 40%); height: var(--tp-h, 55%);
  color: var(--tp-ink); border-radius: 14px; overflow: hidden;
  /* Deliberately no background: an opaque root would sit between the header's
     glass and the page, leaving the blur nothing to sample. The opaque surface
     lives on .tp-body (and on the header's own fill), and overflow: hidden still
     clips both to the rounded corners. */
  border: 1px solid var(--tp-line); box-shadow: 0 12px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12);
  /* Starts transparent; .tp-in fades it in, .tp-out fades it out before the
     element is dropped from the DOM (see closeWindow). */
  opacity: 0; transition: opacity .18s ease;
}
.tp-win.tp-in { opacity: 1; }
.tp-win.tp-out { opacity: 0; pointer-events: none; }
.tp-win.tp-sidebar { border-radius: 0; height: 100vh; }
.tp-head {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  /* Frosted bar: a translucent fill (accent tint fading into the surface) over a
     blurred sample of whatever is behind the window. */
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--tp-accent, #4f6bf6) 14%, transparent), transparent),
    color-mix(in srgb, var(--tp-surface) var(--tp-glass), transparent);
  backdrop-filter: blur(14px) saturate(1.5);
  border-bottom: 1px solid var(--tp-line); flex: none; user-select: none;
}
/* Power saving switches the page blur off, so the bar must not keep looking
   through to a page it can no longer blur — same for engines without
   backdrop-filter support. Both cases fall back to the opaque surface fill. */
.tp-win.tp-nofrost .tp-head { --tp-glass: 100%; backdrop-filter: none; }
@supports not (backdrop-filter: blur(2px)) {
  .tp-head { --tp-glass: 100%; backdrop-filter: none; }
}
.tp-favicon { width: 16px; height: 16px; flex: none; border-radius: 3px; }
.tp-favicon.tp-hide { display: none; }
.tp-title { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-badge { display: none; flex: none; font-size: 11px; line-height: 1; padding: 3px 7px; border-radius: 999px; background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 14%, #fff); color: var(--tp-accent, #4f6bf6); }
.tp-badge.tp-show { display: inline-block; }
.tp-risk {
  background: color-mix(in srgb, #f59e0b 24%, var(--tp-surface));
  color: color-mix(in srgb, #b45309 78%, var(--tp-ink));
  cursor: help;
}
.tp-btn { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: color-mix(in srgb, var(--tp-ink) 68%, transparent); cursor: pointer; }
/* Every header button is the same thin-stroke icon, so the bar reads as one set
   (mixing SVG with font glyphs put two weights and two baselines side by side). */
.tp-btn svg { width: 15px; height: 15px; display: block; }
/* Hover and pinned fills mix toward transparent rather than the surface: they
   sit on the frosted bar, where an opaque chip would break the glass. */
.tp-btn:hover { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 22%, transparent); color: var(--tp-accent, #4f6bf6); }
.tp-pin svg { transform: rotate(45deg); transition: transform .15s ease; }
.tp-pin.tp-on { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 26%, transparent); color: var(--tp-accent, #4f6bf6); }
.tp-pin.tp-on svg { transform: rotate(0deg); }
.tp-resize {
  position: absolute; right: 0; bottom: 0; width: 16px; height: 16px;
  cursor: nwse-resize; opacity: .45; transition: opacity .15s ease;
  background: linear-gradient(135deg, transparent 46%, #8c959f 46%, #8c959f 56%, transparent 56%,
    transparent 68%, #8c959f 68%, #8c959f 78%, transparent 78%);
}
.tp-resize:hover { opacity: .9; }
.tp-win.tp-sidebar .tp-resize { display: none; }
.tp-win.tp-resizing { user-select: none; }
.tp-body { position: relative; flex: 1; min-height: 0; background: var(--tp-surface); }
.tp-body > iframe { width: 100%; height: 100%; border: 0; display: block; }
.tp-skeleton { position: absolute; inset: 0; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.tp-skeleton i { display: block; height: 14px; border-radius: 6px; background: linear-gradient(90deg, var(--tp-soft) 25%, color-mix(in srgb, var(--tp-surface) 70%, var(--tp-soft)) 50%, var(--tp-soft) 75%); background-size: 200% 100%; animation: tp-shimmer 1.2s infinite; }
.tp-skeleton i:first-child { height: 22px; width: 60%; }
.tp-skeleton i:nth-child(2) { width: 90%; }
.tp-skeleton i:nth-child(3) { width: 80%; }
.tp-skeleton i:nth-child(4) { width: 85%; }
@keyframes tp-shimmer { to { background-position: -200% 0; } }
.tp-reader { position: absolute; inset: 0; overflow: auto; padding: 22px 26px; font-size: 15px; line-height: 1.75; color: #24292f; }
.tp-reader h1.tp-r-title { font-size: 21px; line-height: 1.4; margin-bottom: 14px; }
.tp-reader p { margin: 0 0 12px; }
.tp-reader img { max-width: 100%; height: auto; border-radius: 8px; margin: 6px 0; }
.tp-reader h2, .tp-reader h3, .tp-reader h4 { margin: 18px 0 8px; line-height: 1.45; }
.tp-reader ul, .tp-reader ol { margin: 0 0 12px 22px; }
.tp-reader a { color: var(--tp-accent, #4f6bf6); text-decoration: none; }
.tp-reader a:hover { text-decoration: underline; }
.tp-reader pre { background: var(--tp-soft); padding: 10px 12px; border-radius: 8px; overflow: auto; margin-bottom: 12px; }
.tp-error { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 24px; font-size: 13px; color: color-mix(in srgb, var(--tp-ink) 62%, transparent); }
.tp-error button { border: 0; border-radius: 8px; padding: 8px 14px; background: var(--tp-accent, #4f6bf6); color: #fff; font-size: 13px; cursor: pointer; }
/* ---------- dark appearance ---------- */
/* The resolved theme is written to the shadow host as data-tp-theme (see
   content.ts), so both this file's UI and the selection toolbar follow it. */
:host([data-tp-theme='dark']) { color-scheme: dark; }
:host([data-tp-theme='dark']) .tp-notice { background: #e6e8eb; color: #15171a; }
.tp-progress {
  position: fixed; z-index: 2147483647; display: none;
  width: 72px; height: 6px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,.92); border: 1px solid rgba(0,0,0,.08);
  box-shadow: 0 2px 10px rgba(0,0,0,.28);
  /* Never hit-tested: while a hover counts down the bar sits next to the
     pointer, and swallowing pointerover would cancel the hover itself. */
  pointer-events: none;
}
.tp-progress.tp-show { display: block; }
.tp-progress-fill { height: 100%; width: 0; border-radius: inherit; background: var(--tp-accent, #4f6bf6); }
.tp-notice {
  position: fixed; z-index: 2147483647; display: none;
  max-width: 300px; padding: 7px 11px; border-radius: 9px;
  background: #1f2328; color: #fff; font-size: 12px; line-height: 1.45;
  box-shadow: 0 8px 26px rgba(0,0,0,.32);
  /* Same reason as the progress bar: it must never swallow pointer events. */
  pointer-events: none;
}
.tp-notice.tp-show { display: block; }
.tp-hl {
  position: fixed; z-index: 2147483640; opacity: 0; transition: opacity .12s ease;
  border: 2px solid var(--tp-accent, #4f6bf6); border-radius: 4px;
  background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 12%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tp-accent, #4f6bf6) 22%, transparent);
  /* Never hit-tested: it sits exactly on the hovered link. */
  pointer-events: none;
}
.tp-hl.tp-show { opacity: 1; }
/* ---------- reduced motion ---------- */
/* Set by content.ts (data-tp-motion) from the settings plus the OS preference.
   Every transition in here is decorative, so one attribute kills them all; the
   countdown bar's fill transition is armed in JS instead (see startProgress). */
:host([data-tp-motion]) .tp-overlay,
:host([data-tp-motion]) .tp-win,
:host([data-tp-motion]) .tp-hl,
:host([data-tp-motion]) .tp-pin svg,
:host([data-tp-motion]) .tp-resize { transition: none; }
:host([data-tp-motion]) .tp-skeleton i { animation: none; }
`;

export { STYLE as PREVIEW_STYLE };

export interface PreviewDeps {
  getSettings: () => TabPeekSettings;
  getMaxWindows: () => number;
  /** Resolved power state; it may only take work away, never add it */
  getPower: () => PowerState;
  i18n: I18n;
}

/**
 * Builds the window content root (with overlay + windows) inside a container
 * managed by `createShadowRootUi`. Returns the imperative controller plus the
 * overlay element so the caller can include it in the shadow UI.
 */
export function createPreviewSystem(deps: PreviewDeps, shadow: ShadowRoot): PreviewSystem {
  const overlay = document.createElement("div");
  overlay.className = "tp-overlay";
  shadow.appendChild(overlay);
  const highlight = document.createElement("div");
  highlight.className = "tp-hl";
  let highlighted: Element | null = null;
  const notice = document.createElement("div");
  notice.className = "tp-notice";
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  const progressBar = document.createElement("div");
  progressBar.className = "tp-progress";
  const progressFill = document.createElement("div");
  progressFill.className = "tp-progress-fill";
  progressBar.appendChild(progressFill);
  shadow.appendChild(progressBar);
  shadow.appendChild(notice);
  shadow.appendChild(highlight);
  const windows: WindowInstance[] = [];
  let nextId = 1;
  let zIndex = 2147483641;

  function settings(): TabPeekSettings {
    return clampSettings(deps.getSettings());
  }

  /** 0 while power is being saved — the CSS transition is off as well (the
   *  `data-tp-motion` host attribute), so the element goes straight to its
   *  final opacity and only the teardown delay is left. */
  function fadeMs(): number {
    return deps.getPower().reduceMotion ? 0 : FADE_MS;
  }

  /** Backdrop strength after the power state has had its say: blurring the page
   *  is a GPU cost, so saving power drops it without touching the setting. */
  function blurStrength(): number {
    return deps.getPower().level === "off" ? settings().blurStrength : 0;
  }

  /** The header's glass is a backdrop blur too, so it rides the same switch: with
   *  the blur away the bar goes opaque rather than showing a page it cannot blur. */
  function frostDisabled(): boolean {
    return deps.getPower().level !== "off";
  }

  /** Configured percentages, resolved against the viewport for layout maths. */
  function windowSize(): { w: number; h: number } {
    const s = settings();
    return {
      w: Math.round((innerWidth * s.width) / 100),
      h: Math.round((innerHeight * s.height) / 100),
    };
  }

  /** Actual size of a window: a corner-dragged one keeps its pixels. */
  function sizeFor(win: WindowInstance): { w: number; h: number } {
    return win.manualSize ?? windowSize();
  }

  /** A window's effective position: its sidebar override wins over settings. */
  function positionOf(win: WindowInstance): TabPeekSettings["position"] {
    const configured = settings().position;
    if (win.sidebar === true) return "sidebar";
    if (win.sidebar === false && configured === "sidebar") return "center";
    return configured;
  }

  /** The selected preset, falling back to the first one if the id is unknown. */
  function windowPreset(s: TabPeekSettings): WindowThemePreset {
    return WINDOW_THEMES.find((w) => w.id === s.windowTheme) ?? WINDOW_THEMES[0]!;
  }

  /** "tint" presets mix the accent into the app theme's base surface (so dark
   *  mode still works); "dark" presets bring their own surface and ink. The
   *  accent itself always comes from here too: a window is coloured by its own
   *  theme (the preset's accent, or `windowColor` for "custom"), never by the
   *  plugin accent (`themeColor`) that paints the rest of TabPeek's UI. */
  function applyWindowTheme(root: HTMLElement, preset: WindowThemePreset, customColor: string) {
    root.style.setProperty("--tp-accent", preset.id === "custom" ? customColor : preset.accent);
    if (preset.kind === "dark") {
      root.style.setProperty("--tp-surface", preset.surface ?? "#1e2432");
      root.style.setProperty("--tp-ink", preset.ink ?? "#e7eaf0");
      return;
    }
    root.style.setProperty(
      "--tp-surface",
      "color-mix(in srgb, var(--tp-accent) 7%, var(--tp-base))",
    );
    root.style.removeProperty("--tp-ink");
  }

  function applyVisualVars() {
    const s = settings();
    const strength = Math.min(100, Math.max(0, blurStrength())) / 100;
    overlay.style.setProperty("--tp-blur", `${(strength * MAX_BLUR_PX).toFixed(2)}px`);
    overlay.style.setProperty("--tp-dim", `${(strength * MAX_DIM).toFixed(3)}`);
    overlay.style.setProperty("--tp-accent", s.themeColor);
    highlight.style.setProperty("--tp-accent", s.themeColor);
    for (const win of windows) {
      applyWindowTheme(win.root, windowPreset(s), s.windowColor);
      win.root.style.setProperty("--tp-w", `${s.width}%`);
      win.root.style.setProperty("--tp-h", `${s.height}%`);
      win.root.classList.toggle("tp-nofrost", frostDisabled());
    }
  }

  function openOrderIndex(win: WindowInstance): number {
    return windows.filter((w) => !w.closed).indexOf(win);
  }

  function place(win: WindowInstance) {
    if (win.manualPosition) return;
    const s = settings();
    const vw = innerWidth;
    const vh = innerHeight;
    const order = openOrderIndex(win);

    const pos = positionOf(win);
    win.root.classList.toggle("tp-sidebar", pos === "sidebar");

    if (pos === "sidebar") {
      // A docked sidebar always uses the configured width/height.
      win.manualSize = undefined;
      win.root.style.removeProperty("width");
      win.root.style.removeProperty("height");
      const offset = order * windowSize().w;
      // Height comes from the .tp-sidebar class: an inline height would survive
      // a later switch back to a floating window.
      win.root.style.top = "0px";
      win.root.style.left = "auto";
      if (s.sidebarSide === "right") {
        win.root.style.right = `${offset}px`;
      } else {
        win.root.style.right = "auto";
        win.root.style.left = `${offset}px`;
      }
      return;
    }

    const stack = order * 26;
    const { w, h } = sizeFor(win);
    let x: number;
    let y: number;
    switch (pos) {
      case "link":
        x = win.lastPointer.x - w / 2;
        y = win.lastAnchorBottom + 12;
        if (y + h > vh - 8) {
          y = win.lastAnchorTop - h - 12;
          if (y < 8) {
            y = Math.min(win.lastAnchorBottom + 12, vh - h - 8);
          }
        }
        break;
      case "mouse":
        x = win.lastPointer.x + 16;
        y = win.lastPointer.y + 18;
        break;
      case "top-right":
        x = vw - w - 16;
        y = 16;
        break;
      case "bottom-left":
        x = 16;
        y = vh - h - 16;
        break;
      case "center":
        x = (vw - w) / 2;
        y = (vh - h) / 2;
        break;
      case "bottom-right":
      default:
        x = vw - w - 16;
        y = vh - h - 16;
        break;
    }
    x += stack;
    y += stack;
    x = Math.min(Math.max(8, x), Math.max(8, vw - w - 8));
    y = Math.min(Math.max(8, y), Math.max(8, vh - h - 8));
    // Size comes from the --tp-w/--tp-h percentages, so it follows the viewport.
    win.root.style.left = `${x}px`;
    win.root.style.top = `${y}px`;
    win.root.style.right = "auto";
  }

  function find(url: string): WindowInstance | undefined {
    return windows.find((w) => !w.closed && w.url === url);
  }

  function clearClose(win: WindowInstance | undefined) {
    if (win?.closeTimer) {
      clearTimeout(win.closeTimer);
      win.closeTimer = undefined;
    }
  }

  function keep(url: string) {
    clearClose(find(url));
  }

  /** Pin/unpin a window; pinning also cancels an auto-close already pending. */
  function setPinned(win: WindowInstance, pinned: boolean) {
    win.pinned = pinned;
    if (pinned) clearClose(win);
    syncHeaderButtons(win);
  }

  /** Header tooltips follow both the pin state and the current UI language. */
  function syncHeaderButtons(win: WindowInstance) {
    win.pinBtnEl.classList.toggle("tp-on", win.pinned);
    win.pinBtnEl.setAttribute("aria-pressed", String(win.pinned));
    win.pinBtnEl.title = deps.i18n.t(win.pinned ? "preview.unpin" : "preview.pin");
    win.reloadBtnEl.title = deps.i18n.t("preview.reload");
    win.openBtnEl.title = deps.i18n.t("preview.openTab");
    win.closeBtnEl.title = deps.i18n.t("preview.close");
    if (win.readerBadge.classList.contains("tp-show")) {
      win.readerBadge.textContent = deps.i18n.t("preview.readerBadge");
    }
    if (win.risk) {
      const label = `⚠ ${deps.i18n.t(`risk.${win.risk}`)}`;
      win.riskBadge.textContent = label;
      win.riskBadge.title = label;
      win.riskBadge.classList.add("tp-show");
    }
  }

  function releaseExcept(url: string | null) {
    // "Close when the pointer leaves" is the switch for the whole auto-close
    // path: with it off, windows stay until something else closes them.
    if (!settings().closeOnMouseLeave) return;
    for (const win of windows) {
      if (win.closed || win.url === url || win.pinned) continue;
      clearClose(win);
      win.closeTimer = setTimeout(() => closeWindow(win), AUTO_CLOSE_GRACE_MS);
    }
  }

  /** `win.closed` flips immediately (so it stops counting as open, stops being
   *  positioned and ignores clicks); the element itself lingers only long enough
   *  to fade out, then is removed. */
  /** Immediate (but still animated) close of every unpinned window. */
  function dismissUnpinned() {
    for (const win of [...windows]) {
      if (!win.closed && !win.pinned) closeWindow(win);
    }
  }

  function closeWindow(win: WindowInstance, animate = true) {
    if (win.closed) return;
    win.closed = true;
    clearClose(win);
    if (win.loadTimer) clearTimeout(win.loadTimer);
    const i = windows.indexOf(win);
    if (i >= 0) windows.splice(i, 1);
    for (const other of windows) if (!other.manualPosition) place(other);
    syncOverlay();
    if (!animate) {
      win.iframe?.setAttribute("src", "about:blank");
      win.root.remove();
      return;
    }
    win.root.classList.remove("tp-in");
    win.root.classList.add("tp-out");
    win.fadeTimer = setTimeout(() => {
      // Release the frame only once it is invisible, so the fade never shows a
      // blank iframe.
      win.iframe?.setAttribute("src", "about:blank");
      win.root.remove();
    }, fadeMs() + FADE_SLACK_MS);
  }

  /** The backdrop is a focus effect: it only appears while the pointer is on a
   *  preview window (and a strength is configured), so the page stays readable
   *  the moment you look away. */
  function syncOverlay() {
    const wanted = blurStrength() > 0 && windows.some((w) => !w.closed && w.hovered);
    overlay.classList.toggle("tp-on", wanted);
  }

  function skeletonEl(): HTMLElement {
    const skeleton = document.createElement("div");
    skeleton.className = "tp-skeleton";
    skeleton.append(...[0, 1, 2, 3].map(() => document.createElement("i")));
    return skeleton;
  }

  function setBodyContent(win: WindowInstance, el: HTMLElement) {
    win.body.innerHTML = "";
    win.body.appendChild(el);
  }

  function renderIframe(win: WindowInstance) {
    const frame = document.createElement("iframe");
    frame.src = win.url;
    frame.referrerPolicy = "no-referrer-when-downgrade";
    win.iframe = frame;
    setBodyContent(win, frame);
    win.loadTimer = setTimeout(() => {
      win.loadTimer = undefined;
      fallbackToReader(win);
    }, IFRAME_LOAD_TIMEOUT_MS);
    frame.addEventListener("load", () => {
      if (win.loadTimer) {
        clearTimeout(win.loadTimer);
        win.loadTimer = undefined;
      }
    });
  }

  function fallbackToReader(win: WindowInstance) {
    const result = win.fetchResult;
    if (!result?.html) return showError(win);
    const reader = extractReaderContent(result.html, result.finalUrl ?? win.url);
    if (!reader) return showError(win);
    setBodyContent(win, renderReaderInto(reader, deps.i18n, win.url));
    win.readerBadge.textContent = deps.i18n.t("preview.readerBadge");
    win.readerBadge.classList.add("tp-show");
    win.iframe = undefined;
  }

  function showError(win: WindowInstance) {
    const box = document.createElement("div");
    box.className = "tp-error";
    const span = document.createElement("span");
    span.textContent = deps.i18n.t("preview.failed");
    const btn = document.createElement("button");
    btn.textContent = deps.i18n.t("preview.openTab");
    btn.addEventListener("click", () => {
      void browser.runtime.sendMessage({ type: "tabpeek:openTab", url: win.url });
      closeWindow(win);
    });
    box.append(span, btn);
    setBodyContent(win, box);
  }

  async function loadFlow(win: WindowInstance) {
    // Maximum power saving drops the preflight: nothing is fetched in the
    // background, so no title/favicon and no reader fallback — the iframe is
    // embedded blind, and a site that refuses to be framed just fails.
    if (deps.getPower().level === "max") {
      renderIframe(win);
      return;
    }
    let reply: FetchReply | undefined;
    try {
      reply = (await browser.runtime.sendMessage({
        type: "tabpeek:fetch",
        url: win.url,
      })) as FetchReply | undefined;
    } catch {
      reply = undefined;
    }
    if (win.closed) return;
    win.fetchResult = reply;
    if (reply?.title) win.titleEl.textContent = reply.title;
    if (reply?.favicon) {
      win.faviconEl.src = reply.favicon;
      win.faviconEl.classList.remove("tp-hide");
      win.faviconEl.onerror = () => win.faviconEl.classList.add("tp-hide");
    }
    if (reply && !reply.canEmbed) {
      if (reply.html) fallbackToReader(win);
      else showError(win);
      return;
    }
    // Embeddable — or probe failed and the iframe attempt is the better guess.
    renderIframe(win);
  }

  function refreshTitlesAndBadges() {
    for (const win of windows) syncHeaderButtons(win);
  }

  function open(info: AnchorInfo) {
    const existing = find(info.url);
    if (existing) {
      if (info.sidebar !== undefined) existing.sidebar = info.sidebar;
      existing.manualPosition = false;
      existing.lastAnchorTop = info.rect.top;
      existing.lastAnchorBottom = info.rect.bottom;
      existing.lastPointer = info.pointer;
      place(existing);
      existing.root.style.zIndex = String(++zIndex);
      keep(info.url);
      return;
    }
    const max = Math.max(1, deps.getMaxWindows());
    while (windows.filter((w) => !w.closed).length >= max) {
      // Pinned windows are never evicted; if every window is pinned the new
      // preview is skipped rather than dropping one the user asked to keep.
      const victim = windows.find((w) => !w.closed && !w.pinned);
      if (!victim) {
        showNotice("preview.pinLimit", info.pointer.x, info.pointer.y, { max });
        return;
      }
      closeWindow(victim);
    }

    const s = settings();
    const root = document.createElement("div");
    root.className = "tp-win";
    root.style.zIndex = String(++zIndex);
    applyWindowTheme(root, windowPreset(s), s.windowColor);
    root.style.setProperty("--tp-w", `${s.width}%`);
    root.style.setProperty("--tp-h", `${s.height}%`);
    root.classList.toggle("tp-nofrost", frostDisabled());

    const head = document.createElement("div");
    head.className = "tp-head";
    const favicon = document.createElement("img");
    favicon.className = "tp-favicon tp-hide";
    favicon.alt = "";
    const titleEl = document.createElement("span");
    titleEl.className = "tp-title";
    titleEl.textContent = safeHostname(info.url);
    const riskBadge = document.createElement("span");
    riskBadge.className = "tp-badge tp-risk";
    const readerBadge = document.createElement("span");
    readerBadge.className = "tp-badge";
    const pinBtn = document.createElement("button");
    pinBtn.className = "tp-btn tp-pin";
    pinBtn.dataset.act = "pin";
    pinBtn.type = "button";
    pinBtn.innerHTML = PIN_ICON;
    const reloadBtn = document.createElement("button");
    reloadBtn.className = "tp-btn";
    reloadBtn.dataset.act = "reload";
    reloadBtn.type = "button";
    reloadBtn.innerHTML = RELOAD_ICON;
    const openBtn = document.createElement("button");
    openBtn.className = "tp-btn";
    openBtn.dataset.act = "open";
    openBtn.type = "button";
    openBtn.innerHTML = OPEN_ICON;
    const closeBtn = document.createElement("button");
    closeBtn.className = "tp-btn";
    closeBtn.dataset.act = "close";
    closeBtn.type = "button";
    closeBtn.innerHTML = CLOSE_ICON;
    head.append(favicon, titleEl, riskBadge, readerBadge, pinBtn, reloadBtn, openBtn, closeBtn);

    const grip = document.createElement("div");
    grip.className = "tp-resize";
    const body = document.createElement("div");
    body.className = "tp-body";
    body.appendChild(skeletonEl());
    root.append(head, body, grip);

    const win: WindowInstance = {
      id: nextId++,
      url: info.url,
      root,
      body,
      titleEl,
      faviconEl: favicon,
      readerBadge,
      riskBadge,
      headEl: head,
      closed: false,
      manualPosition: false,
      sidebar: info.sidebar,
      hovered: false,
      // Auto-pin is applied when a window is created, not to windows that are
      // already open: pinning everything on a settings change could hit the
      // window cap and stop new previews from opening.
      risk: info.risk,
      pinned: settings().autoPin,
      pinBtnEl: pinBtn,
      reloadBtnEl: reloadBtn,
      openBtnEl: openBtn,
      closeBtnEl: closeBtn,
      lastPointer: info.pointer,
      lastAnchorTop: info.rect.top,
      lastAnchorBottom: info.rect.bottom,
    };
    syncHeaderButtons(win);

    root.addEventListener("mousedown", () => {
      root.style.zIndex = String(++zIndex);
    });
    root.addEventListener("mouseover", () => {
      win.hovered = true;
      syncOverlay();
      keep(info.url);
    });
    root.addEventListener("mouseout", (e) => {
      // releasing happens on the page side; only cancel while inside the window
      const related = e.relatedTarget as Node | null;
      if (!related || !root.contains(related)) {
        win.hovered = false;
        syncOverlay();
        releaseExcept(null);
      }
    });
    head.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest?.("[data-act]") as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.act === "close") closeWindow(win);
      else if (btn.dataset.act === "pin") setPinned(win, !win.pinned);
      else if (btn.dataset.act === "reload") {
        // Re-runs fetch + render for this window: a fresh iframe navigation, or
        // a re-extract when the window is in reader mode.
        if (win.loadTimer) {
          clearTimeout(win.loadTimer);
          win.loadTimer = undefined;
        }
        setBodyContent(win, skeletonEl());
        void loadFlow(win);
      } else if (btn.dataset.act === "open") {
        void browser.runtime.sendMessage({ type: "tabpeek:openTab", url: win.url });
      }
    });

    if (positionOf(win) !== "sidebar") {
      let startX = 0;
      let startY = 0;
      let origX = 0;
      let origY = 0;
      let dragging = false;
      head.style.cursor = "grab";
      head.addEventListener("pointerdown", (e) => {
        if ((e.target as HTMLElement).closest("[data-act]")) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = root.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        head.setPointerCapture(e.pointerId);
      });
      head.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        win.manualPosition = true;
        root.style.left = `${Math.max(0, origX + e.clientX - startX)}px`;
        root.style.top = `${Math.max(0, origY + e.clientY - startY)}px`;
        root.style.right = "auto";
      });
      head.addEventListener("pointerup", () => {
        dragging = false;
      });

      // Corner grip: resizes this window only; the size is kept per window so a
      // later `place()` (settings change, viewport resize) still fits it on screen.
      let rzX = 0;
      let rzY = 0;
      let rzW = 0;
      let rzH = 0;
      let resizing = false;
      grip.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        resizing = true;
        rzX = e.clientX;
        rzY = e.clientY;
        const r = root.getBoundingClientRect();
        rzW = r.width;
        rzH = r.height;
        root.classList.add("tp-resizing");
        grip.setPointerCapture?.(e.pointerId);
      });
      grip.addEventListener("pointermove", (e) => {
        if (!resizing) return;
        const w = Math.round(
          Math.min(Math.max(MIN_RESIZE_W, rzW + e.clientX - rzX), innerWidth - 16),
        );
        const h = Math.round(
          Math.min(Math.max(MIN_RESIZE_H, rzH + e.clientY - rzY), innerHeight - 16),
        );
        win.manualSize = { w, h };
        root.style.width = `${w}px`;
        root.style.height = `${h}px`;
      });
      const endResize = (e: PointerEvent) => {
        if (!resizing) return;
        resizing = false;
        root.classList.remove("tp-resizing");
        grip.releasePointerCapture?.(e.pointerId);
      };
      grip.addEventListener("pointerup", endResize);
      grip.addEventListener("pointercancel", endResize);
    }

    shadow.appendChild(root);
    windows.push(win);
    place(win);
    syncOverlay();
    // Two frames: let the transparent state land before arming the fade.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add("tp-in"));
    });
    void loadFlow(win);
  }

  function applySettings(s: TabPeekSettings) {
    applyVisualVars();
    syncOverlay();
    if (!s.highlightLinks) highlightLink(null);
    for (const win of windows) {
      win.manualPosition = false;
      place(win);
    }
    refreshTitlesAndBadges();
  }

  /** Power state changed (setting, battery or the OS preference): the two effects
   *  it gates are the backdrop and the link frame. Windows stay where they are —
   *  a battery event must not re-place a window the user dragged. */
  function applyPower() {
    applyVisualVars();
    syncOverlay();
    if (deps.getPower().level === "max") highlightLink(null);
  }

  /** Percentage sizes change with the viewport, so re-run the layout on resize
   *  (positions are computed in pixels and would otherwise drift off-screen). */
  function onViewportResize() {
    for (const win of windows) if (!win.manualPosition) place(win);
    placeHighlight();
  }
  /** Scrolling moves the link under a still pointer: follow it. Windows stay
   *  where they were — a preview you are reading must not scroll away. */
  function onScroll() {
    placeHighlight();
    if (settings().closeOnScroll) dismissUnpinned();
  }
  window.addEventListener("resize", onViewportResize);
  window.addEventListener("scroll", onScroll, { capture: true, passive: true });

  function destroy() {
    window.removeEventListener("resize", onViewportResize);
    window.removeEventListener("scroll", onScroll, { capture: true });
    if (noticeTimer) clearTimeout(noticeTimer);
    for (const win of [...windows]) {
      if (win.fadeTimer) clearTimeout(win.fadeTimer);
      closeWindow(win, false);
    }
  }

  function startProgress(x: number, y: number, durationMs: number) {
    // With motion reduced the fill would be a still rectangle that says nothing
    // about the remaining delay, so the bar is dropped along with its
    // transition.
    if (deps.getPower().reduceMotion) return;
    const s = settings();
    progressFill.style.transition = "none";
    progressFill.style.width = "0";
    progressBar.style.setProperty("--tp-accent", s.themeColor);
    progressBar.classList.add("tp-show");
    // Size is only known once the bar is displayed, so show before measuring.
    const bw = progressBar.offsetWidth || PROGRESS_BAR_FALLBACK_W;
    const bh = progressBar.offsetHeight || PROGRESS_BAR_FALLBACK_H;
    const centerX = x - bw / 2;
    const bx = Math.min(Math.max(8, centerX), Math.max(8, innerWidth - bw - 8));
    // Above the pointer, so the cursor does not cover the fill; below it when
    // the top of the viewport leaves no room.
    const above = y - PROGRESS_BAR_GAP - bh;
    const below = Math.min(y + PROGRESS_BAR_GAP, Math.max(8, innerHeight - bh - 8));
    const by = above >= 8 ? above : below;
    progressBar.style.left = `${bx}px`;
    progressBar.style.top = `${by}px`;
    // Two frames: layout the 0% state before arming the linear fill.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressFill.style.transition = `width ${durationMs}ms linear`;
        progressFill.style.width = "100%";
      });
    });
  }

  /** Frame the hovered link. Called on every link hover; the setting decides
   *  whether anything is drawn. */
  function highlightLink(anchor: Element | null) {
    highlighted = anchor && settings().highlightLinks ? anchor : null;
    if (!highlighted) {
      highlight.classList.remove("tp-show");
      return;
    }
    placeHighlight();
    highlight.classList.add("tp-show");
  }

  /** Re-measure the framed link; the page may have scrolled or reflowed. */
  function placeHighlight() {
    if (!highlighted) return;
    if (!highlighted.isConnected) {
      highlighted = null;
      highlight.classList.remove("tp-show");
      return;
    }
    const r = highlighted.getBoundingClientRect();
    // +2/-2 compensates the 2px border drawn inside the box (border-box).
    highlight.style.left = `${r.left - 2}px`;
    highlight.style.top = `${r.top - 2}px`;
    highlight.style.width = `${r.width + 4}px`;
    highlight.style.height = `${r.height + 4}px`;
  }

  /** Explains why nothing opened: every slot is held by a pinned window. */
  function showNotice(key: string, x: number, y: number, params?: Record<string, string | number>) {
    notice.textContent = deps.i18n.t(key, params);
    notice.classList.add("tp-show");
    // Size is only known once it is displayed, so show before measuring.
    const bw = notice.offsetWidth;
    const bh = notice.offsetHeight;
    const bx = Math.min(Math.max(8, x - bw / 2), Math.max(8, innerWidth - bw - 8));
    const above = y - PROGRESS_BAR_GAP - bh;
    const below = Math.min(y + PROGRESS_BAR_GAP, Math.max(8, innerHeight - bh - 8));
    notice.style.left = `${bx}px`;
    notice.style.top = `${above >= 8 ? above : below}px`;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.classList.remove("tp-show"), NOTICE_MS);
  }

  function cancelProgress() {
    progressBar.classList.remove("tp-show");
    progressFill.style.transition = "none";
    progressFill.style.width = "0";
  }

  applyVisualVars();

  return {
    open,
    keep,
    releaseExcept,
    startProgress,
    cancelProgress,
    highlightLink,
    dismissUnpinned,
    applySettings,
    applyPower,
    destroy,
  };
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
