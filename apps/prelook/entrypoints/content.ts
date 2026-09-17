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
  type PrelookSettings,
} from "@/utils/storage";
import { watchTheme } from "@/utils/theme";
import { stripTracking } from "@/utils/tracking";

/** Pointer travel that means "the user is dragging": it starts a drag-triggered
 *  preview, and cancels a long-press (which is the same intent in reverse). */
const DRAG_INTENT_PX = 12;

/** The link currently under the pointer, plus where the pointer was when it got
 *  there (kept so the Alt key can arm a hover that started without it). */
type HoverTarget = { anchor: HTMLAnchorElement; url: string; x: number; y: number };

function toAnchorInfo(
  anchor: HTMLAnchorElement,
  url: string,
  pointer: { clientX: number; clientY: number },
  warnDangerous: boolean,
) {
  return {
    url,
    pointer: { x: pointer.clientX, y: pointer.clientY },
    risk: warnDangerous ? riskFor(url, anchor.textContent ?? "") : undefined,
  };
}

/** Offline risk hint for the preview header (settings-gated by the caller). */
function riskFor(url: string, anchorText: string): RiskReason | undefined {
  return assessLink(url, anchorText)?.reason;
}

/** A link "is an image" when it wraps an <img> or points at an image file —
 *  the kinds of links users typically open straight to the picture. */
function isImageLink(anchor: HTMLAnchorElement, url: string): boolean {
  if (anchor.querySelector("img")) return true;
  try {
    return /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif)$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main(ctx) {
    let settings: PrelookSettings = { ...DEFAULT_SETTINGS };
    let power: PowerState = IDLE_POWER_STATE;
    let preview: PreviewSystem | null = null;
    let selection: SelectionSystem | null = null;
    let uiReady: Promise<void> | null = null;
    let shadowHost: HTMLElement | null = null;
    let themeDispose: (() => void) | null = null;
    let powerDispose: (() => void) | null = null;

    const i18n = createI18n();

    /**
     * The settings the warm-up may work with: power saving can only take the
     * Speculation Rules away, never add them. Any level below "off" drops them
     * entirely — a prerender is the single most expensive thing Prelook does.
     */
    function warmupSettings(): PrelookSettings {
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
          name: "prelook-ui",
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
            selection = createSelectionSystem(
              ctx,
              {
                getSettings: () => settings,
                i18n,
                // An explicit command, so — like the context menu — it skips
                // the site disable list and the image-link switch.
                openPreview: (url, rect) => preview?.open(anchorInfoFor(url, rect)),
              },
              shadow,
            );
          },
        });
        ui.mount();
      })();
      return uiReady;
    }

    function anchorHref(e: Event): { anchor: HTMLAnchorElement; url: string } | null {
      const target = e.target as Element | null;
      if (!target?.closest) return null;
      const uiHost = document.querySelector("prelook-ui");
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
      if (settings.skipImages && isImageLink(anchor, href)) return null;
      if (isSiteDisabled(settings.disabledSites, location.hostname)) return null;
      // Cleaned here, once: keep()/find()/open()/fetch all compare this same value.
      return { anchor, url: clampSettings(settings).stripTracking ? stripTracking(href) : href };
    }

    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    let hoveringUrl: string | null = null;
    let hoverTarget: HoverTarget | null = null;

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

    /** Starts the hover countdown. Shared by the pointer path and the Alt-key
     *  path, since in `altHover` the modifier may arrive after the pointer. */
    function beginHover(hit: HoverTarget) {
      preview?.keep(hit.url);
      if (hoveringUrl === hit.url) return;
      clearHoverTimer();
      hoveringUrl = hit.url;
      const info = toAnchorInfo(
        hit.anchor,
        hit.url,
        { clientX: hit.x, clientY: hit.y },
        clampSettings(settings).warnDangerous,
      );
      const delayMs = clampSettings(settings).hoverDelayMs;
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
          preview?.startProgress(hit.x, hit.y, delayMs);
        }
      });
    }

    ctx.addEventListener(document, "pointerover", (e) => {
      const event = e as PointerEvent;
      const hit = anchorHref(event);
      hoverTarget =
        hit && settings.enabled
          ? { anchor: hit.anchor, url: hit.url, x: event.clientX, y: event.clientY }
          : null;
      // Hovering a link is intent even when it won't open a preview (e.g.
      // altHover without Alt): warm it through the Speculation Rules API.
      if (hit && settings.enabled) speculation.onIntent(hit.url);
      if (hit && settings.enabled && highlightWanted()) {
        void ensureUi().then(() => preview?.highlightLink(hit.anchor));
      } else {
        preview?.highlightLink(null);
      }
      if (hoverTarget && triggerAllows(event)) {
        beginHover(hoverTarget);
      } else {
        clearHoverTimer();
        const overUi = (event.composedPath() as Node[]).some(
          (n) => n instanceof HTMLElement && n.tagName === "PRELOOK-UI",
        );
        if (!overUi) preview?.releaseExcept(null);
      }
    });

    // `altHover` must not care about the order: pressing Alt over a link that is
    // already hovered starts the very same countdown, and letting go of Alt
    // before the window opens cancels it — the modifier is the intent here, so
    // hold it. `repeat` matters: Alt auto-repeats while held, and every repeat
    // would otherwise restart the countdown of an already-opened window.
    ctx.addEventListener(document, "keydown", (e) => {
      const event = e as KeyboardEvent;
      if (!settings.enabled || settings.triggerMode !== "altHover") return;
      if (event.key !== "Alt" || event.repeat || hoveringUrl || !hoverTarget) return;
      beginHover(hoverTarget);
    });

    ctx.addEventListener(document, "keyup", (e) => {
      const event = e as KeyboardEvent;
      if (settings.triggerMode !== "altHover" || event.key !== "Alt") return;
      clearHoverTimer();
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
        if (path.some((n) => n instanceof HTMLElement && n.tagName === "PRELOOK-UI")) return;
        preview?.dismissUnpinned();
      },
      true,
    );

    ctx.addEventListener(document, "pointerout", (e) => {
      const event = e as PointerEvent;
      if (anchorHref(event) && !event.relatedTarget) {
        hoverTarget = null;
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

    // Long-press and drag both set this to the link's URL so the click that
    // follows release is swallowed. The check must NOT depend on anchorHref:
    // the preview window may have opened directly over the link, so the click
    // target can land inside prelook-ui (the shadow host) instead of the
    // original <a>. Calling anchorHref in that case returns null (it bails on
    // uiHost.contains), the click escapes preventDefault, and the browser
    // navigates — opening a new tab for target="_blank" links.
    ctx.addEventListener(
      document,
      "click",
      (e) => {
        if (suppressClickUrl) {
          suppressClickUrl = null;
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );

    /** Anchor rect for a URL, for previews started from outside the page
     *  (context menu, selection toolbar). Falls back to the middle of the
     *  viewport. `rect`, when given, is the rect the user actually pointed at
     *  (the text selection) and wins over the anchor box. */
    function anchorInfoFor(url: string, rect?: DOMRect | null) {
      const s = clampSettings(settings);
      const clean = s.stripTracking ? stripTracking(url) : url;
      const anchor = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].find(
        (a) => a.href === url || a.href === clean,
      );
      const risk = s.warnDangerous ? riskFor(clean, anchor?.textContent ?? "") : undefined;
      const box = rect ?? anchor?.getBoundingClientRect();
      if (box) {
        return {
          url: clean,
          pointer: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
          risk,
        };
      }
      const cx = Math.round(innerWidth / 2);
      const cy = Math.round(innerHeight / 2);
      return { url: clean, pointer: { x: cx, y: cy }, risk };
    }

    // Right-click menu entries: an explicit command, so it ignores the site
    // disable list rather than doing nothing silently.
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (typeof message !== "object" || message === null) return undefined;
      const msg = message as Record<string, unknown>;
      if (msg.type !== "prelook:preview") return undefined;
      const url = String(msg.url ?? "");
      if (!/^https?:/i.test(url)) return undefined;
      const info = anchorInfoFor(url);
      void ensureUi().then(() => {
        selection?.hide();
        preview?.open({ ...info, sidebar: msg.sidebar === true ? true : false });
      });
      return undefined;
    });

    settingsItem.getValue().then((stored: PrelookSettings | undefined) => {
      settings = clampSettings({ ...DEFAULT_SETTINGS, ...stored });
      // Pre-create the UI host so the selection toolbar works even if no
      // preview has been opened yet (cheap: an empty zero-size shadow host).
      if (settings.enabled) void ensureUi();
    });
    ctx.onInvalidated(() => {
      themeDispose?.();
      powerDispose?.();
      preview?.destroy();
    });

    void settingsItem.watch((newVal: PrelookSettings | undefined) => {
      if (!newVal) return;
      settings = clampSettings({ ...DEFAULT_SETTINGS, ...newVal });
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
