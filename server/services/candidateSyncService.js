import { HRD_PINTU_SYNC_BASE_URL, HRD_PINTU_SYNC_TOKEN } from "~~/server/config/env.js"

const CANDIDATE_SYNC_TIMEOUT_MS = 4000
const CANDIDATE_SYNC_MAX_ATTEMPTS = 2
const CANDIDATE_SYNC_RETRY_DELAYS_MS = [500]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function attemptDeliverCandidateEvent(eventType, summary, meta) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CANDIDATE_SYNC_TIMEOUT_MS)

  try {
    const response = await fetch(`${HRD_PINTU_SYNC_BASE_URL.replace(/\/$/, "")}/candidate-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hrd-pintu-sync-token": HRD_PINTU_SYNC_TOKEN,
      },
      signal: controller.signal,
      body: JSON.stringify({
        event_type: eventType,
        summary,
        ...meta,
      }),
    })

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429
      return { delivered: false, retryable, reason: `http_${response.status}` }
    }

    return { delivered: true, retryable: false, reason: null }
  } catch (error) {
    if (error?.name === "AbortError") {
      return { delivered: false, retryable: true, reason: "timeout" }
    }

    return { delivered: false, retryable: true, reason: "network_error" }
  } finally {
    clearTimeout(timeout)
  }
}

export async function deliverCandidateEvent(eventType, summary, meta = {}) {
  if (!HRD_PINTU_SYNC_BASE_URL || !HRD_PINTU_SYNC_TOKEN) {
    return { delivered: false, reason: "missing_sync_config" }
  }

  let lastResult = { delivered: false, retryable: true, reason: "not_attempted" }

  for (let attempt = 1; attempt <= CANDIDATE_SYNC_MAX_ATTEMPTS; attempt += 1) {
    lastResult = await attemptDeliverCandidateEvent(eventType, summary, meta)

    if (lastResult.delivered || !lastResult.retryable) {
      break
    }

    const isLastAttempt = attempt === CANDIDATE_SYNC_MAX_ATTEMPTS
    if (isLastAttempt) {
      break
    }

    console.error(
      `Candidate event delivery attempt ${attempt}/${CANDIDATE_SYNC_MAX_ATTEMPTS} failed (${lastResult.reason}), retrying:`,
      eventType,
    )
    await sleep(CANDIDATE_SYNC_RETRY_DELAYS_MS[attempt - 1])
  }

  return { delivered: lastResult.delivered, reason: lastResult.reason }
}
