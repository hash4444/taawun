import { useParams, Link } from 'react-router-dom';
import { MapPin, Banknote, CalendarDays, Building2, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useJob, JOB_TYPE_LABELS } from '@/hooks/useJobs';
import { useApplyToJob, useHasApplied } from '@/hooks/useApplications';
import { useAvailabilityPreferences, useCalendarEvents } from '@/hooks/useAvailability';
import { assessAvailability } from '@/lib/availability';
import { APPLICATION_LABELS, formatJobPay, uaeDate } from '@/lib/marketplace';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function WorkerJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { isRTL } = useApp();
  const { studentData } = useAuth();
  const jobQuery = useJob(id || '');
  const existing = useHasApplied(id || '');
  const apply = useApplyToJob();
  const preferences = useAvailabilityPreferences();
  const events = useCalendarEvents();
  const job = jobQuery.data;
  const fit = job?.schedule_kind === 'fixed' && preferences.isSuccess && events.isSuccess ? assessAvailability({ start_at: job.start_time, end_at: job.end_time }, preferences.data, events.data || []) : null;
  const closed = !!job && (job.status !== 'open' || Date.parse(job.end_time) <= Date.now() || !!job.deadline && Date.parse(job.deadline) <= Date.now());
  const eligible = !!studentData?.adult_consent_at && !!studentData?.eligibility_confirmed;
  // A known calendar conflict must never be overridden by a relevance score.
  const scheduleConflict = job?.schedule_kind === 'fixed' && (!fit || !fit.compatible);
  const submit = async () => { if (!id) return; try { await apply.mutateAsync(id); toast.success(isRTL ? 'تم إرسال طلبك' : 'Your application was submitted'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Application failed'); } };
  return <MarketplaceLayout title={isRTL ? 'تفاصيل الفرصة' : 'Opportunity details'} back>
    {jobQuery.isError ? <QueryMessage error={jobQuery.error} onRetry={() => jobQuery.refetch()} /> : jobQuery.isLoading ? <div className="h-72 bg-muted rounded-xl animate-pulse" /> : !job ? <QueryMessage empty={isRTL ? 'لم يتم العثور على هذه الفرصة.' : 'This opportunity could not be found.'} /> : <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-5"><section className="card-elevated p-6 space-y-4"><span className="text-sm text-primary font-medium">{JOB_TYPE_LABELS[job.job_type]?.[isRTL ? 'ar' : 'en']}</span><h2 className="font-bold text-2xl">{job.title}</h2><p className="flex gap-2 items-center text-muted-foreground"><Building2 size={17} />{job.businesses?.trade_name || job.businesses?.legal_name || job.company_name}</p><div className="grid sm:grid-cols-2 gap-4 text-sm"><p className="flex gap-2 items-center"><MapPin size={17} className="text-primary" />{job.remote_allowed ? (isRTL ? 'عن بُعد' : 'Remote') : job.address || job.location || 'UAE'}</p><p className="flex gap-2 items-center"><Banknote size={17} className="text-primary" />{formatJobPay(job,isRTL)}</p><p className="flex gap-2 items-center"><CalendarDays size={17} className="text-primary" />{uaeDate(job.start_time,isRTL,job.job_type === 'shift')}</p>{job.deadline && <p>{isRTL ? 'آخر موعد: ' : 'Apply before: '}{uaeDate(job.deadline,isRTL,false)}</p>}</div></section>
      <section className="card-elevated p-6 space-y-3"><h2 className="font-semibold text-lg">{isRTL ? 'عن الفرصة' : 'About the opportunity'}</h2><p className="text-muted-foreground whitespace-pre-wrap break-words">{job.description || (isRTL ? 'لم يقدم صاحب العمل تفاصيل إضافية.' : 'The employer has not added further details.')}</p>{!!job.skills_required?.length && <div><h3 className="font-semibold text-sm mb-2">{isRTL ? 'المهارات المطلوبة' : 'Skills requested'}</h3><div className="flex flex-wrap gap-2">{job.skills_required.map(skill => <span key={skill} className="rounded-full bg-muted text-sm px-3 py-1">{skill}</span>)}</div></div>}</section>
      <p className="text-xs text-muted-foreground">{isRTL ? 'جميع المواعيد بتوقيت الإمارات. أكد ساعات العمل والأجر ومتطلبات التصريح مع صاحب العمل قبل قبول العرض.' : 'Dates are shown in UAE time. Confirm working hours, pay and permit requirements with the employer before accepting an offer.'}</p></div>
      <aside className="card-elevated p-5 space-y-4 lg:sticky lg:top-20"><h2 className="font-semibold">{isRTL ? 'خطوتك التالية' : 'Your next step'}</h2>{existing.data ? <><p className="text-primary font-medium flex gap-2"><CheckCircle2 size={18} />{APPLICATION_LABELS[existing.data.status]?.[isRTL ? 'ar' : 'en'] || existing.data.status}</p><Button asChild className="w-full"><Link to="/worker/applications">{isRTL ? 'متابعة الطلب' : 'Track application'}</Link></Button></> : <><p className="text-sm text-muted-foreground">{isRTL ? 'سنشارك معلومات ملفك وسيرتك المحفوظة مع صاحب العمل.' : 'Your saved profile information will be shared with this employer.'}</p>{!eligible && <Link to="/worker/profile/setup" className="text-sm text-primary underline block">{isRTL ? 'أكمل تأكيد العمر وأهلية العمل أولاً' : 'Complete your age and work eligibility details first'}</Link>}{closed && <p className="text-sm text-muted-foreground">{isRTL ? 'هذه الفرصة مغلقة أو انتهى موعدها.' : 'This opportunity is closed or has expired.'}</p>}{existing.isError && <QueryMessage error={existing.error} onRetry={() => existing.refetch()} />}<Button onClick={submit} disabled={apply.isPending || existing.isLoading || existing.isError || closed || !eligible || scheduleConflict} className="w-full">{apply.isPending ? (isRTL ? 'جاري الإرسال…' : 'Submitting…') : (isRTL ? 'تقديم طلب' : 'Apply now')}</Button></>}
      <div className="border-t border-border pt-4"><h3 className="font-medium text-sm mb-2">{isRTL ? 'الملاءمة مع جدولك' : 'Your schedule fit'}</h3><p className="text-sm text-muted-foreground">{fit?.compatible ? (isRTL ? 'تتوافق مع تفضيلاتك وأحداثك المستوردة الحالية.' : 'Fits your saved preferences and currently imported calendar.') : scheduleConflict ? (isRTL ? 'تحتاج هذه المواعيد إلى نافذة توفر متوافقة وفحص التقويم قبل التقديم.' : 'This fixed schedule needs a compatible saved availability window and a current calendar check before applying.') : (isRTL ? 'يحتاج الجدول إلى التأكيد. حدد تفضيلاتك واسأل عن ساعات العمل.' : 'Schedule needs confirmation. Set your preferences and check working hours.')}</p><Link to="/worker/availability" className="text-sm underline text-primary mt-2 inline-block">{isRTL ? 'إدارة التوفر' : 'Manage availability'}</Link></div></aside>
    </div>}
  </MarketplaceLayout>;
}
