import { createApp, toWebHandler } from "h3"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("GET /api/cron/keepalive", () => {
  const secret = "test-cron-secret"
  const fetchMock = vi.fn<typeof fetch>()
  let request: (authorization?: string, method?: string) => Promise<Response>

  beforeEach(async () => {
    vi.resetModules()
    fetchMock.mockReset()
    vi.stubEnv("CRON_SECRET", secret)
    vi.stubEnv("SUPABASE_URL", "https://heartbeat-test.supabase.co")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key")
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})

    const { default: handler } = await import("../server/api/cron/keepalive.get")
    const app = createApp().use("/api/cron/keepalive", handler)
    const webHandler = toWebHandler(app)
    request = async (authorization, method = "GET") => webHandler(new Request(
      "http://localhost/api/cron/keepalive",
      { method, headers: authorization ? { authorization } : {} },
    ))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it.each([undefined, "Bearer wrong-secret", secret, "Bearer undefined"])(
    "rejects missing or invalid authorization: %s",
    async (authorization) => {
      const response = await request(authorization)
      expect(response.status).toBe(401)
      expect(response.headers.get("cache-control")).toContain("no-store")
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it.each([undefined, ""])("rejects an unavailable CRON_SECRET: %s", async (value) => {
    vi.stubEnv("CRON_SECRET", value)
    expect((await request(`Bearer ${secret}`)).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("performs an UPSERT and returns the persisted timestamp on every invocation", async () => {
    const rows = new Map<number, { id: number; last_ping_at: string }>()
    fetchMock.mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      expect(url.pathname).toBe("/rest/v1/app_heartbeat")
      expect(url.searchParams.get("on_conflict")).toBe("id")
      expect(init?.method).toBe("POST")
      const headers = new Headers(init?.headers)
      expect(headers.get("prefer")).toContain("resolution=merge-duplicates")
      expect(headers.get("authorization")).toBe("Bearer test-server-key")
      const row = JSON.parse(String(init?.body))
      expect(row.id).toBe(1)
      rows.set(row.id, row)
      return new Response(JSON.stringify({ last_ping_at: row.last_ping_at }), {
        status: 200, headers: { "content-type": "application/json" },
      })
    })

    vi.useFakeTimers({ toFake: ["Date"] })
    try {
      for (const timestamp of ["2026-11-19T15:00:00.000Z", "2026-11-22T15:00:00.000Z"]) {
        vi.setSystemTime(new Date(timestamp))
        const response = await request(`Bearer ${secret}`)
        expect(response.status).toBe(200)
        expect(response.headers.get("cache-control")).toContain("no-store")
        expect(await response.json()).toEqual({ success: true, timestamp })
        expect(rows.size).toBe(1)
        expect(rows.get(1)?.last_ping_at).toBe(timestamp)
      }
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it("returns 503 without exposing database errors or credentials", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      code: "42501", message: "sensitive-upstream-detail test-server-key",
    }), { status: 403, headers: { "content-type": "application/json" } }))

    const response = await request(`Bearer ${secret}`)
    expect(response.status).toBe(503)
    const body = await response.text()
    expect(body).toContain("Heartbeat unavailable")
    expect(body).not.toContain("sensitive-upstream-detail")
    expect(body).not.toContain("test-server-key")
    expect(console.error).toHaveBeenCalledWith("[keepalive] Heartbeat failed")
    expect(console.info).not.toHaveBeenCalled()
  })

  it("returns 503 for a rejected database request", async () => {
    fetchMock.mockRejectedValue(new Error("connection failed"))
    expect((await request(`Bearer ${secret}`)).status).toBe(503)
  })

  it("returns 503 when the server key is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    vi.resetModules()
    const { default: handler } = await import("../server/api/cron/keepalive.get")
    const webHandler = toWebHandler(createApp().use(handler))
    const response = await webHandler(new Request("http://localhost/api/cron/keepalive", {
      headers: { authorization: `Bearer ${secret}` },
    }))
    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(["POST", "HEAD"])("rejects %s requests", async (method) => {
    expect((await request(`Bearer ${secret}`, method)).status).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
