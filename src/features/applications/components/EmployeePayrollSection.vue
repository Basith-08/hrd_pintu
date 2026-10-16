<template>
  <AppFormSection :title="text('applicationForm.sections.payrollStatutoryData')">
    <div class="field-grid">
      <AppTextField
        v-model="page.form.employee_payroll_profile.bank_name"
        :invalid="page.isFieldMissing(page.form.employee_payroll_profile.bank_name)"
        :label="page.requiredLabel(text('applicationForm.payroll.registeredBankName'))"
      />
      <AppTextField
        v-model="page.form.employee_payroll_profile.bank_account_number"
        :invalid="page.isFieldMissing(page.form.employee_payroll_profile.bank_account_number)"
        :label="page.requiredLabel(text('applicationForm.payroll.bankAccountNumber'))"
      />
      <AppTextField
        v-model="page.form.employee_payroll_profile.account_holder_name"
        :invalid="page.isFieldMissing(page.form.employee_payroll_profile.account_holder_name)"
        :label="page.requiredLabel(text('applicationForm.payroll.accountHolderName'))"
      />
      <AppTextField
        v-model="page.form.employee_payroll_profile.branch_name"
        :invalid="page.isFieldMissing(page.form.employee_payroll_profile.branch_name)"
        :label="page.requiredLabel(text('applicationForm.payroll.branchName'))"
      />
      <AppTextField
        v-model="page.form.employee_payroll_profile.tax_identification_number"
        :invalid="page.isFieldMissing(page.form.employee_payroll_profile.tax_identification_number)"
        :label="page.requiredLabel(text('common.taxIdentificationNumber'))"
      />
      <AppFieldGroup
        :invalid="page.isFieldMissing(page.form.employee_payroll_profile.bpjs_employment_status)"
        :label="page.requiredLabel(text('applicationForm.payroll.bpjsEmployment'))"
      >
        <AppSelectField
          v-model="page.form.employee_payroll_profile.bpjs_employment_status"
          :options="page.bpjsEmploymentStatusSelectOptions"
          :placeholder="text('common.select.status')"
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
