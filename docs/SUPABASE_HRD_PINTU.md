# Supabase `hrd_pintu`

> Historical reference. Verified against current repository state: 2026-05-29. Gunakan [05 Database Documentation](05-database-documentation.md) dan [08 Supabase RLS Policy](08-supabase-rls-policy.md) sebagai acuan utama.

Dokumen ini adalah draft dokumentasi Supabase untuk project `hrd_pintu`.

Tujuan dokumen ini:

- menjelaskan arsitektur database aktif
- merangkum auth, env, RLS, dan storage
- memetakan tabel inti per domain
- mencatat perubahan schema penting dari migration aktif

Dokumen ini sengaja dimulai dari level yang rapi dan mudah dibaca dulu. Detail kolom per tabel bisa ditambahkan bertahap pada iterasi berikutnya.

## 1. Scope

Dokumen ini membahas Supabase untuk aplikasi `hrd_pintu`, yaitu portal kandidat yang terpisah dari `hrd_ruang`.

Fungsi database ini secara umum:

- menyimpan akun kandidat
- menyimpan aplikasi kandidat per `erf`
- menyimpan form kandidat sebagai source of truth
- menyimpan data dokumen dan payroll untuk mode employee
- menyediakan storage bucket untuk foto dan dokumen
- membatasi akses data kandidat lewat RLS

## 2. Sumber Dokumen

Dokumen ini disusun dari sumber berikut:

- [sql/migration/public-schema.sql](../sql/migration/public-schema.sql)
- [sql/migration](../sql/migration)
- [.env.example](../.env.example)
- [README.md](../README.md)

Migration yang paling menentukan schema aktif saat ini:

- [20260401_001_candidate_service_baseline.sql](../sql/migration/20260401_001_candidate_service_baseline.sql)
- [20260402_002_add_candidate_legacy_form_tables.sql](../sql/migration/20260402_002_add_candidate_legacy_form_tables.sql)
- [20260406_006_add_employee_mode_tables.sql](../sql/migration/20260406_006_add_employee_mode_tables.sql)
- [20260406_007_enable_candidate_service_rls.sql](../sql/migration/20260406_007_enable_candidate_service_rls.sql)
- [20260407_009_merge_candidate_profiles_into_accounts.sql](../sql/migration/20260407_009_merge_candidate_profiles_into_accounts.sql)
- [20260407_010_add_candidate_storage_buckets_and_policies.sql](../sql/migration/20260407_010_add_candidate_storage_buckets_and_policies.sql)

## 3. Gambaran Arsitektur

Implementasi saat ini memakai 2 aplikasi dan 2 database Supabase:

- `hrd_ruang`
  digunakan oleh HR/admin/internal team
- `hrd_pintu`
  digunakan oleh kandidat dan employee portal flow

Peran database `hrd_pintu`:

- menjadi system of record untuk data kandidat
- menerima pembuatan akun kandidat dari internal service
- menyimpan form kandidat lengkap
- menyimpan dokumen kandidat dan employee
- menyediakan data yang kemudian disinkronkan ke `hrd_ruang`

Alur tingginya:

1. HR membuat akun kandidat dari `hrd_ruang`.
2. `hrd_ruang` memanggil internal API `hrd_pintu`.
3. `hrd_pintu` membuat atau mengelola data kandidat di database Supabase khusus kandidat.
4. Kandidat login ke portal kandidat.
5. Kandidat mengisi form, upload foto, upload dokumen, lalu submit.
6. Ringkasan event / status tertentu disinkronkan kembali ke `hrd_ruang`.

## 4. Auth dan Environment Variables

Environment yang terkait langsung dengan Supabase dan integrasi service saat ini:

| Variable | Wajib | Fungsi |
| --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase kandidat |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | anon key untuk akses browser |
| `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET` | Ya | bucket storage untuk pas foto |
| `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET` | Ya | bucket storage dokumen kandidat |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | akses admin Supabase untuk server-side code |
| `INTERNAL_SERVICE_TOKEN` | Ya | autentikasi internal call dari `hrd_ruang` |
| `HRD_PINTU_SYNC_BASE_URL` | Ya | endpoint sinkron ke `hrd_ruang` |
| `HRD_PINTU_SYNC_TOKEN` | Ya | token sinkron ke `hrd_ruang` |

Opsional:

| Variable | Fungsi |
| --- | --- |
| `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` | bucket employee bila dipisah |

Catatan penting:

- semua env `NUXT_PUBLIC_*` terbaca di browser
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server-side
- service role dipakai backend untuk operasi yang tidak bisa mengandalkan akses kandidat biasa
- auth kandidat mengandalkan `identity_user_id` di `candidate_accounts`, lalu dicocokkan dengan `auth.uid()`

## 5. Ringkasan Schema Aktif

Secara domain, schema aktif bisa dibagi menjadi 4 area:

1. akun kandidat
2. aplikasi kandidat
3. form kandidat dan child tables
4. employee mode extension

### 5.1 Akun Kandidat

#### `public.candidate_accounts`

Tabel utama identitas kandidat dalam sistem.

Peran:

- menghubungkan user Supabase Auth ke data domain internal
- menyimpan status akun kandidat
- menyimpan atribut akun yang paling sering diakses

Kolom penting:

- `id`
- `identity_user_id`
- `email`
- `status`
- `portal_role`
- `activated_at`
- `full_name`
- `phone`
- `personal_data`
- `created_at`
- `updated_at`

Constraint penting:

- `email` unik
- `identity_user_id` unik
- `status` dibatasi ke `active`, `inactive`, `revoked`
- `portal_role` dibatasi ke `candidate` atau `employee`

Catatan evolusi schema:

- awalnya detail profil kandidat dipisah di `candidate_profiles`
- migration [20260407_009_merge_candidate_profiles_into_accounts.sql](../sql/migration/20260407_009_merge_candidate_profiles_into_accounts.sql) memindahkan `full_name`, `phone`, dan `personal_data` ke `candidate_accounts`
- tabel `candidate_profiles` kemudian dihapus

### 5.2 Aplikasi Kandidat

#### `public.candidate_applications`

Satu kandidat dapat memiliki beberapa aplikasi, dibedakan oleh `erf_id`.

Peran:

- menyimpan pendaftaran kandidat ke posisi tertentu
- menyimpan snapshot job pada saat aplikasi dibuat atau diproses
- menjadi parent untuk `candidate_form`

Kolom penting:

- `id`
- `candidate_account_id`
- `erf_id`
- `status`
- `job_snapshot`
- `submitted_at`
- `created_at`
- `updated_at`

Constraint penting:

- kombinasi `(candidate_account_id, erf_id)` harus unik

Relasi:

- banyak `candidate_applications` dimiliki oleh satu `candidate_accounts`
- satu `candidate_applications` memiliki satu `candidate_form`

Catatan:

- tabel `candidate_status_events` pernah ada di baseline
- migration [20260407_008_drop_candidate_status_events.sql](../sql/migration/20260407_008_drop_candidate_status_events.sql) menghapus tabel tersebut dari schema aktif

### 5.3 Form Kandidat

#### `public.candidate_form`

Ini adalah tabel inti detail kandidat untuk satu aplikasi.

Peran:

- menjadi source of truth data form kandidat
- menjadi parent untuk hampir semua tabel detail lain

Relasi utama:

- `application_id` unik, jadi satu aplikasi hanya punya satu form
- `candidate_account_id` menunjuk pemilik form

Contoh kelompok data di tabel ini:

- identitas dasar
- data kelahiran
- alamat
- kontak
- data identitas
- data kesiapan bergabung
- foto kandidat
- status penyelesaian form

Kolom penting yang menandai state bisnis:

- `application_id`
- `candidate_account_id`
- `full_name`
- `notice_period`
- `available_start_date`
- `join_date`
- `photograph`
- `completion_status`

Catatan evolusi schema:

- `notice_period` diubah menjadi `date` di migration [20260406_004_alter_candidate_form_notice_period_to_date.sql](../sql/migration/20260406_004_alter_candidate_form_notice_period_to_date.sql)
- `full_name` ditambahkan pada migration [20260416_013_add_candidate_form_full_name.sql](../sql/migration/20260416_013_add_candidate_form_full_name.sql)
- `home_phone` dihapus di migration [20260416_014_drop_candidate_form_home_phone.sql](../sql/migration/20260416_014_drop_candidate_form_home_phone.sql)
- `first_name`, `middle_name`, dan `last_name` dihapus di migration [20260416_015_drop_candidate_form_name_parts.sql](../sql/migration/20260416_015_drop_candidate_form_name_parts.sql)

### 5.4 Child Tables dari `candidate_form`

Tabel-tabel ini bergantung pada `candidate_form` dan menyimpan detail terstruktur.

#### `public.candidate_languages`

Menyimpan bahasa yang dikuasai kandidat dan level:

- `speaking`
- `reading`
- `listening`
- `writing`

Semua level dibatasi ke:

- `good`
- `fair`
- `poor`

#### `public.candidate_references`

Menyimpan referensi profesional kandidat.

Kolom penting:

- `name`
- `phone_number`
- `relationship`
- `position`
- `reference_order`

#### `public.candidate_skills`

Menyimpan daftar skill kandidat.

Kolom penting:

- `skill_name`
- `description`
- `skill_order`

#### `public.education`

Menyimpan riwayat pendidikan kandidat.

Contoh atribut:

- `level`
- `institution`
- `major`
- `from_year`
- `to_year`
- `category`

`level` dibatasi ke daftar jenjang pendidikan yang sudah ditentukan.

#### `public.family_and_emergency`

Menyimpan data keluarga dan emergency contact.

Contoh atribut:

- `name`
- `relationship`
- `gender`
- `occupation`
- `remarks`
- `category`

#### `public.personal_statement`

Menyimpan pernyataan personal kandidat.

Contoh area data:

- kontrak
- reference check
- business trip
- expected salary
- riwayat aplikasi sebelumnya
- hubungan keluarga / teman di perusahaan
- isu kesehatan
- isu hukum

Relasi:

- satu `candidate_form` maksimal satu `personal_statement`

#### `public.work_history`

Menyimpan pengalaman kerja kandidat.

Contoh atribut:

- `company`
- `position`
- `from_year`
- `to_year`
- `last_salary`
- `reason_to_quitting`

### 5.5 Employee Mode Extension

Migration [20260406_006_add_employee_mode_tables.sql](../sql/migration/20260406_006_add_employee_mode_tables.sql) menambahkan mode portal `employee` dan dua tabel tambahan.

#### `public.employee_payroll_profile`

Dipakai untuk kebutuhan payroll dan BPJS.

Contoh atribut:

- `bank_name`
- `bank_account_number`
- `account_holder_name`
- `branch_name`
- `tax_identification_number`
- `bpjs_health_enrollment_preference`
- `bpjs_health_decline_reason`
- `bpjs_health_decline_reason_other`
- `bpjs_employment_status`

Relasi:

- satu `candidate_form` maksimal satu `employee_payroll_profile`

#### `public.employee_documents`

Menyimpan metadata dokumen employee yang terhubung ke storage path.

Kolom penting:

- `candidate_form_id`
- `document_type`
- `file_path`

`document_type` dibatasi ke nilai berikut:

- `cv`
- `integrity_pact`
- `email_usage_policy`
- `identity_card`
- `family_card`
- `latest_diploma`
- `academic_transcript`
- `tax_id`
- `bpjs_health_card`
- `bpjs_health_statement`
- `bpjs_employment_card`
- `bank_account_book`

Constraint penting:

- `(candidate_form_id, document_type, file_path)` unik

## 6. RLS dan Kontrol Akses

Migration aktif RLS ada di [20260406_007_enable_candidate_service_rls.sql](../sql/migration/20260406_007_enable_candidate_service_rls.sql).

Prinsip utamanya:

- kandidat hanya boleh membaca row miliknya sendiri
- backend tetap bisa melakukan operasi lebih luas lewat service role
- akses ownership diturunkan dari `auth.uid()`

Function helper yang dipakai:

- `public.current_candidate_account_id()`
- `public.can_access_candidate_account(uuid)`
- `public.candidate_application_owner(uuid)`
- `public.can_access_candidate_application(uuid)`
- `public.candidate_form_owner(uuid)`
- `public.can_access_candidate_form(uuid)`

Pola aksesnya:

- `candidate_accounts`
  kandidat hanya bisa `select` row miliknya
- `candidate_applications`
  kandidat hanya bisa `select` aplikasi miliknya
- `candidate_form`
  kandidat hanya bisa `select` form miliknya
- child tables berbasis `candidate_form_id`
  kandidat hanya bisa `select` data yang terhubung ke form miliknya
- `employee_payroll_profile` dan `employee_documents`
  juga hanya bisa dibaca bila form parent milik kandidat tersebut

Catatan penting:

- migration RLS yang aktif saat ini fokus pada `select`
- alur write tampaknya di-handle oleh backend/service layer, bukan langsung mengandalkan kebijakan write dari client biasa

## 7. Storage

Migration storage aktif ada di [20260407_010_add_candidate_storage_buckets_and_policies.sql](../sql/migration/20260407_010_add_candidate_storage_buckets_and_policies.sql).

Saat ini ada 2 bucket aktif, keduanya `private`.

### 7.1 Bucket `candidate-documents`

Fungsi:

- menyimpan dokumen kandidat / employee
- dipakai oleh `public.employee_documents.file_path`

Konfigurasi:

- nama bucket: `candidate-documents`
- `public = false`
- file size limit: `10 MB` (`10485760`)
- allowed MIME types:
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Policy aktif:

- `employee_documents_storage_select`
  - role: `authenticated`
  - `using`: `bucket_id = 'candidate-documents'`
- `employee_documents_storage_insert`
  - role: `authenticated`
  - `with check`:
    - bucket harus `candidate-documents`
    - path harus mulai dengan `employee-forms/` atau `candidate-forms/`
- `employee_documents_storage_update`
  - role: `authenticated`
  - `using`: `bucket_id = 'candidate-documents'`
  - `with check`:
    - bucket harus `candidate-documents`
    - path harus mulai dengan `employee-forms/` atau `candidate-forms/`

### 7.2 Bucket `candidate-photographs`

Fungsi:

- menyimpan pas foto kandidat
- dipakai oleh `public.candidate_form.photograph`

Konfigurasi:

- nama bucket: `candidate-photographs`
- `public = false`
- file size limit: `5 MB` (`5242880`)
- allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Policy aktif:

- `candidate_photographs_storage_select`
  - role: `authenticated`
  - `using`: `bucket_id = 'candidate-photographs'`
- `candidate_photographs_storage_insert`
  - role: `authenticated`
  - `with check`:
    - bucket harus `candidate-photographs`
    - path harus mulai dengan `candidate-forms/`
- `candidate_photographs_storage_update`
  - role: `authenticated`
  - `using`: `bucket_id = 'candidate-photographs'`
  - `with check`:
    - bucket harus `candidate-photographs`
    - path harus mulai dengan `candidate-forms/`

## 8. Index dan Performa

Index pendukung query utama ditambahkan di [20260408_012_add_candidate_service_indexes.sql](../sql/migration/20260408_012_add_candidate_service_indexes.sql).

Index yang penting:

- `idx_candidate_accounts_created_at_desc`
- `idx_candidate_applications_candidate_account_id_created_at_desc`
- `idx_candidate_form_candidate_account_id_updated_at_desc`
- `idx_candidate_languages_candidate_form_id`
- `idx_candidate_references_candidate_form_id`
- `idx_candidate_skills_candidate_form_id`
- `idx_education_candidate_form_id`
- `idx_family_and_emergency_candidate_form_id`
- `idx_work_history_candidate_form_id`
- `idx_employee_documents_candidate_form_id`

Selain itu, beberapa index sudah otomatis ada lewat:

- primary key
- unique constraint

## 9. Ringkasan Migration Penting

Urutan perubahan schema yang paling relevan:

1. baseline akun, profil, application, dan status event dibuat
2. form kandidat dan child tables ditambahkan
3. `notice_period` diubah menjadi `date`
4. `activated_at` ditambahkan ke `candidate_accounts`
5. mode `employee` ditambahkan
6. RLS diaktifkan
7. `candidate_status_events` dihapus
8. `candidate_profiles` digabung ke `candidate_accounts`
9. storage bucket dan policy ditambahkan
10. index query utama ditambahkan
11. `job_snapshot` dibersihkan dari `form_progress_percent`
12. `candidate_form.full_name` ditambahkan
13. `home_phone` dihapus
14. `first_name`, `middle_name`, dan `last_name` dihapus

## 10. Catatan Implementasi

Beberapa catatan penting untuk developer:

- tidak ada migration runner otomatis saat ini
- SQL dijalankan manual lewat Supabase SQL Editor
- akses browser memakai anon key
- akses admin/service memakai `SUPABASE_SERVICE_ROLE_KEY`
- storage bucket aktif saat ini bersifat private
- relasi ownership kandidat selalu berporos pada `candidate_accounts.identity_user_id -> auth.uid()`

## 11. Next Iteration yang Disarankan

Agar dokumentasi ini makin lengkap, iterasi berikutnya bisa menambah:

- kamus kolom lengkap per tabel
- peta relasi/ERD dalam bentuk diagram
- daftar constraint dan enum/check per tabel
- contoh query untuk read/write yang umum
- mapping endpoint aplikasi ke tabel Supabase
- penjelasan lebih detail tentang flow candidate vs employee mode
