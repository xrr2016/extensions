<script lang="ts" setup>
// Styling lives in this file's scoped block; the card look itself (background,
// padding, radius) still comes from the panel-wide `section` rule.
import { translate } from "@/utils/i18n";

// Text comes from `browser.i18n` like everywhere else — no lang prop, since
// the language is the browser's and fixed for the panel's lifetime.
const t = (key: string) => translate(key);
</script>

<template>
  <section class="sponsor-section">
    <h2 class="row-label">{{ t("panel.section.sponsor") }}</h2>
    <p class="hint">{{ t("sponsor.hint") }}</p>

    <!-- 爱发电 embedded sponsor widget. MV3's default extension-page CSP only
         restricts `script-src` / `object-src`, so a remote <iframe> is fine
         here — unlike Ko-fi's widget script, which that CSP does block.
         `leaflet` is 爱发电's own embed page and sends no X-Frame-Options. -->
    <iframe
      class="afdian-iframe"
      src="https://afdian.com/leaflet?slug=coldstoneboy"
      :title="t('sponsor.afdian')"
      scrolling="no"
      frameborder="0"
      loading="lazy"
    ></iframe>

    <!-- Ko-fi button: official widget script is blocked by the MV3 CSP, so use
         the bundled badge image linking to the Ko-fi page in a new tab. -->
    <a
      class="kofi-btn"
      href="https://ko-fi.com/J1R627B7UA"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src="/kofi.jpg" :alt="t('sponsor.kofi')" />
    </a>
  </section>
</template>

<style scoped>
/* `margin-top: auto` keeps the block pinned to the bottom of the panel's column
   layout (#app is a 100vh flex column and main is the flex-1 middle part). */
.sponsor-section {
  margin-top: auto;
  border-color: color-mix(in srgb, var(--tp-accent) 35%, #fff);
}

/* 爱发电 embedded widget. Height is a compromise: the leaflet page's own
   content is roughly this tall, and it scrolls internally rather than growing
   the panel. Centred like the Ko-fi badge below it. */
.afdian-iframe {
  display: block;
  width: 98%;
  min-height: 200px;
  max-width: 100%;
  border: none;
  margin: 14px auto 0;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
}

/* Ko-fi badge image, centred below the 爱发电 widget. */
.kofi-btn {
  display: block;
  margin: 14px auto 0;
  width: 98%;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  transition:
    transform 0.15s ease-out,
    box-shadow 0.15s ease-out,
    scale 0.15s ease-out;
}

.kofi-btn img {
  display: block;
  width: 100%;
  height: auto;
  outline: 1px solid oklch(0 0 0 / 0.1);
  outline-offset: -1px;
}

.kofi-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.kofi-btn:active {
  scale: 0.96;
}

/* The scope attribute makes these (0,2,1), so they out-rank the panel-wide
   `html[data-theme="dark"] section` rule — dark values are repeated here on
   purpose, not by oversight. */
html[data-theme="dark"] .sponsor-section {
  border-color: #2a2f36;
}

html[data-theme="dark"] .kofi-btn img {
  outline-color: oklch(1 0 0 / 0.1);
}
</style>
