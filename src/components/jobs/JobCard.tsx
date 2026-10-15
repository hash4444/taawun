import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobWithPoster, JOB_TYPE_LABELS } from '@/hooks/useJobs';
import { formatJobPay, uaeDate } from '@/lib/marketplace';

export function JobCard({ job, variant = 'default', className }: { job: JobWithPoster; variant?: 'default' | 'compact' | 'business'; className?: string }) {
  const navigate = useNavigate();
  const { isRTL } = useApp();
  const { profile } = useAuth();
  return <button onClick={() => navigate(`${profile?.role === 'business' ? '/business' : '/worker'}/job/${job.id}`)} className={cn('w-full text-start card-elevated p-5 transition-colors hover:border-primary/50 border border-border focus-visible:outline-primary', className)}>
    <div className="flex justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium text-primary mb-2">{JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en'] || job.job_type}</p><h3 className="font-semibold text-lg break-words">{job.title}</h3><p className="text-sm text-muted-foreground mt-1">{job.businesses?.trade_name || job.businesses?.legal_name || job.company_name}</p></div><ArrowUpRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" /></div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground my-4"><span className="inline-flex gap-1 items-center"><MapPin size={14} />{job.remote_allowed ? (isRTL ? 'عن بُعد' : 'Remote') : job.address || job.location || (isRTL ? 'الإمارات' : 'UAE')}</span>{job.job_type === 'shift' && <span className="inline-flex gap-1 items-center"><Clock size={14} />{uaeDate(job.start_time, isRTL)}</span>}</div>
    {variant !== 'compact' && job.description && <p className="line-clamp-2 text-sm text-muted-foreground mb-4">{job.description}</p>}
    <div className="flex justify-between items-center gap-2 border-t border-border pt-3"><span className="font-semibold text-primary">{formatJobPay(job, isRTL)}</span>{variant === 'business' && <span className="text-xs text-muted-foreground">{job.slots_filled || 0}/{job.slots_total || 1} {isRTL ? 'عرض مقبول' : 'offers accepted'}</span>}</div>
  </button>;
}
