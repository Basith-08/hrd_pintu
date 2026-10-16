<template>
  <button :class="buttonClass" :disabled="disabled" :type="type" @click="emit('click', $event)">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    type?: "button" | "submit" | "reset"
    variant?: "primary" | "secondary" | "ghost" | "danger"
  }>(),
  {
    disabled: false,
    type: "button",
    variant: "secondary",
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => `${props.variant}-button`)
</script>
