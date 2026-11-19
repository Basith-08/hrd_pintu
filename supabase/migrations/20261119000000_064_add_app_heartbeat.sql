begin;

create table public.app_heartbeat (
  id integer primary key check (id = 1),
  last_ping_at timestamptz not null
);

alter table public.app_heartbeat enable row level security;

-- No client policies. Revoke default grants as well as PUBLIC privileges.
revoke all on table public.app_heartbeat from public, anon, authenticated;
grant select, insert, update on table public.app_heartbeat to service_role;

commit;
