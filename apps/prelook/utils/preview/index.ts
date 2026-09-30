import { extractReaderContent, renderReaderInto } from "@/utils/extract";
import { extractHostAccent, extractPageAccent, type AccentScope } from "@/utils/pageAccent";
import {
  WINDOW_THEMES,
  clampSettings,
  recordHistory,
  updateHistoryMeta,
  type PrelookSettings,
  type WindowThemePreset,
} from "@/utils/storage";
import {
  AUTO_CLOSE_GRACE_MS,
  EXIT_MS,
  FADE_SLACK_MS,
  IFRAME_LOAD_TIMEOUT_MS,
  MAX_BLUR_PX,
  MAX_DIM,
  MIN_RESIZE_H,
  MIN_RESIZE_W,
} from "./constants";
import { CLOSE_ICON, OPEN_ICON, PIN_ICON, RELOAD_ICON } from "./icons";
import type { AnchorInfo, FetchReply, PreviewDeps, PreviewSystem, WindowInstance } from "./types";
import { createHighlight, createNotice, createProgress } from "./widgets";
// `?raw` inlines the stylesheet as a string at build time. It has to be a
// string: shadow DOM does not inherit page styles, so a plain CSS import would
// be extracted into the manifest's content_scripts.css — invisible to the
// shadow root and leaking into the host page.
import PREVIEW_STYLE from "./style.css?raw";

export type { AnchorInfo, PreviewDeps, PreviewSystem } from "./types";
export { PREVIEW_STYLE };

/**
 * Builds the window content root (with overlay + windows) inside a container
 * managed by `createShadowRootUi`. Returns the imperative controller plus the
 * overlay element so the caller can include it in the shadow UI.
 */
export function createPreviewSystem(deps: PreviewDeps, shadow: ShadowRoot): PreviewSystem {
  const overlay = document.createElement("div");
  overlay.className = "tp-overlay";
  shadow.appendChild(overlay);
  // The three pointer-anchored chrome pieces own their DOM and timers; they
  // are appended in the same order the old inline code did (progress and
  // notice share the top z-band, the highlight sits under the windows).
  const progress = createProgress(shadow, {
    getAccent: () => windowAccent(settings()),
    reduceMotion: () => deps.getPower().reduceMotion,
  });
  const noticeBar = createNotice(shadow, deps.i18n);
  const highlight = createHighlight(shadow);
  const windows: WindowInstance[] = [];
  let nextId = 1;
  let zIndex = 2147483641;

  function settings(): PrelookSettings {
    return clampSettings(deps.getSettings());
  }

  /** 0 while power is being saved — the CSS transition is off as well (the
   *  `data-tp-motion` host attribute), so the element goes straight to its
   *  final opacity and only the teardown delay is left. */
  function exitMs(): number {
    return deps.getPower().reduceMotion ? 0 : EXIT_MS;
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

  /** Configured size, resolved against the viewport for layout maths. */
  function windowSize(): { w: number; h: number } {
    const s = settings();
    if (s.sizeUnit === "px") return { w: s.widthPx, h: s.heightPx };
    return {
      w: Math.round((innerWidth * s.width) / 100),
      h: Math.round((innerHeight * s.height) / 100),
    };
  }

  /** The size as a CSS value: `%` follows the viewport, `px` is fixed. */
  function cssSize(s: PrelookSettings, v: number): string {
    return `${v}${s.sizeUnit === "px" ? "px" : "%"}`;
  }

  /** Actual size of a window: a corner-dragged one keeps its pixels. */
  function sizeFor(win: WindowInstance): { w: number; h: number } {
    return win.manualSize ?? windowSize();
  }

  /** A window's effective position: its sidebar override wins over settings. */
  function positionOf(win: WindowInstance): PrelookSettings["position"] {
    const configured = settings().position;
    if (win.sidebar === true) return "sidebar";
    if (win.sidebar === false && configured === "sidebar") return "center";
    return configured;
  }

  /** The selected preset, falling back to the first one if the id is unknown. */
  function windowPreset(s: PrelookSettings): WindowThemePreset {
    return WINDOW_THEMES.find((w) => w.id === s.windowTheme) ?? WINDOW_THEMES[0]!;
  }

  /** The accent that paints the preview window chrome — shared with
   *  the link highlight outline and the hover progress bar so they all read as
   *  one visual family regardless of whether the user picked a preset, a custom
   *  `windowColor`, or let the page decide ("auto").
   *
   *  `win` is optional because the highlight frame and the countdown bar are not
   *  windows: they sit on the hovered link, so under "auto" they take the host
   *  page's colour rather than the colour of some other page being previewed. */
  function windowAccent(s: PrelookSettings, win?: WindowInstance): string {
    const preset = windowPreset(s);
    if (preset.id === "auto") return win?.autoAccent ?? autoAccentFor(s, win);
    return preset.id === "custom" ? s.windowColor : preset.accent;
  }

  /** A window's own content once it has arrived: an iframe document when the
   *  target turned out to be embeddable (so the real page, styles included), or
   *  the fetched HTML parsed without running it when the window shows reader
   *  mode / an error card instead. `null` while neither is available. */
  function autoSource(win: WindowInstance): AccentScope | null {
    if (win.closed) return null;
    const frame = win.iframe;
    // Cross-origin frames throw out of `contentDocument`; caught below.
    if (frame) {
      try {
        const doc = frame.contentDocument;
        if (doc?.body) return doc;
      } catch {
        /* opaque origin — use the fetched markup instead */
      }
    }
    const html = win.fetchResult?.html;
    if (!html) return null;
    try {
      return new DOMParser().parseFromString(html, "text/html");
    } catch {
      return null;
    }
  }

  /**
   * Work out (and remember, for a window) the accent used by "auto": the page's
   * own colour first, then the page Prelook is standing on, then `windowColor`
   * as the honest last resort. Cached per window because reading computed styles
   * costs a style flush, and the answer must not wobble every time an unrelated
   * setting is tweaked.
   */
  function autoAccentFor(s: PrelookSettings, win?: WindowInstance): string {
    if (!win) return extractHostAccent() ?? s.windowColor;
    if (win.autoAccent === undefined) {
      const source = autoSource(win);
      win.autoAccent = (source ? extractPageAccent(source) : null) ?? extractHostAccent();
    }
    return win.autoAccent ?? s.windowColor;
  }

  /** "tint" presets mix the accent into the app theme's base surface (so dark
   *  mode still works); "dark" presets bring their own surface and ink. */
  function applyWindowTheme(root: HTMLElement, preset: WindowThemePreset, accent: string) {
    root.style.setProperty("--tp-accent", accent);
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
    // The highlight frame and the countdown bar hug the hovered link on the host
    // page, so they use that page's colour — never one another window's.
    const chromeAccent = windowAccent(s);
    highlight.applyVisual(chromeAccent, s.highlightStyle === "dashed");
    progress.setAccent(chromeAccent);
    for (const win of windows) {
      applyWindowTheme(win.root, windowPreset(s), windowAccent(s, win));
      win.root.style.setProperty("--tp-w", cssSize(s, s.sizeUnit === "px" ? s.widthPx : s.width));
      win.root.style.setProperty("--tp-h", cssSize(s, s.sizeUnit === "px" ? s.heightPx : s.height));
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
        win.root.style.transformOrigin = "100% 50%";
      } else {
        win.root.style.right = "auto";
        win.root.style.left = `${offset}px`;
        win.root.style.transformOrigin = "0% 50%";
      }
      return;
    }

    const stack = order * 26;
    const { w, h } = sizeFor(win);
    let x: number;
    let y: number;
    switch (pos) {
      case "top-left":
        x = 16;
        y = 16;
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
      // Horizontally centred like `center`, but flush against the top /
      // bottom edge of the viewport.
      case "top":
        x = (vw - w) / 2;
        y = 0 + 8;
        break;
      case "bottom":
        x = (vw - w) / 2;
        y = vh - h - 8;
        break;
      // Vertically centred, docked to the left / right edge.
      case "left":
        x = 16;
        y = (vh - h) / 2;
        break;
      case "right":
        x = vw - w - 16;
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
    // 0 (not 8) so `top` / `bottom` windows can sit flush with the edge.
    y = Math.min(Math.max(0, y), Math.max(0, vh - h));
    // Size comes from the --tp-w/--tp-h custom properties: a percentage follows
    // the viewport, px stays fixed on resize (place() re-runs either way).
    win.root.style.left = `${x}px`;
    win.root.style.top = `${y}px`;
    win.root.style.right = "auto";
    // The zoom plays out of the link rather than the window's own centre, so a
    // preview appears to come from where the pointer is. Percentages, because
    // the window's pixel size changes with the viewport.
    const { x: px, y: py } = win.lastPointer;
    win.root.style.transformOrigin = `${originPercent(px - x, w)}% ${originPercent(py - y, h)}%`;
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
    // The Esc hint follows the setting: hidden from the tooltip once the user
    // turns the shortcut off.
    win.closeBtnEl.title = deps.i18n.t(
      settings().closeOnEscape ? "preview.closeEsc" : "preview.close",
    );
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

  /** Immediate (but still animated) close of every unpinned window. */
  function dismissUnpinned() {
    for (const win of [...windows]) {
      if (!win.closed && !win.pinned) closeWindow(win);
    }
  }

  /** Topmost open window that a close trigger may dismiss; pinned windows are
   *  the user's explicit keep and are skipped (they return `undefined` when
   *  every window is pinned). */
  function closableTopWindow(): WindowInstance | undefined {
    let top: WindowInstance | undefined;
    for (const win of windows) {
      if (win.closed || win.pinned) continue;
      if (!top || Number(win.root.style.zIndex || 0) >= Number(top.root.style.zIndex || 0)) {
        top = win;
      }
    }
    return top;
  }

  /** `win.closed` flips immediately (so it stops counting as open, stops being
   *  positioned and ignores clicks); the element itself lingers only long enough
   *  to animate out, then is removed. */
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
      // Release the frame only once it is invisible, so the exit never shows a
      // blank iframe.
      win.iframe?.setAttribute("src", "about:blank");
      win.root.remove();
    }, exitMs() + FADE_SLACK_MS);
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
      // The real page is in now, styles and all — the best source there is for
      // "auto". Re-solve unconditionally: the window may have been painted from
      // the host page or from fetched markup until this moment.
      refreshAutoAccent(win);
    });
  }

  /** Recompute a window's cached "auto" accent and repaint with it. A no-op under
   *  every manual theme, so nothing here costs a user who never picked auto. */
  function refreshAutoAccent(win: WindowInstance) {
    const s = settings();
    if (windowPreset(s).id !== "auto") return;
    const source = autoSource(win);
    win.autoAccent = (source ? extractPageAccent(source) : null) ?? extractHostAccent() ?? null;
    applyWindowTheme(win.root, windowPreset(s), windowAccent(s, win));
  }

  function fallbackToReader(win: WindowInstance) {
    // A translation site is an app, not an article: reader mode would render the
    // app's own chrome as the "content", so those windows fail honestly instead.
    if (win.translate) return showError(win);
    const result = win.fetchResult;
    if (!result?.html) return showError(win);
    const reader = extractReaderContent(result.html, result.finalUrl ?? win.url);
    if (!reader) return showError(win);
    setBodyContent(win, renderReaderInto(reader, deps.i18n, win.url));
    win.readerBadge.textContent = deps.i18n.t("preview.readerBadge");
    win.readerBadge.classList.add("tp-show");
    win.iframe = undefined;
    // Reader mode has no frame to read, so the accent comes from the markup.
    refreshAutoAccent(win);
  }

  /** `messageKey` lets a window explain *why* nothing rendered; the action is
   *  always the same hand-off to a real tab. */
  function showError(win: WindowInstance, messageKey = "preview.failed") {
    const box = document.createElement("div");
    box.className = "tp-error";
    const span = document.createElement("span");
    span.textContent = deps.i18n.t(messageKey);
    const btn = document.createElement("button");
    btn.textContent = deps.i18n.t("preview.openTab");
    btn.addEventListener("click", () => {
      void browser.runtime.sendMessage({ type: "prelook:openTab", url: win.url });
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
        type: "prelook:fetch",
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
    // The history entry was written when the window opened with just the
    // hostname; upgrade it now that the real title/icon are known. Skipped with
    // history off: there is no entry to upgrade.
    if ((reply?.title || reply?.favicon) && settings().historyEnabled) {
      void updateHistoryMeta(win.url, reply.title, reply.favicon);
    }
    // Under "auto", tint the window from the fetched markup right away: the
    // skeleton is on screen for a second or two and reading it as the target's
    // colour costs nothing extra now that the HTML is in hand.
    if (reply?.html) refreshAutoAccent(win);
    if (reply && !reply.canEmbed) {
      // Google Translate answers with `X-Frame-Options: SAMEORIGIN`, so a
      // translation window has to say "this site refuses to be framed" and offer
      // the real tab — extracting the page instead would show a translator UI's
      // own chrome as if it were an article.
      if (win.translate) showError(win, "preview.embedBlocked");
      else if (reply.html) fallbackToReader(win);
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
        noticeBar.show("preview.pinLimit", info.pointer.x, info.pointer.y, { max });
        return;
      }
      closeWindow(victim);
    }

    const s = settings();
    const root = document.createElement("div");
    root.className = "tp-win";
    // Allows pulling keyboard focus off an embedded iframe and onto the window
    // chrome (see the mousedown handler below).
    root.tabIndex = -1;
    root.style.zIndex = String(++zIndex);
    applyWindowTheme(root, windowPreset(s), windowAccent(s));
    root.style.setProperty("--tp-w", cssSize(s, s.sizeUnit === "px" ? s.widthPx : s.width));
    root.style.setProperty("--tp-h", cssSize(s, s.sizeUnit === "px" ? s.heightPx : s.height));
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
      translate: info.translate === true,
      hovered: false,
      // Auto-pin is applied when a window is created, not to windows that are
      // already open: pinning everything on a settings change could hit the
      // window cap and stop new previews from opening.
      risk: info.risk,
      // `undefined` = "not worked out yet"; left unset so the first paint of the
      // window (skeleton) uses the host page's colour and the real content can
      // still refine it once the frame or the fetched HTML has arrived.
      autoAccent: undefined,
      pinned: settings().autoPin,
      pinBtnEl: pinBtn,
      reloadBtnEl: reloadBtn,
      openBtnEl: openBtn,
      closeBtnEl: closeBtn,
      lastPointer: info.pointer,
    };
    syncHeaderButtons(win);

    // Scrolling inside a preview must not disturb the host page: the wheel
    // default would scroll the document under the window (and with
    // closeOnScroll, dismiss the very window being read). The reader pane is
    // the only scrollable part we own and contains its own bounds via
    // `overscroll-behavior`; everywhere else in the window the gesture is
    // swallowed. Wheel events over the iframe go to the framed document itself
    // and never reach this listener.
    root.addEventListener(
      "wheel",
      (e) => {
        const target = e.target as Element | null;
        if (target?.closest?.(".tp-reader")) return;
        e.preventDefault();
      },
      { passive: false },
    );
    root.addEventListener("mousedown", () => {
      root.style.zIndex = String(++zIndex);
      // Key events from a focused cross-origin iframe never reach the host
      // document, so Escape couldn't close it. Clicking the window chrome pulls
      // focus back to the root (the iframe itself never receives this event).
      root.focus();
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
        // Handing off to a real tab ends this preview: the user asked for the
        // page itself, so the window has done its job. Pinned or not — this is
        // an explicit click on this window, not one of the automatic closes
        // that `pinned` exists to survive.
        void browser.runtime.sendMessage({ type: "prelook:openTab", url: win.url });
        closeWindow(win);
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
        // Layout size, not the visual rect: while the entrance zoom is still
        // running a transform makes getBoundingClientRect report a smaller box.
        rzW = root.offsetWidth;
        rzH = root.offsetHeight;
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
    // Remember the opening for the panel's history tab (newest first, deduped
    // by URL). Re-focusing an existing window is not a new preview, so only
    // this creation path records — and nothing records at all once the user
    // turned history off.
    if (s.historyEnabled) {
      void recordHistory({ url: info.url, title: safeHostname(info.url), time: Date.now() });
    }
    // Two frames: let the transparent state land before arming the fade.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add("tp-in"));
    });
    void loadFlow(win);
  }

  function applySettings(s: PrelookSettings) {
    applyVisualVars();
    syncOverlay();
    if (!s.highlightLinks) highlight.link(null);
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
    if (deps.getPower().level === "max") highlight.link(null);
  }

  /** Percentage sizes change with the viewport, so re-run the layout on resize
   *  (positions are computed in pixels and would otherwise drift off-screen). */
  function onViewportResize() {
    for (const win of windows) if (!win.manualPosition) place(win);
    highlight.place();
  }
  /** Scrolling moves the link under a still pointer: follow it. Windows stay
   *  where they were — a preview you are reading must not scroll away. */
  function onScroll() {
    highlight.place();
    if (settings().closeOnScroll) dismissUnpinned();
  }
  window.addEventListener("resize", onViewportResize);
  window.addEventListener("scroll", onScroll, { capture: true, passive: true });

  /** Escape is one of the configurable close triggers (see "Close triggers"
   *  in settings): capture phase so the page's own handlers do not swallow it
   *  first, and it stays a no-op while disabled or when every window is pinned.
   *  `repeat` is ignored so a held key closes one window per press. */
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== "Escape" || e.repeat) return;
    if (!settings().closeOnEscape) return;
    const win = closableTopWindow();
    if (!win) return;
    e.preventDefault();
    closeWindow(win);
  }
  window.addEventListener("keydown", onKeydown, true);

  function destroy() {
    window.removeEventListener("resize", onViewportResize);
    window.removeEventListener("scroll", onScroll, { capture: true });
    window.removeEventListener("keydown", onKeydown, true);
    noticeBar.clear();
    for (const win of [...windows]) {
      if (win.fadeTimer) clearTimeout(win.fadeTimer);
      closeWindow(win, false);
    }
  }

  /** Frame the hovered link. Called on every link hover; the setting decides
   *  whether anything is drawn. */
  function highlightLink(anchor: Element | null) {
    highlight.link(anchor && settings().highlightLinks ? anchor : null);
  }

  applyVisualVars();

  return {
    open,
    keep,
    releaseExcept,
    startProgress: (x, y, durationMs) => progress.start(x, y, durationMs),
    cancelProgress: () => progress.cancel(),
    highlightLink,
    dismissUnpinned,
    notice: (key, x, y, params) => noticeBar.show(key, x, y, params),
    applySettings,
    applyPower,
    destroy,
  };
}

/** A point inside a box, as a transform-origin percentage (clamped, so a pointer
 *  outside the window still yields a usable corner). */
function originPercent(offset: number, size: number): number {
  return Math.min(100, Math.max(0, (offset / size) * 100));
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
