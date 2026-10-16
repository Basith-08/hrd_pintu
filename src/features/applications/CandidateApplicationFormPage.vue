<template>
  <div class="page-shell page-shell--application">
    <transition name="overlay-fade">
      <div
        v-if="page.isBusy"
        class="page-busy-overlay"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="page-busy-overlay__card">
          <span class="page-busy-overlay__spinner" aria-hidden="true"></span>
          <p class="page-busy-overlay__label">{{ page.busyLabel }}</p>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="page.successMessage" class="toast-notification toast-notification--success" role="status" aria-live="polite">
        <div class="toast-notification__body">
          <span class="toast-notification__icon" aria-hidden="true">✓</span>
          <p class="toast-notification__message">{{ page.successMessage }}</p>
        </div>
        <button
          type="button"
          class="toast-notification__close"
          :aria-label="text('common.actions.close')"
          @click="page.dismissSuccessMessage()"
        >
          ×
        </button>
      </div>
    </transition>

    <section class="page-hero">
      <div class="page-header">
        <AppButton type="button" class="back-button" variant="ghost" @click="page.handleBack()">←</AppButton>
        <div class="page-header__content">
          <p class="page-eyebrow">{{ page.pageEyebrow }}</p>
          <h1>{{ page.pageTitle }}</h1>
          <p class="page-summary">{{ page.pageSummary }}</p>
        </div>
      </div>

      <aside class="summary-card summary-card--application">
        <div>
          <p class="section-eyebrow">{{ text("applicationForm.summary.title") }}</p>
          <h2>{{ page.readJobLabel(page.formRecord?.application?.job_snapshot, 'main_position') }}</h2>
        </div>
        <div class="summary-card__footer">
          <span class="status-pill" :data-status="page.formStatusKey">
            {{ page.completionStatusLabel }}
          </span>
        </div>
      </aside>
    </section>

    <p v-if="page.error" class="feedback feedback--error">{{ page.error }}</p>

    <section class="form-card form-card--application">
      <div class="application-wizard">
        <div class="application-wizard__header">
          <div>
            <p class="section-eyebrow">{{ page.text("applicationForm.wizard.eyebrow") }}</p>
            <h2>{{ page.activeStepLabel }}</h2>
            <p class="field-help">
              {{ page.text("applicationForm.wizard.progress", { current: page.activeStepNumber, total: page.totalSteps }) }}
            </p>
          </div>
        </div>

        <div class="application-stepper" role="tablist" :aria-label="page.text('applicationForm.wizard.ariaLabel')">
          <button
            v-for="step in page.wizardSteps"
            :key="step.key"
            type="button"
            class="application-stepper__item"
            :class="{
              'application-stepper__item--completed': step.position < page.activeStepIndex && step.isComplete,
              'application-stepper__item--incomplete': !step.isComplete && step.position <= page.activeStepIndex,
              'application-stepper__item--active': step.key === page.activeStepKey,
            }"
            :aria-current="step.key === page.activeStepKey ? 'step' : undefined"
            @click="page.setActiveStep(step.key)"
          >
            <span class="application-stepper__marker">
              <span v-if="!step.isComplete && step.position <= page.activeStepIndex">!</span>
              <span v-else-if="step.position < page.activeStepIndex">✓</span>
              <span v-else>{{ step.indexLabel }}</span>
            </span>
            <span class="application-stepper__text">{{ step.label }}</span>
          </button>
        </div>
      </div>

      <form class="form-stack" @submit.prevent @focusout="page.flushAutoSave()">
        <CandidateApplicationCandidateSections
          v-if="!page.isEmployeeForm"
          :page="page"
          :step-key="page.activeStepKey"
        />
        <EmployeePayrollSection
          v-if="page.isEmployeeForm && page.activeStepKey === 'payroll-statutory-data'"
          :page="page"
        />
        <ApplicationDocumentsSection
          v-if="page.activeStepKey === 'candidate-documents' || page.activeStepKey === 'employee-documents'"
          :page="page"
        />
        <CandidateApplicationFormActions :page="page" />
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"

import AppButton from "@/components/AppButton.vue"
import { useLocale } from "@/composables/useLocale"
import ApplicationDocumentsSection from "@/features/applications/components/ApplicationDocumentsSection.vue"
import CandidateApplicationCandidateSections from "@/features/applications/components/CandidateApplicationCandidateSections.vue"
import CandidateApplicationFormActions from "@/features/applications/components/CandidateApplicationFormActions.vue"
import EmployeePayrollSection from "@/features/applications/components/EmployeePayrollSection.vue"
import { useCandidateApplicationFormPage } from "@/features/applications/useCandidateApplicationFormPage"

const { text } = useLocale()
const page = reactive(useCandidateApplicationFormPage())
</script>
