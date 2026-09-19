<script lang="ts" setup>
// Styling lives in this file's scoped block; the card look itself (background,
// padding, radius) still comes from the panel-wide `section` rule.
import { reactive } from "vue";
import { translate } from "@/utils/i18n";

// Drop the actual WeChat / Alipay collection QR codes as
//   public/weixin.jpg
//   public/zhifubao.jpg
// WXT copies `public/*` to the build root, so the absolute paths below resolve
// to chrome-extension://<id>/weixin.jpg etc. — they work in the
// sidepanel regardless of its own depth.
interface QrEntry {
  id: "wechat" | "alipay";
  src: string;
  labelKey: string;
  missing: boolean;
}

const qrcodes = reactive<QrEntry[]>([
  { id: "wechat", src: "/weixin.jpg", labelKey: "sponsor.wechat", missing: false },
  { id: "alipay", src: "/zhifubao.jpg", labelKey: "sponsor.alipay", missing: false },
]);

// Text comes from `browser.i18n` like everywhere else — no lang prop, since
// the language is the browser's and fixed for the panel's lifetime.
const t = (key: string) => translate(key);

// If the QR file isn't present yet, swap in a labelled placeholder instead of
// rendering a broken-image icon.
function onImgError(entry: QrEntry) {
  entry.missing = true;
}
</script>

<template>
  <section class="sponsor-section">
    <h2 class="row-label">{{ t("panel.section.sponsor") }}</h2>
    <p class="hint">{{ t("sponsor.hint") }}</p>
    <div class="qrcodes">
      <figure v-for="qr in qrcodes" :key="qr.id" class="qrcode">
        <img
          v-if="!qr.missing"
          :src="qr.src"
          :alt="t(qr.labelKey)"
          @error="onImgError(qr)"
        />
        <div v-else class="qrcode-missing">{{ t("sponsor.qrMissing") }}</div>
        <figcaption>{{ t(qr.labelKey) }}</figcaption>
      </figure>
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
.qrcodes {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 12px;
}
.qrcode {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
/* QR codes sit on a fixed white tile — scanning needs a light background and
   this must NOT follow the dark theme, otherwise the codes become unreadable. */
.qrcode img,
.qrcode-missing {
  width: 128px;
  height: 128px;
  object-fit: contain;
  background: #fff;
  border: 1px solid #e2e5e9;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.qrcode-missing {
  font-size: 11px;
  color: #9aa0a6;
  text-align: center;
  line-height: 1.4;
}
.qrcode figcaption {
  font-size: 12px;
  color: inherit;
}

/* The scope attribute makes these (0,3,2) / (0,2,2), so they out-rank the
   panel-wide `html[data-theme="dark"] section` rule — dark values are repeated
   here on purpose, not by oversight. The QR tile itself stays white in both
   themes; only the caption colour dark-mode adjustment lives here. */
html[data-theme="dark"] .sponsor-section {
  border-color: #2a2f36;
}
html[data-theme="dark"] .qrcode img,
html[data-theme="dark"] .qrcode-missing {
  background: #fff;
  border-color: #3a3f47;
}
html[data-theme="dark"] .qrcode-missing {
  color: #6b7078;
}
</style>
