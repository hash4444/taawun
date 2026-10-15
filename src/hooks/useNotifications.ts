import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['notifications', user?.id], enabled: !!user, refetchInterval: 60000, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  } });
}
export function useReadNotification() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({ mutationFn: async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
}
