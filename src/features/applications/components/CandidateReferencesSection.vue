<template>
  <AppFormSection
    :title="text('applicationForm.sections.referenceData')"
    :note="text('applicationForm.references.minimumRequired')"
  >
    <template #actions>
      <AppButton type="button" variant="ghost" @click="page.addReferenceItem">
        {{ text("common.actions.add") }}
      </AppButton>
    </template>
    <div class="section-stack">
      <div v-for="(item, index) in page.form.candidate_references" :key="`reference-${index}`" class="nested-card">
        <div class="field-grid nested-grid">
          <AppTextField
            v-model="item.name"
            :invalid="page.isFieldMissing(item.name, index === 0 || index === 1)"
            :label="page.requiredLabel(text('applicationForm.references.referenceName'), index === 0 || index === 1)"
          />
          <AppTextField
            v-model="item.phone_number"
            :invalid="page.isFieldMissing(item.phone_number, index === 0 || index === 1)"
            :label="page.requiredLabel(text('profile.fields.phoneNumber'), index === 0 || index === 1)"
          />
          <AppTextField
            v-model="item.relationship"
            :invalid="page.isFieldMissing(item.relationship, index === 0 || index === 1)"
            :label="page.requiredLabel(text('common.relationship'), index === 0 || index === 1)"
          />
          <AppTextField
            v-model="item.position"
            :invalid="page.isFieldMissing(item.position, index === 0 || index === 1)"
            :label="page.requiredLabel(text('common.position'), index === 0 || index === 1)"
          />
          <AppButton type="button" variant="danger" @click="page.removeReferenceItem(index)">
            {{ text("common.actions.removeItem") }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue"
import AppFormSection from "@/components/AppFormSection.vue"
import AppTextField from "@/components/AppTextField.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
