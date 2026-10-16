# 08 Supabase RLS Policy

> Last verified against current repository state: 2026-06-23

## Sumber Analisis

- `sql/migration/20260406_007_enable_candidate_service_rls.sql`
- `sql/migration/20260407_010_add_candidate_storage_buckets_and_policies.sql`
- `sql/migration/20260519_061_harden_candidate_storage_object_policies.sql`

## Status RLS Pada Tabel

| Tabel | Status RLS | Policy Ditemukan |
| --- | --- | --- |
| `candidate_accounts` | Enabled | `SELECT` self |
| `candidate_applications` | Enabled | `SELECT` self |
| `candidate_form` | Enabled | `SELECT` self |
| `candidate_languages` | Enabled | `SELECT` self |
| `candidate_references` | Enabled | `SELECT` self |
| `candidate_skills` | Enabled | `SELECT` self |
| `education` | Enabled | `SELECT` self |
| `family_and_emergency` | Enabled | `SELECT` self |
| `personal_statement` | Enabled | `SELECT` self |
| `work_history` | Enabled | `SELECT` self |
| `employee_payroll_profile` | Enabled | `SELECT` self |
| `employee_documents` | Enabled | `SELECT` self |
| `candidate_profiles` | Tabel sudah dihapus | Policy lama di-drop sebelum table drop |
| `candidate_status_events` | Tabel sudah dihapus | Policy lama di-drop sebelum table drop |

## Helper Function Yang Dipakai Policy

### `public.current_candidate_account_id()`

Mengembalikan `candidate_accounts.id` milik `auth.uid()`.

### `public.can_access_candidate_account(candidate_account_id uuid)`

True bila account tersebut milik `auth.uid()`.

### `public.candidate_application_owner(candidate_application_id uuid)`

Mencari owner account dari satu aplikasi.

### `public.can_access_candidate_application(candidate_application_id uuid)`

True bila aplikasi milik `auth.uid()`.

### `public.candidate_form_owner(candidate_form_id uuid)`

Mencari owner account dari satu form.

### `public.can_access_candidate_form(candidate_form_id uuid)`

True bila form milik `auth.uid()`.

## Policy SELECT

| Policy | Object | Kondisi |
| --- | --- | --- |
| `candidate_accounts_select_self` | `public.candidate_accounts` | `can_access_candidate_account(id)` |
| `candidate_applications_select_self` | `public.candidate_applications` | `can_access_candidate_account(candidate_account_id)` |
| `candidate_form_select_self` | `public.candidate_form` | `can_access_candidate_account(candidate_account_id)` |
| `candidate_languages_select_self` | `public.candidate_languages` | `can_access_candidate_form(candidate_form_id)` |
| `candidate_references_select_self` | `public.candidate_references` | `can_access_candidate_form(candidate_form_id)` |
| `candidate_skills_select_self` | `public.candidate_skills` | `can_access_candidate_form(candidate_form_id)` |
| `education_select_self` | `public.education` | `can_access_candidate_form(candidate_form_id)` |
| `family_and_emergency_select_self` | `public.family_and_emergency` | `can_access_candidate_form(candidate_form_id)` |
| `personal_statement_select_self` | `public.personal_statement` | `can_access_candidate_form(candidate_form_id)` |
| `work_history_select_self` | `public.work_history` | `can_access_candidate_form(candidate_form_id)` |
| `employee_payroll_profile_select_self` | `public.employee_payroll_profile` | `can_access_candidate_form(candidate_form_id)` |
| `employee_documents_select_self` | `public.employee_documents` | `can_access_candidate_form(candidate_form_id)` |

## Policy INSERT

### Tabel business

Belum ditemukan policy `INSERT` untuk tabel business di repository.

Implikasi:

- Browser tidak diharapkan menulis langsung ke tabel business melalui anon/authenticated client.
- Penulisan tabel dilakukan backend melalui service role.

### Storage object

| Policy | Object | Kondisi |
| --- | --- | --- |
| `candidate_photographs_storage_insert` | `storage.objects` | bucket `candidate-photographs` dan `can_write_candidate_storage_object()` |
| `employee_documents_storage_insert` | `storage.objects` | bucket `candidate-documents` dan `can_write_candidate_storage_object()` |

## Policy UPDATE

### Tabel business

Belum ditemukan policy `UPDATE` untuk tabel business di repository.

### Storage object

| Policy | Object | Kondisi |
| --- | --- | --- |
| `candidate_photographs_storage_update` | `storage.objects` | bucket `candidate-photographs` dan `can_write_candidate_storage_object()` |
| `employee_documents_storage_update` | `storage.objects` | bucket `candidate-documents` dan `can_write_candidate_storage_object()` |

## Policy DELETE

### Tabel business

Belum ditemukan policy `DELETE` untuk tabel business di repository.

### Storage object

Belum ditemukan policy `DELETE` untuk `storage.objects` pada bucket kandidat.

Implikasi:

- UI saat ini memang tidak melakukan delete file fisik dari storage.
- Penghapusan path di form hanya menghapus referensi pada draft/record.

## Storage Ownership Policy

Migration `20260519_061_*` memperketat policy storage dengan dua function:

### `public.can_access_candidate_storage_object(bucket_name, object_path)`

True bila:

- `auth.uid()` ada
- path langsung menunjukkan owner `auth.uid()` pada segmen kedua
- atau path terhubung ke `candidate_form.photograph`
- atau path terhubung ke `employee_documents.file_path`

### `public.can_write_candidate_storage_object(bucket_name, object_path)`

True bila:

- `auth.uid()` ada
- segmen kedua path sama dengan `auth.uid()`
- prefix sesuai bucket:
  - `candidate-photographs` -> `candidate-forms/`
  - `candidate-documents` -> `employee-forms/` atau `candidate-forms/`
