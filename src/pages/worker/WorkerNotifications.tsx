import { useState, useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Sparkles,
  CalendarDays,
  Settings,
  FileText,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
} from 'lucide-react';

type TabKey = 'all' | 'jobs' | 'ai' | 'events' | 'system';
type NotifCategory = 'jobs' | 'ai' | 'events' | 'system';

interface Notification {
  id: string;
  category: NotifCategory;
  icon: typeof Bell;
  iconColor: string;
  iconBg: string;
  headline: string;
  headlineAr: string;
  body: string;
  bodyAr: string;
  timestamp: string;
  action?: { label: string; labelAr: string; path: string };
  read: boolean;
}

const TABS: { key: TabKey; en: string; ar: string }[] = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'jobs', en: 'Jobs', ar: 'وظائف' },
  { key: 'ai', en: 'AI Insights', ar: 'رؤى AI' },
  { key: 'events', en: 'Events', ar: 'فعاليات' },
  { key: 'system', en: 'System', ar: 'النظام' },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    category: 'jobs',
    icon: Briefcase,
    iconColor: 'text-primary',
    iconBg: 'bg-primary-light',
    headline: '5 new jobs match your profile',
    headlineAr: '5 وظائف جديدة تطابق ملفك',
    body: 'Full-time positions in tech and marketing sectors aligned with your skills.',
    bodyAr: 'وظائف دوام كامل في قطاعات التقنية والتسويق تتوافق مع مهاراتك.',
    timestamp: '2m ago',
    action: { label: 'View Jobs', labelAr: 'عرض الوظائف', path: '/worker/jobs/full_time' },
    read: false,
  },
  {
    id: '2',
    category: 'ai',
    icon: Sparkles,
    iconColor: 'text-warning-foreground',
    iconBg: 'bg-warning-light',
    headline: 'CV improvement suggestions ready',
    headlineAr: 'اقتراحات تحسين السيرة الذاتية جاهزة',
    body: 'AI found 3 areas to strengthen your CV for better match rates.',
    bodyAr: 'وجد الذكاء الاصطناعي 3 مجالات لتقوية سيرتك الذاتية لمعدلات تطابق أفضل.',
    timestamp: '15m ago',
    action: { label: 'Optimize CV', labelAr: 'تحسين السيرة', path: '/worker/cv' },
    read: false,
  },
  {
    id: '3',
    category: 'events',
    icon: CalendarDays,
    iconColor: 'text-info',
    iconBg: 'bg-info-light',
    headline: 'Tech Career Fair – Tomorrow',
    headlineAr: 'معرض الوظائف التقنية – غداً',
    body: 'Companies attending match your career interests. Don\'t miss it.',
    bodyAr: 'الشركات المشاركة تتوافق مع اهتماماتك المهنية. لا تفوتها.',
    timestamp: '1h ago',
    action: { label: 'Attend Event', labelAr: 'حضور الفعالية', path: '/worker/events' },
    read: false,
  },
  {
    id: '4',
    category: 'ai',
    icon: TrendingUp,
    iconColor: 'text-success',
    iconBg: 'bg-success-light',
    headline: 'Salary trend alert',
    headlineAr: 'تنبيه اتجاه الرواتب',
    body: 'Average salaries for your role increased 8% this quarter in your region.',
    bodyAr: 'ارتفع متوسط الرواتب لدورك بنسبة 8% هذا الربع في منطقتك.',
    timestamp: '3h ago',
    read: true,
  },
  {
    id: '5',
    category: 'jobs',
    icon: Users,
    iconColor: 'text-primary',
    iconBg: 'bg-primary-light',
    headline: 'NEOM is hiring in your field',
    headlineAr: 'نيوم توظف في مجالك',
    body: 'Multiple openings matching your skills and experience level.',
    bodyAr: 'فرص متعددة تتوافق مع مهاراتك ومستوى خبرتك.',
    timestamp: '5h ago',
    action: { label: 'View Jobs', labelAr: 'عرض الوظائف', path: '/worker/jobs/full_time' },
    read: true,
  },
  {
    id: '6',
    category: 'ai',
    icon: Zap,
    iconColor: 'text-warning-foreground',
    iconBg: 'bg-warning-light',
    headline: 'Monetize your skills',
    headlineAr: 'استثمر مهاراتك',
    body: 'Freelance demand for your top skills is trending up. Consider listing services.',
    bodyAr: 'الطلب على مهاراتك في العمل الحر في ارتفاع. فكر في عرض خدماتك.',
    timestamp: '8h ago',
    action: { label: 'Explore', labelAr: 'استكشف', path: '/worker/freelance' },
    read: true,
  },
  {
    id: '7',
    category: 'system',
    icon: Settings,
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-muted',
    headline: 'Profile verification approved',
    headlineAr: 'تمت الموافقة على التحقق من الملف',
    body: 'Your identity has been verified. You can now apply for all job types.',
    bodyAr: 'تم التحقق من هويتك. يمكنك الآن التقديم على جميع أنواع الوظائف.',
    timestamp: '1d ago',
    read: true,
  },
  {
    id: '8',
    category: 'ai',
    icon: FileText,
    iconColor: 'text-info',
    iconBg: 'bg-info-light',
    headline: 'Interview prep available',
    headlineAr: 'تدريب المقابلات متاح',
    body: 'Based on your recent applications, practice questions are ready for you.',
    bodyAr: 'بناءً على تقديماتك الأخيرة، أسئلة التدريب جاهزة لك.',
    timestamp: '1d ago',
    action: { label: 'Practice', labelAr: 'تدرّب', path: '/worker/cv' },
    read: true,
  },
  {
    id: '9',
    category: 'events',
    icon: CalendarDays,
    iconColor: 'text-info',
    iconBg: 'bg-info-light',
    headline: 'Digital Marketing Bootcamp – Next Week',
    headlineAr: 'بوت كامب التسويق الرقمي – الأسبوع القادم',
    body: 'Aligns with skills gap identified in your profile.',
    bodyAr: 'يتوافق مع الفجوة المهارية المحددة في ملفك.',
    timestamp: '2d ago',
    action: { label: 'Attend Event', labelAr: 'حضور الفعالية', path: '/worker/events' },
    read: true,
  },
];

export default function WorkerNotifications() {
  const { isRTL } = useApp();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(MOCK_NOTIFICATIONS.filter(n => n.read).map(n => n.id))
  );

  const filtered = useMemo(
    () =>
      MOCK_NOTIFICATIONS.filter(
        n => activeTab === 'all' || n.category === activeTab
      ),
    [activeTab]
  );

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readIds.has(n.id)).length;

  const markRead = (id: string) => setReadIds(prev => new Set(prev).add(id));

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
        {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
      </p>
    </div>
  );

  const renderNotifRow = (notif: Notification, dense: boolean) => {
    const Icon = notif.icon;
    const isRead = readIds.has(notif.id);

    return (
      <div
        key={notif.id}
        onClick={() => markRead(notif.id)}
        className={cn(
          'rounded-xl border bg-card transition-all hover:shadow-sm cursor-pointer',
          dense ? 'p-4' : 'p-3',
          isRead ? 'border-border/40' : 'border-primary/20 bg-primary-light/30'
        )}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div
            className={cn(
              'rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
              dense ? 'w-9 h-9' : 'w-8 h-8',
              notif.iconBg
            )}
          >
            <Icon size={dense ? 16 : 14} className={notif.iconColor} strokeWidth={1.8} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  'text-card-title leading-snug',
                  isRead
                    ? 'font-medium text-foreground/80'
                    : 'font-semibold text-foreground'
                )}
              >
                {isRTL ? notif.headlineAr : notif.headline}
              </h3>
              {!isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-body text-muted-foreground leading-snug mt-0.5">
              {isRTL ? notif.bodyAr : notif.body}
            </p>

            <div className="flex items-center justify-between mt-2">
              <span className="text-caption text-muted-foreground/60">
                {notif.timestamp}
              </span>
              {notif.action && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead(notif.id);
                    navigate(notif.action!.path);
                  }}
                  className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {isRTL ? notif.action.labelAr : notif.action.label}
                  <ChevronRight size={12} className={isRTL ? 'rotate-180' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-page-title text-foreground">{isRTL ? 'الإشعارات' : 'Notifications'}</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">
                {unreadCount}
              </span>
            )}
          </div>

          {tabsRow}

          {filtered.length === 0 ? (
            emptyState
          ) : (
            <div className="space-y-2">
              {filtered.map(notif => renderNotifRow(notif, true))}
            </div>
          )}
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      {/* Header */}
      <PageHeader
        title={isRTL ? 'الإشعارات' : 'Notifications'}
        action={
          unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">
              {unreadCount}
            </span>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="px-4 pt-2 pb-3">
        {tabsRow}
      </div>

      {/* Notification List */}
      <div className="px-4 pb-4 space-y-2">
        {filtered.length === 0 ? emptyState : filtered.map(notif => renderNotifRow(notif, false))}
      </div>
    </MobileLayout>
  );
}
