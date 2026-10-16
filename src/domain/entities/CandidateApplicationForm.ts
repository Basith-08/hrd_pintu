export const genderOptions = ['Male', 'Female'] as const
export const maritalStatusOptions = ['Single', 'Married', 'Divorced'] as const
export const bloodTypeOptions = ['A', 'B', 'AB', 'O'] as const
export const educationLevelOptions = [
  'SD / Sederajat',
  'SMP / MTs / Sederajat',
  'SMA / SMK / MA / Sederajat',
  'Diploma I (D1)',
  'Diploma II (D2)',
  'Diploma III (D3)',
  'Diploma IV (D4)',
  'Sarjana (S1)',
  'Magister (S2)',
  'Doktor (S3)',
] as const
export const familyCategoryOptions = [
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Emergency Contact',
  'Other',
] as const
export const educationCategoryOptions = ['Formal Education', 'Training / Non-Formal'] as const
export const languageProficiencyOptions = ['Good', 'Fair', 'Poor'] as const
export const transportationOwnershipOptions = ['Personal', 'Office', 'Other'] as const
export const residenceOwnershipOptions = ['Personal', 'Rent', 'Boarding', 'Parents', 'Other'] as const
export const portalRoleOptions = ['candidate', 'employee'] as const
export const bpjsHealthEnrollmentPreferenceOptions = [
  'willing_to_enroll',
  'decline_enrollment',
] as const
export const bpjsHealthDeclineReasonOptions = [
  'pbi',
  'self_registered',
  'local_government',
  'other',
] as const
export const bpjsEmploymentStatusOptions = [
  'cash_out_first',
  'enroll_new',
  'continue_existing',
] as const
export const employeeDocumentTypes = [
  'cv',
  'identity_card',
  'family_card',
  'latest_diploma',
  'academic_transcript',
  'certificate_of_employment',
  'tax_id',
  'bpjs_health_card',
  'bpjs_health_statement',
  'bpjs_employment_card',
  'bank_account_book',
  'integrity_pact',
  'email_usage_policy',
] as const

export const candidateDocumentTypes = [
  'cv',
  'identity_card',
  'family_card',
  'latest_diploma',
  'academic_transcript',
  'certificate_of_employment',
] as const

export const requiredCandidateDocumentTypes = [
  'cv',
  'identity_card',
  'family_card',
  'latest_diploma',
  'academic_transcript',
] as const

export type Gender = (typeof genderOptions)[number]
export type MaritalStatus = (typeof maritalStatusOptions)[number]
export type BloodType = (typeof bloodTypeOptions)[number]
export type EducationLevel = (typeof educationLevelOptions)[number]
export type FamilyCategory = (typeof familyCategoryOptions)[number]
export type EducationCategory = (typeof educationCategoryOptions)[number]
export type LanguageProficiency = (typeof languageProficiencyOptions)[number]
export type TransportationOwnership = (typeof transportationOwnershipOptions)[number]
export type ResidenceOwnership = (typeof residenceOwnershipOptions)[number]
export type PortalRole = (typeof portalRoleOptions)[number]
export type BpjsHealthEnrollmentPreference =
  (typeof bpjsHealthEnrollmentPreferenceOptions)[number]
export type BpjsHealthDeclineReason = (typeof bpjsHealthDeclineReasonOptions)[number]
export type BpjsEmploymentStatus = (typeof bpjsEmploymentStatusOptions)[number]
export type EmployeeDocumentType = (typeof employeeDocumentTypes)[number]

export type CandidateFormCompletionStatus = 'in_progress' | 'completed' | 'employee_draf_contract'

export type EmployeePayrollProfileInput = {
  bank_name: string
  bank_account_number: string
  account_holder_name: string
  branch_name: string
  tax_identification_number: string
  bpjs_health_enrollment_preference: BpjsHealthEnrollmentPreference | '' | string
  bpjs_health_decline_reason: BpjsHealthDeclineReason | '' | string
  bpjs_health_decline_reason_other: string
  bpjs_employment_status: BpjsEmploymentStatus | '' | string
}

export type EmployeeDocumentsInput = Record<EmployeeDocumentType, string[]>

export type FamilyEmergencyInput = {
  name: string
  relationship: string
  gender: Gender | ''
  place_and_date_of_birth: string
  education: string
  description: string
  occupation: string
  remarks: string
  category: FamilyCategory | '' | string
}

export type EducationHistoryInput = {
  level: EducationLevel | '' | string
  institution: string
  city: string
  major: string
  from_year: number | null
  to_year: number | null
  category: EducationCategory | '' | string
  description: string
}

export type WorkHistoryInput = {
  company: string
  position: string
  from_year: number | null
  to_year: number | null
  reason_to_quitting: string
  last_salary: number | null
  benefit: string
  description: string
  company_address: string
  company_phone: string
  direct_superior_title: string
  organization_structure: string
}

export type CandidateLanguageInput = {
  language_name: string
  speaking: LanguageProficiency | '' | string
  reading: LanguageProficiency | '' | string
  listening: LanguageProficiency | '' | string
  writing: LanguageProficiency | '' | string
}

export type CandidateSkillInput = {
  skill_name: string
  description: string
  skill_order?: number | null
}

export type CandidateReferenceInput = {
  name: string
  phone_number: string
  relationship: string
  position: string
  reference_order?: number | null
}

export type PersonalStatementInput = {
  contract: boolean
  contract_period: string
  reference_check_reason: string
  business_trip: boolean
  expected_salary: number | null
  previous_application: boolean
  previous_application_details: string
  reference_check_allowed: boolean
  family_or_friend_in_company: boolean
  serious_illness: boolean
  serious_illness_details: string
  serious_accident_boolean: boolean
  psychological_test: boolean
  psychological_test_location: string
  psychological_test_purpose: string
  company_legal_issue: boolean
  company_legal_issue_details: string
  family_or_friend_details: string
  serious_accident_details: string
  civil_or_criminal_case: boolean
  civil_or_criminal_case_details: string
}

export type CandidateApplicationFormDraft = {
  role: PortalRole
  photograph: string
  date_application: string
  notice_period: string
  available_start_date: string
  join_date: string
  hire_location: string
  full_name: string
  gender: Gender | '' | string
  place_of_birth: string
  date_of_birth: string
  nationality: string
  religion: string
  marital_status: MaritalStatus | '' | string
  blood_type: BloodType | '' | string
  ethnic: string
  id_card_address: string
  residential_address: string
  personal_email: string
  instagram: string
  linkedin: string
  phone_number: string
  id_type: string
  id_no: string
  transportation_type: string
  transportation_ownership: TransportationOwnership | '' | string
  residence_ownership: ResidenceOwnership | '' | string
  family_and_emergency: FamilyEmergencyInput[]
  education: EducationHistoryInput[]
  work_history: WorkHistoryInput[]
  candidate_languages: CandidateLanguageInput[]
  candidate_skills: CandidateSkillInput[]
  candidate_references: CandidateReferenceInput[]
  personal_statement: PersonalStatementInput
  employee_payroll_profile: EmployeePayrollProfileInput
  employee_documents: EmployeeDocumentsInput
}

export type CandidateApplicationSummary = {
  id: string
  erf_id: string
  status: string
  job_snapshot: Record<string, unknown> | null
  created_at: string | null
  submitted_at: string | null
  form_completion_status?: CandidateFormCompletionStatus | null
  form_updated_at?: string | null
  form_submitted_at?: string | null
}

export type CandidateApplicationFormRecord = {
  candidate_form_id?: string | null
  application_id: string
  role: PortalRole
  completion_status: CandidateFormCompletionStatus
  draft_data: CandidateApplicationFormDraft
  submitted_at: string | null
  updated_at: string | null
  autosave_data?: CandidateApplicationFormDraft | null
  autosave_updated_at?: string | null
  application: CandidateApplicationSummary
}

export function createEmptyCandidateApplicationFormDraft(): CandidateApplicationFormDraft {
  return {
    role: 'candidate',
    photograph: '',
    date_application: '',
    notice_period: '',
    available_start_date: '',
    join_date: '',
    hire_location: '',
    full_name: '',
    gender: '',
    place_of_birth: '',
    date_of_birth: '',
    nationality: '',
    religion: '',
    marital_status: '',
    blood_type: '',
    ethnic: '',
    id_card_address: '',
    residential_address: '',
    personal_email: '',
    instagram: '',
    linkedin: '',
    phone_number: '',
    id_type: '',
    id_no: '',
    transportation_type: '',
    transportation_ownership: '',
    residence_ownership: '',
    family_and_emergency: [],
    education: [],
    work_history: [],
    candidate_languages: [],
    candidate_skills: [],
    candidate_references: [],
    personal_statement: {
      contract: false,
      contract_period: '',
      reference_check_reason: '',
      business_trip: false,
      expected_salary: null,
      previous_application: false,
      previous_application_details: '',
      reference_check_allowed: false,
      family_or_friend_in_company: false,
      serious_illness: false,
      serious_illness_details: '',
      serious_accident_boolean: false,
      psychological_test: false,
      psychological_test_location: '',
      psychological_test_purpose: '',
      company_legal_issue: false,
      company_legal_issue_details: '',
      family_or_friend_details: '',
      serious_accident_details: '',
      civil_or_criminal_case: false,
      civil_or_criminal_case_details: '',
    },
    employee_payroll_profile: {
      bank_name: '',
      bank_account_number: '',
      account_holder_name: '',
      branch_name: '',
      tax_identification_number: '',
      bpjs_health_enrollment_preference: '',
      bpjs_health_decline_reason: '',
      bpjs_health_decline_reason_other: '',
      bpjs_employment_status: '',
    },
    employee_documents: employeeDocumentTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as EmployeeDocumentsInput),
  }
}
