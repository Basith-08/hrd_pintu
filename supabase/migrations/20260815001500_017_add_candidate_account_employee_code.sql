begin;

alter table if exists public.candidate_accounts
  add column if not exists employee_code text;

update public.candidate_accounts
set employee_code = coalesce(
  nullif(trim(employee_code), ''),
  nullif(trim(personal_data->>'employee_code'), '')
)
where coalesce(nullif(trim(employee_code), ''), '') = '';

commit;
