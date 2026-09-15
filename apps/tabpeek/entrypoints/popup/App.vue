<script lang="ts" setup>
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import {
  AI_ENGINES,
  DEFAULT_SETTINGS,
  MAX_WINDOWS_LIMIT,
  SEARCH_ENGINES,
  clampSettings,
  settingsItem,
  type TabPeekSettings,
} from '@/utils/storage';
import { translate } from '@/utils/i18n';

const SPONSORS = [
  { id: 'afdian', url: 'https://ifdian.net/a/coldstoneboy' },
  { id: 'patreon', url: 'https://patreon.com/coldstoneboy' },
] as const;

const loaded = ref(false);
const settings = ref<TabPeekSettings>({ ...DEFAULT_SETTINGS });
const newSite = ref('');

const t = (key: string, params?: Record<string, string | number>) =>
  translate(settings.value.language, key, params);

const accentStyle = computed(() => ({ '--tp-accent': settings.value.themeColor }));
const presetColors = ['#4f6bf6', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

async function load() {
  try {
    const stored = await settingsItem.getValue();
    settings.value = clampSettings({ ...DEFAULT_SETTINGS, ...stored });
    loaded.value = true;
  } catch (err) {
    // Without this the UI silently shows defaults and never persists, which is
    // how a missing "storage" permission presents itself.
    console.error('[TabPeek] failed to load settings:', err);
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
// Closing the popup kills pending timers; flush before it disappears.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushSave();
});

function toggleEngine(id: string) {
  const list = new Set(settings.value.searchEngines);
  if (list.has(id)) list.delete(id);
  else list.add(id);
  settings.value.searchEngines = [...list];
}

// The popup cannot host target="_blank" reliably, so sponsor links go through
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
  const site = newSite.value.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (site && !settings.value.disabledSites.includes(site)) {
    settings.value.disabledSites = [...settings.value.disabledSites, site];
  }
  newSite.value = '';
}

function removeSite(site: string) {
  settings.value.disabledSites = settings.value.disabledSites.filter((s) => s !== site);
}

function resetAll() {
  settings.value = { ...DEFAULT_SETTINGS };
}
</script>

<template>
  <header class="hd" :style="accentStyle">
    <img src="/icon/32.png" alt="" />
    <h1>TabPeek</h1>
    <div class="spacer" />
    <button class="link" @click="settings.language = settings.language === 'zh-CN' ? 'en' : 'zh-CN'">
      {{ settings.language === 'zh-CN' ? 'EN' : '中' }}
    </button>
  </header>

  <main :style="accentStyle">
    <label class="row switch-row">
      <span>{{ t('popup.enabled') }}</span>
      <input v-model="settings.enabled" type="checkbox" />
    </label>

    <section>
      <h2>{{ t('popup.section.trigger') }}</h2>
      <div class="seg-btns">
        <label
          v-for="m in (['hover', 'altHover', 'click', 'longPress'] as const)"
          :key="m"
          :class="{ on: settings.triggerMode === m }"
        >
          <input v-model="settings.triggerMode" type="radio" name="triggerMode" :value="m" />
          {{ t(`trigger.${m}`) }}
        </label>
      </div>
      <label class="row">
        <span>{{ t('trigger.delay') }}<b>{{ settings.hoverDelayMs }}ms</b></span>
        <input
          v-model.number="settings.hoverDelayMs"
          type="range"
          min="100"
          max="2000"
          step="50"
          :disabled="settings.triggerMode === 'click' || settings.triggerMode === 'longPress'"
        />
      </label>
      <label v-if="settings.triggerMode === 'longPress'" class="row">
        <span>{{ t('trigger.longPressDelay') }}<b>{{ settings.longPressMs }}ms</b></span>
        <input v-model.number="settings.longPressMs" type="range" min="200" max="2000" step="50" />
      </label>
    </section>

    <section>
      <h2>{{ t('popup.section.size') }}</h2>
      <label class="row">
        <span>{{ t('size.width') }}<b>{{ settings.width }}px</b></span>
        <input v-model.number="settings.width" type="range" min="320" max="1200" step="20" />
      </label>
      <label class="row">
        <span>{{ t('size.height') }}<b>{{ settings.height }}px</b></span>
        <input
          v-model.number="settings.height"
          type="range"
          min="240"
          max="900"
          step="20"
          :disabled="settings.position === 'sidebar'"
        />
      </label>
    </section>

    <section>
      <h2>{{ t('popup.section.theme') }}</h2>
      <div class="swatches">
        <button
          v-for="c in presetColors"
          :key="c"
          class="swatch"
          :class="{ active: settings.themeColor === c }"
          :style="{ background: c }"
          @click="settings.themeColor = c"
        />
        <input v-model="settings.themeColor" type="color" class="picker" />
      </div>
    </section>

    <section>
      <h2>{{ t('popup.section.position') }}</h2>
      <div class="grid3">
        <label v-for="p in (['link', 'mouse', 'bottom-right', 'bottom-left', 'top-right', 'center', 'sidebar'] as const)" :key="p">
          <input v-model="settings.position" type="radio" name="position" :value="p" />
          {{ t(`position.${p}`) }}
        </label>
      </div>
      <div v-if="settings.position === 'sidebar'" class="seg sub">
        <label v-for="side in (['left', 'right'] as const)" :key="side">
          <input v-model="settings.sidebarSide" type="radio" name="sidebarSide" :value="side" />
          {{ t(`sidebarSide.${side}`) }}
        </label>
      </div>
    </section>

    <section>
      <h2>{{ t('popup.section.blur') }}</h2>
      <label class="row">
        <span>{{ t('blur.strength') }}<b>{{ settings.blurPx }}px</b></span>
        <input v-model.number="settings.blurPx" type="range" min="0" max="20" step="1" />
      </label>
    </section>

    <section>
      <h2>{{ t('popup.section.speculation') }}</h2>
      <div class="seg">
        <label v-for="m in (['off', 'prefetch', 'prerender'] as const)" :key="m">
          <input v-model="settings.speculationMode" type="radio" name="speculationMode" :value="m" />
          {{ t(`speculation.${m}`) }}
        </label>
      </div>
      <p class="hint muted">{{ t('speculation.hint') }}</p>
    </section>

    <section>
      <h2>{{ t('popup.section.selection') }}</h2>
      <label class="row switch-row">
        <span>{{ t('selection.enable') }}</span>
        <input v-model="settings.selectionSearch" type="checkbox" />
      </label>
      <div class="row-label">{{ t('selection.engines') }}</div>
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
        <span>{{ t('selection.aiEngine') }}</span>
        <select v-model="settings.aiEngine">
          <option v-for="e in AI_ENGINES" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
      </label>
      <label class="row switch-row">
        <span>{{ t('selection.background') }}</span>
        <input v-model="settings.openInBackground" type="checkbox" />
      </label>
      <label class="row">
        <span>{{ t('selection.minLength') }}<b>{{ settings.minSelectionChars }}</b></span>
        <input v-model.number="settings.minSelectionChars" type="range" min="1" max="20" step="1" />
      </label>
    </section>

    <section>
      <h2>{{ t('popup.section.language') }}</h2>
      <div class="seg">
        <label v-for="l in (['zh-CN', 'en'] as const)" :key="l">
          <input v-model="settings.language" type="radio" name="language" :value="l" />
          {{ l === 'zh-CN' ? '简体中文' : 'English' }}
        </label>
      </div>
    </section>

    <section>
      <h2>{{ t('popup.section.windows') }}</h2>
      <label class="row">
        <span>{{ t('windows.max') }}<b>{{ settings.maxWindows }}</b></span>
        <input v-model.number="settings.maxWindows" type="range" min="1" :max="MAX_WINDOWS_LIMIT" step="1" />
      </label>
      <p class="hint muted">{{ t('windows.hint') }}</p>
    </section>

    <section>
      <h2>{{ t('popup.section.sites') }}</h2>
      <div class="sites">
        <span v-for="s in settings.disabledSites" :key="s" class="site">
          {{ s }}<button @click="removeSite(s)">✕</button>
        </span>
        <span v-if="settings.disabledSites.length === 0" class="hint muted">{{ t('sites.empty') }}</span>
      </div>
      <div class="row-inline">
        <input v-model="newSite" type="text" :placeholder="t('sites.addPlaceholder')" @keydown.enter="addSite" />
        <button @click="addSite">{{ t('sites.add') }}</button>
        <button @click="disableCurrentSite">{{ t('sites.current') }}</button>
      </div>
    </section>

    <section class="sponsor-section">
      <h2>{{ t('popup.section.sponsor') }}</h2>
      <p class="hint">{{ t('sponsor.hint') }}</p>
      <div class="sponsor">
        <button v-for="s in SPONSORS" :key="s.id" type="button" @click="openSponsor(s.url)">
          {{ t(`sponsor.${s.id}`) }}
        </button>
      </div>
    </section>

    <footer>
      <button class="link" @click="resetAll">{{ t('popup.reset') }}</button>
    </footer>
  </main>
</template>

<style scoped>
.hd {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8ebef;
}
.hd img { width: 22px; height: 22px; }
.hd h1 { font-size: 16px; }
.spacer { flex: 1; }

main { padding: 0 12px; }
section {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-top: 10px;
  border: 1px solid #eceff2;
}
h2 {
  font-size: 12.5px;
  color: var(--tp-accent);
  margin-bottom: 8px;
}
.row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 7px 0; }
.row span { display: flex; gap: 6px; align-items: baseline; }
.row b { color: #57606a; font-weight: 500; font-size: 12px; }
.row input[type='range'] { width: 55%; accent-color: var(--tp-accent); }
.row input[type='color'] { width: 36px; height: 26px; border: 0; background: none; }
.row select { max-width: 55%; padding: 4px 6px; border-radius: 7px; border: 1px solid #d8dee4; }
.switch-row { cursor: pointer; }
.switch-row input { accent-color: var(--tp-accent); width: 16px; height: 16px; }

/* Single-choice control: a real radio group (name + hidden input) styled as a
   row of buttons, so keyboard arrows and screen readers still work. */
.seg-btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 6px 0; }
.seg-btns label {
  position: relative; display: flex; align-items: center; justify-content: center;
  padding: 6px 4px; border-radius: 8px; cursor: pointer; text-align: center;
  border: 1px solid #d8dee4; background: #fff; color: #57606a; font-size: 11px; line-height: 1.25;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.seg-btns label:hover { border-color: var(--tp-accent); color: var(--tp-accent); }
.seg-btns label.on { background: var(--tp-accent); border-color: var(--tp-accent); color: #fff; }
/* Invisible radio stretched over the whole button: the input itself receives the
   click, so selection never depends on label->control click forwarding. */
.seg-btns input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.seg-btns label:has(input:focus-visible) {
  outline: 2px solid color-mix(in srgb, var(--tp-accent) 45%, #fff);
  outline-offset: 1px;
}

.seg { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 6px 0; }
.seg label, .grid3 label { display: flex; gap: 5px; align-items: center; cursor: pointer; }
.seg input, .grid3 input { accent-color: var(--tp-accent); }
.sub { padding-left: 4px; border-left: 2px solid var(--tp-accent); margin-left: 4px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 10px; margin: 6px 0; }

.swatches { display: flex; gap: 8px; align-items: center; margin: 6px 0; }
.swatch { width: 24px; height: 24px; border-radius: 999px; border: 2px solid transparent; cursor: pointer; }
.swatch.active { border-color: #1f2328; }
.picker { width: 30px; height: 26px; border: 0; background: none; cursor: pointer; }

.row-label { margin: 8px 0 4px; color: #57606a; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  border: 1px solid #d8dee4;
  background: #fff;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #57606a;
}
.chip.on { background: var(--tp-accent); border-color: var(--tp-accent); color: #fff; }

.hint { font-size: 12px; color: #57606a; margin: 4px 0; }
.hint.muted { color: #8c959f; }

.sponsor-section { border-color: color-mix(in srgb, var(--tp-accent) 35%, #fff); }
.sponsor { display: flex; gap: 8px; margin-top: 9px; }
.sponsor button {
  flex: 1; padding: 7px 10px; border-radius: 8px; font-size: 12.5px; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--tp-accent) 45%, #fff);
  background: color-mix(in srgb, var(--tp-accent) 8%, #fff);
  color: var(--tp-accent);
}
.sponsor button:hover {
  background: color-mix(in srgb, var(--tp-accent) 16%, #fff);
}

.sites { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.site {
  display: inline-flex; align-items: center; gap: 4px;
  background: #eef1f5; border-radius: 999px; padding: 2px 4px 2px 10px; font-size: 12px;
}
.site button { border: 0; background: none; cursor: pointer; color: #8c959f; }
.row-inline { display: flex; gap: 6px; }
.row-inline input { flex: 1; min-width: 0; padding: 6px 9px; border-radius: 8px; border: 1px solid #d8dee4; }
.row-inline button { border: 1px solid #d8dee4; background: #fff; border-radius: 8px; padding: 5px 9px; cursor: pointer; font-size: 12px; }

.link { border: 0; background: none; color: var(--tp-accent); cursor: pointer; font-size: 12.5px; }
.link.danger { color: #cf222e; }
footer { text-align: center; margin-top: 12px; }
</style>
