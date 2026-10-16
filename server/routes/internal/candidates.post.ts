import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { createCandidateAccount } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)
  const body = await readBody(event)
  return { candidate: await createCandidateAccount(body ?? {}) }
})
