import { storeToRefs } from "pinia"

import { useAuthStore } from "@/stores/authStore"

export function useAuthViewModel() {
  const authStore = useAuthStore()
  const { error, isAuthenticated, isChangingPassword, isInitialized, isLoading, user } =
    storeToRefs(authStore)

  return {
    changePassword: authStore.changePassword,
    error,
    isAuthenticated,
    isChangingPassword,
    isInitialized,
    isLoading,
    login: authStore.login,
    logout: authStore.logout,
    refreshProfile: authStore.refreshProfile,
    syncApplication: authStore.syncApplication,
    user,
  }
}
