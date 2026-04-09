import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Rating {
  id: string;
  job_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string | null;
  from_role: 'worker' | 'business';
  created_at: string;
}

interface RatingWithDetails extends Rating {
  jobs?: {
    id: string;
    title: string;
    start_time: string;
  } | null;
  from_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Get ratings received by the current user
export function useReceivedRatings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ratings', 'received', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          jobs (
            id,
            title,
            start_time
          )
        `)
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RatingWithDetails[];
    },
    enabled: !!user,
  });
}

// Get rating stats for a user
export function useRatingStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['ratings', 'stats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { average: 0, count: 0 };
      
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('to_user_id', targetUserId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }
      
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: Math.round((sum / data.length) * 10) / 10,
        count: data.length,
      };
    },
    enabled: !!targetUserId,
  });
}

// Check if user has already rated for a specific job
export function useHasRated(jobId: string, toUserId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ratings', 'check', jobId, user?.id, toUserId],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('ratings')
        .select('id')
        .eq('job_id', jobId)
        .eq('from_user_id', user.id)
        .eq('to_user_id', toUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!jobId && !!toUserId,
  });
}

// Submit a rating
export function useSubmitRating() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      jobId,
      toUserId,
      rating,
      comment,
    }: {
      jobId: string;
      toUserId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          job_id: jobId,
          from_user_id: user.id,
          to_user_id: toUserId,
          rating,
          comment: comment || null,
          from_role: profile.role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}
