<script setup lang="ts">
import { definePageMeta, navigateTo } from "#imports"

import { getDefaultRoute } from "@/infrastructure/security/defaultRoute"
import { useAuthStore } from "@/stores/authStore"

definePageMeta({
  layout: false,
})

const authStore = useAuthStore()
await authStore.initAuth()

await navigateTo(authStore.isAuthenticated ? getDefaultRoute() : "/login")
</script>
