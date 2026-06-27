import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { JobCard } from '@/components/jobs/JobCard';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useOpenJobs, JobType } from '@/hooks/useJobs';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const FREELANCE_FILTERS = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'digital_service', en: 'Digital Services', ar: 'خدمات رقمية' },
  { key: 'freelance', en: 'Freelance Projects', ar: 'مشاريع حرة' },
];

export default function FreelanceMarketplace() {
  const { isRTL } = useApp();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const jobType = activeFilter === 'all' ? undefined : (activeFilter as JobType);

  // Fetch freelance + digital_service jobs when "all" is selected
  const { data: freelanceJobs, isLoading: loadingFreelance } = useOpenJobs('freelance');
  const { data: digitalJobs, isLoading: loadingDigital } = useOpenJobs('digital_service');
  const { data: filteredTypeJobs, isLoading: loadingFiltered } = useOpenJobs(jobType);

  const isLoading = activeFilter === 'all' ? (loadingFreelance || loadingDigital) : loadingFiltered;
  const allJobs = activeFilter === 'all'
    ? [...(freelanceJobs || []), ...(digitalJobs || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : (filteredTypeJobs || []);

  const filteredJobs = allJobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.businesses?.trade_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchInput = (
    <div className="relative flex-1">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <Input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={isRTL ? 'ابحث عن خدمات ومشاريع...' : 'Search services & gigs...'}
        className="ps-10 h-11 bg-card"
      />
    </div>
  );

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
        {isRTL ? 'لا توجد خدمات أو مشاريع متاحة' : 'No gigs or services available'}
      </p>
    </div>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="space-y-6 max-w-6xl mx-auto">
          <h1 className="text-page-title text-foreground">{isRTL ? 'سوق العمل الحر' : 'Freelance Marketplace'}</h1>

          <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
            {/* Filter sidebar */}
            <div className="card-elevated p-5 space-y-4 sticky top-6">
              <div>
                <label htmlFor="freelance-search" className="text-caption font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  {isRTL ? 'بحث' : 'Search'}
                </label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="freelance-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? 'ابحث عن خدمات ومشاريع...' : 'Search services & gigs...'}
                    className="ps-9 h-10 bg-background"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-1.5">
                <p className="text-caption font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {isRTL ? 'النوع' : 'Type'}
                </p>
                {FREELANCE_FILTERS.map(({ key, en, ar }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={cn(
                      'w-full text-start px-3 py-2 rounded-lg text-body transition-all',
                      activeFilter === key
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {isRTL ? ar : en}
                  </button>
                ))}
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
      header={<PageHeader title={isRTL ? 'سوق العمل الحر' : 'Freelance Marketplace'} showBack />}
      footer={<BottomNav />}
      noPadding
    >
      {/* Search */}
      <div className="px-4 py-3 flex gap-2">
        {searchInput}
        <button className="w-11 h-11 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <SlidersHorizontal size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="px-4 pb-3">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {FREELANCE_FILTERS.map(({ key, en, ar }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  'px-4 py-2 rounded-full border transition-all whitespace-nowrap text-sm',
                  activeFilter === key
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                {isRTL ? ar : en}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
