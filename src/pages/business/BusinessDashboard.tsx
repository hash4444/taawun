import { Link } from 'react-router-dom';
import { Briefcase, Users, CheckCircle2, Plus } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useMyPostedJobs } from '@/hooks/useJobs';
import { useBusinessApplicationsCount } from '@/hooks/useApplications';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';
import { JobCard } from '@/components/jobs/JobCard';
import { JOB_STATUS_LABELS } from '@/lib/marketplace';
import { Button } from '@/components/ui/button';

export default function BusinessDashboard() {
  const { isRTL } = useApp();
  const { isVerified, businessData } = useAuth();
  const jobs = useMyPostedJobs();
  const applications = useBusinessApplicationsCount();
  const active = jobs.data?.filter(job=>job.status === 'open' && Date.parse(job.end_time) > Date.now() && (!job.deadline || Date.parse(job.deadline) > Date.now())) || [];
  const stats = [ {icon:Briefcase,en:'Open listings',ar:'فرص مفتوحة',value:active.length}, {icon:Users,en:'Applications',ar:'طلبات التقديم',value:applications.data ?? 0}, {icon:CheckCircle2,en:'Accepted offers',ar:'عروض مقبولة',value:jobs.data?.reduce((sum,job)=>sum+(job.slots_filled || 0),0) || 0} ];
  return <MarketplaceLayout employer title={isRTL ? 'وظائف منشأتك' : 'Your job listings'} description={businessData?.trade_name || (isRTL ? 'اعثر على طلاب وخريجين لديهم الطموح.' : 'Meet ambitious students and fresh graduates.')}>
    {!isVerified && <div className="rounded-xl bg-warning-light p-4"><p className="font-medium">{isRTL ? 'يجب التحقق من المنشأة لنشر الفرص.' : 'Verify your business to publish opportunities.'}</p><Link className="text-primary underline text-sm" to="/business/verification">{isRTL ? 'استكمال التحقق' : 'Complete verification'}</Link></div>}
    <div className="grid grid-cols-3 gap-3">{stats.map(stat=><div key={stat.en} className="card-elevated p-3 md:p-5"><stat.icon size={20} className="text-primary mb-3" /><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs md:text-sm text-muted-foreground">{isRTL ? stat.ar : stat.en}</p></div>)}</div>
    <div className="flex flex-wrap gap-3"><Button asChild disabled={!isVerified}><Link to={isVerified ? '/business/post-job' : '/business/verification'}><Plus size={17} className="me-2" />{isRTL ? 'نشر فرصة' : 'Post an opportunity'}</Link></Button><Button variant="outline" asChild><Link to="/business/candidate-hunter">{isRTL ? 'ترشيحات المواهب' : 'Candidate recommendations'}</Link></Button></div>
    {jobs.isError ? <QueryMessage error={jobs.error} onRetry={()=>jobs.refetch()} /> : jobs.isLoading ? <div className="h-48 bg-muted animate-pulse rounded-xl" /> : !jobs.data?.length ? <QueryMessage empty={isRTL ? 'لم تنشر أي فرصة بعد. ابدأ بفرصة واضحة تناسب الطلاب.' : 'No listings yet. Start with a clear opportunity that fits student life.'} /> : <div className="grid md:grid-cols-2 gap-4">{jobs.data.map(job=><div key={job.id} className="space-y-2"><JobCard job={job} variant="business" /><p className="text-xs text-muted-foreground px-1">{isRTL ? 'الحالة: ' : 'Status: '}{JOB_STATUS_LABELS[job.status]?.[isRTL ? 'ar' : 'en'] || job.status}</p></div>)}</div>}
  </MarketplaceLayout>;
}
