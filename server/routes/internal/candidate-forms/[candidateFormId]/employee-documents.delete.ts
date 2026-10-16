import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { removeCandidateFormEmployeeDocumentById } from "~~/server/services/candidateFormService.js"

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)
  const body = await readBody(event)
  const candidateFormId = String(event.context.params?.candidateFormId ?? "").trim()

  return {
    candidate_form: await removeCandidateFormEmployeeDocumentById(
      getSupabaseAdmin(),
      candidateFormId,
      body ?? {},
    ),
  }
})
