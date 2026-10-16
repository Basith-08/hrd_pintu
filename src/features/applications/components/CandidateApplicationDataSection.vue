<template>
  <AppFormSection :title="text('applicationForm.sections.applicationData')">
    <div class="field-grid">
      <AppTextField
        v-for="field in page.applicationDataFields"
        :key="field.model"
        v-model="page.form[field.model]"
        :full="field.fullWidth"
        :invalid="field.invalid"
        :label="field.label"
        :type="field.type"
      />
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppFormSection from "@/components/AppFormSection.vue"
import AppTextField from "@/components/AppTextField.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
