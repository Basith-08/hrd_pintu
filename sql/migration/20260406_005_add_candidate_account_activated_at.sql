-- ACTIVE / FINAL
-- Adds `activated_at` to candidate accounts so the 3-day access window
-- can be reset from the latest activation timestamp.

begin;

alter table if exists public.candidate_accounts
  add column if not exists activated_at timestamp with time zone;

update public.candidate_accounts
set activated_at = created_at
where activated_at is null;

commit;
