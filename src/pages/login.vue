<template>
  <LoginPage />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { definePageMeta, useHead } from "#imports"

import { useLocale } from "@/composables/useLocale"
import LoginPage from "@/features/auth/LoginPage.vue"

definePageMeta({
  layout: false,
  public: true,
})

const { text } = useLocale()
const pageTitle = computed(() => text("page.login.title"))

useHead(() => ({
  title: pageTitle.value,
}))
</script>
