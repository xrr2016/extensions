import type { I18n } from '@/utils/i18n';

export interface ReaderContent {
  title?: string;
  html: string;
}

const STRIP_SELECTOR = [
  'script', 'style', 'noscript', 'iframe', 'frame', 'object', 'embed',
  'form', 'button', 'input', 'select', 'textarea', 'svg', 'canvas',
  'video', 'audio', 'link', 'meta', 'header', 'footer', 'nav', 'aside',
].join(',');

function textLength(el: Element): number {
  let len = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) len += walker.currentNode.textContent?.trim().length ?? 0;
  return len;
}

/** Rough "most paragraphs of text wins" scan over structural containers. */
function densestBlock(scope: Element | null): Element | null {
  if (!scope) return null;
  let best: Element | null = null;
  let bestScore = 0;
  const nodes = scope.querySelectorAll('article, main, section, div, td');
  // Cap the scan so huge pages stay responsive.
  const limit = Math.min(nodes.length, 400);
  for (let i = 0; i < limit; i++) {
    const el = nodes[i]!;
    const paras = el.querySelectorAll('p, li');
    if (paras.length < 3) continue;
    let score = 0;
    paras.forEach((p) => {
      const len = p.textContent?.trim().length ?? 0;
      if (len > 40) score += len;
    });
    // Penalise link-heavy blocks (nav/related lists)
    const linkText = [...el.querySelectorAll('a')].reduce(
      (n, a) => n + (a.textContent?.trim().length ?? 0),
      0,
    );
    if (score > bestScore && linkText < score * 2) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href'],
  img: ['src', 'alt'],
};

function sanitize(root: Element, baseUrl: string) {
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const allowed = ALLOWED_ATTRS[el.tagName.toLowerCase()] ?? [];
    for (const attr of [...el.attributes]) {
      if (!allowed.includes(attr.name.toLowerCase())) el.removeAttribute(attr.name);
    }
    const href = el.getAttribute('href');
    if (href) {
      if (/^\s*javascript:/i.test(href)) {
        el.removeAttribute('href');
      } else {
        try {
          el.setAttribute('href', new URL(href, baseUrl).href);
        } catch {
          el.removeAttribute('href');
        }
      }
    }
    const src = el.getAttribute('src');
    if (src) {
      try {
        el.setAttribute('src', new URL(src, baseUrl).href);
        el.setAttribute('loading', 'lazy');
        el.setAttribute('referrerpolicy', 'no-referrer');
      } catch {
        el.removeAttribute('src');
      }
    }
  }
}

export function extractReaderContent(html: string, baseUrl: string): ReaderContent | null {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return null;
  }
  const title =
    doc
      .querySelector('meta[property="og:title"], meta[name="twitter:title"]')
      ?.getAttribute('content')
      ?.trim() ||
    doc.title.trim() ||
    undefined;

  doc.body?.querySelectorAll(STRIP_SELECTOR).forEach((el) => el.remove());
  doc.querySelectorAll('[hidden]').forEach((el) => el.remove());

  const landmarks = [...doc.querySelectorAll('article, main, [role="main"]')];
  let best = landmarks.sort((a, b) => textLength(b) - textLength(a))[0] ?? null;
  if (!best || textLength(best) < 200) {
    best = densestBlock(doc.body) ?? best;
  }
  if (!best && doc.body && textLength(doc.body) >= 500) best = doc.body;
  if (!best) return null;
  const hasText = textLength(best) >= 80;
  const hasImg = !!best.querySelector('img');
  if (!hasText && !hasImg) return null;

  sanitize(best, baseUrl);
  const inner = best === doc.body ? best.innerHTML : best.outerHTML;
  if (!inner.trim()) return null;
  return { title, html: inner };
}

/** Renders extracted content into a styled container owned by a preview window. */
export function renderReaderInto(
  reader: ReaderContent,
  i18n: I18n,
  originUrl: string,
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tp-reader';
  const heading = document.createElement('h1');
  heading.className = 'tp-r-title';
  heading.textContent = reader.title ?? safeHost(originUrl);
  container.appendChild(heading);
  const content = document.createElement('div');
  content.innerHTML = reader.html;
  container.appendChild(content);
  container.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    void browser.runtime.sendMessage({ type: 'prelook:openTab', url: a.href });
  });
  void i18n; // reserved for future reader-mode UI strings
  return container;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
