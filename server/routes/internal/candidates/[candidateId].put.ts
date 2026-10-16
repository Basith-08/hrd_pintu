import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { updateCandidateAccount } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)
  const body = await readBody(event)
  const candidateId = String(event.context.params?.candidateId ?? "")

  return { candidate: await updateCandidateAccount(candidateId, body ?? {}) }
})
