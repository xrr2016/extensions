<script lang="ts" setup>
// Styling lives in this file's scoped block; the card look itself (background,
// padding, radius) still comes from the panel-wide `section` rule.
import { reactive, ref, onMounted, onUnmounted } from "vue";
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

// Click-to-enlarge lightbox: a full-sidepanel overlay showing the selected
// QR code large enough to scan from a phone. Closed by clicking the backdrop,
// the close button, or pressing Escape.
const activeQr = ref<QrEntry | null>(null);

function openLightbox(qr: QrEntry) {
  if (!qr.missing) activeQr.value = qr;
}
function closeLightbox() {
  activeQr.value = null;
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") closeLightbox();
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
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
          @click="openLightbox(qr)"
        />
        <div v-else class="qrcode-missing">{{ t("sponsor.qrMissing") }}</div>
        <figcaption>{{ t(qr.labelKey) }}</figcaption>
      </figure>
    </div>

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

    <!-- Lightbox overlay: covers the whole sidepanel, dark backdrop, QR centered.
         Teleport not needed — this component lives at the panel root already. -->
    <transition name="lb">
      <div v-if="activeQr" class="lightbox" @click.self="closeLightbox">
        <button type="button" class="lb-close" aria-label="Close" @click="closeLightbox">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <img :src="activeQr.src" :alt="t(activeQr.labelKey)" class="lb-img" />
        <p class="lb-caption">{{ t(activeQr.labelKey) }}</p>
      </div>
    </transition>
  </section>
</template>

<style scoped>
/* `margin-top: auto` keeps the block pinned to the bottom of the panel's column
   layout (#app is a 100vh flex column and main is the flex-1 middle part). */
.sponsor-section {
  margin-top: auto;
  border-color: color-mix(in srgb, var(--tp-accent) 35%, #fff);
}

/* Vertical stack: the sidepanel is narrow, two columns made each QR too small
   to scan. Stacking lets each code be wider. */
.qrcodes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
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
  width: 180px;
  height: 180px;
  object-fit: contain;
  background: #fff;
  border: 1px solid #e2e5e9;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.qrcode img:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
.qrcode img:active {
  transform: scale(0.98);
}
.qrcode-missing {
  font-size: 11px;
  color: #9aa0a6;
  text-align: center;
  line-height: 1.4;
  cursor: default;
}
.qrcode figcaption {
  font-size: 12px;
  color: inherit;
}

/* Ko-fi badge image, centred below the QR codes. */
.kofi-btn {
  display: block;
  margin: 14px auto 0;
  width: 180px;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, scale 0.15s ease-out;
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

/* ---------- Lightbox ---------- */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.lb-img {
  max-width: 86vw;
  max-height: 74vh;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
}
.lb-caption {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.lb-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transition: background 0.15s ease;
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Lightbox enter/exit fade */
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.18s ease;
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
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
html[data-theme="dark"] .kofi-btn img {
  outline-color: oklch(1 0 0 / 0.1);
}
</style>
