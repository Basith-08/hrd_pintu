import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { switchCandidateToEmployee } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)
  const candidateId = String(event.context.params?.candidateId ?? "")

  return { candidate: await switchCandidateToEmployee(candidateId) }
})
