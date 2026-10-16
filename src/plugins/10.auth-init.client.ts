import { defineNuxtPlugin, usePinia } from "#imports"

import { useAuthStore } from "@/stores/authStore"

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore(usePinia())
  await authStore.initAuth()
})
