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

/** A link "is an image" when its URL points at an image file — the kind of link
 *  users typically open straight to the picture. Wrapping an <img> must NOT
 *  count: card-style feeds wrap a whole post (thumbnail included) in a single
 *  <a>, so treating every such anchor as an image would skip the entire feed. */
function isImageLink(url: string): boolean {
  try {
    return /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif)$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** True when a key event must reach the page untouched: typing in a form field,
 *  or Space activating a focused control (button, checkbox, link). The
 *  `hoverSpace` trigger keys off Space, which is also the page-scroll and
 *  form-activation key, so it has to stand down in exactly these cases. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) return false;
  if (el.closest("input, textarea, select, button")) return true;
  return el.isContentEditable === true;
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
                openPreview: (url, rect, options) =>
                  preview?.open({
                    ...anchorInfoFor(url, rect),
                    translate: options?.translate === true,
                    inlineTranslate: options?.inline,
                  }),
                // Same toast as the "every window is pinned" hint: it sits at the
                // toolbar the user just clicked.
                notify: (key, x, y) => preview?.notice(key, x, y),
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
      if (settings.skipImages && isImageLink(href)) return null;
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
      // `hoverSpace` arms from a momentary key, not a held one: keep a pending
      // countdown alive while the pointer stays on that same link, even as
      // pointerover re-fires across its child elements. (altHover clears
      // `hoveringUrl` on keyup, so this never revives a released Alt.)
      if (hoverTarget && (triggerAllows(event) || hoveringUrl === hoverTarget.url)) {
        beginHover(hoverTarget);
      } else {
        clearHoverTimer();
        const overUi = (event.composedPath() as Node[]).some(
          (n) => n instanceof HTMLElement && n.tagName === "PRELOOK-UI",
        );
        if (!overUi) {
          // `hoverSpace` has no held modifier to re-check once the window is
          // open: the pointer resting on the link keeps that window alive,
          // without re-arming the countdown (which would drag a moved window
          // back to the anchor on every child-element pointerover).
          if (hoverTarget && settings.triggerMode === "hoverSpace") {
            preview?.keep(hoverTarget.url);
          } else {
            preview?.releaseExcept(null);
          }
        }
      }
    });

    // Two modes arm a hover countdown from the keyboard while a link is under
    // the pointer, and neither cares about the order the pointer and key
    // arrived:
    //  - `altHover`: press Alt over a hovered link. Alt is a hold-modifier, so
    //    releasing it before the window opens cancels the countdown (see keyup).
    //  - `hoverSpace`: press Space over a hovered link. Space is a discrete key,
    //    so the countdown runs to completion even after release; we swallow its
    //    default page-scroll so the link does not slide out from under the
    //    pointer, and never hijack it inside a form field or focused control.
    // `repeat` matters for both: the key auto-repeats while held, and every
    // repeat would otherwise restart the countdown of an already-opened window.
    ctx.addEventListener(document, "keydown", (e) => {
      const event = e as KeyboardEvent;
      if (!settings.enabled || !hoverTarget) return;
      const mode = settings.triggerMode;
      if (mode === "altHover") {
        if (event.key !== "Alt" || event.repeat || hoveringUrl) return;
        beginHover(hoverTarget);
        return;
      }
      if (mode !== "hoverSpace" || event.key !== " ") return;
      if (isEditableTarget(event.target)) return;
      // Swallow the scroll even when a countdown is already running (or the key
      // auto-repeats): letting it through would move the link out from under the
      // pointer and cancel the very countdown it started.
      event.preventDefault();
      if (event.repeat || hoveringUrl) return;
      beginHover(hoverTarget);
    });

    ctx.addEventListener(document, "keyup", (e) => {
      const event = e as KeyboardEvent;
      if (settings.triggerMode !== "altHover" || event.key !== "Alt") return;
      clearHoverTimer();
    });

    // "Close when clicking outside": a press anywhere that is not our own UI
    // dismisses the unpinned windows (pinned ones are the user's explicit keep).
    //
    // Bound on `window` with `{ capture: true }` — see the click listener below
    // for why the element and the object form both matter here.
    ctx.addEventListener(
      window,
      "pointerdown",
      (e) => {
        const event = e as PointerEvent;
        if (!settings.enabled || !clampSettings(settings).closeOnOutsideClick) return;
        const path = event.composedPath() as Node[];
        if (path.some((n) => n instanceof HTMLElement && n.tagName === "PRELOOK-UI")) return;
        preview?.dismissUnpinned();
      },
      { capture: true },
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

    // altClick is claimed at the POINTER level, not on click. Holding Alt makes a
    // few pixels of hand wobble between press and release a *selection drag* (or
    // a link drag): the text the drag selects pops the selection toolbar right
    // where the user meant to click, and — because a drag can swallow the click —
    // a purely click-based altClick silently misses. So Alt+press on a previewable
    // link preventDefaults the pointerdown, which suppresses the selection start
    // (and the native link drag), and the preview opens on a pointerup that stayed
    // within DRAG_INTENT_PX; a longer drag does nothing (page stays put).
    //
    // Caveat measured in Chromium: canceling the pointerdown does NOT stop the
    // later `click` — it still fires, so the click listener below must still
    // preventDefault it (Chrome's Alt+click default is "download the link"). The
    // `altGesture` flag tells that listener "this click came from a pointer
    // gesture I already resolved" so it cancels the default without opening a
    // second window; a keyboard Alt+Enter has no pointer phase, leaves the flag
    // clear, and is opened by the click listener itself.
    let altPress: { x: number; y: number; info: AnchorInfo } | null = null;
    let altGesture = false;

    ctx.addEventListener(
      window,
      "pointerdown",
      (e) => {
        const event = e as PointerEvent;
        altPress = null; // any new press replaces (or clears) the pending gesture
        altGesture = false;
        if (
          !settings.enabled ||
          settings.triggerMode !== "altClick" ||
          !event.altKey ||
          event.button !== 0 ||
          event.isPrimary === false
        ) {
          return;
        }
        const hit = anchorHref(event);
        if (!hit) return; // not a previewable link (or our own UI): leave it to the page
        event.preventDefault();
        altGesture = true;
        altPress = {
          x: event.clientX,
          y: event.clientY,
          info: toAnchorInfo(hit.anchor, hit.url, event, clampSettings(settings).warnDangerous),
        };
      },
      { capture: true },
    );

    ctx.addEventListener(
      window,
      "pointerup",
      (e) => {
        const press = altPress;
        altPress = null;
        if (!press) return;
        const event = e as PointerEvent;
        // Travelled too far to be a click: the gesture was a drag, so it opens
        // nothing (selection and navigation were already suppressed, so the page
        // stays exactly where it was). `altGesture` stays set so the click that
        // Chromium still dispatches is cancelled without opening a window.
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_INTENT_PX) return;
        void ensureUi().then(() => {
          // The toolbar is dismissed rather than blocking this preview: the
          // Alt+press is an explicit command (like the context menu), and with
          // the pointerdown suppressed nothing else would have hidden the bar.
          selection?.hide();
          preview?.open(press.info);
        });
      },
      { capture: true },
    );

    ctx.addEventListener(document, "pointercancel", () => {
      altPress = null;
      altGesture = false;
    });

    // Long-press and drag both set this to the link's URL so the click that
    // follows release is swallowed. The check must NOT depend on anchorHref:
    // the preview window may have opened directly over the link, so the click
    // target can land inside prelook-ui (the shadow host) instead of the
    // original <a>. Calling anchorHref in that case returns null (it bails on
    // uiHost.contains), the click escapes preventDefault, and the browser
    // navigates — opening a new tab for target="_blank" links.
    //
    // The two click-based modes share this capture listener: `click` takes a
    // plain left click; `altClick` takes Alt + left click (which Chrome/Firefox
    // would otherwise spend on downloading the link) — both open the preview
    // instead of navigating. Every other combination keeps its native meaning
    // (Ctrl/Cmd+click and middle-click open a background tab, Shift+click a new
    // window), so only these are intercepted.
    //
    // For altClick this is the *default-killer + keyboard path*, not the mouse
    // opener: canceling the pointerdown above does NOT suppress the click in
    // Chromium (measured), so this still runs. When the click belongs to a
    // pointer gesture (`altGesture`), the pointerup handler already decided
    // open-or-nothing — so here we only preventDefault the download/navigate
    // default and swallow the event, WITHOUT opening again. That keeps a
    // too-far Alt-drag (which pointerup bailed on) from being resurrected by
    // the click. A keyboard Alt+Enter has no pointer phase, leaves the flag
    // clear, and falls through to the open below.
    //
    // It is bound to `window`, NOT `document`, on purpose: many sites (forums,
    // SPAs) delegate clicks with their own `document` CAPTURE listener and call
    // `stopImmediatePropagation()` to run a client-side router. That fires before
    // us whenever it registered first — and a `document_idle` content script
    // always registers after a page's document-start script — so a `document`
    // capture listener here would be silently preempted and the click would
    // navigate instead of previewing. The capture path is
    // `window → document → … → target`, so a window listener runs before ANY
    // document one regardless of registration order. (A click inside our own
    // shadow UI retargets to the `prelook-ui` host, and `anchorHref` bails on
    // it, so the header buttons are unaffected.)
    //
    // `{ capture: true }`, not `true`: `ctx.addEventListener` spreads its 4th
    // argument into an options object (`{ ...options, signal }`), and spreading a
    // bare boolean yields `{}` — the listener would quietly fall back to the
    // bubble phase, which is exactly the phase the interceptor above kills. This
    // is why the option is spelled out everywhere a capture listener is wanted.
    ctx.addEventListener(
      window,
      "click",
      (e) => {
        if (suppressClickUrl) {
          suppressClickUrl = null;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const event = e as MouseEvent;
        if (!settings.enabled || event.button !== 0) return;
        const mode = settings.triggerMode;
        const other = event.ctrlKey || event.metaKey || event.shiftKey;
        // An Alt+click that came from our pointer gesture: the pointerup handler
        // already opened it (or deliberately bailed on a drag). Cancel the
        // browser default and stop; never open a second time from here.
        if (altGesture) {
          altGesture = false;
          if (mode === "altClick" && event.altKey && !other) {
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
        const wantsClick =
          (mode === "click" && !event.altKey && !other) ||
          (mode === "altClick" && event.altKey && !other);
        if (!wantsClick) return;
        if (selection?.isVisible()) return; // don't stack a preview onto the toolbar
        const hit = anchorHref(event);
        if (!hit) return;
        // Stop the native navigation synchronously; opening happens once the
        // UI host is ready.
        event.preventDefault();
        event.stopPropagation();
        const info = toAnchorInfo(
          hit.anchor,
          hit.url,
          event,
          clampSettings(settings).warnDangerous,
        );
        void ensureUi().then(() => preview?.open(info));
      },
      { capture: true },
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
