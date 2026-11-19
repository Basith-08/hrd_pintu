# Supabase Database Keep-Alive

Endpoint `GET /api/cron/keepalive` melakukan UPSERT ke `public.app_heartbeat`
dengan `id = 1`. Eksekusi berikutnya memperbarui `last_ping_at`, bukan menambah row.
Ini membantu menjaga aktivitas database, tanpa menjamin Supabase Free Plan tidak
akan di-pause. Project yang sudah di-pause perlu di-resume melalui Supabase Dashboard.

## Jadwal

`vercel.json` menggunakan `0 15 */3 * *`: pukul 15.00 UTC / 22.00 WIB pada
tanggal 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, dan 31 (jika tanggalnya ada).
Perhitungan dimulai lagi setiap bulan; ini bukan interval tepat 72 jam.
Pada Hobby eksekusi dapat terjadi kapan saja antara 22.00 dan 22.59 WIB.
Frekuensi ini memenuhi batas maksimal sekali sehari pada Hobby.
Lihat [batas dan presisi Vercel Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Cron dijalankan pada deployment **Production**, bukan Preview atau server lokal.
Tidak ada scheduler tambahan atau proses yang harus terus aktif.

## Database dan deployment

1. Jalankan migration baru
   [`sql/migration/20261119_064_add_app_heartbeat.sql`](../sql/migration/20261119_064_add_app_heartbeat.sql)
   melalui Supabase SQL Editor pada project yang benar. Migration memakai transaksi,
   membuat tabel dengan RLS aktif, mencabut akses `PUBLIC`, `anon`, dan `authenticated`,
   serta memberi `service_role` hak SELECT/INSERT/UPDATE. Tidak ada policy akses client.
2. Untuk workflow Supabase CLI yang sudah memakai riwayat `supabase/migrations`,
   salinan identik tersedia di
   `supabase/migrations/20261119000000_064_add_app_heartbeat.sql`.
   Pilih satu jalur penerapan migration; jangan mengeksekusi kedua salinan pada database sama.
   Jangan menjalankan seluruh riwayat migration pada database production yang sudah ada
   tanpa menyelaraskan riwayat CLI terlebih dahulu.
3. Tambahkan environment berikut di Vercel Project → Settings → Environment Variables,
   scope **Production**:

   | Variable | Isi |
   | --- | --- |
   | `NUXT_PUBLIC_SUPABASE_URL` | Gunakan URL project aplikasi yang sudah dikonfigurasi; tidak perlu menambahkan `SUPABASE_URL` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key / server secret key project tersebut; gunakan konfigurasi server yang sudah ada |
   | `CRON_SECRET` | Secret acak khusus cron, minimal 16 karakter, tanpa whitespace/baris baru |

   Contoh generate secret: `openssl rand -hex 32`. Simpan nilainya di secret manager.
   Jangan menaruh key atau cron secret dalam `runtimeConfig.public`, variabel
   `NUXT_PUBLIC_*` / `VITE_*`, frontend, URL request, atau repository.
   URL Supabase sendiri bukan credential; setting public Auth yang sudah ada tetap dipakai.
   Server menggunakan konfigurasi URL bersama yang sudah ada, dengan prioritas
   `SUPABASE_URL` → `NUXT_PUBLIC_SUPABASE_URL` → `VITE_SUPABASE_URL`.
   `SUPABASE_URL` hanya override opsional; biarkan tidak disetel untuk memakai
   `NUXT_PUBLIC_SUPABASE_URL` yang sudah ada.
4. Jalankan `pnpm test`, `pnpm type-check`, dan `pnpm build`, lalu deploy ke Production.
   Redeploy diperlukan setelah mengganti environment variables.
5. Buka daftar Cron Jobs di Vercel Project (pada UI baru: Schedules → Cron Jobs).
   Pastikan `/api/cron/keepalive` dan `0 15 */3 * *` terdaftar dan aktif.

Vercel menyertakan `Authorization: Bearer <CRON_SECRET>` secara otomatis.
Tidak perlu memasukkan secret ke `vercel.json`.
Lihat [keamanan, deployment, dan pengelolaan cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## Pengujian otomatis

```bash
pnpm test
```

Vitest menjalankan handler H3 dengan Supabase JS asli dan HTTP database tiruan;
test tidak menghubungi database production. Skenario mencakup authorization hilang/salah,
secret kosong/tidak tersedia, UPSERT berulang dengan ID tetap dan timestamp baru,
database error/network failure, key server hilang, GET-only, dan cache `no-store`.
Constraint dan permission PostgreSQL perlu diverifikasi pada database target.

## Pengujian manual endpoint

Untuk lokal, isi `.env` berdasarkan `.env.example`, lalu jalankan `pnpm dev`.
Ganti base URL berikut ke `http://localhost:3000` jika menguji lokal.
Gunakan domain production langsung agar request tidak terkena redirect.

```bash
APP_BASE_URL=https://your-app.vercel.app

# Expected: HTTP 401
curl -i "$APP_BASE_URL/api/cron/keepalive"
curl -i -H 'Authorization: Bearer wrong-secret' "$APP_BASE_URL/api/cron/keepalive"

# Masukkan secret secara tersembunyi pada Bash agar tidak masuk command history.
read -r -s -p 'CRON_SECRET: ' CRON_SECRET
export CRON_SECRET

# Expected: HTTP 200 dan JSON {"success":true,"timestamp":"..."}
curl -i -H "Authorization: Bearer $CRON_SECRET" "$APP_BASE_URL/api/cron/keepalive"

# Ulangi; hanya timestamp row yang sama yang berubah.
curl -i -H "Authorization: Bearer $CRON_SECRET" "$APP_BASE_URL/api/cron/keepalive"
unset CRON_SECRET
```

Tanpa `CRON_SECRET` pada server, request selalu ditolak dengan 401 meskipun membawa
header. GET valid dengan kegagalan database/config server menghasilkan HTTP 503
dengan pesan `Heartbeat unavailable`, tanpa detail credential. Jangan sengaja
merusak konfigurasi production untuk menguji error; gunakan Vitest atau environment uji.

## Memeriksa Vercel Logs

1. Buka Vercel Project → Cron Jobs (atau Schedules → Cron Jobs) → **View Logs** untuk job ini.
   Alternatif: buka **Logs**, pilih environment Production, filter request path
   `/api/cron/keepalive` dan rentang waktu eksekusi.
2. Cari HTTP 200 dan log `[keepalive] Heartbeat updated` beserta timestamp UTC.
   HTTP 401 berarti secret tidak tersedia/tidak cocok; periksa scope Production dan redeploy.
3. HTTP 503 dan `[keepalive] Heartbeat failed` berarti konfigurasi database, migration,
   permission, status project, atau koneksi perlu diperiksa. Detail upstream sengaja
   tidak dicetak. Vercel tidak otomatis mencoba ulang invocation yang gagal;
   setelah masalah diperbaiki, panggil endpoint secara manual atau tunggu jadwal berikutnya.

## Memverifikasi Supabase

Setelah request valid, jalankan di Supabase SQL Editor:

```sql
select
  id,
  last_ping_at,
  last_ping_at at time zone 'Asia/Jakarta' as last_ping_wib
from public.app_heartbeat;

select count(*) as row_count from public.app_heartbeat;
```

Expected setelah ping pertama: satu row, `id = 1`, `row_count = 1`.
Panggil endpoint lagi lalu ulangi query: timestamp maju dan jumlah row tetap satu.
Sebelum ping pertama, tabel kosong adalah normal.

Verifikasi RLS dan akses client:

```sql
select relrowsecurity
from pg_class
where oid = 'public.app_heartbeat'::regclass;

select role_name,
  has_table_privilege(role_name, 'public.app_heartbeat', 'SELECT') as can_select,
  has_table_privilege(role_name, 'public.app_heartbeat', 'INSERT') as can_insert,
  has_table_privilege(role_name, 'public.app_heartbeat', 'UPDATE') as can_update,
  has_table_privilege(role_name, 'public.app_heartbeat', 'DELETE') as can_delete
from (values ('anon'), ('authenticated')) as roles(role_name);
```

Expected: `relrowsecurity = true` dan semua izin client `false`.
Kombinasi primary key dan `CHECK (id = 1)` membatasi tabel menjadi maksimal satu row.
Service role melewati RLS dan hanya dipakai pada server client khusus cron dengan
`persistSession: false` dan `autoRefreshToken: false`.
Lihat [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
dan [ketentuan project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
