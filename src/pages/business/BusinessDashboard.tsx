import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Calendar, Users, Clock, Briefcase } from 'lucide-react';
import { useMyPostedJobs, JOB_TYPE_LABELS } from '@/hooks/useJobs';
import { format } from 'date-fns';

export default function BusinessDashboard() {
  const { t, isRTL } = useApp();
  const { profile, businessData, isVerified, verificationStatus } = useAuth();
  const navigate = useNavigate();
  
  const { data: jobs, isLoading } = useMyPostedJobs();

  const activeJobs = jobs?.filter(j => j.status === 'open' || j.status === 'filled') || [];
  const upcomingJobs = jobs?.filter(j => j.status === 'in_progress') || [];

  const stats = [
    { 
      icon: Briefcase, 
      label: isRTL ? 'وظائف نشطة' : 'Active Jobs', 
      value: String(activeJobs.length)
    },
    { 
      icon: Users, 
      label: t('applicants'), 
      value: '0'
    },
    { 
      icon: Clock, 
      label: t('upcoming'), 
      value: String(upcomingJobs.length)
    },
  ];

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-light to-transparent px-4 pt-safe pb-4">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t('dashboard')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(businessData as any)?.trade_name || (businessData as any)?.legal_name || profile?.email}
            </p>
          </div>
          
          <StatusBadge status={verificationStatus} size="sm" />
        </div>

        {/* Verification Banner */}
        {!isVerified && (
          <button
            onClick={() => navigate('/business/verification')}
            className="w-full p-3 rounded-xl bg-warning-light border border-warning/20 flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-warning" size={20} />
            </div>
            <div className="text-start flex-1">
              <p className="font-medium text-foreground text-sm">
                {t('verificationRequired')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('completeVerification')}
              </p>
            </div>
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
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
          <button className="text-sm text-primary font-medium">
            {t('viewAll')}
          </button>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isRTL ? 'لا توجد وظائف نشطة' : 'No active jobs'}
            </p>
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
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                      {JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en'] || job.job_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
