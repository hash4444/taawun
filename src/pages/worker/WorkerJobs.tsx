import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { JobCard } from '@/components/jobs/JobCard';
import { cn } from '@/lib/utils';
import { useWorkerApplications } from '@/hooks/useApplications';

type TabKey = 'upcoming' | 'completed' | 'cancelled';

export default function WorkerJobs() {
  const { t, isRTL } = useApp();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const { data: applications, isLoading } = useWorkerApplications();

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'upcoming', label: t('upcoming') },
    { key: 'completed', label: t('completed') },
    { key: 'cancelled', label: t('cancelled') },
  ];

  // Filter applications by tab
  const getJobsForTab = (tab: TabKey) => {
    if (!applications) return [];

    return applications
      .filter((app) => {
        if (tab === 'upcoming') {
          return app.status === 'accepted' || app.status === 'applied';
        }
        if (tab === 'completed') {
          return app.status === 'completed';
        }
        if (tab === 'cancelled') {
          return app.status === 'cancelled' || app.status === 'rejected';
        }
        return false;
      })
      .map((app) => app.jobs)
      .filter(Boolean);
  };

  const currentJobs = getJobsForTab(activeTab);

  const tabsRow = (
    <div className="flex gap-2 p-1 bg-muted rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.key
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const emptyState = (
    <div className="text-center py-12">
      <p className="text-muted-foreground">
        {isRTL ? 'لا توجد وظائف' : 'No jobs'}
      </p>
    </div>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="space-y-6 max-w-6xl mx-auto">
          <h1 className="text-page-title text-foreground">{isRTL ? 'وظائفي' : 'My Jobs'}</h1>

          {tabsRow}

          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : currentJobs.length === 0 ? (
            emptyState
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {currentJobs.map((job) => (
                <JobCard key={job!.id} job={job!} />
              ))}
            </div>
          )}
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title={isRTL ? 'وظائفي' : 'My Jobs'} />}
      footer={<BottomNav />}
      noPadding
    >
      {/* Tabs */}
      <div className="px-4 pt-2">
        {tabsRow}
      </div>

      {/* Jobs List */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : currentJobs.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-3">
            {currentJobs.map((job) => (
              <JobCard key={job!.id} job={job!} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
