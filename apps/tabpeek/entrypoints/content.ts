import { createI18n } from "@/utils/i18n";
import { IDLE_POWER_STATE, watchPower, type PowerState } from "@/utils/power";
import {
  createPreviewSystem,
  PREVIEW_STYLE,
  type AnchorInfo,
  type PreviewSystem,
} from "@/utils/preview";
import { assessLink, type RiskReason } from "@/utils/safety";
import { createSelectionSystem, SELECTION_STYLE, type SelectionSystem } from "@/utils/selection";
import { createSpeculationSystem } from "@/utils/speculation";
import {
  clampSettings,
  DEFAULT_SETTINGS,
  isSiteDisabled,
  settingsItem,
  type TabPeekSettings,
} from "@/utils/storage";
import { watchTheme } from "@/utils/theme";
import { stripTracking } from "@/utils/tracking";

/** Pointer travel that means "the user is dragging": it starts a drag-triggered
 *  preview, and cancels a long-press (which is the same intent in reverse). */
const DRAG_INTENT_PX = 12;

function toAnchorInfo(
  anchor: HTMLAnchorElement,
  url: string,
  e: MouseEvent,
  warnDangerous: boolean,
) {
  return {
    url,
    rect: anchor.getBoundingClientRect(),
    pointer: { x: e.clientX, y: e.clientY },
    risk: warnDangerous ? riskFor(url, anchor.textContent ?? "") : undefined,
  };
}

/** Offline risk hint for the preview header (settings-gated by the caller). */
function riskFor(url: string, anchorText: string): RiskReason | undefined {
  return assessLink(url, anchorText)?.reason;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main(ctx) {
    let settings: TabPeekSettings = { ...DEFAULT_SETTINGS };
    let power: PowerState = IDLE_POWER_STATE;
    let preview: PreviewSystem | null = null;
    let selection: SelectionSystem | null = null;
    let uiReady: Promise<void> | null = null;
    let shadowHost: HTMLElement | null = null;
    let themeDispose: (() => void) | null = null;
    let powerDispose: (() => void) | null = null;

    const i18n = createI18n(() => settings.language);

    /**
     * The settings the warm-up may work with: power saving can only take the
     * Speculation Rules away, never add them. Any level below "off" drops them
     * entirely — a prerender is the single most expensive thing TabPeek does.
     */
    function warmupSettings(): TabPeekSettings {
      if (power.level === "off") return settings;
      return { ...settings, speculationMode: "off" };
    }

    const speculation = createSpeculationSystem({ getSettings: warmupSettings });

    /** The link frame is pure decoration, so the heaviest power level gives it
     *  up even when the setting asks for it. */
    function highlightWanted(): boolean {
      return clampSettings(settings).highlightLinks && power.level !== "max";
    }

    /** Writes the resolved power state onto the shadow host (the preview styles
     *  read `data-tp-motion`) and lets the preview system drop what it gates. */
    function applyPower() {
      shadowHost?.toggleAttribute("data-tp-motion", power.reduceMotion);
      if (power.reduceMotion) preview?.cancelProgress();
      preview?.applyPower();
    }

    function maxWindows(): number {
      return clampSettings(settings).maxWindows;
    }

    function ensureUi(): Promise<void> {
      if (uiReady) return uiReady;
      uiReady = (async () => {
        const ui = await createShadowRootUi(ctx, {
          name: "tabpeek-ui",
          position: "inline",
          append: "last",
          css: PREVIEW_STYLE + "\n" + SELECTION_STYLE,
          onMount(_container, shadow) {
            shadowHost = shadow.host as HTMLElement;
            themeDispose?.();
            themeDispose = watchTheme(
              () => settings.theme,
              (theme) => shadowHost?.setAttribute("data-tp-theme", theme),
            );
            powerDispose?.();
            powerDispose = watchPower(
              () => settings,
              (state) => {
                power = state;
                applyPower();
              },
            );
            preview = createPreviewSystem(
              {
                getSettings: () => settings,
                getMaxWindows: maxWindows,
                getPower: () => power,
                i18n,
              },
              shadow,
            );
            selection = createSelectionSystem(ctx, { getSettings: () => settings, i18n }, shadow);
          },
        });
        ui.mount();
      })();
      return uiReady;
    }

    function anchorHref(e: Event): { anchor: HTMLAnchorElement; url: string } | null {
      const target = e.target as Element | null;
      if (!target?.closest) return null;
      const uiHost = document.querySelector("tabpeek-ui");
      if (uiHost && uiHost.contains(target)) return null;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.download) return null;
      const href = anchor.href;
      if (!/^https?:/i.test(href)) return null;
      try {
        const u = new URL(href);
        if (u.hash && u.origin === location.origin && u.pathname === location.pathname) {
          // same-page fragment link
          return null;
        }
      } catch {
        return null;
      }
      if (isSiteDisabled(settings.disabledSites, location.hostname)) return null;
      // Cleaned here, once: keep()/find()/open()/fetch all compare this same value.
      return { anchor, url: clampSettings(settings).stripTracking ? stripTracking(href) : href };
    }

    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    let hoveringUrl: string | null = null;

    function clearHoverTimer() {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
        preview?.cancelProgress();
      }
      hoveringUrl = null;
    }

    function triggerAllows(e: PointerEvent): boolean {
      if (settings.triggerMode === "altHover") return e.altKey;
      return settings.triggerMode === "hover";
    }

    ctx.addEventListener(document, "pointerover", (e) => {
      const event = e as PointerEvent;
      const hit = anchorHref(event);
      // Hovering a link is intent even when it won't open a preview (e.g.
      // altHover without Alt): warm it through the Speculation Rules API.
      if (hit && settings.enabled) speculation.onIntent(hit.url);
      if (hit && settings.enabled && highlightWanted()) {
        void ensureUi().then(() => preview?.highlightLink(hit.anchor));
      } else {
        preview?.highlightLink(null);
      }
      if (hit && settings.enabled && triggerAllows(event)) {
        preview?.keep(hit.url);
        if (hoveringUrl === hit.url) return;
        clearHoverTimer();
        hoveringUrl = hit.url;
        const info = toAnchorInfo(
          hit.anchor,
          hit.url,
          event,
          clampSettings(settings).warnDangerous,
        );
        const delayMs = clampSettings(settings).hoverDelayMs;
        const { clientX, clientY } = event;
        hoverTimer = setTimeout(() => {
          hoverTimer = null;
          hoveringUrl = null;
          preview?.cancelProgress();
          void ensureUi().then(() => {
            if (selection?.isVisible()) return; // don't stack a preview onto the toolbar
            preview?.open(info);
          });
        }, delayMs);
        void ensureUi().then(() => {
          // Same guard as long-press: the pointer may have left meanwhile.
          if (hoverTimer && hoveringUrl === hit.url) {
            preview?.startProgress(clientX, clientY, delayMs);
          }
        });
      } else {
        clearHoverTimer();
        const overUi = (event.composedPath() as Node[]).some(
          (n) => n instanceof HTMLElement && n.tagName === "TABPEEK-UI",
        );
        if (!overUi) preview?.releaseExcept(null);
      }
    });

    // "Close when clicking outside": a press anywhere that is not our own UI
    // dismisses the unpinned windows (pinned ones are the user's explicit keep).
    ctx.addEventListener(
      document,
      "pointerdown",
      (e) => {
        const event = e as PointerEvent;
        if (!settings.enabled || !clampSettings(settings).closeOnOutsideClick) return;
        const path = event.composedPath() as Node[];
        if (path.some((n) => n instanceof HTMLElement && n.tagName === "TABPEEK-UI")) return;
        preview?.dismissUnpinned();
      },
      true,
    );

    ctx.addEventListener(document, "pointerout", (e) => {
      const event = e as PointerEvent;
      if (anchorHref(event) && !event.relatedTarget) {
        clearHoverTimer();
        preview?.highlightLink(null); // pointer left the document
      }
    });

    ctx.addEventListener(document, "mousedown", (e) => {
      const event = e as MouseEvent;
      if (!settings.enabled) return;
      const hit = anchorHref(event);
      if (hit) speculation.onIntent(hit.url);
    });

    // Long-press: hold a link past the delay to open its preview; releasing
    // early lets the click navigate normally. When the preview does open, the
    // click that follows the release is suppressed exactly once.
    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let pressOrigin: { x: number; y: number } | null = null;
    let pressId = 0;
    let suppressClickUrl: string | null = null;
    /** Pressed on a link and not dragged far enough yet (drag mode) */
    let dragCandidate: { x: number; y: number; info: AnchorInfo } | null = null;

    function cancelPress() {
      pressId++;
      dragCandidate = null;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      pressOrigin = null;
      preview?.cancelProgress();
    }

    ctx.addEventListener(document, "pointerdown", (e) => {
      const event = e as PointerEvent;
      cancelPress();
      const mode = settings.triggerMode;
      if (
        !settings.enabled ||
        (mode !== "longPress" && mode !== "drag") ||
        event.button !== 0 ||
        event.isPrimary === false
      ) {
        return;
      }
      const hit = anchorHref(event);
      if (!hit) return;
      const info = toAnchorInfo(hit.anchor, hit.url, event, clampSettings(settings).warnDangerous);
      if (mode === "drag") {
        // Opens once the pointer has travelled far enough (see pointermove).
        dragCandidate = { x: event.clientX, y: event.clientY, info };
        return;
      }
      const durationMs = clampSettings(settings).longPressMs;
      const { clientX, clientY } = event;
      pressOrigin = { x: clientX, y: clientY };
      const myId = ++pressId;
      pressTimer = setTimeout(() => {
        pressTimer = null;
        pressOrigin = null;
        void ensureUi().then(() => {
          if (myId !== pressId) return; // released or re-pressed meanwhile
          preview?.cancelProgress();
          suppressClickUrl = hit.url;
          preview?.open(info);
          preview?.keep(hit.url);
        });
      }, durationMs);
      void ensureUi().then(() => {
        if (myId === pressId && pressTimer) preview?.startProgress(clientX, clientY, durationMs);
      });
    });

    ctx.addEventListener(document, "pointerup", () => cancelPress());
    ctx.addEventListener(document, "pointercancel", () => cancelPress());
    ctx.addEventListener(document, "pointermove", (e) => {
      const event = e as PointerEvent;
      if (dragCandidate) {
        if (
          Math.hypot(event.clientX - dragCandidate.x, event.clientY - dragCandidate.y) >
          DRAG_INTENT_PX
        ) {
          const { info } = dragCandidate;
          dragCandidate = null; // one preview per gesture
          suppressClickUrl = info.url; // the release that ends the drag must not navigate
          void ensureUi().then(() => {
            preview?.open(info);
            preview?.keep(info.url);
          });
        }
        return;
      }
      if (!pressTimer || !pressOrigin) return;
      if (
        Math.hypot(event.clientX - pressOrigin.x, event.clientY - pressOrigin.y) > DRAG_INTENT_PX
      ) {
        cancelPress(); // drag / scroll intent, not a long-press
      }
    });

    // A native link drag would swallow the pointer events this mode relies on.
    ctx.addEventListener(document, "dragstart", (e) => {
      if (!settings.enabled || settings.triggerMode !== "drag") return;
      const target = e.target as Element | null;
      if (target?.closest?.("a[href]")) e.preventDefault();
    });

    ctx.addEventListener(
      document,
      "click",
      (e) => {
        const event = e as MouseEvent;
        if (suppressClickUrl) {
          const hit = anchorHref(event);
          suppressClickUrl = null;
          if (hit && settings.enabled) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
        const mode = settings.triggerMode;
        if (!settings.enabled || (mode !== "click" && mode !== "altClick")) return;
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
        // `click` is the plain click, `altClick` the Alt-modified one. Taking
        // Alt+click over also cancels the browser's save-link default, which is
        // exactly what makes this a usable trigger.
        if (mode === "click" ? event.altKey : !event.altKey) return;
        const hit = anchorHref(event);
        if (!hit) return;
        e.preventDefault();
        e.stopPropagation();
        const info = toAnchorInfo(
          hit.anchor,
          hit.url,
          event,
          clampSettings(settings).warnDangerous,
        );
        void ensureUi().then(() => {
          selection?.hide();
          preview?.open(info);
        });
      },
      true,
    );

    /** Anchor rect for a URL, for previews started from outside the page
     *  (context menu). Falls back to the middle of the viewport. */
    function anchorInfoFor(url: string) {
      const s = clampSettings(settings);
      const clean = s.stripTracking ? stripTracking(url) : url;
      const anchor = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].find(
        (a) => a.href === url || a.href === clean,
      );
      const risk = s.warnDangerous ? riskFor(clean, anchor?.textContent ?? "") : undefined;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        return {
          url: clean,
          rect,
          pointer: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          risk,
        };
      }
      const cx = Math.round(innerWidth / 2);
      const cy = Math.round(innerHeight / 2);
      return { url: clean, rect: new DOMRect(cx, cy, 0, 0), pointer: { x: cx, y: cy }, risk };
    }

    // Right-click menu entries: an explicit command, so it ignores the site
    // disable list rather than doing nothing silently.
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (typeof message !== "object" || message === null) return undefined;
      const msg = message as Record<string, unknown>;
      if (msg.type !== "tabpeek:preview") return undefined;
      const url = String(msg.url ?? "");
      if (!/^https?:/i.test(url)) return undefined;
      const info = anchorInfoFor(url);
      void ensureUi().then(() => {
        selection?.hide();
        preview?.open({ ...info, sidebar: msg.sidebar === true ? true : false });
      });
      return undefined;
    });

    settingsItem.getValue().then((stored: TabPeekSettings | undefined) => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
      // Pre-create the UI host so the selection toolbar works even if no
      // preview has been opened yet (cheap: an empty zero-size shadow host).
      if (settings.enabled) void ensureUi();
    });
    ctx.onInvalidated(() => {
      themeDispose?.();
      powerDispose?.();
      preview?.destroy();
    });

    void settingsItem.watch((newVal: TabPeekSettings | undefined) => {
      if (!newVal) return;
      settings = { ...DEFAULT_SETTINGS, ...newVal };
      // Re-resolve the theme: switching between light/dark/system (and back to
      // "system" following the OS) has to be picked up live.
      themeDispose?.();
      themeDispose = watchTheme(
        () => settings.theme,
        (theme) => shadowHost?.setAttribute("data-tp-theme", theme),
      );
      // The power state is derived from the settings too, so re-subscribe;
      // `watchPower` reports the new state right away.
      powerDispose?.();
      powerDispose = watchPower(
        () => settings,
        (state) => {
          power = state;
          applyPower();
        },
      );
      preview?.applySettings(clampSettings(settings));
      selection?.applySettings(clampSettings(settings));
    });
  },
});
