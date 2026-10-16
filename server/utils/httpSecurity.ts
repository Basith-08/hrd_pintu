import { setHeader, type H3Event } from "h3"

const SENSITIVE_PATH_PATTERNS = [
  /^\/auth(?:\/|$)/,
  /^\/internal(?:\/|$)/,
  /^\/api\/internal(?:\/|$)/,
]

function getRequestPath(event: H3Event) {
  const rawPath = String(event.node.req.url ?? "/")
  const pathname = rawPath.split("?", 1)[0]?.trim() || "/"
  return pathname.startsWith("/") ? pathname : `/${pathname}`
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production"
}

function readSupabaseOrigin() {
  const rawSupabaseUrl = String(
    process.env.SUPABASE_URL ??
      process.env.NUXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      "",
  ).trim()

  if (!rawSupabaseUrl) {
    return ""
  }

  try {
    return new URL(rawSupabaseUrl).origin
  } catch {
    return ""
  }
}

function buildConnectSources() {
  const sources = new Set<string>(["'self'", "https://*.supabase.co", "wss://*.supabase.co"])
  const supabaseOrigin = readSupabaseOrigin()

  if (supabaseOrigin) {
    sources.add(supabaseOrigin)

    try {
      const realtimeUrl = new URL(supabaseOrigin)
      realtimeUrl.protocol = realtimeUrl.protocol === "https:" ? "wss:" : "ws:"
      sources.add(realtimeUrl.origin)
    } catch {
      // Ignore invalid realtime origin derivation and keep the known-safe fallbacks.
    }
  }

  if (!isProductionRuntime()) {
    sources.add("http:")
    sources.add("https:")
    sources.add("ws:")
    sources.add("wss:")
  }

  return Array.from(sources).join(" ")
}

function buildContentSecurityPolicy() {
  const scriptSources = isProductionRuntime()
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"]

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${buildConnectSources()}`,
    "worker-src 'self' blob:",
    "media-src 'self' blob: https:",
    "frame-src 'none'",
  ]

  if (isProductionRuntime()) {
    directives.push("upgrade-insecure-requests")
  }

  return directives.join("; ")
}

export function isSensitiveApiPath(event: H3Event) {
  const path = getRequestPath(event)
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(path))
}

export function applySecurityHeaders(event: H3Event) {
  setHeader(event, "Content-Security-Policy", buildContentSecurityPolicy())
  setHeader(event, "Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()")
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin")
  setHeader(event, "X-Content-Type-Options", "nosniff")
  setHeader(event, "X-Frame-Options", "DENY")
  setHeader(event, "Cross-Origin-Opener-Policy", "same-origin")
  setHeader(event, "Cross-Origin-Resource-Policy", "same-site")
  setHeader(event, "Origin-Agent-Cluster", "?1")
  setHeader(event, "X-Permitted-Cross-Domain-Policies", "none")

  if (isProductionRuntime()) {
    setHeader(event, "Strict-Transport-Security", "max-age=15552000; includeSubDomains")
  }

  if (isSensitiveApiPath(event)) {
    setHeader(event, "Cache-Control", "no-store, max-age=0")
    setHeader(event, "Pragma", "no-cache")
  }
}
