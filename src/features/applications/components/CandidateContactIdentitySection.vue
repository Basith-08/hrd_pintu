<template>
  <AppFormSection :title="text('applicationForm.sections.contactIdentity')">
    <div class="field-grid">
      <AppTextareaField
        v-model="page.form.id_card_address"
        full
        :invalid="page.isFieldMissing(page.form.id_card_address)"
        :label="page.requiredLabel(text('applicationForm.fields.idCardAddress'))"
      />
      <AppTextareaField
        v-model="page.form.residential_address"
        full
        :invalid="page.isFieldMissing(page.form.residential_address)"
        :label="page.requiredLabel(text('applicationForm.fields.residentialAddress'))"
      />
      <AppTextField
        v-model="page.form.personal_email"
        :invalid="page.isFieldMissing(page.form.personal_email)"
        :label="page.requiredLabel(text('applicationForm.fields.personalEmail'))"
        type="email"
      />
      <AppTextField
        v-model="page.form.phone_number"
        :invalid="page.isFieldMissing(page.form.phone_number)"
        :label="page.requiredLabel(text('applicationForm.fields.cellularPhone'))"
      />
      <AppTextField
        v-model="page.form.instagram"
        :invalid="page.isFieldMissing(page.form.instagram)"
        :label="page.requiredLabel(text('common.instagram'))"
      />
      <AppTextField
        v-model="page.form.linkedin"
        :invalid="page.isFieldMissing(page.form.linkedin)"
        :label="page.requiredLabel(text('common.linkedin'))"
      />
      <AppTextField
        v-model="page.form.id_type"
        :invalid="page.isFieldMissing(page.form.id_type)"
        :label="page.requiredLabel(text('applicationForm.fields.idType'))"
      />
      <AppTextField
        v-model="page.form.id_no"
        :invalid="page.isFieldMissing(page.form.id_no)"
        :label="page.requiredLabel(text('applicationForm.fields.idNumber'))"
      />
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppFormSection from "@/components/AppFormSection.vue"
import AppTextField from "@/components/AppTextField.vue"
import AppTextareaField from "@/components/AppTextareaField.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
