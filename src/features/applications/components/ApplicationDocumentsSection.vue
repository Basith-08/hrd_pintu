<template>
  <AppFormSection :title="page.employeeDocumentSectionTitle">
    <div class="document-grid">
      <ApplicationDocumentCard
        v-for="row in page.employeeDocumentRows"
        :key="row.documentType"
        :is-busy="isBusy"
        :page="page"
        :row="row"
      />
    </div>
    <div v-if="page.isEmployeeForm" class="guide-card">
      <div class="guide-card__copy">
        <p class="guide-card__title">
          {{ text("files.haermesGuide.title") }}
        </p>
        <p class="guide-card__description">
          {{ text("files.haermesGuide.description") }}
        </p>
        <div class="guide-card__credentials">
          <p class="guide-card__credentials-intro">
            {{ text("files.haermesGuide.loginNote") }}
          </p>
          <dl class="guide-card__credentials-list">
            <div>
              <dt>{{ text("files.haermesGuide.userIdLabel") }}</dt>
              <dd>{{ page.employeeCode || text("files.haermesGuide.userIdFallback") }}</dd>
            </div>
            <div>
              <dt>{{ text("files.haermesGuide.passwordLabel") }}</dt>
              <dd>1234</dd>
            </div>
          </dl>
        </div>
      </div>
      <a
        class="secondary-button guide-card__action"
        :href="haermesGuideUrl"
        target="_blank"
        rel="noopener noreferrer"
        download
      >
        {{ text("files.haermesGuide.downloadButton") }}
      </a>
    </div>
  </AppFormSection>
</template>

<script setup lang="ts">
import { computed } from "vue"

import AppFormSection from "@/components/AppFormSection.vue"
import ApplicationDocumentCard from "@/features/applications/components/ApplicationDocumentCard.vue"
import { useLocale } from "@/composables/useLocale"

const props = defineProps<{
  page: Record<string, any>
}>()

const { text } = useLocale()

const haermesGuideUrl =
  "https://uwlwcpbmycbenvxkyayq.supabase.co/storage/v1/object/public/company-documents/panduan-installasi-dan-penggunaan-haermes-mobile-v1.pdf"

const isBusy = computed(
  () =>
    props.page.isSaving ||
    props.page.isSubmitting ||
    props.page.isLoading ||
    props.page.isUploadingAnyFile,
)
</script>
