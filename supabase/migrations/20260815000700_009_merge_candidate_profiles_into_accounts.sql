alter table if exists public.candidate_accounts
  add column if not exists full_name text;

alter table if exists public.candidate_accounts
  add column if not exists phone text;

alter table if exists public.candidate_accounts
  add column if not exists personal_data jsonb not null default '{}'::jsonb;

update public.candidate_accounts as accounts
set
  full_name = coalesce(nullif(trim(profiles.full_name), ''), accounts.full_name),
  phone = coalesce(nullif(trim(profiles.phone), ''), accounts.phone),
  personal_data = coalesce(accounts.personal_data, '{}'::jsonb) || coalesce(profiles.personal_data, '{}'::jsonb)
from public.candidate_profiles as profiles
where profiles.candidate_account_id = accounts.id;

drop policy if exists "candidate_profiles_select_self" on public.candidate_profiles;

drop table if exists public.candidate_profiles;
