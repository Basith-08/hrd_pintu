<template>
  <span :class="['document-chip', { 'document-chip--selected': selected }]">
    <span class="document-chip__label">{{ label }}</span>
    <button
      type="button"
      class="document-chip__remove"
      :disabled="disabled"
      @click="emit('remove')"
    >
      {{ removeLabel }}
    </button>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  removeLabel: string
  disabled?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()
</script>
