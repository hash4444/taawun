import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Calendar, Banknote, Building2, AlertCircle, QrCode, CheckCircle2, Star } from 'lucide-react';
import { useJob, JOB_TYPE_LABELS } from '@/hooks/useJobs';
import { useHasApplied, useApplyToJob, useWorkerApplications } from '@/hooks/useApplications';
import { useJobAttendance, useCheckIn, useCheckOut } from '@/hooks/useAttendance';
import { useHasRated } from '@/hooks/useRatings';
import { RatingDialog } from '@/components/ratings/RatingDialog';
import { QRScanner } from '@/components/attendance/QRScanner';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function WorkerJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, isRTL } = useApp();
  const { user, isVerified } = useAuth();
  const navigate = useNavigate();

  const [showScanner, setShowScanner] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const { data: job, isLoading } = useJob(id || '');
  const { data: existingApplication } = useHasApplied(id || '');
  const { data: applications } = useWorkerApplications();
  const { data: attendance } = useJobAttendance(id || '');
  const { data: hasRated } = useHasRated(id || '', job?.business_id || '');
  
  const applyMutation = useApplyToJob();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Find full application for this job
  const fullApplication = applications?.find(a => a.job_id === id);

  const handleApply = async () => {
    if (!id) return;
    try {
      await applyMutation.mutateAsync(id);
      toast.success(isRTL ? 'تم التقديم بنجاح!' : 'Application submitted!');
    } catch (error: any) {
      toast.error(isRTL ? 'فشل التقديم' : 'Application failed', { description: error.message });
    }
  };

  const handleScan = async (data: { jobId: string; businessId: string; action: 'check_in' | 'check_out' }) => {
    setShowScanner(false);
    
    if (data.jobId !== id) {
      toast.error(isRTL ? 'رمز QR غير صحيح لهذه الوظيفة' : 'Wrong QR code for this job');
      return;
    }

    try {
      if (data.action === 'check_in') {
        await checkInMutation.mutateAsync({ jobId: data.jobId, businessId: data.businessId });
        toast.success(isRTL ? 'تم تسجيل الحضور!' : 'Checked in successfully!');
      } else {
        await checkOutMutation.mutateAsync(data.jobId);
        toast.success(isRTL ? 'تم تسجيل الخروج!' : 'Checked out successfully!');
      }
    } catch (error: any) {
      toast.error(isRTL ? 'فشلت العملية' : 'Operation failed', { description: error.message });
    }
  };

  if (isLoading) {
    return (
      <MobileLayout header={<PageHeader title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'} showBack />}>
        <div className="p-4"><div className="h-60 bg-muted rounded-xl animate-pulse" /></div>
      </MobileLayout>
    );
  }

  if (!job) {
    return (
      <MobileLayout header={<PageHeader title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'} showBack />}>
        <div className="p-4 text-center text-muted-foreground">{isRTL ? 'لم يتم العثور على الوظيفة' : 'Job not found'}</div>
      </MobileLayout>
    );
  }

  const hasApplied = !!existingApplication;
  const isAccepted = fullApplication?.status === 'accepted';
  const isCompleted = fullApplication?.status === 'completed';
  const isCheckedIn = !!attendance?.check_in_at;
  const isCheckedOut = !!attendance?.check_out_at;
  const canRate = isCompleted && !hasRated;
  const isShiftType = job.job_type === 'shift';

  return (
    <MobileLayout header={<PageHeader title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'} showBack />} noPadding>
      <div className="px-4 py-4 space-y-4">
        {/* Job Info Card */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              {JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en'] || job.job_type}
            </span>
            {job.remote_allowed && (
              <span className="text-xs px-2 py-1 bg-success-light text-success rounded-full">
                {isRTL ? 'عن بعد' : 'Remote'}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{job.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Building2 size={16} />
            <span>{job.businesses?.trade_name || job.businesses?.legal_name}</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3"><MapPin size={18} className="text-primary" /><span>{job.address || (isRTL ? 'الرياض' : 'Riyadh')}</span></div>
            {isShiftType && (
              <>
                <div className="flex items-center gap-3"><Calendar size={18} className="text-primary" /><span>{format(new Date(job.start_time), 'yyyy-MM-dd')}</span></div>
                <div className="flex items-center gap-3"><Clock size={18} className="text-primary" /><span>{format(new Date(job.start_time), 'HH:mm')} - {format(new Date(job.end_time), 'HH:mm')}</span></div>
              </>
            )}
            <div className="flex items-center gap-3">
              <Banknote size={18} className="text-primary" />
              <span className="font-semibold">
                {job.pay_amount} {job.currency || 'SAR'} 
                {job.payment_model === 'hourly' && (isRTL ? '/ساعة' : '/hr')}
                {job.payment_model === 'monthly' && (isRTL ? '/شهر' : '/mo')}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="card-elevated p-4">
            <h2 className="font-semibold mb-2">{isRTL ? 'الوصف' : 'Description'}</h2>
            <p className="text-muted-foreground">{job.description}</p>
          </div>
        )}

        {/* Attendance Status (only for shifts) */}
        {isShiftType && isAccepted && (
          <div className="card-elevated p-4">
            <h2 className="font-semibold mb-3">{isRTL ? 'حالة الحضور' : 'Attendance Status'}</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>{t('checkIn')}</span>
                {isCheckedIn ? (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 size={16} />
                    {format(new Date(attendance!.check_in_at!), 'HH:mm')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{isRTL ? 'لم يتم' : 'Not done'}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>{t('checkOut')}</span>
                {isCheckedOut ? (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 size={16} />
                    {format(new Date(attendance!.check_out_at!), 'HH:mm')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{isRTL ? 'لم يتم' : 'Not done'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Warning */}
        {!isVerified && (
          <div className="p-3 rounded-xl bg-warning-light flex items-center gap-3">
            <AlertCircle className="text-warning" size={20} />
            <p className="text-sm">{isRTL ? 'يجب إكمال التحقق أولاً للتقديم' : 'Complete verification first to apply'}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6 pb-safe space-y-3">
        {/* Rate Business Button */}
        {canRate && (
          <Button variant="outline" onClick={() => setShowRatingDialog(true)} className="w-full h-12">
            <Star size={18} className="me-2" />
            {t('rateBusiness')}
          </Button>
        )}

        {/* QR Scan Button (only for shifts) */}
        {isShiftType && isAccepted && !isCheckedOut && (
          <Button variant="outline" onClick={() => setShowScanner(true)} className="w-full h-12">
            <QrCode size={18} className="me-2" />
            {isCheckedIn ? t('checkOut') : t('checkIn')} - {t('scanQR')}
          </Button>
        )}

        {/* Apply Button */}
        {!hasApplied && (
          <Button onClick={handleApply} disabled={!isVerified || applyMutation.isPending} className="w-full h-14">
            {applyMutation.isPending ? t('loading') : t('apply')}
          </Button>
        )}

        {/* Status Display */}
        {hasApplied && !isAccepted && !isCompleted && (
          <Button disabled className="w-full h-14">{isRTL ? 'تم التقديم' : 'Already Applied'}</Button>
        )}
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Rating Dialog */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        jobId={id || ''}
        toUserId={job.business_id || ''}
        userName={job.businesses?.trade_name || job.businesses?.legal_name || ''}
      />
    </MobileLayout>
  );
}
