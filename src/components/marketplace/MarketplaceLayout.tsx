import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/hooks/useApp';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { BusinessDesktopShell } from '@/components/layout/BusinessDesktopShell';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';

export function MarketplaceLayout({ title, description, children, employer = false, back = false }: { title: string; description?: string; children: ReactNode; employer?: boolean; back?: boolean }) {
  const mobile = useIsMobile();
  const { isRTL } = useApp();
  const content = <div className="max-w-6xl mx-auto space-y-6">{!mobile && <div><h1 className="text-page-title font-bold">{title}</h1>{description && <p className="text-muted-foreground mt-2">{description}</p>}</div>}{children}</div>;
  if (!mobile) {
    const Shell = employer ? BusinessDesktopShell : WorkerDesktopShell;
    return <Shell>{content}</Shell>;
  }
  return <div dir={isRTL ? 'rtl' : 'ltr'}><MobileLayout header={<PageHeader title={title} subtitle={description} showBack={back} action={<LanguageSwitch />} />} footer={<BottomNav />}><div className="w-full min-w-0">{content}</div></MobileLayout></div>;
}

export function QueryMessage({ error, empty, onRetry }: { error?: unknown; empty?: string; onRetry?: () => void }) {
  const { isRTL } = useApp();
  return <div role={error ? 'alert' : 'status'} className="card-elevated p-8 text-center space-y-3"><p className="text-muted-foreground">{error ? (isRTL ? 'تعذر تحميل البيانات. يرجى المحاولة مجدداً.' : 'We could not load this. Please try again.') : empty}</p>{error && onRetry && <button onClick={onRetry} className="text-primary font-semibold underline">{isRTL ? 'إعادة المحاولة' : 'Try again'}</button>}</div>;
}
