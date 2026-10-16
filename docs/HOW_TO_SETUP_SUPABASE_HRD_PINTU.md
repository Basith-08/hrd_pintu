# How To Setup Supabase `hrd_pintu`

> Historical reference. Verified against current repository state: 2026-05-29. Gunakan [13 Environment](13-environment.md), [05 Database Documentation](05-database-documentation.md), dan [08 Supabase RLS Policy](08-supabase-rls-policy.md) sebagai acuan utama.

Dokumen ini fokus ke implementasi teknis:

- membuat project Supabase
- menyiapkan schema database
- menyiapkan storage bucket dan policy
- menghubungkan aplikasi `hrd_pintu` ke Supabase
- memverifikasi flow auth, database, dan upload

Dokumen ini tidak fokus pada penjelasan bisnis. Fokusnya murni langkah teknis.

## 1. Tujuan Setup

Setelah semua langkah di dokumen ini selesai, hasil akhirnya harus seperti ini:

- project Supabase `hrd_pintu` sudah dibuat
- schema database aktif sudah terpasang
- bucket storage sudah ada
- policy storage sudah aktif
- app `hrd_pintu` bisa login ke Supabase
- backend app bisa memakai service role untuk operasi admin
- kandidat bisa login, isi form, upload foto, dan upload dokumen

## 2. File Referensi Teknis

Dokumen ini mengacu ke file berikut:

- [.env.example](../.env.example)
- [nuxt.config.ts](../nuxt.config.ts)
- [src/infrastructure/supabase/client.ts](../src/infrastructure/supabase/client.ts)
- [server/services/supabaseAdmin.js](../server/services/supabaseAdmin.js)
- [src/stores/authStore.ts](../src/stores/authStore.ts)
- [src/features/applications/useCandidateApplicationFormPage.ts](../src/features/applications/useCandidateApplicationFormPage.ts)
- [sql/migration](../sql/migration)

## 3. Buat Project Supabase

### 3.1 Buat account dan project

1. buka `https://supabase.com`
2. login atau buat account
3. klik `New project`
4. pilih organization
5. isi:
   - project name
   - database password
   - region
6. tunggu sampai project siap

Rekomendasi nama:

- `hrd-pintu-dev`
- `hrd-pintu-staging`
- `hrd-pintu-prod`

### 3.2 Ambil credential project

Setelah project jadi, buka:

- `Settings` -> `API`

Ambil nilai berikut:

- `Project URL`
- `anon public key`
- `service_role key`

Nilai-nilai ini akan dipakai di env aplikasi.

## 4. Siapkan Environment Lokal

Buat file env lokal:

```bash
cd <project-root>
cp .env.example .env
```

Isi `.env` minimal seperti ini:

```env
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET=candidate-photographs
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET=candidate-documents
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
INTERNAL_SERVICE_TOKEN=replace-with-shared-secret
HRD_PINTU_SYNC_BASE_URL=http://localhost:3000/api/internal
HRD_PINTU_SYNC_TOKEN=replace-with-shared-secret
```

Kalau bucket employee dipisah, tambahkan juga:

```env
NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET=employee-documents
```

Catatan:

- `NUXT_PUBLIC_*` dipakai di browser
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk backend
- jangan commit `.env`

## 5. Setup Schema Database

### 5.1 Gunakan migration, bukan snapshot schema tunggal, untuk bootstrap

Untuk setup project baru, source of truth yang paling aman adalah file migration di folder:

- [sql/migration](../sql/migration)

Catatan penting:

- file [sql/migration/public-schema.sql](../sql/migration/public-schema.sql) bisa dipakai untuk inspeksi snapshot schema `public`
- tetapi file itu bukan bootstrap script lengkap yang aman dipakai sendirian untuk project kosong
- file itu juga tidak memuat urutan evolusi schema yang dibutuhkan untuk audit perubahan
- untuk project baru, jalankan migration satu per satu sesuai urutan

### 5.2 Urutan migration yang perlu dijalankan

Jalankan file-file berikut di Supabase SQL Editor, sesuai urutan nama file:

1. [20260401_001_candidate_service_baseline.sql](../sql/migration/20260401_001_candidate_service_baseline.sql)
2. [20260402_002_add_candidate_legacy_form_tables.sql](../sql/migration/20260402_002_add_candidate_legacy_form_tables.sql)
3. [20260402_003_drop_obsolete_candidate_application_forms.sql](../sql/migration/20260402_003_drop_obsolete_candidate_application_forms.sql)
4. [20260406_004_alter_candidate_form_notice_period_to_date.sql](../sql/migration/20260406_004_alter_candidate_form_notice_period_to_date.sql)
5. [20260406_005_add_candidate_account_activated_at.sql](../sql/migration/20260406_005_add_candidate_account_activated_at.sql)
6. [20260406_006_add_employee_mode_tables.sql](../sql/migration/20260406_006_add_employee_mode_tables.sql)
7. [20260406_007_enable_candidate_service_rls.sql](../sql/migration/20260406_007_enable_candidate_service_rls.sql)
8. [20260407_008_drop_candidate_status_events.sql](../sql/migration/20260407_008_drop_candidate_status_events.sql)
9. [20260407_009_merge_candidate_profiles_into_accounts.sql](../sql/migration/20260407_009_merge_candidate_profiles_into_accounts.sql)
10. [20260407_010_add_candidate_storage_buckets_and_policies.sql](../sql/migration/20260407_010_add_candidate_storage_buckets_and_policies.sql)
11. [20260407_011_remove_form_progress_from_candidate_snapshots.sql](../sql/migration/20260407_011_remove_form_progress_from_candidate_snapshots.sql)
12. [20260408_012_add_candidate_service_indexes.sql](../sql/migration/20260408_012_add_candidate_service_indexes.sql)
13. [20260416_013_add_candidate_form_full_name.sql](../sql/migration/20260416_013_add_candidate_form_full_name.sql)
14. [20260416_014_drop_candidate_form_home_phone.sql](../sql/migration/20260416_014_drop_candidate_form_home_phone.sql)
15. [20260416_015_drop_candidate_form_name_parts.sql](../sql/migration/20260416_015_drop_candidate_form_name_parts.sql)

### 5.3 Hasil schema yang diharapkan

Sesudah migration selesai, minimal tabel aktif yang harus ada:

- `candidate_accounts`
- `candidate_applications`
- `candidate_form`
- `candidate_languages`
- `candidate_references`
- `candidate_skills`
- `education`
- `family_and_emergency`
- `personal_statement`
- `work_history`
- `employee_payroll_profile`
- `employee_documents`

Tabel yang memang sudah tidak aktif lagi:

- `candidate_profiles`
- `candidate_status_events`

## 6. Setup Storage Bucket

Kalau migration [20260407_010_add_candidate_storage_buckets_and_policies.sql](../sql/migration/20260407_010_add_candidate_storage_buckets_and_policies.sql) sudah dijalankan dengan sukses, bucket dan policy akan dibuat otomatis.

Tetap cek manual di Supabase Dashboard:

- `Storage` -> `Buckets`

### 6.1 Bucket yang harus ada

#### `candidate-photographs`

Konfigurasi:

- private
- file size limit `5 MB`
- MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Policy yang harus ada:

- `candidate_photographs_storage_select`
- `candidate_photographs_storage_insert`
- `candidate_photographs_storage_update`

#### `candidate-documents`

Konfigurasi:

- private
- file size limit `10 MB`
- MIME types:
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Policy yang harus ada:

- `employee_documents_storage_select`
- `employee_documents_storage_insert`
- `employee_documents_storage_update`

### 6.2 Path convention yang dipakai code

Code saat ini memakai path berikut:

- foto kandidat:
  - `candidate-forms/<ownerId>/<fileName>`
- dokumen employee:
  - `employee-forms/<ownerId>/<documentType>/<fileName>`

Referensi implementasi:

- [src/features/applications/useCandidateApplicationFormPage.ts](../src/features/applications/useCandidateApplicationFormPage.ts:1212)
- [src/features/applications/useCandidateApplicationFormPage.ts](../src/features/applications/useCandidateApplicationFormPage.ts:1262)

Ini harus sesuai dengan policy storage. Kalau prefix path berbeda, upload akan gagal.

## 7. Cara App Ini Terkoneksi ke Supabase

Project ini memakai 2 jenis koneksi Supabase:

1. client-side dengan anon key
2. server-side dengan service role key

### 7.1 Client-side Supabase

Client browser dibuat di:

- [src/infrastructure/supabase/client.ts](../src/infrastructure/supabase/client.ts)

Konfigurasinya diambil dari:

- [src/infrastructure/runtime/publicConfig.ts](../src/infrastructure/runtime/publicConfig.ts)
- [nuxt.config.ts](../nuxt.config.ts)

Alurnya:

1. browser membaca `NUXT_PUBLIC_SUPABASE_URL`
2. browser membaca `NUXT_PUBLIC_SUPABASE_ANON_KEY`
3. app memanggil `createClient(supabaseUrl, supabaseAnonKey)`

Kegunaan koneksi browser:

- login kandidat
- logout kandidat
- upload file ke storage
- membuat signed URL untuk preview foto

### 7.2 Server-side Supabase

Client admin dibuat di:

- [server/services/supabaseAdmin.js](../server/services/supabaseAdmin.js)

Alurnya:

1. server membaca `SUPABASE_URL`
   atau fallback ke `NUXT_PUBLIC_SUPABASE_URL`
2. server membaca `SUPABASE_SERVICE_ROLE_KEY`
3. server memanggil `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`

Kegunaan koneksi server:

- create user di Supabase Auth
- update user auth
- baca dan tulis data domain kandidat
- generate signed URL internal
- validasi token akses kandidat

## 8. Implementasi Auth Kandidat

### 8.1 Login kandidat di browser

Flow login kandidat ada di:

- [src/stores/authStore.ts](../src/stores/authStore.ts)

App melakukan:

```ts
supabase.auth.signInWithPassword({
  email,
  password,
})
```

Artinya:

- Supabase Auth harus aktif untuk email/password
- user kandidat harus sudah ada di Supabase Auth

### 8.2 Mapping user auth ke domain account

Setelah login berhasil, app tidak berhenti di user auth saja.

User Supabase Auth dipetakan ke tabel domain:

- `candidate_accounts.identity_user_id`

RLS dan service logic memakai mapping ini untuk menentukan data kandidat mana yang boleh diakses user yang sedang login.

## 9. Implementasi Create Candidate Account

Flow create account teknis ada di:

- [server/services/candidateAccountService.js](../server/services/candidateAccountService.js:941)

Alur server saat membuat kandidat:

1. backend mencari user auth berdasarkan email
2. kalau belum ada, backend memanggil:

```ts
supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
```

3. sesudah user auth ada, backend insert atau update row di `candidate_accounts`
4. backend memastikan kandidat punya application di `candidate_applications`
5. backend memastikan form kandidat tersedia di `candidate_form`

Artinya secara teknis ada 2 lapis data:

- Supabase Auth user
- tabel domain `candidate_accounts`

Keduanya harus sinkron.

## 10. Implementasi Form dan Data Kandidat

Form kandidat tidak langsung ditulis ke Supabase dari client dengan query database mentah.

Pola implementasinya:

- browser login dengan Supabase Auth
- browser memanggil backend internal app
- backend memakai service role untuk baca/tulis tabel domain

File yang relevan:

- [server/services/candidateFormService.js](../server/services/candidateFormService.js)
- [server/services/candidateAccountService.js](../server/services/candidateAccountService.js)

Keuntungan pola ini:

- validasi bisnis tetap di backend
- struktur child tables bisa di-sync dengan aman
- client tidak perlu menulis langsung ke semua tabel

## 11. Implementasi Upload File

### 11.1 Upload photograph

Flow upload foto ada di:

- [src/features/applications/useCandidateApplicationFormPage.ts](../src/features/applications/useCandidateApplicationFormPage.ts:1200)

Pola teknisnya:

1. browser memilih file
2. app membangun path:

```text
candidate-forms/<ownerId>/<fileName>
```

3. app upload ke:

```ts
supabase.storage.from(candidatePhotographBucket).upload(filePath, file, ...)
```

4. path file disimpan ke field `candidate_form.photograph`

### 11.2 Upload employee documents

Flow upload dokumen ada di:

- [src/features/applications/useCandidateApplicationFormPage.ts](../src/features/applications/useCandidateApplicationFormPage.ts:1240)

Pola teknisnya:

1. app membangun path:

```text
employee-forms/<ownerId>/<documentType>/<fileName>
```

2. app upload ke bucket `candidate-documents`
3. path hasil upload disimpan ke tabel `employee_documents.file_path`

Catatan tipe dokumen kontrak dari dashboard HRD:

- `format_office` = Draft Employment Contract
- `skb` = SKB
- `other` = Lainnya, opsional, bisa menyimpan multiple file
- pastikan migration `20260513_060_allow_other_employee_contract_document_type.sql` sudah dijalankan agar `employee_documents.document_type = 'other'` diterima oleh constraint database

### 11.3 Signed URL

Ada 2 pola signed URL di code:

- browser membuat signed URL untuk preview foto
- backend internal membuat signed URL untuk akses file tertentu

Referensi:

- [src/features/applications/useCandidateApplicationFormPage.ts](../src/features/applications/useCandidateApplicationFormPage.ts:1338)
- [server/routes/internal/storage/sign-url.post.ts](../server/routes/internal/storage/sign-url.post.ts)

## 12. Verifikasi Setup

Sesudah setup selesai, cek langkah berikut.

### 12.1 Verifikasi env

Jalankan:

```bash
cd <project-root>
pnpm install --frozen-lockfile
pnpm type-check
pnpm build
```

Kalau env Supabase kosong, biasanya error yang muncul:

- `NUXT_PUBLIC_SUPABASE_URL belum diisi di file .env`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di file .env`
- `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set`

### 12.2 Verifikasi auth

Yang harus dibuktikan:

- kandidat bisa login dengan email/password
- setelah login, `/auth/profile` bisa mengembalikan profile kandidat
- logout berjalan normal

### 12.3 Verifikasi database

Yang harus dibuktikan:

- row `candidate_accounts` berhasil dibuat
- `identity_user_id` terisi sesuai user di `auth.users`
- application kandidat berhasil dibuat
- `candidate_form` bisa dibuat / dibaca / diupdate

### 12.4 Verifikasi storage

Yang harus dibuktikan:

- upload pas foto berhasil ke `candidate-photographs`
- upload dokumen berhasil ke `candidate-documents`
- object path sesuai prefix policy
- signed URL bisa dibuat

## 13. Troubleshooting

### `NUXT_PUBLIC_SUPABASE_URL belum diisi di file .env`

Artinya env public browser belum benar.

Periksa:

- `.env`
- `.env.local`
- `nuxt.config.ts`
- `src/infrastructure/runtime/publicConfig.ts`

### `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set`

Artinya backend tidak bisa membuat admin client.

Periksa:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NUXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_URL` kalau Anda set manual

### Login berhasil tapi data kandidat kosong

Biasanya penyebabnya:

- user ada di `auth.users`
- tapi belum ada row yang cocok di `candidate_accounts`
- atau `identity_user_id` tidak sinkron

### Upload gagal

Periksa:

- bucket name sesuai env
- file size tidak melebihi limit
- MIME type diizinkan
- object path sesuai policy
- user sedang login sebagai `authenticated`

### Project baru sudah dibuat tapi schema berantakan

Kemungkinan penyebab:

- migration dijalankan tidak berurutan
- langsung memakai snapshot schema seperti `public-schema.sql` sebagai bootstrap
- ada file migration yang terlewat

Solusi paling aman:

- buat project Supabase baru
- ulangi dari migration berurutan

## 14. Langkah Implementasi Paling Singkat

Kalau mau versi super singkat, urutannya:

1. buat project Supabase
2. ambil `Project URL`, `anon key`, dan `service_role key`
3. isi `.env`
4. jalankan migration SQL satu per satu
5. cek bucket dan policy storage
6. jalankan app dengan `pnpm dev`
7. login kandidat
8. cek create account, form, upload, dan submit
