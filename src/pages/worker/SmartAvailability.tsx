import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, LockKeyhole, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAvailabilityPreferences, useCalendarEvents, useSaveAvailability, useImportCalendar, useAddBusyPeriod, useDeleteBusyPeriod, useDisconnectCalendar, EMPTY_AVAILABILITY } from '@/hooks/useAvailability';
import { freeWorkWindows, localToInstant, type AvailabilityPreferences } from '@/lib/availability';
import { parseAcademicCalendar } from '@/lib/calendar';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SmartAvailability() {
  const { isRTL } = useApp(); const mobile = useIsMobile();
  const tr = (en: string, ar: string) => isRTL ? ar : en;
  const preferences = useAvailabilityPreferences(), events = useCalendarEvents();
  const save = useSaveAvailability(), importCalendar = useImportCalendar(), addBusy = useAddBusyPeriod(), remove = useDeleteBusyPeriod(), disconnect = useDisconnectCalendar();
  const [draft, setDraft] = useState<AvailabilityPreferences>(EMPTY_AVAILABILITY);
  const [manualStart, setManualStart] = useState(''), [manualEnd, setManualEnd] = useState('');
  const [importing, setImporting] = useState(false); const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (preferences.data) setDraft(preferences.data); }, [preferences.data]);
  const free = useMemo(() => {
    if (!preferences.data || !events.data) return [];
    const now = new Date();
    try { return freeWorkWindows({ start_at: now.toISOString(), end_at: new Date(+now + 7 * 86_400_000).toISOString() }, preferences.data, events.data).slice(0, 6); } catch { return []; }
  }, [preferences.data, events.data]);
  const days = isRTL ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const format = (value: string) => new Intl.DateTimeFormat(isRTL ? 'ar-AE' : 'en-AE', { timeZone: preferences.data?.timezone || 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const failed = (error: unknown) => toast.error(error instanceof Error ? error.message : tr('Could not save. Try again.', 'تعذر الحفظ. حاول مرة أخرى.'));
  const title = tr('Smart Availability', 'التوفر الذكي');
  const content = <div className="max-w-3xl mx-auto space-y-6 pb-8">
    <div>{!mobile && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}<p className="text-muted-foreground mt-2">{tr('Make work fit around your studies. Calendar connection is optional.', 'اجعل العمل مناسباً لدراستك. ربط التقويم اختياري.')}</p></div>
    <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex gap-3"><LockKeyhole className="shrink-0 text-primary" aria-hidden="true" /><p className="text-sm">{tr('Your timetable is private. We store busy periods without event names. Employers cannot view your calendar.', 'جدولك خاص. نحفظ فترات الانشغال دون أسماء الأحداث. لا يستطيع أصحاب العمل عرض تقويمك.')}</p></div>
    {(preferences.isError || events.isError) && <div role="alert" className="p-4 border border-destructive rounded-xl"><p>{tr('We could not load your schedule. Matching cannot confirm availability until this is resolved.', 'تعذر تحميل جدولك. لا يمكن تأكيد التوفر حتى يتم حل المشكلة.')}</p><Button variant="outline" onClick={() => { void preferences.refetch(); void events.refetch(); }}>{tr('Retry', 'إعادة المحاولة')}</Button></div>}
    {preferences.isLoading ? <p role="status">{tr('Loading preferences…', 'جاري تحميل التفضيلات…')}</p> : <form className="rounded-2xl border bg-card p-5 space-y-5" onSubmit={e => { e.preventDefault(); save.mutate(draft, { onSuccess: () => toast.success(tr('Work preferences saved', 'تم حفظ تفضيلات العمل')), onError: failed }); }}>
      <h2 className="font-semibold text-lg">{tr('When would you like to work?', 'متى ترغب في العمل؟')}</h2>
      <p className="text-sm text-muted-foreground">{tr('Empty calendar time is never treated as permission to work. Add your preferred work windows below.', 'لا نعتبر أوقات التقويم الفارغة موافقة على العمل. أضف أوقات العمل التي تفضلها أدناه.')}</p>
      <div><Label htmlFor="timezone">{tr('Time zone', 'المنطقة الزمنية')}</Label><select id="timezone" className="w-full h-11 border rounded-md bg-background px-3 mt-1" value={draft.timezone} onChange={e => setDraft({ ...draft, timezone: e.target.value })}>{['Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'Europe/Paris', 'America/New_York', 'Asia/Kolkata', 'UTC'].map(tz => <option key={tz}>{tz}</option>)}</select></div>
      <div className="space-y-3">{draft.weekly_windows.map((window, i) => <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-end">
        <div><Label htmlFor={`day-${i}`}>{tr('Day', 'اليوم')}</Label><select id={`day-${i}`} className="w-full h-10 border rounded-md px-2 bg-background" value={window.weekday} onChange={e => setDraft({ ...draft, weekly_windows: draft.weekly_windows.map((w, j) => j === i ? { ...w, weekday: +e.target.value } : w) })}>{days.map((d, n) => <option value={n} key={d}>{d}</option>)}</select></div>
        <div><Label htmlFor={`from-${i}`}>{tr('From', 'من')}</Label><Input id={`from-${i}`} type="time" required value={window.start} onChange={e => setDraft({ ...draft, weekly_windows: draft.weekly_windows.map((w, j) => j === i ? { ...w, start: e.target.value } : w) })} /></div>
        <div><Label htmlFor={`to-${i}`}>{tr('Until (24:00 = midnight)', 'إلى (24:00 = منتصف الليل)')}</Label><Input id={`to-${i}`} type="text" inputMode="numeric" placeholder="20:00" pattern="(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)" required value={window.end} onChange={e => setDraft({ ...draft, weekly_windows: draft.weekly_windows.map((w, j) => j === i ? { ...w, end: e.target.value } : w) })} /></div>
        <Button type="button" variant="ghost" aria-label={tr(`Remove work window ${i + 1}`, `حذف وقت العمل ${i + 1}`)} onClick={() => setDraft({ ...draft, weekly_windows: draft.weekly_windows.filter((_, j) => i !== j) })}><Trash2 size={18} /></Button>
      </div>)}</div>
      <Button type="button" variant="outline" disabled={draft.weekly_windows.length >= 28} onClick={() => setDraft({ ...draft, weekly_windows: [...draft.weekly_windows, { weekday: 1, start: '16:00', end: '20:00' }] })}><Plus className="me-2" size={16} />{tr('Add preferred work hours', 'إضافة أوقات عمل مفضلة')}</Button>
      <div className="grid sm:grid-cols-2 gap-4"><div><Label htmlFor="min-shift">{tr('Minimum shift (minutes)', 'أقل مدة للعمل بالدقائق')}</Label><Input id="min-shift" type="number" min={15} max={1440} value={draft.minimum_shift_minutes} onChange={e => setDraft({ ...draft, minimum_shift_minutes: +e.target.value })} /></div><div><Label htmlFor="travel">{tr('Travel buffer around classes (minutes)', 'مدة التنقل حول المحاضرات بالدقائق')}</Label><Input id="travel" type="number" min={0} max={240} value={draft.travel_buffer_minutes} onChange={e => setDraft({ ...draft, travel_buffer_minutes: +e.target.value })} /></div></div>
      <Button type="submit" disabled={save.isPending || preferences.isError}>{save.isPending ? tr('Saving…', 'جاري الحفظ…') : tr('Save work preferences', 'حفظ تفضيلات العمل')}</Button>
    </form>}
    <section className="rounded-2xl border bg-card p-5 space-y-4"><h2 className="font-semibold text-lg">{tr('Import your academic timetable', 'استيراد جدولك الدراسي')}</h2><p className="text-sm text-muted-foreground">{tr('Export an ICS/iCal file from your university, Google Calendar or Outlook. Import covers the next 120 days and replaces your previous file import. Recurring classes and exams block matching; event names are discarded.', 'صدّر ملف ICS من جامعتك أو تقويم Google أو Outlook. يغطي الاستيراد 120 يوماً ويستبدل الاستيراد السابق. تمنع المحاضرات والامتحانات التعارضات دون حفظ أسماء الأحداث.')}</p>
      <input ref={fileInput} type="file" accept=".ics,text/calendar" aria-label={tr('Academic calendar file', 'ملف التقويم الدراسي')} disabled={importing} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setImporting(true); try { if (file.size > 2 * 1024 * 1024) throw new Error(tr('Choose a file smaller than 2 MB.', 'اختر ملفاً أصغر من 2 ميجابايت.')); const parsed = parseAcademicCalendar(await file.text(), { timezone: draft.timezone }); await importCalendar.mutateAsync(parsed); toast.success(tr(`${parsed.length} private busy periods imported`, `تم استيراد ${parsed.length} فترة انشغال خاصة`)); } catch (error) { failed(error); } finally { setImporting(false); if (fileInput.current) fileInput.current.value = ''; } }} />
      <p className="text-xs text-muted-foreground">{tr('Importing replaces only your previously imported timetable. Manual busy periods remain.', 'يستبدل الاستيراد جدولك المستورد سابقاً فقط. تبقى فترات الانشغال اليدوية.')}</p>
      <Button variant="outline" disabled={disconnect.isPending || !events.data?.some(e => e.source === 'ics')} onClick={() => disconnect.mutate('ics', { onSuccess: () => toast.success(tr('Imported timetable deleted', 'تم حذف الجدول المستورد')), onError: failed })}>{tr('Disconnect and delete imported timetable', 'إلغاء الربط وحذف الجدول المستورد')}</Button>
      <div className="grid sm:grid-cols-2 gap-3">{['Google Calendar', 'Microsoft Outlook'].map(provider => <div key={provider} className="border rounded-xl p-4"><p className="font-medium">{provider}</p><p className="text-sm text-muted-foreground mt-1">{tr('Direct connection is awaiting provider setup. Use ICS import for now.', 'الربط المباشر بانتظار إعداد المزود. استخدم استيراد ICS حالياً.')}</p></div>)}</div>
    </section>
    <form className="rounded-2xl border bg-card p-5 space-y-4" onSubmit={async e => { e.preventDefault(); try { await addBusy.mutateAsync({ start_at: localToInstant(manualStart, draft.timezone), end_at: localToInstant(manualEnd, draft.timezone), busy: true }); setManualStart(''); setManualEnd(''); toast.success(tr('Busy period added', 'تمت إضافة فترة الانشغال')); } catch (error) { failed(error); } }}>
      <h2 className="font-semibold text-lg">{tr('Add a class, exam or other busy period', 'إضافة محاضرة أو امتحان أو فترة انشغال')}</h2><p className="text-sm text-muted-foreground">{tr('Times use your selected time zone. You do not need to share a reason.', 'تستخدم الأوقات منطقتك الزمنية المحددة. لا تحتاج لمشاركة السبب.')}</p><div className="grid sm:grid-cols-2 gap-4"><div><Label htmlFor="busy-start">{tr('Starts', 'البداية')}</Label><Input id="busy-start" type="datetime-local" required value={manualStart} onChange={e => setManualStart(e.target.value)} /></div><div><Label htmlFor="busy-end">{tr('Ends', 'النهاية')}</Label><Input id="busy-end" type="datetime-local" required value={manualEnd} onChange={e => setManualEnd(e.target.value)} /></div></div><Button disabled={addBusy.isPending}>{tr('Add busy period', 'إضافة فترة انشغال')}</Button>
    </form>
    <section className="rounded-2xl border bg-card p-5 space-y-3"><h2 className="font-semibold text-lg flex gap-2"><CalendarDays size={20} />{tr('Work windows over the next seven days', 'أوقات العمل خلال الأيام السبعة القادمة')}</h2>{!free.length ? <p className="text-sm text-muted-foreground">{tr('Save your preferred hours to see available windows. Classes and travel time are excluded.', 'احفظ ساعاتك المفضلة لعرض الأوقات المتاحة. يتم استبعاد المحاضرات ووقت التنقل.')}</p> : free.map(w => <p className="text-sm" key={w.start_at}>{format(w.start_at)} – {format(w.end_at)}</p>)}</section>
    <section className="rounded-2xl border bg-card p-5 space-y-3"><h2 className="font-semibold text-lg">{tr('Your private busy periods', 'فترات انشغالك الخاصة')}</h2>{events.isLoading ? <p role="status">{tr('Loading timetable…', 'جاري تحميل الجدول…')}</p> : !events.data?.length ? <p className="text-sm text-muted-foreground">{tr('No busy periods added yet.', 'لم تضف فترات انشغال بعد.')}</p> : events.data.slice(0, 20).map(event => <div className="flex gap-3 justify-between items-center border-t pt-3" key={event.id}><p className="text-sm">{format(event.start_at)} – {format(event.end_at)}</p><Button variant="ghost" disabled={remove.isPending} aria-label={tr('Delete busy period', 'حذف فترة الانشغال')} onClick={() => remove.mutate(event.id, { onError: failed })}><Trash2 size={16} /></Button></div>)}{(events.data?.length || 0) > 20 && <p className="text-sm">{tr('Showing your next 20 busy periods.', 'عرض فترات الانشغال العشرين القادمة.')}</p>}</section>
  </div>;
  return mobile ? <MobileLayout header={<PageHeader title={title} showBack backPath="/worker/profile" />} footer={<BottomNav />}>{content}</MobileLayout> : <WorkerDesktopShell>{content}</WorkerDesktopShell>;
}
