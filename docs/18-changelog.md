# 18 Changelog

> Last verified against current repository state: 2026-07-13

## Format Changelog

Dokumen ini memakai format sederhana:

- `Added`
- `Changed`
- `Fixed`
- `Security`

Contoh struktur:

```md
## [version] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Security
- ...
```

## Versi Dokumentasi

## [1.0.6] - 2026-07-13

### Added

- guide card Haermes di dashboard (`ApplicationDocumentsSection.vue`) kini menampilkan catatan login: User ID (`employee_code`) dan default password `1234`
- catatan tambahan pada kartu dokumen `integrity_pact` bahwa dokumen wajib dicetak dan ditempel materai setelah diisi
- retry sekali untuk `deliverCandidateEvent()` pada kegagalan transient (timeout/network error/HTTP 5xx/429), total maksimal 2 attempt dengan delay 500ms

### Changed

- sinkronisasi `employee_documents` dari save form milik candidate/employee sendiri kini dibatasi ke tipe dokumen yang boleh diedit candidate (`CANDIDATE_EDITABLE_DOCUMENT_TYPES`), tidak lagi replace penuh tabel — mencegah save draft yang stale menimpa dokumen kontrak (`format_office`/`skb`/`other`) yang sudah diupload HR
- timeout `deliverCandidateEvent()` diturunkan dari 5 detik menjadi 4 detik per attempt
- urutan `integrity_pact` dan `email_usage_policy` di `employeeDocumentTypes` dipindah ke setelah `bank_account_book`

### Fixed

- konstanta `CANDIDATE_ACTIVE_DAYS` berubah dari `365` menjadi `60` (bawaan commit `f3d2f3d`, tidak disebutkan di pesan commit) — periode auto-deactivate akun candidate saat ini efektif **60 hari**, bukan 12 bulan. **Perlu dikonfirmasi ke tim** apakah ini disengaja, karena `hrd_ruang` masih memakai `365` sehingga kedua aplikasi tidak konsisten.

## [1.0.5] - 2026-07-06

### Added

- restore automatic deactivation logic untuk candidate accounts dengan periode 12 bulan (dari periode sebelumnya 3 hari)
- automatic password update di Supabase auth saat re-create candidate account dengan email yang sudah ada
- error handling jika password update gagal saat re-creation

### Changed

- periode auto-deactivate candidate account diperpanjang dari 3 hari menjadi 12 bulan (365 hari)
- konstanta `CANDIDATE_ACTIVE_DAYS` diubah dari 3 menjadi 365
- saat create candidate dengan email duplikat, password Supabase auth user kini di-update otomatis agar login tidak gagal

### Fixed

- bug di mana re-creation candidate account dengan email yang sama gagal login karena password Supabase auth tidak di-update (hanya database account yang di-update)
- candidate tidak bisa login dengan password baru jika email pernah di-register sebelumnya

### Notes

- auto-deactivation dihitung dari `activated_at` atau `created_at`
- periode 12 bulan memberikan fleksibilitas lebih bagi candidate untuk menyelesaikan proses recruitment
- deactivation tetap dapat dilakukan manual kapan saja melalui admin panel dengan `setUserActiveStatus()`
- timer dan countdown kembali ditampilkan di frontend untuk inform candidate tentang sisa waktu akses

## [1.0.4] - 2026-07-06

### Added

- automatic password update di Supabase auth saat re-create candidate account dengan email yang sudah ada
- error handling jika password update gagal saat re-creation

### Changed

- mekanisme deactivasi akun candidate berubah dari otomatis (3 hari) menjadi manual saja
- fungsi `expireCandidateAccountIfNeeded()` dihapus dari backend; tidak ada lagi automatic status update ke "inactive"
- konstanta `CANDIDATE_ACTIVE_DAYS` dan perhitungan expiry time dihapus
- deactivasi akun candidate kini hanya dilakukan manual dari hrd_ruang melalui admin panel
- saat create candidate dengan email duplikat, password Supabase auth user kini di-update otomatis agar login tidak gagal

### Fixed

- bug di mana re-creation candidate account dengan email yang sama gagal login karena password Supabase auth tidak di-update (hanya database account yang di-update)
- candidate tidak bisa login dengan password baru jika email pernah di-register sebelumnya

### Removed

- logic automatic expiry setelah 3 hari untuk candidate accounts
- timer dan countdown di frontend yang menampilkan sisa waktu akses
- action "Info Deactivated" dari user management menu (tidak lagi relevan)
- modal yang menampilkan access expiry information
- utility functions di `candidateAccess.ts`: `getCandidateAccessExpiryTime()`, `getCandidateAccessRemainingDays()`, `getCandidateAccessStartTime()`, `getCandidateAccessRemainingMs()`, `CANDIDATE_ACTIVE_DAYS`

### Notes

- perubahan ini mempermudah manajemen candidate account karena tidak perlu reset countdown dengan re-activation
- deactivation tetap dapat dilakukan manual kapan saja melalui admin panel dengan `setUserActiveStatus()`
- fix ini memastikan candidate baru dengan email duplikat bisa login langsung tanpa perlu reset password

## [1.0.3] - 2026-06-23

### Added

- catatan validasi minimum 2 referensi lengkap dan field wajib (`requiredLabel()`, `hasMinimumReferences`) di dokumentasi flow form dan komponen

### Changed

- penjelasan status validasi submit diperjelas: `canSubmitForm` di frontend kini benar-benar memvalidasi field wajib sebelum submit aktif; backend (`validateFormSubmission`) tetap stub tanpa enforcement server-side
- dokumentasi policy `UPDATE` storage object diperjelas menggunakan `can_write_candidate_storage_object()`, bukan sekadar kepemilikan `auth.uid()`
- struktur folder diperbarui mengikuti penghapusan `src/public/` dan kekosongan `public/templates/` sejak `SKB.docx` dihapus (commit `e8d4e4c`)
- referensi dokumen `18-user-manual.md` dan `19-changelog.md` di `README.md` dan `docs/04-folder-structure.md` diganti menjadi `18-changelog.md` mengikuti penggabungan/renumbering dokumen

### Fixed

- header dokumen ini sendiri masih menyebut "19 Changelog" walau file sudah berganti nama menjadi `18-changelog.md`; diperbaiki menjadi "18 Changelog"
- referensi `src/public/templates/SKB.docx` yang sudah tidak ada di repo dibersihkan dari `docs/10-feature-flow.md`

### Security

- tidak ada perubahan mekanisme keamanan; dokumentasi hanya diselaraskan dengan validasi submit dan storage policy yang sudah berjalan

## [1.0.2] - 2026-06-12

### Added

- penjelasan eksplisit bahwa route `switch-to-employee` aktif di `/internal/*` tanpa alias `/api/internal/*`

### Changed

- dokumentasi halaman form diperbarui sesuai implementasi wizard multi-step, overlay busy, dan toast sukses
- user manual diperjelas bahwa preview dokumen employee membuka HTML window, bukan download file final
- dokumentasi environment diperjelas bahwa `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` hanya fallback config

### Fixed

- wording lama yang menyebut route `switch-to-employee` masih perlu dikonfirmasi diganti dengan status aktual
- catatan submit diperjelas: validator memang dipanggil, tetapi implementasinya masih stub

### Security

- tidak ada perubahan mekanisme keamanan; dokumentasi hanya diselaraskan dengan perilaku route dan runtime config saat ini

## [1.0.1] - 2026-05-29

### Added

- penanda verifikasi tanggal di seluruh file `docs/`

### Changed

- dokumen legacy ditandai eksplisit sebagai referensi historis
- wording requirement yang belum diimplementasikan diperjelas agar tidak terbaca sebagai kontrak aktif repo

### Fixed

- referensi file schema lama `sql/migration/database.sql` diganti ke sumber yang masih ada
- user manual diperjelas bahwa bantuan akses ditangani tim internal/HRD

### Security

- tidak ada perubahan mekanisme keamanan; dokumentasi hanya diselaraskan dengan implementasi saat ini

## [1.0.0] - 2026-05-22

### Added

- README utama berbasis implementasi aktual repo
- dokumentasi arsitektur aplikasi kandidat
- dokumentasi folder structure aktual
- dokumentasi database, ERD, auth, RLS, API/service
- dokumentasi flow fitur, UI pages, komponen, environment
- panduan deployment, testing, error handling, maintenance, dan user manual

### Changed

- dokumentasi dipusatkan ke struktur `docs/01` sampai `docs/19`
- informasi lama di README diringkas dan diarahkan ke dokumen teknis baru

### Fixed

- penandaan eksplisit untuk fitur yang tidak ditemukan di implementasi saat ini
- penjelasan scope repo sebagai portal kandidat, bukan sistem admin penuh

### Security

- pencatatan penggunaan service role hanya di server
- pencatatan RLS dan storage policy yang ditemukan
- pencatatan risiko validasi submit yang belum terhubung

## Template Untuk Release Berikutnya

```md
## [1.0.3] - YYYY-MM-DD

### Added
- 

### Changed
- 

### Fixed
- 

### Security
- 
```

## Catatan Release Dokumen Berikutnya

Saat memperbarui changelog, cek minimal:

1. apakah ada migration database baru
2. apakah ada endpoint baru/berubah
3. apakah ada perubahan storage policy
4. apakah fitur yang sebelumnya `Belum ditemukan` sudah benar-benar diimplementasikan
