import { translate } from '@/utils/i18n';
import { DEFAULT_SETTINGS, settingsItem } from '@/utils/storage';
import { stripTracking } from '@/utils/tracking';

interface FetchPreviewResult {
  ok: boolean;
  /** Whether the target may be embedded by the requesting page's origin */
  canEmbed: boolean;
  finalUrl?: string;
  title?: string;
  description?: string;
  favicon?: string;
  html?: string;
  error?: string;
}

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

/**
 * Decide whether `target` allows being framed by `hostOrigin` based on the
 * response headers, mirroring what the browser would do for an <iframe>.
 */
function embedAllowed(headers: Headers, hostOrigin: string): boolean {
  const xfo = headers.get('x-frame-options')?.toUpperCase();
  if (xfo) {
    if (xfo === 'DENY' || xfo === 'SAMEORIGIN') {
      const targetOrigin = headers.get('x-tabpeek-origin');
      if (!targetOrigin || targetOrigin !== hostOrigin) return false;
    } else if (xfo.startsWith('ALLOW-FROM')) {
      const from = xfo.slice('ALLOW-FROM'.length).trim();
      if (from !== hostOrigin) return false;
    }
  }
  const csp = headers.get('content-security-policy') ?? '';
  for (const directive of csp.split(';')) {
    const parts = directive.trim().split(/\s+/);
    if (parts[0]?.toLowerCase() !== 'frame-ancestors') continue;
    const sources = parts.slice(1);
    if (sources.includes('*')) return true;
    if (sources.includes("'none'")) return false;
    const hostHost = hostOrigin.replace(/^\w+:\/\//, '');
    const matches = sources.some((s) => {
      if (s === "'self'") return false; // 'self' is the target itself, not the host page
      if (s.startsWith('*.')) return hostHost.endsWith(s.slice(2)) || hostHost === s.slice(2);
      if (s.includes('://')) return s.replace(/\/.*$/, '') === hostOrigin;
      return hostHost === s.replace(/\/.*$/, '');
    });
    return matches;
  }
  return true;
}

function matchRe(html: string, re: RegExp): string | undefined {
  return re.exec(html)?.[1]?.trim() || undefined;
}

function extractMeta(html: string, finalUrl: string) {
  const title =
    matchRe(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    matchRe(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description =
    matchRe(
      html,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    matchRe(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  let favicon = matchRe(
    html,
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
  );
  if (favicon) {
    try {
      favicon = new URL(favicon, finalUrl).href;
    } catch {
      favicon = undefined;
    }
  }
  favicon ??= new URL('/favicon.ico', finalUrl).href;
  return { title, description, favicon };
}

async function fetchPreview(url: string, hostOrigin: string): Promise<FetchPreviewResult> {
  if (!/^https?:/i.test(url)) return { ok: false, canEmbed: false, error: 'unsupported-url' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      redirect: 'follow',
    });
    // Reconstruct the pre-request embed decision. XFO/SAMEORIGIN compares
    // against the final origin after redirects; res.url gives us that.
    const headers = new Headers(res.headers);
    if (headers.get('x-frame-options')?.toUpperCase() === 'SAMEORIGIN') {
      try {
        headers.set('x-tabpeek-origin', new URL(res.url).origin);
      } catch {
        /* ignore */
      }
    }
    const canEmbed = embedAllowed(headers, hostOrigin);

    const contentType = res.headers.get('content-type') ?? '';
    let html: string | undefined;
    if (contentType.includes('text/html')) {
      const text = await res.text();
      html = text.length > MAX_HTML_BYTES ? text.slice(0, MAX_HTML_BYTES) : text;
    }
    const meta = html ? extractMeta(html, res.url) : {};
    return {
      ok: res.ok,
      canEmbed,
      finalUrl: res.url,
      html,
      error: res.ok ? undefined : `http-${res.status}`,
      ...meta,
    };
  } catch (error) {
    // Network failure: still attempt an iframe, the page may block bots.
    return { ok: false, canEmbed: true, error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

const MENU_ROOT = 'tabpeek-root';
const MENU_POPUP = 'tabpeek-open-popup';
const MENU_SIDEBAR = 'tabpeek-open-sidebar';

/** Context menus are not localised by the browser, so they are rebuilt from the
 *  stored UI language whenever that changes. */
async function setupContextMenus() {
  const language = await settingsItem
    .getValue()
    .then((stored) => ({ ...DEFAULT_SETTINGS, ...stored }).language)
    .catch(() => DEFAULT_SETTINGS.language);
  const t = (key: string) => translate(language, key);
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({
    id: MENU_ROOT,
    title: t('menu.root'),
    contexts: ['link'],
  });
  browser.contextMenus.create({
    id: MENU_POPUP,
    parentId: MENU_ROOT,
    title: t('menu.popup'),
    contexts: ['link'],
  });
  browser.contextMenus.create({
    id: MENU_SIDEBAR,
    parentId: MENU_ROOT,
    title: t('menu.sidebar'),
    contexts: ['link'],
  });
}

/**
 * Clicking the toolbar icon must open the settings panel. Chrome/Edge declare
 * that as a behaviour rather than a handler — while it is set, `action.onClicked`
 * never fires. Firefox knows nothing about `sidePanel`: there the click is ours
 * to handle, and in MV2 it arrives on `browserAction` instead of `action`.
 */
function bindIconToPanel() {
  // `sidebarAction` is Firefox-only and absent from the shared type surface, so
  // every API here is read off a widened view and probed at runtime.
  const apis = browser as unknown as {
    browserAction?: typeof browser.action;
    sidePanel?: typeof browser.sidePanel;
    sidebarAction?: { open: () => Promise<void> };
  };
  void apis.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
  const sidebarAction = apis.sidebarAction;
  if (!sidebarAction) return;
  (apis.browserAction ?? browser.action).onClicked.addListener(() => {
    void sidebarAction.open().catch(() => undefined);
  });
}

export default defineBackground(() => {
  bindIconToPanel();
  void setupContextMenus();
  browser.runtime.onInstalled.addListener(() => void setupContextMenus());
  let menuLanguage = '';
  void settingsItem.watch((stored) => {
    const language = { ...DEFAULT_SETTINGS, ...stored }.language;
    if (language === menuLanguage) return;
    menuLanguage = language;
    void setupContextMenus();
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    const sidebar = info.menuItemId === MENU_SIDEBAR;
    if (!sidebar && info.menuItemId !== MENU_POPUP) return;
    const url = info.linkUrl;
    if (!url || tab?.id == null) return;
    // The content script owns the preview UI; it resolves the anchor itself.
    void browser.tabs
      .sendMessage(tab.id, { type: 'tabpeek:preview', url, sidebar })
      .catch(() => undefined);
  });

  browser.runtime.onMessage.addListener((message: unknown, sender): Promise<unknown> | undefined => {
    if (typeof message !== 'object' || message === null || !('type' in message)) {
      return undefined;
    }
    const msg = message as Record<string, unknown>;

    if (msg.type === 'tabpeek:fetch') {
      const hostOrigin = sender.tab?.url ? new URL(sender.tab.url).origin : '';
      return fetchPreview(String(msg.url ?? ''), hostOrigin);
    }

    if (msg.type === 'tabpeek:openTab') {
      const raw = String(msg.url ?? '');
      if (!/^https?:/i.test(raw)) return Promise.resolve({ ok: false });
      // Safety net: the content script already cleans preview URLs, but every tab
      // this extension opens should go out without tracking parameters anyway.
      return settingsItem
        .getValue()
        .then((stored) => {
          const s = { ...DEFAULT_SETTINGS, ...stored };
          return s.stripTracking === false ? raw : stripTracking(raw);
        })
        .catch(() => stripTracking(raw))
        .then((url) => browser.tabs.create({ url, active: msg.background !== true }).then(() => ({ ok: true })));
    }

    return undefined;
  });
});
