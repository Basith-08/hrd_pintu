import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireAuthenticatedUser } from "~~/server/utils/requestContext"
import { autosaveCandidateApplicationForm } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireAuthenticatedUser(event)
  const applicationId = String(event.context.params?.applicationId ?? "")
  const body = await readBody(event)

  return autosaveCandidateApplicationForm(context.userId, applicationId, body?.autosave_data ?? null)
})
