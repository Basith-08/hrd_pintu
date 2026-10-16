# 12 Component Documentation

> Last verified against current repository state: 2026-06-23

## Gambaran Umum

Komponen repo ini terbagi menjadi dua kelompok:

1. komponen reusable di `src/components`
2. komponen fitur aplikasi di `src/features/*`

Mayoritas komponen form lamaran bersifat presentational dan menerima `page: Record<string, any>` dari `useCandidateApplicationFormPage()`.

## Reusable Components

| Component | Fungsi | Props | Emits | Slots | Dipakai di |
| --- | --- | --- | --- | --- | --- |
| `AppButton` | tombol seragam | `disabled`, `type`, `variant` | `click` | default | semua halaman |
| `AppCheckboxCard` | checkbox card | `modelValue`, `label`, `disabled` | `update:modelValue` | default | personal statement |
| `AppDocumentChip` | chip file terpilih/tersimpan | `label`, `removeLabel`, `disabled`, `selected` | `remove` | - | dokumen aplikasi |
| `AppFieldGroup` | wrapper label field | `label`, `full`, `educationFull` | - | default | semua form |
| `AppFormSection` | section form + actions slot | `title`, `description`, `note` | - | default, `actions` | semua section form |
| `AppNestedCard` | card dalam section | `contentClass`, `document` | - | default, `header`, `footer` | section dokumen/riwayat |
| `AppSelectField` | select field | `modelValue`, `options`, `placeholder`, `emptyValue`, `valueType` | `update:modelValue` | - | semua select |
| `AppTextField` | text/number/date input | `label`, `modelValue`, `type`, `min`, `valueType`, `placeholder`, `autocomplete`, `required`, `disabled`, `full`, `educationFull`, `muted`, `readonly` | `update:modelValue` | - | semua form |
| `AppTextareaField` | textarea | `label`, `modelValue`, `placeholder`, `full`, `educationFull` | `update:modelValue` | - | semua form |
| `LanguageSwitcher` | switch locale EN/ID | - | - | - | layout dan login |

## Komponen Fitur Halaman

| Component | Fungsi | Props | Emits | Mapping halaman |
| --- | --- | --- | --- | --- |
| `LoginPage` | form login | - | - | `/login` |
| `DashboardPage` | dashboard profile + applications | - | - | `/dashboard` |
| `ProfilePage` | profil + ganti password | - | - | `/profile` |
| `CandidateApplicationFormPage` | shell halaman form lamaran | - | - | `/applications/:applicationId/form` |

## Komponen Aplikasi Kandidat/Employee

| Component | Fungsi | Props | Emits | Ketergantungan |
| --- | --- | --- | --- | --- |
| `ApplicationDocumentsSection` | wrapper daftar kartu dokumen kandidat/employee | `page` | - | `ApplicationDocumentCard`, `AppFormSection` |
| `ApplicationDocumentCard` | upload satu tipe dokumen dan buka preview template bila tersedia | `page`, `row`, `isBusy` | - | `AppNestedCard`, `AppDocumentChip` |
| `CandidateApplicationCandidateSections` | menyusun seluruh section kandidat per step wizard | `page`, `stepKey` | - | seluruh section kandidat |
| `CandidateApplicationDataSection` | data aplikasi | `page` | - | `AppTextField`, `AppFormSection` |
| `CandidateApplicationFormActions` | tombol save/submit | `page` | - | `AppButton` |
| `CandidateContactIdentitySection` | alamat/kontak/identitas | `page` | - | `AppTextField`, `AppTextareaField` |
| `CandidateEducationTrainingSection` | pendidikan formal/non-formal | `page` | - | `CandidateFormalEducationRow`, `CandidateTrainingEducationRow` |
| `CandidateEmploymentHistorySection` | riwayat kerja | `page` | - | `AppTextField`, `AppSelectField` |
| `CandidateFamilyEmergencySection` | keluarga dan emergency contact | `page` | - | `AppSelectField`, `AppTextareaField` |
| `CandidateFormalEducationRow` | satu baris pendidikan formal | `page`, `row` | - | `AppTextField`, `AppSelectField` |
| `CandidateTrainingEducationRow` | satu baris training/non-formal | `page`, `entry` | `remove` | `AppTextField`, `AppTextareaField` |
| `CandidateMobilityResidenceSection` | mobilitas/tempat tinggal | `page` | - | `AppSelectField`, `AppTextField` |
| `CandidatePersonalDataSection` | data pribadi + upload foto | `page` | - | `AppSelectField`, input file |
| `CandidatePersonalStatementSection` | pernyataan personal | `page` | - | `AppCheckboxCard`, `AppTextareaField` |
| `CandidateReferencesSection` | referensi kandidat | `page` | - | `AppTextField`, `AppButton` |
| `CandidateSkillsAbilitiesSection` | bahasa + skill lain | `page` | - | `AppSelectField`, `AppTextareaField` |
| `EmployeePayrollSection` | payroll & BPJS employee | `page` | - | `AppSelectField`, `AppTextField` |

## State Internal Yang Penting

| Component | State internal |
| --- | --- |
| `LoginPage` | `email`, `password`, `showPassword` |
| `ProfilePage` | password fields, toast sukses, timer dismiss |
| `CandidateApplicationFormPage` | state utama tidak disimpan di komponen, tetapi di `useCandidateApplicationFormPage()` |
| `ApplicationDocumentCard` | tidak menyimpan state sendiri; bergantung ke `page.row` |

## Component Dependency Pattern

Pola paling dominan:

1. page component memanggil composable/viewmodel
2. composable mengembalikan object `page`
3. child components menerima `page`
4. child components memanggil method/field di `page`

Kelebihan:

- state terpusat
- child component tipis

Trade-off:

- typing `Record<string, any>` membuat kontrak props longgar
- reuse lintas halaman menjadi lebih sulit

### Penandaan Field Wajib (`requiredLabel`)

Seluruh section kandidat (`CandidateContactIdentitySection`, `CandidateEmploymentHistorySection`, `CandidateFamilyEmergencySection`, `CandidateMobilityResidenceSection`, `CandidatePersonalDataSection`, `CandidatePersonalStatementSection`, `CandidateReferencesSection`, dll.) memanggil `page.requiredLabel(label)` untuk menambahkan suffix `" *"` pada label field yang wajib diisi sebelum submit. Field wajib ini selaras dengan kondisi yang dicek `canSubmitForm` (lihat docs/10-feature-flow.md dan docs/16-error-handling.md). `CandidateReferencesSection` juga menampilkan keterangan minimal 2 referensi lengkap.

## Contoh Penggunaan

### `AppButton`

```vue
<AppButton type="submit" variant="primary" :disabled="isLoading">
  Submit
</AppButton>
```

### `ApplicationDocumentsSection`

```vue
<ApplicationDocumentsSection :page="page" />
```

### `CandidateTrainingEducationRow`

```vue
<CandidateTrainingEducationRow
  :entry="entry"
  :page="page"
  @remove="page.removeEducationItem(entry.formIndex)"
/>
```

## Mapping Component Ke Halaman

| Halaman | Komponen utama |
| --- | --- |
| `/login` | `LoginPage`, `AppTextField`, `AppButton`, `LanguageSwitcher` |
| `/dashboard` | `DashboardPage`, `AppButton` |
| `/profile` | `ProfilePage`, `AppFieldGroup`, `AppButton` |
| `/applications/:applicationId/form` | `CandidateApplicationFormPage`, section kandidat/employee, `ApplicationDocumentsSection`, `CandidateApplicationFormActions` |
