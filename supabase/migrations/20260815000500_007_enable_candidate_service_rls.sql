-- ACTIVE / FINAL
-- Mengaktifkan RLS untuk tabel aktif `hrd_pintu` yang sebelumnya masih
-- `UNRESTRICTED`. Policy dibuat konservatif: kandidat hanya bisa membaca
-- row miliknya sendiri, sementara backend tetap memakai service role.

begin;

create or replace function public.current_candidate_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ca.id
  from public.candidate_accounts ca
  where ca.identity_user_id = auth.uid()
  limit 1;
$$;

comment on function public.current_candidate_account_id() is
  'Returns the candidate_accounts.id that belongs to auth.uid().';

create or replace function public.can_access_candidate_account(candidate_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and candidate_account_id = public.current_candidate_account_id();
$$;

comment on function public.can_access_candidate_account(uuid) is
  'Returns true when the candidate account belongs to auth.uid().';

create or replace function public.candidate_application_owner(candidate_application_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select app.candidate_account_id
  from public.candidate_applications app
  where app.id = candidate_application_id
  limit 1;
$$;

create or replace function public.can_access_candidate_application(candidate_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_candidate_account(
    public.candidate_application_owner(candidate_application_id)
  );
$$;

comment on function public.can_access_candidate_application(uuid) is
  'Returns true when the candidate application belongs to auth.uid().';

create or replace function public.candidate_form_owner(candidate_form_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cf.candidate_account_id
  from public.candidate_form cf
  where cf.id = candidate_form_id
  limit 1;
$$;

create or replace function public.can_access_candidate_form(candidate_form_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_candidate_account(
    public.candidate_form_owner(candidate_form_id)
  );
$$;

comment on function public.can_access_candidate_form(uuid) is
  'Returns true when the candidate form belongs to auth.uid().';

alter table if exists public.candidate_accounts enable row level security;
drop policy if exists "candidate_accounts_select_self" on public.candidate_accounts;
create policy "candidate_accounts_select_self"
on public.candidate_accounts
for select
to authenticated
using (
  public.can_access_candidate_account(id)
);

alter table if exists public.candidate_profiles enable row level security;
drop policy if exists "candidate_profiles_select_self" on public.candidate_profiles;
create policy "candidate_profiles_select_self"
on public.candidate_profiles
for select
to authenticated
using (
  public.can_access_candidate_account(candidate_account_id)
);

alter table if exists public.candidate_applications enable row level security;
drop policy if exists "candidate_applications_select_self" on public.candidate_applications;
create policy "candidate_applications_select_self"
on public.candidate_applications
for select
to authenticated
using (
  public.can_access_candidate_account(candidate_account_id)
);

alter table if exists public.candidate_status_events enable row level security;
drop policy if exists "candidate_status_events_select_self" on public.candidate_status_events;
create policy "candidate_status_events_select_self"
on public.candidate_status_events
for select
to authenticated
using (
  public.can_access_candidate_account(candidate_account_id)
  or public.can_access_candidate_application(application_id)
);

alter table if exists public.candidate_form enable row level security;
drop policy if exists "candidate_form_select_self" on public.candidate_form;
create policy "candidate_form_select_self"
on public.candidate_form
for select
to authenticated
using (
  public.can_access_candidate_account(candidate_account_id)
);

alter table if exists public.candidate_languages enable row level security;
drop policy if exists "candidate_languages_select_self" on public.candidate_languages;
create policy "candidate_languages_select_self"
on public.candidate_languages
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.candidate_references enable row level security;
drop policy if exists "candidate_references_select_self" on public.candidate_references;
create policy "candidate_references_select_self"
on public.candidate_references
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.candidate_skills enable row level security;
drop policy if exists "candidate_skills_select_self" on public.candidate_skills;
create policy "candidate_skills_select_self"
on public.candidate_skills
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.education enable row level security;
drop policy if exists "education_select_self" on public.education;
create policy "education_select_self"
on public.education
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.family_and_emergency enable row level security;
drop policy if exists "family_and_emergency_select_self" on public.family_and_emergency;
create policy "family_and_emergency_select_self"
on public.family_and_emergency
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.personal_statement enable row level security;
drop policy if exists "personal_statement_select_self" on public.personal_statement;
create policy "personal_statement_select_self"
on public.personal_statement
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.work_history enable row level security;
drop policy if exists "work_history_select_self" on public.work_history;
create policy "work_history_select_self"
on public.work_history
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.employee_payroll_profile enable row level security;
drop policy if exists "employee_payroll_profile_select_self" on public.employee_payroll_profile;
create policy "employee_payroll_profile_select_self"
on public.employee_payroll_profile
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

alter table if exists public.employee_documents enable row level security;
drop policy if exists "employee_documents_select_self" on public.employee_documents;
create policy "employee_documents_select_self"
on public.employee_documents
for select
to authenticated
using (
  public.can_access_candidate_form(candidate_form_id)
);

commit;
