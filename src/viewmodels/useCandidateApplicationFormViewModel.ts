import { ref } from "vue"

import { useLocale } from "@/composables/useLocale"
import type { CandidateApplicationFormDraft, CandidateApplicationFormRecord } from "@/domain/entities/CandidateApplicationForm"
import { callBackendApi } from "@/infrastructure/http/backendApi"

export function useCandidateApplicationFormViewModel() {
  const { text } = useLocale()
  const form = ref<CandidateApplicationFormRecord | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isSubmitting = ref(false)
  const error = ref("")

  async function load(applicationId: string) {
    isLoading.value = true
    error.value = ""

    try {
      form.value = await callBackendApi<CandidateApplicationFormRecord>(
        `/auth/applications/${encodeURIComponent(applicationId)}/form`,
      )
      return form.value
    } catch (err) {
      error.value = text("applicationForm.errors.loadFailed")
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function save(
    applicationId: string,
    payload: CandidateApplicationFormDraft,
    saveSections?: string[],
  ) {
    isSaving.value = true
    error.value = ""

    try {
      form.value = await callBackendApi<CandidateApplicationFormRecord>(
        `/auth/applications/${encodeURIComponent(applicationId)}/form`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...payload,
            ...(Array.isArray(saveSections) && saveSections.length > 0
              ? { save_sections: saveSections }
              : {}),
          }),
        },
      )
      return form.value
    } catch (err) {
      error.value = text("applicationForm.errors.saveFailed")
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function submit(applicationId: string) {
    isSubmitting.value = true
    error.value = ""

    try {
      form.value = await callBackendApi<CandidateApplicationFormRecord>(
        `/auth/applications/${encodeURIComponent(applicationId)}/submit`,
        {
          method: "POST",
        },
      )
      return form.value
    } catch (err) {
      error.value = text("applicationForm.errors.submitFailed")
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    error,
    form,
    isLoading,
    isSaving,
    isSubmitting,
    load,
    save,
    submit,
  }
}
