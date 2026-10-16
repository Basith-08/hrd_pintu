function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? Math.trunc(nextValue) : null
}

function getTimestamp() {
  return new Date().toISOString()
}

const candidateFormSelect = `
  *,
  family_and_emergency(*),
  education(*),
  work_history(*),
  personal_statement(*),
  employee_payroll_profile(*),
  employee_documents(*),
  candidate_languages(*),
  candidate_skills(*),
  candidate_references(*)
`

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
const CONTRACT_EMPLOYEE_DOCUMENT_TYPES = ["format_office", "skb", "other"]
const CANDIDATE_EDITABLE_DOCUMENT_TYPES = EMPLOYEE_DOCUMENT_TYPES.filter(
  (documentType) => !CONTRACT_EMPLOYEE_DOCUMENT_TYPES.includes(documentType),
)
export const APPLICATION_FORM_SAVE_SECTION_KEYS = [
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
  "payroll-statutory-data",
  "employee-documents",
]

function createEmptyPersonalStatement() {
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

function createEmptyEmployeePayrollProfile() {
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

function createEmptyEmployeeDocuments() {
  return EMPLOYEE_DOCUMENT_TYPES.reduce((documents, documentType) => {
    documents[documentType] = []
    return documents
  }, {})
}

function normalizeEducationLevel(value) {
  switch (value) {
    case "Elementary":
    case "SD":
    case "SD / Sederajat":
      return "SD / Sederajat"
    case "Junior High":
    case "SMP":
    case "SMP / MTs / Sederajat":
      return "SMP / MTs / Sederajat"
    case "Senior High":
    case "SMA":
    case "SMA / SMK / MA / Sederajat":
      return "SMA / SMK / MA / Sederajat"
    case "Diploma":
    case "Diploma I (D1)":
      return "Diploma I (D1)"
    case "Diploma II (D2)":
      return "Diploma II (D2)"
    case "Diploma III (D3)":
      return "Diploma III (D3)"
    case "Diploma IV (D4)":
      return "Diploma IV (D4)"
    case "Bachelor":
    case "S1":
    case "Sarjana (S1)":
      return "Sarjana (S1)"
    case "Master":
    case "S2":
    case "Magister (S2)":
      return "Magister (S2)"
    case "Doctorate":
    case "S3":
    case "Doktor (S3)":
      return "Doktor (S3)"
    default:
      return null
  }
}

function normalizeLanguageProficiency(value) {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "good":
      return "Good"
    case "fair":
      return "Fair"
    case "poor":
      return "Poor"
    default:
      return null
  }
}

function toDatabaseLanguageProficiency(value) {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "good":
      return "good"
    case "fair":
      return "fair"
    case "poor":
      return "poor"
    default:
      return null
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function uniqueStrings(values) {
  return [...new Set(toArray(values).map((value) => normalizeText(value)).filter(Boolean))]
}

function normalizeEmployeeDocuments(value) {
  const base = createEmptyEmployeeDocuments()

  for (const item of toArray(value)) {
    const documentType = normalizeText(item?.document_type)
    const filePath = normalizeText(item?.file_path)

    if (!EMPLOYEE_DOCUMENT_TYPES.includes(documentType) || !filePath) {
      continue
    }

    base[documentType].push(filePath)
  }

  return base
}

function normalizeCandidateFormSnapshot(data) {
  return {
    ...(data ?? {}),
    role: data?.role ?? "candidate",
    date_application: data?.date_candidate_form ?? data?.date_application ?? null,
    family_and_emergency: toArray(data?.family_and_emergency),
    education: toArray(data?.education).map((item) => ({
      ...item,
      level: normalizeEducationLevel(item?.level),
    })),
    work_history: toArray(data?.work_history),
    candidate_languages: toArray(data?.candidate_languages).map((item) => ({
      ...item,
      speaking: normalizeLanguageProficiency(item?.speaking),
      reading: normalizeLanguageProficiency(item?.reading),
      listening: normalizeLanguageProficiency(item?.listening),
      writing: normalizeLanguageProficiency(item?.writing),
    })),
    candidate_skills: [...toArray(data?.candidate_skills)].sort(
      (left, right) => Number(left?.skill_order ?? 0) - Number(right?.skill_order ?? 0),
    ),
    candidate_references: [...toArray(data?.candidate_references)].sort(
      (left, right) => Number(left?.reference_order ?? 0) - Number(right?.reference_order ?? 0),
    ),
    employee_payroll_profile: Array.isArray(data?.employee_payroll_profile)
      ? (data.employee_payroll_profile[0] ?? null)
      : (data?.employee_payroll_profile ?? null),
    employee_documents: normalizeEmployeeDocuments(data?.employee_documents),
    personal_statement: Array.isArray(data?.personal_statement)
      ? (data.personal_statement[0] ?? null)
      : (data?.personal_statement ?? null),
  }
}

function createDefaultDraftData(account, application) {
  return {
    role: normalizeText(account?.portal_role) || "candidate",
    photograph: "",
    date_application: "",
    notice_period: "",
    available_start_date: "",
    join_date: "",
    hire_location: "",
    full_name: normalizeText(account?.full_name),
    gender: "",
    place_of_birth: "",
    date_of_birth: "",
    nationality: "",
    religion: "",
    marital_status: "",
    blood_type: "",
    ethnic: "",
    id_card_address: "",
    residential_address: "",
    personal_email: normalizeText(account?.email),
    instagram: "",
    linkedin: "",
    phone_number: normalizeText(account?.phone),
    id_type: "",
    id_no: "",
    transportation_type: "",
    transportation_ownership: "",
    residence_ownership: "",
    family_and_emergency: [],
    education: [],
    work_history: [],
    candidate_languages: [],
    candidate_skills: [],
    candidate_references: [],
    employee_payroll_profile: createEmptyEmployeePayrollProfile(),
    employee_documents: createEmptyEmployeeDocuments(),
    personal_statement: {
      contract: false,
      contract_period: "",
      reference_check_reason: "",
      expected_salary: null,
      business_trip: false,
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
    },
    _application_id: application?.id ?? null,
  }
}

export function mapCandidateFormSnapshotToDraftData(snapshot, account = null, application = null) {
  if (!snapshot) {
    return createDefaultDraftData(account, application)
  }

  const fallbackFullName = [snapshot.first_name, snapshot.middle_name, snapshot.last_name]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ")

  return {
    role: normalizeText(snapshot.role) || normalizeText(account?.portal_role) || "candidate",
    photograph: snapshot.photograph ?? "",
    date_application: snapshot.date_application ?? "",
    notice_period: snapshot.notice_period ?? "",
    available_start_date: snapshot.available_start_date ?? "",
    join_date: snapshot.join_date ?? "",
    hire_location: snapshot.hire_location ?? "",
    full_name: normalizeText(snapshot.full_name) || fallbackFullName || normalizeText(account?.full_name) || "",
    gender: snapshot.gender ?? "",
    place_of_birth: snapshot.place_of_birth ?? "",
    date_of_birth: snapshot.date_of_birth ?? "",
    nationality: snapshot.nationality ?? "",
    religion: snapshot.religion ?? "",
    marital_status: snapshot.marital_status ?? "",
    blood_type: snapshot.blood_type ?? "",
    ethnic: snapshot.ethnic ?? "",
    id_card_address: snapshot.id_card_address ?? "",
    residential_address: snapshot.residential_address ?? "",
    personal_email: snapshot.personal_email ?? "",
    instagram: snapshot.instagram ?? "",
    linkedin: snapshot.linkedin ?? "",
    phone_number: snapshot.phone_number ?? snapshot.home_phone ?? "",
    id_type: snapshot.id_type ?? "",
    id_no: snapshot.id_no ?? "",
    transportation_type: snapshot.transportation_type ?? "",
    transportation_ownership: snapshot.transportation_ownership ?? "",
    residence_ownership: snapshot.residence_ownership ?? "",
    family_and_emergency: snapshot.family_and_emergency.map((item) => ({
      name: item.name ?? "",
      relationship: item.relationship ?? "",
      gender: item.gender ?? "",
      place_and_date_of_birth: item.place_and_date_of_birth ?? "",
      education: item.education ?? "",
      description: item.description ?? "",
      occupation: item.occupation ?? "",
      remarks: item.remarks ?? "",
      category: item.category ?? "",
    })),
    education: snapshot.education.map((item) => ({
      level: item.level ?? "",
      institution: item.institution ?? "",
      city: item.city ?? "",
      major: item.major ?? "",
      from_year: normalizeInteger(item.from_year),
      to_year: normalizeInteger(item.to_year),
      category: item.category ?? "",
      description: item.description ?? "",
    })),
    work_history: snapshot.work_history.map((item) => ({
      company: item.company ?? "",
      position: item.position ?? "",
      from_year: normalizeInteger(item.from_year),
      to_year: normalizeInteger(item.to_year),
      reason_to_quitting: item.reason_to_quitting ?? "",
      last_salary: normalizeInteger(item.last_salary),
      benefit: item.benefit ?? "",
      description: item.description ?? "",
      company_address: item.company_address ?? "",
      company_phone: item.company_phone ?? "",
      direct_superior_title: item.direct_superior_title ?? "",
      organization_structure: item.organization_structure ?? "",
    })),
    candidate_languages: snapshot.candidate_languages.map((item) => ({
      language_name: item.language_name ?? "",
      speaking: item.speaking ?? "",
      reading: item.reading ?? "",
      listening: item.listening ?? "",
      writing: item.writing ?? "",
    })),
    candidate_skills: snapshot.candidate_skills.map((item) => ({
      skill_name: item.skill_name ?? "",
      description: item.description ?? "",
      skill_order: normalizeInteger(item.skill_order),
    })),
    candidate_references: snapshot.candidate_references.map((item) => ({
      name: item.name ?? "",
      phone_number: item.phone_number ?? "",
      relationship: item.relationship ?? "",
      position: item.position ?? "",
      reference_order: normalizeInteger(item.reference_order),
    })),
    employee_payroll_profile: {
      bank_name: snapshot.employee_payroll_profile?.bank_name ?? "",
      bank_account_number: snapshot.employee_payroll_profile?.bank_account_number ?? "",
      account_holder_name: snapshot.employee_payroll_profile?.account_holder_name ?? "",
      branch_name: snapshot.employee_payroll_profile?.branch_name ?? "",
      tax_identification_number:
        snapshot.employee_payroll_profile?.tax_identification_number ?? "",
      bpjs_health_enrollment_preference:
        snapshot.employee_payroll_profile?.bpjs_health_enrollment_preference ?? "",
      bpjs_health_decline_reason:
        snapshot.employee_payroll_profile?.bpjs_health_decline_reason ?? "",
      bpjs_health_decline_reason_other:
        snapshot.employee_payroll_profile?.bpjs_health_decline_reason_other ?? "",
      bpjs_employment_status: snapshot.employee_payroll_profile?.bpjs_employment_status ?? "",
    },
    employee_documents: EMPLOYEE_DOCUMENT_TYPES.reduce((documents, documentType) => {
      documents[documentType] = Array.isArray(snapshot.employee_documents?.[documentType])
        ? snapshot.employee_documents[documentType]
        : []
      return documents
    }, {}),
    personal_statement: {
      contract: Boolean(snapshot.personal_statement?.contract),
      contract_period: snapshot.personal_statement?.contract_period ?? "",
      reference_check_reason: snapshot.personal_statement?.reference_check_reason ?? "",
      expected_salary: snapshot.personal_statement?.expected_salary ?? null,
      business_trip: Boolean(snapshot.personal_statement?.business_trip),
      previous_application: Boolean(snapshot.personal_statement?.previous_application),
      previous_application_details: snapshot.personal_statement?.previous_application_details ?? "",
      reference_check_allowed: Boolean(snapshot.personal_statement?.reference_check_allowed),
      family_or_friend_in_company: Boolean(snapshot.personal_statement?.family_or_friend_in_company),
      serious_illness: Boolean(snapshot.personal_statement?.serious_illness),
      serious_illness_details: snapshot.personal_statement?.serious_illness_details ?? "",
      serious_accident_boolean: Boolean(snapshot.personal_statement?.serious_accident_boolean),
      psychological_test: Boolean(snapshot.personal_statement?.psychological_test),
      psychological_test_location: snapshot.personal_statement?.psychological_test_location ?? "",
      psychological_test_purpose: snapshot.personal_statement?.psychological_test_purpose ?? "",
      company_legal_issue: Boolean(snapshot.personal_statement?.company_legal_issue),
      company_legal_issue_details: snapshot.personal_statement?.company_legal_issue_details ?? "",
      family_or_friend_details: snapshot.personal_statement?.family_or_friend_details ?? "",
      serious_accident_details: snapshot.personal_statement?.serious_accident_details ?? "",
      civil_or_criminal_case: Boolean(snapshot.personal_statement?.civil_or_criminal_case),
      civil_or_criminal_case_details:
        snapshot.personal_statement?.civil_or_criminal_case_details ?? "",
    },
  }
}

function buildCandidateFormParentPayload(draftData, existingSnapshot, account, application, completionStatus) {
  return {
    application_id: application.id,
    candidate_account_id: account.id,
    employee_request_form_id: application.erf_id,
    candidate_id: account.identity_user_id,
    date_candidate_form: draftData.date_application || existingSnapshot?.date_candidate_form || null,
    notice_period: draftData.notice_period || existingSnapshot?.notice_period || null,
    full_name: draftData.full_name || existingSnapshot?.full_name || account.full_name || null,
    hire_location: draftData.hire_location || existingSnapshot?.hire_location || null,
    date_of_birth: draftData.date_of_birth || existingSnapshot?.date_of_birth || null,
    place_of_birth: draftData.place_of_birth || existingSnapshot?.place_of_birth || null,
    nationality: draftData.nationality || existingSnapshot?.nationality || null,
    marital_status: draftData.marital_status || existingSnapshot?.marital_status || null,
    religion: draftData.religion || existingSnapshot?.religion || null,
    gender: draftData.gender || existingSnapshot?.gender || null,
    ethnic: draftData.ethnic || existingSnapshot?.ethnic || null,
    blood_type: draftData.blood_type || existingSnapshot?.blood_type || null,
    id_card_address: draftData.id_card_address || existingSnapshot?.id_card_address || null,
    residential_address: draftData.residential_address || existingSnapshot?.residential_address || null,
    personal_email: draftData.personal_email || existingSnapshot?.personal_email || account.email || null,
    instagram: draftData.instagram || existingSnapshot?.instagram || null,
    linkedin: draftData.linkedin || existingSnapshot?.linkedin || null,
    phone_number: draftData.phone_number || existingSnapshot?.phone_number || existingSnapshot?.home_phone || null,
    id_type: draftData.id_type || existingSnapshot?.id_type || null,
    id_no: draftData.id_no || existingSnapshot?.id_no || null,
    photograph: draftData.photograph || existingSnapshot?.photograph || null,
    completion_status: completionStatus,
    available_start_date:
      draftData.available_start_date || existingSnapshot?.available_start_date || null,
    join_date: draftData.join_date || existingSnapshot?.join_date || null,
    transportation_type: draftData.transportation_type || existingSnapshot?.transportation_type || null,
    transportation_ownership:
      draftData.transportation_ownership || existingSnapshot?.transportation_ownership || null,
    residence_ownership: draftData.residence_ownership || existingSnapshot?.residence_ownership || null,
    updated_at: getTimestamp(),
  }
}

function buildFamilyEmergencyPayload(candidateFormId, draftData, existingSnapshot) {
  return toArray(draftData.family_and_emergency)
    .filter(
      (item) =>
        item.name ||
        item.relationship ||
        item.gender ||
        item.place_and_date_of_birth ||
        item.education ||
        item.description ||
        item.occupation ||
        item.remarks ||
        item.category,
    )
    .map((item) => ({
      candidate_form_id: candidateFormId,
      name: item.name || null,
      relationship: item.relationship || null,
      gender: item.gender || null,
      place_and_date_of_birth: item.place_and_date_of_birth || null,
      education: item.education || null,
      description: item.description || null,
      occupation: item.occupation || null,
      remarks: item.remarks || null,
      category: item.category || null,
    }))
}

function buildEducationPayload(candidateFormId, draftData) {
  return toArray(draftData.education)
    .filter(
      (item) =>
        item.institution || item.city || item.major || item.description || item.from_year !== null || item.to_year !== null,
    )
    .map((item) => ({
      candidate_form_id: candidateFormId,
      level: normalizeEducationLevel(item.level),
      institution: item.institution || null,
      city: item.city || null,
      major: item.major || null,
      from_year: normalizeInteger(item.from_year),
      to_year: normalizeInteger(item.to_year),
      category: item.category || null,
      description: item.description || null,
    }))
}

function buildWorkHistoryPayload(candidateFormId, draftData, existingSnapshot) {
  return toArray(draftData.work_history)
    .filter(
      (item) =>
        item.company ||
        item.position ||
        item.reason_to_quitting ||
        item.last_salary !== null ||
        item.benefit ||
        item.description ||
        item.company_address ||
        item.company_phone ||
        item.direct_superior_title ||
        item.organization_structure,
    )
    .map((item) => ({
      candidate_form_id: candidateFormId,
      company: item.company || null,
      position: item.position || null,
      from_year: normalizeInteger(item.from_year),
      to_year: normalizeInteger(item.to_year),
      reason_to_quitting: item.reason_to_quitting || null,
      last_salary: normalizeInteger(item.last_salary),
      benefit: item.benefit || null,
      description: item.description || null,
      company_address: item.company_address || null,
      company_phone: item.company_phone || null,
      direct_superior_title: item.direct_superior_title || null,
      organization_structure: item.organization_structure || null,
    }))
}

function buildLanguagePayload(candidateFormId, draftData) {
  return toArray(draftData.candidate_languages)
    .filter((item) => item.language_name || item.speaking || item.reading || item.listening || item.writing)
    .map((item) => ({
      candidate_form_id: candidateFormId,
      language_name: normalizeText(item.language_name),
      speaking: toDatabaseLanguageProficiency(item.speaking),
      reading: toDatabaseLanguageProficiency(item.reading),
      listening: toDatabaseLanguageProficiency(item.listening),
      writing: toDatabaseLanguageProficiency(item.writing),
      updated_at: getTimestamp(),
    }))
    .filter((item) => item.language_name)
}

function buildSkillPayload(candidateFormId, draftData, existingSnapshot) {
  return toArray(draftData.candidate_skills)
    .filter((item) => item.skill_name || item.description)
    .map((item, index) => {
      const existingItem = existingSnapshot?.candidate_skills?.[index] ?? {}
      return {
        candidate_form_id: candidateFormId,
        skill_name: normalizeText(item.skill_name),
        description: item.description || null,
        skill_order: existingItem.skill_order ?? index + 1,
        updated_at: getTimestamp(),
      }
    })
    .filter((item) => item.skill_name)
}

function buildReferencePayload(candidateFormId, draftData, existingSnapshot) {
  return toArray(draftData.candidate_references)
    .filter((item) => item.name || item.phone_number || item.relationship || item.position)
    .map((item, index) => {
      const existingItem = existingSnapshot?.candidate_references?.[index] ?? {}
      return {
        candidate_form_id: candidateFormId,
        name: normalizeText(item.name),
        phone_number: item.phone_number || null,
        relationship: item.relationship || null,
        position: item.position || null,
        reference_order: existingItem.reference_order ?? index + 1,
        updated_at: getTimestamp(),
      }
    })
    .filter((item) => item.name)
}

function buildPersonalStatementPayload(candidateFormId, draftData, existingSnapshot) {
  const fallback = {
    ...createEmptyPersonalStatement(),
    ...(existingSnapshot?.personal_statement ?? {}),
  }

  return {
    candidate_form_id: candidateFormId,
    contract: Boolean(draftData.personal_statement?.contract ?? fallback.contract),
    contract_period: draftData.personal_statement?.contract_period || fallback.contract_period || null,
    reference_check_reason:
      draftData.personal_statement?.reference_check_reason || fallback.reference_check_reason || null,
    business_trip: Boolean(draftData.personal_statement?.business_trip ?? fallback.business_trip),
    expected_salary:
      normalizeInteger(draftData.personal_statement?.expected_salary) ?? fallback.expected_salary ?? null,
    previous_application:
      Boolean(draftData.personal_statement?.previous_application ?? fallback.previous_application),
    previous_application_details:
      draftData.personal_statement?.previous_application_details || fallback.previous_application_details || null,
    reference_check_allowed:
      Boolean(draftData.personal_statement?.reference_check_allowed ?? fallback.reference_check_allowed),
    family_or_friend_in_company:
      Boolean(
        draftData.personal_statement?.family_or_friend_in_company ??
          fallback.family_or_friend_in_company,
      ),
    serious_illness: Boolean(draftData.personal_statement?.serious_illness ?? fallback.serious_illness),
    serious_illness_details:
      draftData.personal_statement?.serious_illness_details || fallback.serious_illness_details || null,
    serious_accident_boolean:
      Boolean(
        draftData.personal_statement?.serious_accident_boolean ??
          fallback.serious_accident_boolean,
      ),
    psychological_test:
      Boolean(draftData.personal_statement?.psychological_test ?? fallback.psychological_test),
    psychological_test_location:
      draftData.personal_statement?.psychological_test_location ||
      fallback.psychological_test_location ||
      null,
    psychological_test_purpose:
      draftData.personal_statement?.psychological_test_purpose ||
      fallback.psychological_test_purpose ||
      null,
    company_legal_issue:
      Boolean(draftData.personal_statement?.company_legal_issue ?? fallback.company_legal_issue),
    company_legal_issue_details:
      draftData.personal_statement?.company_legal_issue_details ||
      fallback.company_legal_issue_details ||
      null,
    family_or_friend_details:
      draftData.personal_statement?.family_or_friend_details || fallback.family_or_friend_details || null,
    serious_accident_details:
      draftData.personal_statement?.serious_accident_details || fallback.serious_accident_details || null,
    civil_or_criminal_case:
      Boolean(draftData.personal_statement?.civil_or_criminal_case ?? fallback.civil_or_criminal_case),
    civil_or_criminal_case_details:
      draftData.personal_statement?.civil_or_criminal_case_details ||
      fallback.civil_or_criminal_case_details ||
      null,
  }
}

function buildEmployeePayrollProfilePayload(candidateFormId, draftData, existingSnapshot) {
  const fallback = {
    ...createEmptyEmployeePayrollProfile(),
    ...(existingSnapshot?.employee_payroll_profile ?? {}),
  }

  return {
    candidate_form_id: candidateFormId,
    bank_name: draftData.employee_payroll_profile?.bank_name || fallback.bank_name || null,
    bank_account_number:
      draftData.employee_payroll_profile?.bank_account_number || fallback.bank_account_number || null,
    account_holder_name:
      draftData.employee_payroll_profile?.account_holder_name || fallback.account_holder_name || null,
    branch_name: draftData.employee_payroll_profile?.branch_name || fallback.branch_name || null,
    tax_identification_number:
      draftData.employee_payroll_profile?.tax_identification_number ||
      fallback.tax_identification_number ||
      null,
    bpjs_health_enrollment_preference:
      draftData.employee_payroll_profile?.bpjs_health_enrollment_preference ||
      fallback.bpjs_health_enrollment_preference ||
      null,
    bpjs_health_decline_reason:
      draftData.employee_payroll_profile?.bpjs_health_decline_reason ||
      fallback.bpjs_health_decline_reason ||
      null,
    bpjs_health_decline_reason_other:
      draftData.employee_payroll_profile?.bpjs_health_decline_reason_other ||
      fallback.bpjs_health_decline_reason_other ||
      null,
    bpjs_employment_status:
      draftData.employee_payroll_profile?.bpjs_employment_status ||
      fallback.bpjs_employment_status ||
      null,
  }
}

function buildEmployeeDocumentsPayload(candidateFormId, draftData) {
  return EMPLOYEE_DOCUMENT_TYPES.flatMap((documentType) =>
    toArray(draftData.employee_documents?.[documentType])
      .map((filePath) => normalizeText(filePath))
      .filter(Boolean)
      .map((filePath) => ({
        candidate_form_id: candidateFormId,
        document_type: documentType,
        file_path: filePath,
      })),
  )
}

async function replaceCandidateEditableEmployeeDocuments(supabase, candidateFormId, draftData) {
  const payload = CANDIDATE_EDITABLE_DOCUMENT_TYPES.flatMap((documentType) =>
    toArray(draftData.employee_documents?.[documentType])
      .map((filePath) => normalizeText(filePath))
      .filter(Boolean)
      .map((filePath) => ({
        candidate_form_id: candidateFormId,
        document_type: documentType,
        file_path: filePath,
      })),
  )

  const { error: deleteError } = await supabase
    .from("employee_documents")
    .delete()
    .eq("candidate_form_id", candidateFormId)
    .in("document_type", CANDIDATE_EDITABLE_DOCUMENT_TYPES)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (!payload.length) {
    return
  }

  const { error } = await supabase.from("employee_documents").insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}

async function replaceChildTable(supabase, tableName, candidateFormId, payload) {
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq("candidate_form_id", candidateFormId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (!payload.length) {
    return
  }

  const { error } = await supabase.from(tableName).insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertPersonalStatement(supabase, payload) {
  const { error } = await supabase.from("personal_statement").upsert(payload, {
    onConflict: "candidate_form_id",
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertEmployeePayrollProfile(supabase, payload) {
  const { error } = await supabase.from("employee_payroll_profile").upsert(payload, {
    onConflict: "candidate_form_id",
  })

  if (error) {
    throw new Error(error.message)
  }
}

function shouldSyncSection(saveSections, sectionKey) {
  return !Array.isArray(saveSections) || saveSections.length === 0 || saveSections.includes(sectionKey)
}

async function syncRelations(supabase, candidateFormId, draftData, existingSnapshot, saveSections = null) {
  const tasks = []

  if (shouldSyncSection(saveSections, "family-emergency")) {
    tasks.push(
      replaceChildTable(
        supabase,
        "family_and_emergency",
        candidateFormId,
        buildFamilyEmergencyPayload(candidateFormId, draftData, existingSnapshot),
      ),
    )
  }

  if (shouldSyncSection(saveSections, "education-training")) {
    tasks.push(
      replaceChildTable(
        supabase,
        "education",
        candidateFormId,
        buildEducationPayload(candidateFormId, draftData),
      ),
    )
  }

  if (shouldSyncSection(saveSections, "employment-history")) {
    tasks.push(
      replaceChildTable(
        supabase,
        "work_history",
        candidateFormId,
        buildWorkHistoryPayload(candidateFormId, draftData, existingSnapshot),
      ),
    )
  }

  if (shouldSyncSection(saveSections, "skill-abilities")) {
    tasks.push(
      replaceChildTable(
        supabase,
        "candidate_languages",
        candidateFormId,
        buildLanguagePayload(candidateFormId, draftData),
      ),
      replaceChildTable(
        supabase,
        "candidate_skills",
        candidateFormId,
        buildSkillPayload(candidateFormId, draftData, existingSnapshot),
      ),
    )
  }

  if (shouldSyncSection(saveSections, "reference-data")) {
    tasks.push(
      replaceChildTable(
        supabase,
        "candidate_references",
        candidateFormId,
        buildReferencePayload(candidateFormId, draftData, existingSnapshot),
      ),
    )
  }

  if (shouldSyncSection(saveSections, "personal-statement")) {
    tasks.push(
      upsertPersonalStatement(
        supabase,
        buildPersonalStatementPayload(candidateFormId, draftData, existingSnapshot),
      ),
    )
  }

  if (shouldSyncSection(saveSections, "payroll-statutory-data")) {
    tasks.push(
      upsertEmployeePayrollProfile(
        supabase,
        buildEmployeePayrollProfilePayload(candidateFormId, draftData, existingSnapshot),
      ),
    )
  }

  if (
    shouldSyncSection(saveSections, "candidate-documents") ||
    shouldSyncSection(saveSections, "employee-documents")
  ) {
    tasks.push(replaceCandidateEditableEmployeeDocuments(supabase, candidateFormId, draftData))
  }

  await Promise.all(tasks)
}

async function syncCandidateAccountFromSnapshot(supabase, account, snapshot) {
  const fullName =
    normalizeText(snapshot.full_name) ||
    [snapshot.first_name, snapshot.middle_name, snapshot.last_name]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(" ")

  const { data: existingAccount, error: accountError } = await supabase
    .from("candidate_accounts")
    .select("id, full_name, phone, personal_data")
    .eq("id", account.id)
    .maybeSingle()

  if (accountError) {
    throw new Error(accountError.message)
  }

  const personalData =
    existingAccount?.personal_data && typeof existingAccount.personal_data === "object"
      ? { ...existingAccount.personal_data }
      : {}

  Object.assign(personalData, {
    full_name: fullName || null,
    hire_location: snapshot.hire_location ?? null,
    date_of_birth: snapshot.date_of_birth ?? null,
    place_of_birth: snapshot.place_of_birth ?? null,
    nationality: snapshot.nationality ?? null,
    marital_status: snapshot.marital_status ?? null,
    religion: snapshot.religion ?? null,
    gender: snapshot.gender ?? null,
    ethnic: snapshot.ethnic ?? null,
    blood_type: snapshot.blood_type ?? null,
    id_card_address: snapshot.id_card_address ?? null,
    residential_address: snapshot.residential_address ?? null,
    personal_email: snapshot.personal_email ?? null,
    instagram: snapshot.instagram ?? null,
    linkedin: snapshot.linkedin ?? null,
    phone_number: snapshot.phone_number ?? null,
    id_type: snapshot.id_type ?? null,
    id_no: snapshot.id_no ?? null,
    photograph: snapshot.photograph ?? null,
    available_start_date: snapshot.available_start_date ?? null,
    join_date: snapshot.join_date ?? null,
    transportation_type: snapshot.transportation_type ?? null,
    transportation_ownership: snapshot.transportation_ownership ?? null,
    residence_ownership: snapshot.residence_ownership ?? null,
  })

  const { error } = await supabase
    .from("candidate_accounts")
    .update({
      full_name: fullName || existingAccount?.full_name || null,
      phone: snapshot.phone_number ?? existingAccount?.phone ?? null,
      personal_data: personalData,
    })
    .eq("id", account.id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function listCandidateFormSnapshotsByApplicationIds(supabase, applicationIds) {
  if (!applicationIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateFormSelect)
    .in("application_id", applicationIds)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item) => normalizeCandidateFormSnapshot(item))
}

export async function getCandidateFormSnapshotById(supabase, candidateFormId) {
  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateFormSelect)
    .eq("id", candidateFormId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? normalizeCandidateFormSnapshot(data) : null
}

export async function getCandidateFormSnapshotByApplicationId(supabase, applicationId) {
  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateFormSelect)
    .eq("application_id", applicationId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? normalizeCandidateFormSnapshot(data) : null
}

export async function appendCandidateFormEmployeeDocumentsById(
  supabase,
  candidateFormId,
  input,
) {
  const normalizedCandidateFormId = normalizeText(candidateFormId)
  if (!normalizedCandidateFormId) {
    throw new Error("Candidate form id is required.")
  }

  const documentType = normalizeText(input?.document_type)
  if (!CONTRACT_EMPLOYEE_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error("Document type is invalid.")
  }

  const filePaths = uniqueStrings(input?.file_paths)
  if (!filePaths.length) {
    throw new Error("At least one file path is required.")
  }

  const snapshot = await getCandidateFormSnapshotById(supabase, normalizedCandidateFormId)
  if (!snapshot) {
    throw new Error("Candidate form was not found.")
  }

  const draftData = mapCandidateFormSnapshotToDraftData(snapshot)
  draftData.employee_documents = {
    ...(draftData.employee_documents ?? createEmptyEmployeeDocuments()),
    [documentType]: uniqueStrings([
      ...toArray(snapshot.employee_documents?.[documentType]),
      ...filePaths,
    ]),
  }

  await replaceChildTable(
    supabase,
    "employee_documents",
    normalizedCandidateFormId,
    buildEmployeeDocumentsPayload(normalizedCandidateFormId, draftData),
  )

  const { error } = await supabase
    .from("candidate_form")
    .update({
      updated_at: getTimestamp(),
    })
    .eq("id", normalizedCandidateFormId)

  if (error) {
    throw new Error(error.message)
  }

  return getCandidateFormSnapshotById(supabase, normalizedCandidateFormId)
}

export async function removeCandidateFormEmployeeDocumentById(
  supabase,
  candidateFormId,
  input,
) {
  const normalizedCandidateFormId = normalizeText(candidateFormId)
  if (!normalizedCandidateFormId) {
    throw new Error("Candidate form id is required.")
  }

  const documentType = normalizeText(input?.document_type)
  if (!CONTRACT_EMPLOYEE_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error("Document type is invalid.")
  }

  const filePath = normalizeText(input?.file_path)
  if (!filePath) {
    throw new Error("File path is required.")
  }

  const snapshot = await getCandidateFormSnapshotById(supabase, normalizedCandidateFormId)
  if (!snapshot) {
    throw new Error("Candidate form was not found.")
  }

  const draftData = mapCandidateFormSnapshotToDraftData(snapshot)
  draftData.employee_documents = {
    ...(draftData.employee_documents ?? createEmptyEmployeeDocuments()),
    [documentType]: toArray(snapshot.employee_documents?.[documentType])
      .map(normalizeText)
      .filter((path) => path && path !== filePath),
  }

  await replaceChildTable(
    supabase,
    "employee_documents",
    normalizedCandidateFormId,
    buildEmployeeDocumentsPayload(normalizedCandidateFormId, draftData),
  )

  const { error } = await supabase
    .from("candidate_form")
    .update({
      updated_at: getTimestamp(),
    })
    .eq("id", normalizedCandidateFormId)

  if (error) {
    throw new Error(error.message)
  }

  return getCandidateFormSnapshotById(supabase, normalizedCandidateFormId)
}

async function getLatestCandidateFormSnapshotForCopy(supabase, candidateAccountId, excludeApplicationId) {
  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateFormSelect)
    .eq("candidate_account_id", candidateAccountId)
    .neq("application_id", excludeApplicationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? normalizeCandidateFormSnapshot(data) : null
}

export async function ensureCandidateFormForApplication(supabase, account, application) {
  const existingSnapshot = await getCandidateFormSnapshotByApplicationId(supabase, application.id)
  if (existingSnapshot) {
    return existingSnapshot
  }

  const sourceSnapshot = await getLatestCandidateFormSnapshotForCopy(
    supabase,
    account.id,
    application.id,
  )
  const draftData = mapCandidateFormSnapshotToDraftData(sourceSnapshot, account, application)
  const parentPayload = buildCandidateFormParentPayload(
    draftData,
    sourceSnapshot,
    account,
    application,
    "in_progress",
  )

  const { data: inserted, error } = await supabase
    .from("candidate_form")
    .insert({
      ...parentPayload,
      created_at: getTimestamp(),
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await syncRelations(supabase, inserted.id, draftData, sourceSnapshot)
  const snapshot = await getCandidateFormSnapshotById(supabase, inserted.id)

  if (!snapshot) {
    throw new Error("Failed to load the newly created candidate form.")
  }

  await syncCandidateAccountFromSnapshot(supabase, account, snapshot)

  return snapshot
}

export async function saveCandidateFormForApplication(
  supabase,
  account,
  application,
  draftData,
  saveSections = null,
) {
  const existingSnapshot = await ensureCandidateFormForApplication(supabase, account, application)
  const completionStatus =
    normalizeText(account?.portal_role).toLowerCase() === "employee"
      ? "in_progress"
      : application.status === "submitted"
        ? "completed"
        : "in_progress"

  const { error } = await supabase
    .from("candidate_form")
    .update(buildCandidateFormParentPayload(draftData, existingSnapshot, account, application, completionStatus))
    .eq("id", existingSnapshot.id)

  if (error) {
    throw new Error(error.message)
  }

  await syncRelations(supabase, existingSnapshot.id, draftData, existingSnapshot, saveSections)
  const snapshot = await getCandidateFormSnapshotById(supabase, existingSnapshot.id)

  if (!snapshot) {
    throw new Error("Failed to load the updated candidate form.")
  }

  await syncCandidateAccountFromSnapshot(supabase, account, snapshot)

  return snapshot
}

export async function submitCandidateFormForApplication(
  supabase,
  account,
  application,
  validateFormSubmission,
) {
  const existingSnapshot = await ensureCandidateFormForApplication(supabase, account, application)
  const draftData = mapCandidateFormSnapshotToDraftData(existingSnapshot, account, application)

  validateFormSubmission(draftData)

  const submittedAt = getTimestamp()
  const { error: formError } = await supabase
    .from("candidate_form")
    .update({
      completion_status: "completed",
      updated_at: submittedAt,
      autosave_data: null,
      autosave_updated_at: null,
    })
    .eq("id", existingSnapshot.id)

  if (formError) {
    throw new Error(formError.message)
  }

  const { error: applicationError } = await supabase
    .from("candidate_applications")
    .update({
      status: "submitted",
      submitted_at: submittedAt,
    })
    .eq("id", application.id)

  if (applicationError) {
    throw new Error(applicationError.message)
  }

  const snapshot = await getCandidateFormSnapshotById(supabase, existingSnapshot.id)

  if (!snapshot) {
    throw new Error("Failed to load the submitted candidate form.")
  }

  await syncCandidateAccountFromSnapshot(supabase, account, snapshot)

  return snapshot
}
