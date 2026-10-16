import { defineJsonHandler } from "~~/server/utils/api"
import { requireAuthenticatedUser } from "~~/server/utils/requestContext"
import { buildAuthenticatedProfile } from "~~/server/services/authService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireAuthenticatedUser(event)
  return buildAuthenticatedProfile(context)
})
