# 04 Folder Structure

> Last verified against current repository state: 2026-06-23

## Struktur Folder Aktual Project

```text
.
├── docs
│   ├── 01-project-overview.md
│   ├── 02-system-requirement.md
│   ├── 03-system-architecture.md
│   ├── 04-folder-structure.md
│   ├── 05-database-documentation.md
│   ├── 06-erd.md
│   ├── 07-auth-authorization.md
│   ├── 08-supabase-rls-policy.md
│   ├── 09-api-service-documentation.md
│   ├── 10-feature-flow.md
│   ├── 11-ui-pages-documentation.md
│   ├── 12-component-documentation.md
│   ├── 13-environment.md
│   ├── 14-deployment.md
│   ├── 15-testing.md
│   ├── 16-error-handling.md
│   ├── 17-maintenance-guide.md
│   ├── 18-changelog.md
│   ├── HOW_TO_DEPLOY_HRD_PINTU_VERCEL.md
│   ├── HOW_TO_SETUP_SUPABASE_HRD_PINTU.md
│   └── SUPABASE_HRD_PINTU.md
├── lang
│   ├── *.json
│   ├── README.md
│   └── index.ts
├── public
│   └── templates
├── scripts
│   └── sync-template-assets.mjs
├── server
│   ├── api
│   ├── config
│   ├── lib
│   ├── middleware
│   ├── routes
│   ├── services
│   └── utils
├── sql
│   └── migration
├── src
│   ├── components
│   ├── composables
│   ├── domain
│   ├── features
│   ├── infrastructure
│   ├── layouts
│   ├── middleware
│   ├── pages
│   ├── plugins
│   ├── stores
│   └── viewmodels
├── .env.example
├── nuxt.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vercel.json
```

## Penjelasan Setiap Folder

| Folder | Fungsi |
| --- | --- |
| `docs/` | dokumentasi teknis dan dokumen historis lama |
| `lang/` | translasi UI EN/ID yang digabung oleh `lang/index.ts` |
| `public/templates/` | folder target sinkron template publik; saat ini kosong karena `src/public/templates/` (sumbernya) sudah dihapus di commit `e8d4e4c` |
| `scripts/` | utilitas build-time; saat ini hanya sinkronisasi template statis |
| `server/api/` | alias endpoint `/api/internal/*` yang me-reexport route backend |
| `server/config/` | pembacaan env server-side |
| `server/lib/` | utilitas error HTTP |
| `server/middleware/` | middleware server untuk security header |
| `server/routes/` | route backend aktual untuk `/auth/*` dan `/internal/*` |
| `server/services/` | business logic Supabase/Auth/Storage |
| `server/utils/` | helper API wrapper, request context, HTTP security |
| `sql/migration/` | source of truth migrasi database, storage, RLS |
| `src/components/` | UI base components reusable |
| `src/composables/` | composable umum; saat ini `useLocale` |
| `src/domain/` | entity dan type form |
| `src/features/` | implementasi page-level features |
| `src/infrastructure/` | client HTTP backend, runtime config, supabase client |
| `src/layouts/` | layout Nuxt |
| `src/middleware/` | middleware route client/global |
| `src/pages/` | route pages |
| `src/plugins/` | plugin init auth saat startup client |
| `src/stores/` | Pinia auth store |
| `src/viewmodels/` | wrapper store/API untuk konsumsi feature components |

## Penjelasan File Penting

| File | Fungsi |
| --- | --- |
| `package.json` | script build/dev/type-check dan daftar dependency |
| `nuxt.config.ts` | runtime config public, `srcDir`, module Pinia, `ssr: false` |
| `vercel.json` | konfigurasi deploy yang ditemukan |
| `.env.example` | daftar env variable resmi yang digunakan |
| `scripts/sync-template-assets.mjs` | menyalin file dari `src/public/templates` ke `public/templates`; sejak `src/public/templates` dihapus, script ini hanya mengosongkan `public/templates` dan log warning tanpa error |
| `src/stores/authStore.ts` | state login/logout/profile/password kandidat |
| `src/features/applications/useCandidateApplicationFormPage.ts` | orchestration utama halaman form lamaran |
| `server/services/candidateAccountService.js` | business logic kandidat, aplikasi, submit, sync event |
| `server/services/candidateFormService.js` | normalisasi snapshot form dan sinkron tabel child |
| `sql/migration/*.sql` | definisi schema aktif, storage, dan RLS |

## Mapping Antara Folder Dengan Fitur

| Fitur | Folder/berkas utama |
| --- | --- |
| Login | `src/features/auth`, `src/stores/authStore.ts`, `src/middleware/access.global.ts` |
| Dashboard | `src/features/dashboard`, `src/pages/dashboard.vue` |
| Profil & ganti password | `src/features/profile`, `src/pages/profile.vue` |
| Form lamaran | `src/features/applications`, `src/domain/entities/CandidateApplicationForm.ts` |
| Internal candidate service | `server/routes/internal`, `server/api/internal`, `server/services/candidateAccountService.js` |
| Storage upload | `src/features/applications/useCandidateApplicationFormPage.ts`, `sql/migration/20260407_010_*`, `20260519_061_*` |
| RLS | `sql/migration/20260406_007_enable_candidate_service_rls.sql` |
| Event sync | `server/services/candidateSyncService.js` |
| i18n sederhana | `src/composables/useLocale.ts`, `lang/*.json` |

## Observasi Struktur

1. `server/routes/auth/*` dipakai sebagai endpoint aplikasi yang diakses browser.
2. `server/api/internal/*` dipakai sebagai alias `/api/internal/*` untuk integrator.
3. `server/routes/internal/*` juga ada sebagai route langsung `/internal/*`.
4. Route langsung `server/routes/internal/candidates/[candidateId]/switch-to-employee.post.ts` aktif untuk path `/internal/candidates/:candidateId/switch-to-employee`.
5. Alias `server/api/internal/.../switch-to-employee.post.ts` tetap belum ditemukan, jadi flow ini belum tersedia di `/api/internal/*`.
