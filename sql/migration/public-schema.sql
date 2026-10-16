


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."can_access_candidate_account"("candidate_account_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() is not null
    and candidate_account_id = public.current_candidate_account_id();
$$;


ALTER FUNCTION "public"."can_access_candidate_account"("candidate_account_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_candidate_account"("candidate_account_id" "uuid") IS 'Returns true when the candidate account belongs to auth.uid().';



CREATE OR REPLACE FUNCTION "public"."can_access_candidate_application"("candidate_application_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.can_access_candidate_account(
    public.candidate_application_owner(candidate_application_id)
  );
$$;


ALTER FUNCTION "public"."can_access_candidate_application"("candidate_application_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_candidate_application"("candidate_application_id" "uuid") IS 'Returns true when the candidate application belongs to auth.uid().';



CREATE OR REPLACE FUNCTION "public"."can_access_candidate_form"("candidate_form_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.can_access_candidate_account(
    public.candidate_form_owner(candidate_form_id)
  );
$$;


ALTER FUNCTION "public"."can_access_candidate_form"("candidate_form_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_candidate_form"("candidate_form_id" "uuid") IS 'Returns true when the candidate form belongs to auth.uid().';



CREATE OR REPLACE FUNCTION "public"."can_access_candidate_storage_object"("bucket_name" "text", "object_path" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."can_access_candidate_storage_object"("bucket_name" "text", "object_path" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_candidate_storage_object"("bucket_name" "text", "object_path" "text") IS 'Returns true when the authenticated candidate owns the storage object path directly or via a linked candidate record.';



CREATE OR REPLACE FUNCTION "public"."can_write_candidate_storage_object"("bucket_name" "text", "object_path" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."can_write_candidate_storage_object"("bucket_name" "text", "object_path" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_write_candidate_storage_object"("bucket_name" "text", "object_path" "text") IS 'Returns true when the authenticated candidate writes into an allowed storage prefix owned by auth.uid().';



CREATE OR REPLACE FUNCTION "public"."candidate_application_owner"("candidate_application_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select app.candidate_account_id
  from public.candidate_applications app
  where app.id = candidate_application_id
  limit 1;
$$;


ALTER FUNCTION "public"."candidate_application_owner"("candidate_application_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."candidate_form_owner"("candidate_form_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select cf.candidate_account_id
  from public.candidate_form cf
  where cf.id = candidate_form_id
  limit 1;
$$;


ALTER FUNCTION "public"."candidate_form_owner"("candidate_form_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_candidate_account_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select ca.id
  from public.candidate_accounts ca
  where ca.identity_user_id = auth.uid()
  limit 1;
$$;


ALTER FUNCTION "public"."current_candidate_account_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_candidate_account_id"() IS 'Returns the candidate_accounts.id that belongs to auth.uid().';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."candidate_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identity_user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by_internal_user_id" "uuid",
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "activated_at" timestamp with time zone,
    "portal_role" "text" DEFAULT 'candidate'::"text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "personal_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "employee_code" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "candidate_accounts_portal_role_check" CHECK (("portal_role" = ANY (ARRAY['candidate'::"text", 'employee'::"text"]))),
    CONSTRAINT "candidate_accounts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."candidate_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidate_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_account_id" "uuid" NOT NULL,
    "erf_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "job_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."candidate_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidate_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "candidate_account_id" "uuid" NOT NULL,
    "employee_request_form_id" "uuid",
    "candidate_id" "uuid",
    "date_candidate_form" "date",
    "notice_period" "date",
    "hire_location" "text",
    "date_of_birth" "date",
    "place_of_birth" "text",
    "nationality" "text",
    "marital_status" "text",
    "religion" "text",
    "gender" "text",
    "ethnic" "text",
    "blood_type" "text",
    "id_card_address" "text",
    "residential_address" "text",
    "personal_email" "text",
    "instagram" "text",
    "linkedin" "text",
    "phone_number" "text",
    "id_type" "text",
    "id_no" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "photograph" "text",
    "completion_status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "available_start_date" "date",
    "join_date" "date",
    "transportation_type" "text",
    "transportation_ownership" "text",
    "residence_ownership" "text",
    "full_name" "text",
    CONSTRAINT "candidate_form_blood_type_check" CHECK ((("blood_type" = ANY (ARRAY['A'::"text", 'B'::"text", 'AB'::"text", 'O'::"text"])) OR ("blood_type" IS NULL))),
    CONSTRAINT "candidate_form_completion_status_check" CHECK (("completion_status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"]))),
    CONSTRAINT "candidate_form_gender_check" CHECK ((("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text"])) OR ("gender" IS NULL))),
    CONSTRAINT "candidate_form_marital_status_check" CHECK ((("marital_status" = ANY (ARRAY['Single'::"text", 'Married'::"text", 'Divorced'::"text"])) OR ("marital_status" IS NULL)))
);


ALTER TABLE "public"."candidate_form" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidate_languages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid" NOT NULL,
    "language_name" "text" NOT NULL,
    "speaking" "text",
    "reading" "text",
    "listening" "text",
    "writing" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "candidate_languages_listening_check" CHECK ((("listening" = ANY (ARRAY['good'::"text", 'fair'::"text", 'poor'::"text"])) OR ("listening" IS NULL))),
    CONSTRAINT "candidate_languages_reading_check" CHECK ((("reading" = ANY (ARRAY['good'::"text", 'fair'::"text", 'poor'::"text"])) OR ("reading" IS NULL))),
    CONSTRAINT "candidate_languages_speaking_check" CHECK ((("speaking" = ANY (ARRAY['good'::"text", 'fair'::"text", 'poor'::"text"])) OR ("speaking" IS NULL))),
    CONSTRAINT "candidate_languages_writing_check" CHECK ((("writing" = ANY (ARRAY['good'::"text", 'fair'::"text", 'poor'::"text"])) OR ("writing" IS NULL)))
);


ALTER TABLE "public"."candidate_languages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidate_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone_number" "text",
    "relationship" "text",
    "position" "text",
    "reference_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "candidate_references_reference_order_check" CHECK ((("reference_order" IS NULL) OR ("reference_order" > 0)))
);


ALTER TABLE "public"."candidate_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidate_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid" NOT NULL,
    "skill_name" "text" NOT NULL,
    "description" "text",
    "skill_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "candidate_skills_skill_order_check" CHECK ((("skill_order" IS NULL) OR ("skill_order" > 0)))
);


ALTER TABLE "public"."candidate_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid",
    "level" "text",
    "institution" "text",
    "city" "text",
    "major" "text",
    "from_year" integer,
    "to_year" integer,
    "category" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "education_level_check" CHECK ((("level" = ANY (ARRAY['SD / Sederajat'::"text", 'SMP / MTs / Sederajat'::"text", 'SMA / SMK / MA / Sederajat'::"text", 'Diploma I (D1)'::"text", 'Diploma II (D2)'::"text", 'Diploma III (D3)'::"text", 'Diploma IV (D4)'::"text", 'Sarjana (S1)'::"text", 'Magister (S2)'::"text", 'Doktor (S3)'::"text"])) OR ("level" IS NULL)))
);


ALTER TABLE "public"."education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "employee_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['cv'::"text", 'integrity_pact'::"text", 'email_usage_policy'::"text", 'identity_card'::"text", 'family_card'::"text", 'latest_diploma'::"text", 'academic_transcript'::"text", 'certificate_of_employment'::"text", 'tax_id'::"text", 'bpjs_health_card'::"text", 'bpjs_health_statement'::"text", 'bpjs_employment_card'::"text", 'bank_account_book'::"text", 'format_office'::"text", 'skb'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."employee_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_payroll_profile" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid" NOT NULL,
    "bank_name" "text",
    "bank_account_number" "text",
    "account_holder_name" "text",
    "branch_name" "text",
    "tax_identification_number" "text",
    "bpjs_health_enrollment_preference" "text",
    "bpjs_health_decline_reason" "text",
    "bpjs_health_decline_reason_other" "text",
    "bpjs_employment_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "employee_payroll_profile_bpjs_employment_status_check" CHECK ((("bpjs_employment_status" = ANY (ARRAY['cash_out_first'::"text", 'enroll_new'::"text", 'continue_existing'::"text"])) OR ("bpjs_employment_status" IS NULL))),
    CONSTRAINT "employee_payroll_profile_bpjs_health_decline_reason_check" CHECK ((("bpjs_health_decline_reason" = ANY (ARRAY['pbi'::"text", 'self_registered'::"text", 'local_government'::"text", 'other'::"text"])) OR ("bpjs_health_decline_reason" IS NULL))),
    CONSTRAINT "employee_payroll_profile_bpjs_health_enrollment_preferenc_check" CHECK ((("bpjs_health_enrollment_preference" = ANY (ARRAY['willing_to_enroll'::"text", 'decline_enrollment'::"text"])) OR ("bpjs_health_enrollment_preference" IS NULL)))
);


ALTER TABLE "public"."employee_payroll_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_and_emergency" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid",
    "name" "text",
    "relationship" "text",
    "gender" "text",
    "place_and_date_of_birth" "text",
    "education" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "occupation" "text",
    "remarks" "text",
    "category" "text",
    CONSTRAINT "family_and_emergency_gender_check" CHECK ((("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text"])) OR ("gender" IS NULL)))
);


ALTER TABLE "public"."family_and_emergency" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_statement" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid",
    "contract" boolean,
    "contract_period" "text",
    "reference_check_reason" "text",
    "business_trip" boolean,
    "expected_salary" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "previous_application" boolean,
    "previous_application_details" "text",
    "reference_check_allowed" boolean,
    "family_or_friend_in_company" boolean,
    "serious_illness" boolean,
    "serious_illness_details" "text",
    "serious_accident_boolean" boolean,
    "psychological_test" boolean,
    "psychological_test_location" "text",
    "psychological_test_purpose" "text",
    "company_legal_issue" boolean,
    "company_legal_issue_details" "text",
    "family_or_friend_details" "text",
    "serious_accident_details" "text",
    "civil_or_criminal_case" boolean,
    "civil_or_criminal_case_details" "text"
);


ALTER TABLE "public"."personal_statement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_form_id" "uuid",
    "company" "text",
    "position" "text",
    "from_year" integer,
    "to_year" integer,
    "reason_to_quitting" "text",
    "last_salary" numeric,
    "benefit" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_address" "text",
    "company_phone" "text",
    "direct_superior_title" "text",
    "organization_structure" "text"
);


ALTER TABLE "public"."work_history" OWNER TO "postgres";


ALTER TABLE ONLY "public"."candidate_accounts"
    ADD CONSTRAINT "candidate_accounts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."candidate_accounts"
    ADD CONSTRAINT "candidate_accounts_identity_user_id_key" UNIQUE ("identity_user_id");



ALTER TABLE ONLY "public"."candidate_accounts"
    ADD CONSTRAINT "candidate_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidate_applications"
    ADD CONSTRAINT "candidate_applications_candidate_account_erf_key" UNIQUE ("candidate_account_id", "erf_id");



ALTER TABLE ONLY "public"."candidate_applications"
    ADD CONSTRAINT "candidate_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidate_form"
    ADD CONSTRAINT "candidate_form_application_id_key" UNIQUE ("application_id");



ALTER TABLE ONLY "public"."candidate_form"
    ADD CONSTRAINT "candidate_form_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidate_languages"
    ADD CONSTRAINT "candidate_languages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidate_references"
    ADD CONSTRAINT "candidate_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidate_skills"
    ADD CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_candidate_form_document_type_file_path_key" UNIQUE ("candidate_form_id", "document_type", "file_path");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_payroll_profile"
    ADD CONSTRAINT "employee_payroll_profile_candidate_form_id_key" UNIQUE ("candidate_form_id");



ALTER TABLE ONLY "public"."employee_payroll_profile"
    ADD CONSTRAINT "employee_payroll_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_and_emergency"
    ADD CONSTRAINT "family_and_emergency_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_statement"
    ADD CONSTRAINT "personal_statement_candidate_form_id_key" UNIQUE ("candidate_form_id");



ALTER TABLE ONLY "public"."personal_statement"
    ADD CONSTRAINT "personal_statement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_history"
    ADD CONSTRAINT "work_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_candidate_accounts_created_at_desc" ON "public"."candidate_accounts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_candidate_applications_candidate_account_id_created_at_desc" ON "public"."candidate_applications" USING "btree" ("candidate_account_id", "created_at" DESC);



CREATE INDEX "idx_candidate_form_candidate_account_id_updated_at_desc" ON "public"."candidate_form" USING "btree" ("candidate_account_id", "updated_at" DESC);



CREATE INDEX "idx_candidate_languages_candidate_form_id" ON "public"."candidate_languages" USING "btree" ("candidate_form_id");



CREATE INDEX "idx_candidate_references_candidate_form_id" ON "public"."candidate_references" USING "btree" ("candidate_form_id");



CREATE INDEX "idx_candidate_skills_candidate_form_id" ON "public"."candidate_skills" USING "btree" ("candidate_form_id");



CREATE INDEX "idx_education_candidate_form_id" ON "public"."education" USING "btree" ("candidate_form_id");



CREATE INDEX "idx_employee_documents_candidate_form_id" ON "public"."employee_documents" USING "btree" ("candidate_form_id");



CREATE INDEX "idx_family_and_emergency_candidate_form_id" ON "public"."family_and_emergency" USING "btree" ("candidate_form_id");



CREATE INDEX "idx_work_history_candidate_form_id" ON "public"."work_history" USING "btree" ("candidate_form_id");



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_accounts" BEFORE UPDATE ON "public"."candidate_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_applications" BEFORE UPDATE ON "public"."candidate_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_form" BEFORE UPDATE ON "public"."candidate_form" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_languages" BEFORE UPDATE ON "public"."candidate_languages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_references" BEFORE UPDATE ON "public"."candidate_references" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_skills" BEFORE UPDATE ON "public"."candidate_skills" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__education" BEFORE UPDATE ON "public"."education" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__employee_documents" BEFORE UPDATE ON "public"."employee_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__employee_payroll_profile" BEFORE UPDATE ON "public"."employee_payroll_profile" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__family_and_emergency" BEFORE UPDATE ON "public"."family_and_emergency" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__personal_statement" BEFORE UPDATE ON "public"."personal_statement" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__work_history" BEFORE UPDATE ON "public"."work_history" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."candidate_applications"
    ADD CONSTRAINT "candidate_applications_candidate_account_id_fkey" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_form"
    ADD CONSTRAINT "candidate_form_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."candidate_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_form"
    ADD CONSTRAINT "candidate_form_candidate_account_id_fkey" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_languages"
    ADD CONSTRAINT "candidate_languages_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_references"
    ADD CONSTRAINT "candidate_references_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_skills"
    ADD CONSTRAINT "candidate_skills_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_payroll_profile"
    ADD CONSTRAINT "employee_payroll_profile_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_and_emergency"
    ADD CONSTRAINT "family_and_emergency_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_statement"
    ADD CONSTRAINT "personal_statement_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_history"
    ADD CONSTRAINT "work_history_candidate_form_id_fkey" FOREIGN KEY ("candidate_form_id") REFERENCES "public"."candidate_form"("id") ON DELETE CASCADE;



ALTER TABLE "public"."candidate_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "candidate_accounts_select_self" ON "public"."candidate_accounts" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_account"("id"));



ALTER TABLE "public"."candidate_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "candidate_applications_select_self" ON "public"."candidate_applications" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_account"("candidate_account_id"));



ALTER TABLE "public"."candidate_form" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "candidate_form_select_self" ON "public"."candidate_form" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_account"("candidate_account_id"));



ALTER TABLE "public"."candidate_languages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "candidate_languages_select_self" ON "public"."candidate_languages" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."candidate_references" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "candidate_references_select_self" ON "public"."candidate_references" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."candidate_skills" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "candidate_skills_select_self" ON "public"."candidate_skills" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."education" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "education_select_self" ON "public"."education" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."employee_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_documents_select_self" ON "public"."employee_documents" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."employee_payroll_profile" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_payroll_profile_select_self" ON "public"."employee_payroll_profile" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."family_and_emergency" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "family_and_emergency_select_self" ON "public"."family_and_emergency" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."personal_statement" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "personal_statement_select_self" ON "public"."personal_statement" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



ALTER TABLE "public"."work_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_history_select_self" ON "public"."work_history" FOR SELECT TO "authenticated" USING ("public"."can_access_candidate_form"("candidate_form_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_candidate_account"("candidate_account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_candidate_account"("candidate_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_candidate_account"("candidate_account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_candidate_application"("candidate_application_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_candidate_application"("candidate_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_candidate_application"("candidate_application_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_candidate_form"("candidate_form_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_candidate_form"("candidate_form_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_candidate_form"("candidate_form_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_candidate_storage_object"("bucket_name" "text", "object_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_candidate_storage_object"("bucket_name" "text", "object_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_candidate_storage_object"("bucket_name" "text", "object_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_write_candidate_storage_object"("bucket_name" "text", "object_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_write_candidate_storage_object"("bucket_name" "text", "object_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_write_candidate_storage_object"("bucket_name" "text", "object_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."candidate_application_owner"("candidate_application_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."candidate_application_owner"("candidate_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."candidate_application_owner"("candidate_application_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."candidate_form_owner"("candidate_form_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."candidate_form_owner"("candidate_form_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."candidate_form_owner"("candidate_form_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_candidate_account_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_candidate_account_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_candidate_account_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."candidate_accounts" TO "anon";
GRANT ALL ON TABLE "public"."candidate_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."candidate_applications" TO "anon";
GRANT ALL ON TABLE "public"."candidate_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_applications" TO "service_role";



GRANT ALL ON TABLE "public"."candidate_form" TO "anon";
GRANT ALL ON TABLE "public"."candidate_form" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_form" TO "service_role";



GRANT ALL ON TABLE "public"."candidate_languages" TO "anon";
GRANT ALL ON TABLE "public"."candidate_languages" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_languages" TO "service_role";



GRANT ALL ON TABLE "public"."candidate_references" TO "anon";
GRANT ALL ON TABLE "public"."candidate_references" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_references" TO "service_role";



GRANT ALL ON TABLE "public"."candidate_skills" TO "anon";
GRANT ALL ON TABLE "public"."candidate_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_skills" TO "service_role";



GRANT ALL ON TABLE "public"."education" TO "anon";
GRANT ALL ON TABLE "public"."education" TO "authenticated";
GRANT ALL ON TABLE "public"."education" TO "service_role";



GRANT ALL ON TABLE "public"."employee_documents" TO "anon";
GRANT ALL ON TABLE "public"."employee_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_documents" TO "service_role";



GRANT ALL ON TABLE "public"."employee_payroll_profile" TO "anon";
GRANT ALL ON TABLE "public"."employee_payroll_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_payroll_profile" TO "service_role";



GRANT ALL ON TABLE "public"."family_and_emergency" TO "anon";
GRANT ALL ON TABLE "public"."family_and_emergency" TO "authenticated";
GRANT ALL ON TABLE "public"."family_and_emergency" TO "service_role";



GRANT ALL ON TABLE "public"."personal_statement" TO "anon";
GRANT ALL ON TABLE "public"."personal_statement" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_statement" TO "service_role";



GRANT ALL ON TABLE "public"."work_history" TO "anon";
GRANT ALL ON TABLE "public"."work_history" TO "authenticated";
GRANT ALL ON TABLE "public"."work_history" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







