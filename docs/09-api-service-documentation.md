# 09 API Service Documentation

> Last verified against current repository state: 2026-07-13

## Ringkasan Layer

Repository ini memakai pola:

1. UI page memanggil view model/composable
2. View model memanggil helper HTTP backend
3. Route backend memanggil service
4. Service memakai Supabase admin client

## Daftar Composable / ViewModel

| Function | Location | Description |
| --- | --- | --- |
| `useLocale()` | `src/composables/useLocale.ts` | i18n sederhana, format tanggal, switch locale |
| `useAuthViewModel()` | `src/viewmodels/useAuthViewModel.ts` | wrapper `authStore` |
| `useCandidateApplicationFormViewModel()` | `src/viewmodels/useCandidateApplicationFormViewModel.ts` | load/save/submit form lamaran |
| `useDashboardPage()` | `src/features/dashboard/useDashboardPage.ts` | state dashboard |
| `useCandidateApplicationFormPage()` | `src/features/applications/useCandidateApplicationFormPage.ts` | orchestration halaman form lamaran |

## Daftar Service Backend

| Service | Location | Fungsi utama |
| --- | --- | --- |
| `authService` | `server/services/authService.js` | membentuk payload profile terautentikasi |
| `candidateAccountService` | `server/services/candidateAccountService.js` | lifecycle account, application, profile summary, submit form |
| `candidateFormService` | `server/services/candidateFormService.js` | mapping snapshot form, sync child table |
| `candidateSyncService` | `server/services/candidateSyncService.js` | push event ke `hrd_ruang` |
| `internalAuthService` | `server/services/internalAuthService.js` | verifikasi shared token internal |
| `supabaseAdmin` | `server/services/supabaseAdmin.js` | singleton service role client |

## Helper Infrastructure

| Helper | Location | Keterangan |
| --- | --- | --- |
| `callBackendApi()` | `src/infrastructure/http/backendApi.ts` | wrapper fetch + bearer token |
| `defineJsonHandler()` | `server/utils/api.ts` | wrapper route dengan error normalization |
| `requireAuthenticatedUser()` | `server/utils/requestContext.ts` | validasi bearer token ke Supabase |

## Endpoint Aplikasi (`/auth/*`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/auth/profile` | Bearer token | ambil profil kandidat + daftar aplikasi |
| `GET` | `/auth/applications/:applicationId/form` | Bearer token | ambil form lamaran milik user |
| `PATCH` | `/auth/applications/:applicationId/form` | Bearer token | simpan draft form lamaran |
| `POST` | `/auth/applications/:applicationId/submit` | Bearer token | submit form lamaran |

### Function: `buildAuthenticatedProfile()`

Location: `server/services/authService.js`

Description:

- Mengubah summary kandidat menjadi payload profile untuk frontend.

Parameters:

- `context.userId`

Response:

- object user berisi `id`, `candidate_id`, `email`, `role`, `full_name`, `phone`, `employee_code`, `contract_number`, `status`, `applications`

Used by:

- `GET /auth/profile`

Error handling:

- error diangkat dari `getAuthenticatedCandidateProfile()`

### Function: `getAuthenticatedCandidateApplicationForm()`

Location: `server/services/candidateAccountService.js`

Description:

- Memverifikasi kepemilikan aplikasi, memastikan `candidate_form` tersedia, lalu mengembalikan record form yang siap dipakai UI.

Parameters:

- `identityUserId: string`
- `applicationId: string`

Response:

- `CandidateApplicationFormRecord`

Used by:

- `GET /auth/applications/:applicationId/form`

Error handling:

- `404` jika account/aplikasi tidak ditemukan
- `403` jika account inactive

### Function: `saveAuthenticatedCandidateApplicationForm()`

Location: `server/services/candidateAccountService.js`

Description:

- Menormalkan payload draft, update parent `candidate_form`, sinkron tabel child, dan push event progress.
- Sejak fix `78e3739`, sinkron `employee_documents` dari save milik candidate/employee sendiri dibatasi ke `CANDIDATE_EDITABLE_DOCUMENT_TYPES` (semua tipe dokumen employee di luar `format_office`/`skb`/`other`). Implementasi melakukan delete+insert hanya pada tipe dokumen tersebut (`replaceCandidateEditableEmployeeDocuments()`), bukan lagi replace penuh tabel `employee_documents` (`replaceChildTable()`), agar draft save dari browser yang stale tidak menghapus dokumen kontrak yang sudah diupload HR lewat `PATCH /api/internal/candidate-forms/:candidateFormId/employee-documents`.

Parameters:

- `identityUserId: string`
- `applicationId: string`
- `input: object`

Response:

- `CandidateApplicationFormRecord`

Used by:

- `PATCH /auth/applications/:applicationId/form`

Error handling:

- error DB dibungkus `normalizeOperationalError()`

### Function: `submitAuthenticatedCandidateApplicationForm()`

Location: `server/services/candidateAccountService.js`

Description:

- Menandai form selesai dan aplikasi `submitted`, lalu push event sinkronisasi.

Parameters:

- `identityUserId: string`
- `applicationId: string`

Response:

- `CandidateApplicationFormRecord`

Used by:

- `POST /auth/applications/:applicationId/submit`

Error handling:

- `404` bila aplikasi bukan milik user
- `403` bila account inactive
- Catatan: backend submit memanggil `validateFormSubmission()`, tetapi helper itu masih stub dan belum menolak payload yang belum lengkap di server; enforcement field wajib saat ini ada di frontend lewat `canSubmitForm` (lihat docs/10-feature-flow.md dan docs/16-error-handling.md)

## Endpoint Internal (`/api/internal/*`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/internal/candidates` | `x-internal-service-token` | list summary kandidat |
| `POST` | `/api/internal/candidates` | `x-internal-service-token` | create/update kandidat berdasarkan email/account |
| `PUT` | `/api/internal/candidates/:candidateId` | `x-internal-service-token` | update account kandidat |
| `DELETE` | `/api/internal/candidates/:candidateId` | `x-internal-service-token` | revoke kandidat |
| `POST` | `/api/internal/candidates/:candidateId/applications` | `x-internal-service-token` | tambah/update aplikasi kandidat |
| `PATCH` | `/api/internal/candidates/:candidateId/active` | `x-internal-service-token` | aktif/nonaktif akun |
| `POST` | `/api/internal/candidates/:candidateId/reset-password` | `x-internal-service-token` | reset password |
| `GET` | `/api/internal/candidates/:candidateId/summary` | `x-internal-service-token` | ambil summary satu kandidat |
| `GET` | `/api/internal/candidate-forms/:candidateFormId` | `x-internal-service-token` | ambil snapshot form |
| `PATCH` | `/api/internal/candidate-forms/:candidateFormId/employee-documents` | `x-internal-service-token` | append dokumen kontrak employee |
| `POST` | `/api/internal/storage/sign-url` | `x-internal-service-token` | signed URL untuk path storage terverifikasi |

### Endpoint Internal Langsung Tanpa Alias `/api`

Route berikut ditemukan aktif:

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/internal/candidates/:candidateId/switch-to-employee` | `x-internal-service-token` | ubah portal role kandidat menjadi `employee` |

Catatan:

- alias `/api/internal/candidates/:candidateId/switch-to-employee` belum ditemukan di repo
- integrator yang hanya memakai namespace `/api/internal/*` belum bisa mengakses flow ini tanpa penambahan alias

## Kontrak Request / Response Internal

### `POST /api/internal/candidates`

Payload minimal yang ditemukan validasinya:

```json
{
  "email": "candidate@example.com",
  "password": "secret123",
  "full_name": "Candidate Name",
  "erf_id": "ERF-001"
}
```

Field lain yang dipakai service bila tersedia:

- `phone`
- `employee_code`
- `contract_number`
- `status`
- `portal_role`
- `created_by_internal_user_id`
- `job_snapshot`

Response:

```json
{
  "candidate": {
    "candidate_id": "uuid",
    "identity_user_id": "uuid",
    "email": "candidate@example.com",
    "role": "candidate",
    "applications": []
  }
}
```

### `PUT /api/internal/candidates/:candidateId`

Payload opsional:

- `email`
- `full_name`
- `phone`
- `employee_code`
- `contract_number`
- `status`
- `portal_role`
- `created_by_internal_user_id`
- `erf_id`
- `job_snapshot`

Response:

- `{ "candidate": CandidateSummary }`

### `POST /api/internal/candidates/:candidateId/applications`

Payload:

- `erf_id` dibutuhkan untuk create/update aplikasi
- `status`
- `job_snapshot`

Response:

- `{ "candidate": CandidateSummary }`

### `PATCH /api/internal/candidate-forms/:candidateFormId/employee-documents`

Payload:

```json
{
  "document_type": "format_office",
  "file_paths": ["employee-forms/<uid>/format_office/file.pdf"]
}
```

`document_type` yang diterima oleh function append:

- `format_office`
- `skb`
- `other`

### `POST /api/internal/storage/sign-url`

Payload:

```json
{
  "bucket": "candidate-documents",
  "candidate_form_id": "uuid",
  "path": "employee-forms/<uid>/cv/cv-candidate-20260522.pdf"
}
```

Response:

```json
{
  "signed_url": "https://..."
}
```

## Function Mapping Ke Fitur

| Function | Fitur |
| --- | --- |
| `authStore.login()` | login |
| `authStore.changePassword()` | ganti password |
| `useCandidateApplicationFormViewModel.load()` | buka form lamaran |
| `useCandidateApplicationFormViewModel.save()` | save draft |
| `useCandidateApplicationFormViewModel.submit()` | submit |
| `createCandidateAccount()` | provisioning kandidat dari sistem internal |
| `addCandidateApplication()` | tambah aplikasi dari sistem internal |
| `appendCandidateFormEmployeeDocumentsById()` | append dokumen kontrak employee |
| `deliverCandidateEvent()` | sinkronisasi ke `hrd_ruang`, retry sekali pada kegagalan transient (lihat docs/16-error-handling.md) |

## Error Handling API

Pola response error backend:

```json
{
  "ok": false,
  "error": "Human readable message"
}
```

Catatan:

- success response tidak memakai envelope `ok: true`
- auth routes mengembalikan payload object mentah
- sebagian internal route membungkus payload di key `candidate` atau `candidate_form`

## Contoh Penggunaan

### Load profile dari client

```ts
const profile = await callBackendApi("/auth/profile")
```

### Save draft form

```ts
await callBackendApi(`/auth/applications/${applicationId}/form`, {
  method: "PATCH",
  body: JSON.stringify(payload),
})
```

### Internal create candidate

```bash
curl -X POST http://localhost:3000/api/internal/candidates \
  -H 'Content-Type: application/json' \
  -H 'x-internal-service-token: <token>' \
  -d '{"email":"candidate@example.com","password":"secret123","full_name":"Candidate","erf_id":"ERF-001"}'
```
