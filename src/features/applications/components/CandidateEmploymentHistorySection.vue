<template>
  <AppFormSection
    :title="text('applicationForm.sections.employmentHistory')"
    :description="text('applicationForm.employment.description')"
    :note="text('applicationForm.employment.note')"
  >
    <template #actions>
      <AppButton variant="ghost" @click="page.addWorkHistoryItem">
        {{ text("common.actions.add") }}
      </AppButton>
    </template>
    <div class="section-stack">
      <div v-for="(item, index) in page.form.work_history" :key="`work-${index}`" class="nested-card">
        <div class="field-grid nested-grid">
          <AppTextField
            v-model="item.company"
            :invalid="page.isFieldMissing(item.company, index === 0)"
            :label="page.requiredLabel(text('common.company'), index === 0)"
          />
          <AppTextField
            v-model="item.position"
            :invalid="page.isFieldMissing(item.position, index === 0)"
            :label="page.requiredLabel(text('common.position'), index === 0)"
          />
          <AppTextareaField
            v-model="item.company_address"
            full
            :label="text('applicationForm.employment.companyAddress')"
          />
          <AppTextField
            v-model="item.company_phone"
            :label="text('applicationForm.employment.companyPhone')"
          />
          <AppTextField
            v-model="item.direct_superior_title"
            :label="text('applicationForm.employment.directSuperiorTitle')"
          />
          <AppFieldGroup
            :invalid="page.isFieldMissing(item.from_year, index === 0)"
            :label="page.requiredLabel(text('common.fromYear'), index === 0)"
          >
            <AppSelectField
              v-model="item.from_year"
              :empty-value="null"
              :options="yearSelectOptions"
              :placeholder="text('common.select.year')"
              value-type="number"
            />
          </AppFieldGroup>
          <AppFieldGroup
            :invalid="page.isFieldMissing(item.to_year, index === 0)"
            :label="page.requiredLabel(text('common.toYear'), index === 0)"
          >
            <AppSelectField
              v-model="item.to_year"
              :empty-value="null"
              :options="yearSelectOptions"
              :placeholder="text('common.select.year')"
              value-type="number"
            />
          </AppFieldGroup>
          <AppFieldGroup :label="text('applicationForm.employment.lastSalary')">
            <input v-model.number="item.last_salary" class="field" type="number" min="0" />
          </AppFieldGroup>
          <AppTextField
            v-model="item.benefit"
            :label="text('applicationForm.employment.benefitFacilities')"
          />
          <AppTextField
            v-model="item.reason_to_quitting"
            full
            :invalid="page.isFieldMissing(item.reason_to_quitting, index === 0)"
            :label="page.requiredLabel(text('applicationForm.employment.reasonForLeaving'), index === 0)"
          />
          <AppTextareaField
            v-model="item.organization_structure"
            full
            :label="text('applicationForm.employment.organizationStructure')"
          />
          <AppTextareaField
            v-model="item.description"
            full
            :label="text('common.description')"
          />
          <AppButton type="button" variant="danger" @click="page.removeWorkHistoryItem(index)">
            {{ text("common.actions.removeItem") }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import { computed } from "vue"

import AppButton from "@/components/AppButton.vue"
import AppFieldGroup from "@/components/AppFieldGroup.vue"
import AppFormSection from "@/components/AppFormSection.vue"
import AppSelectField from "@/components/AppSelectField.vue"
import AppTextField from "@/components/AppTextField.vue"
import AppTextareaField from "@/components/AppTextareaField.vue"
import { useLocale } from "@/composables/useLocale"

const props = defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
const yearSelectOptions = computed(() =>
  props.page.yearOptions.map((year: number) => ({
    value: year,
    label: String(year),
  })),
)
</script>
