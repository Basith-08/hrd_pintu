# HRD Pintu

Portal kandidat berbasis Nuxt untuk login kandidat/employee, melihat daftar aplikasi, mengisi form lamaran, mengunggah foto dan dokumen pendukung, serta menjalankan sinkronisasi event ke `hrd_ruang`.

Dokumentasi ini mengikuti implementasi aktual di repository `hrd_pintu`. Fitur seperti `CSV import`, `upload DOCX template`, `placeholder DOCX detection`, `export configuration`, dan modul admin UI kandidat tidak ditemukan sebagai implementasi aktif di repo ini dan ditandai eksplisit pada dokumen terkait.

## Tech Stack

- Nuxt 4 (`ssr: false`)
- TypeScript
- Vue 3
- Pinia
- Supabase Auth
- Supabase Storage
- Supabase PostgreSQL
- Supabase Row Level Security
- Vercel deployment config

## Fitur Utama Yang Ditemukan

- Login kandidat/employee dengan Supabase Auth
- Middleware proteksi route berbasis session
- Dashboard kandidat/employee
- Halaman profil untuk ganti password
- Form lamaran kandidat dengan penyimpanan draft
- Form payroll employee
- Upload foto kandidat ke Supabase Storage
- Upload dokumen kandidat/employee ke Supabase Storage
- Download/generate dokumen employee tertentu dalam bentuk preview HTML (`integrity_pact`, `email_usage_policy`)
- Internal API untuk create/update/revoke kandidat dari sistem lain
- Sinkronisasi event kandidat ke `hrd_ruang`

## Fitur Yang Belum Ditemukan Di Repository

- Import CSV
- Upload template DOCX dari UI
- Deteksi placeholder DOCX
- Export Configuration
- UI manajemen user/admin di aplikasi ini
- Audit log table khusus
- Otomasi unit/integration/E2E test

## Struktur Folder Ringkas

```text
.
├── docs/                 # dokumentasi teknis
├── lang/                 # kamus translasi EN/ID
├── public/templates/     # aset template publik yang tersalin dari src/public/templates
├── scripts/              # utilitas build-time
├── server/               # route, service, middleware, util backend
├── sql/migration/        # source of truth migrasi database/storage/RLS
├── src/
│   ├── components/       # reusable UI components
│   ├── composables/      # composable lintas fitur
│   ├── domain/           # entity dan type form
│   ├── features/         # page feature modules
│   ├── infrastructure/   # http, runtime config, supabase client
│   ├── layouts/          # layout Nuxt
│   ├── middleware/       # route middleware client
│   ├── pages/            # route pages
│   ├── plugins/          # plugin init auth
│   ├── public/           # source asset template
│   ├── stores/           # Pinia store
│   └── viewmodels/       # view model wrapper store/API
├── nuxt.config.ts
├── package.json
└── vercel.json
```

## Instalasi

Prasyarat:

- Node.js `^20.19.0 || >=22.12.0`
- `pnpm@10.32.1` atau versi kompatibel
- Project Supabase yang sudah dikonfigurasi

Command:

```bash
cd <project-root>
pnpm install
```

## Menjalankan Development

```bash
pnpm dev
```

Catatan:

- Script `sync:templates` akan menyalin isi `src/public/templates/` ke `public/templates/` sebelum `dev`, `build`, dan `type-check`.
- Aplikasi berjalan sebagai SPA (`ssr: false`), tetapi tetap memiliki route backend di `server/`.

## Build Production

```bash
pnpm build
pnpm preview
```

## Environment Variable

| Variable | Scope | Keterangan |
| --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | public | URL project Supabase kandidat |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | public | anon key untuk browser client |
| `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET` | public | bucket foto kandidat, default `candidate-photographs` |
| `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET` | public | bucket dokumen kandidat/employee, default `candidate-documents` |
| `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` | public | fallback config bucket employee; tidak ditemukan penggunaan aktif di source runtime saat ini |
| `SUPABASE_SERVICE_ROLE_KEY` | private | service role untuk route/service backend |
| `INTERNAL_SERVICE_TOKEN` | private | token header `x-internal-service-token` untuk internal API |
| `HRD_PINTU_SYNC_BASE_URL` | private | base URL push event ke `hrd_ruang` |
| `HRD_PINTU_SYNC_TOKEN` | private | token header `x-hrd-pintu-sync-token` saat push event |

Contoh file: [.env.example](.env.example)

### `INTERNAL_SERVICE_TOKEN` dan `HRD_PINTU_SYNC_TOKEN`

Kedua variable ini adalah shared secret untuk komunikasi server-to-server dengan `hrd_ruang`, masing-masing untuk arah yang berbeda:

| Variable | Arah | Header | Dipakai di |
| --- | --- | --- | --- |
| `INTERNAL_SERVICE_TOKEN` | Incoming — `hrd_ruang` → `hrd_pintu` | `x-internal-service-token` | [server/services/internalAuthService.js](server/services/internalAuthService.js) |
| `HRD_PINTU_SYNC_TOKEN` | Outgoing — `hrd_pintu` → `hrd_ruang` | `x-hrd-pintu-sync-token` | [server/services/candidateSyncService.js](server/services/candidateSyncService.js) |

- **`INTERNAL_SERVICE_TOKEN`** dipakai untuk memverifikasi request masuk ke internal API (`/api/internal/*`) yang dikirim oleh `hrd_ruang`. Nilainya harus sama dengan `HRD_PINTU_SERVICE_INTERNAL_TOKEN` di `.env` milik `hrd_ruang`. Token kosong atau tidak cocok akan ditolak dengan `401`.
- **`HRD_PINTU_SYNC_TOKEN`** dikirim oleh `hrd_pintu` sebagai header `x-hrd-pintu-sync-token` saat push event sinkronisasi (status aplikasi/ERF) ke `hrd_ruang`, ke alamat yang diatur lewat `HRD_PINTU_SYNC_BASE_URL`. Nilainya harus sama dengan `HRD_PINTU_SERVICE_SYNC_TOKEN` di `.env` milik `hrd_ruang`.

Jangan gunakan nilai yang sama untuk `INTERNAL_SERVICE_TOKEN` dan `HRD_PINTU_SYNC_TOKEN` — perlakukan sebagai dua secret independen, dan pastikan rotasi salah satunya diikuti update pada variable pasangannya di sisi `hrd_ruang` (`HRD_PINTU_SERVICE_INTERNAL_TOKEN` / `HRD_PINTU_SERVICE_SYNC_TOKEN`).

#### Cara Generate Token

Generate random string sebagai secret, lalu salin nilai yang sama ke kedua sisi (`hrd_pintu` dan `hrd_ruang`):

```bash
# generate INTERNAL_SERVICE_TOKEN, lalu salin hasilnya ke HRD_PINTU_SERVICE_INTERNAL_TOKEN di hrd_ruang
openssl rand -hex 32

# generate HRD_PINTU_SYNC_TOKEN, lalu salin hasilnya ke HRD_PINTU_SERVICE_SYNC_TOKEN di hrd_ruang
openssl rand -hex 32
```

Jalankan dua kali secara terpisah supaya nilai `INTERNAL_SERVICE_TOKEN` dan `HRD_PINTU_SYNC_TOKEN` tidak sama. Tanpa `openssl`, alternatif Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Setelah digenerate, isi ke `.env` (atau environment variable di platform deploy) pada kedua aplikasi, lalu restart/redeploy keduanya agar token baru terbaca.

## Deploy

Konfigurasi deploy yang ditemukan:

- [vercel.json](vercel.json)
- `installCommand`: `pnpm install --frozen-lockfile`
- `buildCommand`: `pnpm build`

Langkah minimum:

```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm build
```

Detail deploy ada di [docs/14-deployment.md](docs/14-deployment.md).

## Dokumentasi

- [01 Project Overview](docs/01-project-overview.md)
- [02 System Requirement](docs/02-system-requirement.md)
- [03 System Architecture](docs/03-system-architecture.md)
- [04 Folder Structure](docs/04-folder-structure.md)
- [05 Database Documentation](docs/05-database-documentation.md)
- [06 ERD](docs/06-erd.md)
- [07 Auth Authorization](docs/07-auth-authorization.md)
- [08 Supabase RLS Policy](docs/08-supabase-rls-policy.md)
- [09 API Service Documentation](docs/09-api-service-documentation.md)
- [10 Feature Flow](docs/10-feature-flow.md)
- [11 UI Pages Documentation](docs/11-ui-pages-documentation.md)
- [12 Component Documentation](docs/12-component-documentation.md)
- [13 Environment](docs/13-environment.md)
- [14 Deployment](docs/14-deployment.md)
- [15 Testing](docs/15-testing.md)
- [16 Error Handling](docs/16-error-handling.md)
- [17 Maintenance Guide](docs/17-maintenance-guide.md)
- [18 Changelog](docs/18-changelog.md)

Dokumen lama yang masih relevan sebagai lampiran historis:

- [docs/HOW_TO_SETUP_SUPABASE_HRD_PINTU.md](docs/HOW_TO_SETUP_SUPABASE_HRD_PINTU.md)
- [docs/HOW_TO_DEPLOY_HRD_PINTU_VERCEL.md](docs/HOW_TO_DEPLOY_HRD_PINTU_VERCEL.md)
- [docs/SUPABASE_HRD_PINTU.md](docs/SUPABASE_HRD_PINTU.md)

## Catatan Keamanan

- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai di server; tidak ditemukan penggunaan client-side di source saat ini.
- Semua route sensitif mendapat header keamanan tambahan dari `server/middleware/00-security.ts`.
- Route auth aplikasi memverifikasi `Bearer access token` ke Supabase Admin sebelum membaca data domain.
- Internal API memakai shared secret `x-internal-service-token`.
- Storage bucket bersifat private dan policy write dibatasi oleh prefix path + `auth.uid()`.
- RLS tabel business yang ditemukan hanya mencakup `SELECT`; operasi tulis database dilakukan melalui service role di backend.
- Implementasi validasi submit form belum dikaitkan ke flow submit saat ini. Helper validasi ada di service, tetapi fungsi yang dipanggil submit masih stub. Lihat [docs/16-error-handling.md](docs/16-error-handling.md).
