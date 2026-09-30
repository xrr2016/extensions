import type { I18n } from "@/utils/i18n";
import type { HighlightStyle } from "@/utils/storage";
import {
    NOTICE_MS,
    PROGRESS_BAR_FALLBACK_H,
    PROGRESS_BAR_FALLBACK_W,
    PROGRESS_BAR_GAP,
} from "./constants";

/**
 * The three pointer-anchored overlays that are not windows: the hover
 * countdown bar, the notice toast, and the link highlight frame. Each owns
 * its own DOM and timers; they share nothing with each other, which is why
 * they can leave the preview system's closure intact.
 *
 * The accent is pushed in from the caller (`applyVisual` / `setAccent`)
 * rather than read back: all three chrome elements follow the same
 * "auto resolves to the HOST page colour" rule, and index.ts already
 * computes it once per settings pass.
 */

/** Countdown bar shown at the pointer while a trigger delay elapses. */
export interface ProgressWidget {
  start(x: number, y: number, durationMs: number): void;
  cancel(): void;
  setAccent(accent: string): void;
}

export function createProgress(
  shadow: ShadowRoot,
  opts: { getAccent: () => string; reduceMotion: () => boolean },
): ProgressWidget {
  const bar = document.createElement("div");
  bar.className = "tp-progress";
  const fill = document.createElement("div");
  fill.className = "tp-progress-fill";
  bar.appendChild(fill);
  shadow.appendChild(bar);

  function start(x: number, y: number, durationMs: number) {
    // With motion reduced the fill would be a still rectangle that says nothing
    // about the remaining delay, so the bar is dropped along with its
    // transition.
    if (opts.reduceMotion()) return;
    fill.style.transition = "none";
    fill.style.width = "0";
    bar.style.setProperty("--tp-accent", opts.getAccent());
    bar.classList.add("tp-show");
    // Size is only known once the bar is displayed, so show before measuring.
    const bw = bar.offsetWidth || PROGRESS_BAR_FALLBACK_W;
    const bh = bar.offsetHeight || PROGRESS_BAR_FALLBACK_H;
    const centerX = x - bw / 2;
    const bx = Math.min(Math.max(8, centerX), Math.max(8, innerWidth - bw - 8));
    // Above the pointer, so the cursor does not cover the fill; below it when
    // the top of the viewport leaves no room.
    const above = y - PROGRESS_BAR_GAP - bh;
    const below = Math.min(y + PROGRESS_BAR_GAP, Math.max(8, innerHeight - bh - 8));
    const by = above >= 8 ? above : below;
    bar.style.left = `${bx}px`;
    bar.style.top = `${by}px`;
    // Two frames: layout the 0% state before arming the linear fill.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.transition = `width ${durationMs}ms linear`;
        fill.style.width = "100%";
      });
    });
  }

  function cancel() {
    bar.classList.remove("tp-show");
    fill.style.transition = "none";
    fill.style.width = "0";
  }

  function setAccent(accent: string) {
    bar.style.setProperty("--tp-accent", accent);
  }

  return { start, cancel, setAccent };
}

/** Transient message anchored to a point on screen. */
export interface NoticeWidget {
  show(key: string, x: number, y: number, params?: Record<string, string | number>): void;
  /** Cancel a pending hide (teardown); the toast itself is otherwise self-hiding */
  clear(): void;
}

export function createNotice(shadow: ShadowRoot, i18n: I18n): NoticeWidget {
  const el = document.createElement("div");
  el.className = "tp-notice";
  shadow.appendChild(el);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Shows a short-lived message near a point: why nothing opened (every slot is
  // held by a pinned window), or that the selection went to the clipboard.
  function show(key: string, x: number, y: number, params?: Record<string, string | number>) {
    el.textContent = i18n.t(key, params);
    el.classList.add("tp-show");
    // Size is only known once it is displayed, so show before measuring.
    const bw = el.offsetWidth;
    const bh = el.offsetHeight;
    const bx = Math.min(Math.max(8, x - bw / 2), Math.max(8, innerWidth - bw - 8));
    const above = y - PROGRESS_BAR_GAP - bh;
    const below = Math.min(y + PROGRESS_BAR_GAP, Math.max(8, innerHeight - bh - 8));
    el.style.left = `${bx}px`;
    el.style.top = `${above >= 8 ? above : below}px`;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove("tp-show"), NOTICE_MS);
  }

  function clear() {
    if (timer) clearTimeout(timer);
  }

  return { show, clear };
}

/** Frame around the link the pointer is over. Pure decoration: never
 *  hit-tested, and the caller decides visibility (the setting is checked
 *  before `link()` is called, `null` always hides). */
export interface HighlightWidget {
  link(anchor: Element | null): void;
  /** Re-measure the framed link; the page may have scrolled or reflowed. */
  place(): void;
  /** Border style is a class (solid is the base rule); width and radius are
   *  user px values the CSS reads as tokens. */
  applyVisual(accent: string, style: HighlightStyle, width: number, radius: number): void;
}

export function createHighlight(shadow: ShadowRoot): HighlightWidget {
  const el = document.createElement("div");
  el.className = "tp-hl";
  shadow.appendChild(el);
  let target: Element | null = null;
  // The inset maths must match the border the CSS is actually drawing; both
  // come from the same applyVisual call, mirrored here for place().
  let borderWidth = 2;

  function link(anchor: Element | null) {
    target = anchor;
    if (!target) {
      el.classList.remove("tp-show");
      return;
    }
    place();
    el.classList.add("tp-show");
  }

  function place() {
    if (!target) return;
    if (!target.isConnected) {
      target = null;
      el.classList.remove("tp-show");
      return;
    }
    const r = target.getBoundingClientRect();
    // The box grows outward by the border width on each side so the ring's
    // inner edge lands exactly on the link (border-box draws inside the box);
    // borderWidth mirrors the CSS --tp-hlw set by applyVisual.
    el.style.left = `${r.left - borderWidth}px`;
    el.style.top = `${r.top - borderWidth}px`;
    el.style.width = `${r.width + borderWidth * 2}px`;
    el.style.height = `${r.height + borderWidth * 2}px`;
  }

  function applyVisual(
    accent: string,
    style: HighlightStyle,
    width: number,
    radius: number,
  ) {
    el.style.setProperty("--tp-accent", accent);
    el.style.setProperty("--tp-hlw", `${width}px`);
    el.style.setProperty("--tp-hlr", `${radius}px`);
    borderWidth = width;
    el.classList.toggle("tp-dashed", style === "dashed");
  }

  return { link, place, applyVisual };
}
