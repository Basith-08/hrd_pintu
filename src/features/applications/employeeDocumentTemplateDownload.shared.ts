import type { EmployeeDocumentType } from "@/domain/entities/CandidateApplicationForm"

export type EmployeeDocumentTemplateData = {
  employeeName: string
  employeeCode: string
  approvalUserName?: string
  approvalUserDesignation?: string
  placeOfBirth: string
  dateOfBirth: string
  idCardAddress: string
  idNo: string
  mainPosition: string
  departmentName: string
  companyName: string
  contractPeriod: string
  contractNumber: string
  joinDate: string
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function printValue(value: string | null | undefined) {
  const normalizedValue = String(value ?? "").trim()
  return normalizedValue ? escapeHtml(normalizedValue) : "&nbsp;"
}

export function stripLeadingNumberPrefix(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/^\d+\s*[.)-]?\s*/, "")
}

export function formatDownloadDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value)
}

export function formatDateText(value: string | null | undefined) {
  const normalizedValue = String(value ?? "").trim()
  if (!normalizedValue) {
    return ""
  }

  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) {
    return normalizedValue
  }

  return formatDownloadDate(parsed)
}

export function buildFieldTable(
  fields: Array<{ label: string; value: string }>,
  options: {
    containerWidth: number
    labelWidth: number
    valueWidth: number
    underlined?: boolean
    rowHeight?: number
    fontSize?: string
    marginLeft?: number
  },
) {
  const fontSize = options.fontSize ?? "11pt"
  const rowHeight = options.rowHeight ?? 22
  const marginLeft = options.marginLeft ?? 0

  return `
    <table
      style="
        width: ${options.containerWidth}px;
        border-collapse: collapse;
        margin: 0 0 16pt ${marginLeft}px;
        table-layout: fixed;
      "
    >
      <tbody>
        ${fields
      .map(
        (field) => `
              <tr>
                <td
                  style="
                    width: ${options.labelWidth}px;
                    height: ${rowHeight}px;
                    padding: 0;
                    font-size: ${fontSize};
                    vertical-align: middle;
                    white-space: nowrap;
                  "
                >
                  ${escapeHtml(field.label)}
                </td>
                <td
                  style="
                    width: 18px;
                    height: ${rowHeight}px;
                    padding: 0;
                    font-size: ${fontSize};
                    vertical-align: middle;
                    text-align: center;
                  "
                >
                  :
                </td>
                <td
                  style="
                    width: ${options.valueWidth}px;
                    height: ${rowHeight}px;
                    padding: 0 0 0 6px;
                    font-size: ${fontSize};
                    vertical-align: middle;
                    ${options.underlined ? "border-bottom: 1px solid #000;" : ""}
                  "
                >
                  ${printValue(field.value)}
                </td>
              </tr>
            `,
      )
      .join("")}
      </tbody>
    </table>
  `
}

export function buildPage(content: string, pageNumber?: number) {
  return `
    <section class="page">
      ${content}
      ${typeof pageNumber === "number" ? `<div class="page-number">${pageNumber}</div>` : ""}
    </section>
  `
}

export function buildPdfPreviewHtml(input: {
  title: string
  bodyClass: string
  bodyHtml: string
}) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(input.title)}</title>
      <style>
        @page {
          size: A4;
          margin: 18mm 18mm 20mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          color: #000;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .document {
          width: 100%;
        }

        .document p {
          margin: 0 0 10pt;
          text-align: justify;
        }

        .document ol,
        .document ul {
          margin-top: 0;
          margin-bottom: 10pt;
        }

        .document li {
          margin-bottom: 6pt;
          text-align: justify;
        }

        .document-title {
          text-align: center;
        }

        .document-title__main {
          display: inline-block;
          font-weight: 700;
          text-decoration: underline;
        }

        .paragraph {
          margin: 0 0 10pt;
          text-align: justify;
        }

        .paragraph--large-gap {
          margin-bottom: 12pt;
        }

        .party-block {
          display: flex;
          align-items: flex-start;
          gap: 10pt;
          margin-bottom: 12pt;
        }

        .party-block__marker {
          width: 24pt;
          font-weight: 700;
          line-height: 1.5;
        }

        .party-block__content {
          flex: 1;
          min-width: 0;
        }

        .party-block__content table {
          margin-bottom: 8pt;
        }

        .clause-list {
          margin: 0 0 12pt 18pt;
          padding-left: 16pt;
        }

        .clause-list li {
          margin-bottom: 6pt;
          padding-left: 4pt;
        }

        .page-break {
          break-before: page;
          page-break-before: always;
          height: 0;
          margin: 0;
          padding: 0;
          line-height: 0;
          font-size: 0;
        }

        .integrity-pact {
          font-family: "Times New Roman", Times, serif;
          font-size: 11pt;
          line-height: 1.5;
        }

        .integrity-pact .document-title {
          margin: 8pt 0 24pt;
        }

        .integrity-pact .document-title__main {
          font-size: 12pt;
          font-weight: 700;
          text-decoration: underline;
        }

        .integrity-pact .intro {
          margin-bottom: 10pt;
        }

        .integrity-pact .commitment-list {
          margin: 0 0 12pt 40px;
          padding-left: 20px;
        }

        .integrity-pact .commitment-list li {
          margin-bottom: 6pt;
          padding-left: 6px;
        }

        .integrity-pact .signature-block {
          margin-top: 20pt;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .integrity-pact .signature-block p {
          margin: 0 0 4pt;
          text-align: left;
        }

        .integrity-pact .stamp {
          height: 70pt;
          padding-top: 26pt;
        }

        .email-policy {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.55;
          padding: 0 15pt;
        }

        .email-policy .document-title {
          margin: 10pt 10pt 18pt;
          padding: 22pt 20pt 18pt;
          border: 1px solid #6f6f6f;
        }

        .email-policy .document-title__main {
          display: block;
          font-size: 15pt;
          font-style: italic;
          font-weight: 700;
          color: #ff0000;
        }

        .email-policy .document-title__sub {
          display: block;
          font-size: 12pt;
          font-weight: 700;
          line-height: 1.55;
          color: #222;
        }

        .email-policy .document-title__sub--first {
          margin-top: 10pt;
        }

        .email-policy .section-title {
          margin: 12pt 0 4pt;
          font-size: 11pt;
          font-weight: 700;
          text-transform: uppercase;
        }

        .email-policy .section-title--blue {
          color: #006fc0;
          text-decoration: underline;
        }

        .email-policy .section-title--danger {
          color: #ff0000;
          text-decoration: underline;
        }

        .email-policy .subsection-title--danger {
          color: #ff0000;
          text-decoration: underline;
        }

        .email-policy .subsection-title {
          margin: 0 0 6pt;
          font-weight: 700;
          text-decoration: underline;
        }

        .email-policy .policy-bullets {
          margin: 0 0 4pt 18pt;
          padding-left: 8pt;
          list-style-type: disc;
          list-style-position: outside;
        }

        .email-policy .policy-bullets li {
          margin-bottom: 1pt;
          line-height: 1.55;
        }

        .email-policy .policy-subpoints {
          margin: 3pt 0 3pt 20pt;
          padding-left: 10pt;
          list-style-type: lower-alpha;
        }

        .email-policy .policy-bullets--elements {
          margin-bottom: 6pt;
        }

        .email-policy .policy-bullets--elements > li {
          margin-bottom: 3pt;
        }

        .email-policy .policy-bullets--elements > li > strong {
          font-weight: 700;
        }

        .email-policy .email-link {
          color: #0000ff;
          text-decoration: underline;
        }

        .email-policy .acknowledgement {
          margin-top: 10pt;
          padding-top: 8pt;
          border-top: 1px solid #000;
        }

        .email-policy .signature-block {
          width: 34%;
          margin: 18pt 10pt 0 auto;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .email-policy .signature-date {
          margin-bottom: 36pt;
        }

        .email-policy .signature-name {
          min-height: 12pt;
          margin-bottom: 6pt;
        }

        .email-policy .signature-line {
          margin-top: 4pt;
          width: 82%;
          margin-left: auto;
          margin-right: auto;
          border-top: 1px solid #000;
        }

        .office-format {
          font-family: "Times New Roman", Times, serif;
          font-size: 10.75pt;
          line-height: 1.38;
        }

        .office-format .document-title {
          margin: 0 0 16pt;
          text-align: center;
        }

        .office-format .document-title__main {
          display: block;
          font-size: 13pt;
          font-weight: 700;
          text-transform: uppercase;
        }

        .office-format .document-title__sub {
          display: block;
          font-size: 11pt;
          font-weight: 700;
        }

        .office-format .document-title__sub--small {
          font-size: 10.75pt;
          font-weight: 400;
          text-transform: none;
        }

        .office-format .section-title {
          font-size: 11pt;
          font-weight: 700;
        }

        .office-format .section-title__number {
          display: inline-block;
          width: 18pt;
        }

        .office-format .section-title__label {
          display: inline-block;
        }

        .office-format .section-title--split {
          display: flex;
          align-items: flex-start;
          gap: 0;
        }

        .office-format .field-block {
          margin: 0 0 10pt;
        }

        .office-format .field-block p {
          margin: 0 0 6pt;
        }

        .office-format .paragraph {
          margin: 0;
          text-align: justify;
        }

        .office-format .paragraph--center {
          text-align: center;
        }

        .office-format .paragraph--dan-gap {
          margin: 10pt 0 16pt;
        }

        .office-format .paragraph--small-gap {
          margin-bottom: 4pt;
        }

        .office-format .paragraph--medium-gap {
          margin-bottom: 6pt;
          padding-left: 18pt;
        }

        .office-format .paragraph--large-gap {
          margin-bottom: 8pt;
          padding-left: 18pt;
        }

        .office-format .clause-block {
          margin-bottom: 8pt;
        }

        .office-format .clause-block p {
          margin: 0 0 6pt;
          text-align: justify;
        }

        .office-format .clause-block--compact p {
          margin-bottom: 4pt;
        }

        .office-format .clause-block--flush p {
          padding-left: 18pt;
        }

        .office-format .clause-paragraph {
          margin: 0 0 6pt;
          text-align: justify;
        }

        .office-format .clause-paragraph--compact {
          margin-bottom: 4pt;
          padding-left: 18pt;
        }

        .office-format .clause-paragraph--bullet {
          text-align: left;
          padding-left: 0;
        }

        .office-format .jam-kerja p {
          margin: 0 0 2pt;
          text-align: left;
        }

        .office-format .jam-kerja .jam-kerja__indent {
          padding-left: 18pt;
        }

        .office-format .clause-list {
          margin: 0;
          padding: 0;
        }

        .office-format .clause-list p {
          margin: 0 0 4pt;
          text-align: left;
        }

        .office-format .contract-points {
          margin: 0 0 10pt 18pt;
          padding-left: 10pt;
        }

        .office-format .contract-points li {
          margin-bottom: 3pt;
        }

        .office-format .signature-block {
          margin-top: 14pt;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .office-format .signature-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          column-gap: 28pt;
          padding-top: 6pt;
          align-items: start;
          padding-left: 18pt;
          text-align: left;
        }

        .office-format .signature-column {
          min-width: 0;
        }

        .office-format .signature-column--left,
        .office-format .signature-column--right {
          text-align: left;
        }

        .office-format .signature-column--right {
          padding-left: 25pt;
          padding-top: 20pt;
          justify-self: start;
        }

        .office-format .signature-block p {
          margin: 0 0 5pt;
        }

        .office-format .signature-space {
          height: 60pt;
        }
      </style>
    </head>
    <body class="${escapeHtml(input.bodyClass)}">
      ${input.bodyHtml}
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => window.print(), 250)
        })
      </script>
    </body>
  </html>`
}
