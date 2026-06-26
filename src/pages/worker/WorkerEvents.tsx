import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarDays, MapPin, Building2, Bookmark, BookmarkCheck, UserPlus, Sparkles, Monitor } from 'lucide-react';

type TabKey = 'all' | 'recommended' | 'university' | 'hiring' | 'workshops' | 'virtual';
type EventCategory = 'networking' | 'hiring' | 'workshop' | 'university' | 'virtual';

interface EventItem {
  id: string;
  title: string;
  titleAr: string;
  date: string;
  location: string;
  locationAr: string;
  isVirtual: boolean;
  organizer: string;
  organizerAr: string;
  categories: EventCategory[];
  aiInsight?: string;
  aiInsightAr?: string;
}

const CATEGORY_STYLES: Record<EventCategory, string> = {
  networking: 'bg-info-light text-info',
  hiring: 'bg-success-light text-success',
  workshop: 'bg-warning-light text-warning-foreground',
  university: 'bg-accent text-accent-foreground',
  virtual: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS: Record<EventCategory, { en: string; ar: string }> = {
  networking: { en: 'Networking', ar: 'شبكات' },
  hiring: { en: 'Hiring', ar: 'توظيف' },
  workshop: { en: 'Workshop', ar: 'ورشة عمل' },
  university: { en: 'University', ar: 'جامعة' },
  virtual: { en: 'Virtual', ar: 'افتراضي' },
};

const MOCK_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Tech Career Fair 2026',
    titleAr: 'معرض الوظائف التقنية 2026',
    date: '2026-03-15',
    location: 'Riyadh Front Exhibition Center',
    locationAr: 'مركز الرياض فرونت للمعارض',
    isVirtual: false,
    organizer: 'Saudi Tech Hub',
    organizerAr: 'مركز التقنية السعودي',
    categories: ['hiring', 'networking'],
    aiInsight: 'Companies attending match your career interests',
    aiInsightAr: 'الشركات المشاركة تتوافق مع اهتماماتك المهنية',
  },
  {
    id: '2',
    title: 'Resume & Interview Masterclass',
    titleAr: 'ماستر كلاس السيرة الذاتية والمقابلات',
    date: '2026-03-20',
    location: 'Online – Zoom',
    locationAr: 'عبر الإنترنت – زوم',
    isVirtual: true,
    organizer: 'SkillAnything Academy',
    organizerAr: 'أكاديمية سكل اني ثنج',
    categories: ['workshop', 'virtual'],
    aiInsight: 'Recommended based on your profile',
    aiInsightAr: 'موصى بها بناءً على ملفك الشخصي',
  },
  {
    id: '3',
    title: 'KSU Entrepreneurship Summit',
    titleAr: 'قمة ريادة الأعمال – جامعة الملك سعود',
    date: '2026-04-02',
    location: 'King Saud University',
    locationAr: 'جامعة الملك سعود',
    isVirtual: false,
    organizer: 'KSU Innovation Center',
    organizerAr: 'مركز الابتكار – جامعة الملك سعود',
    categories: ['university', 'networking'],
  },
  {
    id: '4',
    title: 'Digital Marketing Bootcamp',
    titleAr: 'بوت كامب التسويق الرقمي',
    date: '2026-04-10',
    location: 'Online – Google Meet',
    locationAr: 'عبر الإنترنت – جوجل ميت',
    isVirtual: true,
    organizer: 'MarketPro',
    organizerAr: 'ماركت برو',
    categories: ['workshop', 'virtual'],
    aiInsight: 'Aligns with skills gap identified in your profile',
    aiInsightAr: 'يتوافق مع الفجوة المهارية المحددة في ملفك',
  },
  {
    id: '5',
    title: 'NEOM Graduate Hiring Day',
    titleAr: 'يوم توظيف نيوم للخريجين',
    date: '2026-04-18',
    location: 'Jeddah Hilton',
    locationAr: 'هيلتون جدة',
    isVirtual: false,
    organizer: 'NEOM',
    organizerAr: 'نيوم',
    categories: ['hiring'],
    aiInsight: 'Companies attending match your career interests',
    aiInsightAr: 'الشركات المشاركة تتوافق مع اهتماماتك المهنية',
  },
];

const TABS: { key: TabKey; en: string; ar: string }[] = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'recommended', en: 'For You', ar: 'لك' },
  { key: 'university', en: 'University', ar: 'جامعة' },
  { key: 'hiring', en: 'Hiring', ar: 'توظيف' },
  { key: 'workshops', en: 'Workshops', ar: 'ورش عمل' },
  { key: 'virtual', en: 'Virtual', ar: 'افتراضي' },
];

export default function WorkerEvents() {
  const { isRTL } = useApp();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const [attendingEvents, setAttendingEvents] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAttend = (id: string) => {
    setAttendingEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredEvents = MOCK_EVENTS.filter(event => {
    if (activeTab === 'all') return true;
    if (activeTab === 'recommended') return !!event.aiInsight;
    if (activeTab === 'virtual') return event.isVirtual;
    if (activeTab === 'workshops') return event.categories.includes('workshop');
    return event.categories.includes(activeTab as EventCategory);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const tabsRow = (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
            activeTab === tab.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {isRTL ? tab.ar : tab.en}
        </button>
      ))}
    </div>
  );

  const emptyState = (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">
        {isRTL ? 'لا توجد فعاليات' : 'No events found'}
      </p>
    </div>
  );

  const renderEventCard = (event: EventItem) => {
    const isSaved = savedEvents.has(event.id);
    const isAttending = attendingEvents.has(event.id);

    return (
      <div
        key={event.id}
        className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
      >
        {/* Title & Save */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-card-title font-semibold text-foreground leading-snug">
            {isRTL ? event.titleAr : event.title}
          </h3>
          <button
            onClick={() => toggleSave(event.id)}
            className="flex-shrink-0 p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isSaved ? (isRTL ? 'إلغاء الحفظ' : 'Unsave event') : (isRTL ? 'حفظ' : 'Save event')}
          >
            {isSaved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
          </button>
        </div>

        {/* Meta */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <CalendarDays size={12} />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            {event.isVirtual ? <Monitor size={12} /> : <MapPin size={12} />}
            <span>{isRTL ? event.locationAr : event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Building2 size={12} />
            <span>{isRTL ? event.organizerAr : event.organizer}</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {event.categories.map(cat => (
            <span
              key={cat}
              className={cn(
                'px-2 py-0.5 rounded-full text-micro font-medium',
                CATEGORY_STYLES[cat]
              )}
            >
              {isRTL ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en}
            </span>
          ))}
        </div>

        {/* AI Insight */}
        {event.aiInsight && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-accent/50">
            <Sparkles size={12} className="text-primary flex-shrink-0" />
            <span className="text-caption text-accent-foreground">
              {isRTL ? event.aiInsightAr : event.aiInsight}
            </span>
          </div>
        )}

        {/* Attend Button */}
        <button
          onClick={() => toggleAttend(event.id)}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
            isAttending
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <UserPlus size={14} />
          {isAttending
            ? (isRTL ? 'مسجّل' : 'Attending')
            : (isRTL ? 'سجّل حضورك' : 'Attend')}
        </button>
      </div>
    );
  };

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="space-y-6 max-w-6xl">
          <h1 className="text-page-title text-foreground">{isRTL ? 'الفعاليات' : 'Events'}</h1>

          {tabsRow}

          {filteredEvents.length === 0 ? (
            emptyState
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredEvents.map(renderEventCard)}
            </div>
          )}
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      footer={<BottomNav />}
      noPadding
    >
      <PageHeader title={isRTL ? 'الفعاليات' : 'Events'} />
      {/* Tabs - scrollable */}
      <div className="px-4 pt-2 pb-3">
        {tabsRow}
      </div>

      {/* Events List */}
      <div className="px-4 pb-4 space-y-3">
        {filteredEvents.length === 0 ? emptyState : filteredEvents.map(renderEventCard)}
      </div>
    </MobileLayout>
  );
}
