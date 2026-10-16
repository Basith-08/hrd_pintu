<template>
  <select
    :value="modelValue"
    class="field"
    @change="handleChange"
  >
    <option :value="emptyValue">{{ placeholder }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: Array<{
      value: string | number
      label: string
    }>
    placeholder: string
    emptyValue?: string | number | null
    valueType?: "number" | "string"
  }>(),
  {
    emptyValue: "",
    valueType: "string",
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null]
}>()

function handleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value === "") {
    emit("update:modelValue", props.emptyValue ?? "")
    return
  }

  emit("update:modelValue", props.valueType === "number" ? Number(value) : value)
}
</script>
