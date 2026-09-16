<script lang="ts" setup>
// Styling lives in this file's scoped block; the card look itself (background,
// padding, radius) still comes from the panel-wide `section` rule.
import { translate } from "@/utils/i18n";
import type { Language } from "@/utils/storage";

// The language comes from the parent's live settings, so the buttons re-label
// themselves as soon as the panel's language switch flips.
const props = defineProps<{ lang: Language }>();

const SPONSORS = [
  { id: "afdian", url: "https://ifdian.net/a/coldstoneboy" },
] as const;

const t = (key: string) => translate(props.lang, key);

// The panel cannot host target="_blank" reliably, so sponsor links go through
// the tabs API.
function openSponsor(url: string) {
  void browser.tabs.create({ url });
}
</script>

<template>
  <section class="sponsor-section">
    <h2>{{ t("panel.section.sponsor") }}</h2>
    <p class="hint">{{ t("sponsor.hint") }}</p>
    <div class="sponsor">
      <button v-for="s in SPONSORS" :key="s.id" type="button" @click="openSponsor(s.url)">
        {{ t(`sponsor.${s.id}`) }}
      </button>
    </div>
  </section>
</template>

<style scoped>
/* `margin-top: auto` keeps the block pinned to the bottom of the panel's column
   layout (#app is a 100vh flex column and main is the flex-1 middle part). */
.sponsor-section {
  margin-top: auto;
  border-color: color-mix(in srgb, var(--tp-accent) 35%, #fff);
}
.sponsor {
  display: flex;
  gap: 8px;
  margin-top: 9px;
}
.sponsor button {
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--tp-accent) 45%, #fff);
  background: color-mix(in srgb, var(--tp-accent) 8%, #fff);
  color: var(--tp-accent);
}
.sponsor button:hover {
  background: color-mix(in srgb, var(--tp-accent) 16%, #fff);
}

/* The scope attribute makes these (0,3,2) / (0,2,2), so they out-rank the
   panel-wide `html[data-theme="dark"] section` rule — dark values are repeated
   here on purpose, not by oversight. */
html[data-theme="dark"] .sponsor-section {
  border-color: #2a2f36;
}
html[data-theme="dark"] .sponsor button {
  background: #22262b;
  border-color: #333941;
  color: #c8cdd4;
}
</style>
