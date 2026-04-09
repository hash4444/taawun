import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
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
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const jobType = category as JobType;
  const { data: jobs, isLoading } = useOpenJobs(jobType);

  const filteredJobs = (jobs || []).filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.businesses?.trade_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const title = CATEGORY_TITLES[category || '']?.[isRTL ? 'ar' : 'en'] || category || '';

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
              {isRTL ? 'لا توجد وظائف متاحة حالياً' : 'No jobs available at the moment'}
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
