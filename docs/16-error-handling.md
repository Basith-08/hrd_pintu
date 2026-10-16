# 16 Error Handling

> Last verified against current repository state: 2026-07-13

## Pola Error Handling Yang Ditemukan

## 1. Backend Route Wrapper

File: `server/utils/api.ts`

Pola:

1. semua handler dibungkus `defineJsonHandler()`
2. error diubah menjadi status HTTP
3. error `5xx` di-log dengan `console.error`
4. payload error seragam:

```json
{
  "ok": false,
  "error": "message"
}
```

## 2. HTTP Error Helper

File: `server/lib/errors.js`

Helper `createHttpError(status, message, options)` menambah:

- `error.status`
- `error.expose`

## 3. Frontend HTTP Wrapper

File: `src/infrastructure/http/backendApi.ts`

Pola:

- request ke backend memakai `fetch`
- otomatis menambahkan bearer token jika `auth !== false`
- jika `response.ok === false`, lempar `BackendApiError`

## Error Supabase Auth

Lokasi utama:

- `src/stores/authStore.ts`

Pola yang ditemukan:

- login gagal -> ditampilkan pesan generik terlokalisasi
- logout gagal -> ditampilkan pesan generik terlokalisasi
- current password salah -> pesan khusus
- update password gagal -> pesan khusus

Catatan:

- detail error Supabase Auth tidak selalu diteruskan apa adanya ke user

## Error Supabase Database

Lokasi utama:

- `server/services/candidateAccountService.js`
- `server/services/candidateFormService.js`

Pola:

- error query Supabase diubah menjadi `Error(error.message)`
- sebagian error di-normalisasi oleh `normalizeOperationalError()`

Contoh normalisasi operasional:

- jika error mengindikasikan tabel kandidat belum ada, service melempar `503` dengan pesan menjalankan migration baseline

## Error Supabase Storage

### Frontend upload

Lokasi:

- `src/features/applications/useCandidateApplicationFormPage.ts`

Pola:

- upload foto gagal -> `files.errors.uploadPhotographFailed`
- upload dokumen gagal -> `files.errors.uploadDocumentFailed`

### Backend signed URL internal

Lokasi:

- `server/routes/internal/storage/sign-url.post.ts`

Error yang mungkin:

- `400` bucket/path/form id wajib
- `403` bucket/path tidak diizinkan
- `404` candidate form tidak ditemukan
- `403` path bukan milik candidate form
- `404` signed URL gagal dibuat

## Error File Upload

Validasi client-side yang ditemukan:

| Jenis | Batas | Perilaku |
| --- | --- | --- |
| Foto | `5 MB` | file ditolak sebelum upload |
| Dokumen | `10 MB` | file ditolak sebelum upload |

Catatan:

- tidak ditemukan validasi MIME type tambahan di client selain `accept` input
- enforcement utama MIME type ada di storage bucket config

## Error CSV Import

Status: Belum ditemukan di implementasi saat ini.

## Error DOCX Processing

Status: Belum ditemukan sebagai flow DOCX processing backend.

Yang ditemukan hanya:

- pembukaan preview HTML dokumen employee tertentu
- asset statis `SKB.docx`

## Error Validasi Form

### Yang ada

- validasi password di profile
- validasi ukuran file di client
- helper validasi submit form kandidat/employee di `candidateAccountService.js`

### Risiko penting

Helper validasi submit berikut ditemukan tetapi belum dipakai oleh flow submit aktif:

- `validateSharedFormSubmissionRequirements()`
- `validateEmployeePayrollSubmissionRequirements()`
- `hasRequiredEmployeeSubmissionFields()`
- `hasRequiredEmployeeSubmissionDocuments()`

Fungsi yang benar-benar dipanggil saat submit:

```js
function validateFormSubmission(draftData) {
  return draftData
}
```

Implikasi:

- request submit yang dikirim langsung ke backend (tanpa lewat UI) tidak mendapat enforcement server-side atas field wajib yang diharapkan oleh helper-helper tersebut
- di sisi frontend, `canSubmitForm` pada `useCandidateApplicationFormPage.ts` tidak lagi selalu `true`: sejak ditambahkannya validasi field wajib (data pribadi, kontak, kontak darurat, pendidikan formal, riwayat kerja pertama, minimum 2 referensi lengkap via `hasMinimumReferences`, mobilitas/domisili, gaji yang diharapkan, dokumen wajib), tombol submit memang dicegah aktif sampai semua kondisi tersebut terpenuhi
- risiko utama jadi mengecil ke skenario bypass UI (memanggil endpoint submit secara langsung), bukan lagi submit normal lewat form

## Error Network

### Sinkronisasi event

File: `server/services/candidateSyncService.js`

Pola:

- timeout 4 detik per attempt (sebelumnya 5 detik)
- maksimal 2 attempt (`CANDIDATE_SYNC_MAX_ATTEMPTS = 2`), retry kedua setelah delay 500ms
- attempt di-retry hanya bila `retryable: true`: timeout, network error, HTTP `5xx`, atau HTTP `429`
- kegagalan non-retryable (mis. `4xx` selain `429`) langsung berhenti tanpa retry
- `AbortError` -> reason `timeout` (retryable)
- response non-OK -> `http_<status>` (retryable bila `>= 500` atau `429`)
- network error -> `network_error` (retryable)

Jika seluruh attempt gagal, service mencatat tiap retry via `console.error` lalu mengembalikan `{ delivered: false, reason }` tanpa membatalkan operasi utama (save/submit draft tetap dianggap sukses).

### Backend request dari client

Jika `supabase.auth.getSession()` gagal:

- frontend melempar error request gagal

## Format Pesan Error Ke User

Frontend umumnya menampilkan:

- pesan translasi generik
- atau pesan dari error yang sudah dinormalisasi

Contoh tampilan:

- login error di halaman login
- toast sukses di profile/form
- error global di atas form lamaran

## Logging Error

Yang ditemukan:

- `console.error` di client untuk auth init failure
- `console.error` di server untuk `5xx`
- `console.error` untuk kegagalan sinkronisasi event

Belum ditemukan:

- logger terpusat
- observability platform integration
- audit log table
