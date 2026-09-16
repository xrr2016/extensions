<script lang="ts" setup>
// Switch styled after the reference image: a rounded-rectangle track filled
// with the panel accent while on, and a white rounded-square knob that slides
// to the right edge. A real `role="switch"` button, so keyboard and screen
// readers keep working (Space toggles, aria-checked announces state).
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    role="switch"
    class="tp-switch"
    :class="{ on: model }"
    :aria-checked="model"
    @click="model = !model"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
.tp-switch {
  position: relative;
  width: 40px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: #c9ced6;
  cursor: pointer;
  flex: 0 0 auto;
  transition: background 0.15s ease;
}
.tp-switch:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--tp-accent, #4f6bf6) 45%, #fff);
  outline-offset: 2px;
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: left 0.15s ease;
}
.tp-switch.on {
  background: var(--tp-accent, #4f6bf6);
}
.tp-switch.on .knob {
  left: 21px;
}

/* Scoped rules are (0,2,0)/(0,3,0) and sit after the panel-wide dark rules, so
   these win without extra specificity games. */
html[data-theme="dark"] .tp-switch {
  background: #3a4048;
}
html[data-theme="dark"] .tp-switch.on {
  background: var(--tp-accent, #4f6bf6);
}
</style>
