-- Candidate-only compatibility for a CV column omitted from the July migration history.
-- Preserves the existing private bucket and its policies. No application rows are updated.
ALTER TABLE public.cv_records ADD COLUMN IF NOT EXISTS file_url text;
