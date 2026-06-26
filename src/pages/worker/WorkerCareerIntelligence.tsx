import { useEffect, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { supabase } from '@/integrations/supabase/client';
import { useCVRecords } from '@/hooks/useCV';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIBrief {
  market_brief: string;
  insights: { title: string; detail: string }[];
  action: { label: string; description: string };
}

const FALLBACK_BRIEF: AIBrief = {
  market_brief: 'Complete your profile and upload a CV to receive a personalised market brief powered by AI. The more data you provide, the sharper your insights become.',
  insights: [
    { title: 'Build your profile', detail: 'A complete profile unlocks AI-matched job recommendations and salary benchmarks tailored to your skills.' },
    { title: 'Upload your CV', detail: 'Your CV helps the AI identify skill gaps, suggest improvements, and match you with relevant opportunities.' },
    { title: 'Set your location', detail: 'Location data lets us surface regional hiring trends, top employers, and competitive salary ranges near you.' },
  ],
  action: { label: 'Get started', description: 'Open the Career Assistant to build your profile and unlock personalised intelligence.' },
};

export default function WorkerCareerIntelligence() {
  const { isRTL } = useApp();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: cvRecords } = useCVRecords();
  const [brief, setBrief] = useState<AIBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!user?.id || fetched) return;
    const hasCV = cvRecords && cvRecords.length > 0;
    if (!hasCV && !profile?.full_name) {
      setBrief(FALLBACK_BRIEF);
      setFetched(true);
      return;
    }

    const fetchBrief = async () => {
      setLoading(true);
      try {
        const cvSummary = hasCV
          ? JSON.stringify({
              title: cvRecords[0].title,
              skills: cvRecords[0].skills,
              summary: cvRecords[0].summary,
            })
          : 'No CV uploaded yet.';

        const resp = await supabase.functions.invoke('career-intelligence', {
          body: {
            userName: profile?.full_name || '',
            cvSummary,
            language: isRTL ? 'ar' : 'en',
          },
        });

        if (resp.error) throw resp.error;
        setBrief(resp.data as AIBrief);
      } catch (e) {
        console.error('Career intelligence error:', e);
        setBrief(FALLBACK_BRIEF);
        toast.error(isRTL ? 'تعذر تحميل الرؤى' : 'Could not load insights');
      } finally {
        setLoading(false);
        setFetched(true);
      }
    };

    fetchBrief();
  }, [user?.id, cvRecords, profile?.full_name, isRTL, fetched]);

  const data = brief || FALLBACK_BRIEF;

  const loadingState = (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <Loader2 size={20} className="animate-spin" />
      <p className="text-xs">{isRTL ? 'جارٍ تحليل السوق…' : 'Analysing market…'}</p>
    </div>
  );

  const marketBriefSection = (
    <section className="card-elevated p-5">
      <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {isRTL ? 'ملخص السوق' : 'Market Brief'}
      </h2>
      <p className="text-body leading-relaxed text-foreground/85">
        {data.market_brief}
      </p>
    </section>
  );

  const insightsSection = (
    <section className="card-elevated p-5">
      <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {isRTL ? 'رؤى مخصصة' : 'Personalised Insights'}
      </h2>
      <div className="space-y-3">
        {data.insights.map((ins, i) => (
          <div key={i} className="border border-border/60 rounded-lg px-3 py-2.5">
            <p className="text-card-title font-semibold text-foreground leading-tight">{ins.title}</p>
            <p className="text-caption text-muted-foreground leading-snug mt-1">{ins.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const actionSection = (
    <section className="card-elevated p-5">
      <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {isRTL ? 'الإجراء الموصى به' : 'Recommended Action'}
      </h2>
      <p className="text-caption text-foreground/70 mb-3">{data.action.description}</p>
      <button
        onClick={() => navigate('/worker/career-assistant')}
        className="inline-flex items-center gap-1.5 text-caption font-medium text-foreground border border-border/80 rounded-md px-3 py-1.5 hover:border-foreground/20 hover:shadow-sm transition-all duration-100 active:scale-[0.98]"
      >
        {data.action.label}
        <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
      </button>
    </section>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="max-w-5xl space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-muted-foreground" strokeWidth={1.5} />
            <h1 className="text-page-title text-foreground">
              {isRTL ? 'ذكاء مهني' : 'Career Intelligence'}
            </h1>
          </div>

          {loading ? (
            loadingState
          ) : (
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">{marketBriefSection}</div>
              {insightsSection}
              {actionSection}
            </div>
          )}
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={
        <PageHeader
          title={isRTL ? 'ذكاء مهني' : 'Career Intelligence'}
          showBack
        />
      }
      footer={<BottomNav />}
      noPadding
    >
      <div className="px-4 pt-5 pb-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {loading ? loadingState : (
          <>
            {marketBriefSection}
            {insightsSection}
            {actionSection}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
