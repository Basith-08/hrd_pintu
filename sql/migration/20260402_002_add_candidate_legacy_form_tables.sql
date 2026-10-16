-- ACTIVE / FINAL EXTENSION
-- Migration ini menambah tabel form kandidat dan child tables yang menjadi source of truth
-- detail form kandidat di `hrd_pintu`.

begin;

create table if not exists public.candidate_form (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.candidate_applications(id) on delete cascade,
  candidate_account_id uuid not null references public.candidate_accounts(id) on delete cascade,
  employee_request_form_id uuid,
  candidate_id uuid,
  date_candidate_form date,
  notice_period date,
  full_name text,
  hire_location text,
  date_of_birth date,
  place_of_birth text,
  nationality text,
  marital_status text check (marital_status in ('Single', 'Married', 'Divorced') or marital_status is null),
  religion text,
  gender text check (gender in ('Male', 'Female') or gender is null),
  ethnic text,
  blood_type text check (blood_type in ('A', 'B', 'AB', 'O') or blood_type is null),
  id_card_address text,
  residential_address text,
  personal_email text,
  instagram text,
  linkedin text,
  phone_number text,
  id_type text,
  id_no text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  photograph text,
  completion_status text not null default 'in_progress'
    check (completion_status in ('in_progress', 'completed')),
  available_start_date date,
  join_date date,
  transportation_type text,
  transportation_ownership text,
  residence_ownership text
);

create table if not exists public.candidate_languages (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid not null references public.candidate_form(id) on delete cascade,
  language_name text not null,
  speaking text check (speaking in ('good', 'fair', 'poor') or speaking is null),
  reading text check (reading in ('good', 'fair', 'poor') or reading is null),
  listening text check (listening in ('good', 'fair', 'poor') or listening is null),
  writing text check (writing in ('good', 'fair', 'poor') or writing is null),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.candidate_references (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid not null references public.candidate_form(id) on delete cascade,
  name text not null,
  phone_number text,
  relationship text,
  position text,
  reference_order integer check (reference_order is null or reference_order > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid not null references public.candidate_form(id) on delete cascade,
  skill_name text not null,
  description text,
  skill_order integer check (skill_order is null or skill_order > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid references public.candidate_form(id) on delete cascade,
  level text check (
    level in (
      'SD / Sederajat',
      'SMP / MTs / Sederajat',
      'SMA / SMK / MA / Sederajat',
      'Diploma I (D1)',
      'Diploma II (D2)',
      'Diploma III (D3)',
      'Diploma IV (D4)',
      'Sarjana (S1)',
      'Magister (S2)',
      'Doktor (S3)'
    ) or level is null
  ),
  institution text,
  city text,
  major text,
  from_year integer,
  to_year integer,
  category text,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.family_and_emergency (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid references public.candidate_form(id) on delete cascade,
  name text,
  relationship text,
  gender text check (gender in ('Male', 'Female') or gender is null),
  place_and_date_of_birth text,
  education text,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  occupation text,
  remarks text,
  category text
);

create table if not exists public.personal_statement (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid unique references public.candidate_form(id) on delete cascade,
  contract boolean,
  contract_period text,
  reference_check_reason text,
  business_trip boolean,
  expected_salary numeric,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  previous_application boolean,
  previous_application_details text,
  reference_check_allowed boolean,
  family_or_friend_in_company boolean,
  serious_illness boolean,
  serious_illness_details text,
  serious_accident_boolean boolean,
  psychological_test boolean,
  psychological_test_location text,
  psychological_test_purpose text,
  company_legal_issue boolean,
  company_legal_issue_details text,
  family_or_friend_details text,
  serious_accident_details text,
  civil_or_criminal_case boolean,
  civil_or_criminal_case_details text
);

create table if not exists public.work_history (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid references public.candidate_form(id) on delete cascade,
  company text,
  position text,
  from_year integer,
  to_year integer,
  reason_to_quitting text,
  last_salary numeric,
  benefit text,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  company_address text,
  company_phone text,
  direct_superior_title text,
  organization_structure text
);

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
        'candidate_form',
        'candidate_languages',
        'candidate_references',
        'candidate_skills',
        'education',
        'family_and_emergency',
        'personal_statement',
        'work_history'
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
