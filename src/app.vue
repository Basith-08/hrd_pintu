<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useHead } from "#imports"

import { useLocale } from "@/composables/useLocale"
import { useAuthStore } from "@/stores/authStore"

const authStore = useAuthStore()
const { text } = useLocale()

const appTitle = computed(() => {
  if (authStore.user?.role === "employee") {
    return text("app.title.employee")
  }

  if (authStore.user?.role === "candidate") {
    return text("app.title.candidate")
  }

  return text("app.title.candidate")
})

useHead(() => ({
  titleTemplate: (title) => {
    const suffix = appTitle.value
    return title ? `${title} | ${suffix}` : suffix
  },
}))
</script>
