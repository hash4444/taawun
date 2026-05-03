-- Job preferences
CREATE TABLE public.job_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  job_types text[] NOT NULL DEFAULT '{}',
  work_modes text[] NOT NULL DEFAULT '{}',
  locations text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  salary_min numeric,
  salary_currency text DEFAULT 'SAR',
  career_goal text,
  availability text,
  languages text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own prefs" ON public.job_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own prefs" ON public.job_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own prefs" ON public.job_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER tg_job_preferences_updated BEFORE UPDATE ON public.job_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent settings
CREATE TABLE public.ai_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  auto_apply_enabled boolean NOT NULL DEFAULT false,
  minimum_match_score integer NOT NULL DEFAULT 80,
  daily_application_limit integer NOT NULL DEFAULT 10,
  excluded_companies text[] NOT NULL DEFAULT '{}',
  excluded_keywords text[] NOT NULL DEFAULT '{}',
  require_user_approval boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own settings" ON public.ai_agent_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own settings" ON public.ai_agent_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own settings" ON public.ai_agent_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER tg_ai_agent_settings_updated BEFORE UPDATE ON public.ai_agent_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job matches
CREATE TYPE public.ai_match_status AS ENUM ('matched','drafted','auto_applied','needs_review','skipped','rejected');
CREATE TABLE public.ai_job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  score integer NOT NULL,
  explanation text,
  strengths text[] NOT NULL DEFAULT '{}',
  gaps text[] NOT NULL DEFAULT '{}',
  status public.ai_match_status NOT NULL DEFAULT 'matched',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE public.ai_job_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own matches" ON public.ai_job_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own matches" ON public.ai_job_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own matches" ON public.ai_job_matches FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER tg_ai_job_matches_updated BEFORE UPDATE ON public.ai_job_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ai_job_matches_user_score ON public.ai_job_matches(user_id, score DESC);

-- Application drafts
CREATE TABLE public.ai_application_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  match_id uuid REFERENCES public.ai_job_matches(id) ON DELETE CASCADE,
  cover_letter text NOT NULL,
  notes text,
  submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_application_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own drafts" ON public.ai_application_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own drafts" ON public.ai_application_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own drafts" ON public.ai_application_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own drafts" ON public.ai_application_drafts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER tg_ai_application_drafts_updated BEFORE UPDATE ON public.ai_application_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent logs
CREATE TABLE public.ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid,
  action text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own logs" ON public.ai_agent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own logs" ON public.ai_agent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ai_agent_logs_user_created ON public.ai_agent_logs(user_id, created_at DESC);

-- Extend applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_auto_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_letter_ai boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS match_score integer;