<script lang="ts" setup>
// Styling comes from the panel's global stylesheet (`.sponsor-section` /
// `.sponsor` in entrypoints/sidepanel/style.css), where this component is the
// only consumer.
import { translate } from "@/utils/i18n";
import type { Language } from "@/utils/storage";

// The language comes from the parent's live settings, so the buttons re-label
// themselves as soon as the panel's language switch flips.
const props = defineProps<{ lang: Language }>();

const SPONSORS = [
  { id: "afdian", url: "https://ifdian.net/a/coldstoneboy" },
  { id: "patreon", url: "https://patreon.com/coldstoneboy" },
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
