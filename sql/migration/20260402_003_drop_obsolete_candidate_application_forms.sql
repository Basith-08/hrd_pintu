-- ACTIVE CLEANUP
-- Migration cleanup ini menghapus tabel lama yang sudah tidak dipakai lagi setelah
-- pendekatan `candidate_application_forms` dan `application_documents` ditinggalkan.

begin;

drop table if exists public.application_documents;
drop table if exists public.candidate_application_forms;

commit;
