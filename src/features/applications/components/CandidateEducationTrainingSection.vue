<template>
  <AppFormSection :title="text('applicationForm.sections.educationTraining')">
    <div class="section-stack">
      <div class="education-panel">
        <div class="education-panel__header">
          <p class="education-panel__title">{{ text("applicationForm.education.formalTitle") }}</p>
        </div>
        <div class="education-panel__body">
          <CandidateFormalEducationRow v-for="row in page.formalEducationRows" :key="row.level" :page="page"
            :row="row" />
        </div>
      </div>

      <div class="education-panel">
        <div class="education-panel__header education-panel__header--action">
          <div>
            <p class="education-panel__title">{{ text("applicationForm.education.nonFormalTitle") }}</p>
            <p class="education-panel__caption">
              {{ text("applicationForm.education.nonFormalCaption") }}
            </p>
          </div>
          <AppButton class="education-panel__add-button" variant="secondary" @click="page.addEducationItem">
            {{ text("applicationForm.education.actions.addTraining") }}
          </AppButton>
        </div>
        <div v-if="page.nonFormalEducationRows.length === 0" class="education-panel__empty-state">
          {{ text("applicationForm.education.emptyNonFormal") }}
        </div>
        <CandidateTrainingEducationRow v-for="entry in page.nonFormalEducationRows"
          :key="`education-nonformal-${entry.formIndex}`" :entry="entry" :page="page"
          @remove="page.removeEducationItem(entry.formIndex)" />
      </div>
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue"
import AppFormSection from "@/components/AppFormSection.vue"
import { useLocale } from "@/composables/useLocale"
import CandidateFormalEducationRow from "@/features/applications/components/CandidateFormalEducationRow.vue"
import CandidateTrainingEducationRow from "@/features/applications/components/CandidateTrainingEducationRow.vue"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
