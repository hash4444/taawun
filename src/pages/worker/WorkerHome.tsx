import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight, CalendarDays, GraduationCap, Clock, Sparkles } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceJobs } from '@/hooks/useMarketplaceJobs';
import { useWorkerApplications } from '@/hooks/useApplications';
import { useNotifications } from '@/hooks/useNotifications';
import { useAvailabilityPreferences, useCalendarEvents } from '@/hooks/useAvailability';
import { assessAvailability } from '@/lib/availability';
import { uaeDate } from '@/lib/marketplace';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/button';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';

export default function WorkerHome() {
  const { isRTL } = useApp();
  const { profile, studentData } = useAuth();
  const navigate = useNavigate();
  const jobs = useMarketplaceJobs({ pageSize: 12 });
  const applications = useWorkerApplications();
  const notifications = useNotifications();
  const preferences = useAvailabilityPreferences();
  const events = useCalendarEvents();
  const ranked = [...(jobs.data?.jobs || [])].sort((a,b) => {
    const score = (job: typeof a) => (studentData?.preferred_job_types.includes(job.job_type) ? 3 : 0) + (studentData?.city && job.address?.toLowerCase().includes(studentData.city.toLowerCase()) ? 2 : 0) + (job.skills_required || []).filter(skill => studentData?.skills.some(s => s.toLowerCase() === skill.toLowerCase())).length;
    return score(b) - score(a);
  }).slice(0,6);
  const upcoming = (applications.data || []).filter(a => a.status === 'interview' && a.interview_at && Date.parse(a.interview_at) > Date.now() || ['accepted','placed'].includes(a.status) && a.jobs?.start_time && Date.parse(a.jobs.start_time) > Date.now()).slice(0,3);
  const unread = notifications.data?.filter(n => !n.read_at).length || 0;
  return <MarketplaceLayout title={isRTL ? `مرحباً${profile?.firstName ? `، ${profile.firstName}` : ''}` : `Hi${profile?.firstName ? `, ${profile.firstName}` : ''}`} description={isRTL ? 'خطوتك التالية تبدأ من هنا.' : 'Make room for your next opportunity.'}>
    <div className="flex justify-between items-center gap-3"><span className="text-xs uppercase tracking-wide text-muted-foreground">{isRTL ? 'الإمارات · طلاب وخريجون' : 'UAE · Students & graduates'}</span><Button variant="outline" size="sm" onClick={() => navigate('/worker/notifications')}><Bell size={16} className="me-2" />{isRTL ? 'الإشعارات' : 'Updates'}{unread ? ` (${unread})` : ''}</Button></div>
    <section className="rounded-2xl bg-primary p-6 md:p-8 text-primary-foreground"><p className="text-sm opacity-85 mb-3">{isRTL ? 'الدراسة والعمل، معاً' : 'Education and work, together'}</p><h2 className="text-2xl md:text-3xl font-bold max-w-xl leading-tight">{isRTL ? 'اكتسب الخبرة دون أن تتوقف عن التعلم.' : 'Build experience while you keep learning.'}</h2><p className="mt-3 opacity-85 max-w-lg">{isRTL ? 'تدريب عملي وعمل مرن ووظائف للخريجين تناسب طموحك.' : 'Internships, flexible work and graduate roles that move you forward.'}</p><Button variant="secondary" className="mt-5" onClick={() => navigate('/worker/explore')}>{isRTL ? 'استكشف الفرص' : 'Explore opportunities'}<ArrowRight size={16} className="ms-2 rtl:rotate-180" /></Button></section>
    <div className="grid grid-cols-2 gap-3"><button onClick={() => navigate('/worker/explore?type=part_time')} className="card-elevated text-start p-4 flex items-center gap-3"><Clock className="text-primary shrink-0" /><div><h2 className="font-semibold">{isRTL ? 'دوام جزئي' : 'Part-time work'}</h2><p className="text-xs text-muted-foreground">{isRTL ? 'خبرة بمرونة' : 'Experience with flexibility'}</p></div></button><button onClick={() => navigate('/worker/explore?type=internship')} className="card-elevated text-start p-4 flex items-center gap-3"><GraduationCap className="text-primary shrink-0" /><div><h2 className="font-semibold">{isRTL ? 'تدريب عملي' : 'Internships'}</h2><p className="text-xs text-muted-foreground">{isRTL ? 'طبّق ما تعلمته' : 'Put learning into practice'}</p></div></button></div>
    <button onClick={() => navigate('/worker/availability')} className="card-elevated w-full text-start p-5 flex items-start gap-3"><CalendarDays className="text-primary shrink-0" /><div><h2 className="font-semibold">{isRTL ? 'اجعل العمل يناسب جدولك' : 'Find work around your timetable'}</h2><p className="text-sm text-muted-foreground mt-1">{isRTL ? 'حدد أوقات العمل التي تفضلها، وأضف جدول الجامعة اختيارياً.' : 'Set when you want to work, and optionally import your university calendar.'}</p></div></button>
    {upcoming.length > 0 && <section className="space-y-3"><h2 className="font-semibold text-lg">{isRTL ? 'قريباً في جدولك' : 'Coming up'}</h2>{upcoming.map(a => <button key={a.id} onClick={() => navigate('/worker/applications')} className="card-elevated w-full text-start p-4"><p className="text-xs text-primary">{a.status === 'interview' ? (isRTL ? 'مقابلة' : 'Interview') : (isRTL ? 'فرصة مقبولة' : 'Accepted opportunity')}</p><p className="font-semibold">{a.jobs?.title}</p><p className="text-sm text-muted-foreground">{uaeDate(a.interview_at || a.jobs?.start_time, isRTL)}</p></button>)}</section>}
    <section className="space-y-4"><div className="flex justify-between items-center"><h2 className="font-semibold text-lg">{isRTL ? 'فرص تستحق الاستكشاف' : 'Opportunities for you'}</h2><button onClick={() => navigate('/worker/explore')} className="text-sm text-primary underline">{isRTL ? 'عرض الكل' : 'View all'}</button></div><p className="text-sm text-muted-foreground">{isRTL ? 'مرتبة حسب أنواع العمل والمهارات والموقع في ملفك. أكد ساعات العمل مع صاحب العمل.' : 'Prioritized by your preferred job types, skills and location. Confirm working hours with the employer.'}</p>{jobs.isError ? <QueryMessage error={jobs.error} onRetry={() => jobs.refetch()} /> : jobs.isLoading ? <div className="h-48 rounded-xl bg-muted animate-pulse" /> : ranked.length ? <div className="grid md:grid-cols-2 gap-4">{ranked.map(job => { const fit = job.schedule_kind === 'fixed' && preferences.isSuccess && events.isSuccess ? assessAvailability({ start_at: job.start_time, end_at: job.end_time }, preferences.data, events.data || []) : null; return <div key={job.id} className="space-y-2"><JobCard job={job} />{fit && <p className="text-xs text-muted-foreground px-1">{fit.compatible ? (isRTL ? 'يتوافق مع أوقاتك المحفوظة' : 'Fits your saved availability') : (isRTL ? 'يحتاج الجدول إلى التأكيد' : 'Schedule needs confirmation')}</p>}</div>; })}</div> : <QueryMessage empty={isRTL ? 'لا توجد فرص منشورة حالياً. ستظهر الوظائف الجديدة هنا.' : 'No published opportunities yet. New listings will appear here.'} />}</section>
    <button onClick={() => navigate('/worker/job-hunter')} className="flex gap-3 items-center text-start p-5 rounded-xl border border-border w-full"><Sparkles size={20} className="text-primary" /><div><h2 className="font-semibold">{isRTL ? 'مساعد البحث عن الفرص' : 'Your opportunity assistant'}</h2><p className="text-sm text-muted-foreground">{isRTL ? 'راجع الاقتراحات ووافق على الطلبات التي تريد إرسالها.' : 'Review recommendations and approve the applications you want to send.'}</p></div></button>
  </MarketplaceLayout>;
}
