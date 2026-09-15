export type TriggerMode = "hover" | "altHover" | "click" | "altClick" | "longPress" | "drag";
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
export type ThemeMode = "system" | "light" | "dark";
export type PowerMode = "auto" | "on" | "max" | "off";
export type WindowTheme =
  | "gray"
  | "midnight"
  | "silver"
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "custom";

export interface WindowThemePreset {
  id: WindowTheme;
  /** Accent applied across the whole UI while this preset is selected */
  accent: string;
  /**
   * "tint" tints the window surface from the accent (over the app theme's base,
   * so it still works in dark mode); "dark" gives the window its own dark
   * surface and light text whatever the app theme is.
   */
  kind: "tint" | "dark";
  surface?: string;
  ink?: string;
}

export const WINDOW_THEMES: WindowThemePreset[] = [
  { id: "blue", accent: "#4f6bf6", kind: "tint" },
  { id: "gray", accent: "#6b7280", kind: "tint" },
  { id: "silver", accent: "#8c959f", kind: "tint" },
  { id: "green", accent: "#10b981", kind: "tint" },
  { id: "purple", accent: "#8b5cf6", kind: "tint" },
  { id: "pink", accent: "#ec4899", kind: "tint" },
  { id: "midnight", accent: "#4f6bf6", kind: "dark", surface: "#1e2432", ink: "#e7eaf0" },
  { id: "custom", accent: "#4f6bf6", kind: "tint" },
];

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

/**
 * AI engines for the selection toolbar. A template containing `%s` receives the
 * selected text in the URL; a template without it means the site cannot take a
 * prompt that way (DeepSeek reads no such query param), so the caller copies the
 * selection to the clipboard and opens the plain URL instead.
 */
export const AI_ENGINES: SearchEngine[] = [
  { id: "deepseek", label: "DeepSeek", url: "https://chat.deepseek.com/" },
  { id: "doubao", label: "豆包", url: "https://www.doubao.com/chat/?q=%s" },
  { id: "kimi", label: "Kimi", url: "https://kimi.moonshot.cn/?q=%s" },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/search?q=%s" },
];

export const MAX_WINDOWS_LIMIT = 6;

/** Power-saving levels, in the order the settings panel lists them. */
export const POWER_MODES: PowerMode[] = ["auto", "on", "max", "off"];

/** Window width/height bounds, in percent of the viewport. */
export const WINDOW_PCT_MIN = 20;
export const WINDOW_PCT_MAX = 100;

/**
 * Window size used to be configured in pixels (320-1200 x 240-900). Anything
 * above the percentage ceiling can only be such a legacy value, so convert it
 * against a fixed reference viewport — a per-machine conversion would give
 * different results in the settings panel and in a page.
 */
const LEGACY_VP_W = 1440;
const LEGACY_VP_H = 900;

function clampWindowPercent(value: number, legacyRef: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const pct = value > WINDOW_PCT_MAX ? Math.round((value / legacyRef) * 100) : Math.round(value);
  return Math.min(WINDOW_PCT_MAX, Math.max(WINDOW_PCT_MIN, pct));
}

export interface TabPeekSettings {
  enabled: boolean;
  triggerMode: TriggerMode;
  hoverDelayMs: number;
  /** Hold duration before the preview opens in longPress mode */
  longPressMs: number;
  /** Preview window size as a percentage of the viewport */
  width: number;
  height: number;
  themeColor: string;
  position: PreviewPosition;
  sidebarSide: SidebarSide;
  /** Backdrop blur strength, 0-100 (shown on the preview window's hover) */
  blurStrength: number;
  selectionSearch: boolean;
  searchEngines: string[];
  aiEngine: string;
  openInBackground: boolean;
  minSelectionChars: number;
  language: Language;
  /** Draw a frame around the link the pointer is over */
  highlightLinks: boolean;
  /** New preview windows start pinned, so they survive the pointer leaving */
  autoPin: boolean;
  /** Extension appearance: the settings panel and every in-page shadow UI */
  theme: ThemeMode;
  /** Preview window look: a preset tint, or `custom` driven by `themeColor` */
  windowTheme: WindowTheme;
  /** Strip marketing/analytics parameters from links TabPeek opens */
  stripTracking: boolean;
  /** Show a read-only risk hint in the preview header for suspect links */
  warnDangerous: boolean;
  /** Close triggers for preview windows (pinned windows ignore all of them) */
  closeOnOutsideClick: boolean;
  closeOnMouseLeave: boolean;
  closeOnScroll: boolean;
  /** How many preview windows may be open at once */
  maxWindows: number;
  /** Speculation Rules: warm the hovered link before the preview opens */
  speculationMode: SpeculationMode;
  /** How much of TabPeek's own work is given up to save power */
  powerSaver: PowerMode;
  /** Skip preview fades and the hover countdown bar's transition */
  reduceMotion: boolean;
  disabledSites: string[];
}

export const DEFAULT_SETTINGS: TabPeekSettings = {
  enabled: true,
  triggerMode: "hover",
  hoverDelayMs: 500,
  longPressMs: 600,
  width: 40,
  height: 55,
  themeColor: "#4f6bf6",
  position: "link",
  sidebarSide: "right",
  blurStrength: 0,
  selectionSearch: true,
  searchEngines: ["google", "bing", "baidu"],
  aiEngine: "deepseek",
  openInBackground: false,
  minSelectionChars: 2,
  language: "zh-CN",
  maxWindows: 3,
  speculationMode: "prefetch",
  powerSaver: "auto",
  reduceMotion: false,
  highlightLinks: false,
  autoPin: false,
  theme: "system",
  windowTheme: "blue",
  stripTracking: true,
  warnDangerous: true,
  closeOnOutsideClick: true,
  closeOnMouseLeave: true,
  closeOnScroll: true,
  disabledSites: [],
};

export const settingsItem = storage.defineItem<TabPeekSettings>("local:tabpeek_settings", {
  defaultValue: DEFAULT_SETTINGS,
});

/**
 * Backdrop blur used to be configured in pixels (0-20), so `blurPx` is converted
 * once (x5) into the percentage. Callers merge `DEFAULT_SETTINGS` in first, which
 * fills `blurStrength` with 0 and would hide the legacy value — hence the check
 * for a positive new value rather than for presence. `clampSettings` also strips
 * `blurPx`, so after the first save the old key cannot come back.
 */
function clampBlurStrength(value: number | undefined, legacyPx: number | undefined): number {
  const raw =
    typeof value === "number" && value > 0
      ? value
      : typeof legacyPx === "number" && legacyPx > 0
        ? legacyPx * 5
        : (value ?? DEFAULT_SETTINGS.blurStrength);
  if (!Number.isFinite(raw)) return DEFAULT_SETTINGS.blurStrength;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

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

function presetAccent(id: WindowTheme): string {
  return (WINDOW_THEMES.find((w) => w.id === id) ?? WINDOW_THEMES[0]!).accent;
}

export function clampSettings(s: TabPeekSettings): TabPeekSettings {
  const { blurPx: legacyBlurPx, ...rest } = s as TabPeekSettings & { blurPx?: number };
  const windowTheme: WindowTheme = WINDOW_THEMES.some((w) => w.id === s.windowTheme)
    ? s.windowTheme
    : DEFAULT_SETTINGS.windowTheme;
  return {
    ...rest,
    hoverDelayMs: Math.min(2000, Math.max(100, s.hoverDelayMs || DEFAULT_SETTINGS.hoverDelayMs)),
    longPressMs: Math.min(2000, Math.max(200, s.longPressMs || DEFAULT_SETTINGS.longPressMs)),
    width: clampWindowPercent(s.width, LEGACY_VP_W, DEFAULT_SETTINGS.width),
    height: clampWindowPercent(s.height, LEGACY_VP_H, DEFAULT_SETTINGS.height),
    blurStrength: clampBlurStrength(rest.blurStrength, legacyBlurPx),
    minSelectionChars: Math.min(20, Math.max(1, s.minSelectionChars)),
    // An engine id can disappear between versions; falling back beats
    // rendering a toolbar with no AI button at all.
    aiEngine: AI_ENGINES.some((e) => e.id === s.aiEngine) ? s.aiEngine : DEFAULT_SETTINGS.aiEngine,
    theme: (["system", "light", "dark"] as const).includes(s.theme)
      ? s.theme
      : DEFAULT_SETTINGS.theme,
    // Unlike an engine id, a bogus power level cannot fall back to "do nothing":
    // every comparison against it would silently drop features.
    powerSaver: POWER_MODES.includes(s.powerSaver) ? s.powerSaver : DEFAULT_SETTINGS.powerSaver,
    windowTheme,
    // A preset owns its accent: keeping them in step here means a stale
    // `themeColor` (or a hand-edited store) can never tint the window with one
    // colour while the rest of the UI uses another. `custom` is the exception —
    // that is exactly the case where themeColor is the source of truth.
    themeColor: windowTheme === "custom" ? s.themeColor : presetAccent(windowTheme),
    maxWindows: Math.min(MAX_WINDOWS_LIMIT, Math.max(1, s.maxWindows)),
  };
}
