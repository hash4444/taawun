import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { BusinessDesktopShell } from '@/components/layout/BusinessDesktopShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, AlertCircle, Calendar, Users, Clock, Briefcase, ChevronRight } from 'lucide-react';
import { useMyPostedJobs, JOB_TYPE_LABELS } from '@/hooks/useJobs';
import { useBusinessApplicationsCount } from '@/hooks/useApplications';
import { format } from 'date-fns';

export default function BusinessDashboard() {
  const { t, isRTL } = useApp();
  const { businessData, isVerified, verificationStatus } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: jobs, isLoading } = useMyPostedJobs();
  const { data: applicantsCount } = useBusinessApplicationsCount();

  const activeJobs = jobs?.filter(j => j.status === 'open' || j.status === 'in_progress') || [];
  const upcomingJobs = jobs?.filter(j => j.status === 'open' && j.start_time && new Date(j.start_time) > new Date()) || [];

  const stats = [
    {
      icon: Briefcase,
      label: isRTL ? 'وظائف نشطة' : 'Active Jobs',
      value: String(activeJobs.length),
    },
    {
      icon: Users,
      label: t('applicants'),
      value: String(applicantsCount ?? 0),
    },
    {
      icon: Clock,
      label: t('upcoming'),
      value: String(upcomingJobs.length),
    },
  ];

  const verificationBanner = !isVerified && (
    <button
      onClick={() => navigate('/business/verification')}
      className={
        isMobile
          ? 'w-full p-3 rounded-xl bg-warning-light border border-warning/20 flex items-center gap-3 mb-4'
          : 'w-full p-4 rounded-xl bg-warning-light border border-warning/20 flex items-center gap-3'
      }
    >
      <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="text-warning" size={20} />
      </div>
      <div className="text-start flex-1">
        <p className="font-medium text-foreground text-sm">{t('verificationRequired')}</p>
        <p className="text-xs text-muted-foreground">{t('completeVerification')}</p>
      </div>
    </button>
  );

  if (!isMobile) {
    return (
      <BusinessDesktopShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-page-title text-foreground">{t('dashboard')}</h1>
              <p className="text-body text-muted-foreground mt-1">
                {isRTL ? 'نظرة عامة على وظائفك ونشاطك' : "Overview of your jobs and activity"}
              </p>
            </div>
            <Button onClick={() => navigate('/business/post-job')} disabled={!isVerified} size="lg">
              <Plus size={18} className="me-2" />
              {isRTL ? 'نشر وظيفة' : 'Post a Job'}
            </Button>
          </div>

          {verificationBanner}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card-elevated p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <stat.icon size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                  <p className="text-caption text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Active jobs table */}
          <div className="card-elevated overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-card-title font-semibold text-foreground">
                {isRTL ? 'الوظائف النشطة' : 'Active Jobs'}
              </h2>
              <button
                onClick={() => navigate('/business/workers')}
                className="text-body text-primary font-medium hover:underline"
              >
                {t('viewAll')}
              </button>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{isRTL ? 'لا توجد وظائف نشطة' : 'No active jobs'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? 'الوظيفة' : 'Job Title'}</TableHead>
                    <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isRTL ? 'الشواغر' : 'Slots'}</TableHead>
                    <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/business/job/${job.id}`)}
                    >
                      <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en'] || job.job_type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {format(new Date(job.start_time), 'MMM dd')}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.slots_filled || 0}/{job.slots_total}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={job.status === 'open' ? 'applied' : 'pending'}
                          size="sm"
                          showIcon={false}
                        />
                      </TableCell>
                      <TableCell>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </BusinessDesktopShell>
    );
  }

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-light to-transparent px-4 pt-safe pb-4">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div>
            <h1 className="text-page-title text-foreground leading-tight">{t('dashboard')}</h1>
            <p className="text-base text-muted-foreground/80 mt-2">
              {(businessData?.trade_name as string | undefined) ||
                (businessData?.legal_name as string | undefined) ||
                ''}
            </p>
          </div>

          <StatusBadge status={verificationStatus} size="sm" />
        </div>

        {verificationBanner}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card-elevated p-3 text-center">
              <stat.icon size={20} className="mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <Button
          onClick={() => navigate('/business/post-job')}
          disabled={!isVerified}
          className="w-full h-12"
          size="lg"
        >
          <Plus size={20} className="me-2" />
          {isRTL ? 'نشر وظيفة' : 'Post a Job'}
        </Button>
      </div>

      {/* Active Jobs */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isRTL ? 'الوظائف النشطة' : 'Active Jobs'}
          </h2>
          <button className="text-sm text-primary font-medium">{t('viewAll')}</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{isRTL ? 'لا توجد وظائف نشطة' : 'No active jobs'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.slice(0, 5).map((job) => (
              <button
                key={job.id}
                onClick={() => navigate(`/business/job/${job.id}`)}
                className="w-full text-start p-4 card-elevated transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-card-title text-foreground">{job.title}</h3>
                    <span className="text-caption text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                      {JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en'] || job.job_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-caption text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {format(new Date(job.start_time), 'MMM dd')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {job.slots_filled || 0}/{job.slots_total}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
