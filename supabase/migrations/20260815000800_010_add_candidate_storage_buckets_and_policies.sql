-- ACTIVE / FINAL
-- Menambah bucket storage aktif untuk `hrd_pintu`:
-- - `candidate-photographs` dipakai oleh `public.candidate_form.photograph`
-- - `candidate-documents` dipakai oleh `public.employee_documents.file_path`

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photographs',
  'candidate-photographs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "candidate_photographs_storage_select" on storage.objects;
create policy "candidate_photographs_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'candidate-photographs'
);

drop policy if exists "candidate_photographs_storage_insert" on storage.objects;
create policy "candidate_photographs_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'candidate-photographs'
  and name like 'candidate-forms/%'
);

drop policy if exists "candidate_photographs_storage_update" on storage.objects;
create policy "candidate_photographs_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'candidate-photographs'
)
with check (
  bucket_id = 'candidate-photographs'
  and name like 'candidate-forms/%'
);

drop policy if exists "employee_documents_storage_select" on storage.objects;
create policy "employee_documents_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'candidate-documents'
);

drop policy if exists "employee_documents_storage_insert" on storage.objects;
create policy "employee_documents_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'candidate-documents'
  and (
    name like 'employee-forms/%'
    or name like 'candidate-forms/%'
  )
);

drop policy if exists "employee_documents_storage_update" on storage.objects;
create policy "employee_documents_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'candidate-documents'
)
with check (
  bucket_id = 'candidate-documents'
  and (
    name like 'employee-forms/%'
    or name like 'candidate-forms/%'
  )
);

commit;
