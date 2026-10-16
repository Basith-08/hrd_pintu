import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "#imports"

import { useLocale } from "@/composables/useLocale"
import {
  bpjsEmploymentStatusOptions,
  bloodTypeOptions,
  candidateDocumentTypes,
  createEmptyCandidateApplicationFormDraft,
  employeeDocumentTypes,
  familyCategoryOptions,
  genderOptions,
  languageProficiencyOptions,
  maritalStatusOptions,
  residenceOwnershipOptions,
  transportationOwnershipOptions,
  requiredCandidateDocumentTypes,
  type CandidateApplicationFormDraft,
  type CandidateLanguageInput,
  type CandidateReferenceInput,
  type CandidateSkillInput,
  type EducationHistoryInput,
  type EmployeeDocumentType,
  type EmployeePayrollProfileInput,
  type FamilyEmergencyInput,
  type PersonalStatementInput,
  type WorkHistoryInput,
} from "@/domain/entities/CandidateApplicationForm"
import { getPublicAppConfig } from "@/infrastructure/runtime/publicConfig"
import { supabase } from "@/infrastructure/supabase/client"
import {
  downloadGeneratedEmployeeDocumentTemplate,
  hasGeneratedEmployeeDocumentTemplate,
} from "@/features/applications/employeeDocumentTemplateDownload"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"
import { useCandidateApplicationFormViewModel } from "@/viewmodels/useCandidateApplicationFormViewModel"
import { useAutoSave } from "@/composables/useAutoSave"
import { getCandidateApplicationDraftStorageKey, syncCandidateApplicationDraft } from "@/services/draft.service"

type ApplicationFormStepKey =
  | "application-data"
  | "personal-data"
  | "contact-identity"
  | "family-emergency"
  | "education-training"
  | "skill-abilities"
  | "employment-history"
  | "reference-data"
  | "mobility-residence"
  | "personal-statement"
  | "candidate-documents"
  | "payroll-statutory-data"
  | "employee-documents"

type WizardStepDescriptor = {
  key: ApplicationFormStepKey
  label: string
  indexLabel: string
  position: number
  isComplete: boolean
}

const candidateWizardStepKeys: ApplicationFormStepKey[] = [
  "application-data",
  "personal-data",
  "contact-identity",
  "family-emergency",
  "education-training",
  "skill-abilities",
  "employment-history",
  "reference-data",
  "mobility-residence",
  "personal-statement",
  "candidate-documents",
]

const employeeWizardStepKeys: ApplicationFormStepKey[] = [
  "payroll-statutory-data",
  "employee-documents",
]

const applicationFormStepFieldMap: Record<ApplicationFormStepKey, (keyof CandidateApplicationFormDraft)[]> = {
  "application-data": ["date_application", "notice_period", "available_start_date", "hire_location"],
  "personal-data": [
    "photograph",
    "full_name",
    "gender",
    "place_of_birth",
    "date_of_birth",
    "nationality",
    "religion",
    "marital_status",
    "blood_type",
    "ethnic",
  ],
  "contact-identity": [
    "id_card_address",
    "residential_address",
    "personal_email",
    "instagram",
    "linkedin",
    "phone_number",
    "id_type",
    "id_no",
  ],
  "family-emergency": ["family_and_emergency"],
  "education-training": ["education"],
  "skill-abilities": ["candidate_languages", "candidate_skills"],
  "employment-history": ["work_history"],
  "reference-data": ["candidate_references"],
  "mobility-residence": [
    "transportation_type",
    "transportation_ownership",
    "residence_ownership",
  ],
  "personal-statement": ["personal_statement"],
  "candidate-documents": ["employee_documents"],
  "payroll-statutory-data": ["employee_payroll_profile"],
  "employee-documents": ["employee_documents"],
}

export function useCandidateApplicationFormPage() {
  const route = useRoute()
  const router = useRouter()
  const { text } = useLocale()
  const { syncApplication, user } = useAuthViewModel()
  const { error, form: formRecordRef, isLoading, isSaving, isSubmitting, load, save, submit } =
    useCandidateApplicationFormViewModel()
  const { candidateDocumentBucket, candidatePhotographBucket } = getPublicAppConfig()
  const maxPhotographSizeInBytes = 5 * 1024 * 1024
  const maxEmployeeDocumentSizeInBytes = 10 * 1024 * 1024

  const successMessage = ref("")
  let successMessageTimer: number | null = null
  const applicationId = computed(() => String(route.params.applicationId ?? ""))
  const activeStepKey = ref<ApplicationFormStepKey>("application-data")
  const lastSavedDraft = ref<CandidateApplicationFormDraft | null>(null)

  function dismissSuccessMessage() {
    successMessage.value = ""

    if (successMessageTimer) {
      clearTimeout(successMessageTimer)
      successMessageTimer = null
    }
  }

  function showSuccessMessage(message: string) {
    dismissSuccessMessage()
    successMessage.value = message

    if (typeof window === "undefined") {
      return
    }

    successMessageTimer = window.setTimeout(() => {
      successMessage.value = ""
      successMessageTimer = null
    }, 3600)
  }

  const formRecord = computed(() => formRecordRef.value)
  const activePortalRole = computed(
    () => form.role || formRecord.value?.role || user.value?.role || "candidate",
  )
  const isEmployeeForm = computed(() => activePortalRole.value === "employee")
  const hasCompletedFormStatus = computed(() =>
    formRecord.value?.completion_status === "completed" ||
    formRecord.value?.completion_status === "employee_draf_contract",
  )
  const isFormSubmittedAndCompleted = computed(() => hasCompletedFormStatus.value)
  const isEmployeeDraftContractStage = computed(() => false)
  const pageEyebrow = computed(() =>
    isEmployeeForm.value
      ? text("applicationForm.page.eyebrow.employee")
      : text("applicationForm.page.eyebrow.candidate"),
  )
  const pageTitle = computed(() =>
    isEmployeeForm.value
      ? text("applicationForm.page.title.employee")
      : text("applicationForm.page.title.candidate"),
  )
  const pageSummary = computed(() =>
    isEmployeeForm.value
      ? text("applicationForm.page.summary.employee")
      : text("applicationForm.page.summary.candidate"),
  )
  const formStatusKey = computed(() =>
    hasCompletedFormStatus.value ? "completed" : formRecord.value?.completion_status || "in_progress",
  )
  const completionStatusLabel = computed(() =>
    hasCompletedFormStatus.value ? text("status.completed") : text("status.inProgress"),
  )
  const isBusy = computed(
    () =>
      isLoading.value ||
      isSaving.value ||
      isSubmitting.value ||
      isUploadingAnyFile.value,
  )
  const busyLabel = computed(() => {
    if (isSaving.value) {
      return text("common.saving")
    }

    if (isSubmitting.value) {
      return text("common.submitting")
    }

    if (isUploadingAnyFile.value) {
      return text("common.processing")
    }

    return text("common.loading")
  })

  const formalEducationLevels = [
    { level: "SD / Sederajat", label: "SD" },
    { level: "SMP / MTs / Sederajat", label: "SMP" },
    { level: "SMA / SMK / MA / Sederajat", label: "SMA" },
    { level: "Diploma III (D3)", label: "D-3" },
    { level: "Sarjana (S1)", label: "S-1" },
    { level: "Magister (S2)", label: "S-2" },
    { level: "Doktor (S3)", label: "S-3" },
  ] as const
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 1949 }, (_, index) => currentYear - index)

  const familySectionConfigs = computed(() => [
    {
      key: "spouse",
      category: "Spouse",
      label: text("applicationForm.family.spouse.label"),
      shortLabel: text("common.familyCategory.spouse"),
    },
    {
      key: "child",
      category: "Child",
      label: text("applicationForm.family.child.label"),
      shortLabel: text("common.familyCategory.child"),
    },
    {
      key: "parent",
      category: "Parent",
      label: text("applicationForm.family.parent.label"),
      shortLabel: text("common.familyCategory.parent"),
    },
    {
      key: "sibling",
      category: "Sibling",
      label: text("applicationForm.family.sibling.label"),
      shortLabel: text("common.familyCategory.sibling"),
    },
    {
      key: "emergency-contact",
      category: "Emergency Contact",
      label: text("common.familyCategory.emergencyContact"),
      shortLabel: text("common.contact"),
    },
    {
      key: "other",
      category: "Other",
      label: text("applicationForm.family.other.label"),
      shortLabel: text("common.family"),
    },
  ])

  const form = reactive(createEmptyForm())

  const autosave = useAutoSave<CandidateApplicationFormDraft>({
    storageKey: () => getCandidateApplicationDraftStorageKey(applicationId.value),
    source: () => buildPayload(),
    syncFn: (payload) => syncCandidateApplicationDraft(applicationId.value, payload),
  })

  watch(form, () => autosave.scheduleSave(), { deep: true })

  const selectedPhotographFile = ref<File | null>(null)
  const uploadingPhotograph = ref(false)
  const photographPreviewUrl = ref("")
  const uploadingEmployeeDocuments = ref(false)
  const selectedEmployeeDocumentFiles = reactive(createEmptySelectedEmployeeDocumentFiles())
  const applicationDataFields = computed<
    Array<{
      model: "date_application" | "notice_period" | "available_start_date" | "hire_location"
      label: string
      type: "date" | "text"
      fullWidth?: boolean
      invalid?: boolean
    }>
  >(() => [
    {
      model: "date_application",
      label: requiredLabel(text("applicationForm.fields.applicationDate")),
      type: "date",
      invalid: isFieldMissing(form.date_application),
    },
    {
      model: "notice_period",
      label: requiredLabel(text("applicationForm.fields.noticePeriod")),
      type: "date",
      invalid: isFieldMissing(form.notice_period),
    },
    {
      model: "available_start_date",
      label: requiredLabel(text("applicationForm.fields.availableStartDate")),
      type: "date",
      invalid: isFieldMissing(form.available_start_date),
    },
    {
      model: "hire_location",
      label: requiredLabel(text("applicationForm.fields.hireLocation")),
      type: "text",
      invalid: isFieldMissing(form.hire_location),
      fullWidth: true,
    },
  ])
  const bpjsEmploymentStatusSelectOptions = computed(() =>
    bpjsEmploymentStatusOptions.map((option) => ({
      value: option,
      label:
        option === "cash_out_first"
          ? text("applicationForm.payroll.bpjsEmploymentStatus.cashOutFirst")
          : option === "enroll_new"
            ? text("applicationForm.payroll.bpjsEmploymentStatus.enrollAsNew")
            : text("applicationForm.payroll.bpjsEmploymentStatus.continueExisting"),
    })),
  )
  const isUploadingAnyFile = computed(
    () => uploadingPhotograph.value || uploadingEmployeeDocuments.value,
  )
  const candidateDocumentTypeSet = new Set<EmployeeDocumentType>(candidateDocumentTypes)
  const employeeOnlyDocumentTypeSet = new Set<EmployeeDocumentType>(
    employeeDocumentTypes.filter((documentType) => !candidateDocumentTypeSet.has(documentType)),
  )
  const requiredCandidateDocumentTypeSet = new Set<EmployeeDocumentType>(requiredCandidateDocumentTypes)
  const optionalEmployeeDocumentTypes = new Set<EmployeeDocumentType>([
    "bpjs_health_statement",
  ])
  const hiddenEmployeeDocumentTypes = new Set<EmployeeDocumentType>([
    "certificate_of_employment",
    "bpjs_health_statement",
  ])
  const requiredEmployeeDocumentTypes = employeeDocumentTypes.filter(
    (documentType) =>
      employeeOnlyDocumentTypeSet.has(documentType) && !optionalEmployeeDocumentTypes.has(documentType),
  )
  const employeeDocumentTemplateUrls: Partial<Record<EmployeeDocumentType, string>> = {
    integrity_pact: "/templates/Form_Pakta_Integritas.doc",
    email_usage_policy: "/templates/Kebijakan_dan_Aturan_Penggunaan_Email_Korporat.doc",
  }
  const employeeDocumentSectionTitle = computed(() =>
    isEmployeeForm.value
      ? text("applicationForm.sections.employeeDocuments")
      : text("applicationForm.sections.candidateDocuments"),
  )
  const wizardSteps = computed<WizardStepDescriptor[]>(() => {
    const stepKeys = isEmployeeForm.value ? employeeWizardStepKeys : candidateWizardStepKeys
    const completionByStepKey = new Map(
      requiredSectionCompletionEntries.value.map((entry) => [entry.stepKey, entry.isComplete]),
    )

    return stepKeys.map((key, position) => ({
      key,
      label: getStepLabel(key),
      indexLabel: String(position + 1),
      position,
      isComplete: completionByStepKey.get(key) ?? true,
    }))
  })
  const activeStepIndex = computed(() => {
    const index = wizardSteps.value.findIndex((step) => step.key === activeStepKey.value)
    return index >= 0 ? index : 0
  })
  const activeStep = computed(() => wizardSteps.value[activeStepIndex.value] ?? wizardSteps.value[0] ?? null)
  const activeStepLabel = computed(() => activeStep.value?.label ?? "")
  const activeStepNumber = computed(() => activeStepIndex.value + 1)
  const totalSteps = computed(() => wizardSteps.value.length)
  const isFirstStep = computed(() => activeStepIndex.value <= 0)
  const isLastStep = computed(() => activeStepIndex.value >= wizardSteps.value.length - 1)

  const employeeDocumentRows = computed(() =>
    employeeDocumentTypes
      .filter((documentType) =>
        isEmployeeForm.value
          ? employeeOnlyDocumentTypeSet.has(documentType) &&
            !hiddenEmployeeDocumentTypes.has(documentType)
          : candidateDocumentTypeSet.has(documentType),
      )
      .map((documentType) => ({
        documentType,
        label: getEmployeeDocumentLabel(documentType),
        files: form.employee_documents?.[documentType] ?? [],
        selectedFiles: selectedEmployeeDocumentFiles[documentType] ?? [],
        downloadUrl: isEmployeeForm.value ? (employeeDocumentTemplateUrls[documentType] ?? "") : "",
        isRequired: isEmployeeForm.value
          ? !optionalEmployeeDocumentTypes.has(documentType)
          : requiredCandidateDocumentTypeSet.has(documentType),
        note: documentType === "integrity_pact" ? text("files.integrityPactPrintNote") : "",
      })),
  )

  const groupedFamilySections = computed(() =>
    familySectionConfigs.value.map((section) => ({
      ...section,
      items: form.family_and_emergency
        .map((item, formIndex) => ({ item, formIndex }))
        .filter((entry) => String(entry.item.category ?? "").trim() === section.category),
    })),
  )

  const localizedGenderOptions = computed(() =>
    genderOptions.map((option) => ({
      value: option,
      label:
        option === "Male" ? text("common.genderOptions.male") : text("common.genderOptions.female"),
    })),
  )

  const localizedMaritalStatusOptions = computed(() =>
    maritalStatusOptions.map((option) => ({
      value: option,
      label:
        option === "Single"
          ? text("common.maritalStatus.single")
          : option === "Married"
            ? text("common.maritalStatus.married")
            : text("common.maritalStatus.divorced"),
    })),
  )

  const localizedBloodTypeOptions = computed(() =>
    bloodTypeOptions.map((option) => ({
      value: option,
      label: option,
    })),
  )

  const localizedFamilyCategoryOptions = computed(() =>
    familyCategoryOptions.map((option) => ({
      value: option,
      label:
        option === "Spouse"
          ? text("common.familyCategory.spouse")
          : option === "Child"
            ? text("common.familyCategory.child")
            : option === "Parent"
              ? text("common.familyCategory.parent")
              : option === "Sibling"
                ? text("common.familyCategory.sibling")
                : option === "Emergency Contact"
                  ? text("common.familyCategory.emergencyContact")
                  : text("common.option.other"),
    })),
  )

  const localizedParentRelationshipOptions = computed(() => [
    {
      value: "Father",
      label: text("common.parentRelationship.father"),
    },
    {
      value: "Mother",
      label: text("common.parentRelationship.mother"),
    },
  ])

  const localizedLanguageProficiencyOptions = computed(() =>
    languageProficiencyOptions.map((option) => ({
      value: option,
      label:
        option === "Good"
          ? text("common.proficiencyOptions.good")
          : option === "Fair"
            ? text("common.proficiencyOptions.fair")
            : text("common.proficiencyOptions.poor"),
    })),
  )

  const localizedTransportationOwnershipOptions = computed(() =>
    transportationOwnershipOptions.map((option) => ({
      value: option,
      label:
        option === "Personal"
          ? text("common.option.personal")
          : option === "Office"
            ? text("common.option.office")
            : text("common.option.other"),
    })),
  )

  const localizedResidenceOwnershipOptions = computed(() =>
    residenceOwnershipOptions.map((option) => ({
      value: option,
      label:
        option === "Personal"
          ? text("common.option.personal")
          : option === "Rent"
            ? text("common.residenceOwnership.rent")
            : option === "Boarding"
              ? text("common.residenceOwnership.boarding")
              : option === "Parents"
                ? text("common.residenceOwnership.parents")
                : text("common.option.other"),
    })),
  )

  const formalEducationRows = computed(() =>
    formalEducationLevels.map((config) => ({
      ...config,
      item:
        form.education.find(
          (item) => item.category === "Formal Education" && item.level === config.level,
        ) ?? createEducationItem({ category: "Formal Education", level: config.level }),
    })),
  )

  const nonFormalEducationRows = computed(() =>
    form.education
      .map((item, formIndex) => ({ item, formIndex }))
      .filter((entry) => entry.item.category !== "Formal Education"),
  )

  const isApplicationDataComplete = computed(
    () =>
      hasText(form.date_application) &&
      hasText(form.notice_period) &&
      hasText(form.available_start_date) &&
      hasText(form.hire_location),
  )

  const isPersonalDataComplete = computed(
    () =>
      hasText(form.full_name) &&
      hasText(form.gender) &&
      hasText(form.place_of_birth) &&
      hasText(form.date_of_birth) &&
      hasText(form.nationality) &&
      hasText(form.religion) &&
      hasText(form.marital_status) &&
      hasText(form.blood_type) &&
      hasText(form.ethnic) &&
      (hasText(form.photograph) || selectedPhotographFile.value !== null),
  )

  const isContactIdentityComplete = computed(
    () =>
      hasText(form.id_card_address) &&
      hasText(form.residential_address) &&
      hasText(form.personal_email) &&
      hasText(form.phone_number) &&
      hasText(form.instagram) &&
      hasText(form.linkedin) &&
      hasText(form.id_type) &&
      hasText(form.id_no),
  )

  const hasRequiredEmergencyContact = computed(() =>
    form.family_and_emergency.some(
      (item) =>
        normalizeTextInput(item.category) === "Emergency Contact" &&
        hasText(item.name) &&
        hasText(item.relationship),
    ),
  )

  const hasRequiredParentEntries = computed(
    () => hasRequiredParent([/^father$/i]) && hasRequiredParent([/^mother$/i]),
  )

  const isRequiredFormalEducationComplete = computed(() =>
    ["SD / Sederajat", "SMP / MTs / Sederajat", "SMA / SMK / MA / Sederajat"].every((level) =>
      hasFormalEducationInstitution(level),
    ),
  )

  const hasCompleteFirstWorkHistoryEntry = computed(() => {
    const firstEntry = form.work_history[0]
    return Boolean(
      firstEntry &&
        hasText(firstEntry.company) &&
        hasText(firstEntry.position) &&
        firstEntry.from_year !== null &&
        firstEntry.to_year !== null &&
        hasText(firstEntry.reason_to_quitting),
    )
  })

  const hasMinimumReferences = computed(
    () => form.candidate_references.filter(isCompleteReference).length >= 2,
  )

  const isMobilityResidenceComplete = computed(
    () =>
      hasText(form.transportation_type) &&
      hasText(form.transportation_ownership) &&
      hasText(form.residence_ownership),
  )

  const hasExpectedSalary = computed(() => form.personal_statement.expected_salary !== null)

  const hasRequiredCandidateDocuments = computed(() =>
    requiredCandidateDocumentTypes.every(
      (documentType) =>
        (form.employee_documents[documentType] ?? []).length > 0 ||
        (selectedEmployeeDocumentFiles[documentType] ?? []).length > 0,
    ),
  )

  const isEmployeePayrollComplete = computed(() => {
    const profile = form.employee_payroll_profile

    return (
      hasText(profile.bank_name) &&
      hasText(profile.bank_account_number) &&
      hasText(profile.account_holder_name) &&
      hasText(profile.branch_name) &&
      hasText(profile.tax_identification_number) &&
      hasText(profile.bpjs_employment_status)
    )
  })

  const hasRequiredEmployeeDocuments = computed(() =>
    requiredEmployeeDocumentTypes.every(
      (documentType) =>
        (form.employee_documents[documentType] ?? []).length > 0 ||
        (selectedEmployeeDocumentFiles[documentType] ?? []).length > 0,
    ),
  )

  const canSubmitForm = computed(() => {
    if (isEmployeeForm.value) {
      return isEmployeePayrollComplete.value && hasRequiredEmployeeDocuments.value
    }

    return (
      isApplicationDataComplete.value &&
      isPersonalDataComplete.value &&
      isContactIdentityComplete.value &&
      hasRequiredEmergencyContact.value &&
      hasRequiredParentEntries.value &&
      isRequiredFormalEducationComplete.value &&
      hasCompleteFirstWorkHistoryEntry.value &&
      hasMinimumReferences.value &&
      isMobilityResidenceComplete.value &&
      hasExpectedSalary.value &&
      hasRequiredCandidateDocuments.value
    )
  })

  const submitValidationMessage = computed(() => text("applicationForm.validation.completeRequiredFields"))

  const requiredSectionCompletionEntries = computed<
    { stepKey: ApplicationFormStepKey; isComplete: boolean }[]
  >(() => [
    { stepKey: "application-data", isComplete: isApplicationDataComplete.value },
    { stepKey: "personal-data", isComplete: isPersonalDataComplete.value },
    { stepKey: "contact-identity", isComplete: isContactIdentityComplete.value },
    {
      stepKey: "family-emergency",
      isComplete: hasRequiredEmergencyContact.value && hasRequiredParentEntries.value,
    },
    { stepKey: "education-training", isComplete: isRequiredFormalEducationComplete.value },
    { stepKey: "employment-history", isComplete: hasCompleteFirstWorkHistoryEntry.value },
    { stepKey: "reference-data", isComplete: hasMinimumReferences.value },
    { stepKey: "mobility-residence", isComplete: isMobilityResidenceComplete.value },
    { stepKey: "personal-statement", isComplete: hasExpectedSalary.value },
    { stepKey: "candidate-documents", isComplete: hasRequiredCandidateDocuments.value },
    { stepKey: "payroll-statutory-data", isComplete: isEmployeePayrollComplete.value },
    { stepKey: "employee-documents", isComplete: hasRequiredEmployeeDocuments.value },
  ])

  const incompleteRequiredSectionLabels = computed(() =>
    requiredSectionCompletionEntries.value
      .filter((entry) => !entry.isComplete)
      .map((entry) => getStepLabel(entry.stepKey)),
  )

  function createFamilyItem(): FamilyEmergencyInput {
    return {
      name: "",
      relationship: "",
      gender: "",
      place_and_date_of_birth: "",
      education: "",
      description: "",
      occupation: "",
      remarks: "",
      category: "",
    }
  }

  function createEducationItem(
    overrides: Partial<EducationHistoryInput> = {},
  ): EducationHistoryInput {
    return {
      level: "",
      institution: "",
      city: "",
      major: "",
      from_year: null,
      to_year: null,
      category: "",
      description: "",
      ...overrides,
    }
  }

  function createWorkHistoryItem(): WorkHistoryInput {
    return {
      company: "",
      position: "",
      from_year: null,
      to_year: null,
      reason_to_quitting: "",
      last_salary: null,
      benefit: "",
      description: "",
      company_address: "",
      company_phone: "",
      direct_superior_title: "",
      organization_structure: "",
    }
  }

  function createLanguageItem(): CandidateLanguageInput {
    return {
      language_name: "",
      speaking: "",
      reading: "",
      listening: "",
      writing: "",
    }
  }

  function createSkillItem(): CandidateSkillInput {
    return {
      skill_name: "",
      description: "",
      skill_order: null,
    }
  }

  function createReferenceItem(): CandidateReferenceInput {
    return {
      name: "",
      phone_number: "",
      relationship: "",
      position: "",
      reference_order: null,
    }
  }

  function createPersonalStatement(): PersonalStatementInput {
    return {
      contract: false,
      contract_period: "",
      reference_check_reason: "",
      business_trip: false,
      expected_salary: null,
      previous_application: false,
      previous_application_details: "",
      reference_check_allowed: false,
      family_or_friend_in_company: false,
      serious_illness: false,
      serious_illness_details: "",
      serious_accident_boolean: false,
      psychological_test: false,
      psychological_test_location: "",
      psychological_test_purpose: "",
      company_legal_issue: false,
      company_legal_issue_details: "",
      family_or_friend_details: "",
      serious_accident_details: "",
      civil_or_criminal_case: false,
      civil_or_criminal_case_details: "",
    }
  }

  function createEmployeePayrollProfile(): EmployeePayrollProfileInput {
    return {
      bank_name: "",
      bank_account_number: "",
      account_holder_name: "",
      branch_name: "",
      tax_identification_number: "",
      bpjs_health_enrollment_preference: "",
      bpjs_health_decline_reason: "",
      bpjs_health_decline_reason_other: "",
      bpjs_employment_status: "",
    }
  }

  function createEmptySelectedEmployeeDocumentFiles(): Record<EmployeeDocumentType, File[]> {
    return employeeDocumentTypes.reduce((documents, documentType) => {
      documents[documentType] = []
      return documents
    }, {} as Record<EmployeeDocumentType, File[]>)
  }

  function getEmployeeDocumentLabel(documentType: EmployeeDocumentType) {
    switch (documentType) {
      case "cv":
        return "CV"
      case "integrity_pact":
        return text("documents.integrityPact")
      case "email_usage_policy":
        return text("documents.emailUsagePolicy")
      case "identity_card":
        return text("documents.identityCard")
      case "family_card":
        return text("documents.familyCard")
      case "latest_diploma":
        return text("documents.latestDiploma")
      case "academic_transcript":
        return text("documents.academicTranscript")
      case "certificate_of_employment":
        return text("documents.certificateOfEmployment")
      case "tax_id":
        return text("common.taxIdentificationNumber")
      case "bpjs_health_card":
        return text("documents.bpjsHealthCard")
      case "bpjs_health_statement":
        return text("documents.bpjsHealthStatement")
      case "bpjs_employment_card":
        return text("documents.bpjsEmploymentCard")
      case "bank_account_book":
        return text("documents.bankAccountBook")
      default:
        return documentType
    }
  }

  function dedupeFiles(files: File[]) {
    const seen = new Set<string>()

    return files.filter((file) => {
      const key = [file.name, file.size, file.lastModified, file.type].join(":")
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  function getEmployeeDocumentAccept(documentType: EmployeeDocumentType) {
    return ".pdf,image/*"
  }

  function dedupeDocumentPaths(paths: string[]) {
    return [...new Set(paths.map((path) => path.trim()).filter(Boolean))]
  }

  function ensureMinimumItems<T>(items: T[], minimumCount: number, createFallback: () => T) {
    const nextItems = [...items]

    while (nextItems.length < minimumCount) {
      nextItems.push(createFallback())
    }

    return nextItems
  }

  function createEmptyForm(): CandidateApplicationFormDraft {
    return {
      ...createEmptyCandidateApplicationFormDraft(),
      family_and_emergency: [createFamilyItem()],
      education: [
        ...formalEducationLevels.map((item) =>
          createEducationItem({
            category: "Formal Education",
            level: item.level,
          }),
        ),
        createEducationItem({
          category: "Training / Non-Formal",
        }),
      ],
      work_history: [createWorkHistoryItem()],
      candidate_languages: ensureMinimumItems([], 3, createLanguageItem),
      candidate_skills: ensureMinimumItems([], 3, createSkillItem),
      candidate_references: [createReferenceItem()],
      employee_payroll_profile: createEmployeePayrollProfile(),
      personal_statement: createPersonalStatement(),
    }
  }

  function normalizeNumberInput(value: unknown) {
    if (value === "" || value === null || value === undefined) {
      return null
    }

    const nextValue = Number(value)
    return Number.isFinite(nextValue) ? nextValue : null
  }

  function normalizeTextInput(value: unknown) {
    return typeof value === "string" ? value.trim() : ""
  }

  function requiredLabel(label: string, required = true) {
    return required ? `${label} *` : label
  }

  function hasText(value: unknown) {
    return normalizeTextInput(value).length > 0
  }

  function isFieldMissing(value: unknown, required = true) {
    if (!required) {
      return false
    }

    if (value === null || value === undefined) {
      return true
    }

    return typeof value === "string" ? !hasText(value) : false
  }

  function isRequiredFormalEducationLevel(level: string) {
    return ["SD / Sederajat", "SMP / MTs / Sederajat", "SMA / SMK / MA / Sederajat"].includes(
      normalizeTextInput(level),
    )
  }

  function hasFormalEducationInstitution(level: string) {
    return form.education.some(
      (item) =>
        normalizeTextInput(item.category) === "Formal Education" &&
        normalizeTextInput(item.level) === level &&
        hasText(item.institution),
    )
  }

  function hasRequiredParent(patterns: RegExp[]) {
    return form.family_and_emergency.some(
      (item) =>
        normalizeTextInput(item.category) === "Parent" &&
        patterns.some((pattern) => pattern.test(normalizeTextInput(item.relationship))) &&
        hasText(item.name) &&
        hasText(item.gender) &&
        hasText(item.occupation) &&
        hasText(item.place_and_date_of_birth) &&
        hasText(item.education),
    )
  }

  function isCompleteReference(item: CandidateReferenceInput) {
    return (
      hasText(item.name) &&
      hasText(item.phone_number) &&
      hasText(item.relationship) &&
      hasText(item.position)
    )
  }

  function syncDraft(nextDraft: CandidateApplicationFormDraft) {
    const draft = nextDraft ?? createEmptyCandidateApplicationFormDraft()
    form.role = draft.role ?? "candidate"

    form.photograph = draft.photograph ?? ""
    form.date_application = draft.date_application ?? ""
    form.notice_period = draft.notice_period ?? ""
    form.available_start_date = draft.available_start_date ?? ""
    form.join_date = draft.join_date ?? ""
    form.hire_location = draft.hire_location ?? ""
    form.full_name = draft.full_name ?? ""
    form.gender = draft.gender ?? ""
    form.place_of_birth = draft.place_of_birth ?? ""
    form.date_of_birth = draft.date_of_birth ?? ""
    form.nationality = draft.nationality ?? ""
    form.religion = draft.religion ?? ""
    form.marital_status = draft.marital_status ?? ""
    form.blood_type = draft.blood_type ?? ""
    form.ethnic = draft.ethnic ?? ""
    form.id_card_address = draft.id_card_address ?? ""
    form.residential_address = draft.residential_address ?? ""
    form.personal_email = draft.personal_email ?? ""
    form.instagram = draft.instagram ?? ""
    form.linkedin = draft.linkedin ?? ""
    form.phone_number = draft.phone_number || ""
    form.id_type = draft.id_type ?? ""
    form.id_no = draft.id_no ?? ""
    form.transportation_type = draft.transportation_type ?? ""
    form.transportation_ownership = draft.transportation_ownership ?? ""
    form.residence_ownership = draft.residence_ownership ?? ""
    form.employee_payroll_profile = {
      ...createEmployeePayrollProfile(),
      ...draft.employee_payroll_profile,
    }
    form.employee_documents = employeeDocumentTypes.reduce((documents, documentType) => {
      documents[documentType] = Array.isArray(draft.employee_documents?.[documentType])
        ? draft.employee_documents[documentType]
        : []
      return documents
    }, {} as CandidateApplicationFormDraft["employee_documents"])
    for (const documentType of employeeDocumentTypes) {
      selectedEmployeeDocumentFiles[documentType] = []
    }

    form.family_and_emergency.splice(
      0,
      form.family_and_emergency.length,
      ...mapListOrDefault(
        draft.family_and_emergency ?? [],
        (item) => ({
          name: item.name ?? "",
          relationship: item.relationship ?? "",
          gender: item.gender ?? "",
          place_and_date_of_birth: item.place_and_date_of_birth ?? "",
          education: item.education ?? "",
          description: item.description ?? "",
          occupation: item.occupation ?? "",
          remarks: item.remarks ?? "",
          category: item.category ?? "",
        }),
        createFamilyItem,
      ),
    )

    form.education.splice(
      0,
      form.education.length,
      ...buildEducationFormItems(draft.education ?? []),
    )

    form.work_history.splice(
      0,
      form.work_history.length,
      ...mapListOrDefault(
        draft.work_history ?? [],
        (item) => ({
          company: item.company ?? "",
          position: item.position ?? "",
          from_year: normalizeNumberInput(item.from_year),
          to_year: normalizeNumberInput(item.to_year),
          reason_to_quitting: item.reason_to_quitting ?? "",
          last_salary: normalizeNumberInput(item.last_salary),
          benefit: item.benefit ?? "",
          description: item.description ?? "",
          company_address: item.company_address ?? "",
          company_phone: item.company_phone ?? "",
          direct_superior_title: item.direct_superior_title ?? "",
          organization_structure: item.organization_structure ?? "",
        }),
        createWorkHistoryItem,
      ),
    )

    form.candidate_languages.splice(
      0,
      form.candidate_languages.length,
      ...ensureMinimumItems(
        (draft.candidate_languages ?? []).map((item) => ({
          language_name: item.language_name ?? "",
          speaking: item.speaking ?? "",
          reading: item.reading ?? "",
          listening: item.listening ?? "",
          writing: item.writing ?? "",
        })),
        3,
        createLanguageItem,
      ),
    )

    form.candidate_skills.splice(
      0,
      form.candidate_skills.length,
      ...ensureMinimumItems(
        (draft.candidate_skills ?? []).map((item) => ({
          skill_name: item.skill_name ?? "",
          description: item.description ?? "",
          skill_order: normalizeNumberInput(item.skill_order),
        })),
        3,
        createSkillItem,
      ),
    )

    form.candidate_references.splice(
      0,
      form.candidate_references.length,
      ...mapListOrDefault(
        draft.candidate_references ?? [],
        (item) => ({
          name: item.name ?? "",
          phone_number: item.phone_number ?? "",
          relationship: item.relationship ?? "",
          position: item.position ?? "",
          reference_order: normalizeNumberInput(item.reference_order),
        }),
        createReferenceItem,
      ),
    )

    form.personal_statement = {
      ...createPersonalStatement(),
      ...draft.personal_statement,
      expected_salary: normalizeNumberInput(draft.personal_statement?.expected_salary),
    }
  }

  function buildEducationFormItems(items: EducationHistoryInput[]) {
    const mappedItems = items.map((item) => ({
      level: item.level ?? "",
      institution: item.institution ?? "",
      city: item.city ?? "",
      major: item.major ?? "",
      from_year: normalizeNumberInput(item.from_year),
      to_year: normalizeNumberInput(item.to_year),
      category: item.category ?? "",
      description: item.description ?? "",
    }))

    const formalRows = formalEducationLevels.map((config) => {
      const existing = mappedItems.find(
        (item) => item.category === "Formal Education" && item.level === config.level,
      )

      return (
        existing ??
        createEducationItem({
          category: "Formal Education",
          level: config.level,
        })
      )
    })

    const nonFormalRows = mappedItems.filter((item) => item.category !== "Formal Education")

    return [
      ...formalRows,
      ...(nonFormalRows.length > 0
        ? nonFormalRows
        : [createEducationItem({ category: "Training / Non-Formal" })]),
    ]
  }

  function mapListOrDefault<TSource, TOutput>(
    items: TSource[],
    mapper: (item: TSource) => TOutput,
    createFallback: () => TOutput,
  ) {
    return items.length > 0 ? items.map(mapper) : [createFallback()]
  }

  function buildPayload(): CandidateApplicationFormDraft {
    return {
      ...createEmptyCandidateApplicationFormDraft(),
      ...form,
      role: activePortalRole.value,
      phone_number: normalizeTextInput(form.phone_number),
      family_and_emergency: form.family_and_emergency.map((item) => ({ ...item })),
      education: form.education.map((item) => ({
        ...item,
        from_year: normalizeNumberInput(item.from_year),
        to_year: normalizeNumberInput(item.to_year),
      })),
      work_history: form.work_history.map((item) => ({
        ...item,
        from_year: normalizeNumberInput(item.from_year),
        to_year: normalizeNumberInput(item.to_year),
        last_salary: normalizeNumberInput(item.last_salary),
      })),
      candidate_languages: form.candidate_languages.map((item) => ({ ...item })),
      candidate_skills: form.candidate_skills.map((item, index) => ({
        ...item,
        skill_order: normalizeNumberInput(item.skill_order) ?? index + 1,
      })),
      candidate_references: form.candidate_references.map((item, index) => ({
        ...item,
        reference_order: normalizeNumberInput(item.reference_order) ?? index + 1,
      })),
      employee_payroll_profile: {
        ...form.employee_payroll_profile,
      },
      employee_documents: employeeDocumentTypes.reduce((documents, documentType) => {
        documents[documentType] = [...(form.employee_documents?.[documentType] ?? [])]
        return documents
      }, {} as CandidateApplicationFormDraft["employee_documents"]),
      personal_statement: {
        ...form.personal_statement,
        expected_salary: normalizeNumberInput(form.personal_statement.expected_salary),
      },
    }
  }

  function cloneDraft<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
  }

  function isStepKey(stepKey: string): stepKey is ApplicationFormStepKey {
    return Object.prototype.hasOwnProperty.call(applicationFormStepFieldMap, stepKey)
  }

  function getStepLabel(stepKey: ApplicationFormStepKey) {
    switch (stepKey) {
      case "application-data":
        return text("applicationForm.sections.applicationData")
      case "personal-data":
        return text("applicationForm.sections.personalData")
      case "contact-identity":
        return text("applicationForm.sections.contactIdentity")
      case "family-emergency":
        return text("applicationForm.sections.familyEmergency")
      case "education-training":
        return text("applicationForm.sections.educationTraining")
      case "skill-abilities":
        return text("applicationForm.sections.skillAbilities")
      case "employment-history":
        return text("applicationForm.sections.employmentHistory")
      case "reference-data":
        return text("applicationForm.sections.referenceData")
      case "mobility-residence":
        return text("applicationForm.sections.mobilityResidence")
      case "personal-statement":
        return text("applicationForm.sections.personalStatement")
      case "candidate-documents":
      case "employee-documents":
        return employeeDocumentSectionTitle.value
      case "payroll-statutory-data":
        return text("applicationForm.sections.payrollStatutoryData")
      default:
        return stepKey
    }
  }

  function getStepSnapshot(
    draft: CandidateApplicationFormDraft,
    stepKey: ApplicationFormStepKey,
  ) {
    return applicationFormStepFieldMap[stepKey].reduce((snapshot, fieldName) => {
      snapshot[fieldName] = cloneDraft(draft[fieldName])
      return snapshot
    }, {} as Partial<CandidateApplicationFormDraft>)
  }

  function getDirtyStepKeys(nextDraft = buildPayload()) {
    const baseline = lastSavedDraft.value
    if (!baseline) {
      return wizardSteps.value.map((step) => step.key)
    }

    return wizardSteps.value
      .filter(
        (step) =>
          JSON.stringify(getStepSnapshot(nextDraft, step.key)) !==
          JSON.stringify(getStepSnapshot(baseline, step.key)),
      )
      .map((step) => step.key)
  }

  function mergeDraftForSteps(
    stepKeys: ApplicationFormStepKey[],
    nextDraft = buildPayload(),
  ) {
    const mergedDraft = cloneDraft(lastSavedDraft.value ?? createEmptyCandidateApplicationFormDraft())

    for (const stepKey of stepKeys) {
      for (const fieldName of applicationFormStepFieldMap[stepKey]) {
        mergedDraft[fieldName] = cloneDraft(nextDraft[fieldName])
      }
    }

    mergedDraft.role = activePortalRole.value
    return mergedDraft
  }

  function syncLastSavedDraftFromForm() {
    lastSavedDraft.value = cloneDraft(buildPayload())
  }

  function setActiveStep(stepKey: string) {
    const normalizedStepKey = String(stepKey).trim()
    const availableStepKeys = new Set(wizardSteps.value.map((step) => step.key))

    if (!isStepKey(normalizedStepKey) || !availableStepKeys.has(normalizedStepKey)) {
      return
    }

    autosave.flush()
    activeStepKey.value = normalizedStepKey

    const nextQuery = {
      ...route.query,
      step: normalizedStepKey,
    }
    void router.replace({
      query: nextQuery,
    })
  }

  function syncActiveStepFromRoute() {
    const availableStepKeys = wizardSteps.value.map((step) => step.key)
    if (!availableStepKeys.length) {
      return
    }

    const requestedStep = String(route.query.step ?? "").trim()
    const nextStepKey =
      requestedStep && availableStepKeys.includes(requestedStep as ApplicationFormStepKey)
        ? (requestedStep as ApplicationFormStepKey)
        : availableStepKeys[0]

    if (activeStepKey.value !== nextStepKey) {
      activeStepKey.value = nextStepKey
    }
  }

  function goToPreviousStep() {
    if (isFirstStep.value) {
      return
    }

    const previousStep = wizardSteps.value[activeStepIndex.value - 1]
    if (previousStep) {
      setActiveStep(previousStep.key)
    }
  }

  function goToNextStep() {
    if (isLastStep.value) {
      return
    }

    const nextStep = wizardSteps.value[activeStepIndex.value + 1]
    if (nextStep) {
      setActiveStep(nextStep.key)
    }
  }

  function readJobLabel(snapshot: Record<string, unknown> | null | undefined, key: string) {
    const value = snapshot?.[key]
    return typeof value === "string" && value.trim() ? value.trim() : ""
  }

  function hasEmployeeDocumentTemplate(documentType: EmployeeDocumentType) {
    return hasGeneratedEmployeeDocumentTemplate(documentType) ||
      Boolean(employeeDocumentTemplateUrls[documentType])
  }

  function buildGeneratedEmployeeDocumentTemplateData() {
    return {
      employeeName: normalizeTextInput(form.full_name) || String(user.value?.full_name ?? "").trim(),
      employeeCode: String(user.value?.employee_code ?? "").trim(),
      contractNumber: String(user.value?.contract_number ?? "").trim(),
      placeOfBirth: normalizeTextInput(form.place_of_birth),
      dateOfBirth: normalizeTextInput(form.date_of_birth),
      idCardAddress: normalizeTextInput(form.id_card_address),
      idNo: normalizeTextInput(form.id_no),
      mainPosition: readJobLabel(formRecord.value?.application?.job_snapshot, "main_position"),
      departmentName: readJobLabel(formRecord.value?.application?.job_snapshot, "department_name"),
      companyName: readJobLabel(formRecord.value?.application?.job_snapshot, "pt_name"),
      contractPeriod: normalizeTextInput(form.personal_statement.contract_period),
      joinDate: normalizeTextInput(form.join_date),
    }
  }

  function handleDownloadEmployeeDocumentTemplate(
    documentType: EmployeeDocumentType,
    fallbackUrl?: string,
  ) {
    if (hasGeneratedEmployeeDocumentTemplate(documentType)) {
      downloadGeneratedEmployeeDocumentTemplate(
        documentType,
        buildGeneratedEmployeeDocumentTemplateData(),
      )
      return
    }

    const normalizedUrl = String(fallbackUrl ?? "").trim()
    if (normalizedUrl) {
      window.open(normalizedUrl, "_blank", "noopener,noreferrer")
      return
    }
  }

  function addFamilyItemForCategory(category: string) {
    if (category === "Parent") {
      form.family_and_emergency.push(
        { ...createFamilyItem(), category, relationship: "Father" },
        { ...createFamilyItem(), category, relationship: "Mother" },
      )
      return
    }

    form.family_and_emergency.push({
      ...createFamilyItem(),
      category,
    })
  }

  function removeFamilyItem(index: number) {
    if (form.family_and_emergency.length === 1) {
      form.family_and_emergency.splice(0, 1, createFamilyItem())
      return
    }

    form.family_and_emergency.splice(index, 1)
  }

  function addEducationItem() {
    form.education.push(
      createEducationItem({
        category: "Training / Non-Formal",
      }),
    )
  }

  function removeEducationItem(index: number) {
    const target = form.education[index]
    if (target?.category === "Formal Education") {
      form.education.splice(
        index,
        1,
        createEducationItem({
          category: "Formal Education",
          level: String(target.level ?? ""),
        }),
      )
      return
    }

    if (form.education.filter((item) => item.category !== "Formal Education").length <= 1) {
      form.education.splice(index, 1, createEducationItem({ category: "Training / Non-Formal" }))
      return
    }

    form.education.splice(index, 1)
  }

  function addWorkHistoryItem() {
    form.work_history.push(createWorkHistoryItem())
  }

  function removeWorkHistoryItem(index: number) {
    if (form.work_history.length === 1) {
      form.work_history.splice(0, 1, createWorkHistoryItem())
      return
    }

    form.work_history.splice(index, 1)
  }

  function addLanguageItem() {
    form.candidate_languages.push(createLanguageItem())
  }

  function removeLanguageItem(index: number) {
    if (form.candidate_languages.length === 1) {
      form.candidate_languages.splice(0, 1, createLanguageItem())
      return
    }

    form.candidate_languages.splice(index, 1)
  }

  function addSkillItem() {
    form.candidate_skills.push(createSkillItem())
  }

  function removeSkillItem(index: number) {
    if (form.candidate_skills.length === 1) {
      form.candidate_skills.splice(0, 1, createSkillItem())
      return
    }

    form.candidate_skills.splice(index, 1)
  }

  function addReferenceItem() {
    form.candidate_references.push(createReferenceItem())
  }

  function removeReferenceItem(index: number) {
    if (form.candidate_references.length === 1) {
      form.candidate_references.splice(0, 1, createReferenceItem())
      return
    }

    form.candidate_references.splice(index, 1)
  }

  async function loadFormRecord() {
    if (!applicationId.value) {
      return
    }

    dismissSuccessMessage()
    const record = await load(applicationId.value)
    const cachedDraft = autosave.loadCachedDraft()
    syncDraft(record.draft_data)
    syncLastSavedDraftFromForm()

    const baselineTime = record.updated_at ? new Date(record.updated_at).getTime() : 0
    const localTime = cachedDraft ? new Date(cachedDraft.savedAt).getTime() : 0
    const serverAutosaveTime = record.autosave_updated_at
      ? new Date(record.autosave_updated_at).getTime()
      : 0

    if (localTime > baselineTime && localTime >= serverAutosaveTime && cachedDraft) {
      syncDraft(cachedDraft.data)
    } else if (serverAutosaveTime > baselineTime && record.autosave_data) {
      syncDraft(record.autosave_data)
    }
  }

  function buildDraftSavedMessage() {
    if (isEmployeeForm.value) {
      return text("applicationForm.feedback.employeeDraftSaved")
    }

    const missingSections = incompleteRequiredSectionLabels.value

    if (!missingSections.length) {
      return text("applicationForm.feedback.candidateDraftSaved")
    }

    return text("applicationForm.feedback.candidateDraftSavedIncomplete", {
      sections: missingSections.join(", "),
    })
  }

  async function handleSave() {
    if (!applicationId.value) {
      return
    }

    autosave.flush()
    dismissSuccessMessage()
    const [photograph] = await Promise.all([
      uploadPhotographIfNeeded(),
      uploadEmployeeDocumentsIfNeeded(),
    ])
    if (photograph) {
      form.photograph = photograph
    }
    const currentDraft = buildPayload()
    const dirtyStepKeys = getDirtyStepKeys(currentDraft)

    if (!dirtyStepKeys.length) {
      showSuccessMessage(buildDraftSavedMessage())
      return
    }

    const record = await save(
      applicationId.value,
      mergeDraftForSteps(dirtyStepKeys, currentDraft),
      dirtyStepKeys,
    )
    syncDraft(record.draft_data)
    syncLastSavedDraftFromForm()
    syncApplication(record.application)
    showSuccessMessage(buildDraftSavedMessage())
  }

  async function handleSubmitForm() {
    if (!applicationId.value) {
      return
    }

    if (!canSubmitForm.value) {
      error.value = submitValidationMessage.value
      return
    }

    const confirmationMessage = isEmployeeForm.value
      ? text("applicationForm.confirm.submitEmployee")
      : text("applicationForm.confirm.submitCandidate")

    if (typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
      return
    }

    autosave.flush()
    dismissSuccessMessage()
    const [photograph] = await Promise.all([
      uploadPhotographIfNeeded(),
      uploadEmployeeDocumentsIfNeeded(),
    ])
    if (photograph) {
      form.photograph = photograph
    }
    const currentDraft = buildPayload()
    await save(applicationId.value, currentDraft, wizardSteps.value.map((step) => step.key))
    const record = await submit(applicationId.value)
    syncDraft(record.draft_data)
    syncLastSavedDraftFromForm()
    syncApplication(record.application)
    autosave.discardCachedDraft()
    showSuccessMessage(
      isEmployeeForm.value
        ? text("applicationForm.feedback.employeeSubmitted")
        : text("applicationForm.feedback.candidateSubmitted"),
    )
  }

  function handlePhotographChange(event: Event) {
    const input = event.target as HTMLInputElement | null
    const nextFile = input?.files?.[0] ?? null

    if (!nextFile) {
      selectedPhotographFile.value = null
      void syncPhotographPreview()
      return
    }

    if (nextFile.size > maxPhotographSizeInBytes) {
      selectedPhotographFile.value = null
      if (input) {
        input.value = ""
      }
      error.value = text("files.errors.photographTooLarge")
      void syncPhotographPreview()
      return
    }

    selectedPhotographFile.value = nextFile
    photographPreviewUrl.value = URL.createObjectURL(nextFile)

    void uploadPhotographIfNeeded().catch((err) => {
      error.value = err instanceof Error ? err.message : text("common.errors.requestFailed")
    })
  }

  function handleEmployeeDocumentChange(documentType: EmployeeDocumentType, event: Event) {
    const input = event.target as HTMLInputElement | null
    const nextFiles = Array.from(input?.files ?? [])

    if (!nextFiles.length) {
      return
    }

    const oversizedFile = nextFiles.find((file) => file.size > maxEmployeeDocumentSizeInBytes)
    if (oversizedFile) {
      selectedEmployeeDocumentFiles[documentType] = []
      if (input) {
        input.value = ""
      }
      error.value = text("files.errors.documentTooLarge", {
        documentLabel: getEmployeeDocumentLabel(documentType),
      })
      return
    }

    selectedEmployeeDocumentFiles[documentType] = dedupeFiles([
      ...selectedEmployeeDocumentFiles[documentType],
      ...nextFiles,
    ])

    if (input) {
      input.value = ""
    }

    void uploadEmployeeDocumentsIfNeeded().catch((err) => {
      error.value = err instanceof Error ? err.message : text("common.errors.requestFailed")
    })
  }

  function removeSelectedEmployeeDocumentFile(documentType: EmployeeDocumentType, index: number) {
    selectedEmployeeDocumentFiles[documentType] = selectedEmployeeDocumentFiles[
      documentType
    ].filter((_, fileIndex) => fileIndex !== index)
  }

  function removeUploadedEmployeeDocument(documentType: EmployeeDocumentType, path: string) {
    form.employee_documents[documentType] = (form.employee_documents[documentType] ?? []).filter(
      (filePath) => filePath !== path,
    )
  }

  function sanitizeStorageSegment(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  function createUploadDateStamp() {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, "0")
    const yyyy = now.getFullYear()
    const mm = pad(now.getMonth() + 1)
    const dd = pad(now.getDate())
    return `${yyyy}${mm}${dd}`
  }

  function buildCandidateNameSegment() {
    const fullName =
      normalizeTextInput(form.full_name) || String(user.value?.full_name ?? "").trim() || "candidate"
    return sanitizeStorageSegment(fullName) || "candidate"
  }

  function buildEmployeeDocumentFileName(documentType: EmployeeDocumentType, fileName: string) {
    const extension = String(fileName.split(".").pop() ?? "pdf").toLowerCase()
    const documentTypeSegment =
      sanitizeStorageSegment(String(documentType).replace(/_/g, "-")) || "document"
    const candidateNameSegment = buildCandidateNameSegment()
    const dateStamp = createUploadDateStamp()
    return `${documentTypeSegment}-${candidateNameSegment}-${dateStamp}.${extension}`
  }

  function buildPhotographFileName(fileName: string) {
    const extension = String(fileName.split(".").pop() ?? "jpg").toLowerCase()
    const candidateNameSegment = buildCandidateNameSegment()
    const dateStamp = createUploadDateStamp()
    return `pas-photo-${candidateNameSegment}-${dateStamp}.${extension}`
  }

  function getAuthenticatedStorageOwnerId() {
    const ownerId = sanitizeStorageSegment(String(user.value?.id ?? ""))
    if (!ownerId) {
      throw new Error(text("files.errors.authenticatedUserRequired"))
    }

    return ownerId
  }

  async function uploadPhotographIfNeeded() {
    if (!selectedPhotographFile.value) {
      return form.photograph
    }

    uploadingPhotograph.value = true

    try {
      const file = selectedPhotographFile.value
      const ownerId = getAuthenticatedStorageOwnerId()
      const fileName = buildPhotographFileName(file.name)
      const filePath = `candidate-forms/${ownerId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(candidatePhotographBucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        })

      if (uploadError) {
        throw new Error(text("files.errors.uploadPhotographFailed"))
      }

      selectedPhotographFile.value = null
      form.photograph = filePath
      await syncPhotographPreview()

      return filePath
    } finally {
      uploadingPhotograph.value = false
    }
  }

  async function uploadEmployeeDocumentsIfNeeded() {
    const hasPendingFiles = employeeDocumentTypes.some(
      (documentType) => selectedEmployeeDocumentFiles[documentType].length > 0,
    )

    if (!hasPendingFiles) {
      return
    }

    const ownerId = getAuthenticatedStorageOwnerId()

    uploadingEmployeeDocuments.value = true

    try {
      await Promise.all(employeeDocumentTypes.map(async (documentType) => {
        const files = selectedEmployeeDocumentFiles[documentType]
        if (!files.length) {
          return
        }

        const uploadedPaths = await Promise.all(files.map(async (file) => {
          const fileName = buildEmployeeDocumentFileName(documentType, file.name)
          const filePath = `employee-forms/${ownerId}/${documentType}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from(candidateDocumentBucket)
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: true,
              contentType: file.type || undefined,
            })

          if (uploadError) {
            throw new Error(
              text("files.errors.uploadDocumentFailed", {
                documentLabel: getEmployeeDocumentLabel(documentType),
              }),
            )
          }

          return filePath
        }))

        form.employee_documents[documentType] = dedupeDocumentPaths([
          ...(form.employee_documents[documentType] ?? []),
          ...uploadedPaths,
        ])
        selectedEmployeeDocumentFiles[documentType] = []
      }))
    } finally {
      uploadingEmployeeDocuments.value = false
    }
  }

  function getFileName(path: string) {
    return path.split("/").pop() || path
  }

  function getReadableUploadedFileName(documentType: EmployeeDocumentType, path: string) {
    const rawName = getFileName(path)
    const extensionMatch = rawName.match(/(\.[a-z0-9]+)$/i)
    const extension = extensionMatch?.[1] ?? ""
    const baseName = extension ? rawName.slice(0, -extension.length) : rawName
    const normalizedType = String(documentType ?? "").replace(/_/g, "-")
    const contextLabel = getEmployeeDocumentLabel(documentType)

    let readableBaseName = baseName
      .replace(new RegExp(`^${normalizedType}[-_ ]*`, "i"), "")
      .replace(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
        "",
      )
      .replace(/\bcandidate[-_ ]?form\b/gi, "")
      .replace(/\bemployee[-_ ]?forms?\b/gi, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (/^[a-z0-9]{5,14}$/i.test(readableBaseName)) {
      readableBaseName = ""
    }

    const finalBaseName = readableBaseName || contextLabel
    return `${finalBaseName}${extension}`
  }

  async function syncPhotographPreview() {
    if (selectedPhotographFile.value) {
      return
    }

    const photographPath = String(form.photograph ?? "").trim()
    if (!photographPath) {
      photographPreviewUrl.value = ""
      return
    }

    if (/^https?:\/\//i.test(photographPath)) {
      photographPreviewUrl.value = photographPath
      return
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from(candidatePhotographBucket)
      .createSignedUrl(photographPath, 60 * 60)

    if (signedUrlError) {
      photographPreviewUrl.value = ""
      return
    }

    photographPreviewUrl.value = data.signedUrl
  }

  function handleBack() {
    router.back()
  }

  onMounted(() => {
    loadFormRecord().catch(() => undefined)
  })

  watch(
    () => [route.query.step, wizardSteps.value.map((step) => step.key).join("|")],
    () => {
      syncActiveStepFromRoute()
    },
    { immediate: true },
  )

  watch(
    () => form.photograph,
    () => {
      void syncPhotographPreview()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    autosave.flush()
    dismissSuccessMessage()
  })

  return {
    autosaveStatus: autosave.status,
    flushAutoSave: autosave.flush,
    addEducationItem,
    addFamilyItemForCategory,
    addLanguageItem,
    addReferenceItem,
    addSkillItem,
    addWorkHistoryItem,
    applicationDataFields,
    activeStepIndex,
    activeStepKey,
    activeStepLabel,
    activeStepNumber,
    bpjsEmploymentStatusSelectOptions,
    busyLabel,
    canSubmitForm,
    completionStatusLabel,
    dismissSuccessMessage,
    employeeCode: computed(() => String(user.value?.employee_code ?? "").trim()),
    employeeDocumentRows,
    employeeDocumentSectionTitle,
    error,
    formStatusKey,
    form,
    formRecord,
    groupedFamilySections,
    handleBack,
    handleDownloadEmployeeDocumentTemplate,
    handleEmployeeDocumentChange,
    handlePhotographChange,
    handleSave,
    handleSubmitForm,
    isBusy,
    isEmployeeDraftContractStage,
    isEmployeeForm,
    isFormSubmittedAndCompleted,
    isLoading,
    isRequiredFormalEducationLevel,
    isSaving,
    isSubmitting,
    isUploadingAnyFile,
    localizedBloodTypeOptions,
    localizedFamilyCategoryOptions,
    localizedGenderOptions,
    localizedLanguageProficiencyOptions,
    localizedMaritalStatusOptions,
    localizedParentRelationshipOptions,
    localizedResidenceOwnershipOptions,
    localizedTransportationOwnershipOptions,
    nonFormalEducationRows,
    pageEyebrow,
    pageSummary,
    pageTitle,
    photographPreviewUrl,
    readJobLabel,
    removeEducationItem,
    removeFamilyItem,
    removeLanguageItem,
    removeReferenceItem,
    removeSelectedEmployeeDocumentFile,
    removeSkillItem,
    removeUploadedEmployeeDocument,
    removeWorkHistoryItem,
    requiredLabel,
    selectedPhotographFile,
    successMessage,
    submitValidationMessage,
    text,
    uploadingPhotograph,
    yearOptions,
    formalEducationRows,
    getReadableUploadedFileName,
    getEmployeeDocumentAccept,
    goToNextStep,
    goToPreviousStep,
    hasEmployeeDocumentTemplate,
    isFieldMissing,
    isFirstStep,
    isLastStep,
    setActiveStep,
    totalSteps,
    wizardSteps,
  }
}
