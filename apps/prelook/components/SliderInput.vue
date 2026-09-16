<script lang="ts" setup>
import { computed } from "vue";

// Slider styled after the reference: a thin track with the filled part in the
// panel accent and a dark value bubble floating above the thumb. A real
// <input type="range"> underneath, so keyboard steps and screen readers work.
const model = defineModel<number>({ required: true });

const props = defineProps<{
  min: number;
  max: number;
  step?: number;
  /** Appended to the bubble text ("s", "%", …) */
  unit?: string;
  /** Digits shown in the bubble (for fractional steps like seconds) */
  decimals?: number;
  disabled?: boolean;
}>();

/** Thumb travel is inset by half a thumb on each side; --pct drives both the
 *  fill gradient and the bubble position so they always agree. */
const pct = computed(() => {
  const span = props.max - props.min;
  return span > 0 ? (model.value - props.min) / span : 0;
});
const label = computed(() => `${model.value.toFixed(props.decimals ?? 0)}${props.unit ?? ""}`);
</script>

<template>
  <span class="tp-slider" :style="{ '--pct': pct }">
    <span class="bubble" aria-hidden="true">{{ label }}</span>
    <input
      v-model.number="model"
      type="range"
      :min="min"
      :max="max"
      :step="step ?? 1"
      :disabled="disabled"
    />
  </span>
</template>

<style scoped>
.tp-slider {
  --pct: 0;
  position: relative;
  display: inline-flex;
  flex: 0 1 55%;
  min-width: 0;
}
.bubble {
  position: absolute;
  bottom: calc(100% + 7px);
  left: calc(7px + (100% - 14px) * var(--pct));
  transform: translateX(-50%);
  padding: 5px 9px;
  border-radius: 6px;
  background: #26292e;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}
.tp-slider:hover .bubble,
.tp-slider:focus-within .bubble {
  opacity: 1;
}

input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 16px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}
input::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--tp-accent, #4f6bf6) calc(var(--pct) * 100%),
    #dfe3e8 calc(var(--pct) * 100%)
  );
}
input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5.5px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
input::-moz-range-track {
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--tp-accent, #4f6bf6) calc(var(--pct) * 100%),
    #dfe3e8 calc(var(--pct) * 100%)
  );
}
input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
input:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--tp-accent, #4f6bf6) 45%, #fff);
  outline-offset: 2px;
}
input:disabled {
  cursor: default;
}
input:disabled::-webkit-slider-thumb,
input:disabled::-moz-range-thumb {
  background: #c9ced6;
  box-shadow: none;
}

/* Scoped rules sit after the panel-wide dark rules, so these win as written. */
html[data-theme="dark"] .bubble {
  background: #333941;
}
html[data-theme="dark"] input::-webkit-slider-runnable-track,
html[data-theme="dark"] input::-moz-range-track {
  background: linear-gradient(
    to right,
    var(--tp-accent, #4f6bf6) calc(var(--pct) * 100%),
    #3a4048 calc(var(--pct) * 100%)
  );
}
</style>
