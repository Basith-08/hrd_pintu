<template>
  <ProfilePage />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useHead } from "#imports"

import { useLocale } from "@/composables/useLocale"
import ProfilePage from "@/features/profile/ProfilePage.vue"

const { text } = useLocale()
const pageTitle = computed(() => text("page.profile.title"))

useHead(() => ({
  title: pageTitle.value,
}))
</script>
