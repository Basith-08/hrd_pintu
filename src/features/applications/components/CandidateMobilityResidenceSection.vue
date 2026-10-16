<template>
  <AppFormSection :title="text('applicationForm.sections.mobilityResidence')">
    <div class="field-grid">
      <AppTextField
        v-model="page.form.transportation_type"
        :invalid="page.isFieldMissing(page.form.transportation_type)"
        :label="page.requiredLabel(text('applicationForm.mobility.transportationType'))"
      />
      <AppFieldGroup
        :invalid="page.isFieldMissing(page.form.transportation_ownership)"
        :label="page.requiredLabel(text('applicationForm.mobility.transportationOwnership'))"
      >
        <AppSelectField
          v-model="page.form.transportation_ownership"
          :options="page.localizedTransportationOwnershipOptions"
          :placeholder="text('applicationForm.mobility.selectOwnership')"
        />
      </AppFieldGroup>
      <AppFieldGroup
        full
        :invalid="page.isFieldMissing(page.form.residence_ownership)"
        :label="page.requiredLabel(text('applicationForm.mobility.residenceOwnership'))"
      >
        <AppSelectField
          v-model="page.form.residence_ownership"
          :options="page.localizedResidenceOwnershipOptions"
          :placeholder="text('applicationForm.mobility.selectResidence')"
        />
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
