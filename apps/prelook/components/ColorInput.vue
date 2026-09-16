<script lang="ts" setup>
import { computed } from "vue";

// Color field styled after the reference: a rounded swatch followed by the
// hex code on a soft gray pill. The native <input type="color"> stays in the
// DOM as an invisible overlay covering the pill, so the OS picker (with its
// eyedropper and saved swatches) still opens on click and the label stays
// keyboard/AT accessible.
const model = defineModel<string>({ required: true });

const code = computed(() => model.value.toUpperCase());
</script>

<template>
  <label class="tp-color">
    <span class="swatch" :style="{ background: model }" />
    <span class="code">{{ code }}</span>
    <input v-model="model" type="color" />
  </label>
</template>

<style scoped>
.tp-color {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 6px;
  border-radius: 8px;
  background: #eef0f3;
}
.swatch {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.code {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  font-variant-numeric: tabular-nums;
}
input {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}

/* Scoped rules sit after the panel-wide dark rules, so these win as written. */
html[data-theme="dark"] .tp-color {
  background: #2a2f36;
}
html[data-theme="dark"] .code {
  color: #cfd4da;
}
</style>
