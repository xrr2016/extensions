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

export default defineBackground(() => {
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
      const url = String(msg.url ?? '');
      if (!/^https?:/i.test(url)) return Promise.resolve({ ok: false });
      return browser.tabs
        .create({ url, active: msg.background !== true })
        .then(() => ({ ok: true }));
    }

    return undefined;
  });
});
