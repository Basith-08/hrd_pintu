# 15 Testing

> Last verified against current repository state: 2026-06-23

## Strategi Testing Berdasarkan Project Yang Ada

Strategi testing aktual yang realistis untuk repo ini:

1. verifikasi manual flow login, dashboard, profil, form, dan upload
2. verifikasi internal API utama dengan `curl` atau client integrator
3. verifikasi storage policy dan RLS di environment Supabase

## Otomasi Test Yang Ditemukan

| Jenis | Status |
| --- | --- |
| Unit test | Belum ditemukan di repository |
| Integration test | Belum ditemukan di repository |
| E2E test | Belum ditemukan di repository |
| Test runner dependency (`vitest`, `jest`, `playwright`, `cypress`) | Belum ditemukan di `package.json` |

## Command Validasi Teknis Minimum

```bash
pnpm type-check
pnpm build
```

## Manual Test Case

| ID | Area | Langkah uji | Expected result |
| --- | --- | --- | --- |
| TC-001 | Login | buka `/login`, masukkan kredensial valid | redirect ke `/dashboard` |
| TC-002 | Login invalid | masukkan password salah | pesan error login tampil |
| TC-003 | Route guard | buka `/dashboard` tanpa login | redirect ke `/login` |
| TC-004 | Logout | klik logout dari dashboard | session keluar dan redirect ke `/login` |
| TC-005 | Dashboard empty | login user tanpa aplikasi | empty state aplikasi tampil |
| TC-006 | Buka form | buka `/applications/:id/form` milik sendiri | form termuat |
| TC-007 | Save draft | ubah beberapa field lalu klik save | sukses, data persist saat reload |
| TC-008 | Upload foto valid | pilih gambar < 5 MB lalu save | path foto tersimpan dan preview tampil |
| TC-009 | Upload foto oversized | pilih gambar > 5 MB | pesan error ukuran tampil |
| TC-010 | Upload dokumen valid | pilih PDF/gambar < 10 MB lalu save | path dokumen tersimpan |
| TC-011 | Upload dokumen oversized | pilih file > 10 MB | pesan error ukuran tampil |
| TC-012 | Submit form | klik submit | aplikasi menjadi `submitted`, status selesai tampil |
| TC-013 | Profile password | ganti password valid | muncul toast sukses |
| TC-014 | Password invalid | current password salah | pesan error tampil |
| TC-015 | Internal create candidate | panggil `POST /api/internal/candidates` | candidate summary terbentuk |
| TC-016 | Internal add application | panggil `POST /api/internal/candidates/:id/applications` | aplikasi baru muncul |
| TC-017 | Internal signed URL | panggil `POST /api/internal/storage/sign-url` dengan path valid | signed URL kembali |
| TC-018 | Event sync | lakukan save/submit/create candidate | target workspace menerima event atau log error sinkron terlihat |

## Test Case CRUD / Lifecycle

### Candidate account

1. create candidate baru
2. update email / full name / role
3. active -> inactive
4. revoke account
5. reset password

### Application form

1. load form baru
2. save draft tanpa file
3. save draft dengan foto
4. save draft dengan dokumen
5. submit aplikasi

## Test Case Login

| Skenario | Expected result |
| --- | --- |
| user valid aktif | login sukses |
| user valid tetapi account inactive | sign out otomatis dan pesan akun tidak aktif |
| user tanpa session | user null |

## Test Case RLS / Auth

| Skenario | Expected result |
| --- | --- |
| user A mengakses aplikasi milik user B lewat `/auth/applications/:id/form` | `404` |
| internal API tanpa token | `401` |
| signed URL internal untuk path yang bukan milik candidate form | `403` |
| upload storage ke path dengan owner ID user lain | ditolak oleh policy storage |

## Test Case Import CSV

Status: Belum ditemukan di implementasi saat ini.

## Test Case Upload DOCX

Status: Belum ditemukan sebagai upload template DOCX.

Yang bisa diuji saat ini:

- keberadaan asset statis `SKB.docx` di `public/templates/`

## Test Case Mapping Placeholder

Status: Belum ditemukan di implementasi saat ini.

## Test Case Generate Dokumen

| Skenario | Expected result |
| --- | --- |
| employee klik dokumen `integrity_pact` | jendela baru preview HTML terbuka |
| employee klik dokumen `email_usage_policy` | jendela baru preview HTML terbuka |

## Temuan Risiko Testing

1. Validasi submit field wajib belum terhubung ke submit aktif, sehingga test submit harus memeriksa perilaku aktual, bukan asumsi requirement bisnis.
2. Tidak ada test otomatis untuk policy storage dan expiry account 3 hari.

## Template Bug Report

```md
## Ringkasan

## Environment
- Branch:
- URL:
- Role user:

## Langkah Reproduksi
1.
2.
3.

## Hasil Aktual

## Hasil Yang Diharapkan

## Bukti
- Screenshot:
- Request/response:
- Log:

## Dampak
```
