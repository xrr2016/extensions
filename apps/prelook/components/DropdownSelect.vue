<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// Dropdown styled after the reference: a flat trigger showing the selected
// label in the accent color with a chevron that flips while open, opening a
// bordered white menu below. Options are real buttons and the trigger carries
// aria-expanded/haspopup, so keyboard (Enter/Space/Escape) and screen readers
// behave; a document-level listener closes it on outside clicks.
interface DropdownOption {
  value: string;
  label: string;
}

const model = defineModel<string>({ required: true });

const props = defineProps<{
  options: DropdownOption[];
  /** Accessible name / tooltip for the trigger */
  name?: string;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const selected = computed(
  () => props.options.find((o) => o.value === model.value)?.label ?? "",
);

function choose(value: string) {
  model.value = value;
  open.value = false;
}

function onDocPointer(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocPointer, true);
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointer, true);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div ref="root" class="tp-dd">
    <button
      type="button"
      class="trigger"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :title="name"
      @click="open = !open"
    >
      <span class="value">{{ selected }}</span>
      <svg
        class="chev"
        :class="{ up: open }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <div v-if="open" class="menu" role="listbox">
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        class="item"
        role="option"
        :class="{ on: model === o.value }"
        :aria-selected="model === o.value"
        @click="choose(o.value)"
      >
        {{ o.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tp-dd {
  position: relative;
  max-width: 55%;
}
.trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  background: #f1f3f5;
  color: var(--tp-accent, #4f6bf6);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--tp-accent, #4f6bf6) 45%, #fff);
  outline-offset: 2px;
}
.chev {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  transition: transform 0.12s ease;
}
.chev.up {
  transform: rotate(180deg);
}
.menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 30;
  min-width: 132px;
  padding: 4px;
  border: 1px solid #e2e6ea;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: #26292e;
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}
.item:hover {
  background: #f5f6f8;
}
.item.on {
  color: var(--tp-accent, #4f6bf6);
  font-weight: 600;
}
.item:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--tp-accent, #4f6bf6) 45%, #fff);
  outline-offset: -2px;
}

/* Scoped rules sit after the panel-wide dark rules, so these win as written. */
html[data-theme="dark"] .trigger {
  background: #262b31;
}
html[data-theme="dark"] .menu {
  background: #22262b;
  border-color: #333941;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}
html[data-theme="dark"] .item {
  color: #c8cdd4;
}
html[data-theme="dark"] .item:hover {
  background: #2a2f36;
}
</style>
