<template>
  <AppFormSection :title="text('applicationForm.sections.personalData')">
    <div class="field-grid">
      <AppTextField
        v-model="page.form.full_name"
        :invalid="page.isFieldMissing(page.form.full_name)"
        :label="page.requiredLabel(text('applicationForm.fields.fullName'))"
      />
      <AppFieldGroup :invalid="page.isFieldMissing(page.form.gender)" :label="page.requiredLabel(text('common.gender'))">
        <AppSelectField
          v-model="page.form.gender"
          :options="page.localizedGenderOptions"
          :placeholder="text('common.select.gender')"
        />
      </AppFieldGroup>
      <AppTextField
        v-model="page.form.place_of_birth"
        :invalid="page.isFieldMissing(page.form.place_of_birth)"
        :label="page.requiredLabel(text('applicationForm.fields.placeOfBirth'))"
      />
      <AppTextField
        v-model="page.form.date_of_birth"
        type="date"
        :invalid="page.isFieldMissing(page.form.date_of_birth)"
        :label="page.requiredLabel(text('applicationForm.fields.dateOfBirth'))"
      />
      <AppTextField
        v-model="page.form.nationality"
        :invalid="page.isFieldMissing(page.form.nationality)"
        :label="page.requiredLabel(text('applicationForm.fields.nationality'))"
      />
      <AppTextField
        v-model="page.form.religion"
        :invalid="page.isFieldMissing(page.form.religion)"
        :label="page.requiredLabel(text('applicationForm.fields.religion'))"
      />
      <AppFieldGroup :invalid="page.isFieldMissing(page.form.marital_status)" :label="page.requiredLabel(text('applicationForm.fields.maritalStatus'))">
        <AppSelectField
          v-model="page.form.marital_status"
          :options="page.localizedMaritalStatusOptions"
          :placeholder="text('common.select.status')"
        />
      </AppFieldGroup>
      <AppFieldGroup :invalid="page.isFieldMissing(page.form.blood_type)" :label="page.requiredLabel(text('applicationForm.fields.bloodType'))">
        <AppSelectField
          v-model="page.form.blood_type"
          :options="page.localizedBloodTypeOptions"
          :placeholder="text('applicationForm.fields.selectBloodType')"
        />
      </AppFieldGroup>
      <AppTextField
        v-model="page.form.ethnic"
        :invalid="page.isFieldMissing(page.form.ethnic)"
        :label="page.requiredLabel(text('applicationForm.fields.ethnic'))"
      />
      <AppFieldGroup full :invalid="page.isFieldMissing(page.form.photograph) && !page.selectedPhotographFile" :label="page.requiredLabel(text('applicationForm.fields.photograph'))">
        <input class="field" type="file" accept="image/*"
          :disabled="page.isSaving || page.isSubmitting || page.isLoading || page.uploadingPhotograph"
          @change="page.handlePhotographChange" />
        <p class="field-help">
          {{ text("applicationForm.fields.photographSizeHelp") }}
        </p>
        <p v-if="page.selectedPhotographFile" class="field-help">
          {{ text("files.selectedFile") }} {{ page.selectedPhotographFile.name }}
        </p>
        <img v-if="page.photographPreviewUrl" :src="page.photographPreviewUrl"
          :alt="text('applicationForm.fields.photographPreviewAlt')" class="photo-preview" />
      </AppFieldGroup>
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppFieldGroup from "@/components/AppFieldGroup.vue"
import AppFormSection from "@/components/AppFormSection.vue"
import AppSelectField from "@/components/AppSelectField.vue"
import AppTextField from "@/components/AppTextField.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
