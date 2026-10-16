<template>
  <div :class="['nested-card', { 'nested-card--document': document, 'nested-card--invalid': invalid }]">
    <div v-if="$slots.header" class="nested-card__header">
      <slot name="header"></slot>
    </div>
    <div :class="contentClass">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="nested-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    contentClass?: string
    document?: boolean
    invalid?: boolean
  }>(),
  {
    contentClass: "nested-card__content",
    document: false,
    invalid: false,
  },
)
</script>
