import { clampSettings, type TabPeekSettings } from '@/utils/storage';
import { extractReaderContent, renderReaderInto } from '@/utils/extract';
import type { I18n } from '@/utils/i18n';

export interface AnchorInfo {
  url: string;
  rect: DOMRect;
  pointer: { x: number; y: number };
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
  headEl: HTMLElement;
  closeTimer?: ReturnType<typeof setTimeout>;
  loadTimer?: ReturnType<typeof setTimeout>;
  iframe?: HTMLIFrameElement;
  fetchResult?: FetchReply;
  closed: boolean;
  manualPosition: boolean;
  /** Pinned windows survive pointer release and are never evicted */
  pinned: boolean;
  pinBtnEl: HTMLButtonElement;
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
  applySettings(s: TabPeekSettings): void;
  destroy(): void;
}

const IFRAME_LOAD_TIMEOUT_MS = 8_000;
const AUTO_CLOSE_GRACE_MS = 400;
/** Pushpin for the window header; static markup, no user input involved. */
const PIN_ICON =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg>';

/** Distance between the pointer and the trigger countdown bar. */
const PROGRESS_BAR_GAP = 18;
/** Only used if the bar cannot be measured (display:none fallback). */
const PROGRESS_BAR_FALLBACK_W = 72;
const PROGRESS_BAR_FALLBACK_H = 6;

const STYLE = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
.tp-overlay { position: fixed; inset: 0; z-index: 2147483640; pointer-events: none; backdrop-filter: blur(var(--tp-blur, 0px)); background: rgba(0,0,0,.14); display: none; }
.tp-win {
  position: fixed; z-index: 2147483641; display: flex; flex-direction: column;
  width: var(--tp-w, 560px); height: var(--tp-h, 480px);
  background: #fff; color: #1f2328; border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(0,0,0,.08); box-shadow: 0 12px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12);
}
.tp-win.tp-sidebar { border-radius: 0; height: 100vh; }
.tp-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: linear-gradient(180deg, color-mix(in srgb, var(--tp-accent, #4f6bf6) 10%, #fff), #fff); border-bottom: 1px solid rgba(0,0,0,.06); flex: none; user-select: none; }
.tp-favicon { width: 16px; height: 16px; flex: none; border-radius: 3px; }
.tp-favicon.tp-hide { display: none; }
.tp-title { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-badge { display: none; flex: none; font-size: 11px; line-height: 1; padding: 3px 7px; border-radius: 999px; background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 14%, #fff); color: var(--tp-accent, #4f6bf6); }
.tp-badge.tp-show { display: inline-block; }
.tp-btn { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: #57606a; font-size: 14px; line-height: 1; cursor: pointer; }
.tp-btn:hover { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 16%, #fff); color: var(--tp-accent, #4f6bf6); }
.tp-pin svg { width: 14px; height: 14px; display: block; transform: rotate(45deg); transition: transform .15s ease; }
.tp-pin.tp-on { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 18%, #fff); color: var(--tp-accent, #4f6bf6); }
.tp-pin.tp-on svg { transform: rotate(0deg); }
.tp-body { position: relative; flex: 1; min-height: 0; background: #fff; }
.tp-body > iframe { width: 100%; height: 100%; border: 0; display: block; }
.tp-skeleton { position: absolute; inset: 0; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.tp-skeleton i { display: block; height: 14px; border-radius: 6px; background: linear-gradient(90deg, #eef0f3 25%, #f7f8fa 50%, #eef0f3 75%); background-size: 200% 100%; animation: tp-shimmer 1.2s infinite; }
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
.tp-reader pre { background: #f6f8fa; padding: 10px 12px; border-radius: 8px; overflow: auto; margin-bottom: 12px; }
.tp-error { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 24px; font-size: 13px; color: #57606a; }
.tp-error button { border: 0; border-radius: 8px; padding: 8px 14px; background: var(--tp-accent, #4f6bf6); color: #fff; font-size: 13px; cursor: pointer; }
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
`;

export { STYLE as PREVIEW_STYLE };

export interface PreviewDeps {
  getSettings: () => TabPeekSettings;
  getMaxWindows: () => number;
  i18n: I18n;
}

/**
 * Builds the window content root (with overlay + windows) inside a container
 * managed by `createShadowRootUi`. Returns the imperative controller plus the
 * overlay element so the caller can include it in the shadow UI.
 */
export function createPreviewSystem(
  deps: PreviewDeps,
  shadow: ShadowRoot,
): PreviewSystem {
  const overlay = document.createElement('div');
  overlay.className = 'tp-overlay';
  shadow.appendChild(overlay);
  const progressBar = document.createElement('div');
  progressBar.className = 'tp-progress';
  const progressFill = document.createElement('div');
  progressFill.className = 'tp-progress-fill';
  progressBar.appendChild(progressFill);
  shadow.appendChild(progressBar);
  const windows: WindowInstance[] = [];
  let nextId = 1;
  let zIndex = 2147483641;

  function settings(): TabPeekSettings {
    return clampSettings(deps.getSettings());
  }

  function applyVisualVars() {
    const s = settings();
    overlay.style.setProperty('--tp-blur', `${s.blurPx}px`);
    overlay.style.setProperty('--tp-accent', s.themeColor);
    for (const win of windows) {
      win.root.style.setProperty('--tp-accent', s.themeColor);
      win.root.style.setProperty('--tp-w', `${s.width}px`);
      win.root.style.setProperty('--tp-h', `${s.height}px`);
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

    win.root.classList.toggle('tp-sidebar', s.position === 'sidebar');

    if (s.position === 'sidebar') {
      const offset = order * s.width;
      win.root.style.width = `${s.width}px`;
      win.root.style.height = '100vh';
      win.root.style.top = '0px';
      win.root.style.left = 'auto';
      if (s.sidebarSide === 'right') {
        win.root.style.right = `${offset}px`;
      } else {
        win.root.style.right = 'auto';
        win.root.style.left = `${offset}px`;
      }
      return;
    }

    const stack = order * 26;
    const w = s.width;
    const h = s.height;
    let x: number;
    let y: number;
    switch (s.position) {
      case 'link':
        x = win.lastPointer.x - w / 2;
        y = win.lastAnchorBottom + 12;
        if (y + h > vh - 8) {
          y = win.lastAnchorTop - h - 12;
          if (y < 8) {
            y = Math.min(win.lastAnchorBottom + 12, vh - h - 8);
          }
        }
        break;
      case 'mouse':
        x = win.lastPointer.x + 16;
        y = win.lastPointer.y + 18;
        break;
      case 'top-right':
        x = vw - w - 16;
        y = 16;
        break;
      case 'bottom-left':
        x = 16;
        y = vh - h - 16;
        break;
      case 'center':
        x = (vw - w) / 2;
        y = (vh - h) / 2;
        break;
      case 'bottom-right':
      default:
        x = vw - w - 16;
        y = vh - h - 16;
        break;
    }
    x += stack;
    y += stack;
    x = Math.min(Math.max(8, x), Math.max(8, vw - w - 8));
    y = Math.min(Math.max(8, y), Math.max(8, vh - h - 8));
    win.root.style.width = `${w}px`;
    win.root.style.height = `${h}px`;
    win.root.style.left = `${x}px`;
    win.root.style.top = `${y}px`;
    win.root.style.right = 'auto';
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
    win.pinBtnEl.classList.toggle('tp-on', win.pinned);
    win.pinBtnEl.setAttribute('aria-pressed', String(win.pinned));
    win.pinBtnEl.title = deps.i18n.t(win.pinned ? 'preview.unpin' : 'preview.pin');
    win.openBtnEl.title = deps.i18n.t('preview.openTab');
    win.closeBtnEl.title = deps.i18n.t('preview.close');
    if (win.readerBadge.classList.contains('tp-show')) {
      win.readerBadge.textContent = deps.i18n.t('preview.readerBadge');
    }
  }

  function releaseExcept(url: string | null) {
    for (const win of windows) {
      if (win.closed || win.url === url || win.pinned) continue;
      clearClose(win);
      win.closeTimer = setTimeout(() => closeWindow(win), AUTO_CLOSE_GRACE_MS);
    }
  }

  function closeWindow(win: WindowInstance) {
    if (win.closed) return;
    win.closed = true;
    clearClose(win);
    if (win.loadTimer) clearTimeout(win.loadTimer);
    win.iframe?.setAttribute('src', 'about:blank');
    win.root.remove();
    const i = windows.indexOf(win);
    if (i >= 0) windows.splice(i, 1);
    for (const other of windows) if (!other.manualPosition) place(other);
  }

  function setBodyContent(win: WindowInstance, el: HTMLElement) {
    win.body.innerHTML = '';
    win.body.appendChild(el);
  }

  function renderIframe(win: WindowInstance) {
    const frame = document.createElement('iframe');
    frame.src = win.url;
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    win.iframe = frame;
    setBodyContent(win, frame);
    win.loadTimer = setTimeout(() => {
      win.loadTimer = undefined;
      fallbackToReader(win);
    }, IFRAME_LOAD_TIMEOUT_MS);
    frame.addEventListener('load', () => {
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
    win.readerBadge.textContent = deps.i18n.t('preview.readerBadge');
    win.readerBadge.classList.add('tp-show');
    win.iframe = undefined;
  }

  function showError(win: WindowInstance) {
    const box = document.createElement('div');
    box.className = 'tp-error';
    const span = document.createElement('span');
    span.textContent = deps.i18n.t('preview.failed');
    const btn = document.createElement('button');
    btn.textContent = deps.i18n.t('preview.openTab');
    btn.addEventListener('click', () => {
      void browser.runtime.sendMessage({ type: 'tabpeek:openTab', url: win.url });
      closeWindow(win);
    });
    box.append(span, btn);
    setBodyContent(win, box);
  }

  async function loadFlow(win: WindowInstance) {
    let reply: FetchReply | undefined;
    try {
      reply = (await browser.runtime.sendMessage({
        type: 'tabpeek:fetch',
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
      win.faviconEl.classList.remove('tp-hide');
      win.faviconEl.onerror = () => win.faviconEl.classList.add('tp-hide');
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
      if (!victim) return;
      closeWindow(victim);
    }

    const s = settings();
    const root = document.createElement('div');
    root.className = 'tp-win';
    root.style.zIndex = String(++zIndex);
    root.style.setProperty('--tp-accent', s.themeColor);
    root.style.setProperty('--tp-w', `${s.width}px`);
    root.style.setProperty('--tp-h', `${s.height}px`);

    const head = document.createElement('div');
    head.className = 'tp-head';
    const favicon = document.createElement('img');
    favicon.className = 'tp-favicon tp-hide';
    favicon.alt = '';
    const titleEl = document.createElement('span');
    titleEl.className = 'tp-title';
    titleEl.textContent = safeHostname(info.url);
    const readerBadge = document.createElement('span');
    readerBadge.className = 'tp-badge';
    const pinBtn = document.createElement('button');
    pinBtn.className = 'tp-btn tp-pin';
    pinBtn.dataset.act = 'pin';
    pinBtn.type = 'button';
    pinBtn.innerHTML = PIN_ICON;
    const openBtn = document.createElement('button');
    openBtn.className = 'tp-btn';
    openBtn.dataset.act = 'open';
    openBtn.type = 'button';
    openBtn.textContent = '↗';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tp-btn';
    closeBtn.dataset.act = 'close';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    head.append(favicon, titleEl, readerBadge, pinBtn, openBtn, closeBtn);

    const body = document.createElement('div');
    body.className = 'tp-body';
    const skeleton = document.createElement('div');
    skeleton.className = 'tp-skeleton';
    skeleton.append(
      ...[0, 1, 2, 3].map(() => document.createElement('i')),
    );
    body.appendChild(skeleton);
    root.append(head, body);

    const win: WindowInstance = {
      id: nextId++,
      url: info.url,
      root,
      body,
      titleEl,
      faviconEl: favicon,
      readerBadge,
      headEl: head,
      closed: false,
      manualPosition: false,
      pinned: false,
      pinBtnEl: pinBtn,
      openBtnEl: openBtn,
      closeBtnEl: closeBtn,
      lastPointer: info.pointer,
      lastAnchorTop: info.rect.top,
      lastAnchorBottom: info.rect.bottom,
    };
    syncHeaderButtons(win);

    root.addEventListener('mousedown', () => {
      root.style.zIndex = String(++zIndex);
    });
    root.addEventListener('mouseover', () => keep(info.url));
    root.addEventListener('mouseout', (e) => {
      // releasing happens on the page side; only cancel while inside the window
      const related = e.relatedTarget as Node | null;
      if (!related || !root.contains(related)) releaseExcept(null);
    });
    head.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest?.('[data-act]') as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.act === 'close') closeWindow(win);
      else if (btn.dataset.act === 'pin') setPinned(win, !win.pinned);
      else if (btn.dataset.act === 'open') {
        void browser.runtime.sendMessage({ type: 'tabpeek:openTab', url: win.url });
      }
    });

    if (s.position !== 'sidebar') {
      let startX = 0;
      let startY = 0;
      let origX = 0;
      let origY = 0;
      let dragging = false;
      head.style.cursor = 'grab';
      head.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('[data-act]')) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = root.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        head.setPointerCapture(e.pointerId);
      });
      head.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        win.manualPosition = true;
        root.style.left = `${Math.max(0, origX + e.clientX - startX)}px`;
        root.style.top = `${Math.max(0, origY + e.clientY - startY)}px`;
        root.style.right = 'auto';
      });
      head.addEventListener('pointerup', () => {
        dragging = false;
      });
    }

    overlay.style.display = s.blurPx > 0 ? 'block' : 'none';
    shadow.appendChild(root);
    windows.push(win);
    place(win);
    void loadFlow(win);
  }

  function applySettings(s: TabPeekSettings) {
    applyVisualVars();
    overlay.style.display = s.blurPx > 0 ? 'block' : 'none';
    for (const win of windows) {
      win.manualPosition = false;
      place(win);
    }
    refreshTitlesAndBadges();
  }

  function destroy() {
    for (const win of [...windows]) closeWindow(win);
  }

  function startProgress(x: number, y: number, durationMs: number) {
    const s = settings();
    progressFill.style.transition = 'none';
    progressFill.style.width = '0';
    progressBar.style.setProperty('--tp-accent', s.themeColor);
    progressBar.classList.add('tp-show');
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
        progressFill.style.width = '100%';
      });
    });
  }

  function cancelProgress() {
    progressBar.classList.remove('tp-show');
    progressFill.style.transition = 'none';
    progressFill.style.width = '0';
  }

  applyVisualVars();

  return {
    open,
    keep,
    releaseExcept,
    startProgress,
    cancelProgress,
    applySettings,
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
