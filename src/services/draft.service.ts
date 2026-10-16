import type { CandidateApplicationFormDraft } from "@/domain/entities/CandidateApplicationForm"
import { callBackendApi } from "@/infrastructure/http/backendApi"

export const CANDIDATE_APPLICATION_DRAFT_STORAGE_PREFIX = "candidate-application-draft:"

export function getCandidateApplicationDraftStorageKey(applicationId: string) {
  return `${CANDIDATE_APPLICATION_DRAFT_STORAGE_PREFIX}${applicationId}`
}

export async function syncCandidateApplicationDraft(
  applicationId: string,
  draft: CandidateApplicationFormDraft,
) {
  return callBackendApi(`/auth/applications/${encodeURIComponent(applicationId)}/autosave`, {
    method: "PATCH",
    body: JSON.stringify({ autosave_data: draft }),
  })
}
