<template>
  <label
    :class="[
      'field-group',
      {
        'field-group--full': full,
        'field-group--education-full': educationFull,
        'field-group--invalid': invalid,
      },
    ]"
  >
    <span>{{ label }}</span>
    <slot></slot>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  full?: boolean
  educationFull?: boolean
  invalid?: boolean
}>()
</script>
