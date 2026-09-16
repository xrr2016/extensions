/*
 * Chrome-API stand-in for the landing-page demo recording.
 *
 * `index.html` loads the real `content-scripts/content.js` from `.output`, so
 * everything the recording shows — the countdown bar, the preview window, its
 * motion, the reader fallback — is the shipped code. Only the background
 * service worker is replaced, because the recording has to be reproducible
 * offline and independent of any third party's framing headers.
 *
 * Two things are faked on purpose:
 *
 *   - `tabpeek:fetch` answers from the table below instead of fetching. A URL
 *     marked `canEmbed: false` takes the same path a site that sends
 *     `X-Frame-Options: DENY` would, which is how the recording shows reading
 *     mode without needing a real site that refuses framing.
 *   - `tabpeek_settings` is pre-seeded, so every take runs the same
 *     configuration rather than whatever a previous take left behind.
 *
 * The `title` in each reply is what the preview header shows. Without it the
 * header would read `127.0.0.1:4180`, since the links resolve to this server.
 */
(() => {
  const SETTINGS = {
    triggerMode: "hover",
    hoverDelayMs: 500,
    width: 50,
    height: 50,
    position: "link",
    highlightLinks: true,
    // Pinned to light so the take does not follow the recording machine's OS
    // theme, and off because a prerender of the link would be wasted work here.
    theme: "light",
    windowTheme: "blue",
    language: "zh-CN",
    speculationMode: "off",
    blurStrength: 0,
    maxWindows: 3,
  };

  const READER_ARTICLE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Speculation Rules API - MDN Web Docs</title></head>
<body>
<article>
  <p>The Speculation Rules API is designed to improve performance for future
  navigations. It lets a page tell the browser which URLs are likely to be
  navigated to next, so the browser can prefetch or prerender them before the
  user commits to the navigation.</p>
  <p>Speculation rules are declared as a JSON object inside a script element
  whose type is <code>speculationrules</code>, or added dynamically with the
  <code>addRules()</code> method of the <code>document.speculationRules</code>
  interface. A rule set is made of a source, which decides how the URLs are
  discovered, and an eagerness, which says how early the browser may act.</p>
  <h2>Sources</h2>
  <ul>
    <li><code>list</code> — an explicit array of URLs the page wants to warm up.</li>
    <li><code>document</code> — rules that apply to links found inside the document.</li>
    <li><code>heuristics</code> — the browser picks links from its own signals.</li>
  </ul>
  <h2>Eagerness</h2>
  <p>Eagerness trades bandwidth for latency. <code>immediate</code> starts as soon
  as the rule is seen, which is a good fit for a link the user has already shown
  intent for, such as one the pointer has come to rest on. <code>moderate</code>
  waits for a signal such as the pointer hovering the link, and
  <code>conservative</code> waits for the user to begin a click.</p>
  <p>A prerendered document is a full browsing context: scripts run, resources
  load, and the page is kept ready until the user navigates to it or the browser
  discards it. Because prerendering has side effects, the specification defines
  a set of restrictions that the document has to observe while it is hidden.</p>
</article>
</body></html>`;

  /** Keyed by URL substring; the first match wins. */
  const SITES = [
    {
      match: "article-1.html",
      canEmbed: true,
      title: "先看一眼再决定",
      favicon: "favicon-bits.svg",
      html: "<html><body><article><p>placeholder</p></article></body></html>",
    },
    {
      match: "developer.mozilla.org",
      canEmbed: false,
      title: "Speculation Rules API - MDN Web Docs",
      favicon: "favicon-mdn.svg",
      html: READER_ARTICLE,
    },
  ];

  const store = { tabpeek_settings: SETTINGS };
  const listeners = [];
  const area = {
    get: (keys, cb) => {
      const list = Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const key of list) if (key in store) out[key] = store[key];
      if (cb) cb(out);
      return Promise.resolve(out);
    },
    set: (obj, cb) => {
      Object.assign(store, obj);
      if (cb) cb();
      return Promise.resolve();
    },
    remove: (key, cb) => {
      delete store[key];
      if (cb) cb();
      return Promise.resolve();
    },
    // MV3 exposes per-area events; @wxt-dev/storage watches this one, not
    // chrome.storage.onChanged.
    onChanged: { addListener: (fn) => listeners.push(fn), removeListener: () => {} },
  };

  globalThis.chrome = {
    runtime: {
      id: "demo-extension-id",
      getURL: (path) => path,
      lastError: undefined,
      onMessage: { addListener: () => {}, hasListener: () => false },
      // @wxt-dev/analytics opens a port while the entrypoint is still being
      // evaluated; without it the content script dies before it binds anything.
      connect: () => ({
        postMessage: () => {},
        disconnect: () => {},
        onMessage: { addListener: () => {} },
        onDisconnect: { addListener: () => {} },
      }),
      onConnect: { addListener: () => {} },
      sendMessage: (msg) => {
        if (msg?.type === "tabpeek:fetch") {
          const site = SITES.find((s) => String(msg.url).includes(s.match));
          if (site) {
            return Promise.resolve({
              ok: true,
              canEmbed: site.canEmbed,
              finalUrl: msg.url,
              title: site.title,
              favicon: site.favicon,
              html: site.html,
            });
          }
          return Promise.resolve({ ok: true, canEmbed: true, finalUrl: msg.url });
        }
        return Promise.resolve({ ok: true });
      },
    },
    storage: {
      local: area,
      session: area,
      onChanged: { addListener: (fn) => listeners.push(fn), removeListener: () => {} },
    },
    tabs: { create: () => Promise.resolve({ id: 1 }), query: () => Promise.resolve([]) },
  };
})();
