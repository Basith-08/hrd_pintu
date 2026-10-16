# 17 Maintenance Guide

> Last verified against current repository state: 2026-06-23

## Prinsip Maintenance Repo Ini

1. Mulai dari fitur paling relevan: `pages -> features -> viewmodels/composables -> services -> database`.
2. Jaga perubahan tetap kecil dan sesuai kontrak yang sudah ada.
3. Perubahan database harus lewat migration baru.
4. Jika endpoint internal perlu tersedia di `/api/internal/*`, jangan lupa file re-export di `server/api/`.

## Cara Menambah Fitur Baru

1. Tentukan page/feature yang terdampak.
2. Tambahkan state di composable/viewmodel atau store yang paling relevan.
3. Tambahkan route backend bila perlu.
4. Tambahkan service function di `server/services`.
5. Tambahkan migration jika menyentuh database.
6. Perbarui dokumentasi di folder `docs/`.

## Cara Menambah Halaman Baru

1. Tambahkan file di `src/pages/`.
2. Jika public, set `definePageMeta({ public: true })`.
3. Jika butuh layout khusus, set `layout`.
4. Letakkan UI utama di `src/features/<fitur>/`.
5. Gunakan `useHead()` untuk title.

## Cara Menambah Component Baru

1. Komponen reusable umum -> `src/components/`
2. Komponen yang hanya milik satu fitur -> `src/features/<fitur>/components/`
3. Hindari menaruh state domain berat di child component; ikuti pola `page` object bila konsisten dengan modul aplikasi ini.

## Cara Menambah Service/Composable Baru

### Client-side

- HTTP helper tetap lewat `callBackendApi()`
- data auth tetap lewat `useAuthViewModel()` atau `authStore`

### Server-side

- buat route di `server/routes`
- bungkus dengan `defineJsonHandler()`
- untuk auth user pakai `requireAuthenticatedUser()`
- untuk internal API pakai `requireInternalServiceRequest()`

## Cara Menambah Tabel Supabase

1. Tambahkan migration baru di `sql/migration/`.
2. Tambahkan trigger `updated_at` bila tabel mutable.
3. Tambahkan index sesuai pola query service.
4. Tambahkan RLS bila tabel dibaca user authenticated.
5. Perbarui dokumen:
   - `05-database-documentation.md`
   - `06-erd.md`
   - `08-supabase-rls-policy.md`

## Cara Menambah RLS Policy

1. Buat migration baru, jangan edit migration lama.
2. Ikuti pola helper function ownership yang sudah ada.
3. Pisahkan policy tabel business dan storage bila perlu.
4. Uji dengan user authenticated biasa, bukan hanya service role.

## Cara Update Environment Variable

1. Tambahkan di `.env.example`.
2. Tambahkan pembacaan di `nuxt.config.ts` atau `server/config/env.js` sesuai scope.
3. Jika public, tambahkan juga fallback di `src/infrastructure/runtime/publicConfig.ts`.
4. Dokumentasikan di `docs/13-environment.md`.

## Cara Debug Masalah Umum

| Masalah | Lokasi debug utama |
| --- | --- |
| login gagal | `src/stores/authStore.ts`, env Supabase public |
| profile tidak termuat | `/auth/profile`, `server/utils/requestContext.ts` |
| aplikasi tidak muncul | `candidate_applications`, `getAuthenticatedCandidateProfile()` |
| form kosong/tidak tersimpan | `candidateFormService`, `saveAuthenticatedCandidateApplicationForm()` |
| upload gagal | storage bucket, policy, `useCandidateApplicationFormPage.ts` |
| internal API 401 | `INTERNAL_SERVICE_TOKEN`, `internalAuthService.js` |
| sync event gagal | `candidateSyncService.js`, env `HRD_PINTU_SYNC_*` |

## Cara Menjaga Konsistensi Kode

1. Pertahankan naming yang sudah ada:
   - `candidate_*`
   - `employee_*`
   - `useXxxPage`
   - `useXxxViewModel`
2. Jangan bypass service role pattern dengan query DB langsung dari browser.
3. Untuk perubahan form, sinkronkan:
   - type di `src/domain/entities/CandidateApplicationForm.ts`
   - normalisasi di `server/services/candidateAccountService.js`
   - mapping snapshot di `server/services/candidateFormService.js`
   - UI di `src/features/applications/*`
