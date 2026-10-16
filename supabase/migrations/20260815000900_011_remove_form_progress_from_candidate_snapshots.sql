update public.candidate_applications
set job_snapshot = coalesce(job_snapshot, '{}'::jsonb) - 'form_progress_percent'
where coalesce(job_snapshot, '{}'::jsonb) ? 'form_progress_percent';
