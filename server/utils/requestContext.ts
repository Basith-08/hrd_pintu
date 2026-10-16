import { getRequestHeader, type H3Event } from "h3"

import { createHttpError } from "~~/server/lib/errors.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"

export async function requireAuthenticatedUser(event: H3Event) {
  const authorization = String(getRequestHeader(event, "authorization") ?? "").trim()
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw createHttpError(401, "Unauthorized")
  }

  const accessToken = authorization.slice("bearer ".length).trim()
  if (!accessToken) {
    throw createHttpError(401, "Unauthorized")
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    throw createHttpError(401, error?.message || "Unauthorized")
  }

  return {
    accessToken,
    authUser: data.user,
    supabase,
    userId: data.user.id,
  }
}
