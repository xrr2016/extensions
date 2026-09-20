<script lang="ts" setup>
// Segmented radio group styled after the reference: a soft gray container
// with thin dividers between options, the selected one raised as a white
// pill in the accent color. Real radios underneath (invisible overlays), so
// arrow keys and screen readers still behave like a native radio group.
interface RadioOption {
  value: string;
  label: string;
}

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    name: string;
    options: RadioOption[];
    /** 9-item groups wrap to several rows, where edge dividers mislead */
    dividers?: boolean;
  }>(),
  { dividers: true },
);
</script>

<template>
  <div class="tp-seg" :class="{ nodiv: !dividers }">
    <label v-for="o in options" :key="o.value" :class="{ on: model === o.value }">
      <input v-model="model" type="radio" :name="name" :value="o.value" />
      {{ o.label }}
    </label>
  </div>
</template>

<style scoped>
.tp-seg {
  /* auto-fill (not auto-fit) keeps the empty tracks on a wrapped last row, so
     an orphan option stays one column wide instead of stretching across the
     whole row. */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  width: 100%;
  gap: 2px;
  margin: 6px 0;
  padding: 3px;
  border-radius: 9px;
  background: #f1f3f5;
}
.tp-seg label {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 6px 12px;
  border-radius: 6px;
  color: #57606a;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}
.tp-seg label:hover {
  color: var(--tp-accent, #4f6bf6);
}
.tp-seg label.on {
  background: #fff;
  color: var(--tp-accent, #4f6bf6);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
}
.tp-seg:not(.nodiv) label + label::before {
  content: "";
  position: absolute;
  left: 0;
  top: 22%;
  bottom: 22%;
  width: 1px;
  background: #dcdfe4;
}
.tp-seg:not(.nodiv) label.on::before,
.tp-seg:not(.nodiv) label.on + label::before {
  display: none;
}
.tp-seg input {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}
.tp-seg input:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--tp-accent, #4f6bf6) 45%, #fff);
  outline-offset: -2px;
}

/* Scoped rules sit after the panel-wide dark rules, so these win as written. */
html[data-theme="dark"] .tp-seg {
  background: #262b31;
}
html[data-theme="dark"] .tp-seg label {
  color: #a6adb5;
}
html[data-theme="dark"] .tp-seg label.on {
  background: #333941;
  color: var(--tp-accent, #4f6bf6);
}
html[data-theme="dark"] .tp-seg:not(.nodiv) label + label::before {
  background: #3a4048;
}
</style>
