import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useJob, useUpdateJob } from '@/hooks/useJobs';
import { useJobApplications, useUpdateApplication } from '@/hooks/useApplications';
import { ACTION_LABELS, APPLICATION_LABELS, applicationActions, formatJobPay, uaeDate, uaeInputToIso, type ApplicationStatus } from '@/lib/marketplace';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function BusinessJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { isRTL } = useApp();
  const { user } = useAuth();
  const job = useJob(id || '');
  const applications = useJobApplications(id || '');
  const update = useUpdateApplication();
  const updateJob = useUpdateJob();
  const [action, setAction] = useState<{id:string;status:ApplicationStatus;name:string} | null>(null);
  const [interviewAt,setInterviewAt] = useState('');
  const [message,setMessage] = useState('');
  const submit = async () => {
    if (!action) return;
    try {
      const interview = action.status === 'interview' ? uaeInputToIso(interviewAt) : undefined;
      if (interview && Date.parse(interview) <= Date.now()) throw new Error(isRTL ? 'اختر موعد مقابلة مستقبلياً.' : 'Choose an interview time in the future.');
      if (['interview','offered'].includes(action.status) && !message.trim()) throw new Error(isRTL ? 'أضف تفاصيل الموعد أو العرض للطالب.' : 'Add interview or offer details for the student.');
      await update.mutateAsync({id:action.id,status:action.status,interviewAt:interview,message:message.trim() || undefined});
      setAction(null); toast.success(isRTL ? 'تم تحديث الطلب وإشعار الطالب' : 'Application updated and student notified');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update application'); }
  };
  const closeJob = async () => { if (!id) return; try { await updateJob.mutateAsync({id,status:'closed'}); toast.success(isRTL ? 'تم إغلاق التقديم' : 'Applications closed'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not close job'); } };
  const owns = job.data?.poster_id === user?.id;
  return <MarketplaceLayout employer title={isRTL ? 'إدارة الفرصة والطلبات' : 'Manage opportunity & applicants'} back>
    {job.isError ? <QueryMessage error={job.error} onRetry={()=>job.refetch()} /> : job.isLoading ? <div className="h-48 bg-muted animate-pulse rounded-xl" /> : !job.data || !owns ? <QueryMessage empty={isRTL ? 'لا يمكنك إدارة هذه الفرصة.' : 'This opportunity is not available for you to manage.'} /> : <>
      <section className="card-elevated p-5 space-y-3"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">{job.data.title}</h2>{job.data.status === 'open' && <Button variant="outline" size="sm" onClick={closeJob} disabled={updateJob.isPending}>{isRTL ? 'إغلاق التقديم' : 'Close applications'}</Button>}</div><p className="text-muted-foreground">{job.data.address || job.data.location} · {formatJobPay(job.data,isRTL)}</p><p className="text-sm text-muted-foreground">{uaeDate(job.data.start_time,isRTL)} — {uaeDate(job.data.end_time,isRTL)}</p><p className="text-sm whitespace-pre-wrap">{job.data.description}</p></section>
      <div className="space-y-1"><h2 className="font-semibold text-lg">{isRTL ? 'المرشحون' : 'Applicants'} ({applications.data?.length || 0})</h2><p className="text-sm text-muted-foreground">{isRTL ? 'راجع الطلبات وأرسل تفاصيل المقابلة أو العرض. بعد قبول الطالب، أكد التوظيف.' : 'Review applications and share interview or offer details. Confirm placement after the student accepts.'}</p></div>
      {applications.isError ? <QueryMessage error={applications.error} onRetry={()=>applications.refetch()} /> : applications.isLoading ? <div className="h-40 bg-muted animate-pulse rounded-xl" /> : !applications.data?.length ? <QueryMessage empty={isRTL ? 'لا توجد طلبات حتى الآن.' : 'No applications yet.'} /> : <div className="space-y-4">{applications.data.map(a=>{ const name = a.workers?.profiles?.full_name || (isRTL ? 'طالب' : 'Student'); return <article key={a.id} className="card-elevated p-5 space-y-3"><div className="flex justify-between gap-3 flex-wrap"><div><h3 className="font-semibold text-lg">{name}</h3><p className="text-sm text-muted-foreground">{a.workers?.profiles?.city}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary h-fit">{APPLICATION_LABELS[a.status]?.[isRTL ? 'ar' : 'en'] || a.status}</span></div>{a.workers?.bio && <p className="text-sm text-muted-foreground">{a.workers.bio}</p>}{!!a.workers?.skills?.length && <div className="flex gap-2 flex-wrap">{a.workers.skills.map(skill=><span key={skill} className="text-xs px-2 py-1 bg-muted rounded-full">{skill}</span>)}</div>}{a.cover_letter && <p className="text-sm whitespace-pre-wrap border-s-2 border-primary ps-3">{a.cover_letter}</p>}{a.interview_at && <p className="text-sm">{isRTL ? 'المقابلة: ' : 'Interview: '}{uaeDate(a.interview_at,isRTL)}</p>}{a.employer_message && <p className="text-sm bg-muted rounded-lg p-3 whitespace-pre-wrap">{a.employer_message}</p>}{a.status === 'offered' && <p className="text-xs text-muted-foreground">{isRTL ? 'بانتظار رد الطالب على العرض.' : 'Waiting for the student to respond to the offer.'}</p>}<div className="flex gap-2 flex-wrap">{applicationActions('business',a.status).map(status=><Button key={status} size="sm" variant={status === 'rejected' ? 'outline' : 'default'} onClick={()=>{setAction({id:a.id,status:status as ApplicationStatus,name});setInterviewAt('');setMessage('');}}>{ACTION_LABELS[status][isRTL ? 'ar' : 'en']}</Button>)}</div></article>;})}</div>}
    </>}
    {(applications.data?.length || 0) >= 200 && <p className="text-xs text-muted-foreground">{isRTL ? 'تُعرض أحدث 200 طلب لهذه الفرصة.' : 'Showing the latest 200 applications for this opportunity.'}</p>}
    <Dialog open={!!action} onOpenChange={open=>!open&&setAction(null)}><DialogContent dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{action && ACTION_LABELS[action.status]?.[isRTL ? 'ar' : 'en']} — {action?.name}</DialogTitle></DialogHeader><DialogDescription>{isRTL ? 'سيظهر التحديث ورسالتك للطالب. حدد موعد المقابلة بتوقيت الإمارات وأضف التفاصيل اللازمة.' : 'The student will see this update and your message. Use UAE time for interviews and include the details they need.'}</DialogDescription>{action?.status === 'interview' && <div className="space-y-2"><Label htmlFor="interview-date">{isRTL ? 'موعد المقابلة بتوقيت الإمارات' : 'Interview date and time (UAE)'}</Label><Input id="interview-date" required type="datetime-local" value={interviewAt} onChange={e=>setInterviewAt(e.target.value)} /></div>}<div className="space-y-2"><Label htmlFor="employer-message">{isRTL ? 'رسالة للطالب' : 'Message to the student'}</Label><Textarea id="employer-message" value={message} onChange={e=>setMessage(e.target.value)} maxLength={4000} rows={4} placeholder={isRTL ? 'تفاصيل الموعد أو المكان أو العرض والخطوة التالية' : 'Interview location/link, offer details and next steps'} /></div><DialogFooter><Button variant="outline" onClick={()=>setAction(null)}>{isRTL ? 'رجوع' : 'Back'}</Button><Button onClick={submit} disabled={update.isPending}>{update.isPending ? (isRTL ? 'جاري الحفظ…' : 'Saving…') : (isRTL ? 'تأكيد وإشعار الطالب' : 'Confirm & notify student')}</Button></DialogFooter></DialogContent></Dialog>
  </MarketplaceLayout>;
}
