import { getAuthenticatedCandidateProfile } from "~~/server/services/candidateAccountService.js"

export async function buildAuthenticatedProfile(context) {
  const summary = await getAuthenticatedCandidateProfile(context.userId)

  return {
    id: summary.identity_user_id,
    candidate_id: summary.candidate_id,
    email: summary.email,
    role: summary.role,
    full_name: summary.full_name,
    phone: summary.phone,
    employee_code: summary.employee_code ?? null,
    contract_number: summary.contract_number ?? null,
    status: summary.status,
    created_at: summary.created_at,
    activated_at: summary.activated_at,
    last_login_at: summary.last_login_at,
    applications: summary.applications,
  }
}
