begin;

alter table if exists public.candidate_accounts
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

update public.candidate_accounts
set
  created_by = coalesce(created_by, created_by_internal_user_id),
  updated_by = coalesce(updated_by, created_by, created_by_internal_user_id)
where created_by is null
   or updated_by is null;

commit;
