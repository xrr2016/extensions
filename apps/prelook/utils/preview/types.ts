import type { I18n } from "@/utils/i18n";
import type { PowerState } from "@/utils/power";
import type { RiskReason } from "@/utils/safety";
import type { PrelookSettings } from "@/utils/storage";

export interface AnchorInfo {
  url: string;
  pointer: { x: number; y: number };
  /** Offline risk hint for the preview header, shown read-only */
  risk?: RiskReason;
  /** Sidebar override for this window, used by the browser context menu:
   *  `true` forces the sidebar, `false` forces a floating window (falling back
   *  to `center` when the configured position is the sidebar), `undefined`
   *  follows `settings.position`. */
  sidebar?: boolean;
  /** A translation site opened by the selection toolbar: an interactive app
   *  rather than a document, so this window must never fall back to reader
   *  mode — which would render the app's own chrome as the "content". */
  translate?: boolean;
}

export interface FetchReply {
  ok: boolean;
  canEmbed: boolean;
  finalUrl?: string;
  title?: string;
  favicon?: string;
  html?: string;
}

export interface WindowInstance {
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
  /** Translation site: the reader fallback is off (see `AnchorInfo`) */
  translate: boolean;
  risk?: RiskReason;
  /** Pointer is inside this window — drives the backdrop focus effect */
  hovered: boolean;
  /**
   * Accent resolved for "auto" window theme, or `null` while it has not been
   * worked out yet. Only ever read while `windowTheme === "auto"`; a manual
   * theme ignores it so switching back to auto mid-session stays cheap.
   */
  autoAccent?: string | null;
  /** Pinned windows survive pointer release and are never evicted */
  pinned: boolean;
  pinBtnEl: HTMLButtonElement;
  reloadBtnEl: HTMLButtonElement;
  openBtnEl: HTMLButtonElement;
  closeBtnEl: HTMLButtonElement;
  lastPointer: { x: number; y: number };
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
  /** Transient message anchored to a point on screen (its own `key` may carry
   *  `{params}` for `t()`); used for "nothing opened" and for the selection
   *  toolbar's "the text is on your clipboard" confirmation. */
  notice(key: string, x: number, y: number, params?: Record<string, string | number>): void;
  /** Close every unpinned window at once (outside click / scroll triggers) */
  dismissUnpinned(): void;
  applySettings(s: PrelookSettings): void;
  /** Re-apply the effects the power state gates (backdrop blur, highlight) */
  applyPower(): void;
  destroy(): void;
}

export interface PreviewDeps {
  getSettings: () => PrelookSettings;
  getMaxWindows: () => number;
  /** Resolved power state; it may only take work away, never add it */
  getPower: () => PowerState;
  i18n: I18n;
}
