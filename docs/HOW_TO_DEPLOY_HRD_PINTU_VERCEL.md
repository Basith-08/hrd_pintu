# Deployment `hrd_pintu` ke Vercel

> Historical reference. Verified against current repository state: 2026-05-29. Gunakan [14 Deployment](14-deployment.md) sebagai panduan operasional utama.

Dokumen ini menjelaskan alur deploy `hrd_pintu` ke Vercel dengan cara yang paling aman dan paling mudah dirawat:

1. code ada di GitHub
2. Vercel dihubungkan ke GitHub
3. repository di-import sebagai project Vercel
4. environment variable diisi
5. preview deploy jalan otomatis dari branch
6. production deploy jalan dari branch production atau manual CLI bila perlu

Dokumen ini sengaja ditulis lengkap, mulai dari login Vercel sampai aplikasi live.

## Ringkasan Stack Project

Repo saat ini memakai:

- Nuxt `^4.4.2`
- `pnpm@10.32.1`
- Node `^20.19.0 || >=22.12.0`
- `vercel.json`:
  - `installCommand`: `pnpm install --frozen-lockfile`
  - `buildCommand`: `pnpm build`

Catatan penting:

- `ssr: false`, jadi app ini berjalan sebagai frontend client-side.
- Project ini tetap punya server-side code untuk kebutuhan internal API / service logic.
- Semua env dengan prefix `NUXT_PUBLIC_` akan ikut terbaca di browser. Jangan isi secret sensitif di sana.
- Jangan commit `.env`, `.env.local`, atau folder `.vercel`.

## Deploy

Pada project ini:

- Vercel connect ke GitHub
- preview deployment otomatis setiap push ke branch non-production
- production deployment otomatis saat merge ke branch production
- CLI dipakai untuk:
  - `vercel login`
  - `vercel link`
  - `vercel env pull .env.local`
  - cek logs
  - deploy manual kalau dibutuhkan

Dengan pola ini, deploy berikutnya jauh lebih sederhana:

1. push branch
2. cek preview URL dari Vercel
3. test
4. merge ke branch production
5. Vercel deploy production otomatis

## 1. Prasyarat

Sebelum mulai, pastikan punya:

- akun GitHub
- akun Vercel
- repo `hrd_pintu` di GitHub
- akses ke project Supabase yang dipakai `hrd_pintu`
- akses ke `hrd_ruang` yang akan menerima sinkronisasi kandidat
- Node.js `20.19+` atau `22.12+`
- `pnpm`

Checklist cepat lokal:

```bash
node -v
pnpm -v
git remote -v
```

Repo ini saat ini sudah punya remote GitHub:

```text
origin  git@github-work:your-org/hrd_pintu.git
```

Kalau di mesin Anda belum ada Vercel CLI, install salah satu:

```bash
pnpm add -g vercel
vercel --version
```

Atau tanpa install global:

```bash
pnpm dlx vercel@latest --version
```

Kalau Anda memakai opsi kedua, semua command `vercel` di dokumen ini bisa diganti jadi `pnpm dlx vercel@latest`.

## 2. Masuk ke Folder Project

```bash
cd <project-root>
```

## 3. Siapkan dan Test Project di Lokal

Sebelum bicara deploy, pastikan project ini bisa dibangun secara lokal.

Install dependency:

```bash
pnpm install --frozen-lockfile
```

Jalankan validasi minimum:

```bash
pnpm type-check
pnpm build
```

Kalau ingin cek UI lokal:

```bash
pnpm dev
```

Checklist minimum sebelum deploy:

- halaman login tampil
- login kandidat jalan
- dashboard bisa dibuka
- form kandidat bisa save draft
- upload foto jalan
- upload dokumen jalan
- submit tidak error

Kalau build lokal gagal, jangan lanjut ke Vercel dulu.

## 4. Siapkan Environment dan Storage

File contoh env sudah ada:

- `.env.example`

Buat file lokal:

```bash
cp .env.example .env
```

Env yang dipakai project ini:

| Variable | Wajib | Dipakai di mana | Fungsi |
| --- | --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | Ya | browser + runtime public | URL project Supabase kandidat |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | browser + runtime public | anon key untuk kandidat |
| `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET` | Ya | browser + runtime public | bucket pas foto |
| `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET` | Ya | browser + runtime public | bucket dokumen kandidat |
| `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` | Tidak | browser + runtime public | bucket dokumen employee bila dipisah |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | server only | akses admin Supabase |
| `INTERNAL_SERVICE_TOKEN` | Ya | server only | token dari `hrd_ruang` ke `hrd_pintu` |
| `HRD_PINTU_SYNC_BASE_URL` | Ya | server only | base URL endpoint internal `hrd_ruang` |
| `HRD_PINTU_SYNC_TOKEN` | Ya | server only | token sinkron dari `hrd_pintu` ke `hrd_ruang` |

Contoh:

```env
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET=candidate-photographs
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET=candidate-documents
NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET=candidate-documents
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
INTERNAL_SERVICE_TOKEN=YOUR_INTERNAL_SERVICE_TOKEN
HRD_PINTU_SYNC_BASE_URL=https://YOUR_WORKSPACE_DOMAIN/api/internal
HRD_PINTU_SYNC_TOKEN=YOUR_HRD_PINTU_SYNC_TOKEN
```

Catatan penting:

- `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_SERVICE_TOKEN`, dan `HRD_PINTU_SYNC_TOKEN` adalah secret server-side.
- Jangan pernah kasih prefix `NUXT_PUBLIC_` untuk secret.
- `HRD_PINTU_SYNC_BASE_URL` untuk production harus mengarah ke URL live `hrd_ruang`, bukan `localhost`.

Storage Supabase yang perlu sudah ada:

- bucket `candidate-photographs`
- bucket `candidate-documents`

Kalau Anda memang memakai bucket employee terpisah, siapkan juga bucket itu lalu isi `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET`.

## 5. Pastikan Code Sudah di GitHub

Karena Anda ingin deploy lewat Vercel dengan koneksi GitHub, repository harus sudah ada di GitHub dan branch yang ingin dipakai harus sudah dipush.

Cek status:

```bash
git status
git branch --show-current
git remote -v
```

Kalau ada perubahan yang memang ingin dideploy, commit lalu push ke GitHub.

Contoh:

```bash
git add .
git commit -m "prepare vercel deployment guide"
git push origin <nama-branch>
```

Catatan:

- jangan deploy dari working tree berantakan kalau Anda belum yakin isinya
- branch production jangan ditentukan asal
- set branch production sesuai workflow tim

## 6. Login ke Vercel dan Koneksikan GitHub

Bagian ini biasanya yang paling membingungkan kalau dikerjakan pertama kali.

### Opsi A: Lewat browser Vercel dashboard

Ini yang paling direkomendasikan untuk setup awal.

1. Buka `https://vercel.com`
2. Klik `Log In` atau `Sign Up`
3. Pilih `Continue with GitHub`
4. Selesaikan proses OAuth GitHub
5. Kalau diminta, izinkan Vercel mengakses account GitHub Anda
6. Pilih scope yang benar:
   - personal account
   - atau team Vercel

Kalau repository GitHub Anda private, biasanya Vercel akan meminta Anda meng-install atau meng-update akses GitHub integration milik Vercel.

Hal yang perlu dicek:

- repo `hrd_pintu` terlihat di daftar import Vercel
- account/team yang dipilih memang account yang benar
- repository yang dipilih bukan fork atau repo lain yang mirip

### Opsi B: Lewat CLI

Setelah account Vercel siap, login CLI di terminal:

```bash
vercel login
```

CLI akan meminta email atau membuka flow autentikasi. Setelah selesai, akun lokal Anda akan terhubung ke Vercel.

## 7. Import Repository GitHub Menjadi Project Vercel

Sesudah login Vercel dan GitHub sudah terhubung:

1. dari dashboard Vercel klik `Add New...`
2. pilih `Project`
3. pada bagian `Import Git Repository`, pilih GitHub
4. cari repo `hrd_pintu`
5. klik `Import`

Sesudah itu Vercel akan menampilkan halaman konfigurasi project.

### Nilai yang perlu dicek saat import

Periksa satu per satu:

- `Project Name`
  - rekomendasi: `hrd-pintu`
- `Framework Preset`
  - harus terdeteksi sebagai `Nuxt`
- `Root Directory`
  - gunakan root repo ini
- `Build and Output Settings`
  - biarkan mengikuti repo
  - project ini sudah punya `vercel.json`
- `Install Command`
  - `pnpm install --frozen-lockfile`
- `Build Command`
  - `pnpm build`

Kalau Vercel menampilkan hasil deteksi yang berbeda, cocokkan dengan isi `vercel.json` dan `package.json`.

### Tentukan branch production dengan sengaja

Sebelum klik deploy, pikirkan branch production Anda.

Di Vercel ada konsep `Production Branch`. Branch inilah yang biasanya memicu deploy production otomatis.

Rekomendasi:

- kalau workflow tim memakai `main`, set `main` sebagai production branch
- kalau workflow tim memakai branch lain, set sesuai branch release yang benar
- jangan asal memakai branch aktif lokal hari ini

Ini penting karena branch lokal Anda saat ini belum tentu branch production.

## 8. Isi Environment Variables di Vercel

Setelah repo di-import, isi env sebelum deploy dipakai serius.

Anda bisa isi lewat dashboard Vercel:

1. buka project `hrd-pintu`
2. masuk ke `Settings`
3. buka `Environment Variables`
4. tambahkan setiap variable
5. pilih target environment:
   - `Production`
   - `Preview`
   - `Development`

### Env yang harus diisi

Isi minimal variable berikut:

```text
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_SERVICE_TOKEN
HRD_PINTU_SYNC_BASE_URL
HRD_PINTU_SYNC_TOKEN
```

Opsional:

```text
NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET
```

### Saran pembagian target environment

Untuk `Production`:

- pakai Supabase production
- pakai token production
- pakai `HRD_PINTU_SYNC_BASE_URL` production

Untuk `Preview`:

- idealnya pakai environment staging / sandbox
- kalau belum ada staging, Anda bisa pakai value production sementara, tapi risikonya preview ikut menulis ke sistem production

Untuk `Development`:

- isi agar `vercel env pull` bisa dipakai untuk lokal

### Menambah env lewat CLI

Kalau mau lewat terminal, berikut daftar lengkapnya.

### Daftar lengkap env yang dipush ke Vercel

Jalankan satu per satu, lalu paste value yang benar saat diminta.

#### `NUXT_PUBLIC_SUPABASE_URL`

```bash
vercel env add NUXT_PUBLIC_SUPABASE_URL production
vercel env add NUXT_PUBLIC_SUPABASE_URL preview
vercel env add NUXT_PUBLIC_SUPABASE_URL development
```

#### `NUXT_PUBLIC_SUPABASE_ANON_KEY`

```bash
vercel env add NUXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NUXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add NUXT_PUBLIC_SUPABASE_ANON_KEY development
```

#### `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET`

```bash
vercel env add NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET production
vercel env add NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET preview
vercel env add NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET development
```

#### `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET`

```bash
vercel env add NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET production
vercel env add NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET preview
vercel env add NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET development
```

#### `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` (opsional)

Kalau bucket employee dipisah, tambahkan juga ini:

```bash
vercel env add NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET production
vercel env add NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET preview
vercel env add NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET development
```

#### `SUPABASE_SERVICE_ROLE_KEY`

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY development
```

#### `INTERNAL_SERVICE_TOKEN`

```bash
vercel env add INTERNAL_SERVICE_TOKEN production
vercel env add INTERNAL_SERVICE_TOKEN preview
vercel env add INTERNAL_SERVICE_TOKEN development
```

#### `HRD_PINTU_SYNC_BASE_URL`

```bash
vercel env add HRD_PINTU_SYNC_BASE_URL production
vercel env add HRD_PINTU_SYNC_BASE_URL preview
vercel env add HRD_PINTU_SYNC_BASE_URL development
```

#### `HRD_PINTU_SYNC_TOKEN`

```bash
vercel env add HRD_PINTU_SYNC_TOKEN production
vercel env add HRD_PINTU_SYNC_TOKEN preview
vercel env add HRD_PINTU_SYNC_TOKEN development
```

### Checklist env yang harus ada di Vercel

Minimal sesudah selesai, project Vercel harus punya env berikut:

```text
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_SERVICE_TOKEN
HRD_PINTU_SYNC_BASE_URL
HRD_PINTU_SYNC_TOKEN
```

Opsional:

```text
NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET
```

Untuk cek env yang sudah masuk:

```bash
vercel env ls
```

## 9. Deploy Pertama Saat Import Project

Ketika project pertama kali di-import, Vercel biasanya langsung menawarkan deploy pertama.

Saran:

1. isi env dulu
2. baru jalankan deploy

Kalau env sudah lengkap, deploy pertama bisa langsung dijadikan preview percobaan.

Sesudah deploy selesai, Vercel akan memberi:

- deployment URL `*.vercel.app`
- status build
- build logs
- runtime logs

Kalau build gagal, buka log dulu sebelum ganti konfigurasi acak.

## 10. Link Folder Lokal ke Project Vercel yang Sudah Di-Import

Setelah project berhasil dibuat di dashboard, link folder lokal ini ke project yang sama.

Jalankan dari root repo:

```bash
cd <project-root>
vercel link
```

Pilih:

- scope/team yang benar
- `Link to existing project`
- project `hrd-pintu`

Jangan pilih membuat project baru kalau project hasil import GitHub sudah ada. Kalau salah, nanti Anda punya project duplikat.

Sesudah sukses, folder `.vercel/` akan terbentuk.

## 11. Tarik Env dari Vercel ke Lokal

Supaya environment lokal konsisten dengan yang ada di Vercel:

```bash
vercel env pull .env.local
```

Kalau Anda mau menjalankan app lokal dengan env dari Vercel tanpa copy manual:

```bash
vercel env run -- pnpm dev
```

Ini berguna untuk memastikan perilaku lokal mendekati environment Vercel.

## 12. Alur Deploy yang Paling Enak Setelah GitHub Sudah Terkoneksi

Setelah GitHub integration aktif, alur kerja harian biasanya jadi seperti ini.

### Untuk preview deployment

1. buat branch feature / fix
2. commit perubahan
3. push ke GitHub
4. Vercel otomatis membuat preview deployment
5. buka preview URL
6. test

Contoh:

```bash
git checkout -b feat/some-change
git add .
git commit -m "feat: some change"
git push origin feat/some-change
```

### Untuk production deployment

Pilihan yang paling umum:

1. branch feature sudah lolos preview
2. merge ke production branch
3. Vercel otomatis deploy production

Kalau tim Anda memakai `main` sebagai production branch, merge ke `main`.

Kalau tim Anda memakai branch lain, pakai branch itu sebagai production branch di Vercel.

## 13. Deploy Manual dari CLI

Kalau Anda ingin deploy manual dari terminal:

### Preview

```bash
vercel deploy
```

### Production

```bash
vercel deploy --prod
```

Biasanya deploy manual dipakai ketika:

- ingin tes cepat dari mesin lokal
- ingin deploy tanpa menunggu merge branch
- sedang investigasi build issue

Kalau Git integration sudah sehat, deploy rutin lebih baik tetap lewat alur push branch -> preview -> merge -> production.

## 14. Checklist Verifikasi Setelah Preview

Sesudah preview URL muncul, cek:

- halaman login terbuka
- login kandidat berhasil
- dashboard tampil
- candidate summary tampil
- form kandidat bisa dibuka
- save draft berhasil
- upload foto berhasil
- upload dokumen berhasil
- submit final tidak error

Kalau project ini sinkron ke `hrd_ruang`, cek juga:

- endpoint `HRD_PINTU_SYNC_BASE_URL` bisa diakses dari deployment
- token sinkron benar
- event kandidat benar-benar masuk ke side `workspace`

Command yang berguna:

```bash
vercel inspect <deployment-url-atau-id>
vercel logs --deployment <deployment-url-atau-id> --level error
```

## 15. Checklist Verifikasi Setelah Production Live

Setelah deployment production aktif, cek lagi di domain production:

- login kandidat berhasil
- tidak ada `500`
- dashboard tampil
- draft tersimpan
- upload storage berhasil
- submit final berhasil
- data masuk ke Supabase
- sinkron ke `hrd_ruang` berjalan

Cek tambahan:

- bucket `candidate-photographs` ada
- bucket `candidate-documents` ada
- storage policy Supabase benar
- env production di Vercel tidak kosong
- `HRD_PINTU_SYNC_BASE_URL` menunjuk ke server live yang benar

## 16. Custom Domain

Kalau ingin memakai domain sendiri, misalnya `candidate.domainanda.com`:

1. buka project di Vercel
2. masuk ke `Settings`
3. buka `Domains`
4. tambahkan domain
5. ikuti instruksi DNS dari Vercel

Sesudah domain aktif, ulangi verifikasi:

- halaman terbuka lewat custom domain
- login tetap jalan
- callback / request ke API tidak ada masalah origin

## 17. Update Environment Variable

Kalau ada key atau token berubah:

1. update env di Vercel
2. redeploy
3. pull ulang env ke lokal bila perlu

Contoh lewat CLI:

```bash
vercel env rm HRD_PINTU_SYNC_TOKEN production
vercel env add HRD_PINTU_SYNC_TOKEN production
vercel deploy --prod
```

Lalu sinkronkan lokal lagi:

```bash
vercel env pull .env.local
```

## 18. Redeploy, Logs, dan Rollback

### Lihat logs

```bash
vercel logs --deployment <deployment-url-atau-id> --level error
```

### Lihat metadata deployment

```bash
vercel inspect <deployment-url-atau-id>
```

### Redeploy deployment yang sama

```bash
vercel redeploy <deployment-id-atau-url>
```

### Rollback

```bash
vercel rollback
```

Atau ke deployment tertentu:

```bash
vercel rollback <deployment-id-atau-url>
```

Sesudah rollback, cek lagi flow utama:

- login
- dashboard
- form
- upload
- submit

## 19. Workflow Rutin yang Direkomendasikan

Kalau setup GitHub + Vercel sudah selesai, workflow deploy sehari-hari sebaiknya seperti ini:

1. ubah code di branch kerja
2. jalankan:

```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm build
```

3. push branch ke GitHub
4. cek preview dari Vercel
5. verifikasi fitur utama
6. merge ke production branch
7. Vercel deploy production otomatis

Kalau butuh deploy manual:

```bash
vercel deploy
vercel deploy --prod
```

## 20. Troubleshooting

### `vercel: command not found`

Install CLI:

```bash
pnpm add -g vercel
```

Atau pakai:

```bash
pnpm dlx vercel@latest --version
```

### Repo GitHub tidak muncul saat import di Vercel

Biasanya penyebabnya:

- login ke akun GitHub yang salah
- Vercel belum diberi akses ke repo private
- repo ada di organization lain
- Anda sedang berada di Vercel team yang salah

Solusi:

- cek lagi account/team Vercel aktif
- cek akses GitHub integration milik Vercel
- pastikan repo benar-benar sudah dipush

### Project Vercel jadi dobel

Biasanya terjadi karena:

- repo sudah di-import dari dashboard
- lalu di terminal Anda menjalankan `vercel link` dan memilih `create new project`

Solusi:

- pakai project yang benar
- link ulang folder lokal ke existing project

### Build gagal karena Node version

Project ini meminta:

- `^20.19.0`
- atau `>=22.12.0`

Pastikan lokal dan Vercel memakai versi yang kompatibel.

### Error `NUXT_PUBLIC_SUPABASE_URL belum diisi di file .env`

Artinya env public belum benar.

Cek:

- `.env`
- `.env.local`
- Vercel `Environment Variables`
- hasil `vercel env pull .env.local`

### Error `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set`

Artinya env server-side belum benar.

Yang perlu dicek:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NUXT_PUBLIC_SUPABASE_URL`
- target environment di Vercel tempat env itu dipasang

### Upload dokumen gagal

Penyebab umum:

- bucket belum dibuat
- nama bucket salah
- storage policy salah
- key Supabase salah

### Submit berhasil tapi sync ke `hrd_ruang` gagal

Cek:

- `HRD_PINTU_SYNC_BASE_URL`
- `HRD_PINTU_SYNC_TOKEN`
- endpoint internal `hrd_ruang`
- apakah preview deployment tanpa sengaja diarahkan ke endpoint production

## 21. Ringkasan Command Penting

```bash
cd <project-root>
pnpm install --frozen-lockfile
pnpm type-check
pnpm build
vercel login
vercel link
vercel env pull .env.local
vercel env run -- pnpm dev
vercel deploy
vercel deploy --prod
vercel inspect <deployment-url-atau-id>
vercel logs --deployment <deployment-url-atau-id> --level error
vercel redeploy <deployment-id-atau-url>
vercel rollback
```

## 22. Urutan Singkat Paling Praktis

Kalau mau yang super singkat, urutannya seperti ini:

1. push repo `hrd_pintu` ke GitHub
2. login ke Vercel pakai GitHub
3. import repo `hrd_pintu` jadi project Vercel
4. isi semua environment variable
5. set production branch yang benar
6. deploy pertama
7. link folder lokal dengan `vercel link`
8. tarik env dengan `vercel env pull .env.local`
9. push branch untuk preview otomatis
10. merge ke production branch untuk production deploy

## 23. Referensi Resmi

- Vercel import project: https://vercel.com/docs/getting-started-with-vercel/import
- Vercel deploy from CLI: https://vercel.com/docs/projects/deploy-from-cli
- Vercel CLI overview: https://vercel.com/docs/cli
- Vercel env: https://vercel.com/docs/cli/env
- Vercel deploy command: https://vercel.com/docs/cli/deploy
- Vercel rollback: https://vercel.com/docs/cli/rollback
