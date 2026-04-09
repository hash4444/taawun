import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationStatus = Database['public']['Enums']['application_status'];
type Job = Database['public']['Tables']['jobs']['Row'];
type Worker = Database['public']['Tables']['workers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Business = Database['public']['Tables']['businesses']['Row'];

export interface ApplicationWithJob extends Application {
  jobs?: (Job & {
    businesses?: Business | null;
  }) | null;
}

export interface ApplicationWithWorker extends Application {
  workers?: (Worker & {
    profiles?: Profile | null;
  }) | null;
}

// Fetch worker's applications
export function useWorkerApplications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['applications', 'worker', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            *,
            businesses (
              id,
              trade_name,
              legal_name
            )
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApplicationWithJob[];
    },
    enabled: !!user,
  });
}

// Fetch applications for a specific job (for poster)
export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          workers:worker_id (
            *
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown) as ApplicationWithWorker[];
    },
    enabled: !!jobId,
  });
}

// Check if worker has already applied
export function useHasApplied(jobId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['application', 'check', jobId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('worker_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!jobId,
  });
}

// Apply to job
export function useApplyToJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          worker_id: user.id,
          status: 'applied',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', 'check', jobId] });
    },
  });
}

// Update application status (for business or worker)
export function useUpdateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', 'check', data.job_id] });
    },
  });
}

// Cancel application (for worker)
export function useCancelApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data, error } = await supabase
        .from('applications')
        .update({ status: 'cancelled' })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', 'check', data.job_id] });
    },
  });
}
