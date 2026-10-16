import { onBeforeUnmount, onMounted } from "vue"

import { useDraftStorage } from "@/composables/useDraftStorage"
import { useDraftSync } from "@/composables/useDraftSync"
import { debounce } from "@/utils/debounce"

export interface UseAutoSaveOptions<T> {
  storageKey: () => string
  source: () => T
  syncFn: (payload: T) => Promise<unknown>
  debounceMs?: number
}

export function useAutoSave<T>(options: UseAutoSaveOptions<T>) {
  const { storageKey, source, syncFn, debounceMs = 5000 } = options

  const storage = useDraftStorage<T>(storageKey)
  const draftSync = useDraftSync<T>(syncFn)

  let lastSyncedSnapshot: string | null = null

  async function syncNow() {
    const payload = source()
    const snapshot = JSON.stringify(payload)

    if (snapshot === lastSyncedSnapshot) {
      return
    }

    await draftSync.sync(payload)

    if (draftSync.status.value === "saved") {
      lastSyncedSnapshot = snapshot
    }
  }

  const debouncedSync = debounce(() => {
    void syncNow()
  }, debounceMs)

  function scheduleSave() {
    storage.write(source())
    debouncedSync()
  }

  function flush() {
    debouncedSync.cancel()
    void syncNow()
  }

  function loadCachedDraft() {
    return storage.read()
  }

  function discardCachedDraft() {
    storage.clear()
  }

  function handleVisibilityChange() {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      flush()
    }
  }

  function handleOnline() {
    flush()
  }

  onMounted(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("online", handleOnline)
  })

  onBeforeUnmount(() => {
    debouncedSync.cancel()
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("online", handleOnline)
  })

  return {
    status: draftSync.status,
    scheduleSave,
    flush,
    loadCachedDraft,
    discardCachedDraft,
  }
}
