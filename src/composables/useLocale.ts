import { computed, ref } from "vue"

import translations from "../../lang"

export type SupportedLocale = "en" | "id"
type TranslationEntry = {
  en?: string
  id?: string
}
type TranslationParams = Record<string, string | number>

const localeStorageKey = "hrd_pintu_locale"
const locale = ref<SupportedLocale>("en")
let hasInitialized = false
const translationMap = translations as Record<string, TranslationEntry>
const reportedIssues = new Set<string>()

function reportTranslationIssue(issue: string, detail: string) {
  const message = `[i18n] ${issue}: ${detail}`

  if (!reportedIssues.has(message)) {
    reportedIssues.add(message)
    console.error(message)
  }

  if (import.meta.dev) {
    throw new Error(message)
  }
}

function normalizeLocale(value: unknown): SupportedLocale {
  return String(value ?? "").trim().toLowerCase().startsWith("id") ? "id" : "en"
}

function syncDocumentLanguage(nextLocale: SupportedLocale) {
  if (typeof document === "undefined") {
    return
  }

  document.documentElement.lang = nextLocale === "id" ? "id" : "en"
}

function detectInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return "en"
  }

  const savedLocale = window.localStorage.getItem(localeStorageKey)
  if (savedLocale) {
    return normalizeLocale(savedLocale)
  }

  return normalizeLocale(window.navigator.language)
}

function ensureLocaleInitialized() {
  if (hasInitialized) {
    return
  }

  locale.value = detectInitialLocale()
  syncDocumentLanguage(locale.value)
  hasInitialized = true
}

export function useLocale() {
  ensureLocaleInitialized()

  const isIndonesian = computed(() => locale.value === "id")

  function setLocale(nextLocale: SupportedLocale) {
    locale.value = normalizeLocale(nextLocale)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(localeStorageKey, locale.value)
    }

    syncDocumentLanguage(locale.value)
  }

  function toggleLocale() {
    setLocale(locale.value === "id" ? "en" : "id")
  }

  function text(key: string, params: TranslationParams = {}) {
    const entry = translationMap[key]

    if (!entry) {
      reportTranslationIssue("Missing translation key", key)
      return key
    }

    const sourceText = entry[locale.value] || entry.en
    if (!sourceText) {
      reportTranslationIssue("Missing locale value", `${key} (${locale.value})`)
      return key
    }

    const translated = sourceText.replace(/\{(\w+)\}/g, (_match, paramKey: string) =>
      Object.prototype.hasOwnProperty.call(params, paramKey)
        ? String(params[paramKey])
        : (() => {
            reportTranslationIssue("Missing translation param", `${key} -> ${paramKey}`)
            return `{${paramKey}}`
          })(),
    )
    return translated
  }

  function formatDateTime(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ) {
    if (!value) {
      return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat(isIndonesian.value ? "id-ID" : "en-US", options).format(date)
  }

  return {
    formatDateTime,
    isIndonesian,
    locale,
    setLocale,
    text,
    toggleLocale,
  }
}
