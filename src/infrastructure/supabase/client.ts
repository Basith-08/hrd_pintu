import { createClient } from "@supabase/supabase-js"

import { getPublicAppConfig } from "@/infrastructure/runtime/publicConfig"

let client: any = null

function createSupabaseClient() {
  const { supabaseAnonKey, supabaseUrl } = getPublicAppConfig()

  if (!supabaseUrl) {
    throw new Error("NUXT_PUBLIC_SUPABASE_URL belum diisi di file .env")
  }

  const resolvedAnonKey =
    supabaseAnonKey || (import.meta.env.MODE === "test" ? "test-anon-key" : "")

  if (!resolvedAnonKey) {
    throw new Error("NUXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di file .env")
  }

  return createClient(supabaseUrl, resolvedAnonKey)
}

function getSupabaseClient() {
  if (!client) {
    client = createSupabaseClient()
  }

  return client
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const resolvedClient = getSupabaseClient()
    const value = Reflect.get(resolvedClient as object, prop)

    return typeof value === "function" ? value.bind(resolvedClient) : value
  },
}) as any
