import { defineNuxtRouteMiddleware, navigateTo } from "#imports"

import { getDefaultRoute } from "@/infrastructure/security/defaultRoute"
import { useAuthStore } from "@/stores/authStore"

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  await authStore.initAuth()

  if (to.meta.public) {
    if (to.path === "/login" && authStore.isAuthenticated) {
      return navigateTo(getDefaultRoute())
    }

    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo("/login")
  }
})
