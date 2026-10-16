# 02 System Requirement

> Last verified against current repository state: 2026-06-23

## Functional Requirement

| ID | Requirement | Status Implementasi |
| --- | --- | --- |
| FR-001 | Sistem harus menyediakan login email dan password untuk kandidat/employee melalui Supabase Auth. | Ditemukan |
| FR-002 | Sistem harus melindungi route non-public dan mengarahkan user belum login ke `/login`. | Ditemukan |
| FR-003 | Sistem harus menampilkan dashboard berisi profil singkat dan daftar aplikasi user. | Ditemukan |
| FR-004 | Sistem harus menyediakan halaman profil untuk logout dan ganti password. | Ditemukan |
| FR-005 | Sistem harus menyediakan form lamaran kandidat berdasarkan `applicationId`. | Ditemukan |
| FR-006 | Sistem harus membuat `candidate_form` otomatis saat form lamaran pertama kali diakses. | Ditemukan |
| FR-007 | Sistem harus menyalin snapshot form terakhir kandidat saat membuat form untuk aplikasi baru. | Ditemukan |
| FR-008 | Sistem harus menyimpan draft form lamaran melalui endpoint backend. | Ditemukan |
| FR-009 | Sistem harus mengubah status aplikasi menjadi `submitted` saat submit form. | Ditemukan |
| FR-010 | Sistem harus mengunggah foto kandidat ke Supabase Storage bucket private. | Ditemukan |
| FR-011 | Sistem harus mengunggah dokumen kandidat/employee ke Supabase Storage bucket private. | Ditemukan |
| FR-012 | Sistem harus menyediakan preview/generate dokumen employee untuk `integrity_pact` dan `email_usage_policy`. | Ditemukan |
| FR-013 | Sistem harus menyediakan internal API untuk create/update/list/revoke candidate account. | Ditemukan |
| FR-014 | Sistem harus menyediakan internal API untuk menambah aplikasi kandidat. | Ditemukan |
| FR-015 | Sistem harus menyediakan internal API untuk reset password kandidat. | Ditemukan |
| FR-016 | Sistem harus menyediakan internal API untuk mengaktifkan/menonaktifkan akun kandidat. | Ditemukan |
| FR-017 | Sistem harus mengirim event sinkronisasi ke `hrd_ruang` setelah perubahan domain penting. | Ditemukan |
| FR-018 | Sistem harus menyediakan signed URL untuk file storage yang dimiliki candidate form. | Ditemukan |
| FR-019 | Sistem harus mendukung import CSV. | Tidak ditemukan; jangan dianggap kontrak aktif repo ini |
| FR-020 | Sistem harus menyediakan upload template DOCX. | Tidak ditemukan; jangan dianggap kontrak aktif repo ini |
| FR-021 | Sistem harus mendeteksi placeholder DOCX. | Tidak ditemukan; jangan dianggap kontrak aktif repo ini |
| FR-022 | Sistem harus menyediakan Export Configuration. | Tidak ditemukan; jangan dianggap kontrak aktif repo ini |
| FR-023 | Sistem harus menyediakan manual field mapping untuk export. | Tidak ditemukan; jangan dianggap kontrak aktif repo ini |
| FR-024 | Sistem harus menyediakan audit log terstruktur. | Tidak ditemukan; jangan dianggap kontrak aktif repo ini |

Catatan:

- FR-019 sampai FR-024 dipertahankan di dokumen ini hanya sebagai gap list, bukan capability yang bisa diasumsikan tersedia

## Non-Functional Requirement

| ID | Requirement | Dasar Implementasi |
| --- | --- | --- |
| NFR-001 | Aplikasi harus berjalan pada Node.js `^20.19.0 || >=22.12.0`. | `package.json` |
| NFR-002 | Aplikasi harus dibangun dengan `pnpm`. | `packageManager`, `pnpm-lock.yaml`, `vercel.json` |
| NFR-003 | Frontend berjalan sebagai SPA tanpa SSR. | `nuxt.config.ts -> ssr: false` |
| NFR-004 | Runtime public config harus dapat dibaca dari Nuxt runtime config atau fallback env. | `src/infrastructure/runtime/publicConfig.ts` |
| NFR-005 | Route sensitif harus mengirim header keamanan dan `Cache-Control: no-store`. | `server/utils/httpSecurity.ts` |
| NFR-006 | Data business write harus dilakukan lewat backend service role, bukan langsung ke tabel dari client. | `server/services/supabaseAdmin.js`, route backend |
| NFR-007 | Storage bucket harus private dan dibatasi ukuran file. | migration `20260407_010_*` |
| NFR-008 | Bahasa UI harus mendukung `en` dan `id`. | `src/composables/useLocale.ts`, `lang/*.json` |
| NFR-009 | Endpoint internal harus memakai shared secret header. | `server/services/internalAuthService.js` |
| NFR-010 | Dokumentasi build/deploy harus mengikuti Vercel config yang ada. | `vercel.json` |

## Business Rules

1. `candidate_accounts.status` hanya boleh `active`, `inactive`, atau `revoked`.
2. `candidate_accounts.portal_role` hanya boleh `candidate` atau `employee`.
3. Kandidat dengan role `candidate` otomatis kedaluwarsa setelah 3 hari dari `activated_at` atau `created_at` jika masih `active`.
4. User tidak boleh mengakses aplikasi yang bukan miliknya; backend membandingkan `candidate_account_id` dengan account hasil auth.
5. Satu `candidate_applications` hanya memiliki satu `candidate_form`.
6. `candidate_applications` unik per kombinasi `(candidate_account_id, erf_id)`.
7. Foto kandidat disimpan di `candidate-photographs/candidate-forms/<auth.uid()>/...`.
8. Dokumen kandidat/employee disimpan di `candidate-documents/employee-forms/<auth.uid()>/...`.
9. Update profil domain kandidat lewat endpoint backend sudah tidak didukung; halaman profil hanya mengganti password di Supabase Auth.
10. `integrity_pact` dan `email_usage_policy` digenerate di browser sebagai preview HTML, bukan hasil pemrosesan DOCX.

## Acceptance Criteria Berdasarkan Implementasi Saat Ini

1. User yang belum login membuka `/dashboard`, `/profile`, atau `/applications/:id/form` akan diarahkan ke `/login`.
2. User login yang membuka `/login` akan diarahkan ke `/dashboard`.
3. Internal call tanpa `x-internal-service-token` yang benar akan mendapat `401`.
4. Akses `/auth/profile` memerlukan `Authorization: Bearer <access_token>` yang valid.
5. Menyimpan draft form akan memperbarui `candidate_form` dan tabel child terkait.
6. Submit form akan menandai `candidate_form.completion_status = completed` dan `candidate_applications.status = submitted`.
7. Upload foto di atas `5 MB` akan ditolak di client.
8. Upload dokumen di atas `10 MB` akan ditolak di client.
9. Preview foto memerlukan signed URL storage.

Catatan penting:

- Helper validasi submit form memang ada di `server/services/candidateAccountService.js`, tetapi fungsi yang dipakai submit saat ini belum memanggil validasi tersebut. Jadi acceptance criteria implementasi aktual tidak mencakup enforcement wajib isi field sebelum submit. Ini adalah risiko implementasi, bukan tujuan desain.

## Asumsi Sistem

1. `hrd_ruang` atau sistem internal lain bertanggung jawab membuat akun kandidat pertama kali.
2. Migrasi database dijalankan manual di Supabase SQL Editor.
3. Route internal dipanggil oleh service terpercaya yang memegang shared secret.
4. Semua operasi tulis database dilakukan oleh backend dengan service role, bukan oleh browser.

## Dependensi Eksternal

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Vercel
- Browser API:
  - `window.open`
  - `URL.createObjectURL`
  - `localStorage`
