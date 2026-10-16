<template>
  <AppFormSection :title="text('applicationForm.sections.skillAbilities')">
    <div class="section-stack">
      <div class="nested-card">
        <div class="nested-card__header">
          <div>
            <p class="nested-card__title">{{ text("applicationForm.skills.foreignLanguageTitle") }}</p>
            <p class="nested-card__caption">
              {{ text("applicationForm.skills.foreignLanguageCaption") }}
            </p>
          </div>
        </div>
        <div class="nested-card__body">
          <div v-for="(item, index) in page.form.candidate_languages" :key="`language-${index}`"
            class="language-grid-row">
            <AppTextField
              v-model="item.language_name"
              :label="text('common.language')"
            />
            <AppFieldGroup :label="text('common.proficiency.speaking')">
              <AppSelectField
                v-model="item.speaking"
                :options="page.localizedLanguageProficiencyOptions"
                :placeholder="text('common.select.default')"
              />
            </AppFieldGroup>
            <AppFieldGroup :label="text('common.proficiency.reading')">
              <AppSelectField
                v-model="item.reading"
                :options="page.localizedLanguageProficiencyOptions"
                :placeholder="text('common.select.default')"
              />
            </AppFieldGroup>
            <AppFieldGroup :label="text('common.proficiency.listening')">
              <AppSelectField
                v-model="item.listening"
                :options="page.localizedLanguageProficiencyOptions"
                :placeholder="text('common.select.default')"
              />
            </AppFieldGroup>
            <AppFieldGroup :label="text('common.proficiency.writing')">
              <AppSelectField
                v-model="item.writing"
                :options="page.localizedLanguageProficiencyOptions"
                :placeholder="text('common.select.default')"
              />
            </AppFieldGroup>
          </div>
        </div>
        <div class="nested-card__footer">
          <div>
            <AppButton type="button" variant="ghost" @click="page.addLanguageItem">
              {{ text("applicationForm.skills.actions.addLanguageRow") }}
            </AppButton>
          </div>
        </div>
      </div>

      <div class="nested-card">
        <div class="nested-card__header">
          <div>
            <p class="nested-card__title">{{ text("applicationForm.skills.otherRelevantTitle") }}</p>
          </div>
          <AppButton type="button" variant="ghost" @click="page.addSkillItem">
            {{ text("applicationForm.skills.actions.addSkillRow") }}
          </AppButton>
        </div>
        <div v-for="(item, index) in page.form.candidate_skills" :key="`skill-${index}`" class="field-grid nested-grid">
          <AppTextareaField
            v-model="item.description"
            :label="text('applicationForm.skills.skillDescription')"
            :placeholder="text('applicationForm.skills.skillDescriptionPlaceholder')"
          />
          <AppTextField
            v-model="item.skill_name"
            :label="text('applicationForm.skills.shortSkillName')"
          />
          <AppButton type="button" variant="danger" @click="page.removeSkillItem(index)">
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
