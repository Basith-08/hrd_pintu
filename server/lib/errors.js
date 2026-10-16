export function createHttpError(status, message, options = {}) {
  const error = new Error(message)
  error.status = status
  error.expose = options.expose ?? status < 500
  return error
}
