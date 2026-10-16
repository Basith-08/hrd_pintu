<template>
  <div class="education-panel__row education-panel__row--training">
    <AppTextField v-model="entry.item.major" education-full :label="text('applicationForm.education.courseOfStudy')" />
    <AppTextField v-model="entry.item.institution" :label="text('common.institution')" />
    <AppTextField v-model="entry.item.city" :label="text('common.city')" />
    <AppFieldGroup :label="text('common.fromYear')">
      <AppSelectField v-model="entry.item.from_year" :empty-value="null" :options="yearSelectOptions"
        :placeholder="text('common.select.year')" value-type="number" />
    </AppFieldGroup>
    <AppFieldGroup :label="text('common.toYear')">
      <AppSelectField v-model="entry.item.to_year" :empty-value="null" :options="yearSelectOptions"
        :placeholder="text('common.select.year')" value-type="number" />
    </AppFieldGroup>
    <AppTextareaField v-model="entry.item.description" education-full :label="text('common.descriptionRemarks')" />
    <AppButton class="danger-button--education" variant="danger" @click="emit('remove')">
      {{ text("common.actions.removeItem") }}
    </AppButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

import AppButton from "@/components/AppButton.vue"
import AppFieldGroup from "@/components/AppFieldGroup.vue"
import AppSelectField from "@/components/AppSelectField.vue"
import AppTextareaField from "@/components/AppTextareaField.vue"
import AppTextField from "@/components/AppTextField.vue"
import { useLocale } from "@/composables/useLocale"

const props = defineProps<{
  entry: Record<string, any>
  page: Record<string, any>
}>()

const emit = defineEmits<{
  remove: []
}>()

const { text } = useLocale()
const yearSelectOptions = computed(() =>
  props.page.yearOptions.map((year: number) => ({
    value: year,
    label: String(year),
  })),
)
</script>
