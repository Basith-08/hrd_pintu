import { computed, ref } from "vue"
import { defineStore } from "pinia"

import { clearDraftsWithPrefix } from "@/composables/useDraftStorage"
import { useLocale } from "@/composables/useLocale"
import { CANDIDATE_APPLICATION_DRAFT_STORAGE_PREFIX } from "@/services/draft.service"
import { BackendApiError, callBackendApi } from "@/infrastructure/http/backendApi"
import { supabase } from "@/infrastructure/supabase/client"

export type CandidateApplication = {
  id: string
  erf_id: string
  status: string
  job_snapshot: Record<string, unknown> | null
  created_at: string | null
  submitted_at: string | null
  form_completion_status?: string | null
  form_updated_at?: string | null
  form_submitted_at?: string | null
}

export type CandidateUser = {
  id: string
  email: string
  role?: 'candidate' | 'employee'
  full_name?: string | null
  phone?: string | null
  employee_code?: string | null
  contract_number?: string | null
  status?: string | null
  created_at?: string | null
  activated_at?: string | null
  last_login_at?: string | null
  applications: CandidateApplication[]
}

export const useAuthStore = defineStore("candidate-auth", () => {
  const { text } = useLocale()
  const user = ref<CandidateUser | null>(null)
  const isLoading = ref(false)
  const isChangingPassword = ref(false)
  const isInitialized = ref(false)
  const error = ref("")
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)

  async function fetchUserProfile(): Promise<CandidateUser> {
    return callBackendApi<CandidateUser>("/auth/profile")
  }

  function isInactiveCandidateError(err: unknown) {
    if (!(err instanceof BackendApiError)) {
      return false
    }

    if (err.status !== 403) {
      return false
    }

    return String(err.message).toLowerCase().includes("candidate account is not active")
  }

  function getInactiveCandidateMessage() {
    return text("auth.errors.inactiveAccount")
  }

  async function handleInactiveCandidateAccount() {
    await supabase.auth.signOut()
    user.value = null
    error.value = getInactiveCandidateMessage()
  }

  async function initAuth() {
    if (isInitialized.value) {
      return
    }

    if (initPromise) {
      return initPromise
    }

    initPromise = (async () => {
      isLoading.value = true

      try {
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser()

        if (!supabaseUser?.email) {
          user.value = null
          return
        }

        user.value = await fetchUserProfile()
      } catch (err) {
        if (isInactiveCandidateError(err)) {
          await handleInactiveCandidateAccount()
        } else {
          console.error("Failed to initialize candidate auth:", err)
          user.value = null
        }
      } finally {
        isLoading.value = false
        isInitialized.value = true
        initPromise = null
      }
    })()

    return initPromise
  }

  async function login(payload: { email: string; password: string }) {
    isLoading.value = true
    error.value = ""

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: payload.email.trim(),
        password: payload.password,
      })

      if (signInError) {
        throw new Error(text("auth.errors.loginFailed"))
      }

      user.value = await fetchUserProfile()
      return user.value
    } catch (err) {
      if (isInactiveCandidateError(err)) {
        await handleInactiveCandidateAccount()
        throw new Error(getInactiveCandidateMessage())
      }

      const message =
        err instanceof Error ? err.message : text("auth.errors.loginFailed")
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = ""

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        throw new Error(text("auth.errors.logoutFailed"))
      }

      user.value = null
      clearDraftsWithPrefix(CANDIDATE_APPLICATION_DRAFT_STORAGE_PREFIX)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : text("auth.errors.logoutFailed")
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refreshProfile() {
    try {
      user.value = await fetchUserProfile()
    } catch (err) {
      if (isInactiveCandidateError(err)) {
        await handleInactiveCandidateAccount()
        throw new Error(getInactiveCandidateMessage())
      }

      throw err
    }
  }

  async function changePassword(payload: {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
  }) {
    const email = String(user.value?.email ?? "").trim()
    const currentPassword = String(payload.currentPassword ?? "")
    const newPassword = String(payload.newPassword ?? "")
    const confirmNewPassword = String(payload.confirmNewPassword ?? "")

    if (!email) {
      const message = text("common.errors.notAuthenticated")
      error.value = message
      throw new Error(message)
    }

    if (newPassword.length < 6) {
      const message = text("auth.errors.passwordTooShort")
      error.value = message
      throw new Error(message)
    }

    if (newPassword !== confirmNewPassword) {
      const message = text("auth.errors.passwordConfirmationMismatch")
      error.value = message
      throw new Error(message)
    }

    if (currentPassword === newPassword) {
      const message = text("auth.errors.passwordMustDiffer")
      error.value = message
      throw new Error(message)
    }

    isChangingPassword.value = true
    error.value = ""

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error(text("auth.errors.currentPasswordInvalid"))
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw new Error(text("auth.errors.passwordChangeFailed"))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : text("auth.errors.passwordChangeFailed")
      error.value = message
      throw err
    } finally {
      isChangingPassword.value = false
    }
  }

  function syncApplication(application: CandidateApplication | null | undefined) {
    if (!application || !user.value) {
      return
    }

    const applicationIndex = user.value.applications.findIndex(
      (item) => item.id === application.id,
    )

    const nextApplications =
      applicationIndex === -1
        ? [application, ...user.value.applications]
        : user.value.applications.map((item, index) =>
            index === applicationIndex ? { ...item, ...application } : item,
          )

    user.value = {
      ...user.value,
      applications: nextApplications,
    }
  }

  return {
    changePassword,
    error,
    initAuth,
    isAuthenticated,
    isChangingPassword,
    isInitialized,
    isLoading,
    login,
    logout,
    refreshProfile,
    syncApplication,
    user,
  }
})
