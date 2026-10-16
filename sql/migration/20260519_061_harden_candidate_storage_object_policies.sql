begin;

create or replace function public.can_access_candidate_storage_object(bucket_name text, object_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      split_part(object_path, '/', 2) = auth.uid()::text
      or (
        bucket_name = 'candidate-photographs'
        and exists (
          select 1
          from public.candidate_form cf
          join public.candidate_accounts ca
            on ca.id = cf.candidate_account_id
          where cf.photograph = object_path
            and ca.identity_user_id = auth.uid()
        )
      )
      or (
        bucket_name = 'candidate-documents'
        and exists (
          select 1
          from public.employee_documents ed
          join public.candidate_form cf
            on cf.id = ed.candidate_form_id
          join public.candidate_accounts ca
            on ca.id = cf.candidate_account_id
          where ed.file_path = object_path
            and ca.identity_user_id = auth.uid()
        )
      )
    );
$$;

comment on function public.can_access_candidate_storage_object(text, text) is
  'Returns true when the authenticated candidate owns the storage object path directly or via a linked candidate record.';

create or replace function public.can_write_candidate_storage_object(bucket_name text, object_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and split_part(object_path, '/', 2) = auth.uid()::text
    and (
      (
        bucket_name = 'candidate-photographs'
        and split_part(object_path, '/', 1) = 'candidate-forms'
      )
      or (
        bucket_name = 'candidate-documents'
        and split_part(object_path, '/', 1) in ('employee-forms', 'candidate-forms')
      )
    );
$$;

comment on function public.can_write_candidate_storage_object(text, text) is
  'Returns true when the authenticated candidate writes into an allowed storage prefix owned by auth.uid().';

drop policy if exists "candidate_photographs_storage_select" on storage.objects;
create policy "candidate_photographs_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'candidate-photographs'
  and public.can_access_candidate_storage_object(bucket_id, name)
);

drop policy if exists "candidate_photographs_storage_insert" on storage.objects;
create policy "candidate_photographs_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'candidate-photographs'
  and public.can_write_candidate_storage_object(bucket_id, name)
);

drop policy if exists "candidate_photographs_storage_update" on storage.objects;
create policy "candidate_photographs_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'candidate-photographs'
  and public.can_write_candidate_storage_object(bucket_id, name)
)
with check (
  bucket_id = 'candidate-photographs'
  and public.can_write_candidate_storage_object(bucket_id, name)
);

drop policy if exists "employee_documents_storage_select" on storage.objects;
create policy "employee_documents_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'candidate-documents'
  and public.can_access_candidate_storage_object(bucket_id, name)
);

drop policy if exists "employee_documents_storage_insert" on storage.objects;
create policy "employee_documents_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'candidate-documents'
  and public.can_write_candidate_storage_object(bucket_id, name)
);

drop policy if exists "employee_documents_storage_update" on storage.objects;
create policy "employee_documents_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'candidate-documents'
  and public.can_write_candidate_storage_object(bucket_id, name)
)
with check (
  bucket_id = 'candidate-documents'
  and public.can_write_candidate_storage_object(bucket_id, name)
);

commit;
