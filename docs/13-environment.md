# 13 Environment

> Last verified against current repository state: 2026-06-23

## Environment Variable Yang Ditemukan

Berdasarkan `.env.example`, `nuxt.config.ts`, `server/config/env.js`, dan `src/infrastructure/runtime/publicConfig.ts`.

| Variable | Scope | Wajib | Digunakan di | Keterangan |
| --- | --- | --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | public | Ya | client + server runtime | URL project Supabase |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | public | Ya | client | anon key browser |
| `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET` | public | Ya | client + server | nama bucket foto, default `candidate-photographs` |
| `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET` | public | Ya | client + server | nama bucket dokumen, default `candidate-documents` |
| `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` | public | Tidak | runtime config fallback | hanya dipakai sebagai fallback pembacaan config; upload frontend aktif tetap memakai `candidateDocumentBucket` |
| `SUPABASE_SERVICE_ROLE_KEY` | private | Ya | server | service role key |
| `INTERNAL_SERVICE_TOKEN` | private | Ya | server | shared secret internal API |
| `HRD_PINTU_SYNC_BASE_URL` | private | Tidak secara kode, tetapi diperlukan untuk sync | server | base URL tujuan sinkronisasi |
| `HRD_PINTU_SYNC_TOKEN` | private | Tidak secara kode, tetapi diperlukan untuk sync | server | token sinkronisasi |
| `SUPABASE_URL` | private/server fallback | Tidak | server | fallback selain `NUXT_PUBLIC_SUPABASE_URL` |
| `VITE_*` variants | legacy fallback | Tidak | client/server runtime | fallback kompatibilitas lama |

## Public Env

Public env yang dapat terekspos ke browser:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`
- `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET`
- `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET`
- `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET`

## Private Env

Private env yang hanya boleh dipakai di server:

- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_SERVICE_TOKEN`
- `HRD_PINTU_SYNC_BASE_URL`
- `HRD_PINTU_SYNC_TOKEN`
- `SUPABASE_URL` bila dipakai sebagai override server-side

## Contoh `.env.example`

```env
# Candidate portal public runtime config
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET=candidate-photographs
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET=candidate-documents
NUXT_PUBLIC_SUPABASE_ANON_KEY=

# Candidate service server-only config
SUPABASE_SERVICE_ROLE_KEY=
INTERNAL_SERVICE_TOKEN=replace-with-shared-secret
HRD_PINTU_SYNC_BASE_URL=http://localhost:3000/api/internal
HRD_PINTU_SYNC_TOKEN=replace-with-shared-secret
```

## Cara Setting Local

```bash
cd <project-root>
cp .env.example .env
```

Isi nilai yang sesuai:

```env
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET=candidate-photographs
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET=candidate-documents
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INTERNAL_SERVICE_TOKEN=shared-secret
HRD_PINTU_SYNC_BASE_URL=http://localhost:3000/api/internal
HRD_PINTU_SYNC_TOKEN=shared-secret
```

## Cara Setting Production

Checklist:

1. isi semua env di provider deploy, bukan di file committed
2. arahkan `HRD_PINTU_SYNC_BASE_URL` ke domain live `hrd_ruang`
3. gunakan secret yang berbeda dari environment lokal
4. pastikan bucket yang dirujuk benar-benar ada

Contoh di Vercel:

```bash
vercel env add NUXT_PUBLIC_SUPABASE_URL
vercel env add NUXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add INTERNAL_SERVICE_TOKEN
vercel env add HRD_PINTU_SYNC_BASE_URL
vercel env add HRD_PINTU_SYNC_TOKEN
```

## Catatan Runtime Config

Urutan pembacaan config public:

1. `useRuntimeConfig().public`
2. `globalThis.__NUXT__.config.public`
3. `process.env`
4. `import.meta.env`

Tujuan:

- menjaga config tetap terbaca di berbagai konteks runtime
- mempertahankan fallback env lama
