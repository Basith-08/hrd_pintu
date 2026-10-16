-- ACTIVE / FINAL EXTENSION
-- Ubah `candidate_form.notice_period` menjadi tipe `date` agar konsisten
-- dengan input kandidat yang kini menggunakan date picker.

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_form'
      and column_name = 'notice_period'
      and data_type in ('character varying', 'text')
  ) then
    alter table public.candidate_form
      alter column notice_period type date
      using (
        case
          when notice_period is null then null
          when btrim(notice_period) = '' then null
          when btrim(notice_period) ~ '^\d{4}-\d{2}-\d{2}$' then btrim(notice_period)::date
          else null
        end
      );
  end if;
end;
$$;

commit;
