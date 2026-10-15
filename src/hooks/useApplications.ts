import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { hydrateJobBusinesses } from '@/lib/publicBusinesses';
import type { JobWithPoster } from '@/hooks/useJobs';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationStatus = Database['public']['Enums']['application_status'];
type Job = Database['public']['Tables']['jobs']['Row'];
type Worker = Database['public']['Tables']['workers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Business = Database['public']['Tables']['businesses']['Row'];
export interface ApplicationWithJob extends Application { jobs?: JobWithPoster | null }
export interface ApplicationWithWorker extends Application { workers?: (Worker & { profiles?: Profile | null }) | null }

export function useBusinessApplicationsCount() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['applications', 'business-count', user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return 0;
    const { count, error } = await supabase.from('applications').select('id, jobs!inner(poster_id)', { count: 'exact', head: true }).eq('jobs.poster_id', user.id);
    if (error) throw error;
    return count ?? 0;
  } });
}
export function useWorkerApplications() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['applications', 'worker', user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from('applications').select('*, jobs(*)').eq('worker_id', user.id).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    const jobs = await hydrateJobBusinesses((data || []).flatMap(application => application.jobs ? [application.jobs] : []));
    const byId = new Map(jobs.map(job => [job.id, job]));
    return (data || []).map(application => ({...application, jobs: byId.get(application.job_id) || null})) as ApplicationWithJob[];
  } });
}
export function useJobApplications(jobId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['applications', 'job', jobId, user?.id], enabled: !!jobId && !!user, queryFn: async () => {
    const { data, error } = await supabase.from('applications').select('*').eq('job_id', jobId).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    if (!data?.length) return [];
    const ids = [...new Set(data.map(a => a.worker_id))];
    // These reads are constrained by server-side applicant ownership policies.
    const [workers, profiles] = await Promise.all([
      supabase.from('workers').select('*').in('id', ids),
      supabase.from('profiles').select('*').in('id', ids),
    ]);
    if (workers.error) throw workers.error;
    if (profiles.error) throw profiles.error;
    return data.map(a => ({ ...a, workers: workers.data?.find(w => w.id === a.worker_id) ? {
      ...workers.data.find(w => w.id === a.worker_id)!, profiles: profiles.data?.find(p => p.id === a.worker_id) || null,
    } : null })) as ApplicationWithWorker[];
  } });
}
export function useHasApplied(jobId: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['application', 'check', jobId, user?.id], enabled: !!user && !!jobId, queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('applications').select('id, status').eq('job_id', jobId).eq('worker_id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  } });
}
export function useApplyToJob() {
  const client = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({ mutationFn: async (jobId: string) => {
    if (!user || profile?.role !== 'worker') throw new Error('Sign in with a student account to apply.');
    const { data, error } = await supabase.rpc('submit_application', { p_job_id: jobId });
    if (error) throw new Error(error.code === '23505' ? 'You have already applied for this opportunity.' : error.message);
    return data;
  }, onSuccess: (_, jobId) => {
    client.invalidateQueries({ queryKey: ['applications'] });
    client.invalidateQueries({ queryKey: ['application', 'check', jobId] });
    client.invalidateQueries({ queryKey: ['notifications'] });
  } });
}
export function useUpdateApplication() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, status, interviewAt, message }: { id: string; status: ApplicationStatus; interviewAt?: string; message?: string }) => {
    const { data, error } = await supabase.rpc('update_application_status', {
      p_application_id: id, p_status: status, p_interview_at: interviewAt || undefined, p_message: message || undefined,
    });
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) as Application;
  }, onSuccess: () => {
    client.invalidateQueries({ queryKey: ['applications'] });
    client.invalidateQueries({ queryKey: ['application'] });
    client.invalidateQueries({ queryKey: ['jobs'] });
    client.invalidateQueries({ queryKey: ['job'] });
    client.invalidateQueries({ queryKey: ['notifications'] });
  } });
}
export function useCancelApplication() {
  const update = useUpdateApplication();
  return { ...update, mutateAsync: (id: string) => update.mutateAsync({ id, status: 'cancelled' }) };
}
