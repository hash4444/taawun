import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { hydrateJobBusinesses, type PublicBusiness } from '@/lib/publicBusinesses';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Worker = Database['public']['Tables']['workers']['Row'];
export type JobType = Database['public']['Enums']['job_type'];
export type PaymentModel = Database['public']['Enums']['payment_model'];
export type ServiceDirection = Database['public']['Enums']['service_direction'];
export type EmploymentType = Database['public']['Enums']['employment_type'];
export interface JobWithPoster extends Job {
  businesses?: PublicBusiness | null;
  poster_profile?: Profile | null;
  poster_worker?: Worker | null;
}
export function useOpenJobs(jobType?: JobType) {
  return useQuery({queryKey:['jobs','open',jobType],queryFn:async()=>{
    const now=new Date().toISOString();
    let query=supabase.from('jobs').select('*').eq('status','open').gt('end_time',now).or(`deadline.is.null,deadline.gt.${now}`).order('created_at',{ascending:false}).limit(100);
    if(jobType)query=query.eq('job_type',jobType);
    const {data,error}=await query;
    if(error)throw error;
    return hydrateJobBusinesses(data||[]);
  }});
}
export function useMyPostedJobs() {
  const {user}=useAuth();
  return useQuery({queryKey:['jobs','posted',user?.id],enabled:!!user,queryFn:async()=>{
    if(!user)return [];
    const {data,error}=await supabase.from('jobs').select('*').eq('poster_id',user.id).order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    return hydrateJobBusinesses(data||[]);
  }});
}
export function useJob(jobId:string) {
  return useQuery({queryKey:['job',jobId],enabled:!!jobId,queryFn:async()=>{
    const {data,error}=await supabase.from('jobs').select('*').eq('id',jobId).maybeSingle();
    if(error)throw error;
    return data ? (await hydrateJobBusinesses([data]))[0] : null;
  }});
}

// Create job
export function useCreateJob() {
  const queryClient = useQueryClient();
  const { user, profile, isVerified } = useAuth();
  
  return useMutation({
    mutationFn: async (job: Omit<JobInsert, 'poster_id' | 'poster_role'>) => {
      if (!user || !profile) throw new Error('Not authenticated');
      if (profile.role !== 'business' || !isVerified) throw new Error('A verified business account is required to publish jobs.');
      
      const insertData: JobInsert = {
        ...job,
        poster_id: user.id,
        poster_role: 'business',
        business_id: profile.role === 'business' ? user.id : null,
      };

      const { data, error } = await supabase
        .from('jobs')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// Create multiple jobs at once
export function useCreateJobs() {
  const queryClient = useQueryClient();
  const { user, profile, isVerified } = useAuth();
  
  return useMutation({
    mutationFn: async (jobs: Omit<JobInsert, 'poster_id' | 'poster_role'>[]) => {
      if (!user || !profile) throw new Error('Not authenticated');
      if (profile.role !== 'business' || !isVerified) throw new Error('A verified business account is required to publish jobs.');
      
      const insertData: JobInsert[] = jobs.map(job => ({
        ...job,
        poster_id: user.id,
        poster_role: 'business',
        business_id: profile.role === 'business' ? user.id : null,
      }));

      const { data, error } = await supabase
        .from('jobs')
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// Update job
export function useUpdateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: JobUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
    },
  });
}

// Delete job
export function useDeleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// Job type labels
export const JOB_TYPE_LABELS = {
  shift: { en: 'Shifts', ar: 'ورديات' },
  full_time: { en: 'Full Time', ar: 'دوام كامل' },
  part_time: { en: 'Part Time', ar: 'دوام جزئي' },
  freelance: { en: 'Freelance', ar: 'عمل حر' },
  digital_service: { en: 'Digital Services', ar: 'خدمات رقمية' },
  internship: { en: 'Internship', ar: 'تدريب' },
};

// Payment model labels
export const PAYMENT_MODEL_LABELS = {
  hourly: { en: 'Hourly', ar: 'بالساعة' },
  fixed: { en: 'Fixed', ar: 'مبلغ ثابت' },
  monthly: { en: 'Monthly', ar: 'شهري' },
  milestone: { en: 'Milestone', ar: 'مراحل' },
};
