-- IMPORTANT:
-- Apply this migration to the hrd_pintu database.
-- It updates the candidate-service source-of-truth table `public.employee_documents`,
-- not the hrd_ruang dashboard mirror tables.

begin;

alter table if exists public.employee_documents
drop constraint if exists employee_documents_document_type_check;

alter table if exists public.employee_documents
add constraint employee_documents_document_type_check
check (
  document_type in (
    'cv',
    'integrity_pact',
    'email_usage_policy',
    'identity_card',
    'family_card',
    'latest_diploma',
    'academic_transcript',
    'certificate_of_employment',
    'tax_id',
    'bpjs_health_card',
    'bpjs_health_statement',
    'bpjs_employment_card',
    'bank_account_book',
    'format_office',
    'skb'
  )
);

commit;
