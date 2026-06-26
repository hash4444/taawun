import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type WalletLedger = Database['public']['Tables']['wallet_ledger']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

export interface WalletEntryWithJob extends WalletLedger {
  jobs?: Job | null;
}

// Fetch worker's wallet entries
export function useWorkerWallet() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallet', 'worker', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('wallet_ledger')
        .select(`
          *,
          jobs (
            id,
            title,
            start_time
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletEntryWithJob[];
    },
    enabled: !!user,
  });
}

// Calculate wallet balance
export function useWalletBalance() {
  const { data: entries } = useWorkerWallet();
  
  if (!entries) return { available: 0, pending: 0, total: 0 };
  
  const available = entries
    .filter(e => e.status === 'paid' || e.status === 'approved')
    .reduce((sum, e) => {
      if (e.type === 'earning') return sum + Number(e.amount);
      if (e.type === 'payout') return sum - Number(e.amount);
      return sum;
    }, 0);
  
  const pending = entries
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  const total = entries
    .filter(e => e.type === 'earning')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  return { available, pending, total };
}

// Fetch business wallet entries
export function useBusinessWallet() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallet', 'business', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('wallet_ledger')
        .select(`
          *,
          jobs (
            id,
            title,
            start_time
          )
        `)
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletEntryWithJob[];
    },
    enabled: !!user,
  });
}
