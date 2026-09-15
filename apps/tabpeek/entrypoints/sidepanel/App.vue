<script lang="ts" setup>
import { translate } from "@/utils/i18n";
import {
  AI_ENGINES,
  DEFAULT_SETTINGS,
  MAX_WINDOWS_LIMIT,
  POWER_MODES,
  SEARCH_ENGINES,
  WINDOW_PCT_MAX,
  WINDOW_PCT_MIN,
  WINDOW_THEMES,
  clampSettings,
  settingsItem,
  type TabPeekSettings,
} from "@/utils/storage";
import { watchTheme } from "@/utils/theme";
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from "vue";

const SPONSORS = [
  { id: "afdian", url: "https://ifdian.net/a/coldstoneboy" },
  { id: "patreon", url: "https://patreon.com/coldstoneboy" },
] as const;

// Sections live in tabs so the panel never turns into one endless scroll.
const TABS = [
  "trigger",
  "preview",
  "search",
  "appearance",
  "performance",
  "protect",
  "about",
] as const;
type TabId = (typeof TABS)[number];
const activeTab = ref<TabId>("trigger");

const loaded = ref(false);
const settings = ref<TabPeekSettings>({ ...DEFAULT_SETTINGS });
const newSite = ref("");

const t = (key: string, params?: Record<string, string | number>) =>
  translate(settings.value.language, key, params);

// Delays are stored in milliseconds but edited in seconds: `toFixed(2)` keeps
// the readout free of float noise (0.30000000000000004).
function seconds(model: "hoverDelayMs" | "longPressMs") {
  return computed({
    get: () => Number((settings.value[model] / 1000).toFixed(2)),
    set: (v: number) => {
      settings.value[model] = Math.round(Number(v) * 1000);
    },
  });
}
const hoverDelaySec = seconds("hoverDelayMs");
const longPressSec = seconds("longPressMs");

const THEMES = [
  { id: "system" as const, icon: "monitor" },
  { id: "light" as const, icon: "sun" },
  { id: "dark" as const, icon: "moon" },
];

const accentStyle = computed(() => ({ "--tp-accent": settings.value.themeColor }));

// The panel is its own document: resolve the theme onto <html> and follow the OS
// while the setting says "system".
let themeDispose: (() => void) | null = null;
watch(
  () => settings.value.theme,
  () => {
    if (!loaded.value) return;
    themeDispose?.();
    themeDispose = watchTheme(
      () => settings.value.theme,
      (theme) => {
        document.documentElement.dataset.theme = theme;
      },
    );
  },
);
onUnmounted(() => themeDispose?.());
// Window theme cards: each one is a miniature of the preview window, tinted with
// the preset's accent (see WINDOW_THEMES in utils/storage).
const WINDOW_THEME_CARDS = WINDOW_THEMES;

function pickWindowTheme(preset: (typeof WINDOW_THEMES)[number]) {
  settings.value.windowTheme = preset.id;
  // The accent drives the whole UI, so keep it in step with the preset.
  settings.value.themeColor = preset.accent;
}

function onCustomColor(value: string) {
  settings.value.themeColor = value;
  settings.value.windowTheme = "custom";
}

async function load() {
  try {
    const stored = await settingsItem.getValue();
    settings.value = clampSettings({ ...DEFAULT_SETTINGS, ...stored });
    loaded.value = true;
    themeDispose?.();
    themeDispose = watchTheme(
      () => settings.value.theme,
      (theme) => {
        document.documentElement.dataset.theme = theme;
      },
    );
  } catch (err) {
    // Without this the UI silently shows defaults and never persists, which is
    // how a missing "storage" permission presents itself.
    console.error("[TabPeek] failed to load settings:", err);
  }
}
onMounted(load);

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  // `settings.value` is a reactive proxy; hand the storage API a plain object so
  // serialization never depends on proxy support in the browser's storage impl.
  if (loaded.value) void settingsItem.setValue(toRaw(settings.value));
}
// settings is a ref holding an object: v-model mutates nested props, so the
// watcher must be deep or it never fires and nothing gets persisted.
watch(
  settings,
  () => {
    if (!loaded.value) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 150);
  },
  { deep: true },
);
// Closing the panel kills pending timers; flush before it disappears.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSave();
});

function toggleEngine(id: string) {
  const list = new Set(settings.value.searchEngines);
  if (list.has(id)) list.delete(id);
  else list.add(id);
  settings.value.searchEngines = [...list];
}

// The panel cannot host target="_blank" reliably, so sponsor links go through
// the tabs API.
function openSponsor(url: string) {
  void browser.tabs.create({ url });
}

async function disableCurrentSite() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  try {
    const host = new URL(tab.url).hostname;
    if (host && !settings.value.disabledSites.includes(host)) {
      settings.value.disabledSites = [...settings.value.disabledSites, host];
    }
  } catch {
    /* non-http tab */
  }
}

function addSite() {
  const site = newSite.value
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "");
  if (site && !settings.value.disabledSites.includes(site)) {
    settings.value.disabledSites = [...settings.value.disabledSites, site];
  }
  newSite.value = "";
}

function removeSite(site: string) {
  settings.value.disabledSites = settings.value.disabledSites.filter((s) => s !== site);
}

function resetAll() {
  settings.value = { ...DEFAULT_SETTINGS };
}
</script>

<template>
  <header class="topbar" :style="accentStyle">
    <div class="hd">
      <img src="/icon/32.png" alt="" />
      <h1>TabPeek</h1>
      <div class="spacer" />
      <button
        class="link"
        @click="settings.language = settings.language === 'zh-CN' ? 'en' : 'zh-CN'"
      >
        {{ settings.language === "zh-CN" ? "EN" : "中" }}
      </button>
    </div>
    <div class="tabs" role="tablist">
      <button
        v-for="tab in TABS"
        :id="`tab-${tab}`"
        :key="tab"
        class="chip"
        :class="{ on: activeTab === tab }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab"
        :aria-controls="`panel-${tab}`"
        @click="activeTab = tab"
      >
        {{ t(`tab.${tab}`) }}
      </button>
    </div>
  </header>

  <main :style="accentStyle">
    <div v-if="activeTab === 'trigger'" id="panel-trigger" role="tabpanel" aria-labelledby="tab-trigger">
      <section>
        <label class="row switch-row">
          <span>{{ t("panel.enabled") }}</span>
          <input v-model="settings.enabled" type="checkbox" />
        </label>
      </section>

      <section>
        <h2>{{ t("panel.section.trigger") }}</h2>
        <div class="seg-btns">
          <label
            v-for="m in ['hover', 'altHover', 'click', 'altClick', 'longPress', 'drag'] as const"
            :key="m"
            :class="{ on: settings.triggerMode === m }"
          >
            <input v-model="settings.triggerMode" type="radio" name="triggerMode" :value="m" />
            {{ t(`trigger.${m}`) }}
          </label>
        </div>
        <label class="row">
          <span
            >{{ t("trigger.delay") }}<b>{{ hoverDelaySec }}s</b></span
          >
          <input
            v-model.number="hoverDelaySec"
            type="range"
            min="0.1"
            max="2"
            step="0.05"
            :disabled="['click', 'altClick', 'longPress', 'drag'].includes(settings.triggerMode)"
          />
        </label>
        <label v-if="settings.triggerMode === 'longPress'" class="row">
          <span
            >{{ t("trigger.longPressDelay") }}<b>{{ longPressSec }}s</b></span
          >
          <input v-model.number="longPressSec" type="range" min="0.2" max="2" step="0.05" />
        </label>
        <label class="row switch-row">
          <span>{{ t("trigger.highlight") }}</span>
          <input v-model="settings.highlightLinks" type="checkbox" />
        </label>
      </section>

      <section>
        <h2>{{ t("panel.section.close") }}</h2>
        <label class="row switch-row">
          <span>{{ t("close.outside") }}</span>
          <input v-model="settings.closeOnOutsideClick" type="checkbox" />
        </label>
        <label class="row switch-row">
          <span>{{ t("close.leave") }}</span>
          <input v-model="settings.closeOnMouseLeave" type="checkbox" />
        </label>
        <label class="row switch-row">
          <span>{{ t("close.scroll") }}</span>
          <input v-model="settings.closeOnScroll" type="checkbox" />
        </label>
        <p class="hint muted">{{ t("close.hint") }}</p>
      </section>
    </div>

    <div
      v-else-if="activeTab === 'preview'"
      id="panel-preview"
      role="tabpanel"
      aria-labelledby="tab-preview"
    >
      <section>
        <h2>{{ t("panel.section.position") }}</h2>
        <div class="grid3">
          <label
            v-for="p in [
              'link',
              'mouse',
              'bottom-right',
              'bottom-left',
              'top-right',
              'center',
              'sidebar',
            ] as const"
            :key="p"
          >
            <input v-model="settings.position" type="radio" name="position" :value="p" />
            {{ t(`position.${p}`) }}
          </label>
        </div>
        <div v-if="settings.position === 'sidebar'" class="seg sub">
          <label v-for="side in ['left', 'right'] as const" :key="side">
            <input v-model="settings.sidebarSide" type="radio" name="sidebarSide" :value="side" />
            {{ t(`sidebarSide.${side}`) }}
          </label>
        </div>
      </section>

      <section>
        <h2>{{ t("panel.section.size") }}</h2>
        <label class="row">
          <span
            >{{ t("size.width") }}<b>{{ settings.width }}%</b></span
          >
          <input
            v-model.number="settings.width"
            type="range"
            :min="WINDOW_PCT_MIN"
            :max="WINDOW_PCT_MAX"
            step="1"
          />
        </label>
        <label class="row">
          <span
            >{{ t("size.height") }}<b>{{ settings.height }}%</b></span
          >
          <input
            v-model.number="settings.height"
            type="range"
            :min="WINDOW_PCT_MIN"
            :max="WINDOW_PCT_MAX"
            step="1"
            :disabled="settings.position === 'sidebar'"
          />
        </label>
      </section>

      <section>
        <h2>{{ t("panel.section.blur") }}</h2>
        <label class="row">
          <span
            >{{ t("blur.strength") }}<b>{{ settings.blurStrength }}%</b></span
          >
          <input v-model.number="settings.blurStrength" type="range" min="0" max="100" step="5" />
        </label>
        <p class="hint muted">{{ t("blur.hint") }}</p>
      </section>

      <section>
        <h2>{{ t("panel.section.theme") }}</h2>
        <p class="hint">{{ t("windowTheme.hint") }}</p>
        <div class="win-themes">
          <label
            v-for="p in WINDOW_THEME_CARDS"
            :key="p.id"
            :class="{ on: settings.windowTheme === p.id, dark: p.kind === 'dark' }"
            :style="{ '--card-accent': p.accent }"
            :title="t(`windowTheme.${p.id}`)"
          >
            <input
              v-if="p.id !== 'custom'"
              v-model="settings.windowTheme"
              type="radio"
              name="windowTheme"
              :value="p.id"
              @change="pickWindowTheme(p)"
            />
            <input
              v-else
              type="color"
              class="win-themes-picker"
              :value="settings.themeColor"
              @input="onCustomColor(($event.target as HTMLInputElement).value)"
            />
            <span class="mini">
              <i class="mini-head"></i>
              <i class="mini-line"></i>
              <i class="mini-line short"></i>
            </span>
            <svg
              v-if="p.id === 'custom'"
              class="mini-pen"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
            </svg>
          </label>
        </div>
      </section>

      <section>
        <h2>{{ t("panel.section.windows") }}</h2>
        <label class="row">
          <span
            >{{ t("windows.max") }}<b>{{ settings.maxWindows }}</b></span
          >
          <input
            v-model.number="settings.maxWindows"
            type="range"
            min="1"
            :max="MAX_WINDOWS_LIMIT"
            step="1"
          />
        </label>
        <label class="row switch-row">
          <span>{{ t("windows.autoPin") }}</span>
          <input v-model="settings.autoPin" type="checkbox" />
        </label>
        <p class="hint muted">{{ t("windows.hint") }}</p>
        <p class="hint muted">{{ t("windows.autoPinHint") }}</p>
      </section>
    </div>

    <div v-else-if="activeTab === 'search'" id="panel-search" role="tabpanel" aria-labelledby="tab-search">
      <section>
        <h2>{{ t("panel.section.selection") }}</h2>
        <label class="row switch-row">
          <span>{{ t("selection.enable") }}</span>
          <input v-model="settings.selectionSearch" type="checkbox" />
        </label>
        <div class="row-label">{{ t("selection.engines") }}</div>
        <div class="chips">
          <button
            v-for="e in SEARCH_ENGINES"
            :key="e.id"
            class="chip"
            :class="{ on: settings.searchEngines.includes(e.id) }"
            @click="toggleEngine(e.id)"
          >
            {{ e.label }}
          </button>
        </div>
        <label class="row">
          <span>{{ t("selection.aiEngine") }}</span>
          <select v-model="settings.aiEngine">
            <option v-for="e in AI_ENGINES" :key="e.id" :value="e.id">{{ e.label }}</option>
          </select>
        </label>
        <label class="row switch-row">
          <span>{{ t("selection.background") }}</span>
          <input v-model="settings.openInBackground" type="checkbox" />
        </label>
        <label class="row">
          <span
            >{{ t("selection.minLength") }}<b>{{ settings.minSelectionChars }}</b></span
          >
          <input v-model.number="settings.minSelectionChars" type="range" min="1" max="20" step="1" />
        </label>
      </section>
    </div>

    <div
      v-else-if="activeTab === 'appearance'"
      id="panel-appearance"
      role="tabpanel"
      aria-labelledby="tab-appearance"
    >
      <section>
        <h2>{{ t("panel.section.appearance") }}</h2>
        <p class="hint">{{ t("appearance.hint") }}</p>
        <div class="theme-cards">
          <label
            v-for="tm in THEMES"
            :key="tm.id"
            :class="{ on: settings.theme === tm.id }"
            :title="t(`theme.${tm.id}`)"
          >
            <input v-model="settings.theme" type="radio" name="theme" :value="tm.id" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <template v-if="tm.icon === 'monitor'">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M8 20h8M12 16v4" />
              </template>
              <template v-else-if="tm.icon === 'sun'">
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"
                />
              </template>
              <template v-else>
                <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
              </template>
            </svg>
            <span>{{ t(`theme.${tm.id}`) }}</span>
          </label>
        </div>
      </section>

      <section>
        <h2>{{ t("panel.section.language") }}</h2>
        <div class="seg">
          <label v-for="l in ['zh-CN', 'en'] as const" :key="l">
            <input v-model="settings.language" type="radio" name="language" :value="l" />
            {{ l === "zh-CN" ? "简体中文" : "English" }}
          </label>
        </div>
      </section>
    </div>

    <div
      v-else-if="activeTab === 'performance'"
      id="panel-performance"
      role="tabpanel"
      aria-labelledby="tab-performance"
    >
      <section>
        <h2>{{ t("panel.section.speculation") }}</h2>
        <div class="seg">
          <label v-for="m in ['off', 'prefetch', 'prerender'] as const" :key="m">
            <input
              v-model="settings.speculationMode"
              type="radio"
              name="speculationMode"
              :value="m"
            />
            {{ t(`speculation.${m}`) }}
          </label>
        </div>
        <p class="hint muted">{{ t("speculation.hint") }}</p>
      </section>

      <section>
        <h2>{{ t("panel.section.power") }}</h2>
        <label class="row">
          <span>{{ t("power.label") }}</span>
          <select v-model="settings.powerSaver">
            <option v-for="m in POWER_MODES" :key="m" :value="m">{{ t(`power.${m}`) }}</option>
          </select>
        </label>
        <p class="hint muted">{{ t("power.hint") }}</p>
        <label class="row switch-row">
          <span>{{ t("motion.label") }}</span>
          <input v-model="settings.reduceMotion" type="checkbox" />
        </label>
        <p class="hint muted">{{ t("motion.hint") }}</p>
      </section>
    </div>

    <div
      v-else-if="activeTab === 'protect'"
      id="panel-protect"
      role="tabpanel"
      aria-labelledby="tab-protect"
    >
      <section>
        <h2>{{ t("panel.section.protect") }}</h2>
        <label class="row switch-row">
          <span>{{ t("protect.tracking") }}</span>
          <input v-model="settings.stripTracking" type="checkbox" />
        </label>
        <p class="hint muted">{{ t("protect.trackingHint") }}</p>
        <label class="row switch-row">
          <span>{{ t("protect.warn") }}</span>
          <input v-model="settings.warnDangerous" type="checkbox" />
        </label>
        <p class="hint muted">{{ t("protect.warnHint") }}</p>
      </section>

      <section>
        <h2>{{ t("panel.section.sites") }}</h2>
        <div class="sites">
          <span v-for="s in settings.disabledSites" :key="s" class="site">
            {{ s }}<button @click="removeSite(s)">✕</button>
          </span>
          <span v-if="settings.disabledSites.length === 0" class="hint muted">{{
            t("sites.empty")
          }}</span>
        </div>
        <div class="row-inline">
          <input
            v-model="newSite"
            type="text"
            :placeholder="t('sites.addPlaceholder')"
            @keydown.enter="addSite"
          />
          <button @click="addSite">{{ t("sites.add") }}</button>
          <button @click="disableCurrentSite">{{ t("sites.current") }}</button>
        </div>
      </section>
    </div>

    <div v-else id="panel-about" role="tabpanel" aria-labelledby="tab-about">
      <section class="sponsor-section">
        <h2>{{ t("panel.section.sponsor") }}</h2>
        <p class="hint">{{ t("sponsor.hint") }}</p>
        <div class="sponsor">
          <button v-for="s in SPONSORS" :key="s.id" type="button" @click="openSponsor(s.url)">
            {{ t(`sponsor.${s.id}`) }}
          </button>
        </div>
      </section>

      <footer>
        <button class="link" @click="resetAll">{{ t("panel.reset") }}</button>
      </footer>
    </div>
  </main>
</template>