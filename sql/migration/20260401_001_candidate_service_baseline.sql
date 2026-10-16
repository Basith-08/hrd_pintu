-- ACTIVE / FINAL BASELINE
-- Ini adalah baseline utama database `hrd_pintu` untuk akun, profil, application,
-- dan event sinkronisasi kandidat.

begin;

create extension if not exists pgcrypto;

create table if not exists public.candidate_accounts (
  id uuid primary key default gen_random_uuid(),
  identity_user_id uuid not null unique,
  email text not null unique,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'revoked')),
  created_by_internal_user_id uuid,
  last_login_at timestamp with time zone,
  activated_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.candidate_profiles (
  candidate_account_id uuid primary key references public.candidate_accounts(id) on delete cascade,
  full_name text,
  phone text,
  personal_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.candidate_applications (
  id uuid primary key default gen_random_uuid(),
  candidate_account_id uuid not null references public.candidate_accounts(id) on delete cascade,
  erf_id uuid not null,
  status text not null default 'draft',
  job_snapshot jsonb not null default '{}'::jsonb,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint candidate_applications_candidate_account_erf_key unique (candidate_account_id, erf_id)
);

create table if not exists public.candidate_status_events (
  id uuid primary key default gen_random_uuid(),
  candidate_account_id uuid references public.candidate_accounts(id) on delete cascade,
  application_id uuid references public.candidate_applications(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'delivered')),
  delivery_error text,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target_table text;
  trigger_name text;
begin
  for target_table in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and t.table_type = 'BASE TABLE'
      and c.table_name in (
        'candidate_accounts',
        'candidate_profiles',
        'candidate_applications',
        'candidate_status_events'
      )
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
