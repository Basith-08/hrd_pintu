import { useLocale } from "@/composables/useLocale"
import type { EmployeeDocumentType } from "@/domain/entities/CandidateApplicationForm"
export type { EmployeeDocumentTemplateData } from "./employeeDocumentTemplateDownload.shared"

import { buildEmailUsagePolicyHtml } from "./employeeDocumentTemplateDownload.email-usage-policy"
import { buildIntegrityPactHtml } from "./employeeDocumentTemplateDownload.integrity-pact"

const generatedEmployeeDocumentTypes = new Set<EmployeeDocumentType>([
  "integrity_pact",
  "email_usage_policy",
])

function openPdfPreviewWindow(title: string, html: string) {
  const previewWindow = window.open("about:blank", "_blank", "width=960,height=1200")
  const { text } = useLocale()

  if (!previewWindow) {
    throw new Error(text("documents.previewWindow.couldNotOpen", { title }))
  }

  previewWindow.document.open()
  previewWindow.document.write(html)
  previewWindow.document.close()
}

export function hasGeneratedEmployeeDocumentTemplate(documentType: EmployeeDocumentType) {
  return generatedEmployeeDocumentTypes.has(documentType)
}

export function downloadGeneratedEmployeeDocumentTemplate(
  documentType: EmployeeDocumentType,
  data: import("./employeeDocumentTemplateDownload.shared").EmployeeDocumentTemplateData,
) {
  const { text } = useLocale()

  switch (documentType) {
    case "integrity_pact":
      openPdfPreviewWindow(
        text("documents.previewWindow.integrityPact"),
        buildIntegrityPactHtml(data),
      )
      return
    case "email_usage_policy":
      openPdfPreviewWindow(
        text("documents.previewWindow.emailUsagePolicy"),
        buildEmailUsagePolicyHtml(data),
      )
      return
    default:
      throw new Error(text("documents.previewWindow.unsupported"))
  }
}
