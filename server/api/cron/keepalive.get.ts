import { createClient } from "@supabase/supabase-js"
import { assertMethod, createError, defineEventHandler, getHeader, setHeader } from "h3"

import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "~~/server/config/env.js"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store, max-age=0")
  assertMethod(event, "GET")

  const secret = process.env.CRON_SECRET
  if (!secret || getHeader(event, "authorization") !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing server database configuration")
    }

    // A dedicated server client must never inherit a user's Auth session.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabase
      .from("app_heartbeat")
      .upsert({ id: 1, last_ping_at: new Date().toISOString() }, { onConflict: "id" })
      .select("last_ping_at")
      .single()

    if (error || !data?.last_ping_at) {
      throw new Error("Heartbeat write failed")
    }

    console.info("[keepalive] Heartbeat updated", { timestamp: data.last_ping_at })
    return { success: true, timestamp: data.last_ping_at }
  } catch {
    // Never log upstream errors: they can contain request URLs or credentials.
    console.error("[keepalive] Heartbeat failed")
    throw createError({ statusCode: 503, statusMessage: "Heartbeat unavailable" })
  }
})
