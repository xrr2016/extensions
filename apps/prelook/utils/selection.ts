import type { I18n } from "@/utils/i18n";
import {
  AI_ENGINES,
  SEARCH_ENGINES,
  TRANSLATE_ENGINES,
  clampSettings,
  isSiteDisabled,
  type PrelookSettings,
  type TranslateEngine,
} from "@/utils/storage";
import type { ContentScriptContext } from "wxt/utils/content-script-context";

export const SELECTION_STYLE = `
.tp-sel {
  position: fixed; z-index: 2147483646; display: none; align-items: center; gap: 2px;
  padding: 6px 8px; border-radius: 999px; background: #fff;
  border: 1px solid rgba(0,0,0,.08); box-shadow: 0 10px 32px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.08);
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.tp-sel.tp-show { display: flex; }
.tp-sel button {
  display: inline-flex; align-items: center; gap: 5px;
  border: 0; border-radius: 999px; padding: 6px 12px; background: transparent;
  font-size: 13px; line-height: 1.2; color: #1f2328; cursor: pointer; white-space: nowrap;
}
.tp-sel button svg { width: 15px; height: 15px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.tp-sel button:hover { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 12%, #fff); color: var(--tp-accent, #4f6bf6); }
/* The preview option is inert until the selection reads as a link. */
.tp-sel button:disabled { color: #aab2bd; cursor: default; }
.tp-sel button:disabled:hover { background: transparent; color: #aab2bd; }
.tp-sel .tp-sel-div { width: 1px; height: 16px; margin: 0 3px; background: rgba(0,0,0,.12); }
/* The tail pointing back at the selected text: a rotated square that inherits
   the bar's fill *and* border colour, so the dark theme needs no rule of its
   own. Only the two sides that face away from the bar carry a border — the
   other two would draw lines across the bar's interior. Its position along the
   edge comes from --tp-arrow-x, written by show(). */
.tp-sel::after {
  content: ""; position: absolute; width: 10px; height: 10px;
  background: inherit; border: 0 solid; border-color: inherit; pointer-events: none;
}
.tp-sel.tp-arrow-down::after {
  bottom: -5px; left: calc(var(--tp-arrow-x, 50%) - 5px); transform: rotate(45deg);
  border-right-width: 1px; border-bottom-width: 1px;
}
.tp-sel.tp-arrow-up::after {
  top: -5px; left: calc(var(--tp-arrow-x, 50%) - 5px); transform: rotate(45deg);
  border-left-width: 1px; border-top-width: 1px;
}
:host([data-tp-theme='dark']) .tp-sel .tp-sel-div { background: #333941; }
:host([data-tp-theme='dark']) .tp-sel { background: #1e2126; border-color: #333941; box-shadow: 0 10px 32px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.4); }
:host([data-tp-theme='dark']) .tp-sel button { color: #e6e8eb; }
:host([data-tp-theme='dark']) .tp-sel button:hover { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 24%, #1e2126); }
:host([data-tp-theme='dark']) .tp-sel button:disabled { color: #5c646e; }
:host([data-tp-theme='dark']) .tp-sel button:disabled:hover { background: transparent; color: #5c646e; }
`;

export interface SelectionDeps {
  getSettings: () => PrelookSettings;
  i18n: I18n;
  /** Opens the floating preview for the URL picked in the toolbar; `rect` is
   *  the selection, so the window lands where the user was reading.
   *  `translate` marks the window as a translation site — an app, not an
   *  article — which keeps the reader fallback away from it. */
  openPreview: (url: string, rect: DOMRect | null, options?: { translate?: boolean }) => void;
  /** Transient toast at a point on screen, for actions whose result happens
   *  out of sight (the selection was copied on the user's behalf). */
  notify: (key: string, x: number, y: number) => void;
}

export interface SelectionSystem {
  isVisible(): boolean;
  hide(): void;
  applySettings(s: PrelookSettings): void;
}

/** Target language follows the browser's UI language: a Chinese UI translates
 *  into Chinese, anything else into English (the source is always detected).
 *  Every engine spells the same target its own way (`tl=zh-CN` vs
 *  `to=zh-Hans`), so the codes live in the engine table. */
function translateUrl(engine: TranslateEngine, text: string): string {
  const uiLang = (browser.i18n.getUILanguage() || "").toLowerCase();
  const family = uiLang.startsWith("zh") ? "zh" : "en";
  return engine.url
    .replace("%t", encodeURIComponent(engine.lang[family]))
    .replace("%s", encodeURIComponent(text));
}

export function createSelectionSystem(
  ctx: ContentScriptContext,
  deps: SelectionDeps,
  shadow: ShadowRoot,
): SelectionSystem {
  console.log("[Prelook] selection system created");
  const bar = document.createElement("div");
  bar.className = "tp-sel";
  shadow.appendChild(bar);
  let visible = false;
  /** Where the selection was when the bar was shown; places the preview window. */
  let selectionRect: DOMRect | null = null;

  /** Inline icons so each button reads like the reference bar: icon + label. */
  const ICON_SEARCH =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>';
  const ICON_SPARK =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18.1l-1.8-5.5L4.7 10.8 10.2 9Z"/><path d="M19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z"/></svg>';
  const ICON_EYE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6.3 5.5 12 5.5 21.5 12 21.5 12 17.7 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';
  const ICON_LANG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';

  /** The selection when it contains an http(s) URL — the only case where a
   *  preview can be opened straight from the page. The whole selection does
   *  not have to *be* a URL: bilibili/weibo wrap comment URLs in quotes
   *  (so a selection of "https://..." would make new URL throw), and some
   *  sites sprinkle zero-width characters into URLs as anti-scraping. We
   *  strip the zero-widths first, then pull the first http(s) URL out of
   *  the text, stopping at whitespace / quotes / angle brackets. */
  function selectedLink(): string | null {
    const raw = document.getSelection()?.toString() ?? "";
    if (!raw.trim()) return null;
    // 剥离 B 站/微博等站点插入的零宽反爬字符
    const cleaned = raw.replace(/[\u200B-\u200D\uFEFF]/g, "");
    // 从文本里抽取第一段 http(s)://... 的 URL，在空白/引号/尖括号/反引号/常见括号处停止
    // （B 站评论用反引号包 URL，括号在 markdown/wiki 链接里也是边界标记）
    const match = cleaned.match(/https?:\/\/[^\s<>'"`\])）】}]+/i);
    const candidate = match ? match[0] : cleaned.trim();
    try {
      console.log("selectedLink:", candidate);
      const url = new URL(candidate);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  }

  function render() {
    const s = clampSettings(deps.getSettings());
    bar.innerHTML = "";
    // One Web-search button: which engine it opens is a panel setting now.
    const engine = SEARCH_ENGINES.find((e) => e.id === s.searchEngine);
    if (engine) {
      const btn = document.createElement("button");
      btn.innerHTML = ICON_SEARCH + `<span></span>`;
      (btn.querySelector("span") as HTMLSpanElement).textContent = deps.i18n.t("selection.engines");
      btn.title = engine.label;
      btn.addEventListener("click", () => open(engine.url));
      bar.appendChild(btn);
    }
    // Translation sits with Web search rather than with the tools that hand the
    // selection to a real tab: it is the one that opens our own preview window.
    const translate = TRANSLATE_ENGINES.find((e) => e.id === s.translateEngine);
    if (translate) {
      const label = deps.i18n.t(`translate.${translate.id}`);
      const btn = document.createElement("button");
      btn.innerHTML = ICON_LANG + `<span></span>`;
      (btn.querySelector("span") as HTMLSpanElement).textContent =
        deps.i18n.t("selection.translate");
      btn.title = `${deps.i18n.t("selection.translate")} · ${label}`;
      btn.addEventListener("click", () => openTranslate(translate));
      bar.appendChild(btn);
    }
    const ai = AI_ENGINES.find((e) => e.id === s.aiEngine);
    if (ai) {
      // Divider between the Web-search and AI-search groups.
      bar.appendChild(document.createElement("i")).className = "tp-sel-div";
      const btn = document.createElement("button");
      btn.innerHTML = ICON_SPARK + `<span></span>`;
      (btn.querySelector("span") as HTMLSpanElement).textContent = deps.i18n.t("selection.ai");
      btn.title = ai.url.includes("%s")
        ? `${deps.i18n.t("selection.ai")} · ${ai.label}`
        : `${deps.i18n.t("selection.ai")} · ${ai.label} ${deps.i18n.t("selection.aiCopyHint")}`;
      btn.addEventListener("click", () => open(ai.url));
      bar.appendChild(btn);
    }
    // Preview closes the row — the only option that stays in the page. It keeps
    // its place but stays inert unless the selection reads as a link.
    const link = s.detectLinks ? selectedLink() : null;
    const previewBtn = document.createElement("button");
    previewBtn.innerHTML = ICON_EYE + `<span></span>`;
    (previewBtn.querySelector("span") as HTMLSpanElement).textContent =
      deps.i18n.t("selection.preview");
    previewBtn.disabled = !link;
    previewBtn.title = link ?? deps.i18n.t("selection.previewHint");
    if (link) {
      previewBtn.addEventListener("click", () => {
        hide();
        deps.openPreview(link, selectionRect);
      });
    }
    bar.appendChild(previewBtn);
  }

  /** Copy via the async API when available, else the legacy execCommand path
   *  (navigator.clipboard is undefined outside secure contexts, e.g. http pages). */
  function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
      return;
    }
    legacyCopy(text);
  }

  function legacyCopy(text: string) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch {
      /* clipboard unavailable; the tab still opens */
    }
    area.remove();
  }

  /** Hands a URL to a real tab; the panel's "open in background" decides whether
   *  it steals focus. Shared by the search/AI buttons and the engines that
   *  cannot be framed. */
  function openTab(url: string) {
    void browser.runtime.sendMessage({
      type: "prelook:openTab",
      url,
      background: clampSettings(deps.getSettings()).openInBackground,
    });
  }

  function open(template: string) {
    const sel = document.getSelection();
    const text = sel?.toString().trim();
    // Measured before hide(): the copied-text notice has to land where the
    // toolbar was, and a hidden element measures as 0×0.
    const barBox = bar.getBoundingClientRect();
    hide();
    if (!text) return;
    sel?.removeAllRanges();
    // No `%s` means the site can't take the prompt in the URL, so hand the text
    // over through the clipboard and just start a fresh conversation — and say
    // so: the new tab opens on an empty box, which looks like nothing happened.
    const takestext = template.includes("%s");
    if (!takestext) {
      copyText(text);
      deps.notify("selection.aiCopied", barBox.left + barBox.width / 2, barBox.top);
    }
    openTab(takestext ? template.replace("%s", encodeURIComponent(text)) : template);
  }

  /** Translation keeps the page you are reading in place: the engine opens as a
   *  preview window — except for the engines `openIn: "tab"` marks as unframeable.
   *  Preview windows are flagged as translations so they never degrade into
   *  reader mode (see preview.ts). */
  function openTranslate(engine: TranslateEngine) {
    const sel = document.getSelection();
    const text = sel?.toString().trim();
    hide();
    if (!text) return;
    sel?.removeAllRanges();
    const url = translateUrl(engine, text);
    if (engine.openIn === "tab") openTab(url);
    else deps.openPreview(url, selectionRect, { translate: true });
  }

  function show(rect: DOMRect) {
    // Set before render(): the preview button captures it in its click handler.
    selectionRect = rect;
    render();
    const s = clampSettings(deps.getSettings());
    bar.style.setProperty("--tp-accent", s.themeColor);
    bar.classList.add("tp-show");
    visible = true;
    const bw = bar.offsetWidth || 200;
    const bh = bar.offsetHeight || 40;
    let x = rect.left + rect.width / 2 - bw / 2;
    let y = rect.top - bh - 8;
    // Not enough room above the selection: drop the bar below it and flip the tail.
    const below = y < 8;
    if (below) y = Math.min(rect.bottom + 8, innerHeight - bh - 8);
    x = Math.min(Math.max(8, x), Math.max(8, innerWidth - bw - 8));
    bar.style.left = `${x}px`;
    bar.style.top = `${y}px`;
    // The tail follows the selection's centre, but stays on the pill's flat
    // stretch: past the rounded cap (radius = half the bar height) it would poke
    // out sideways beyond the curve as a bare sliver without any border.
    const pad = Math.min(bh / 2 + 8, bw / 2);
    const tip = rect.left + rect.width / 2 - x;
    bar.style.setProperty("--tp-arrow-x", `${Math.min(Math.max(tip, pad), bw - pad)}px`);
    bar.classList.toggle("tp-arrow-up", below);
    bar.classList.toggle("tp-arrow-down", !below);
  }

  function hide() {
    bar.classList.remove("tp-show");
    visible = false;
  }

  function editableArea(node: Node | null): boolean {
    const el = node instanceof Element ? node : node?.parentElement;
    return !!el?.closest?.('input, textarea, [contenteditable="true"], [contenteditable=""]');
  }

  function check(snapshot: {
    text: string;
    anchorNode: Node | null;
    rangeCount: number;
    rect: DOMRect | null;
  }) {
    console.log(
      "[check] entry, text:",
      JSON.stringify(snapshot.text),
      "rect:",
      snapshot.rect ? `${snapshot.rect.width}x${snapshot.rect.height}` : "null",
    );
    const s = clampSettings(deps.getSettings());
    if (!s.selectionSearch || !s.enabled || isSiteDisabled(s.disabledSites, location.hostname)) {
      console.log("[check] fail ①");
      hide();
      return;
    }
    const text = snapshot.text;
    // Do NOT trust isCollapsed — sites like bilibili collapse the selection
    // before our handler runs, but toString() / rect still carry the real
    // selection data. The rect size is the honest guard against click-only
    // (zero-width) ranges.
    if (text.length < s.minSelectionChars || snapshot.rangeCount === 0) {
      console.log("[check] fail ②", {
        text: JSON.stringify(text),
        len: text.length,
        min: s.minSelectionChars,
        rangeCount: snapshot.rangeCount,
      });
      hide();
      return;
    }
    if (editableArea(snapshot.anchorNode)) {
      console.log("[check] fail ③ editableArea");
      hide();
      return;
    }
    const rect = snapshot.rect;
    if (!rect || (rect.width === 0 && rect.height === 0 && rect.top === 0)) {
      console.log("[check] fail ④ bad rect", rect);
      hide();
      return;
    }
    console.log("[check] PASS → show()");
    show(rect);
  }

  // mouseup alone is not enough: some sites (bilibili, weibo) collapse the
  // selection in their own mouseup handler *before* our delayed check runs,
  // so we only ever see isCollapsed=true. Worse: their Range becomes invalid
  // (getBoundingClientRect() returns 0x0) even mid-drag, because React
  // virtualization swaps text nodes. And pointermove snapshots overwrite
  // each other via debounce, so only the final (post-collapse) one survives.
  //
  // Fix: the FIRST snapshot captured during drag — the one with the real,
  // unmolested selection — is what we keep. Debounce only gates the DOM
  // work (show/hide toolbar), never the data. For rect, fall back to the
  // anchor element's rect when the Range's own rect is zero (a common
  // artifact of React re-renders on virtualized lists).
  let checkTimer: ReturnType<typeof setTimeout> | null = null;
  let dragActive = false;
  /** Best snapshot captured so far during this drag; reset on pointerdown. */
  let dragSnapshot: ReturnType<typeof captureSelection> | null = null;

  function captureSelection() {
    const sel = document.getSelection();
    const text = sel?.toString().trim() ?? "";
    let rect: DOMRect | null = null;
    try {
      rect = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).getBoundingClientRect() : null;
      // Range.getBoundingClientRect() returns 0x0 on sites that swap nodes
      // mid-drag (bilibili virtualized comments). Fall back to the anchor
      // element's rect — good enough for placing the toolbar near the text.
      if ((!rect || (rect.width === 0 && rect.height === 0)) && sel?.anchorNode) {
        const anchorEl =
          sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode.parentElement;
        rect = anchorEl?.getBoundingClientRect?.() ?? rect;
      }
    } catch {
      rect = null;
    }
    return {
      text,
      anchorNode: sel?.anchorNode ?? null,
      rangeCount: sel?.rangeCount ?? 0,
      rect,
    };
  }
  function scheduleCheck(snap: ReturnType<typeof captureSelection>) {
    if (checkTimer) clearTimeout(checkTimer);
    checkTimer = setTimeout(() => {
      check(snap);
    }, 30);
  }
  ctx.addEventListener(document, "selectionchange", () => {
    scheduleCheck(captureSelection());
  });
  ctx.addEventListener(document, "pointerdown", () => {
    dragActive = true;
    dragSnapshot = null;
  });
  ctx.addEventListener(document, "pointermove", () => {
    if (!dragActive) return;
    const snap = captureSelection();
    // Keep the FIRST good snapshot from the drag — it's the one before any
    // site handler could collapse or corrupt the selection.
    if (!dragSnapshot || snap.text.length > dragSnapshot.text.length) {
      dragSnapshot = snap;
    }
    scheduleCheck(dragSnapshot);
  });
  ctx.addEventListener(document, "pointerup", (e: PointerEvent) => {
    dragActive = false;
    const path = e.composedPath() as Node[];
    if (path.includes(bar)) return;
    // Use the best drag snapshot we captured; fall back to a fresh one.
    const snap = dragSnapshot ?? captureSelection();
    scheduleCheck(snap);
    dragSnapshot = null;
  });
  ctx.addEventListener(
    document,
    "mousedown",
    (e: MouseEvent) => {
      if (!visible) return;
      const path = e.composedPath();
      if (path.includes(bar)) return;
      hide();
    },
    { capture: true },
  );
  ctx.addEventListener(
    window,
    "scroll",
    () => {
      if (visible) hide();
    },
    { capture: true, passive: true },
  );
  ctx.addEventListener(document, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && visible) hide();
  });

  bar.addEventListener("mouseover", (e) => e.stopPropagation());

  return {
    isVisible: () => visible,
    hide,
    applySettings: () => {
      if (visible) render();
      bar.style.setProperty("--tp-accent", clampSettings(deps.getSettings()).themeColor);
    },
  };
}
