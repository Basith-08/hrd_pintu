-- ACTIVE / FINAL
-- Menambah mode portal `employee`, profil payroll employee, dan dokumen employee
-- di atas flow `candidate_form` yang sudah ada.

begin;

alter table if exists public.candidate_accounts
  add column if not exists portal_role text not null default 'candidate';

alter table if exists public.candidate_accounts
  drop constraint if exists candidate_accounts_portal_role_check;

alter table if exists public.candidate_accounts
  add constraint candidate_accounts_portal_role_check
  check (portal_role in ('candidate', 'employee'));

create table if not exists public.employee_payroll_profile (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid not null unique references public.candidate_form(id) on delete cascade,
  bank_name text,
  bank_account_number text,
  account_holder_name text,
  branch_name text,
  tax_identification_number text,
  bpjs_health_enrollment_preference text
    check (
      bpjs_health_enrollment_preference in ('willing_to_enroll', 'decline_enrollment')
      or bpjs_health_enrollment_preference is null
    ),
  bpjs_health_decline_reason text
    check (
      bpjs_health_decline_reason in ('pbi', 'self_registered', 'local_government', 'other')
      or bpjs_health_decline_reason is null
    ),
  bpjs_health_decline_reason_other text,
  bpjs_employment_status text
    check (
      bpjs_employment_status in ('cash_out_first', 'enroll_new', 'continue_existing')
      or bpjs_employment_status is null
    ),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid not null references public.candidate_form(id) on delete cascade,
  document_type text not null
    check (
      document_type in (
        'cv',
        'integrity_pact',
        'email_usage_policy',
        'identity_card',
        'family_card',
        'latest_diploma',
        'academic_transcript',
        'tax_id',
        'bpjs_health_card',
        'bpjs_health_statement',
        'bpjs_employment_card',
        'bank_account_book'
      )
    ),
  file_path text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint employee_documents_candidate_form_document_type_file_path_key
    unique (candidate_form_id, document_type, file_path)
);

create index if not exists idx_employee_documents_candidate_form_id
  on public.employee_documents(candidate_form_id);

do $$
declare
  target_table text;
  trigger_name text;
begin
  for target_table in
    select unnest(array['employee_payroll_profile', 'employee_documents'])
  loop
    trigger_name := 'trg_candidate_set_updated_at__' || target_table;

    execute format(
      'drop trigger if exists %I on public.%I',
      trigger_name,
      target_table
    );

    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      trigger_name,
      target_table
    );
  end loop;
end $$;

commit;
