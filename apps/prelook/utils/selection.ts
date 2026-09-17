import type { I18n } from "@/utils/i18n";
import {
  AI_ENGINES,
  SEARCH_ENGINES,
  clampSettings,
  isSiteDisabled,
  type PrelookSettings,
} from "@/utils/storage";
import type { ContentScriptContext } from "wxt/utils/content-script-context";

export const SELECTION_STYLE = `
.tp-sel {
  position: fixed; z-index: 2147483646; display: none; align-items: center; gap: 2px;
  padding: 4px; border-radius: 10px; background: #fff;
  border: 1px solid rgba(0,0,0,.1); box-shadow: 0 8px 28px rgba(0,0,0,.22), 0 1px 4px rgba(0,0,0,.12);
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.tp-sel.tp-show { display: flex; }
.tp-sel button {
  border: 0; border-radius: 7px; padding: 5px 9px; background: transparent;
  font-size: 12.5px; line-height: 1.2; color: #1f2328; cursor: pointer; white-space: nowrap;
}
.tp-sel button:hover { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 12%, #fff); color: var(--tp-accent, #4f6bf6); }
.tp-sel .tp-sel-div { width: 1px; height: 16px; margin: 0 2px; background: rgba(0,0,0,.12); }
:host([data-tp-theme='dark']) .tp-sel .tp-sel-div { background: #333941; }
:host([data-tp-theme='dark']) .tp-sel { background: #1e2126; border-color: #333941; box-shadow: 0 8px 28px rgba(0,0,0,.5), 0 1px 4px rgba(0,0,0,.4); }
:host([data-tp-theme='dark']) .tp-sel button { color: #e6e8eb; }
:host([data-tp-theme='dark']) .tp-sel button:hover { background: color-mix(in srgb, var(--tp-accent, #4f6bf6) 24%, #1e2126); }
`;

export interface SelectionDeps {
  getSettings: () => PrelookSettings;
  i18n: I18n;
}

export interface SelectionSystem {
  isVisible(): boolean;
  hide(): void;
  applySettings(s: PrelookSettings): void;
}

export function createSelectionSystem(
  ctx: ContentScriptContext,
  deps: SelectionDeps,
  shadow: ShadowRoot,
): SelectionSystem {
  const bar = document.createElement("div");
  bar.className = "tp-sel";
  shadow.appendChild(bar);
  let visible = false;

  function render() {
    const s = clampSettings(deps.getSettings());
    bar.innerHTML = "";
    // One Web-search button: which engine it opens is a panel setting now.
    const engine = SEARCH_ENGINES.find((e) => e.id === s.searchEngine);
    if (engine) {
      const btn = document.createElement("button");
      btn.textContent = deps.i18n.t("selection.engines");
      btn.title = engine.label;
      btn.addEventListener("click", () => open(engine.url));
      bar.appendChild(btn);
    }
    const ai = AI_ENGINES.find((e) => e.id === s.aiEngine);
    if (ai) {
      // Divider between the Web-search and AI-search groups.
      bar.appendChild(document.createElement("i")).className = "tp-sel-div";
      const btn = document.createElement("button");
      btn.textContent = `✨ ${deps.i18n.t("selection.ai")}`;
      btn.title = ai.url.includes("%s")
        ? `${deps.i18n.t("selection.ai")} · ${ai.label}`
        : `${deps.i18n.t("selection.ai")} · ${ai.label} ${deps.i18n.t("selection.aiCopyHint")}`;
      btn.addEventListener("click", () => open(ai.url));
      bar.appendChild(btn);
    }
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

  function open(template: string) {
    const sel = document.getSelection();
    const text = sel?.toString().trim();
    hide();
    if (!text) return;
    sel?.removeAllRanges();
    // No `%s` means the site can't take the prompt in the URL, so hand the text
    // over through the clipboard and just start a fresh conversation.
    const takestext = template.includes("%s");
    if (!takestext) copyText(text);
    const url = takestext ? template.replace("%s", encodeURIComponent(text)) : template;
    void browser.runtime.sendMessage({
      type: "prelook:openTab",
      url,
      background: clampSettings(deps.getSettings()).openInBackground,
    });
  }

  function show(rect: DOMRect) {
    render();
    const s = clampSettings(deps.getSettings());
    bar.style.setProperty("--tp-accent", s.themeColor);
    bar.classList.add("tp-show");
    visible = true;
    const bw = bar.offsetWidth || 200;
    let x = rect.left + rect.width / 2 - bw / 2;
    let y = rect.top - bar.offsetHeight - 8;
    if (y < 8) y = Math.min(rect.bottom + 8, innerHeight - bar.offsetHeight - 8);
    x = Math.min(Math.max(8, x), Math.max(8, innerWidth - bw - 8));
    bar.style.left = `${x}px`;
    bar.style.top = `${y}px`;
  }

  function hide() {
    bar.classList.remove("tp-show");
    visible = false;
  }

  function editableArea(node: Node | null): boolean {
    const el = node instanceof Element ? node : node?.parentElement;
    return !!el?.closest?.('input, textarea, [contenteditable="true"], [contenteditable=""]');
  }

  function check() {
    const s = clampSettings(deps.getSettings());
    if (!s.selectionSearch || !s.enabled || isSiteDisabled(s.disabledSites, location.hostname)) {
      hide();
      return;
    }
    const sel = document.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!sel || sel.isCollapsed || text.length < s.minSelectionChars || sel.rangeCount === 0) {
      hide();
      return;
    }
    if (editableArea(sel.anchorNode)) {
      hide();
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0 && rect.top === 0)) {
      hide();
      return;
    }
    show(rect);
  }

  ctx.addEventListener(document, "mouseup", (e: MouseEvent) => {
    const path = e.composedPath();
    if (path.includes(bar)) return; // interacting with the toolbar itself
    setTimeout(check, 10);
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
