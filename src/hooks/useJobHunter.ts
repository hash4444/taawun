import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AgentSettings {
  id?: string;
  user_id?: string;
  mode: 'RECOMMENDATIONS' | 'APPROVAL' | 'AUTO';
  paused?: boolean;
  auto_apply_enabled: boolean;
  auto_apply_consented_at?: string | null;
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
export const DEFAULT_AGENT_SETTINGS: AgentSettings = { mode:'APPROVAL',auto_apply_enabled:false,auto_apply_consented_at:null,minimum_match_score:80,daily_application_limit:10,excluded_companies:[],excluded_keywords:[],require_user_approval:true };
export function useAgentSettings() {
  const { user } = useAuth();
  return useQuery({queryKey:['ai_agent_settings',user?.id],enabled:!!user,queryFn:async():Promise<AgentSettings>=>{
    const {data,error}=await supabase.from('ai_agent_settings').select('*').eq('user_id',user!.id).maybeSingle();
    if(error) throw error;
    return data ? {...DEFAULT_AGENT_SETTINGS,...data} as AgentSettings : DEFAULT_AGENT_SETTINGS;
  }});
}
export function useSaveAgentSettings() {
  const qc=useQueryClient();const {user}=useAuth();
  return useMutation({mutationFn:async(settings:AgentSettings)=>{
    if(!user) throw new Error('Not authenticated');
    if(!Number.isInteger(settings.daily_application_limit)||settings.daily_application_limit<1||settings.daily_application_limit>50||settings.minimum_match_score<50||settings.minimum_match_score>100) throw new Error('Use a daily limit from 1–50 and a match score from 50–100.');
    if(settings.mode==='AUTO') throw new Error('Automatic submissions are not enabled for this release.');
    const {data,error}=await supabase.from('ai_agent_settings').upsert({...settings,user_id:user.id,auto_apply_enabled:false,require_user_approval:settings.mode==='APPROVAL'},{onConflict:'user_id'}).select().single();
    if(error) throw error;
    return data;
  },onSuccess:()=>qc.invalidateQueries({queryKey:['ai_agent_settings']})});
}
export function useJobPreferences() {
  const {user,studentData}=useAuth();
  return useQuery({queryKey:['job_preferences',user?.id,studentData?.updated_at],enabled:!!user,queryFn:async():Promise<JobPreferences>=>{
    const {data,error}=await supabase.from('job_preferences').select('*').eq('user_id',user!.id).maybeSingle();
    if(error) throw error;
    return data as JobPreferences || {job_types:studentData?.preferred_job_types||[],work_modes:[],locations:studentData?.city?[studentData.city]:[],industries:[],skills:studentData?.skills||[],languages:[],salary_currency:'AED',availability:studentData?.preferred_hours||null};
  }});
}
export function useSaveJobPreferences() {
  const qc=useQueryClient();const {user}=useAuth();
  return useMutation({mutationFn:async(preferences:JobPreferences)=>{
    if(!user) throw new Error('Not authenticated');
    if(preferences.salary_min!==null&&preferences.salary_min!==undefined&&(!Number.isFinite(preferences.salary_min)||preferences.salary_min<0)) throw new Error('Enter a valid minimum pay.');
    const {data,error}=await supabase.from('job_preferences').upsert({...preferences,user_id:user.id,salary_currency:'AED'},{onConflict:'user_id'}).select().single();
    if(error) throw error;return data;
  },onSuccess:()=>qc.invalidateQueries({queryKey:['job_preferences']})});
}
async function loadJobTitles(ids:string[]) {
  if (!ids.length) return new Map<string,{id:string;title:string;company_name:string|null;location:string|null}>();
  const {data,error}=await supabase.from('jobs').select('id,title,company_name,location').in('id',[...new Set(ids)]);
  if(error)throw error;
  return new Map((data||[]).map(job=>[job.id,job]));
}
export function useJobMatches() {
  const {user}=useAuth();
  return useQuery({queryKey:['ai_job_matches',user?.id],enabled:!!user,queryFn:async()=>{
    const {data,error}=await supabase.from('ai_job_matches').select('*').eq('user_id',user!.id).order('score',{ascending:false}).limit(50);
    if(error)throw error;
    const titles=await loadJobTitles((data||[]).map(match=>match.job_id));
    return (data||[]).map(match=>({...match,jobs:titles.get(match.job_id)||null}));
  }});
}
export function useAgentLogs() {
  const {user}=useAuth();
  return useQuery({queryKey:['ai_agent_logs',user?.id],enabled:!!user,queryFn:async()=>{const {data,error}=await supabase.from('ai_agent_logs').select('*').eq('user_id',user!.id).order('created_at',{ascending:false}).limit(100);if(error)throw error;return data||[];}});
}
export function useDrafts() {
  const {user}=useAuth();
  return useQuery({queryKey:['ai_application_drafts',user?.id],enabled:!!user,queryFn:async()=>{
    const {data,error}=await supabase.from('ai_application_drafts').select('*').eq('user_id',user!.id).eq('submitted',false).order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    const titles=await loadJobTitles((data||[]).map(draft=>draft.job_id));
    return (data||[]).map(draft=>({...draft,jobs:titles.get(draft.job_id)||null}));
  }});
}
async function callHunter(action:string,body:Record<string,unknown>={}) {
  const {data:{session},error}=await supabase.auth.getSession();
  if(error||!session?.access_token)throw new Error('Sign in again to use the assistant.');
  const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-job-hunter?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
  const json=await response.json();if(!response.ok)throw new Error(json.error||'Request failed');return json;
}
export const runJobHunter=()=>callHunter('run_user',{limit:20});
export const submitDraft=(draftId:string)=>callHunter('apply_draft',{draft_id:draftId});
