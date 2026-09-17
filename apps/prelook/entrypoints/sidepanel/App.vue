<script lang="ts" setup>
import ColorInput from "@/components/ColorInput.vue";
import DropdownSelect from "@/components/DropdownSelect.vue";
import RadioGroup from "@/components/RadioGroup.vue";
import SliderInput from "@/components/SliderInput.vue";
import SponsorSection from "@/components/SponsorSection.vue";
import ToggleSwitch from "@/components/ToggleSwitch.vue";
import { translate } from "@/utils/i18n";
import {
  AI_ENGINES,
  DEFAULT_SETTINGS,
  MAX_WINDOWS_LIMIT,
  POWER_MODES,
  SEARCH_ENGINES,
  WINDOW_PCT_MAX,
  WINDOW_PCT_MIN,
  WINDOW_PX_MAX,
  WINDOW_PX_MIN,
  WINDOW_THEMES,
  clampSettings,
  settingsItem,
  type PrelookSettings,
  type SizeUnit,
} from "@/utils/storage";
import { watchTheme } from "@/utils/theme";
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from "vue";

// Sections live in tabs so the panel never turns into one endless scroll.
const TABS = ["preview", "performance", "protect", "settings"] as const;
type TabId = (typeof TABS)[number];
const activeTab = ref<TabId>("preview");

const loaded = ref(false);
const settings = ref<PrelookSettings>({ ...DEFAULT_SETTINGS });
const newSite = ref("");

// Labels come straight from `browser.i18n`: the panel's language is the
// browser's UI language and cannot change while it is open.
const t = (key: string, params?: Record<string, string | number>) => translate(key, params);

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

// RadioGroup options: computed so labels stay in sync with `t()` like the rest
// of the panel; engine labels come from the engine tables verbatim.
const triggerOptions = computed(() =>
  (["hover", "longPress", "drag", "altHover"] as const).map((m) => ({
    value: m,
    label: t(`trigger.${m}`),
  })),
);
const positionOptions = computed(() =>
  (
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
  ).map((p) => ({ value: p, label: t(`position.${p}`) })),
);
const sideOptions = computed(() =>
  (["left", "right"] as const).map((s) => ({ value: s, label: t(`sidebarSide.${s}`) })),
);
const searchOptions = SEARCH_ENGINES.map((e) => ({ value: e.id, label: e.label }));
const aiOptions = AI_ENGINES.map((e) => ({ value: e.id, label: e.label }));
const powerOptions = computed(() => POWER_MODES.map((m) => ({ value: m, label: t(`power.${m}`) })));
const highlightStyleOptions = computed(() =>
  (["solid", "dashed"] as const).map((s) => ({ value: s, label: t(`highlightStyle.${s}`) })),
);

// Window size remembers separate percent and px values: the sliders bind to
// whichever pair the unit selector points at, so switching unit never
// overwrites the other unit's values.
const sizeUnitOptions = computed(() =>
  (["percent", "px"] as const).map((u) => ({ value: u, label: t(`size.unit.${u}`) })),
);
// Two independent bound groups: each unit branch reads its own, so the
// slider ranges never need to be recomputed on unit switch.
const sizeBoundsPx = { min: WINDOW_PX_MIN, max: WINDOW_PX_MAX, unit: "px" as const };
const sizeBoundsPercent = { min: WINDOW_PCT_MIN, max: WINDOW_PCT_MAX, unit: "%" as const };

const widthValue = computed({
  get: () => (settings.value.sizeUnit === "px" ? settings.value.widthPx : settings.value.width),
  set: (v: number) => {
    if (settings.value.sizeUnit === "px") settings.value.widthPx = v;
    else settings.value.width = v;
  },
});

const heightValue = computed({
  get: () => (settings.value.sizeUnit === "px" ? settings.value.heightPx : settings.value.height),
  set: (v: number) => {
    if (settings.value.sizeUnit === "px") settings.value.heightPx = v;
    else settings.value.height = v;
  },
});

function setSizeUnit(unit: SizeUnit) {
  settings.value.sizeUnit = unit;
}

const speculationOptions = computed(() =>
  (["off", "prefetch", "prerender"] as const).map((m) => ({
    value: m,
    label: t(`speculation.${m}`),
  })),
);

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
// the preset's accent (see WINDOW_THEMES in utils/storage). The "custom" card
// shows the separately stored `windowColor`, since a preset no longer writes
// into the plugin's own accent (`themeColor`).
const WINDOW_THEME_CARDS = WINDOW_THEMES;

function onCustomColor(value: string) {
  settings.value.windowColor = value;
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
    console.error("[Prelook] failed to load settings:", err);
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
        {{ t(`panel.tab.${tab}`) }}
      </button>
    </div>
  </header>

  <main :style="accentStyle">
    <div class="flex-1 tabs-content">
      <!-- 预览设置 -->
      <div
        v-if="activeTab === 'preview'"
        id="panel-preview"
        role="tabpanel"
        aria-labelledby="tab-preview"
      >
        <!-- 是否开启预览功能 -->
        <section>
          <label class="row switch-row">
            <span>{{ t("panel.enabled") }}</span>
            <ToggleSwitch v-model="settings.enabled" />
          </label>
        </section>

        <!-- 触发模式 -->
        <section>
          <h2>{{ t("panel.section.trigger") }}</h2>
          <RadioGroup v-model="settings.triggerMode" name="triggerMode" :options="triggerOptions" />
          <label class="row sz" v-if="settings.triggerMode === 'hover'">
            <span
              >{{ t("trigger.delay") }}<b>{{ hoverDelaySec }}s</b></span
            >
            <SliderInput
              v-model="hoverDelaySec"
              :min="0.1"
              :max="2"
              :step="0.1"
              unit="s"
              :decimals="1"
              :disabled="['longPress', 'drag'].includes(settings.triggerMode)"
            />
          </label>
          <label v-if="settings.triggerMode === 'longPress'" class="row sz">
            <span
              >{{ t("trigger.longPressDelay") }}<b>{{ longPressSec }}s</b></span
            >
            <SliderInput
              v-model="longPressSec"
              :min="0.2"
              :max="2"
              :step="0.1"
              unit="s"
              :decimals="1"
            />
          </label>
        </section>

        <!-- 预览窗位置 -->
        <section>
          <h2>{{ t("panel.section.position") }}</h2>
          <RadioGroup
            v-model="settings.position"
            name="position"
            :options="positionOptions"
            :dividers="false"
          />
          <div v-if="settings.position === 'sidebar'" class="seg">
            <RadioGroup v-model="settings.sidebarSide" name="sidebarSide" :options="sideOptions" />
          </div>
        </section>

        <!-- 预览窗大小 -->
        <section>
          <h2>{{ t("panel.section.size") }}</h2>
          <label class="row sz">
            <span>{{ t("size.unit") }}</span>
            <RadioGroup
              :model-value="settings.sizeUnit"
              name="sizeUnit"
              :options="sizeUnitOptions"
              @update:model-value="setSizeUnit($event as SizeUnit)"
            />
          </label>
          <template v-if="settings.sizeUnit === 'px'">
            <label class="row sz">
              <span
                >{{ t("size.width") }}<b>{{ widthValue }}{{ sizeBoundsPx.unit }}</b></span
              >
              <SliderInput
                v-model="widthValue"
                :min="sizeBoundsPx.min"
                :max="sizeBoundsPx.max"
                :unit="sizeBoundsPx.unit"
              />
            </label>
            <label class="row sz">
              <span
                >{{ t("size.height") }}<b>{{ heightValue }}{{ sizeBoundsPx.unit }}</b></span
              >
              <SliderInput
                v-model="heightValue"
                :min="sizeBoundsPx.min"
                :max="sizeBoundsPx.max"
                :unit="sizeBoundsPx.unit"
                :disabled="settings.position === 'sidebar'"
              />
            </label>
          </template>
          <template v-else>
            <label class="row sz">
              <span
                >{{ t("size.width") }}<b>{{ widthValue }}{{ sizeBoundsPercent.unit }}</b></span
              >
              <SliderInput
                v-model="widthValue"
                :min="sizeBoundsPercent.min"
                :max="sizeBoundsPercent.max"
                :unit="sizeBoundsPercent.unit"
              />
            </label>
            <label class="row sz">
              <span
                >{{ t("size.height") }}<b>{{ heightValue }}{{ sizeBoundsPercent.unit }}</b></span
              >
              <SliderInput
                v-model="heightValue"
                :min="sizeBoundsPercent.min"
                :max="sizeBoundsPercent.max"
                :unit="sizeBoundsPercent.unit"
                :disabled="settings.position === 'sidebar'"
              />
            </label>
          </template>
        </section>

        <!-- 预览窗主题 -->
        <section>
          <h2>{{ t("panel.section.theme") }}</h2>
          <p class="hint">{{ t("windowTheme.hint") }}</p>
          <div class="win-themes">
            <label
              v-for="p in WINDOW_THEME_CARDS"
              :key="p.id"
              :class="{ on: settings.windowTheme === p.id, dark: p.kind === 'dark' }"
              :style="{ '--card-accent': p.id === 'custom' ? settings.windowColor : p.accent }"
              :title="t(`windowTheme.${p.id}`)"
            >
              <input
                v-if="p.id !== 'custom'"
                v-model="settings.windowTheme"
                type="radio"
                name="windowTheme"
                :value="p.id"
              />
              <input
                v-else
                type="color"
                class="win-themes-picker"
                :value="settings.windowColor"
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

        <!-- 预览窗数量 -->
        <section>
          <h2>{{ t("panel.section.windows") }}</h2>
          <label class="row sz">
            <span
              >{{ t("windows.max") }} <b>{{ settings.maxWindows }}</b></span
            >
            <SliderInput v-model="settings.maxWindows" :min="1" :max="MAX_WINDOWS_LIMIT" />
          </label>
          <label class="row switch-row">
            <span>{{ t("windows.autoPin") }}</span>
            <ToggleSwitch v-model="settings.autoPin" />
          </label>
        </section>

        <!-- 关闭模式 -->
        <section>
          <h2>{{ t("panel.section.close") }}</h2>
          <label class="row switch-row">
            <span>{{ t("close.outside") }}</span>
            <ToggleSwitch v-model="settings.closeOnOutsideClick" />
          </label>
          <label class="row switch-row">
            <span>{{ t("close.leave") }}</span>
            <ToggleSwitch v-model="settings.closeOnMouseLeave" />
          </label>
          <label class="row switch-row">
            <span>{{ t("close.scroll") }}</span>
            <ToggleSwitch v-model="settings.closeOnScroll" />
          </label>
          <p class="hint muted">{{ t("close.hint") }}</p>
        </section>

        <!-- 其他设置 -->
        <section>
          <h2>{{ t("panel.section.others") }}</h2>
          <label class="row switch-row">
            <span>{{ t("trigger.highlight") }}</span>
            <ToggleSwitch v-model="settings.highlightLinks" />
          </label>
          <label v-if="settings.highlightLinks" class="row sz">
            <span>{{ t("highlightStyle.label") }}</span>
            <RadioGroup
              v-model="settings.highlightStyle"
              name="highlightStyle"
              :options="highlightStyleOptions"
            />
          </label>
          <label class="row switch-row">
            <span>{{ t("images.skip") }}</span>
            <ToggleSwitch v-model="settings.skipImages" />
          </label>

          <label class="row sz">
            <span
              >{{ t("blur.strength") }}<b>{{ settings.blurStrength }}%</b></span
            >
            <SliderInput v-model="settings.blurStrength" :min="0" :max="100" unit="%" />
          </label>
          <p class="hint muted">{{ t("blur.hint") }}</p>
        </section>
      </div>

      <!-- 性能设置 -->
      <div
        v-else-if="activeTab === 'performance'"
        id="panel-performance"
        role="tabpanel"
        aria-labelledby="tab-performance"
      >
        <section>
          <h2>{{ t("panel.section.speculation") }}</h2>
          <RadioGroup
            v-model="settings.speculationMode"
            name="speculationMode"
            :options="speculationOptions"
          />
          <p class="hint muted">{{ t("speculation.hint") }}</p>
        </section>

        <section>
          <h2>{{ t("panel.section.power") }}</h2>
          <label class="row">
            <span>{{ t("power.label") }}</span>
            <DropdownSelect
              v-model="settings.powerSaver"
              name="powerSaver"
              :options="powerOptions"
            />
          </label>
          <p class="hint muted">{{ t("power.hint") }}</p>
          <label class="row switch-row">
            <span>{{ t("motion.label") }}</span>
            <ToggleSwitch v-model="settings.reduceMotion" />
          </label>
          <p class="hint muted">{{ t("motion.hint") }}</p>
        </section>
      </div>

      <!-- 保护设置 -->
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
            <ToggleSwitch v-model="settings.stripTracking" />
          </label>
          <p class="hint muted">{{ t("protect.trackingHint") }}</p>
          <label class="row switch-row">
            <span>{{ t("protect.warn") }}</span>
            <ToggleSwitch v-model="settings.warnDangerous" />
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

      <!-- 插件设置 -->
      <div
        v-else-if="activeTab === 'settings'"
        id="panel-settings"
        role="tabpanel"
        aria-labelledby="tab-settings"
      >
        <section>
          <h2>{{ t("panel.section.selection") }}</h2>
          <label class="row switch-row">
            <span>{{ t("selection.enable") }}</span>
            <ToggleSwitch v-model="settings.selectionSearch" />
          </label>
          <div class="row-label">{{ t("selection.engines") }}</div>
          <RadioGroup
            v-model="settings.searchEngine"
            name="searchEngine"
            :options="searchOptions"
          />
          <div class="row-label">{{ t("selection.aiEngine") }}</div>
          <RadioGroup v-model="settings.aiEngine" name="aiEngine" :options="aiOptions" />
          <label class="row switch-row">
            <span>{{ t("selection.background") }}</span>
            <ToggleSwitch v-model="settings.openInBackground" />
          </label>
          <label class="row sz">
            <span
              >{{ t("selection.minLength") }}<b>{{ settings.minSelectionChars }}</b></span
            >
            <SliderInput v-model="settings.minSelectionChars" :min="1" :max="10" />
          </label>
        </section>

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
          <label class="row">
            <span>{{ t("appearance.accent") }}</span>
            <ColorInput v-model="settings.themeColor" />
          </label>
        </section>

        <button class="btn-reset" @click="resetAll">{{ t("panel.reset") }}</button>
      </div>
    </div>
    <!-- Last block in the panel, on every tab: one instance rather than a copy
         per panel (the panels are exclusive), sunk to the bottom edge by its own
         `margin-top: auto` (in the component's scoped styles) so a short tab has
         no empty gap. -->
    <SponsorSection />
  </main>
</template>
