# 14 Deployment

> Last verified against current repository state: 2026-06-23

## Metode Deploy Yang Ditemukan

Konfigurasi deploy yang eksplisit hanya ditemukan untuk Vercel:

- [vercel.json](../vercel.json)

Tidak ditemukan konfigurasi resmi untuk:

- Netlify
- Docker
- VPS/systemd
- Render

Status untuk provider selain Vercel: `Belum ditemukan di repository`.

## Install Dependency

```bash
cd <project-root>
pnpm install --frozen-lockfile
```

## Menjalankan Lokal

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Preview

```bash
pnpm preview
```

## Deployment Ke Vercel

### Konfigurasi yang ditemukan

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

### Langkah minimum

1. Push repository ke Git provider.
2. Import project ke Vercel.
3. Isi environment variable production.
4. Pastikan migrasi database dan storage policy sudah diterapkan.
5. Jalankan deploy.

## Environment Variable Production

Wajib:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`
- `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET`
- `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_SERVICE_TOKEN`
- `HRD_PINTU_SYNC_BASE_URL`
- `HRD_PINTU_SYNC_TOKEN`

Opsional:

- `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET`

## Checklist Sebelum Deploy

### Aplikasi

- `pnpm install --frozen-lockfile`
- `pnpm type-check`
- `pnpm build`

### Supabase

- migrasi baseline dan extension sudah diterapkan
- RLS sudah aktif
- bucket `candidate-photographs` sudah ada
- bucket `candidate-documents` sudah ada
- policy storage hardened sudah diterapkan

### Integrasi

- `INTERNAL_SERVICE_TOKEN` sinkron dengan sistem pemanggil internal API
- `HRD_PINTU_SYNC_BASE_URL` mengarah ke endpoint internal `hrd_ruang`
- `HRD_PINTU_SYNC_TOKEN` sinkron dengan penerima event

### Data/Flow

- login kandidat berhasil
- dashboard muncul
- save draft form berhasil
- upload foto berhasil
- upload dokumen berhasil
- submit berhasil

## Troubleshooting Deployment

| Gejala | Kemungkinan penyebab | Tindakan |
| --- | --- | --- |
| build gagal karena template tidak ditemukan | `src/public/templates` tidak sinkron | cek `scripts/sync-template-assets.mjs`, jalankan `pnpm build` lokal |
| login gagal | `NUXT_PUBLIC_SUPABASE_URL` atau `NUXT_PUBLIC_SUPABASE_ANON_KEY` salah | verifikasi env public |
| backend error `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set` | env server tidak lengkap | isi `SUPABASE_SERVICE_ROLE_KEY`, atau fallback `SUPABASE_URL` bila diperlukan |
| upload storage gagal | bucket/policy belum ada | jalankan migration storage |
| internal API 401 | token internal tidak cocok | verifikasi `INTERNAL_SERVICE_TOKEN` |
| sinkronisasi event gagal | `HRD_PINTU_SYNC_BASE_URL` atau `HRD_PINTU_SYNC_TOKEN` salah | cek log backend dan env sinkronisasi |

## Rollback Plan

1. Re-deploy commit stabil sebelumnya di Vercel.
2. Jika masalah berasal dari env, rollback env ke nilai terakhir yang diketahui benar.
3. Jika masalah berasal dari migration database, lakukan rollback manual sesuai kebijakan DBA/Supabase karena repo ini tidak menyediakan migration runner otomatis.
4. Nonaktifkan sementara sinkronisasi event dengan mengosongkan `HRD_PINTU_SYNC_BASE_URL` atau `HRD_PINTU_SYNC_TOKEN` bila external integration mengganggu operasi utama.

## Catatan Penting

1. Meskipun `ssr: false`, project ini tetap memiliki backend route di folder `server/`, sehingga deployment harus mendukung Nitro server output.
2. Migrasi database dijalankan manual; ini perlu disiplin operasional saat deploy antar environment.
