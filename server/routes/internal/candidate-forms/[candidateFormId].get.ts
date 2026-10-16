import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { getCandidateFormSnapshot } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)
  const candidateFormId = String(event.context.params?.candidateFormId ?? "").trim()

  return {
    candidate_form: await getCandidateFormSnapshot(candidateFormId),
  }
})
