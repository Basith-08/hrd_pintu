import { defineJsonHandler } from "~~/server/utils/api"
import { requireAuthenticatedUser } from "~~/server/utils/requestContext"
import { submitAuthenticatedCandidateApplicationForm } from "~~/server/services/candidateAccountService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireAuthenticatedUser(event)
  const applicationId = String(event.context.params?.applicationId ?? "")

  return submitAuthenticatedCandidateApplicationForm(context.userId, applicationId)
})
