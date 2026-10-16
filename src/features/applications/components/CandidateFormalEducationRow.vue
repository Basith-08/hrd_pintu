<template>
  <div class="education-panel__row education-panel__row--formal">
    <AppTextField :model-value="row.label" :label="text('common.level')" muted readonly />
    <AppTextField
      v-model="row.item.institution"
      :invalid="page.isFieldMissing(row.item.institution, page.isRequiredFormalEducationLevel(row.level))"
      :label="page.requiredLabel(text('common.institution'), page.isRequiredFormalEducationLevel(row.level))"
    />
    <AppFieldGroup :label="text('common.fromYear')">
      <AppSelectField
        v-model="row.item.from_year"
        :empty-value="null"
        :options="yearSelectOptions"
        :placeholder="text('common.select.year')"
        value-type="number"
      />
    </AppFieldGroup>
    <AppFieldGroup :label="text('common.toYear')">
      <AppSelectField
        v-model="row.item.to_year"
        :empty-value="null"
        :options="yearSelectOptions"
        :placeholder="text('common.select.year')"
        value-type="number"
      />
    </AppFieldGroup>
    <AppTextareaField
      v-model="row.item.description"
      education-full
      :label="text('common.descriptionRemarks')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

import AppFieldGroup from "@/components/AppFieldGroup.vue"
import AppSelectField from "@/components/AppSelectField.vue"
import AppTextareaField from "@/components/AppTextareaField.vue"
import AppTextField from "@/components/AppTextField.vue"
import { useLocale } from "@/composables/useLocale"

const props = defineProps<{
  page: Record<string, any>
  row: Record<string, any>
}>()

const { text } = useLocale()
const yearSelectOptions = computed(() =>
  props.page.yearOptions.map((year: number) => ({
    value: year,
    label: String(year),
  })),
)
</script>
