begin;

do $$
begin
  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_form'
      and column_name in ('first_name', 'middle_name', 'last_name')
  ) = 3 then
    execute $sql$
      update public.candidate_form
      set full_name = coalesce(
        nullif(trim(full_name), ''),
        nullif(trim(concat_ws(' ', first_name, middle_name, last_name)), '')
      )
      where coalesce(nullif(trim(full_name), ''), '') = ''
        and coalesce(
          nullif(trim(first_name), ''),
          nullif(trim(middle_name), ''),
          nullif(trim(last_name), '')
        ) is not null
    $sql$;
  end if;
end;
$$;

alter table if exists public.candidate_form
  drop column if exists first_name,
  drop column if exists middle_name,
  drop column if exists last_name;

commit;
