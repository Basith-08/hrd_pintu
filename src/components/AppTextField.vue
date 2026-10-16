<template>
  <AppFieldGroup :label="label" :full="full" :education-full="educationFull" :invalid="invalid">
    <input
      :value="modelValue"
      :autocomplete="autocomplete"
      :class="['field', { 'field--muted': muted }]"
      :disabled="disabled"
      :min="min"
      :placeholder="placeholder"
      :readonly="readonly"
      :required="required"
      :type="type"
      @input="handleInput"
    />
  </AppFieldGroup>
</template>

<script setup lang="ts">
import AppFieldGroup from "@/components/AppFieldGroup.vue"

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string | number | null
    type?: string
    min?: string | number
    valueType?: "string" | "number"
    placeholder?: string
    autocomplete?: string
    required?: boolean
    disabled?: boolean
    full?: boolean
    educationFull?: boolean
    muted?: boolean
    readonly?: boolean
    invalid?: boolean
  }>(),
  {
    type: "text",
    min: undefined,
    valueType: "string",
    placeholder: "",
    autocomplete: undefined,
    required: false,
    disabled: false,
    full: false,
    educationFull: false,
    muted: false,
    readonly: false,
    invalid: false,
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null]
}>()

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value

  if (props.valueType === "number" && value !== "") {
    emit("update:modelValue", Number(value))
    return
  }

  emit("update:modelValue", value)
}
</script>
