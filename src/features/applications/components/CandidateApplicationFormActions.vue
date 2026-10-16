<template>
  <p
    v-if="!page.isFormSubmittedAndCompleted && page.isLastStep"
    class="field-help field-help--submit-note"
  >
    {{ saveDraftFirstHint }}
  </p>
  <p
    v-if="!page.isFormSubmittedAndCompleted && autosaveStatusLabel"
    class="field-help field-help--autosave"
    role="status"
    aria-live="polite"
  >
    {{ autosaveStatusLabel }}
  </p>
  <div v-if="!page.isFormSubmittedAndCompleted" class="form-actions">
    <div class="form-actions__nav">
      <AppButton
        type="button"
        class="wizard-nav-button"
        :disabled="isBusy || page.isFirstStep"
        variant="ghost"
        @click="page.goToPreviousStep"
      >
        ← {{ previousButtonLabel }}
      </AppButton>
      <label class="wizard-step-jump">
        <span class="wizard-step-jump__label">{{ jumpLabel }}</span>
        <select
          :value="page.activeStepKey"
          class="field wizard-step-jump__select"
          :disabled="isBusy"
          @change="page.setActiveStep(($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="step in page.wizardSteps"
            :key="step.key"
            :value="step.key"
          >
            {{ step.indexLabel }}. {{ step.label }}
          </option>
        </select>
      </label>
    </div>
    <div class="form-actions__submit">
      <AppButton type="button" :disabled="isBusy" variant="secondary" @click="page.handleSave">
        {{ saveButtonLabel }}
      </AppButton>
      <AppButton
        v-if="page.isLastStep && page.canSubmitForm"
        type="button"
        :disabled="isBusy"
        variant="primary"
        @click="page.handleSubmitForm"
      >
        {{ submitButtonLabel }}
      </AppButton>
      <AppButton
        v-else-if="!page.isLastStep"
        type="button"
        :disabled="isBusy"
        variant="primary"
        @click="page.goToNextStep"
      >
        {{ nextButtonLabel }} →
      </AppButton>
    </div>
  </div>
  <p
    v-if="!page.isFormSubmittedAndCompleted && page.isLastStep && !page.canSubmitForm"
    class="field-help field-help--submit-note"
  >
    {{ page.submitValidationMessage }}
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue"

import AppButton from "@/components/AppButton.vue"
const props = defineProps<{
  page: Record<string, any>
}>()
const isBusy = computed(
  () =>
    props.page.isSaving ||
    props.page.isSubmitting ||
    props.page.isLoading ||
    props.page.isUploadingAnyFile,
)
const saveButtonLabel = computed(() => {
  if (props.page.isSaving) {
    return props.page.text("common.saving")
  }

  return props.page.text("applicationForm.actions.saveDraft")
})
const saveDraftFirstHint = computed(() =>
  props.page.isEmployeeForm
    ? props.page.text("applicationForm.actions.saveDraftFirstHintEmployee")
    : props.page.text("applicationForm.actions.saveDraftFirstHintCandidate"),
)
const previousButtonLabel = computed(() => props.page.text("applicationForm.actions.previousStep"))
const nextButtonLabel = computed(() => props.page.text("applicationForm.actions.nextStep"))
const jumpLabel = computed(() => props.page.text("applicationForm.actions.jumpToStep"))
const submitButtonLabel = computed(() => {
  if (props.page.isSubmitting) {
    return props.page.text("common.submitting")
  }

  return props.page.isEmployeeForm
    ? props.page.text("applicationForm.actions.submitEmployeeForm")
    : props.page.text("applicationForm.actions.submitApplication")
})
const autosaveStatusLabel = computed(() => {
  switch (props.page.autosaveStatus) {
    case "saving":
      return props.page.text("applicationForm.autosave.saving")
    case "saved":
      return props.page.text("applicationForm.autosave.saved")
    case "offline":
      return props.page.text("applicationForm.autosave.offline")
    case "error":
      return props.page.text("applicationForm.autosave.syncFailed")
    default:
      return ""
  }
})
</script>
