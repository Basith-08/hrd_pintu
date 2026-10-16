import { fileURLToPath } from "node:url"
import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  compatibilityDate: "2025-03-31",
  app: {
    head: {
      title: "HRD Pintu",
      titleTemplate: "%s | HRD Pintu",
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/hrd-mark.svg",
        },
        {
          rel: "shortcut icon",
          type: "image/svg+xml",
          href: "/hrd-mark.svg",
        },
        {
          rel: "apple-touch-icon",
          type: "image/svg+xml",
          href: "/hrd-mark.svg",
        },
      ],
    },
  },
  devtools: {
    enabled: true,
  },
  ssr: false,
  srcDir: "src",
  modules: ["@pinia/nuxt"],
  css: ["~/styles.css"],
  alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
  runtimeConfig: {
    public: {
      supabaseUrl:
        process.env.NUXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
      supabaseAnonKey:
        process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
      candidatePhotographBucket:
        process.env.NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET ??
        process.env.VITE_CANDIDATE_PHOTOGRAPH_BUCKET ??
        "candidate-photographs",
      candidateDocumentBucket:
        process.env.NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET ??
        process.env.VITE_CANDIDATE_DOCUMENT_BUCKET ??
        "candidate-documents",
      employeeDocumentBucket:
        process.env.NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET ??
        process.env.VITE_CANDIDATE_DOCUMENT_BUCKET ??
        process.env.NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET ??
        process.env.VITE_EMPLOYEE_DOCUMENT_BUCKET ??
        "candidate-documents",
    },
  },
})
