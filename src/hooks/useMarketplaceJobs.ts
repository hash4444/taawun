import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JobType, JobWithPoster } from '@/hooks/useJobs';
import { cleanSearch } from '@/lib/marketplace';
import { hydrateJobBusinesses } from '@/lib/publicBusinesses';

export interface JobFilters {
  query?: string;
  location?: string;
  type?: JobType | 'graduate' | '';
  minimumPay?: number;
  paymentModel?: 'hourly' | 'fixed' | 'monthly' | '';
  remoteOnly?: boolean;
  startsAfter?: string;
  page?: number;
  pageSize?: number;
}
export function useMarketplaceJobs(filters: JobFilters = {}) {
  const page = Math.max(0, filters.page || 0);
  const pageSize = Math.min(24, Math.max(1, filters.pageSize || 12));
  return useQuery({
    queryKey: ['jobs', 'marketplace', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase.from('jobs').select('*', { count: 'exact' })
        .eq('status', 'open').eq('country', 'AE').eq('currency', 'AED').eq('student_friendly', true).gt('end_time', now)
        .or(`deadline.is.null,deadline.gt.${now}`)
        .order('created_at', { ascending: false }).order('id');
      const term = cleanSearch(filters.query || '');
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      if (filters.type === 'graduate') query = query.eq('job_type', 'full_time').or('experience_years.is.null,experience_years.lte.1');
      else if (filters.type) query = query.eq('job_type', filters.type);
      if (filters.location) query = query.or(`location.eq.${cleanSearch(filters.location)},address.ilike.%${cleanSearch(filters.location)}%`);
      if (filters.remoteOnly) query = query.eq('remote_allowed', true);
      if (filters.paymentModel) query = query.eq('payment_model', filters.paymentModel);
      if (filters.minimumPay && filters.minimumPay > 0) query = query.gte('pay_amount', filters.minimumPay);
      if (filters.startsAfter) query = query.gte('start_time', filters.startsAfter);
      const { data, error, count } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { jobs: await hydrateJobBusinesses(data || []) as JobWithPoster[], count: count || 0, page, pageSize };
    },
  });
}
