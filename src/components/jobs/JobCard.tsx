import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MapPin, Clock, Calendar, Banknote, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { JobWithPoster, JOB_TYPE_LABELS, PAYMENT_MODEL_LABELS } from '@/hooks/useJobs';

interface JobCardProps {
  job: JobWithPoster;
  variant?: 'default' | 'compact' | 'business';
  className?: string;
}

export function JobCard({ job, variant = 'default', className }: JobCardProps) {
  const navigate = useNavigate();
  const { isRTL } = useApp();
  const { profile } = useAuth();

  const handleClick = () => {
    if (profile?.role === 'business') {
      navigate(`/business/job/${job.id}`);
    } else {
      navigate(`/worker/job/${job.id}`);
    }
  };

  const formatPay = () => {
    const amount = Number(job.pay_amount).toLocaleString(isRTL ? 'ar-SA' : 'en-US');
    const currencyLabel = isRTL ? 'ر.س' : 'SAR';
    
    if (job.payment_model === 'hourly') {
      return `${amount} ${currencyLabel}/${isRTL ? 'ساعة' : 'hr'}`;
    }
    if (job.payment_model === 'monthly') {
      return `${amount} ${currencyLabel}/${isRTL ? 'شهر' : 'mo'}`;
    }
    return `${amount} ${currencyLabel}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd MMM yyyy', { locale: isRTL ? ar : enUS });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'HH:mm');
    } catch {
      return '';
    }
  };

  const companyName = job.businesses?.trade_name || job.businesses?.legal_name || '';

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'w-full text-start p-3 card-elevated transition-all hover:shadow-lg active:scale-[0.98]',
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground truncate">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
          <div className="text-end flex-shrink-0">
            <p className="font-semibold text-primary">{formatPay()}</p>
            <p className="text-xs text-muted-foreground">{formatDate(job.start_time)}</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-start p-4 card-elevated transition-all hover:shadow-lg active:scale-[0.98]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-base">{job.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{companyName}</span>
            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
              {JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en'] || job.job_type}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={14} className="flex-shrink-0 text-primary" />
          <span className="truncate">{job.address || (isRTL ? 'الرياض' : 'Riyadh')}</span>
          {job.remote_allowed && (
            <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full">
              {isRTL ? 'عن بعد' : 'Remote'}
            </span>
          )}
        </div>
        
        {job.job_type === 'shift' && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} className="flex-shrink-0 text-primary" />
              <span>{formatDate(job.start_time)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} className="flex-shrink-0 text-primary" />
              <span>{formatTime(job.start_time)} - {formatTime(job.end_time)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Banknote size={16} className="text-primary" />
          <span className="font-semibold text-primary">{formatPay()}</span>
        </div>
        
        {variant === 'business' && (
          <span className="text-sm text-muted-foreground">
            {job.slots_filled || 0}/{job.slots_total} {isRTL ? 'متقدمين' : 'applicants'}
          </span>
        )}
      </div>
    </button>
  );
}
