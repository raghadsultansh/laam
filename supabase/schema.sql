-- WARNING: This schema is for reference only and is not meant to be run.
-- The live database is managed through Supabase.
-- Update this file whenever the schema changes to keep it in sync.

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_en text NOT NULL UNIQUE,
  name_ar text,
  sector text,
  ticker text,
  logo_url text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  job_title text CHECK (job_title IS NULL OR (job_title = ANY (ARRAY['financial_analyst'::text, 'investment_manager'::text, 'portfolio_manager'::text, 'finance_manager'::text, 'auditor'::text, 'student'::text, 'researcher'::text, 'other'::text]))),
  system_role text NOT NULL DEFAULT 'user'::text CHECK (system_role = ANY (ARRAY['user'::text, 'admin'::text])),
  preferred_language text NOT NULL DEFAULT 'en'::text CHECK (preferred_language = ANY (ARRAY['en'::text, 'ar'::text])),
  preferred_theme text NOT NULL DEFAULT 'light'::text CHECK (preferred_theme = ANY (ARRAY['light'::text, 'dark'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  title text,
  fiscal_year integer CHECK (fiscal_year IS NULL OR fiscal_year >= 1900 AND fiscal_year <= 2100),
  report_type text CHECK (report_type IS NULL OR (report_type = ANY (ARRAY['annual'::text, 'integrated'::text, 'sustainability'::text, 'other'::text]))),
  file_name text,
  file_hash_sha256 text NOT NULL UNIQUE,
  storage_bucket text NOT NULL DEFAULT 'report-pdfs'::text,
  storage_path text,
  qdrant_collection_id text UNIQUE,
  status text NOT NULL DEFAULT 'processing'::text CHECK (status = ANY (ARRAY['processing'::text, 'ready'::text, 'failed'::text])),
  visibility text NOT NULL DEFAULT 'hidden'::text CHECK (visibility = ANY (ARRAY['hidden'::text, 'public'::text, 'rejected'::text])),
  uploaded_by uuid,
  approved_by uuid,
  approved_at timestamp with time zone,
  page_count integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT reports_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id),
  CONSTRAINT reports_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);

CREATE TABLE public.processing_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  created_by uuid,
  status text NOT NULL DEFAULT 'running'::text CHECK (status = ANY (ARRAY['queued'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  current_phase text CHECK (current_phase IS NULL OR (current_phase = ANY (ARRAY['queued'::text, 'hashing'::text, 'parsing'::text, 'chunking'::text, 'indexing'::text, 'completed'::text, 'failed'::text]))),
  percent_complete integer NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  error_message text,
  failure_reason_code text CHECK (failure_reason_code IS NULL OR (failure_reason_code = ANY (ARRAY['invalid_file_type'::text, 'low_quality_scan'::text, 'not_annual_report'::text, 'non_ifrs_report'::text, 'arabic_only'::text, 'parsing_error'::text, 'pipeline_error'::text, 'qdrant_error'::text, 'storage_error'::text]))),
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT processing_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT processing_jobs_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id),
  CONSTRAINT processing_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  report_id uuid NOT NULL,
  title text NOT NULL,
  chat_history jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(chat_history) = 'array'::text),
  dashboard_data jsonb CHECK (dashboard_data IS NULL OR jsonb_typeof(dashboard_data) = 'object'::text),
  dashboard_generated boolean NOT NULL DEFAULT false,
  is_saved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT sessions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id)
);
