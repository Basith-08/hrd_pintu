<template>
  <div class="language-switcher" role="group" :aria-label="text('locale.switcher')">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="language-switcher__button"
      :class="{ 'language-switcher__button--active': locale === option.value }"
      :aria-pressed="locale === option.value"
      @click="setLocale(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

import { useLocale, type SupportedLocale } from "@/composables/useLocale"

const { locale, setLocale, text } = useLocale()

const options = computed<{ label: string; value: SupportedLocale }[]>(() => [
  { label: "EN", value: "en" },
  { label: "ID", value: "id" },
])
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--brand-border-soft);
  border-radius: var(--radius-pill);
  background: var(--surface-overlay);
  padding: 0.25rem;
  backdrop-filter: blur(12px);
}

.language-switcher__button {
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--brand-muted);
  cursor: pointer;
  font-size: var(--text-pill);
  font-weight: 700;
  letter-spacing: var(--tracking-pill);
  min-width: 2.55rem;
  padding: 0.45rem 0.7rem;
}

.language-switcher__button--active {
  background: var(--brand);
  color: var(--brand-contrast);
}
</style>
