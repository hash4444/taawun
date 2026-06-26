-- Candidate Hunter (business-side AI agent) — mirrors the worker-side AI Job
-- Hunter schema (job_preferences / ai_agent_settings / ai_job_matches /
-- ai_application_drafts / ai_agent_logs), inverted: instead of scoring open
-- jobs against a worker's CV, this scores available workers (cv_records)
-- against jobs the business has posted.

-- Agent settings (per business, mirrors ai_agent_settings)
CREATE TABLE public.candidate_hunter_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'MANUAL' CHECK (mode IN ('MANUAL', 'APPROVAL', 'AUTO')),
  minimum_match_score integer NOT NULL DEFAULT 80,
  daily_outreach_limit integer NOT NULL DEFAULT 10,
  target_roles text[] NOT NULL DEFAULT '{}',
  locations text[] NOT NULL DEFAULT '{}',
  excluded_keywords text[] NOT NULL DEFAULT '{}',
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_hunter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business select own candidate hunter settings" ON public.candidate_hunter_settings FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "business insert own candidate hunter settings" ON public.candidate_hunter_settings FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "business update own candidate hunter settings" ON public.candidate_hunter_settings FOR UPDATE USING (auth.uid() = business_id);
CREATE TRIGGER tg_candidate_hunter_settings_updated BEFORE UPDATE ON public.candidate_hunter_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidate matches (worker scored against a job, mirrors ai_job_matches)
CREATE TYPE public.candidate_match_status AS ENUM ('matched','drafted','outreached','needs_review','skipped','rejected');
CREATE TABLE public.candidate_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  job_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  score integer NOT NULL,
  explanation text,
  strengths text[] NOT NULL DEFAULT '{}',
  gaps text[] NOT NULL DEFAULT '{}',
  status public.candidate_match_status NOT NULL DEFAULT 'matched',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, job_id, worker_id)
);
ALTER TABLE public.candidate_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business select own candidate matches" ON public.candidate_matches FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "business insert own candidate matches" ON public.candidate_matches FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "business update own candidate matches" ON public.candidate_matches FOR UPDATE USING (auth.uid() = business_id);
CREATE TRIGGER tg_candidate_matches_updated BEFORE UPDATE ON public.candidate_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_candidate_matches_business_score ON public.candidate_matches(business_id, score DESC);

-- Outreach drafts (mirrors ai_application_drafts; outreach message instead of cover letter)
CREATE TABLE public.candidate_outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  job_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  match_id uuid REFERENCES public.candidate_matches(id) ON DELETE CASCADE,
  outreach_message text NOT NULL,
  notes text,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_outreach_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business select own outreach drafts" ON public.candidate_outreach_drafts FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "business insert own outreach drafts" ON public.candidate_outreach_drafts FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "business update own outreach drafts" ON public.candidate_outreach_drafts FOR UPDATE USING (auth.uid() = business_id);
CREATE POLICY "business delete own outreach drafts" ON public.candidate_outreach_drafts FOR DELETE USING (auth.uid() = business_id);
CREATE TRIGGER tg_candidate_outreach_drafts_updated BEFORE UPDATE ON public.candidate_outreach_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent logs (mirrors ai_agent_logs; backs the "Recent Candidate Activity" feed)
CREATE TABLE public.candidate_hunter_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  job_id uuid,
  worker_id uuid,
  action text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_hunter_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business select own candidate hunter logs" ON public.candidate_hunter_logs FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "business insert own candidate hunter logs" ON public.candidate_hunter_logs FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE INDEX idx_candidate_hunter_logs_business_created ON public.candidate_hunter_logs(business_id, created_at DESC);
