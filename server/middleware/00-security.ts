import { defineEventHandler } from "h3"

import { applySecurityHeaders } from "~~/server/utils/httpSecurity"

export default defineEventHandler((event) => {
  applySecurityHeaders(event)
})
