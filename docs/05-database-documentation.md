# 05 Database Documentation

> Last verified against current repository state: 2026-07-13

## Sumber Analisis

- `sql/migration/public-schema.sql` sebagai snapshot schema `public` terbaru yang tersedia di repository
- migration incremental di `sql/migration/*.sql`
- query di `server/services/candidateAccountService.js`
- query di `server/services/candidateFormService.js`

Catatan:

- `public-schema.sql` dipakai sebagai referensi schema hasil export saat dokumentasi ini disusun.
- Schema aktif final tetap perlu dibaca bersama migration incremental karena perilaku aplikasi juga ditentukan oleh urutan migrasi, RLS, storage policy, dan service code.
- Tabel `candidate_profiles` dan `candidate_status_events` sudah dihapus oleh migration aktif.

## Daftar Tabel Aktif

| Tabel | Fungsi |
| --- | --- |
| `candidate_accounts` | akun domain kandidat yang terhubung ke `auth.users` |
| `candidate_applications` | daftar aplikasi kandidat per `erf_id` |
| `candidate_form` | form utama per aplikasi |
| `candidate_languages` | bahasa dan tingkat penguasaan |
| `candidate_references` | data referensi kandidat |
| `candidate_skills` | skill kandidat |
| `education` | riwayat pendidikan formal/non-formal |
| `family_and_emergency` | data keluarga dan kontak darurat |
| `personal_statement` | pernyataan personal |
| `work_history` | riwayat pekerjaan |
| `employee_payroll_profile` | profil payroll employee |
| `employee_documents` | referensi file dokumen candidate/employee |

## Relasi Utama

- `candidate_accounts.identity_user_id` berelasi logis ke `auth.users.id`
- `candidate_applications.candidate_account_id -> candidate_accounts.id`
- `candidate_form.application_id -> candidate_applications.id`
- `candidate_form.candidate_account_id -> candidate_accounts.id`
- seluruh child table mengarah ke `candidate_form.id`

## Tabel Detail

### `candidate_accounts`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `identity_user_id` | `uuid` | Tidak | unique, relasi logis ke `auth.users.id` |
| `email` | `text` | Tidak | unique |
| `status` | `text` | Tidak | check: `active|inactive|revoked` |
| `created_by_internal_user_id` | `uuid` | Ya | aktor dari sistem internal |
| `last_login_at` | `timestamptz` | Ya | terakhir login profile refresh |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |
| `activated_at` | `timestamptz` | Ya | waktu akun diaktifkan; digunakan sebagai dasar perhitungan auto-deactivate 60 hari |
| `portal_role` | `text` | Tidak | check: `candidate|employee` |
| `full_name` | `text` | Ya | hasil merge dari `candidate_profiles` |
| `phone` | `text` | Ya | hasil merge dari `candidate_profiles` |
| `employee_code` | `text` | Ya | ditambah migration `20260428_017_*` |
| `personal_data` | `jsonb` | Tidak | default `{}`; saat ini dipakai untuk `contract_number` |
| `created_by` | `uuid` | Ya | audit internal |
| `updated_by` | `uuid` | Ya | audit internal |

Primary key:

- `candidate_accounts_pkey (id)`

Unique:

- `identity_user_id`
- `email`

Index yang ditemukan:

- implicit unique index untuk `identity_user_id`
- implicit unique index untuk `email`
- `idx_candidate_accounts_created_at_desc`

### `candidate_applications`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_account_id` | `uuid` | Tidak | FK ke `candidate_accounts.id` |
| `erf_id` | `uuid` di `public-schema.sql`, diperlakukan sebagai string di service | Tidak | identifier aplikasi/ERF |
| `status` | `text` | Tidak | default `draft`; service juga menulis `submitted` |
| `job_snapshot` | `jsonb` | Tidak | default `{}` |
| `submitted_at` | `timestamptz` | Ya | waktu submit aplikasi |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

Primary key:

- `candidate_applications_pkey (id)`

Foreign key:

- `candidate_applications_candidate_account_id_fkey`

Constraint:

- unique `(candidate_account_id, erf_id)`

Index:

- implicit unique index untuk `(candidate_account_id, erf_id)`
- `idx_candidate_applications_candidate_account_id_created_at_desc`

Catatan:

- `job_snapshot.form_progress_percent` dibersihkan oleh migration `20260407_011_*`.

### `candidate_form`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `application_id` | `uuid` | Tidak | unique FK ke `candidate_applications.id` |
| `candidate_account_id` | `uuid` | Tidak | FK ke `candidate_accounts.id` |
| `employee_request_form_id` | `uuid` | Ya | ditemukan di `public-schema.sql`; tidak ditemukan pemakaian aktif di service |
| `candidate_id` | `uuid` | Ya | ditemukan di `public-schema.sql`; tidak ditemukan pemakaian aktif di service |
| `date_candidate_form` | `date` | Ya | dipetakan ke `date_application` |
| `notice_period` | `date` | Ya | diubah dari text oleh migration `20260406_004_*` |
| `hire_location` | `text` | Ya | lokasi kerja |
| `date_of_birth` | `date` | Ya | tanggal lahir |
| `place_of_birth` | `text` | Ya | tempat lahir |
| `nationality` | `text` | Ya | kewarganegaraan |
| `marital_status` | `text` | Ya | check `Single|Married|Divorced` |
| `religion` | `text` | Ya | agama |
| `gender` | `text` | Ya | check `Male|Female` |
| `ethnic` | `text` | Ya | etnis |
| `blood_type` | `text` | Ya | check `A|B|AB|O` |
| `id_card_address` | `text` | Ya | alamat KTP |
| `residential_address` | `text` | Ya | alamat domisili |
| `personal_email` | `text` | Ya | email personal |
| `instagram` | `text` | Ya | akun Instagram |
| `linkedin` | `text` | Ya | akun LinkedIn |
| `phone_number` | `text` | Ya | nomor telepon |
| `id_type` | `text` | Ya | jenis identitas |
| `id_no` | `text` | Ya | nomor identitas |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |
| `photograph` | `text` | Ya | path storage foto |
| `completion_status` | `text` | Tidak | DB check: `in_progress|completed` |
| `available_start_date` | `date` | Ya | siap mulai |
| `join_date` | `date` | Ya | tanggal join employee |
| `transportation_type` | `text` | Ya | jenis transportasi |
| `transportation_ownership` | `text` | Ya | kepemilikan transportasi |
| `residence_ownership` | `text` | Ya | status tempat tinggal |
| `full_name` | `text` | Ya | ditambah migration `20260416_013_*` |

Primary key:

- `candidate_form_pkey (id)`

Foreign key:

- `candidate_form_application_id_fkey`
- `candidate_form_candidate_account_id_fkey`

Unique:

- `application_id`

Index:

- implicit unique index untuk `application_id`
- `idx_candidate_form_candidate_account_id_updated_at_desc`

Catatan:

- Frontend type mengenal `employee_draf_contract`, tetapi constraint database yang ditemukan masih hanya `in_progress|completed`.

### `candidate_languages`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Tidak | FK |
| `language_name` | `text` | Tidak | nama bahasa |
| `speaking` | `text` | Ya | check `good|fair|poor` |
| `reading` | `text` | Ya | check `good|fair|poor` |
| `listening` | `text` | Ya | check `good|fair|poor` |
| `writing` | `text` | Ya | check `good|fair|poor` |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

Index:

- `idx_candidate_languages_candidate_form_id`

### `candidate_references`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Tidak | FK |
| `name` | `text` | Tidak | nama referensi |
| `phone_number` | `text` | Ya | nomor telepon |
| `relationship` | `text` | Ya | relasi |
| `position` | `text` | Ya | jabatan |
| `reference_order` | `integer` | Ya | check `> 0` bila ada |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

Index:

- `idx_candidate_references_candidate_form_id`

### `candidate_skills`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Tidak | FK |
| `skill_name` | `text` | Tidak | nama skill |
| `description` | `text` | Ya | deskripsi |
| `skill_order` | `integer` | Ya | check `> 0` bila ada |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

Index:

- `idx_candidate_skills_candidate_form_id`

### `education`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Ya | FK |
| `level` | `text` | Ya | check daftar jenjang |
| `institution` | `text` | Ya | institusi |
| `city` | `text` | Ya | kota |
| `major` | `text` | Ya | jurusan |
| `from_year` | `integer` | Ya | tahun mulai |
| `to_year` | `integer` | Ya | tahun selesai |
| `category` | `text` | Ya | `Formal Education` atau `Training / Non-Formal` di service |
| `description` | `text` | Ya | keterangan |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

Index:

- `idx_education_candidate_form_id`

### `family_and_emergency`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Ya | FK |
| `name` | `text` | Ya | nama |
| `relationship` | `text` | Ya | hubungan |
| `gender` | `text` | Ya | check `Male|Female` |
| `place_and_date_of_birth` | `text` | Ya | gabungan tempat/tanggal lahir |
| `education` | `text` | Ya | pendidikan |
| `description` | `text` | Ya | deskripsi |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |
| `occupation` | `text` | Ya | pekerjaan |
| `remarks` | `text` | Ya | catatan |
| `category` | `text` | Ya | `Spouse|Child|Parent|Sibling|Emergency Contact|Other` dari service |

Index:

- `idx_family_and_emergency_candidate_form_id`

### `personal_statement`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Ya | unique FK |
| `contract` | `boolean` | Ya | sedang terikat kontrak |
| `contract_period` | `text` | Ya | periode kontrak |
| `reference_check_reason` | `text` | Ya | alasan bila reference check tidak diizinkan |
| `business_trip` | `boolean` | Ya | bersedia dinas |
| `expected_salary` | `numeric` | Ya | ekspektasi gaji |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |
| `previous_application` | `boolean` | Ya | pernah melamar |
| `previous_application_details` | `text` | Ya | detail |
| `reference_check_allowed` | `boolean` | Ya | izin cek referensi |
| `family_or_friend_in_company` | `boolean` | Ya | keluarga/teman di perusahaan |
| `serious_illness` | `boolean` | Ya | penyakit serius |
| `serious_illness_details` | `text` | Ya | detail |
| `serious_accident_boolean` | `boolean` | Ya | kecelakaan serius |
| `psychological_test` | `boolean` | Ya | pernah psikotes |
| `psychological_test_location` | `text` | Ya | lokasi |
| `psychological_test_purpose` | `text` | Ya | tujuan |
| `company_legal_issue` | `boolean` | Ya | masalah hukum dengan perusahaan |
| `company_legal_issue_details` | `text` | Ya | detail |
| `family_or_friend_details` | `text` | Ya | detail |
| `serious_accident_details` | `text` | Ya | detail |
| `civil_or_criminal_case` | `boolean` | Ya | perkara perdata/pidana |
| `civil_or_criminal_case_details` | `text` | Ya | detail |

### `work_history`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Ya | FK |
| `company` | `text` | Ya | nama perusahaan |
| `position` | `text` | Ya | jabatan |
| `from_year` | `integer` | Ya | tahun mulai |
| `to_year` | `integer` | Ya | tahun selesai |
| `reason_to_quitting` | `text` | Ya | alasan keluar |
| `last_salary` | `numeric` | Ya | gaji terakhir |
| `benefit` | `text` | Ya | benefit |
| `description` | `text` | Ya | deskripsi |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |
| `company_address` | `text` | Ya | alamat |
| `company_phone` | `text` | Ya | telepon |
| `direct_superior_title` | `text` | Ya | atasan langsung |
| `organization_structure` | `text` | Ya | struktur organisasi |

Index:

- `idx_work_history_candidate_form_id`

### `employee_payroll_profile`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Tidak | unique FK |
| `bank_name` | `text` | Ya | nama bank |
| `bank_account_number` | `text` | Ya | nomor rekening |
| `account_holder_name` | `text` | Ya | nama pemilik |
| `branch_name` | `text` | Ya | cabang bank |
| `tax_identification_number` | `text` | Ya | NPWP |
| `bpjs_health_enrollment_preference` | `text` | Ya | check `willing_to_enroll|decline_enrollment` |
| `bpjs_health_decline_reason` | `text` | Ya | check `pbi|self_registered|local_government|other` |
| `bpjs_health_decline_reason_other` | `text` | Ya | detail alasan |
| `bpjs_employment_status` | `text` | Ya | check `cash_out_first|enroll_new|continue_existing` |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

### `employee_documents`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | Tidak | primary key |
| `candidate_form_id` | `uuid` | Tidak | FK |
| `document_type` | `text` | Tidak | daftar tipe dokumen |
| `file_path` | `text` | Tidak | path storage |
| `created_at` | `timestamptz` | Tidak | default `now()` |
| `updated_at` | `timestamptz` | Tidak | default `now()` + trigger |

Constraint:

- unique `(candidate_form_id, document_type, file_path)`

Tipe dokumen final yang ditemukan setelah migration `20260513_060_*`:

- `cv`
- `identity_card`
- `family_card`
- `latest_diploma`
- `academic_transcript`
- `certificate_of_employment`
- `tax_id`
- `bpjs_health_card`
- `bpjs_health_statement`
- `bpjs_employment_card`
- `bank_account_book`
- `integrity_pact`
- `email_usage_policy`
- `format_office`
- `skb`
- `other`

Urutan `integrity_pact` dan `email_usage_policy` dipindah ke setelah `bank_account_book` (sebelumnya di awal list) mengikuti urutan `employeeDocumentTypes` terbaru di `CandidateApplicationForm.ts`.

Index:

- `idx_employee_documents_candidate_form_id`

## Trigger Timestamp

Migration baseline membuat function `public.set_updated_at()` dan trigger `before update` untuk tabel-tabel utama. Trigger tambahan untuk `employee_payroll_profile` dan `employee_documents` ditambahkan pada migration `20260406_006_*`.

## Rangkuman Constraint Penting

- `candidate_accounts.status` check
- `candidate_accounts.portal_role` check
- `candidate_applications(candidate_account_id, erf_id)` unique
- `candidate_form.application_id` unique
- `personal_statement.candidate_form_id` unique
- `employee_payroll_profile.candidate_form_id` unique
- `employee_documents(candidate_form_id, document_type, file_path)` unique

## Index Yang Ditemukan

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

## Contoh Query Penting

### Lookup account by `identity_user_id`

```sql
select id, identity_user_id, email, full_name, phone, employee_code, status, portal_role
from public.candidate_accounts
where identity_user_id = :auth_user_id;
```

### Lookup applications by candidate

```sql
select id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at
from public.candidate_applications
where candidate_account_id = :candidate_account_id
order by created_at desc;
```

### Load candidate form snapshot lengkap

```sql
select
  *,
  family_and_emergency(*),
  education(*),
  work_history(*),
  personal_statement(*),
  employee_payroll_profile(*),
  employee_documents(*),
  candidate_languages(*),
  candidate_skills(*),
  candidate_references(*)
from public.candidate_form
where application_id = :application_id;
```

### Cek kepemilikan objek storage dokumen

```sql
select 1
from public.employee_documents ed
join public.candidate_form cf on cf.id = ed.candidate_form_id
join public.candidate_accounts ca on ca.id = cf.candidate_account_id
where ed.file_path = :path
  and ca.identity_user_id = auth.uid();
```

## Catatan Migrasi Database

1. `20260401_001_*` membentuk baseline akun, aplikasi, dan helper trigger.
2. `20260402_002_*` menambah `candidate_form` dan child tables.
3. `20260406_006_*` menambah mode `employee`, payroll, dan dokumen employee.
4. `20260406_007_*` mengaktifkan RLS untuk tabel business.
5. `20260407_008_*` menghapus `candidate_status_events`.
6. `20260407_009_*` menggabungkan `candidate_profiles` ke `candidate_accounts`.
7. `20260407_010_*` menambah bucket storage dan policy awal.
8. `20260519_061_*` mengeraskan policy storage object dengan fungsi ownership.
