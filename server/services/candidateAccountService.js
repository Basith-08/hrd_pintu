import { createHttpError } from "~~/server/lib/errors.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { deliverCandidateEvent } from "~~/server/services/candidateSyncService.js"
import {
  APPLICATION_FORM_SAVE_SECTION_KEYS,
  ensureCandidateFormForApplication,
  getCandidateFormSnapshotByApplicationId,
  getCandidateFormSnapshotById,
  listCandidateFormSnapshotsByApplicationIds,
  mapCandidateFormSnapshotToDraftData,
  saveCandidateFormForApplication,
  submitCandidateFormForApplication,
} from "~~/server/services/candidateFormService.js"

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CANDIDATE_ACTIVE_DAYS = 60
const DAY_IN_MS = 24 * 60 * 60 * 1000
const EMPLOYEE_DOCUMENT_TYPES = [
  "cv",
  "integrity_pact",
  "email_usage_policy",
  "identity_card",
  "family_card",
  "latest_diploma",
  "academic_transcript",
  "certificate_of_employment",
  "tax_id",
  "bpjs_health_card",
  "bpjs_health_statement",
  "bpjs_employment_card",
  "bank_account_book",
  "format_office",
  "skb",
  "other",
]
const CANDIDATE_DOCUMENT_TYPES = [
  "cv",
  "identity_card",
  "family_card",
  "latest_diploma",
  "academic_transcript",
  "certificate_of_employment",
]
const CANDIDATE_REQUIRED_DOCUMENT_TYPES = [
  "cv",
  "identity_card",
  "family_card",
  "latest_diploma",
  "academic_transcript",
]
const OPTIONAL_EMPLOYEE_DOCUMENT_TYPES = ["bpjs_health_statement", "other"]
const HIDDEN_EMPLOYEE_DOCUMENT_TYPES = ["certificate_of_employment"]
const EMPLOYEE_DRAFT_CONTRACT_DOCUMENT_TYPES = ["format_office", "skb"]
const CANDIDATE_ACCOUNT_SELECT =
  "id, identity_user_id, email, full_name, phone, employee_code, personal_data, status, portal_role, created_by, updated_by, created_by_internal_user_id, created_at, activated_at, updated_at, last_login_at"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function ensureEmail(email) {
  const normalizedEmail = normalizeText(email).toLowerCase()
  if (!emailRx.test(normalizedEmail)) {
    throw createHttpError(400, "A valid email is required.")
  }

  return normalizedEmail
}

function ensurePassword(password) {
  const normalizedPassword = String(password ?? "")
  if (normalizedPassword.length < 6) {
    throw createHttpError(400, "Password must be at least 6 characters.")
  }

  return normalizedPassword
}

function normalizeStatus(value, fallback = "active") {
  const normalizedStatus = normalizeText(value).toLowerCase()
  if (!normalizedStatus) {
    return fallback
  }

  if (!["active", "inactive", "revoked"].includes(normalizedStatus)) {
    throw createHttpError(400, "Candidate status is invalid.")
  }

  return normalizedStatus
}

function normalizePortalRole(value, fallback = "candidate") {
  const normalizedRole = normalizeText(value).toLowerCase()
  if (!normalizedRole) {
    return fallback
  }

  if (!["candidate", "employee"].includes(normalizedRole)) {
    throw createHttpError(400, "Candidate portal role is invalid.")
  }

  return normalizedRole
}

function normalizeJobSnapshot(jobSnapshot) {
  return jobSnapshot && typeof jobSnapshot === "object" ? jobSnapshot : {}
}

function hasText(value) {
  return normalizeText(value).length > 0
}

function readEmployeeCode(account) {
  return normalizeText(account?.employee_code)
}

function readPersonalDataString(personalData, key) {
  if (!personalData || typeof personalData !== "object") {
    return null
  }

  const value = personalData[key]
  return typeof value === "string" && value.trim() ? value : null
}

function readContractNumber(account) {
  return readPersonalDataString(account?.personal_data, "contract_number")
}

function normalizeInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? Math.trunc(nextValue) : null
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value
  }

  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  return false
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeApplicationFormSaveSections(value) {
  return [...new Set(
    normalizeArray(value)
      .map((item) => normalizeText(item))
      .filter((item) => APPLICATION_FORM_SAVE_SECTION_KEYS.includes(item)),
  )]
}

function hasOwnField(value, fieldName) {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(value, fieldName)
}

function getCandidateAccessStartTime(account) {
  const referenceDate = new Date(account?.activated_at ?? account?.created_at ?? "")
  if (Number.isNaN(referenceDate.getTime())) {
    return null
  }

  return referenceDate.getTime()
}

function getCandidateExpiryTime(account) {
  const accessStartTime = getCandidateAccessStartTime(account)
  if (accessStartTime === null) {
    return null
  }

  return accessStartTime + CANDIDATE_ACTIVE_DAYS * DAY_IN_MS
}

function isCandidateAccountExpired(account, now = Date.now()) {
  if (normalizePortalRole(account?.portal_role) !== "candidate") {
    return false
  }

  if (normalizeStatus(account?.status) !== "active") {
    return false
  }

  const expiryTime = getCandidateExpiryTime(account)
  if (expiryTime === null) {
    return false
  }

  return now > expiryTime
}


function normalizeApplicationFormDraft(input) {
  const source = input && typeof input === "object" ? input : {}
  const personalStatement =
    source.personal_statement && typeof source.personal_statement === "object"
      ? source.personal_statement
      : {}
  const employeePayrollProfile =
    source.employee_payroll_profile && typeof source.employee_payroll_profile === "object"
      ? source.employee_payroll_profile
      : {}
  const employeeDocuments =
    source.employee_documents && typeof source.employee_documents === "object"
      ? source.employee_documents
      : {}

  return {
    role: normalizePortalRole(source.role, "candidate"),
    photograph: normalizeText(source.photograph),
    date_application: normalizeText(source.date_application),
    notice_period: normalizeText(source.notice_period),
    available_start_date: normalizeText(source.available_start_date),
    join_date: normalizeText(source.join_date),
    hire_location: normalizeText(source.hire_location),
    full_name:
      normalizeText(source.full_name) ||
      [source.first_name, source.middle_name, source.last_name]
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .join(" "),
    gender: normalizeText(source.gender),
    place_of_birth: normalizeText(source.place_of_birth),
    date_of_birth: normalizeText(source.date_of_birth),
    nationality: normalizeText(source.nationality),
    religion: normalizeText(source.religion),
    marital_status: normalizeText(source.marital_status),
    blood_type: normalizeText(source.blood_type),
    ethnic: normalizeText(source.ethnic),
    id_card_address: normalizeText(source.id_card_address),
    residential_address: normalizeText(source.residential_address),
    personal_email: normalizeText(source.personal_email),
    instagram: normalizeText(source.instagram),
    linkedin: normalizeText(source.linkedin),
    phone_number: normalizeText(source.phone_number) || normalizeText(source.home_phone),
    id_type: normalizeText(source.id_type),
    id_no: normalizeText(source.id_no),
    transportation_type: normalizeText(source.transportation_type),
    transportation_ownership: normalizeText(source.transportation_ownership),
    residence_ownership: normalizeText(source.residence_ownership),
    family_and_emergency: normalizeArray(source.family_and_emergency).map((item) => ({
      name: normalizeText(item?.name),
      relationship: normalizeText(item?.relationship),
      gender: normalizeText(item?.gender),
      place_and_date_of_birth: normalizeText(item?.place_and_date_of_birth),
      education: normalizeText(item?.education),
      description: normalizeText(item?.description),
      occupation: normalizeText(item?.occupation),
      remarks: normalizeText(item?.remarks),
      category: normalizeText(item?.category),
    })),
    education: normalizeArray(source.education).map((item) => ({
      level: normalizeText(item?.level),
      institution: normalizeText(item?.institution),
      city: normalizeText(item?.city),
      major: normalizeText(item?.major),
      from_year: normalizeInteger(item?.from_year),
      to_year: normalizeInteger(item?.to_year),
      category: normalizeText(item?.category),
      description: normalizeText(item?.description),
    })),
    work_history: normalizeArray(source.work_history).map((item) => ({
      company: normalizeText(item?.company),
      position: normalizeText(item?.position),
      from_year: normalizeInteger(item?.from_year),
      to_year: normalizeInteger(item?.to_year),
      reason_to_quitting: normalizeText(item?.reason_to_quitting),
      last_salary: normalizeInteger(item?.last_salary),
      benefit: normalizeText(item?.benefit),
      description: normalizeText(item?.description),
      company_address: normalizeText(item?.company_address),
      company_phone: normalizeText(item?.company_phone),
      direct_superior_title: normalizeText(item?.direct_superior_title),
      organization_structure: normalizeText(item?.organization_structure),
    })),
    candidate_languages: normalizeArray(source.candidate_languages).map((item) => ({
      language_name: normalizeText(item?.language_name),
      speaking: normalizeText(item?.speaking),
      reading: normalizeText(item?.reading),
      listening: normalizeText(item?.listening),
      writing: normalizeText(item?.writing),
    })),
    candidate_skills: normalizeArray(source.candidate_skills).map((item) => ({
      skill_name: normalizeText(item?.skill_name),
      description: normalizeText(item?.description),
      skill_order: normalizeInteger(item?.skill_order),
    })),
    candidate_references: normalizeArray(source.candidate_references).map((item) => ({
      name: normalizeText(item?.name),
      phone_number: normalizeText(item?.phone_number),
      relationship: normalizeText(item?.relationship),
      position: normalizeText(item?.position),
      reference_order: normalizeInteger(item?.reference_order),
    })),
    employee_payroll_profile: {
      bank_name: normalizeText(employeePayrollProfile.bank_name),
      bank_account_number: normalizeText(employeePayrollProfile.bank_account_number),
      account_holder_name: normalizeText(employeePayrollProfile.account_holder_name),
      branch_name: normalizeText(employeePayrollProfile.branch_name),
      tax_identification_number: normalizeText(employeePayrollProfile.tax_identification_number),
      bpjs_health_enrollment_preference: normalizeText(
        employeePayrollProfile.bpjs_health_enrollment_preference,
      ),
      bpjs_health_decline_reason: normalizeText(employeePayrollProfile.bpjs_health_decline_reason),
      bpjs_health_decline_reason_other: normalizeText(
        employeePayrollProfile.bpjs_health_decline_reason_other,
      ),
      bpjs_employment_status: normalizeText(employeePayrollProfile.bpjs_employment_status),
    },
    employee_documents: EMPLOYEE_DOCUMENT_TYPES.reduce((documents, documentType) => {
      documents[documentType] = normalizeArray(employeeDocuments[documentType])
        .map((item) => normalizeText(item))
        .filter(Boolean)
      return documents
    }, {}),
    personal_statement: {
      contract: normalizeBoolean(personalStatement.contract),
      contract_period: normalizeText(personalStatement.contract_period),
      reference_check_reason: normalizeText(personalStatement.reference_check_reason),
      expected_salary: normalizeInteger(personalStatement.expected_salary),
      business_trip: normalizeBoolean(personalStatement.business_trip),
      previous_application: normalizeBoolean(personalStatement.previous_application),
      previous_application_details: normalizeText(personalStatement.previous_application_details),
      reference_check_allowed: normalizeBoolean(personalStatement.reference_check_allowed),
      family_or_friend_in_company: normalizeBoolean(personalStatement.family_or_friend_in_company),
      serious_illness: normalizeBoolean(personalStatement.serious_illness),
      serious_illness_details: normalizeText(personalStatement.serious_illness_details),
      serious_accident_boolean: normalizeBoolean(personalStatement.serious_accident_boolean),
      psychological_test: normalizeBoolean(personalStatement.psychological_test),
      psychological_test_location: normalizeText(personalStatement.psychological_test_location),
      psychological_test_purpose: normalizeText(personalStatement.psychological_test_purpose),
      company_legal_issue: normalizeBoolean(personalStatement.company_legal_issue),
      company_legal_issue_details: normalizeText(personalStatement.company_legal_issue_details),
      family_or_friend_details: normalizeText(personalStatement.family_or_friend_details),
      serious_accident_details: normalizeText(personalStatement.serious_accident_details),
      civil_or_criminal_case: normalizeBoolean(personalStatement.civil_or_criminal_case),
      civil_or_criminal_case_details: normalizeText(personalStatement.civil_or_criminal_case_details),
    },
  }
}

function hasFormalEducationInstitution(draftData, level) {
  return draftData.education.some(
    (item) => normalizeText(item.category) === "Formal Education" && normalizeText(item.level) === level && hasText(item.institution),
  )
}

function hasRequiredParent(draftData, patterns) {
  return draftData.family_and_emergency.some(
    (item) =>
      normalizeText(item.category) === "Parent" &&
      hasText(item.name) &&
      patterns.some((pattern) => pattern.test(normalizeText(item.relationship))),
  )
}

function hasCompleteFirstWorkHistory(draftData) {
  const firstWorkHistory = draftData.work_history[0]
  if (!firstWorkHistory) {
    return false
  }

  return hasText(firstWorkHistory.company) && hasText(firstWorkHistory.position)
}

function hasCompleteReference(draftData) {
  return draftData.candidate_references.some(
    (item) =>
      hasText(item.name) &&
      hasText(item.phone_number) &&
      hasText(item.relationship) &&
      hasText(item.position),
  )
}

function validateSharedFormSubmissionRequirements(draftData) {
  if (!hasText(draftData.photograph)) {
    throw createHttpError(400, "Photograph is required before submitting.")
  }

  if (!hasText(draftData.full_name)) {
    throw createHttpError(400, "Full name is required before submitting the form.")
  }

  if (!hasText(draftData.place_of_birth) || !hasText(draftData.date_of_birth)) {
    throw createHttpError(400, "Place and date of birth are required before submitting.")
  }

  if (!hasText(draftData.gender)) {
    throw createHttpError(400, "Gender is required before submitting.")
  }

  if (!hasText(draftData.id_card_address) || !hasText(draftData.residential_address)) {
    throw createHttpError(400, "ID card address and residential address are required before submitting.")
  }

  if (!hasText(draftData.nationality) || !hasText(draftData.religion) || !hasText(draftData.marital_status)) {
    throw createHttpError(400, "Nationality, religion, and marital status are required before submitting.")
  }

  if (!hasText(draftData.id_no)) {
    throw createHttpError(400, "Identity card number is required before submitting.")
  }

  if (!hasText(draftData.personal_email) || !hasText(draftData.phone_number)) {
    throw createHttpError(400, "Personal email and phone number are required before submitting.")
  }

  if (!hasFormalEducationInstitution(draftData, "SD / Sederajat")) {
    throw createHttpError(400, "Elementary school is required before submitting.")
  }

  if (!hasFormalEducationInstitution(draftData, "SMP / MTs / Sederajat")) {
    throw createHttpError(400, "Junior high school is required before submitting.")
  }

  if (!hasFormalEducationInstitution(draftData, "SMA / SMK / MA / Sederajat")) {
    throw createHttpError(400, "Senior high school is required before submitting.")
  }

  if (!hasCompleteFirstWorkHistory(draftData)) {
    throw createHttpError(400, "The first work history entry must include company and position before submitting.")
  }

  if (!hasRequiredParent(draftData, [/\bayah\b/i, /\bfather\b/i])) {
    throw createHttpError(400, "Father data is required before submitting.")
  }

  if (!hasRequiredParent(draftData, [/\bibu\b/i, /\bmother\b/i])) {
    throw createHttpError(400, "Mother data is required before submitting.")
  }

  if (!hasCompleteReference(draftData)) {
    throw createHttpError(400, "At least one complete reference is required before submitting.")
  }
}

function validateEmployeePayrollSubmissionRequirements(draftData) {
  const payrollProfile = draftData.employee_payroll_profile ?? {}

  if (!hasText(payrollProfile.bank_name) || !hasText(payrollProfile.bank_account_number)) {
    throw createHttpError(400, "Registered bank name and bank account number are required before submitting.")
  }

  if (!hasText(payrollProfile.account_holder_name) || !hasText(payrollProfile.branch_name)) {
    throw createHttpError(400, "Account holder name and bank branch are required before submitting.")
  }

  if (!hasText(payrollProfile.tax_identification_number)) {
    throw createHttpError(400, "NPWP number is required before submitting.")
  }

  if (!hasText(payrollProfile.bpjs_health_enrollment_preference)) {
    throw createHttpError(400, "BPJS health preference is required before submitting.")
  }

  if (payrollProfile.bpjs_health_enrollment_preference === "decline_enrollment") {
    if (!hasText(payrollProfile.bpjs_health_decline_reason)) {
      throw createHttpError(400, "BPJS health decline reason is required before submitting.")
    }

    if (
      payrollProfile.bpjs_health_decline_reason === "other" &&
      !hasText(payrollProfile.bpjs_health_decline_reason_other)
    ) {
      throw createHttpError(400, "Please describe the BPJS health decline reason before submitting.")
    }
  }

  if (!hasText(payrollProfile.bpjs_employment_status)) {
    throw createHttpError(400, "BPJS employment status is required before submitting.")
  }
}

function hasRequiredEmployeeSubmissionFields(draftData) {
  return true
}

function hasRequiredEmployeeSubmissionDocuments(draftData) {
  return true
}

function toTimestamp(value) {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) {
    return null
  }

  const timestamp = Date.parse(normalizedValue)
  return Number.isFinite(timestamp) ? timestamp : null
}

function resolveFormProgressState(account, application, formState) {
  const storedCompletionStatus = normalizeText(formState?.completion_status).toLowerCase() || "in_progress"

  if (normalizePortalRole(account?.portal_role) !== "employee") {
    return {
      completionStatus: storedCompletionStatus === "completed" ? "completed" : "in_progress",
      formSubmittedAt: application?.submitted_at ?? null,
    }
  }

  if (!formState || storedCompletionStatus !== "completed") {
    return {
      completionStatus: "in_progress",
      formSubmittedAt: null,
    }
  }

  const formUpdatedTimestamp = toTimestamp(formState.updated_at)
  const applicationSubmittedTimestamp = toTimestamp(application?.submitted_at)
  const roleActivatedAt = toTimestamp(account?.activated_at ?? account?.created_at)
  if (
    formUpdatedTimestamp === null ||
    applicationSubmittedTimestamp === null ||
    (roleActivatedAt !== null && applicationSubmittedTimestamp < roleActivatedAt) ||
    Math.abs(formUpdatedTimestamp - applicationSubmittedTimestamp) > 1000
  ) {
    return {
      completionStatus: "in_progress",
      formSubmittedAt: null,
    }
  }

  if (roleActivatedAt !== null && formUpdatedTimestamp < roleActivatedAt) {
    return {
      completionStatus: "in_progress",
      formSubmittedAt: null,
    }
  }

  const employeeDraftData = normalizeApplicationFormDraft(
    mapCandidateFormSnapshotToDraftData(
      {
        ...formState,
        role: "employee",
      },
      account,
      application,
    ),
  )

  if (
    !hasRequiredEmployeeSubmissionFields(employeeDraftData) ||
    !hasRequiredEmployeeSubmissionDocuments(employeeDraftData)
  ) {
    return {
      completionStatus: "in_progress",
      formSubmittedAt: null,
    }
  }

  return {
    completionStatus: "completed",
    formSubmittedAt: application.submitted_at ?? null,
  }
}

function validateFormSubmission(draftData) {
  return draftData
}

function normalizeOperationalError(error) {
  const message = String(error?.message ?? "").trim()
  const loweredMessage = message.toLowerCase()

  if (
    loweredMessage.includes("candidate_accounts") ||
    loweredMessage.includes("candidate_applications") ||
    loweredMessage.includes("candidate_form") ||
    loweredMessage.includes("family_and_emergency") ||
    loweredMessage.includes("education") ||
    loweredMessage.includes("work_history") ||
    loweredMessage.includes("personal_statement") ||
    loweredMessage.includes("candidate_languages") ||
    loweredMessage.includes("candidate_skills") ||
    loweredMessage.includes("candidate_references") ||
    loweredMessage.includes("employee_payroll_profile") ||
    loweredMessage.includes("employee_documents")
  ) {
    return createHttpError(
      503,
      "Candidate service database is not ready. Please run 20260401_001_candidate_service_baseline.sql and 20260402_002_add_candidate_legacy_form_tables.sql, then restart or refresh the candidate service.",
      { expose: true },
    )
  }

  return error
}

async function runWithOperationalErrorNormalization(work) {
  try {
    return await work()
  } catch (error) {
    throw normalizeOperationalError(error)
  }
}

async function listAllAuthUsers(supabase) {
  const users = []
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message)
    }

    users.push(...data.users)

    if (!data.nextPage) {
      break
    }

    page = data.nextPage
  }

  return users
}

async function findAuthUserByEmail(supabase, email) {
  const users = await listAllAuthUsers(supabase)
  return users.find((user) => String(user.email ?? "").trim().toLowerCase() === email) ?? null
}

async function getCandidateAccountById(supabase, candidateId) {
  const { data, error } = await supabase
    .from("candidate_accounts")
    .select(CANDIDATE_ACCOUNT_SELECT)
    .eq("id", candidateId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getCandidateAccountByIdentityUserId(supabase, identityUserId) {
  const { data, error } = await supabase
    .from("candidate_accounts")
    .select(CANDIDATE_ACCOUNT_SELECT)
    .eq("identity_user_id", identityUserId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getCandidateAccountByEmail(supabase, email) {
  const { data, error } = await supabase
    .from("candidate_accounts")
    .select(CANDIDATE_ACCOUNT_SELECT)
    .eq("email", email)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function listApplicationsByCandidateIds(supabase, candidateIds) {
  if (!candidateIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .in("candidate_account_id", candidateIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

function buildApplicationSummary(application, formState, account = null) {
  const formProgressState = resolveFormProgressState(account, application, formState)
  const baseJobSnapshot =
    application.job_snapshot && typeof application.job_snapshot === "object"
      ? application.job_snapshot
      : {}
  const enrichedJobSnapshot = {
    ...baseJobSnapshot,
    candidate_form_id: formState?.id ?? null,
    form_completion_status: formProgressState.completionStatus,
    form_updated_at: formState?.updated_at ?? null,
    form_submitted_at: formProgressState.formSubmittedAt,
  }

  return {
    id: application.id,
    candidate_form_id: formState?.id ?? null,
    erf_id: application.erf_id,
    status: application.status,
    job_snapshot: enrichedJobSnapshot,
    submitted_at: application.submitted_at ?? null,
    created_at: application.created_at ?? null,
    form_completion_status: formProgressState.completionStatus,
    form_updated_at: formState?.updated_at ?? null,
    form_submitted_at: formProgressState.formSubmittedAt,
  }
}

function mapSummary(account, applications, applicationFormMap = new Map()) {
  const orderedApplications = [...applications].sort((left, right) =>
    String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")),
  )
  const mappedApplications = orderedApplications.map((application) =>
    buildApplicationSummary(application, applicationFormMap.get(application.id) ?? null, account),
  )
  const primaryApplication = mappedApplications[0] ?? null

  return {
    candidate_id: account.id,
    identity_user_id: account.identity_user_id,
    email: account.email,
    full_name: account.full_name ?? null,
    phone: account.phone ?? null,
    employee_code: readEmployeeCode(account),
    contract_number: readContractNumber(account),
    status: account.status,
    created_by_internal_user_id: account.created_by_internal_user_id ?? null,
    created_at: account.created_at ?? null,
    activated_at: account.activated_at ?? account.created_at ?? null,
    updated_at: account.updated_at ?? null,
    last_login_at: account.last_login_at ?? null,
    role: normalizePortalRole(account.portal_role),
    application_count: mappedApplications.length,
    primary_application: primaryApplication
      ? {
          application_id: primaryApplication.id,
          candidate_form_id: primaryApplication.candidate_form_id ?? null,
          erf_id: primaryApplication.erf_id,
          status: primaryApplication.status,
          job_snapshot: primaryApplication.job_snapshot,
          submitted_at: primaryApplication.submitted_at ?? null,
          created_at: primaryApplication.created_at ?? null,
          form_completion_status: primaryApplication.form_completion_status,
          form_updated_at: primaryApplication.form_updated_at,
          form_submitted_at: primaryApplication.form_submitted_at,
        }
      : null,
    applications: mappedApplications,
  }
}

async function buildCandidateSummaryByAccount(supabase, account) {
  if (!account) {
    return null
  }

  const applications = await listApplicationsByCandidateIds(supabase, [account.id])
  const applicationForms = await listCandidateFormSnapshotsByApplicationIds(
    supabase,
    applications.map((application) => application.id),
  )
  const applicationFormMap = new Map(
    applicationForms.map((formState) => [formState.application_id, formState]),
  )

  return mapSummary(
    account,
    applications.filter((application) => application.candidate_account_id === account.id),
    applicationFormMap,
  )
}

function buildCandidateEventSummary(account, application, formState = null) {
  if (!account || !application) {
    return null
  }

  const applicationSummary = buildApplicationSummary(application, formState, account)

  return {
    candidate_id: account.id,
    identity_user_id: account.identity_user_id,
    email: account.email,
    full_name: account.full_name ?? null,
    phone: account.phone ?? null,
    employee_code: readEmployeeCode(account),
    contract_number: readContractNumber(account),
    status: account.status,
    role: normalizePortalRole(account.portal_role),
    primary_application: applicationSummary,
    applications: [applicationSummary],
  }
}

async function expireCandidateAccountIfNeeded(supabase, account) {
  if (!account || !isCandidateAccountExpired(account)) {
    return account
  }

  const { data, error } = await supabase
    .from("candidate_accounts")
    .update({
      status: "inactive",
    })
    .eq("id", account.id)
    .eq("status", "active")
    .select(CANDIDATE_ACCOUNT_SELECT)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const nextAccount = data ?? {
    ...account,
    status: "inactive",
  }
  const summary = await buildCandidateSummaryByAccount(supabase, nextAccount)
  await syncCandidateEvent("candidate.account_status_changed", summary, {
    reason: "auto_expired_after_12_months",
  })

  return nextAccount
}

async function getActiveCandidateAccountByIdentityUserId(supabase, identityUserId) {
  const account = await getCandidateAccountByIdentityUserId(supabase, identityUserId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const normalizedAccount = await expireCandidateAccountIfNeeded(supabase, account)
  if (normalizeStatus(normalizedAccount.status) !== "active") {
    throw createHttpError(403, "Candidate account is not active.")
  }

  return normalizedAccount
}

async function ensureApplication(supabase, account, input) {
  const erfId = normalizeText(input.erf_id)
  if (!erfId) {
    return null
  }

  const hasJobSnapshotInput = input.job_snapshot && typeof input.job_snapshot === "object"

  const { data: existingApplication, error: existingError } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .eq("candidate_account_id", account.id)
    .eq("erf_id", erfId)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existingApplication) {
    const { data: updatedApplication, error: updateError } = await supabase
      .from("candidate_applications")
      .update({
        status: normalizeText(input.status) || existingApplication.status || "draft",
        job_snapshot: hasJobSnapshotInput
          ? normalizeJobSnapshot(input.job_snapshot)
          : normalizeJobSnapshot(existingApplication.job_snapshot),
      })
      .eq("id", existingApplication.id)
      .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    const candidateForm = await ensureCandidateFormForApplication(
      supabase,
      account,
      updatedApplication,
    )

    return {
      application: updatedApplication,
      created: false,
      candidateForm,
    }
  }

  const { data: createdApplication, error } = await supabase
    .from("candidate_applications")
    .insert({
      candidate_account_id: account.id,
      erf_id: erfId,
      status: normalizeText(input.status) || "draft",
      job_snapshot: normalizeJobSnapshot(input.job_snapshot),
    })
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const candidateForm = await ensureCandidateFormForApplication(
    supabase,
    account,
    createdApplication,
  )

  return {
    application: createdApplication,
    created: true,
    candidateForm,
  }
}

async function getCandidateApplicationById(supabase, applicationId) {
  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .eq("id", applicationId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getOwnedApplicationContext(supabase, identityUserId, applicationId) {
  const account = await getActiveCandidateAccountByIdentityUserId(supabase, identityUserId)

  const application = await getCandidateApplicationById(supabase, applicationId)
  if (!application || application.candidate_account_id !== account.id) {
    throw createHttpError(404, "Candidate application was not found.")
  }

  return {
    account,
    application,
  }
}

function buildEmptyApplicationForm(application, account) {
  const draftData = normalizeApplicationFormDraft({
    role: normalizePortalRole(account?.portal_role),
  })

  return {
    candidate_form_id: null,
    application_id: application.id,
    candidate_account_id: application.candidate_account_id,
    role: normalizePortalRole(account?.portal_role),
    completion_status: "in_progress",
    draft_data: draftData,
    submitted_at: null,
    created_at: application.created_at ?? null,
    updated_at: application.updated_at ?? null,
    autosave_data: null,
    autosave_updated_at: null,
    application: buildApplicationSummary(application, null, account),
  }
}

function mapApplicationFormRecord(application, formState, account) {
  if (!formState) {
    return buildEmptyApplicationForm(application, account)
  }

  const draftData = normalizeApplicationFormDraft(
    mapCandidateFormSnapshotToDraftData(
      {
        ...formState,
        role: normalizePortalRole(account?.portal_role),
      },
      account,
    ),
  )
  const formProgressState = resolveFormProgressState(account, application, formState)

  return {
    candidate_form_id: formState.id,
    application_id: application.id,
    candidate_account_id: application.candidate_account_id,
    role: normalizePortalRole(account?.portal_role),
    completion_status: formProgressState.completionStatus,
    draft_data: draftData,
    submitted_at: formProgressState.formSubmittedAt,
    created_at: formState.created_at ?? null,
    updated_at: formState.updated_at ?? null,
    autosave_data: formState.autosave_data
      ? normalizeApplicationFormDraft({
          ...formState.autosave_data,
          role: normalizePortalRole(account?.portal_role),
        })
      : null,
    autosave_updated_at: formState.autosave_updated_at ?? null,
    application: buildApplicationSummary(application, {
      ...formState,
    }, account),
  }
}

async function syncCandidateEvent(eventType, summary, meta = {}) {
  const delivery = await deliverCandidateEvent(eventType, summary, meta)
  if (!delivery.delivered) {
    console.error("Failed to sync candidate event:", eventType, delivery.reason)
  }
}

export async function listCandidateSummaries() {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const { data: accounts, error } = await supabase
      .from("candidate_accounts")
      .select(CANDIDATE_ACCOUNT_SELECT)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const normalizedAccounts = []
    for (const account of accounts ?? []) {
      normalizedAccounts.push(await expireCandidateAccountIfNeeded(supabase, account))
    }

    const candidateIds = normalizedAccounts.map((account) => account.id)
    const applications = await listApplicationsByCandidateIds(supabase, candidateIds)
    const applicationForms = await listCandidateFormSnapshotsByApplicationIds(
      supabase,
      (applications ?? []).map((application) => application.id),
    )
    const applicationFormMap = new Map(
      applicationForms.map((formState) => [formState.application_id, formState]),
    )

    return normalizedAccounts.map((account) =>
      mapSummary(
        account,
        applications.filter((application) => application.candidate_account_id === account.id),
        applicationFormMap,
      ),
    )
  })
}

export async function createCandidateAccount(input) {
  try {
    const supabase = getSupabaseAdmin()
    const email = ensureEmail(input.email)
    const password = ensurePassword(input.password)
    const status = normalizeStatus(input.status, "active")
    const portalRole = normalizePortalRole(input.portal_role, "candidate")
    const fullName = normalizeText(input.full_name)

    if (!fullName) {
      throw createHttpError(400, "Full name is required.")
    }

    const erfId = normalizeText(input.erf_id)
    if (!erfId) {
      throw createHttpError(400, "ERF is required.")
    }

    const employeeCode = normalizeText(input.employee_code) || null
    const contractNumber = normalizeText(input.contract_number) || null
    const actorUserId = normalizeText(input.created_by_internal_user_id) || null

    let authUser = await findAuthUserByEmail(supabase, email)

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: normalizeText(input.created_by_internal_user_id)
          ? {
              created_by_internal_user_id: normalizeText(input.created_by_internal_user_id),
            }
          : undefined,
      })

      if (error) {
        throw new Error(error.message)
      }

      authUser = data.user ?? null
    } else {
      // Auth user with this email already exists, update password to ensure it matches
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password,
      })

      if (updateError) {
        throw new Error(`Failed to update auth user password: ${updateError.message}`)
      }
    }

    if (!authUser?.id) {
      throw new Error("Failed to provision candidate identity.")
    }

    let account =
      (await getCandidateAccountByIdentityUserId(supabase, authUser.id)) ??
      (await getCandidateAccountByEmail(supabase, email))

    if (!account) {
      const { data, error } = await supabase
        .from("candidate_accounts")
        .insert({
          identity_user_id: authUser.id,
          email,
          full_name: fullName,
          phone: normalizeText(input.phone) || null,
          employee_code: employeeCode,
          personal_data: {
            contract_number: contractNumber,
          },
          status,
          portal_role: portalRole,
          created_by: actorUserId,
          updated_by: actorUserId,
          created_by_internal_user_id: actorUserId,
          activated_at: status === "active" ? new Date().toISOString() : null,
        })
        .select(CANDIDATE_ACCOUNT_SELECT)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      account = data
    } else {
      const { data, error } = await supabase
        .from("candidate_accounts")
        .update({
          email,
          full_name: fullName,
          phone: hasOwnField(input, "phone")
            ? normalizeText(input.phone) || null
            : (account.phone ?? null),
          employee_code: hasOwnField(input, "employee_code")
            ? employeeCode
            : (normalizeText(account.employee_code) || null),
          personal_data: {
            ...(account.personal_data && typeof account.personal_data === "object"
              ? account.personal_data
              : {}),
            ...(hasOwnField(input, "contract_number")
              ? { contract_number: contractNumber }
              : {}),
          },
          status,
          portal_role: normalizePortalRole(account.portal_role, portalRole),
          created_by: account.created_by ?? actorUserId,
          updated_by: actorUserId ?? account.updated_by ?? account.created_by ?? null,
          created_by_internal_user_id:
            account.created_by_internal_user_id ??
            actorUserId ??
            null,
          activated_at:
            status === "active" && account.status !== "active"
              ? new Date().toISOString()
              : (account.activated_at ?? account.created_at ?? null),
        })
        .eq("id", account.id)
        .select(CANDIDATE_ACCOUNT_SELECT)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      account = data
    }

    const applicationResult = await ensureApplication(supabase, account, input)
    const summary = await buildCandidateSummaryByAccount(supabase, account)
    await syncCandidateEvent("candidate.account_created", summary, {
      candidate_form_id: applicationResult?.candidateForm?.id ?? null,
    })

    return summary
  } catch (error) {
    throw normalizeOperationalError(error)
  }
}

export async function updateCandidateAccount(candidateId, input) {
  const supabase = getSupabaseAdmin()
  const account = await getCandidateAccountById(supabase, candidateId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const nextEmail = normalizeText(input.email) ? ensureEmail(input.email) : account.email
  const nextStatus = normalizeText(input.status) ? normalizeStatus(input.status) : account.status
  const nextPortalRole = normalizeText(input.portal_role)
    ? normalizePortalRole(input.portal_role)
    : normalizePortalRole(account.portal_role)
  const nextEmployeeCode = hasOwnField(input, "employee_code")
    ? normalizeText(input.employee_code) || null
    : normalizeText(account.employee_code) || null
  const nextContractNumber = hasOwnField(input, "contract_number")
    ? normalizeText(input.contract_number) || null
    : readContractNumber(account) || null
  const actorUserId = normalizeText(input.created_by_internal_user_id) || null

  if (nextEmail !== account.email) {
    const { error } = await supabase.auth.admin.updateUserById(account.identity_user_id, {
      email: nextEmail,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const { data: updatedAccount, error: accountError } = await supabase
    .from("candidate_accounts")
    .update({
      email: nextEmail,
      full_name: hasOwnField(input, "full_name")
        ? normalizeText(input.full_name) || account.full_name || null
        : (account.full_name ?? null),
      phone: hasOwnField(input, "phone") ? normalizeText(input.phone) || null : (account.phone ?? null),
      employee_code: nextEmployeeCode,
      personal_data: {
        ...(account.personal_data && typeof account.personal_data === "object" ? account.personal_data : {}),
        contract_number: nextContractNumber,
      },
      status: nextStatus,
      portal_role: nextPortalRole,
      created_by: account.created_by ?? actorUserId ?? null,
      updated_by: actorUserId ?? account.updated_by ?? account.created_by ?? null,
      created_by_internal_user_id:
        actorUserId || account.created_by_internal_user_id || null,
      activated_at:
        nextStatus === "active" && account.status !== "active"
          ? new Date().toISOString()
          : (account.activated_at ?? account.created_at ?? null),
    })
    .eq("id", candidateId)
    .select(CANDIDATE_ACCOUNT_SELECT)
    .single()

  if (accountError) {
    throw new Error(accountError.message)
  }

  const applicationResult = await ensureApplication(supabase, updatedAccount, input)

  const summary = await buildCandidateSummaryByAccount(supabase, updatedAccount)
  await syncCandidateEvent("candidate.account_status_changed", summary, {
    candidate_form_id: applicationResult?.candidateForm?.id ?? null,
  })

  return summary
}

export async function addCandidateApplication(candidateId, input) {
  const supabase = getSupabaseAdmin()
  const account = await getCandidateAccountById(supabase, candidateId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const applicationResult = await ensureApplication(supabase, account, input)
  const summary = await buildCandidateSummaryByAccount(supabase, account)
  await syncCandidateEvent("candidate.application_status_changed", summary, {
    candidate_form_id: applicationResult?.candidateForm?.id ?? null,
  })

  return summary
}

export async function switchCandidateToEmployee(candidateId) {
  const supabase = getSupabaseAdmin()
  const account = await getCandidateAccountById(supabase, candidateId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const { data, error } = await supabase
    .from("candidate_accounts")
    .update({
      portal_role: "employee",
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .select(CANDIDATE_ACCOUNT_SELECT)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const summary = await buildCandidateSummaryByAccount(supabase, data)
  await syncCandidateEvent("candidate.portal_role_changed", summary, {
    portal_role: "employee",
  })

  return summary
}

export async function resetCandidatePassword(candidateId, password) {
  const supabase = getSupabaseAdmin()
  const account = await getCandidateAccountById(supabase, candidateId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const { error } = await supabase.auth.admin.updateUserById(account.identity_user_id, {
    password: ensurePassword(password),
  })

  if (error) {
    throw new Error(error.message)
  }

  const summary = await buildCandidateSummaryByAccount(supabase, account)
  await syncCandidateEvent("candidate.password_reset", summary)

  return summary
}

export async function setCandidateActiveStatus(candidateId, isActive) {
  const supabase = getSupabaseAdmin()
  const account = await getCandidateAccountById(supabase, candidateId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const { data, error } = await supabase
    .from("candidate_accounts")
    .update({
      status: Boolean(isActive) ? "active" : "inactive",
      activated_at: Boolean(isActive)
        ? new Date().toISOString()
        : (account.activated_at ?? account.created_at ?? null),
    })
    .eq("id", candidateId)
    .select(CANDIDATE_ACCOUNT_SELECT)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const summary = await buildCandidateSummaryByAccount(supabase, data)
  await syncCandidateEvent("candidate.account_status_changed", summary)

  return summary
}

export async function revokeCandidateAccount(candidateId) {
  const supabase = getSupabaseAdmin()
  const account = await getCandidateAccountById(supabase, candidateId)
  if (!account) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const { data, error } = await supabase
    .from("candidate_accounts")
    .update({
      status: "revoked",
    })
    .eq("id", candidateId)
    .select(CANDIDATE_ACCOUNT_SELECT)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const summary = await buildCandidateSummaryByAccount(supabase, data)
  await syncCandidateEvent("candidate.account_status_changed", summary)

  return summary
}

export async function getAuthenticatedCandidateApplicationForm(identityUserId, applicationId) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const { account, application } = await getOwnedApplicationContext(supabase, identityUserId, applicationId)
    const formState = await ensureCandidateFormForApplication(supabase, account, application)

    return mapApplicationFormRecord(application, formState, account)
  })
}

export async function saveAuthenticatedCandidateApplicationForm(identityUserId, applicationId, input) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const { account, application } = await getOwnedApplicationContext(supabase, identityUserId, applicationId)
    const saveSections = normalizeApplicationFormSaveSections(input?.save_sections)
    const draftData = normalizeApplicationFormDraft({
      ...(input ?? {}),
      role: normalizePortalRole(account.portal_role),
    })
    const formSnapshot = await saveCandidateFormForApplication(
      supabase,
      account,
      application,
      draftData,
      saveSections,
    )

    const summary = buildCandidateEventSummary(account, application, formSnapshot)
    await syncCandidateEvent("candidate.form_progress_updated", summary, {
      candidate_form_id: formSnapshot.id,
    })

    return mapApplicationFormRecord(application, formSnapshot, account)
  })

}

export async function autosaveCandidateApplicationForm(identityUserId, applicationId, autosaveData) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const { account, application } = await getOwnedApplicationContext(supabase, identityUserId, applicationId)
    const candidateForm = await ensureCandidateFormForApplication(supabase, account, application)

    const { error } = await supabase
      .from("candidate_form")
      .update({
        autosave_data: autosaveData ?? null,
        autosave_updated_at: new Date().toISOString(),
      })
      .eq("id", candidateForm.id)

    if (error) {
      throw new Error(error.message)
    }

    return { ok: true }
  })
}

export async function submitAuthenticatedCandidateApplicationForm(identityUserId, applicationId) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const { account, application } = await getOwnedApplicationContext(supabase, identityUserId, applicationId)
    const isEmployeeDraftContractSubmission =
      normalizePortalRole(account?.portal_role) === "employee" &&
      normalizeText(application?.status).toLowerCase() === "submitted"

    const formSnapshot = await submitCandidateFormForApplication(
      supabase,
      account,
      application,
      validateFormSubmission,
    )
    const updatedApplication = await getCandidateApplicationById(supabase, application.id)

    const summary = buildCandidateEventSummary(account, updatedApplication, formSnapshot)
    await syncCandidateEvent(
      isEmployeeDraftContractSubmission
        ? "candidate.employee_draft_contract_submitted"
        : "candidate.application_submitted",
      summary,
      {
      candidate_form_id: formSnapshot.id,
      },
    )

    return mapApplicationFormRecord(updatedApplication, formSnapshot, account)
  })
  
}

export async function getCandidateFormSnapshot(candidateFormId) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const snapshot = await getCandidateFormSnapshotById(supabase, candidateFormId)

    if (!snapshot) {
      throw createHttpError(404, "Candidate form was not found.")
    }

    return snapshot
  })
}

export async function getCandidateSummary(candidateId) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const account = await getCandidateAccountById(supabase, candidateId)
    if (!account) {
      throw createHttpError(404, "Candidate account was not found.")
    }

    const normalizedAccount = await expireCandidateAccountIfNeeded(supabase, account)
    return buildCandidateSummaryByAccount(supabase, normalizedAccount)
  })
}

export async function getAuthenticatedCandidateProfile(identityUserId) {
  return runWithOperationalErrorNormalization(async () => {
    const supabase = getSupabaseAdmin()
    const normalizedAccount = await getActiveCandidateAccountByIdentityUserId(supabase, identityUserId)

    const { data: updatedAccount, error } = await supabase
      .from("candidate_accounts")
      .update({
        last_login_at: new Date().toISOString(),
      })
      .eq("id", normalizedAccount.id)
      .select(CANDIDATE_ACCOUNT_SELECT)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return buildCandidateSummaryByAccount(supabase, updatedAccount)
  })
}

export async function updateAuthenticatedCandidateProfile(identityUserId, input) {
  return runWithOperationalErrorNormalization(async () => {
    throw createHttpError(405, "Candidate profile updates are no longer supported.")
  })
}
