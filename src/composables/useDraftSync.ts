import { onBeforeUnmount, onMounted, ref } from "vue"

export type DraftSyncStatus = "idle" | "saving" | "saved" | "offline" | "error"

export function useDraftSync<T>(syncFn: (payload: T) => Promise<unknown>) {
  const status = ref<DraftSyncStatus>("idle")

  function isOnline() {
    return typeof navigator === "undefined" || navigator.onLine
  }

  async function sync(payload: T) {
    if (!isOnline()) {
      status.value = "offline"
      return
    }

    status.value = "saving"

    try {
      await syncFn(payload)
      status.value = "saved"
    } catch {
      status.value = "error"
    }
  }

  function handleOnline() {
    if (status.value === "offline") {
      status.value = "idle"
    }
  }

  onMounted(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
    }
    if (!isOnline()) {
      status.value = "offline"
    }
  })

  onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline)
    }
  })

  return {
    status,
    sync,
  }
}
