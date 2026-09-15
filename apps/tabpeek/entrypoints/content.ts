import {
  DEFAULT_SETTINGS,
  clampSettings,
  isSiteDisabled,
  settingsItem,
  type TabPeekSettings,
} from '@/utils/storage';
import { createI18n } from '@/utils/i18n';
import { createPreviewSystem, PREVIEW_STYLE, type PreviewSystem } from '@/utils/preview';
import { createSelectionSystem, SELECTION_STYLE, type SelectionSystem } from '@/utils/selection';
import { createSpeculationSystem } from '@/utils/speculation';

function toAnchorInfo(anchor: HTMLAnchorElement, url: string, e: MouseEvent) {
  return {
    url,
    rect: anchor.getBoundingClientRect(),
    pointer: { x: e.clientX, y: e.clientY },
  };
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main(ctx) {
    let settings: TabPeekSettings = { ...DEFAULT_SETTINGS };
    let preview: PreviewSystem | null = null;
    let selection: SelectionSystem | null = null;
    let uiReady: Promise<void> | null = null;

    const i18n = createI18n(() => settings.language);
    const speculation = createSpeculationSystem({ getSettings: () => settings });

    function maxWindows(): number {
      return clampSettings(settings).maxWindows;
    }

    function ensureUi(): Promise<void> {
      if (uiReady) return uiReady;
      uiReady = (async () => {
        const ui = await createShadowRootUi(ctx, {
          name: 'tabpeek-ui',
          position: 'inline',
          append: 'last',
          css: PREVIEW_STYLE + '\n' + SELECTION_STYLE,
          onMount(_container, shadow) {
            preview = createPreviewSystem(
              {
                getSettings: () => settings,
                getMaxWindows: maxWindows,
                i18n,
              },
              shadow,
            );
            selection = createSelectionSystem(
              ctx,
              { getSettings: () => settings, i18n },
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
      const uiHost = document.querySelector('tabpeek-ui');
      if (uiHost && uiHost.contains(target)) return null;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
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
      return { anchor, url: href };
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
      if (settings.triggerMode === 'altHover') return e.altKey;
      return settings.triggerMode === 'hover';
    }

    ctx.addEventListener(document, 'pointerover', (e) => {
      const event = e as PointerEvent;
      const hit = anchorHref(event);
      // Hovering a link is intent even when it won't open a preview (e.g.
      // altHover without Alt): warm it through the Speculation Rules API.
      if (hit && settings.enabled) speculation.onIntent(hit.url);
      if (hit && settings.enabled && triggerAllows(event)) {
        preview?.keep(hit.url);
        if (hoveringUrl === hit.url) return;
        clearHoverTimer();
        hoveringUrl = hit.url;
        const info = toAnchorInfo(hit.anchor, hit.url, event);
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
          (n) => n instanceof HTMLElement && n.tagName === 'TABPEEK-UI',
        );
        if (!overUi) preview?.releaseExcept(null);
      }
    });

    ctx.addEventListener(document, 'pointerout', (e) => {
      const event = e as PointerEvent;
      if (anchorHref(event) && !event.relatedTarget) {
        clearHoverTimer();
      }
    });

    ctx.addEventListener(document, 'mousedown', (e) => {
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

    function cancelPress() {
      pressId++;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      pressOrigin = null;
      preview?.cancelProgress();
    }

    ctx.addEventListener(document, 'pointerdown', (e) => {
      const event = e as PointerEvent;
      cancelPress();
      if (
        !settings.enabled ||
        settings.triggerMode !== 'longPress' ||
        event.button !== 0 ||
        event.isPrimary === false
      ) {
        return;
      }
      const hit = anchorHref(event);
      if (!hit) return;
      const info = toAnchorInfo(hit.anchor, hit.url, event);
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

    ctx.addEventListener(document, 'pointerup', () => cancelPress());
    ctx.addEventListener(document, 'pointercancel', () => cancelPress());
    ctx.addEventListener(document, 'pointermove', (e) => {
      if (!pressTimer || !pressOrigin) return;
      const event = e as PointerEvent;
      if (
        Math.hypot(event.clientX - pressOrigin.x, event.clientY - pressOrigin.y) > 12
      ) {
        cancelPress(); // drag / scroll intent, not a long-press
      }
    });

    ctx.addEventListener(
      document,
      'click',
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
        if (!settings.enabled || settings.triggerMode !== 'click') return;
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        const hit = anchorHref(event);
        if (!hit) return;
        e.preventDefault();
        e.stopPropagation();
        const info = toAnchorInfo(hit.anchor, hit.url, event);
        void ensureUi().then(() => {
          selection?.hide();
          preview?.open(info);
        });
      },
      true,
    );

    settingsItem.getValue().then((stored: TabPeekSettings | undefined) => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
      // Pre-create the UI host so the selection toolbar works even if no
      // preview has been opened yet (cheap: an empty zero-size shadow host).
      if (settings.enabled) void ensureUi();
    });
    ctx.onInvalidated(() => {
      preview?.destroy();
    });

    void settingsItem.watch((newVal: TabPeekSettings | undefined) => {
      if (!newVal) return;
      settings = { ...DEFAULT_SETTINGS, ...newVal };
      preview?.applySettings(clampSettings(settings));
      selection?.applySettings(clampSettings(settings));
    });
  },
});
