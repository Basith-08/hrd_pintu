import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireInternalServiceRequest } from "~~/server/services/internalAuthService.js"
import { createHttpError } from "~~/server/lib/errors.js"
import {
  CANDIDATE_DOCUMENT_BUCKET,
  CANDIDATE_PHOTOGRAPH_BUCKET,
} from "~~/server/config/env.js"
import { getCandidateFormSnapshotById } from "~~/server/services/candidateFormService.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"

const ALLOWED_BUCKET_RULES = new Map([
  [CANDIDATE_PHOTOGRAPH_BUCKET, ["candidate-forms/"]],
  [CANDIDATE_DOCUMENT_BUCKET, ["candidate-forms/", "employee-forms/"]],
])

function isAllowedStoragePath(bucket: string, path: string) {
  const allowedPrefixes = ALLOWED_BUCKET_RULES.get(bucket)
  if (!allowedPrefixes?.length) {
    return false
  }

  if (!path || path.includes("..") || path.startsWith("/") || path.includes("\\")) {
    return false
  }

  return allowedPrefixes.some((prefix) => path.startsWith(prefix))
}

function listCandidateFormDocumentPaths(candidateForm: {
  employee_documents?: Record<string, string[]>
}) {
  return Object.values(candidateForm.employee_documents ?? {})
    .flatMap((paths) => Array.isArray(paths) ? paths : [])
    .map((path) => String(path ?? "").trim())
    .filter(Boolean)
}

function candidateFormOwnsStoragePath(
  candidateForm: {
    photograph?: string | null
    employee_documents?: Record<string, string[]>
  },
  bucket: string,
  path: string,
) {
  if (bucket === CANDIDATE_PHOTOGRAPH_BUCKET) {
    return String(candidateForm.photograph ?? "").trim() === path
  }

  if (bucket === CANDIDATE_DOCUMENT_BUCKET) {
    return listCandidateFormDocumentPaths(candidateForm).includes(path)
  }

  return false
}

export default defineJsonHandler(async (event) => {
  requireInternalServiceRequest(event)

  const body = await readBody<{
    bucket?: string
    candidate_form_id?: string
    path?: string
  }>(event)

  const bucket = String(body?.bucket ?? "").trim()
  const candidateFormId = String(body?.candidate_form_id ?? "").trim()
  const path = String(body?.path ?? "").trim()

  if (!bucket || !candidateFormId || !path) {
    throw createHttpError(400, "Bucket, candidate_form_id, and path are required.")
  }

  if (!isAllowedStoragePath(bucket, path)) {
    throw createHttpError(403, "Bucket or path is not allowed.")
  }

  const candidateForm = await getCandidateFormSnapshotById(getSupabaseAdmin(), candidateFormId)
  if (!candidateForm) {
    throw createHttpError(404, "Candidate form was not found.")
  }

  if (!candidateFormOwnsStoragePath(candidateForm, bucket, path)) {
    throw createHttpError(403, "Storage path does not belong to the candidate form.")
  }

  const { data, error } = await getSupabaseAdmin().storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error) {
    throw createHttpError(404, error.message)
  }

  return {
    signed_url: data.signedUrl,
  }
})
