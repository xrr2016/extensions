export type TriggerMode = "hover" | "altHover" | "click" | "longPress";
export type PreviewPosition =
  | "link"
  | "mouse"
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "center"
  | "sidebar";
export type Language = "zh-CN" | "en";
export type SidebarSide = "left" | "right";
export type SpeculationMode = "off" | "prefetch" | "prerender";

export interface SearchEngine {
  id: string;
  label: string;
  /** URL template; `%s` is replaced with the encoded selection */
  url: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: "google", label: "Google", url: "https://www.google.com/search?q=%s" },
  { id: "bing", label: "Bing", url: "https://www.bing.com/search?q=%s" },
  { id: "baidu", label: "百度", url: "https://www.baidu.com/s?wd=%s" },
  { id: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s" },
];

export const AI_ENGINES: SearchEngine[] = [
  { id: "copilot", label: "Bing Copilot", url: "https://www.bing.com/search?q=%s&showconv=1" },
  { id: "gemini", label: "Google Gemini", url: "https://www.google.com/search?q=%s&udm=50" },
  { id: "doubao", label: "豆包", url: "https://www.doubao.com/chat/?q=%s" },
  { id: "kimi", label: "Kimi", url: "https://kimi.moonshot.cn/?q=%s" },
];

export const MAX_WINDOWS_LIMIT = 6;

export interface TabPeekSettings {
  enabled: boolean;
  triggerMode: TriggerMode;
  hoverDelayMs: number;
  /** Hold duration before the preview opens in longPress mode */
  longPressMs: number;
  width: number;
  height: number;
  themeColor: string;
  position: PreviewPosition;
  sidebarSide: SidebarSide;
  blurPx: number;
  selectionSearch: boolean;
  searchEngines: string[];
  aiEngine: string;
  openInBackground: boolean;
  minSelectionChars: number;
  language: Language;
  /** How many preview windows may be open at once */
  maxWindows: number;
  /** Speculation Rules: warm the hovered link before the preview opens */
  speculationMode: SpeculationMode;
  disabledSites: string[];
}

export const DEFAULT_SETTINGS: TabPeekSettings = {
  enabled: true,
  triggerMode: "hover",
  hoverDelayMs: 500,
  longPressMs: 600,
  width: 560,
  height: 480,
  themeColor: "#4f6bf6",
  position: "link",
  sidebarSide: "right",
  blurPx: 0,
  selectionSearch: true,
  searchEngines: ["google", "bing", "baidu"],
  aiEngine: "copilot",
  openInBackground: false,
  minSelectionChars: 2,
  language: "zh-CN",
  maxWindows: 3,
  speculationMode: "prefetch",
  disabledSites: [],
};

export const settingsItem = storage.defineItem<TabPeekSettings>("local:tabpeek_settings", {
  defaultValue: DEFAULT_SETTINGS,
});

export function isSiteDisabled(disabledSites: string[], hostname: string): boolean {
  if (!disabledSites.length) {
    return false;
  }

  const host = hostname.toLowerCase();
  return disabledSites.some((site) => {
    const s = site.toLowerCase().trim();
    if (!s) return false;
    return host === s || host.endsWith(`.${s}`);
  });
}

export function clampSettings(s: TabPeekSettings): TabPeekSettings {
  return {
    ...s,
    hoverDelayMs: Math.min(2000, Math.max(100, s.hoverDelayMs || DEFAULT_SETTINGS.hoverDelayMs)),
    longPressMs: Math.min(2000, Math.max(200, s.longPressMs || DEFAULT_SETTINGS.longPressMs)),
    width: Math.min(1200, Math.max(320, s.width)),
    height: Math.min(900, Math.max(240, s.height)),
    blurPx: Math.min(20, Math.max(0, s.blurPx)),
    minSelectionChars: Math.min(20, Math.max(1, s.minSelectionChars)),
    maxWindows: Math.min(MAX_WINDOWS_LIMIT, Math.max(1, s.maxWindows)),
  };
}
