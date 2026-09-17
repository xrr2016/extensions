export type TriggerMode = "hover" | "altHover" | "longPress" | "drag";
export type PreviewPosition =
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "center-top"
  | "center"
  | "center-bottom"
  | "sidebar";
export type SizeUnit = "percent" | "px";
export type SidebarSide = "left" | "right";
export type SpeculationMode = "off" | "prefetch" | "prerender";
export type ThemeMode = "system" | "light" | "dark";
export type PowerMode = "auto" | "on" | "max" | "off";
export type HighlightStyle = "solid" | "dashed";
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
  { id: "silver", accent: "#8c959f", kind: "tint" },
  { id: "blue", accent: "#4f6bf6", kind: "tint" },
  { id: "gray", accent: "#6b7280", kind: "tint" },
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
  { id: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s" },
];

/**
 * AI engines for the selection toolbar. A template containing `%s` receives the
 * selected text in the URL; a template without it means the site cannot take a
 * prompt that way (Kimi/豆包/DeepSeek read no such query param), so the caller
 * copies the selection to the clipboard and opens the plain URL instead.
 */
export const AI_ENGINES: SearchEngine[] = [
  { id: "kimi", label: "Kimi", url: "https://kimi.moonshot.cn/" },
  { id: "doubao", label: "豆包", url: "https://www.doubao.com/chat/" },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/search?q=%s" },
  { id: "deepseek", label: "DeepSeek", url: "https://chat.deepseek.com/" },
];

export const MAX_WINDOWS_LIMIT = 6;

/** Power-saving levels, in the order the settings panel lists them. */
export const POWER_MODES: PowerMode[] = ["auto", "on", "max", "off"];

/** Trigger modes, for validating stored settings (values can be removed over time). */
export const TRIGGER_MODES: TriggerMode[] = ["hover", "altHover", "longPress", "drag"];

/** Window width/height bounds as a percentage of the viewport. */
export const WINDOW_PCT_MIN = 20;
export const WINDOW_PCT_MAX = 100;

/** Window width/height bounds in pixels (when `sizeUnit` is "px"). */
export const WINDOW_PX_MIN = 200;
export const WINDOW_PX_MAX = 2000;

/**
 * Window size used to be configured in pixels (320-1200 x 240-900). Anything
 * above the percentage ceiling can only be such a legacy value, so convert it
 * against a fixed reference viewport — a per-machine conversion would give
 * different results in the settings panel and in a page.
 */
export const LEGACY_VP_W = 1440;
export const LEGACY_VP_H = 900;

function clampWindowPercent(value: number, legacyRef: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const pct = value > WINDOW_PCT_MAX ? Math.round((value / legacyRef) * 100) : Math.round(value);
  return Math.min(WINDOW_PCT_MAX, Math.max(WINDOW_PCT_MIN, pct));
}

function clampPxSize(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(WINDOW_PX_MAX, Math.max(WINDOW_PX_MIN, Math.round(value)));
}

export interface PrelookSettings {
  enabled: boolean;
  triggerMode: TriggerMode;
  hoverDelayMs: number;
  /** Hold duration before the preview opens in longPress mode */
  longPressMs: number;
  /** Preview window size as a percentage of the viewport (when `sizeUnit` is
   *  "percent"); px mode reads `widthPx`/`heightPx` instead — each unit keeps
   *  its own values, so switching never overwrites the other. */
  width: number;
  height: number;
  /** Preview window size in px (when `sizeUnit` is "px") */
  widthPx: number;
  heightPx: number;
  /** Unit the preview window size is expressed in */
  sizeUnit: SizeUnit;
  /** Accent of Prelook's own UI: the settings panel, the link frame, the hover
   *  countdown and the selection toolbar. Never touched by the window theme. */
  themeColor: string;
  /** Accent the preview window uses while `windowTheme` is "custom" */
  windowColor: string;
  position: PreviewPosition;
  sidebarSide: SidebarSide;
  /** Backdrop blur strength, 0-100 (shown on the preview window's hover) */
  blurStrength: number;
  selectionSearch: boolean;
  /** Web search engine the selection toolbar opens (single choice) */
  searchEngine: string;
  aiEngine: string;
  openInBackground: boolean;
  minSelectionChars: number;
  /** Draw a frame around the link the pointer is over */
  highlightLinks: boolean;
  /** Border style for the link highlight frame */
  highlightStyle: HighlightStyle;
  /** New preview windows start pinned, so they survive the pointer leaving */
  autoPin: boolean;
  /** Extension appearance: the settings panel and every in-page shadow UI */
  theme: ThemeMode;
  /** Preview window look: a preset tint, or "custom" driven by `windowColor` */
  windowTheme: WindowTheme;
  /** Strip marketing/analytics parameters from links Prelook opens */
  stripTracking: boolean;
  /** Show a read-only risk hint in the preview header for suspect links */
  warnDangerous: boolean;
  /** Don't preview links that wrap an image or point at an image file */
  skipImages: boolean;
  /** Close triggers for preview windows (pinned windows ignore all of them) */
  closeOnOutsideClick: boolean;
  closeOnMouseLeave: boolean;
  closeOnScroll: boolean;
  /** How many preview windows may be open at once */
  maxWindows: number;
  /** Speculation Rules: warm the hovered link before the preview opens */
  speculationMode: SpeculationMode;
  /** How much of Prelook's own work is given up to save power */
  powerSaver: PowerMode;
  /** Skip preview fades and the hover countdown bar's transition */
  reduceMotion: boolean;
  disabledSites: string[];
}

export const DEFAULT_SETTINGS: PrelookSettings = {
  enabled: true,
  triggerMode: "hover",
  hoverDelayMs: 1000,
  longPressMs: 600,
  width: 40,
  height: 55,
  widthPx: 640,
  heightPx: 480,
  sizeUnit: "percent",
  themeColor: "#4f6bf6",
  windowColor: "#8c959f",
  position: "bottom-right",
  sidebarSide: "right",
  blurStrength: 5,
  selectionSearch: true,
  searchEngine: "google",
  aiEngine: "kimi",
  openInBackground: false,
  minSelectionChars: 2,
  maxWindows: 3,
  speculationMode: "prefetch",
  powerSaver: "auto",
  reduceMotion: false,
  highlightLinks: false,
  highlightStyle: "dashed",
  autoPin: false,
  theme: "system",
  windowTheme: "silver",
  stripTracking: true,
  warnDangerous: true,
  skipImages: false,
  closeOnOutsideClick: true,
  closeOnMouseLeave: false,
  closeOnScroll: false,
  disabledSites: [],
};

export const settingsItem = storage.defineItem<PrelookSettings>("local:prelook_settings", {
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

export function clampSettings(s: PrelookSettings): PrelookSettings {
  const {
    blurPx: legacyBlurPx,
    searchEngines: legacySearchEngines,
    // The in-app language switch is gone (UI text now comes from
    // `browser.i18n`, which follows the browser language); strip the stale key
    // so a merged-in stored value cannot keep writing itself back.
    language: _legacyLanguage,
    ...rest
  } = s as PrelookSettings & {
    blurPx?: number;
    searchEngines?: string[];
    language?: string;
  };
  const windowTheme: WindowTheme = WINDOW_THEMES.some((w) => w.id === s.windowTheme)
    ? s.windowTheme
    : DEFAULT_SETTINGS.windowTheme;
  // A bogus unit would make every size clamp pick the wrong bounds.
  const sizeUnit: SizeUnit = s.sizeUnit === "px" ? "px" : "percent";
  // One-shot migration: `widthPx`/`heightPx` did not exist while the px unit
  // briefly stored its value in `width`/`height` — seed the px fields from it.
  const pxFieldsAbsent = s.widthPx === undefined && s.heightPx === undefined;
  const seedPx = sizeUnit === "px" && pxFieldsAbsent;
  return {
    ...rest,
    hoverDelayMs: Math.min(2000, Math.max(100, s.hoverDelayMs || DEFAULT_SETTINGS.hoverDelayMs)),
    longPressMs: Math.min(2000, Math.max(200, s.longPressMs || DEFAULT_SETTINGS.longPressMs)),
    width: clampWindowPercent(s.width, LEGACY_VP_W, DEFAULT_SETTINGS.width),
    height: clampWindowPercent(s.height, LEGACY_VP_H, DEFAULT_SETTINGS.height),
    widthPx: clampPxSize(
      seedPx ? s.width : (s.widthPx ?? DEFAULT_SETTINGS.widthPx),
      DEFAULT_SETTINGS.widthPx,
    ),
    heightPx: clampPxSize(
      seedPx ? s.height : (s.heightPx ?? DEFAULT_SETTINGS.heightPx),
      DEFAULT_SETTINGS.heightPx,
    ),
    sizeUnit,
    blurStrength: clampBlurStrength(rest.blurStrength, legacyBlurPx),
    minSelectionChars: Math.min(20, Math.max(1, s.minSelectionChars)),
    // An engine id can disappear between versions; falling back beats
    // rendering a toolbar with no AI button at all.
    aiEngine: AI_ENGINES.some((e) => e.id === s.aiEngine) ? s.aiEngine : DEFAULT_SETTINGS.aiEngine,
    // `searchEngine` used to be the multi-select `searchEngines` array; an
    // unlisted id (or a legacy array) falls back to its first valid entry.
    searchEngine: SEARCH_ENGINES.some((e) => e.id === s.searchEngine)
      ? s.searchEngine
      : (legacySearchEngines?.find((id) => SEARCH_ENGINES.some((e) => e.id === id)) ??
        DEFAULT_SETTINGS.searchEngine),
    theme: (["system", "light", "dark"] as const).includes(s.theme)
      ? s.theme
      : DEFAULT_SETTINGS.theme,
    // Unlike an engine id, a bogus power level cannot fall back to "do nothing":
    // every comparison against it would silently drop features.
    powerSaver: POWER_MODES.includes(s.powerSaver) ? s.powerSaver : DEFAULT_SETTINGS.powerSaver,
    // A removed trigger mode (e.g. the click variants) would leave every
    // comparison missing and the extension silently inert — fall back instead.
    triggerMode: TRIGGER_MODES.includes(s.triggerMode)
      ? s.triggerMode
      : DEFAULT_SETTINGS.triggerMode,
    // `link`/`mouse` positions were removed; stored legacy values land on the
    // default corner instead of an unselectable radio.
    position: (
      [
        "top-left",
        "bottom-right",
        "bottom-left",
        "top-right",
        "center-top",
        "center",
        "center-bottom",
        "sidebar",
      ] as const
    ).includes(s.position)
      ? s.position
      : DEFAULT_SETTINGS.position,
    highlightStyle: ["solid", "dashed"].includes(s.highlightStyle)
      ? s.highlightStyle
      : DEFAULT_SETTINGS.highlightStyle,
    windowTheme,
    // Two independent colours: the window theme only ever colours preview
    // windows (a preset's own accent, or `windowColor` for "custom"), while
    // `themeColor` belongs to Prelook's own UI and is edited in the panel's
    // appearance tab. Nothing writes one from the other.
    themeColor: s.themeColor || DEFAULT_SETTINGS.themeColor,
    windowColor: s.windowColor || DEFAULT_SETTINGS.windowColor,
    maxWindows: Math.min(MAX_WINDOWS_LIMIT, Math.max(1, s.maxWindows)),
  };
}
