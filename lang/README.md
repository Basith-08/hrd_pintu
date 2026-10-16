# Lang Flow

Dokumen ini menjelaskan cara kerja sistem bahasa di `hrd_pintu`.

## Gambaran Besar

Flow i18n sekarang seperti ini:

1. Page atau component memanggil `text("some.key")`.
2. `text()` berasal dari `useLocale()`.
3. `useLocale()` membaca semua translation yang sudah digabung dari `lang/index.ts`.
4. `lang/index.ts` menggabungkan semua file JSON per domain seperti `login.json`, `common.json`, `dashboard.json`, dan lain-lain.
5. `text()` memilih value berdasarkan locale aktif: `en` atau `id`.
6. Hasil string dikembalikan ke component dan dirender ke UI.

## Struktur File

- `src/composables/useLocale.ts`
  Fungsi utama i18n: simpan locale aktif, pilih bahasa, baca key, format placeholder, dan guard kalau key hilang.
- `lang/index.ts`
  Menggabungkan semua file JSON di folder `lang/` menjadi satu map translation.
- `lang/*.json`
  Sumber text per domain.

Contoh pembagian:

- `lang/login.json`
  Semua text untuk halaman login.
- `lang/common.json`
  Text umum seperti `email`, `add`, `remove`, `processing`.
- `lang/dashboard.json`
  Text khusus dashboard.
- `lang/applicationForm.json`
  Text khusus form kandidat/karyawan.

## Flow Contoh Login

Contoh paling gampang ada di page login.

### 1. Route masuk ke page

File: `src/pages/login.vue`

Di file ini ada:

```ts
const pageTitle = computed(() => text("page.login.title"))
```

Artinya:

- page login butuh judul browser/tab
- page memanggil `text("page.login.title")`
- key itu dicari di translation map

### 2. Page render component

Masih di `src/pages/login.vue`:

```vue
<LoginPage />
```

Jadi page ini cuma jadi wrapper route-level, lalu UI aslinya ada di component `LoginPage.vue`.

### 3. Component render text

File: `src/features/auth/LoginPage.vue`

Contoh:

```vue
<span>{{ text("login.fields.password") }}</span>
```

Artinya:

- component minta text untuk label password
- `text()` tidak lagi menerima dua string
- component hanya kirim key

Lalu placeholder:

```vue
:placeholder="text('login.fields.passwordPlaceholder')"
```

Dan tombol submit:

```vue
{{ isLoading ? text('common.processing') : text('login.actions.signIn') }}
```

Jadi component tidak tahu isi Bahasa Inggris atau Indonesia. Component hanya tahu key.

### 4. `text()` hit ke `useLocale()`

File: `src/composables/useLocale.ts`

Saat component memanggil:

```ts
const { text } = useLocale()
```

lalu `text("login.fields.password")`, maka yang terjadi:

1. `useLocale()` memastikan locale aktif sudah terinisialisasi.
2. Locale diambil dari:
   - `localStorage` key: `hrd_pintu_locale`, atau
   - browser language kalau belum ada saved value.
3. `text()` cari entry translation berdasarkan key.
4. `text()` pilih value sesuai `locale.value`.

Potongan penting:

```ts
const entry = translationMap[key]
const sourceText = entry[locale.value] || entry.en
```

Jadi kalau locale aktif `id`, maka dia ambil `entry.id`.
Kalau `id` kosong, dia fallback ke `entry.en`.

### 5. `useLocale()` ambil translation dari `lang/index.ts`

Di `useLocale.ts` ada:

```ts
import translations from "../../lang"
```

Import itu masuk ke file `lang/index.ts`.

### 6. `lang/index.ts` merge semua file JSON

File: `lang/index.ts`

Contoh isi:

```ts
import login from "./login.json"
import common from "./common.json"

const translations = {
  ...login,
  ...common,
}
```

Artinya:

- semua key dari `login.json` dimasukkan
- semua key dari `common.json` dimasukkan
- hasil akhirnya jadi satu object besar bernama `translations`

### 7. Key ditemukan di file JSON

File: `lang/login.json`

Contoh:

```json
{
  "login.fields.password": {
    "en": "Password",
    "id": "Kata Sandi"
  }
}
```

Jadi flow lengkap untuk label password adalah:

1. `src/features/auth/LoginPage.vue`
2. panggil `text("login.fields.password")`
3. masuk ke `src/composables/useLocale.ts`
4. `useLocale.ts` baca `translations`
5. `translations` datang dari `lang/index.ts`
6. `lang/index.ts` merge `lang/login.json`
7. key `login.fields.password` ketemu
8. kalau locale `id` hasilnya `Kata Sandi`
9. kalau locale `en` hasilnya `Password`

## Flow Saat User Ganti Bahasa

Flow switch bahasa ada di component:

File: `src/components/LanguageSwitcher.vue`

Saat user klik tombol:

```vue
@click="setLocale(option.value)"
```

Maka:

1. `setLocale("id")` atau `setLocale("en")` dipanggil.
2. `useLocale.ts` update `locale.value`.
3. Locale baru disimpan ke `localStorage`.
4. `document.documentElement.lang` ikut diupdate.
5. Karena `locale` adalah reactive `ref`, semua computed/template yang pakai `text(...)` akan rerender.
6. UI langsung berubah tanpa reload page.

Potongan penting:

```ts
locale.value = normalizeLocale(nextLocale)
window.localStorage.setItem(localeStorageKey, locale.value)
```

## Placeholder / Parameter

Kalau text butuh value dinamis, pakai placeholder.

Contoh di dashboard:

```ts
text("dashboard.greeting.named", { name: user.value.full_name.trim() })
```

Di file translation:

```json
{
  "dashboard.greeting.named": {
    "en": "Dear, {name}",
    "id": "Yth. {name}"
  }
}
```

Flow-nya:

1. component kirim key + object param
2. `text()` ambil string template
3. `text()` ganti `{name}` dengan value yang dikirim

## Guard / Error Checking

`useLocale.ts` sekarang dibuat ketat.

Kalau ada masalah berikut:

- key tidak ada di file JSON
- locale `en` atau `id` kosong
- placeholder ada tapi param tidak dikirim

Maka:

1. `console.error` akan muncul
2. di mode development akan langsung `throw`

Tujuannya supaya masalah i18n ketahuan cepat, bukan diam-diam lolos.

## Cara Nambah Text Baru

Kalau ingin tambah text baru:

1. Tentukan domain file yang paling cocok.
   Contoh:
   - login-related ke `lang/login.json`
   - text umum ke `lang/common.json`
   - dashboard ke `lang/dashboard.json`
2. Tambah key baru di file JSON tersebut.
3. Pakai key itu di component dengan `text("nama.key")`.
4. Pastikan isi `en` dan `id` lengkap.

Contoh:

```json
{
  "login.actions.forgotPassword": {
    "en": "Forgot password?",
    "id": "Lupa kata sandi?"
  }
}
```

Lalu di component:

```vue
{{ text("login.actions.forgotPassword") }}
```

## Ringkasan Flow Singkat

Kalau disederhanakan:

`component/page` -> `useLocale().text(key)` -> `lang/index.ts` -> `lang/*.json` -> pilih `en/id` -> render ke UI

Contoh nyata:

`LoginPage.vue` -> `text("login.fields.password")` -> `useLocale.ts` -> `lang/index.ts` -> `lang/login.json` -> `Kata Sandi` atau `Password`
