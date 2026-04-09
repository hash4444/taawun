import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
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

  return (
    <MobileLayout
      header={<PageHeader title={isRTL ? 'سوق العمل الحر' : 'Freelance Marketplace'} showBack />}
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
            placeholder={isRTL ? 'ابحث عن خدمات ومشاريع...' : 'Search services & gigs...'}
            className="ps-10 h-11 bg-card"
          />
        </div>
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
        <p className="text-sm text-muted-foreground mb-3">
          {isLoading
            ? (isRTL ? 'جاري التحميل...' : 'Loading...')
            : (isRTL ? `${filteredJobs.length} نتيجة` : `${filteredJobs.length} results`)}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {isRTL ? 'لا توجد خدمات أو مشاريع متاحة' : 'No gigs or services available'}
            </p>
          </div>
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
