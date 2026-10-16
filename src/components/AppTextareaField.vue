<template>
  <AppFieldGroup :label="label" :full="full" :education-full="educationFull" :invalid="invalid">
    <textarea
      :value="modelValue"
      class="field field--textarea"
      :placeholder="placeholder"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
  </AppFieldGroup>
</template>

<script setup lang="ts">
import AppFieldGroup from "@/components/AppFieldGroup.vue"

withDefaults(
  defineProps<{
    label: string
    modelValue: string | number | null
    placeholder?: string
    full?: boolean
    educationFull?: boolean
    invalid?: boolean
  }>(),
  {
    placeholder: "",
    full: false,
    educationFull: false,
    invalid: false,
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null]
}>()
</script>
