import { getHeader } from "h3"

import { INTERNAL_SERVICE_TOKEN } from "~~/server/config/env.js"
import { createHttpError } from "~~/server/lib/errors.js"

export function requireInternalServiceRequest(event) {
  const token = String(getHeader(event, "x-internal-service-token") ?? "").trim()
  if (!INTERNAL_SERVICE_TOKEN) {
    throw createHttpError(500, "INTERNAL_SERVICE_TOKEN is not configured.", { expose: false })
  }

  if (!token || token !== INTERNAL_SERVICE_TOKEN) {
    throw createHttpError(401, "Unauthorized internal request.")
  }
}
