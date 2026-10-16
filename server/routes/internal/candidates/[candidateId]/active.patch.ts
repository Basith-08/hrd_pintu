import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { setCandidateActiveStatus } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)
  const body = await readBody<{ is_active?: boolean }>(event)
  const candidateId = String(event.context.params?.candidateId ?? "")

  return { candidate: await setCandidateActiveStatus(candidateId, body?.is_active) }
})
