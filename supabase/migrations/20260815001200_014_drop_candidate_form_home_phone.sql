begin;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'candidate_form' and column_name = 'home_phone'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'candidate_form' and column_name = 'phone_number'
  ) then
    execute $sql$
      update public.candidate_form
      set phone_number = coalesce(nullif(trim(phone_number), ''), nullif(trim(home_phone), ''))
      where coalesce(nullif(trim(phone_number), ''), '') = ''
        and coalesce(nullif(trim(home_phone), ''), '') <> ''
    $sql$;
  end if;
end;
$$;

alter table if exists public.candidate_form
  drop column if exists home_phone;

commit;
