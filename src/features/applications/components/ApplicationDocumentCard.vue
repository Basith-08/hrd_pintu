<template>
  <AppNestedCard document :invalid="row.isRequired && row.files.length === 0 && row.selectedFiles.length === 0">
    <template #header>
      <div>
        <p class="nested-card__title">
          {{ row.label }}
        </p>
        <p class="field-help">
          {{ row.isRequired ? text("files.requiredDocument") : text("files.optionalDocument") }}
        </p>
      </div>
      <span class="document-count">
        {{ row.files.length }}
        {{ row.files.length === 1 ? text("files.file") : text("files.files") }}
      </span>
    </template>

    <button
      v-if="page.hasEmployeeDocumentTemplate(row.documentType)"
      type="button"
      class="ghost-button document-template-button"
      :disabled="isBusy"
      @click="page.handleDownloadEmployeeDocumentTemplate(row.documentType, row.downloadUrl)"
    >
      {{ text("files.downloadTemplate") }}
    </button>
    <p v-if="page.hasEmployeeDocumentTemplate(row.documentType)" class="field-help">
      {{ text("files.templateInstructions") }}
    </p>
    <p v-if="row.note" class="field-help field-help--warning">
      {{ row.note }}
    </p>
    <input
      class="field"
      type="file"
      :accept="page.getEmployeeDocumentAccept(row.documentType)"
      multiple
      :disabled="isBusy"
      @change="page.handleEmployeeDocumentChange(row.documentType, $event)"
    />
    <div v-if="row.selectedFiles.length" class="document-list-group">
      <p class="field-help">{{ text("files.selectedFiles") }}</p>
      <ul class="document-chip-list">
        <li
          v-for="(file, index) in row.selectedFiles"
          :key="`${row.documentType}-${file.name}-${file.lastModified}-${file.size}`"
        >
          <AppDocumentChip
            :disabled="isBusy"
            :label="file.name"
            :remove-label="text('common.actions.remove')"
            selected
            @remove="page.removeSelectedEmployeeDocumentFile(row.documentType, index)"
          />
        </li>
      </ul>
    </div>
    <p class="field-help">
      {{ text("files.multipleAllowed") }}
    </p>
    <div v-if="row.files.length" class="document-list-group">
      <p class="field-help">{{ text("files.savedFiles") }}</p>
      <ul class="document-chip-list">
        <li v-for="path in row.files" :key="path">
          <AppDocumentChip
            :disabled="isBusy"
            :label="page.getReadableUploadedFileName(row.documentType, path)"
            :remove-label="text('common.actions.remove')"
            @remove="page.removeUploadedEmployeeDocument(row.documentType, path)"
          />
        </li>
      </ul>
    </div>
    <p v-if="row.files.length" class="field-help">
      {{ text("files.removalAppliedLater") }}
    </p>
  </AppNestedCard>
</template>

<script setup lang="ts">
import AppDocumentChip from "@/components/AppDocumentChip.vue"
import AppNestedCard from "@/components/AppNestedCard.vue"
import { useLocale } from "@/composables/useLocale"

defineProps<{
  isBusy?: boolean
  page: Record<string, any>
  row: Record<string, any>
}>()

const { text } = useLocale()
</script>
