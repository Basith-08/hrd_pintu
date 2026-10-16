# 11 UI Pages Documentation

> Last verified against current repository state: 2026-06-23

## Daftar Halaman

| File | Route | Public | Fungsi |
| --- | --- | --- | --- |
| `src/pages/index.vue` | `/` | Tidak | redirect ke `/dashboard` atau `/login` |
| `src/pages/login.vue` | `/login` | Ya | login kandidat/employee |
| `src/pages/dashboard.vue` | `/dashboard` | Tidak | ringkasan akun dan daftar aplikasi |
| `src/pages/profile.vue` | `/profile` | Tidak | profil akun + ganti password |
| `src/pages/applications/[applicationId]/form.vue` | `/applications/:applicationId/form` | Tidak | form lamaran kandidat/employee |

## Detail Per Halaman

### `/`

| Item | Keterangan |
| --- | --- |
| Fungsi halaman | melakukan redirect berdasarkan status auth |
| Role yang boleh mengakses | semua; tetapi langsung redirect |
| Data yang digunakan | `authStore.isAuthenticated` |
| Component yang dipakai | tidak ada template visual |
| Action utama | `navigateTo("/dashboard" | "/login")` |
| Empty state | tidak relevan |
| Loading state | menunggu `initAuth()` |
| Error state | tidak ada state error khusus |

### `/login`

| Item | Keterangan |
| --- | --- |
| Fungsi halaman | autentikasi user |
| Role yang boleh mengakses | public; user login akan diarahkan ke `/dashboard` |
| Data yang digunakan | `authStore.error`, `authStore.isLoading` |
| Component yang dipakai | `LoginPage`, `AppTextField`, `AppButton`, `LanguageSwitcher` |
| Action utama | submit login |
| Empty state | tidak relevan |
| Loading state | tombol disabled + label processing |
| Error state | pesan error login di bawah field |

### `/dashboard`

| Item | Keterangan |
| --- | --- |
| Fungsi halaman | menampilkan summary akun dan daftar aplikasi |
| Role yang boleh mengakses | `candidate`, `employee` |
| Data yang digunakan | `user`, `applications`, `status`, `last_login_at` |
| Component yang dipakai | `DashboardPage`, `AppButton`, `NuxtLink` |
| Action utama | buka profil, logout, buka form lamaran |
| Empty state | tampil bila `applications.length === 0` |
| Loading state | tidak ada skeleton khusus; bergantung pada init auth sebelum route masuk |
| Error state | tidak ada state error render khusus |

### `/profile`

| Item | Keterangan |
| --- | --- |
| Fungsi halaman | menampilkan info akun dan form ganti password |
| Role yang boleh mengakses | `candidate`, `employee` |
| Data yang digunakan | `user`, `error`, `isChangingPassword` |
| Component yang dipakai | `ProfilePage`, `AppFieldGroup`, `AppButton` |
| Action utama | ganti password, kembali ke dashboard |
| Empty state | tidak relevan |
| Loading state | tombol update password disabled saat proses |
| Error state | pesan error form password |

### `/applications/:applicationId/form`

| Item | Keterangan |
| --- | --- |
| Fungsi halaman | wizard form multi-step untuk edit, simpan, submit form lamaran |
| Role yang boleh mengakses | `candidate`, `employee` pemilik aplikasi |
| Data yang digunakan | `formRecord`, `form`, `error`, `isLoading`, `isSaving`, `isSubmitting`, `uploading*` |
| Component yang dipakai | `CandidateApplicationFormPage` dan seluruh komponen form lamaran |
| Action utama | navigasi step wizard, save draft, submit, upload foto, upload dokumen, buka preview template dokumen employee |
| Empty state | tidak ada halaman empty terpisah; child section tertentu punya empty state |
| Loading state | overlay full-page saat `load/save/submit/upload` berjalan |
| Error state | pesan error global di atas form |
| Success state | toast sukses setelah save draft |

## Akses Role Halaman

| Route | Candidate | Employee | Catatan |
| --- | --- | --- | --- |
| `/login` | Ya | Ya | redirect jika sudah login |
| `/dashboard` | Ya | Ya | tampilan berbeda sesuai role |
| `/profile` | Ya | Ya | teks header berbeda sesuai role |
| `/applications/:applicationId/form` | Ya | Ya | section form berbeda sesuai role |

## Data Source Per Halaman

| Halaman | Data source utama |
| --- | --- |
| `/login` | Supabase Auth client |
| `/dashboard` | `/auth/profile` |
| `/profile` | `/auth/profile` + Supabase Auth update password |
| `/applications/:applicationId/form` | `/auth/applications/:applicationId/form` |
