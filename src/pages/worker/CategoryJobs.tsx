import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { JobCard } from '@/components/jobs/JobCard';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useOpenJobs, JOB_TYPE_LABELS, JobType } from '@/hooks/useJobs';
import { useState } from 'react';

const CATEGORY_TITLES: Record<string, { en: string; ar: string }> = {
  full_time: { en: 'Full-Time Jobs', ar: 'وظائف دوام كامل' },
  part_time: { en: 'Part-Time Jobs', ar: 'وظائف دوام جزئي' },
  internship: { en: 'Internships', ar: 'فرص تدريب' },
  shift: { en: 'Shifts', ar: 'ورديات' },
};

export default function CategoryJobs() {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const { isRTL } = useApp();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const jobType = category as JobType;
  const { data: jobs, isLoading } = useOpenJobs(jobType);

  const filteredJobs = (jobs || []).filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.businesses?.trade_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const title = CATEGORY_TITLES[category || '']?.[isRTL ? 'ar' : 'en'] || category || '';

  const resultsCount = (
    <p className="text-sm text-muted-foreground">
      {isLoading
        ? (isRTL ? 'جاري التحميل...' : 'Loading...')
        : (isRTL ? `${filteredJobs.length} نتيجة` : `${filteredJobs.length} results`)}
    </p>
  );

  const emptyResults = (
    <div className="text-center py-16">
      <p className="text-muted-foreground">
        {isRTL ? 'لا توجد وظائف متاحة حالياً' : 'No jobs available at the moment'}
      </p>
    </div>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="space-y-6 max-w-6xl mx-auto">
          <h1 className="text-page-title text-foreground">{title}</h1>

          <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
            {/* Filter sidebar */}
            <div className="card-elevated p-5 space-y-4 sticky top-6">
              <div>
                <label htmlFor="cat-search" className="text-caption font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  {isRTL ? 'بحث' : 'Search'}
                </label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="cat-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? 'بحث...' : 'Search...'}
                    className="ps-9 h-10 bg-background"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-caption font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {isRTL ? 'الفئة' : 'Category'}
                </p>
                <p className="text-body text-foreground">{title}</p>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {resultsCount}

              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                emptyResults
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title={title} showBack />}
      footer={<BottomNav />}
      noPadding
    >
      {/* Search */}
      <div className="px-4 py-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'بحث...' : 'Search...'}
            className="ps-10 h-11 bg-card"
          />
        </div>
        <button className="w-11 h-11 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <SlidersHorizontal size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Results */}
      <div className="px-4 py-2 pb-4">
        <div className="mb-3">{resultsCount}</div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          emptyResults
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
