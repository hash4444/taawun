import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CandidateHunterSettings {
  id?: string;
  business_id?: string;
  mode: "MANUAL" | "APPROVAL" | "AUTO";
  minimum_match_score: number;
  daily_outreach_limit: number;
  target_roles: string[];
  locations: string[];
  excluded_keywords: string[];
  last_run_at?: string | null;
}

const defaultSettings: CandidateHunterSettings = {
  mode: "MANUAL",
  minimum_match_score: 80,
  daily_outreach_limit: 10,
  target_roles: [],
  locations: [],
  excluded_keywords: [],
};

export function useCandidateHunterSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["candidate_hunter_settings", user?.id],
    queryFn: async (): Promise<CandidateHunterSettings> => {
      if (!user) return defaultSettings;
      const { data } = await supabase
        .from("candidate_hunter_settings")
        .select("*")
        .eq("business_id", user.id)
        .maybeSingle();
      return (data as unknown as CandidateHunterSettings) ?? defaultSettings;
    },
    enabled: !!user,
  });
}

export function useSaveCandidateHunterSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: CandidateHunterSettings) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...s, business_id: user.id };
      const { data, error } = await supabase
        .from("candidate_hunter_settings")
        .upsert(payload, { onConflict: "business_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate_hunter_settings"] }),
  });
}

export interface CandidateMatchWithNames {
  id: string;
  job_id: string;
  worker_id: string;
  score: number;
  explanation: string | null;
  strengths: string[];
  gaps: string[];
  status: string;
  created_at: string;
  job_title?: string;
  candidate_name?: string;
}

// candidate_matches.job_id / worker_id have no FK constraints (mirrors the
// worker-side ai_job_matches table exactly), so PostgREST resource embedding
// isn't available — resolve job titles and candidate names with two
// follow-up lookups instead of a (would-be silently broken) nested select.
export function useCandidateMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["candidate_matches", user?.id],
    queryFn: async (): Promise<CandidateMatchWithNames[]> => {
      if (!user) return [];
      const { data: matches } = await supabase
        .from("candidate_matches")
        .select("*")
        .eq("business_id", user.id)
        .order("score", { ascending: false })
        .limit(50);

      if (!matches || matches.length === 0) return [];

      const jobIds = [...new Set(matches.map((m) => m.job_id))];
      const workerIds = [...new Set(matches.map((m) => m.worker_id))];

      const [{ data: jobs }, { data: profiles }] = await Promise.all([
        supabase.from("jobs").select("id, title").in("id", jobIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", workerIds),
      ]);

      const jobTitleById = new Map((jobs ?? []).map((j) => [j.id, j.title]));
      const nameByWorkerId = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      return matches.map((m) => ({
        ...m,
        job_title: jobTitleById.get(m.job_id) ?? undefined,
        candidate_name: nameByWorkerId.get(m.worker_id) ?? undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useCandidateHunterLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["candidate_hunter_logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("candidate_hunter_logs")
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useOutreachDrafts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["candidate_outreach_drafts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // match_id has a real FK to candidate_matches, so that embed is safe.
      // job_id has no FK (mirrors ai_job_matches), so resolve titles separately.
      const { data: drafts } = await supabase
        .from("candidate_outreach_drafts")
        .select("*, candidate_matches!candidate_outreach_drafts_match_id_fkey(score,explanation)")
        .eq("business_id", user.id)
        .eq("sent", false)
        .order("created_at", { ascending: false });

      if (!drafts || drafts.length === 0) return [];

      const jobIds = [...new Set(drafts.map((d) => d.job_id))];
      const { data: jobs } = await supabase.from("jobs").select("id, title").in("id", jobIds);
      const jobTitleById = new Map((jobs ?? []).map((j) => [j.id, j.title]));

      return drafts.map((d) => ({ ...d, job_title: jobTitleById.get(d.job_id) ?? undefined }));
    },
    enabled: !!user,
  });
}

async function callCandidateHunter(action: string, body: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/candidate-hunter?action=${action}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

export const runCandidateHunter = () => callCandidateHunter("run_business", { limit: 10 });
export const sendOutreachDraft = (draftId: string) => callCandidateHunter("send_draft", { draft_id: draftId });
