import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useMarketplaceJobs, type JobFilters } from '@/hooks/useMarketplaceJobs';
import { JobCard } from '@/components/jobs/JobCard';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal } from 'lucide-react';
import { UAE_LOCATIONS, UAE_LOCATION_AR } from '@/lib/marketplace';
import { useAvailabilityPreferences, useCalendarEvents } from '@/hooks/useAvailability';
import { assessAvailability } from '@/lib/availability';

const TYPES = [ ['part_time', 'Part-time', 'دوام جزئي'], ['internship', 'Internships', 'تدريب عملي'], ['graduate', 'Graduate jobs', 'وظائف الخريجين'], ['shift', 'Temporary shifts', 'ورديات مؤقتة'], ['freelance', 'Project work', 'مشاريع'], ['full_time', 'Full-time', 'دوام كامل'] ];
export default function WorkerJobs() {
  const { isRTL } = useApp();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const filters: JobFilters = { query: params.get('q') || '', type: (params.get('type') || '') as JobFilters['type'], location: params.get('location') || '', minimumPay: Number(params.get('pay')) || undefined, paymentModel: (params.get('period') || '') as JobFilters['paymentModel'], remoteOnly: params.get('remote') === '1', page: Number(params.get('page')) || 0 };
  const jobs = useMarketplaceJobs(filters);
  const preferences = useAvailabilityPreferences();
  const events = useCalendarEvents();
  const availableOnly = params.get('available') === '1';
  const update = (key: string, value: string) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); next.delete('page'); return next; });
  const visible = (jobs.data?.jobs || []).filter(job => !availableOnly || (job.schedule_kind === 'fixed' && preferences.isSuccess && events.isSuccess && assessAvailability({ start_at: job.start_time, end_at: job.end_time }, preferences.data, events.data || []).compatible));
  const selectClass = 'w-full h-11 rounded-lg border border-input bg-background px-3 text-sm';
  return <MarketplaceLayout title={isRTL ? 'استكشف الفرص' : 'Explore opportunities'} description={isRTL ? 'عمل وخبرة يناسبان حياتك الجامعية في الإمارات.' : 'Find work and experience around student life in the UAE.'}>
    <form onSubmit={event => { event.preventDefault(); update('q', query); }} className="flex gap-2"><Input aria-label={isRTL ? 'ابحث عن وظيفة' : 'Search opportunities'} value={query} onChange={event => setQuery(event.target.value)} placeholder={isRTL ? 'المسمى الوظيفي أو المهارات' : 'Job title or skills'} type="search" className="h-12" /><Button type="submit" className="h-12"><Search size={18} /><span className="sr-only">{isRTL ? 'بحث' : 'Search'}</span></Button></form>
    <section className="card-elevated p-4 space-y-4" aria-label={isRTL ? 'تصفية الفرص' : 'Filter opportunities'}><h2 className="font-semibold flex gap-2 items-center"><SlidersHorizontal size={17} />{isRTL ? 'ابحث عما يناسبك' : 'Make it fit'}</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="space-y-1"><Label htmlFor="job-type">{isRTL ? 'نوع الفرصة' : 'Opportunity type'}</Label><select id="job-type" className={selectClass} value={filters.type} onChange={e => update('type', e.target.value)}><option value="">{isRTL ? 'جميع الأنواع' : 'All types'}</option>{TYPES.map(([value,en,ar]) => <option key={value} value={value}>{isRTL ? ar : en}</option>)}</select></div>
      <div className="space-y-1"><Label htmlFor="job-location">{isRTL ? 'الإمارة' : 'Emirate'}</Label><select id="job-location" className={selectClass} value={filters.location} onChange={e => update('location', e.target.value)}><option value="">{isRTL ? 'كل الإمارات' : 'All Emirates'}</option>{UAE_LOCATIONS.map(city => <option key={city} value={city}>{isRTL ? UAE_LOCATION_AR[city] : city}</option>)}</select></div>
      <div className="space-y-1"><Label htmlFor="pay-period">{isRTL ? 'طريقة الأجر' : 'Pay period'}</Label><select id="pay-period" className={selectClass} value={filters.paymentModel} onChange={e => update('period', e.target.value)}><option value="">{isRTL ? 'أي فترة' : 'Any period'}</option><option value="hourly">{isRTL ? 'بالساعة' : 'Hourly'}</option><option value="monthly">{isRTL ? 'شهرياً' : 'Monthly'}</option><option value="fixed">{isRTL ? 'مبلغ ثابت' : 'Fixed'}</option></select></div>
      <div className="space-y-1"><Label htmlFor="minimum-pay">{isRTL ? 'الحد الأدنى (درهم)' : 'Minimum pay (AED)'}</Label><Input id="minimum-pay" min={0} type="number" value={filters.minimumPay || ''} onChange={e => update('pay', e.target.value)} placeholder="0" /></div>
    </div><div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={filters.remoteOnly} onChange={e => update('remote', e.target.checked ? '1' : '')} />{isRTL ? 'عن بُعد فقط' : 'Remote only'}</label><label className="flex items-center gap-2"><input type="checkbox" checked={availableOnly} onChange={e => update('available', e.target.checked ? '1' : '')} />{isRTL ? 'ورديات تناسب جدولك' : 'Shifts that fit my availability'}</label><button type="button" className="text-primary underline ms-auto" onClick={() => { setQuery(''); setParams({}); }}>{isRTL ? 'مسح الفلاتر' : 'Clear filters'}</button></div>{availableOnly && <p className="text-xs text-muted-foreground">{isRTL ? 'نراجع الورديات في كل صفحة وفق تفضيلاتك والتقويم المستورد. أضف جدولك من ملفك الشخصي.' : 'Checks shifts on each results page against your saved preferences and imported calendar. Set availability in Profile.'}</p>}</section>
    <p className="text-sm text-muted-foreground" role="status">{jobs.data ? (isRTL ? `${jobs.data.count} فرصة` : `${jobs.data.count} opportunities`) : (isRTL ? 'جاري البحث…' : 'Finding opportunities…')}{availableOnly && jobs.data && ` · ${visible.length} ${isRTL ? 'متوافقة في هذه الصفحة' : 'compatible on this page'}`}</p>
    {jobs.isError ? <QueryMessage error={jobs.error} onRetry={() => jobs.refetch()} /> : jobs.isLoading ? <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />)}</div> : visible.length ? <div className="grid md:grid-cols-2 gap-4">{visible.map(job => <JobCard key={job.id} job={job} />)}</div> : <QueryMessage empty={isRTL ? 'لا توجد فرص مطابقة هنا. جرّب فلاتر أخرى أو الصفحة التالية.' : 'No matching opportunities here. Try different filters or the next page.'} />}
    {jobs.data && jobs.data.count > jobs.data.pageSize && <div className="flex justify-center items-center gap-4"><Button variant="outline" disabled={!filters.page || jobs.isFetching} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(Math.max(0, (filters.page || 0)-1))); return next; })}>{isRTL ? 'السابق' : 'Previous'}</Button><span className="text-sm">{(filters.page || 0)+1} / {Math.ceil(jobs.data.count/jobs.data.pageSize)}</span><Button variant="outline" disabled={((filters.page || 0)+1)*jobs.data.pageSize >= jobs.data.count || jobs.isFetching} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String((filters.page || 0)+1)); return next; })}>{isRTL ? 'التالي' : 'Next'}</Button></div>}
  </MarketplaceLayout>;
}
