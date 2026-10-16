export interface DraftStorageEntry<T> {
  data: T
  savedAt: string
}

export function useDraftStorage<T>(storageKey: () => string) {
  function read(): DraftStorageEntry<T> | null {
    if (typeof window === "undefined") {
      return null
    }

    const raw = window.localStorage.getItem(storageKey())
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as DraftStorageEntry<T>
      if (!parsed || typeof parsed.savedAt !== "string") {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  function write(data: T): void {
    if (typeof window === "undefined") {
      return
    }

    const entry: DraftStorageEntry<T> = {
      data,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(storageKey(), JSON.stringify(entry))
  }

  function clear(): void {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.removeItem(storageKey())
  }

  return {
    read,
    write,
    clear,
  }
}

export function clearDraftsWithPrefix(prefix: string): void {
  if (typeof window === "undefined") {
    return
  }

  const keysToRemove: string[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}
