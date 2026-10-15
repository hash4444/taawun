import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { useMyPostedJobs } from '@/hooks/useJobs';
import { APPLICATION_LABELS } from '@/lib/marketplace';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';

export default function BusinessWorkers() {
  const { user } = useAuth();
  const { isRTL } = useApp();
  const jobs = useMyPostedJobs();
  const candidates = useQuery({queryKey:['business-candidates',user?.id,jobs.data?.map(j=>j.id)],enabled:!!user && !!jobs.data,queryFn:async()=>{
    if (!jobs.data?.length) return [];
    const {data,error} = await supabase.from('applications').select('id, job_id, worker_id, status, created_at').in('job_id',jobs.data.map(j=>j.id)).order('created_at',{ascending:false}).limit(200);
    if (error) throw error;
    if (!data?.length) return [];
    const {data:profiles,error:profileError} = await supabase.from('profiles').select('id, full_name, city').in('id',[...new Set(data.map(a=>a.worker_id))]);
    if (profileError) throw profileError;
    return data.map(a=>({...a,name:profiles?.find(p=>p.id===a.worker_id)?.full_name,city:profiles?.find(p=>p.id===a.worker_id)?.city,title:jobs.data?.find(j=>j.id===a.job_id)?.title}));
  }});
  return <MarketplaceLayout employer title={isRTL ? 'المرشحون' : 'Candidates'} description={isRTL ? 'الطلاب والخريجون الذين تقدموا إلى فرص منشأتك.' : 'Students and graduates who applied to your opportunities.'}>
    {jobs.isError || candidates.isError ? <QueryMessage error={jobs.error || candidates.error} onRetry={()=>{jobs.refetch();candidates.refetch();}} /> : jobs.isLoading || candidates.isLoading ? <div className="h-48 bg-muted animate-pulse rounded-xl" /> : !candidates.data?.length ? <QueryMessage empty={isRTL ? 'ستظهر طلبات المرشحين هنا عند وصولها.' : 'Candidate applications will appear here when they arrive.'} /> : <div className="space-y-3">{candidates.data.map(candidate=><Link key={candidate.id} to={`/business/job/${candidate.job_id}`} className="card-elevated flex flex-wrap justify-between gap-3 p-4 hover:border-primary/40"><div><h2 className="font-semibold">{candidate.name || (isRTL ? 'طالب' : 'Student')}</h2><p className="text-sm text-muted-foreground">{candidate.title}{candidate.city ? ` · ${candidate.city}` : ''}</p></div><span className="text-xs text-primary">{APPLICATION_LABELS[candidate.status]?.[isRTL ? 'ar' : 'en'] || candidate.status}</span></Link>)}</div>}
    {(candidates.data?.length || 0) >= 200 && <p className="text-xs text-muted-foreground">{isRTL ? 'تُعرض أحدث 200 طلب عبر فرص منشأتك.' : 'Showing the latest 200 applications across your listings.'}</p>}
  </MarketplaceLayout>;
}
