import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Input } from '@/components/ui/input';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { Search, Briefcase, Clock, GraduationCap, Laptop, ChevronRight, AlertCircle, Sparkles, Bot } from 'lucide-react';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { key: 'full_time', icon: Briefcase },
  { key: 'part_time', icon: Clock },
  { key: 'internship', icon: GraduationCap },
  { key: 'freelance', icon: Laptop },
] as const;

const CATEGORY_LABELS: Record<string, { en: string; ar: string; descEn: string; descAr: string }> = {
  full_time: { en: 'Full-Time', ar: 'دوام كامل', descEn: 'Permanent positions', descAr: 'وظائف دائمة' },
  part_time: { en: 'Part-Time', ar: 'دوام جزئي', descEn: 'Flexible hours', descAr: 'ساعات مرنة' },
  internship: { en: 'Internships', ar: 'تدريب', descEn: 'Learn & grow', descAr: 'تعلم وتطور' },
  freelance: { en: 'Freelance', ar: 'عمل حر', descEn: 'Gigs & services', descAr: 'مشاريع وخدمات' },
};

export default function WorkerHome() {
  const { isRTL } = useApp();
  const { profile, isVerified } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/worker/jobs/full_time?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const greeting = profile?.full_name
    ? (isRTL ? `مرحباً، ${profile.full_name}!` : `Hello, ${profile.full_name}!`)
    : (isRTL ? 'مرحباً!' : 'Hello!');

  const verificationBanner = !isVerified && (
    <button
      onClick={() => navigate('/worker/verification')}
      className="w-full p-3 rounded-xl bg-warning-light border border-warning/20 dark:border-warning/15 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="text-warning" size={20} />
      </div>
      <div className="text-start flex-1">
        <p className="font-medium text-foreground text-sm">
          {isRTL ? 'التحقق مطلوب' : 'Verification Required'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRTL ? 'أكمل التحقق للتقديم على الوظائف' : 'Complete verification to apply for jobs'}
        </p>
      </div>
    </button>
  );

  const categoryGrid = (cols: string) => (
    <div className={cn('grid gap-3', cols)}>
      {CATEGORIES.map(({ key, icon: Icon }) => {
        const label = CATEGORY_LABELS[key];
        return (
          <button
            key={key}
            onClick={() => navigate(key === 'freelance' ? '/worker/freelance' : `/worker/jobs/${key}`)}
            className="relative p-5 rounded-2xl text-start transition-all border border-border/50 dark:border-primary/25 bg-card hover:border-primary/45 dark:hover:border-primary/45 hover:shadow-sm active:scale-[0.97]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-3">
              <Icon size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              {isRTL ? label.ar : label.en}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL ? label.descAr : label.descEn}
            </p>
            <ChevronRight
              size={16}
              className={cn(
                'absolute top-5 text-muted-foreground',
                isRTL ? 'start-5 rotate-180' : 'end-5'
              )}
            />
          </button>
        );
      })}
    </div>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="space-y-6 max-w-5xl mx-auto">
          <div>
            <h1 className="text-page-title text-foreground">{greeting}</h1>
            <p className="text-body text-muted-foreground mt-1">
              {isRTL ? 'ماذا تبحث عن اليوم؟' : 'What are you looking for today?'}
            </p>
          </div>

          {verificationBanner}

          {/* Search + location */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={isRTL ? 'ابحث عن وظائف، شركات...' : 'Search jobs, companies...'}
                className="ps-10 h-12 bg-card text-base rounded-xl"
              />
            </div>
            <LocationSelector />
          </div>

          {/* Assistant CTAs */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/worker/cv')}
              className="p-5 rounded-2xl bg-primary text-primary-foreground flex items-center gap-4 hover:bg-primary/90 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="text-start flex-1">
                <h3 className="font-bold text-base">
                  {isRTL ? 'تحدث مع مساعدك المهني' : 'Talk to Your Career Assistant'}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  {isRTL ? 'بناء السيرة • بحث وظائف • تدريب مقابلات' : 'Build CV • Find Jobs • Interview Prep'}
                </p>
              </div>
              <ChevronRight size={20} className={cn('opacity-80 flex-shrink-0', isRTL && 'rotate-180')} />
            </button>

            <button
              onClick={() => navigate('/worker/job-hunter')}
              className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={24} className="text-primary" />
              </div>
              <div className="text-start flex-1">
                <h3 className="font-semibold text-base text-foreground">
                  {isRTL ? 'وكيل البحث عن وظائف بالذكاء الاصطناعي' : 'AI Job Hunter'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRTL ? 'مطابقة تلقائية وتقديم على الوظائف نيابة عنك' : 'Auto-match and apply to jobs for you'}
                </p>
              </div>
              <ChevronRight size={20} className={cn('text-muted-foreground flex-shrink-0', isRTL && 'rotate-180')} />
            </button>
          </div>

          {/* Category Cards */}
          <div>
            <h2 className="text-card-title font-semibold text-foreground mb-4">
              {isRTL ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </h2>
            {categoryGrid('grid-cols-4')}
          </div>
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      {/* Header */}
      <PageHeader
        title={greeting}
        subtitle={isRTL ? 'ماذا تبحث عن اليوم؟' : 'What are you looking for today?'}
        action={<LanguageSwitch />}
      />

      <div className="px-4">
        <div className="mb-5">
          <LocationSelector />
        </div>

        {verificationBanner && <div className="mb-5">{verificationBanner}</div>}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isRTL ? 'ابحث عن وظائف، شركات...' : 'Search jobs, companies...'}
            className="ps-10 h-12 bg-card text-base rounded-xl"
          />
        </div>
      </div>

      {/* Career Assistant CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/worker/cv')}
          className="w-full p-4 rounded-2xl bg-primary dark:bg-primary/90 text-primary-foreground flex items-center gap-4 hover:bg-primary/90 dark:hover:bg-primary transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
            <Sparkles size={24} />
          </div>
          <div className="text-start flex-1">
            <h3 className="font-bold text-base">
              {isRTL ? 'تحدث مع مساعدك المهني' : 'Talk to Your Career Assistant'}
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {isRTL ? 'بناء السيرة • بحث وظائف • تدريب مقابلات' : 'Build CV • Find Jobs • Interview Prep'}
            </p>
          </div>
          <ChevronRight size={20} className={cn('opacity-80', isRTL && 'rotate-180')} />
        </button>
      </div>

      {/* AI Job Hunter CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/worker/job-hunter')}
          className="w-full p-4 rounded-2xl border border-border bg-card flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Bot size={24} className="text-primary" />
          </div>
          <div className="text-start flex-1">
            <h3 className="font-semibold text-base text-foreground">
              {isRTL ? 'وكيل البحث عن وظائف بالذكاء الاصطناعي' : 'AI Job Hunter'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL ? 'مطابقة تلقائية وتقديم على الوظائف نيابة عنك' : 'Auto-match and apply to jobs for you'}
            </p>
          </div>
          <ChevronRight size={20} className={cn('text-muted-foreground', isRTL && 'rotate-180')} />
        </button>
      </div>

      {/* Category Cards */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {isRTL ? 'تصفح حسب الفئة' : 'Browse by Category'}
        </h2>
        {categoryGrid('grid-cols-2')}
      </div>
    </MobileLayout>
  );
}
