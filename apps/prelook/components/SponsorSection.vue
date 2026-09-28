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

    <!-- GitHub star banner: pill-shaped notice with a starred button to the
         repo. Same shape as the landing pages' "star us" strips. The repo URL
         matches the one used in prelook-landing's footer. -->
    <div class="gh-banner">
      <span class="gh-text">{{ t("sponsor.githubStar") }}</span>
      <a
        class="gh-btn"
        href="https://github.com/xrr2016/extensions"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
          />
        </svg>
        <span>GitHub</span>
        <span class="gh-star" aria-hidden="true">⭐</span>
      </a>
    </div>

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

/* GitHub star banner: soft blue pill, text left / button right. The panel can
   be dragged narrow, so the button wraps under the text instead of clipping. */
.gh-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  margin-top: 10px;
  padding: 9px 10px 9px 14px;
  border: 1px solid #d3e3f8;
  background: #eaf2fd;
  color: #1a56b0;
  font-size: 12.5px;
  line-height: 1.5;
}

.gh-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #b9d4f5;
  border-radius: 999px;
  background: #fff;
  color: #0f3f7a;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 0.15s ease-out,
    box-shadow 0.15s ease-out;
}

.gh-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(26, 86, 176, 0.18);
}

.gh-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.gh-star {
  font-size: 14px;
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

/* Same blue identity, dimmed so the pill reads as a tinted inset on the dark
   card instead of a glowing strip. */
html[data-theme="dark"] .gh-banner {
  border-color: #2b466e;
  background: #17233a;
  color: #9cc2f0;
}

html[data-theme="dark"] .gh-btn {
  border-color: #3a5a8f;
  background: #1e2c46;
  color: #cfe2fa;
}

html[data-theme="dark"] .gh-btn:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
}

html[data-theme="dark"] .kofi-btn img {
  outline-color: oklch(1 0 0 / 0.1);
}
</style>
