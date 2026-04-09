import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Dispute = Database['public']['Tables']['disputes']['Row'];
type DisputeStatus = Database['public']['Enums']['dispute_status'];
type AppRole = Database['public']['Enums']['app_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

export interface DisputeWithDetails extends Dispute {
  profiles?: Profile | null;
  jobs?: Job | null;
}

// Fetch user's disputes
export function useMyDisputes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['disputes', 'my', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          jobs (
            id,
            title,
            start_time
          )
        `)
        .eq('opened_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DisputeWithDetails[];
    },
    enabled: !!user,
  });
}

// Create dispute
export function useCreateDispute() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      jobId, 
      reason 
    }: { 
      jobId?: string; 
      reason: string;
    }) => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('disputes')
        .insert({
          job_id: jobId,
          opened_by: user.id,
          opened_by_role: profile.role,
          reason,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

// Admin: Fetch all open disputes
export function useOpenDisputes() {
  return useQuery({
    queryKey: ['disputes', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          profiles:opened_by (
            id,
            email,
            full_name,
            role
          ),
          jobs (
            id,
            title,
            start_time,
            business_id
          )
        `)
        .in('status', ['open', 'review'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DisputeWithDetails[];
    },
  });
}

// Admin: Update dispute status
export function useUpdateDispute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      resolutionNotes,
      adminId,
    }: { 
      id: string; 
      status: DisputeStatus;
      resolutionNotes?: string;
      adminId: string;
    }) => {
      const { data, error } = await supabase
        .from('disputes')
        .update({ 
          status, 
          resolution_notes: resolutionNotes 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          target_type: 'dispute',
          target_id: id,
          action: `update_status_${status}`,
          notes: resolutionNotes,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}
