import { supabase } from "@/infrastructure/supabase/client"
import { useLocale } from "@/composables/useLocale"

type BackendRequestOptions = {
  auth?: boolean
}

let pendingAccessTokenPromise: Promise<string> | null = null

export class BackendApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "BackendApiError"
    this.status = status
  }
}

async function getAccessToken() {
  const { text } = useLocale()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(text("common.errors.requestFailed"))
  }

  const accessToken = String(session?.access_token ?? "").trim()
  if (!accessToken) {
    throw new Error(text("common.errors.notAuthenticated"))
  }

  return accessToken
}

async function getSharedAccessToken() {
  if (!pendingAccessTokenPromise) {
    pendingAccessTokenPromise = getAccessToken().finally(() => {
      pendingAccessTokenPromise = null
    })
  }

  return pendingAccessTokenPromise
}

export async function callBackendApi<T>(
  path: string,
  init: RequestInit = {},
  options: BackendRequestOptions = {},
): Promise<T> {
  const { text } = useLocale()
  const { auth = true } = options
  const headers = new Headers(init.headers)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (auth) {
    headers.set("Authorization", `Bearer ${await getSharedAccessToken()}`)
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
  }

  if (!response.ok) {
    throw new BackendApiError(
      payload.error || text("common.errors.requestFailed"),
      response.status,
    )
  }

  return payload as T
}
