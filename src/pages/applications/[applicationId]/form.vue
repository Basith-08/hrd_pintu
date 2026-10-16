<template>
  <CandidateApplicationFormPage />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useHead } from "#imports"

import { useLocale } from "@/composables/useLocale"
import CandidateApplicationFormPage from "@/features/applications/CandidateApplicationFormPage.vue"

const { text } = useLocale()
const pageTitle = computed(() => text("page.applicationForm.title"))

useHead(() => ({
  title: pageTitle.value,
}))
</script>
