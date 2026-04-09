import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useJob, useUpdateJob } from '@/hooks/useJobs';
import { useJobApplications, useUpdateApplication } from '@/hooks/useApplications';
import { useJobAttendanceList, useApproveAttendance } from '@/hooks/useAttendance';
import { useHasRated } from '@/hooks/useRatings';
import { QRCodeDisplay } from '@/components/attendance/QRCodeDisplay';
import { RatingDialog } from '@/components/ratings/RatingDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, Calendar, Banknote, Users, Check, X, Star, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function BusinessJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, isRTL } = useApp();
  const { user } = useAuth();

  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingWorkerId, setRatingWorkerId] = useState('');
  const [ratingWorkerName, setRatingWorkerName] = useState('');

  const { data: job, isLoading } = useJob(id || '');
  const { data: applications } = useJobApplications(id || '');
  const { data: attendanceList } = useJobAttendanceList(id || '');
  
  const updateMutation = useUpdateApplication();
  const updateJobMutation = useUpdateJob();
  const approveAttendanceMutation = useApproveAttendance();

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateMutation.mutateAsync({ id: appId, status });
      toast.success(status === 'accepted' ? (isRTL ? 'تم القبول' : 'Accepted') : (isRTL ? 'تم الرفض' : 'Rejected'));
    } catch (error: any) {
      toast.error(isRTL ? 'فشلت العملية' : 'Operation failed');
    }
  };

  const handleApproveAttendance = async (attendanceId: string) => {
    try {
      await approveAttendanceMutation.mutateAsync(attendanceId);
      toast.success(isRTL ? 'تمت الموافقة على الحضور' : 'Attendance approved');
    } catch {
      toast.error(isRTL ? 'فشلت العملية' : 'Operation failed');
    }
  };

  const handleCompleteJob = async () => {
    if (!id) return;
    try {
      await updateJobMutation.mutateAsync({ id, status: 'completed' });
      
      // Mark all accepted applications as completed
      const acceptedApps = applications?.filter(a => a.status === 'accepted') || [];
      for (const app of acceptedApps) {
        await updateMutation.mutateAsync({ id: app.id, status: 'completed' });
      }
      
      toast.success(isRTL ? 'تم إنهاء الوظيفة' : 'Job completed');
    } catch {
      toast.error(isRTL ? 'فشلت العملية' : 'Operation failed');
    }
  };

  const openRatingDialog = (workerId: string, workerName: string) => {
    setRatingWorkerId(workerId);
    setRatingWorkerName(workerName);
    setShowRatingDialog(true);
  };

  if (isLoading) {
    return <MobileLayout header={<PageHeader title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'} showBack />}><div className="p-4"><div className="h-60 bg-muted rounded-xl animate-pulse" /></div></MobileLayout>;
  }

  if (!job) {
    return <MobileLayout header={<PageHeader title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'} showBack />}><div className="p-4 text-center text-muted-foreground">{isRTL ? 'لم يتم العثور على الوظيفة' : 'Job not found'}</div></MobileLayout>;
  }

  const acceptedApplications = applications?.filter(a => a.status === 'accepted' || a.status === 'completed') || [];
  const pendingApplications = applications?.filter(a => a.status === 'applied') || [];
  const isJobActive = job.status === 'open' || job.status === 'in_progress';
  const isJobCompleted = job.status === 'completed';
  const isShiftType = job.job_type === 'shift';

  return (
    <MobileLayout header={<PageHeader title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'} showBack />} noPadding>
      <div className="px-4 py-4 space-y-4">
        {/* Job Info Card */}
        <div className="card-elevated p-4">
          <h1 className="text-xl font-bold mb-4">{job.title}</h1>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><MapPin size={16} className="text-primary" /><span>{job.address || 'Riyadh'}</span></div>
            {job.start_time && (
              <>
                <div className="flex items-center gap-3"><Calendar size={16} className="text-primary" /><span>{format(new Date(job.start_time), 'yyyy-MM-dd')}</span></div>
                <div className="flex items-center gap-3"><Clock size={16} className="text-primary" /><span>{format(new Date(job.start_time), 'HH:mm')} - {format(new Date(job.end_time), 'HH:mm')}</span></div>
              </>
            )}
            <div className="flex items-center gap-3"><Banknote size={16} className="text-primary" /><span>{job.pay_amount} SAR</span></div>
            <div className="flex items-center gap-3"><Users size={16} className="text-primary" /><span>{job.slots_filled || 0}/{job.slots_total} {isRTL ? 'موظف' : 'workers'}</span></div>
          </div>
        </div>

        {/* QR Code for Attendance (only for shift-type jobs) */}
        {isShiftType && isJobActive && acceptedApplications.length > 0 && (
          <QRCodeDisplay 
            jobId={id || ''} 
            businessId={user?.id || ''} 
            action={attendanceList?.some(a => a.check_in_at && !a.check_out_at) ? 'check_out' : 'check_in'}
          />
        )}

        {/* Tabs for Applications & Workers */}
        <Tabs defaultValue="applicants" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applicants">
              {t('applicants')} ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="workers">
              {isRTL ? 'العمال' : 'Workers'} ({acceptedApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applicants" className="mt-4">
            {pendingApplications.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {isRTL ? 'لا يوجد متقدمين جدد' : 'No new applicants'}
              </p>
            ) : (
              <div className="space-y-3">
                {pendingApplications.map(app => {
                  const workerProfile = (app.workers as any)?.profiles;
                  return (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                      <span className="font-medium">{workerProfile?.full_name || (isRTL ? 'عامل' : 'Worker')}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => handleUpdateStatus(app.id, 'accepted')}>
                          <Check size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.id, 'rejected')}>
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workers" className="mt-4">
            {acceptedApplications.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {isRTL ? 'لا يوجد عمال مقبولين' : 'No accepted workers'}
              </p>
            ) : (
              <div className="space-y-3">
                {acceptedApplications.map(app => {
                  const workerProfile = (app.workers as any)?.profiles;
                  const workerName = workerProfile?.full_name || (isRTL ? 'عامل' : 'Worker');
                  const attendance = attendanceList?.find(a => a.worker_id === app.worker_id);
                  
                  return (
                    <div key={app.id} className="card-elevated p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{workerName}</span>
                        {app.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRatingDialog(app.worker_id, workerName)}
                          >
                            <Star size={14} className="me-1" />
                            {t('rateWorker')}
                          </Button>
                        )}
                      </div>
                      
                      {isShiftType && attendance && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('checkIn')}:</span>
                            <span>{attendance.check_in_at ? format(new Date(attendance.check_in_at), 'HH:mm') : '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('checkOut')}:</span>
                            <span>{attendance.check_out_at ? format(new Date(attendance.check_out_at), 'HH:mm') : '-'}</span>
                          </div>
                          {!attendance.approved_by_business && attendance.check_out_at && (
                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleApproveAttendance(attendance.id)}
                            >
                              <CheckCircle2 size={14} className="me-1" />
                              {isRTL ? 'الموافقة على الحضور' : 'Approve Attendance'}
                            </Button>
                          )}
                          {attendance.approved_by_business && (
                            <div className="flex items-center gap-1 text-success text-sm mt-2">
                              <CheckCircle2 size={14} />
                              {t('attendanceApproved')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Complete Job Button */}
        {isJobActive && acceptedApplications.length > 0 && (
          <Button onClick={handleCompleteJob} className="w-full h-12" variant="default">
            {isRTL ? 'إنهاء الوظيفة' : 'Complete Job'}
          </Button>
        )}
      </div>

      {/* Rating Dialog */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        jobId={id || ''}
        toUserId={ratingWorkerId}
        userName={ratingWorkerName}
      />
    </MobileLayout>
  );
}
