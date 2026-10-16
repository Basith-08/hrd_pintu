<template>
  <label class="checkbox-card">
    <input
      :checked="modelValue"
      :disabled="disabled"
      type="checkbox"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span>
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    disabled?: boolean
  }>(),
  {
    label: "",
    disabled: false,
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
}>()
</script>
