-- ACTIVE / FINAL
-- Menambah index pendukung query utama dan RLS di database `hrd_pintu`.
--
-- Catatan:
-- - index untuk `candidate_accounts.identity_user_id`, `candidate_accounts.email`,
--   `candidate_applications(candidate_account_id, erf_id)`, `candidate_form.application_id`,
--   `personal_statement.candidate_form_id`, dan `employee_payroll_profile.candidate_form_id`
--   sudah otomatis tersedia lewat UNIQUE constraint / PRIMARY KEY yang ada.
-- - migration ini fokus pada pola akses yang memang dipakai service saat ini:
--   list account terbaru, list application per candidate, lookup form terbaru per candidate,
--   dan akses child table berdasarkan `candidate_form_id`.

begin;

create index if not exists idx_candidate_accounts_created_at_desc
  on public.candidate_accounts (created_at desc);

create index if not exists idx_candidate_applications_candidate_account_id_created_at_desc
  on public.candidate_applications (candidate_account_id, created_at desc);

create index if not exists idx_candidate_form_candidate_account_id_updated_at_desc
  on public.candidate_form (candidate_account_id, updated_at desc);

create index if not exists idx_candidate_languages_candidate_form_id
  on public.candidate_languages (candidate_form_id);

create index if not exists idx_candidate_references_candidate_form_id
  on public.candidate_references (candidate_form_id);

create index if not exists idx_candidate_skills_candidate_form_id
  on public.candidate_skills (candidate_form_id);

create index if not exists idx_education_candidate_form_id
  on public.education (candidate_form_id);

create index if not exists idx_family_and_emergency_candidate_form_id
  on public.family_and_emergency (candidate_form_id);

create index if not exists idx_work_history_candidate_form_id
  on public.work_history (candidate_form_id);

commit;
