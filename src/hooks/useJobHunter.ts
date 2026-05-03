import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AgentSettings {
  id?: string;
  user_id?: string;
  auto_apply_enabled: boolean;
  minimum_match_score: number;
  daily_application_limit: number;
  excluded_companies: string[];
  excluded_keywords: string[];
  require_user_approval: boolean;
  last_run_at?: string | null;
}

export interface JobPreferences {
  id?: string;
  user_id?: string;
  job_types: string[];
  work_modes: string[];
  locations: string[];
  industries: string[];
  skills: string[];
  salary_min?: number | null;
  salary_currency?: string;
  career_goal?: string | null;
  availability?: string | null;
  languages: string[];
}

const defaultSettings: AgentSettings = {
  auto_apply_enabled: false,
  minimum_match_score: 80,
  daily_application_limit: 10,
  excluded_companies: [],
  excluded_keywords: [],
  require_user_approval: false,
};

const defaultPrefs: JobPreferences = {
  job_types: [],
  work_modes: [],
  locations: [],
  industries: [],
  skills: [],
  languages: [],
  salary_currency: "SAR",
};

export function useAgentSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai_agent_settings", user?.id],
    queryFn: async (): Promise<AgentSettings> => {
      if (!user) return defaultSettings;
      const { data } = await supabase.from("ai_agent_settings").select("*").eq("user_id", user.id).maybeSingle();
      return (data as any) ?? defaultSettings;
    },
    enabled: !!user,
  });
}

export function useSaveAgentSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: AgentSettings) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...s, user_id: user.id };
      const { data, error } = await supabase.from("ai_agent_settings").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_agent_settings"] }),
  });
}

export function useJobPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["job_preferences", user?.id],
    queryFn: async (): Promise<JobPreferences> => {
      if (!user) return defaultPrefs;
      const { data } = await supabase.from("job_preferences").select("*").eq("user_id", user.id).maybeSingle();
      return (data as any) ?? defaultPrefs;
    },
    enabled: !!user,
  });
}

export function useSaveJobPreferences() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: JobPreferences) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...p, user_id: user.id };
      const { data, error } = await supabase.from("job_preferences").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_preferences"] }),
  });
}

export function useJobMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai_job_matches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("ai_job_matches")
        .select("*, jobs(*)")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAgentLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai_agent_logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("ai_agent_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useDrafts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai_application_drafts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("ai_application_drafts")
        .select("*, jobs(*), ai_job_matches!ai_application_drafts_match_id_fkey(score,explanation)")
        .eq("user_id", user.id)
        .eq("submitted", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

async function callHunter(action: string, body: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-job-hunter?action=${action}`;
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

export const runJobHunter = () => callHunter("run_user", { limit: 20 });
export const submitDraft = (draftId: string) => callHunter("apply_draft", { draft_id: draftId });
