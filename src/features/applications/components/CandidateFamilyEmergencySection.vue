<template>
  <AppFormSection :title="text('applicationForm.sections.familyEmergency')">
    <div class="section-stack">
      <div v-for="section in page.groupedFamilySections" :key="section.key" class="nested-card">
        <div class="nested-card__header">
          <div>
            <p class="nested-card__title">{{ page.requiredLabel(section.label, section.category === "Parent" || section.category === "Emergency Contact") }}</p>
            <p v-if="section.category === 'Parent'" class="nested-card__caption">
              {{ text("applicationForm.family.parent.singleParentHint") }}
            </p>
          </div>
          <AppButton type="button" variant="ghost" @click="page.addFamilyItemForCategory(section.category)">
            {{ text("common.actions.add") }} {{ section.shortLabel }}
          </AppButton>
        </div>

        <div v-if="section.items.length === 0" class="empty-state">
          {{ text("common.emptyDataByLabel", { label: section.shortLabel.toLowerCase() }) }}
        </div>

        <div v-for="entry in section.items" :key="`family-${section.key}-${entry.formIndex}`"
          class="field-grid nested-grid">
          <AppFieldGroup
            v-if="entry.item.category === 'Parent'"
            :invalid="page.isFieldMissing(entry.item.relationship)"
            :label="page.requiredLabel(text('common.relationship'))"
          >
            <AppSelectField
              v-model="entry.item.relationship"
              :options="page.localizedParentRelationshipOptions"
              :placeholder="text('common.select.default')"
            />
          </AppFieldGroup>
          <AppTextField
            v-else
            v-model="entry.item.relationship"
            :invalid="page.isFieldMissing(entry.item.relationship, entry.item.category === 'Emergency Contact')"
            :label="page.requiredLabel(text('common.relationship'), entry.item.category === 'Emergency Contact')"
          />
          <AppTextField
            v-model="entry.item.name"
            :invalid="page.isFieldMissing(entry.item.name, entry.item.category === 'Parent' || entry.item.category === 'Emergency Contact')"
            :label="page.requiredLabel(text('common.name'), entry.item.category === 'Parent' || entry.item.category === 'Emergency Contact')"
          />
          <AppFieldGroup
            :invalid="page.isFieldMissing(entry.item.gender, entry.item.category === 'Parent')"
            :label="page.requiredLabel(text('common.gender'), entry.item.category === 'Parent')"
          >
            <AppSelectField
              v-model="entry.item.gender"
              :options="page.localizedGenderOptions"
              :placeholder="text('common.select.gender')"
            />
          </AppFieldGroup>
          <AppTextField
            v-model="entry.item.occupation"
            :invalid="page.isFieldMissing(entry.item.occupation, entry.item.category === 'Parent')"
            :label="page.requiredLabel(text('common.occupation'), entry.item.category === 'Parent')"
          />
          <AppTextField
            v-model="entry.item.place_and_date_of_birth"
            full
            :invalid="page.isFieldMissing(entry.item.place_and_date_of_birth, entry.item.category === 'Parent')"
            :label="page.requiredLabel(text('common.placeAndDateOfBirth'), entry.item.category === 'Parent')"
          />
          <AppTextField
            v-model="entry.item.education"
            :invalid="page.isFieldMissing(entry.item.education, entry.item.category === 'Parent')"
            :label="page.requiredLabel(text('common.education'), entry.item.category === 'Parent')"
          />
          <AppTextField
            v-model="entry.item.remarks"
            :label="text('common.remarks')"
          />
          <AppTextareaField
            v-model="entry.item.description"
            full
            :label="text('common.description')"
          />
          <AppFieldGroup :label="text('common.category')">
            <AppSelectField
              v-model="entry.item.category"
              :options="page.localizedFamilyCategoryOptions"
              :placeholder="text('common.select.category')"
            />
          </AppFieldGroup>
          <AppButton type="button" variant="danger" @click="page.removeFamilyItem(entry.formIndex)">
            {{ text("common.actions.removeItem") }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue"
import AppFieldGroup from "@/components/AppFieldGroup.vue"
import AppFormSection from "@/components/AppFormSection.vue"
import AppSelectField from "@/components/AppSelectField.vue"
import AppTextField from "@/components/AppTextField.vue"
import AppTextareaField from "@/components/AppTextareaField.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
