import { supabase } from '@/integrations/supabase/client';

/** Deliberately excludes private legal, representative, contact and verification fields. */
export interface PublicBusiness {
  id: string;
  trade_name: string | null;
  sector: string | null;
  logo_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  /** Kept absent for old display fallbacks; private legal names are never fetched. */
  legal_name?: never;
}
export async function hydrateJobBusinesses<T extends { business_id?: string | null }>(jobs: T[]): Promise<(T & { businesses: PublicBusiness | null })[]> {
  const ids = [...new Set(jobs.map(job => job.business_id).filter((id): id is string => !!id))];
  const summaries = new Map<string, PublicBusiness>();
  // Each bounded page needs one lookup; larger private application lists use safe batches of 50.
  const groups = Array.from({length:Math.ceil(ids.length/50)},(_,index)=>ids.slice(index*50,index*50+50));
  const results = await Promise.all(groups.map(p_ids=>supabase.rpc('get_public_businesses',{p_ids})));
  for (const result of results) {
    if (result.error) throw result.error;
    for (const row of result.data || []) {
      const {id,trade_name,sector,logo_url,rating_avg,rating_count}=row;
      summaries.set(id,{id,trade_name,sector,logo_url,rating_avg,rating_count});
    }
  }
  return jobs.map(job=>({...job,businesses:job.business_id ? summaries.get(job.business_id)||null : null}));
}
