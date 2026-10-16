<template>
  <AppFormSection :title="text('applicationForm.sections.personalStatement')">
    <div class="field-grid">
      <AppCheckboxCard
        v-model="page.form.personal_statement.contract"
        :label="text('applicationForm.personalStatement.currentlyBoundByContract')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.business_trip"
        :label="text('applicationForm.personalStatement.willingForBusinessTrips')"
      />
      <AppTextField
        v-model="page.form.personal_statement.contract_period"
        :label="text('applicationForm.personalStatement.contractPeriod')"
      />
      <AppTextField
        v-model="page.form.personal_statement.expected_salary"
        min="0"
        type="number"
        value-type="number"
        :invalid="page.isFieldMissing(page.form.personal_statement.expected_salary)"
        :label="page.requiredLabel(text('applicationForm.personalStatement.expectedSalary'))"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.reference_check_allowed"
        :label="text('applicationForm.personalStatement.allowReferenceCheck')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.reference_check_reason"
        :label="text('applicationForm.personalStatement.reasonIfNotAllowed')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.family_or_friend_in_company"
        :label="text('applicationForm.personalStatement.haveFamilyOrFriends')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.family_or_friend_details"
        :label="text('applicationForm.personalStatement.familyFriendDetails')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.serious_illness"
        :label="text('applicationForm.personalStatement.seriousIllness')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.serious_illness_details"
        :label="text('applicationForm.personalStatement.seriousIllnessDetails')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.serious_accident_boolean"
        :label="text('applicationForm.personalStatement.seriousAccident')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.serious_accident_details"
        :label="text('applicationForm.personalStatement.seriousAccidentDetails')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.psychological_test"
        :label="text('applicationForm.personalStatement.psychologicalTest')"
      />
      <AppTextField
        v-model="page.form.personal_statement.psychological_test_location"
        :label="text('applicationForm.personalStatement.psychologicalTestLocation')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.psychological_test_purpose"
        full
        :label="text('applicationForm.personalStatement.psychologicalTestPurpose')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.company_legal_issue"
        :label="text('applicationForm.personalStatement.companyLegalIssue')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.company_legal_issue_details"
        :label="text('applicationForm.personalStatement.companyLegalIssueDetails')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.civil_or_criminal_case"
        :label="text('applicationForm.personalStatement.civilOrCriminalCase')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.civil_or_criminal_case_details"
        :label="text('applicationForm.personalStatement.civilOrCriminalCaseDetails')"
      />
      <AppCheckboxCard
        v-model="page.form.personal_statement.previous_application"
        :label="text('applicationForm.personalStatement.previousApplication')"
      />
      <AppTextareaField
        v-model="page.form.personal_statement.previous_application_details"
        :label="text('applicationForm.personalStatement.previousApplicationDetails')"
      />
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import AppCheckboxCard from "@/components/AppCheckboxCard.vue"
import AppFormSection from "@/components/AppFormSection.vue"
import AppTextField from "@/components/AppTextField.vue"
import AppTextareaField from "@/components/AppTextareaField.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()
</script>
