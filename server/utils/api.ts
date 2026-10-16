import { defineEventHandler, setResponseStatus, type H3Event } from "h3"

export function defineJsonHandler<T>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      const status = Number((error as { status?: number } | null)?.status) || 500
      const expose =
        Boolean((error as { expose?: boolean } | null)?.expose) || (status >= 400 && status < 500)

      if (status >= 500) {
        console.error(error)
      }

      setResponseStatus(event, status)

      return {
        ok: false,
        error: expose && error instanceof Error ? error.message : "Internal Server Error",
      }
    }
  })
}
