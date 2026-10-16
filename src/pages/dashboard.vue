<template>
  <DashboardPage />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useHead } from "#imports"

import { useLocale } from "@/composables/useLocale"
import DashboardPage from "@/features/dashboard/DashboardPage.vue"

const { text } = useLocale()
const pageTitle = computed(() => text("page.dashboard.title"))

useHead(() => ({
  title: pageTitle.value,
}))
</script>
