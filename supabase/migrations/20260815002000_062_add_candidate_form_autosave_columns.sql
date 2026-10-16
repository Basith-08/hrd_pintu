ALTER TABLE public.candidate_form
  ADD COLUMN IF NOT EXISTS autosave_data jsonb,
  ADD COLUMN IF NOT EXISTS autosave_updated_at timestamptz;
