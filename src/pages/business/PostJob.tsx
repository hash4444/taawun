import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useCreateJob, JOB_TYPE_LABELS, type JobType } from '@/hooks/useJobs';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uaeInputToIso, UAE_LOCATIONS, UAE_LOCATION_AR } from '@/lib/marketplace';
import { toast } from 'sonner';

export default function PostJob() {
  const { isRTL } = useApp();
  const { isVerified, businessData } = useAuth();
  const create = useCreateJob();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title:'',type:'part_time' as JobType,location:'',address:'',remote:false,pay:'',maxPay:'',period:'hourly' as 'hourly'|'fixed'|'monthly',slots:'1',start:'',end:'',deadline:'',description:'',qualifications:'',skills:'',hours:'' });
  const field = (name: keyof typeof form, value: string | boolean) => setForm(prev => ({...prev,[name]:value}));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isVerified) return;
    try {
      const start = uaeInputToIso(form.start), end = uaeInputToIso(form.end);
      const deadline = form.deadline ? uaeInputToIso(form.deadline) : null;
      const amount = Number(form.pay), maxPay = form.maxPay ? Number(form.maxPay) : null, slots = Number(form.slots);
      if (!form.title.trim() || form.title.trim().length > 120 || !form.description.trim() || !form.hours.trim()) throw new Error(isRTL ? 'أكمل المسمى والوصف وساعات العمل.' : 'Complete the title, description and working hours.');
      if (!form.remote && !form.location.trim()) throw new Error(isRTL ? 'حدد موقع العمل.' : 'Enter the work location.');
      if (!Number.isFinite(amount) || amount <= 0 || maxPay !== null && (!Number.isFinite(maxPay) || maxPay < amount)) throw new Error(isRTL ? 'أدخل أجراً صحيحاً ونطاقاً متسقاً.' : 'Enter valid pay and a consistent pay range.');
      if (!Number.isInteger(slots) || slots < 1 || slots > 100) throw new Error(isRTL ? 'عدد الفرص بين 1 و100.' : 'Positions must be between 1 and 100.');
      if (Date.parse(end) <= Date.parse(start) || Date.parse(start) <= Date.now()) throw new Error(isRTL ? 'اختر موعد بداية مستقبلياً ونهاية بعد البداية.' : 'Choose a future start and an end after the start.');
      if (deadline && (Date.parse(deadline) <= Date.now() || Date.parse(deadline) > Date.parse(start))) throw new Error(isRTL ? 'يجب أن يكون آخر موعد مستقبلياً وقبل بدء العمل.' : 'The application deadline must be in the future and before the work starts.');
      await create.mutateAsync({ title:form.title.trim(),job_type:form.type,payment_model:form.period,pay_amount:amount,salary_min:form.period === 'monthly' ? amount : null,salary_max:maxPay,currency:'AED',country:'AE',student_friendly:true,schedule_kind:form.type === 'shift' ? 'fixed' : 'flexible',eligibility_requirements:form.qualifications.trim() || null,address:form.remote ? 'Remote, UAE' : [form.address.trim(),form.location].filter(Boolean).join(', '),location:form.remote ? 'Remote' : form.location,remote_allowed:form.remote,start_time:start,end_time:end,deadline,slots_total:slots,skills_required:form.skills.split(',').map(s=>s.trim()).filter(Boolean).slice(0,20),description:[form.description.trim(),`${isRTL ? 'ساعات العمل' : 'Working hours'}: ${form.hours.trim()}`,form.qualifications.trim() ? `${isRTL ? 'المؤهلات والأهلية المطلوبة' : 'Qualifications and eligibility'}: ${form.qualifications.trim()}` : ''].filter(Boolean).join('\n\n'),sector:businessData?.sector || null,status:'open',service_direction:'business_offers',experience_years:form.type === 'full_time' ? 0 : null });
      toast.success(isRTL ? 'تم نشر الفرصة' : 'Opportunity published');
      navigate('/business/dashboard');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not publish opportunity'); }
  };
  const selectClass = 'w-full h-11 rounded-lg border border-input bg-background px-3 text-sm';
  return <MarketplaceLayout employer title={isRTL ? 'نشر فرصة' : 'Post an opportunity'} description={isRTL ? 'وضح الأجر والجدول وما سيتعلمه الطالب.' : 'Be clear about pay, hours and what students will learn.'}>
    {!isVerified && <div role="status" className="rounded-xl bg-warning-light p-4"><p className="font-medium">{isRTL ? 'أكمل التحقق من المنشأة قبل النشر.' : 'Complete business verification before publishing.'}</p><Link to="/business/verification" className="text-primary underline text-sm">{isRTL ? 'متابعة التحقق' : 'Continue verification'}</Link></div>}
    <form onSubmit={submit} className="card-elevated p-5 md:p-7 space-y-5 max-w-3xl"><div className="space-y-2"><Label htmlFor="job-title">{isRTL ? 'المسمى الوظيفي' : 'Job title'}</Label><Input id="job-title" required maxLength={120} value={form.title} onChange={e=>field('title',e.target.value)} placeholder={isRTL ? 'مثال: متدرب تسويق' : 'e.g. Marketing intern'} /></div>
      <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="type">{isRTL ? 'نوع الفرصة' : 'Opportunity type'}</Label><select id="type" value={form.type} onChange={e=>field('type',e.target.value)} className={selectClass}>{(['part_time','internship','shift','full_time','freelance'] as JobType[]).map(type=><option key={type} value={type}>{type === 'full_time' ? (isRTL ? 'وظيفة خريج / مبتدئ' : 'Graduate / entry-level') : JOB_TYPE_LABELS[type][isRTL ? 'ar' : 'en']}</option>)}</select></div><div className="space-y-2"><Label htmlFor="slots">{isRTL ? 'عدد الشواغر' : 'Positions'}</Label><Input id="slots" required type="number" min={1} max={100} step={1} value={form.slots} onChange={e=>field('slots',e.target.value)} /></div></div>
      <div className="space-y-2"><Label htmlFor="location">{isRTL ? 'الموقع في الإمارات' : 'UAE work location'}</Label><select id="location" className={selectClass} disabled={form.remote} required={!form.remote} value={form.location} onChange={e=>field('location',e.target.value)}><option value="">{isRTL ? 'اختر الإمارة' : 'Select Emirate'}</option>{UAE_LOCATIONS.map(city=><option key={city} value={city}>{isRTL ? UAE_LOCATION_AR[city] : city}</option>)}</select><Label htmlFor="work-address">{isRTL ? 'مكان العمل أو المنطقة' : 'Workplace or area'}</Label><Input id="work-address" disabled={form.remote} value={form.address} onChange={e=>field('address',e.target.value)} placeholder={isRTL ? 'المنطقة، المبنى' : 'Area, building'} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.remote} onChange={e=>field('remote',e.target.checked)} />{isRTL ? 'العمل عن بُعد' : 'Remote work'}</label></div>
      <div className="grid sm:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="pay">{isRTL ? 'الأجر (درهم)' : 'Pay (AED)'}</Label><Input id="pay" required type="number" min="0.01" step="0.01" value={form.pay} onChange={e=>field('pay',e.target.value)} /></div><div className="space-y-2"><Label htmlFor="maximum-pay">{isRTL ? 'الحد الأعلى (اختياري)' : 'Maximum pay (optional)'}</Label><Input id="maximum-pay" type="number" min="0.01" step="0.01" value={form.maxPay} onChange={e=>field('maxPay',e.target.value)} /></div><div className="space-y-2"><Label htmlFor="period">{isRTL ? 'فترة الأجر' : 'Pay period'}</Label><select id="period" className={selectClass} value={form.period} onChange={e=>field('period',e.target.value)}><option value="hourly">{isRTL ? 'بالساعة' : 'Hourly'}</option><option value="monthly">{isRTL ? 'شهري' : 'Monthly'}</option><option value="fixed">{isRTL ? 'مبلغ ثابت' : 'Fixed total'}</option></select></div></div>
      <fieldset className="space-y-3"><legend className="font-semibold text-sm">{isRTL ? 'المواعيد بتوقيت الإمارات (UTC+4)' : 'Dates in UAE time (UTC+4)'}</legend><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="start">{isRTL ? 'بداية العمل' : 'Work starts'}</Label><Input id="start" required type="datetime-local" value={form.start} onChange={e=>field('start',e.target.value)} /></div><div className="space-y-2"><Label htmlFor="end">{isRTL ? 'نهاية العمل' : 'Work ends'}</Label><Input id="end" required type="datetime-local" value={form.end} onChange={e=>field('end',e.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="deadline">{isRTL ? 'آخر موعد للتقديم (اختياري)' : 'Application deadline (optional)'}</Label><Input id="deadline" type="datetime-local" value={form.deadline} onChange={e=>field('deadline',e.target.value)} /></div></fieldset>
      <div className="space-y-2"><Label htmlFor="hours">{isRTL ? 'أيام وساعات العمل' : 'Working days and hours'}</Label><Input id="hours" required value={form.hours} onChange={e=>field('hours',e.target.value)} placeholder={isRTL ? 'مثال: الثلاثاء والخميس، 4–8 مساءً' : 'e.g. Tuesday and Thursday, 4–8pm'} /></div><div className="space-y-2"><Label htmlFor="description">{isRTL ? 'المهام وفرص التعلم' : 'Responsibilities and learning opportunities'}</Label><Textarea id="description" required rows={5} value={form.description} onChange={e=>field('description',e.target.value)} /></div><div className="space-y-2"><Label htmlFor="qualifications">{isRTL ? 'المؤهلات وأهلية العمل والتصريح المطلوب' : 'Qualifications, work eligibility and permit requirements'}</Label><Textarea id="qualifications" rows={3} value={form.qualifications} onChange={e=>field('qualifications',e.target.value)} /></div><div className="space-y-2"><Label htmlFor="skills">{isRTL ? 'المهارات (افصل بفاصلة)' : 'Skills (comma separated)'}</Label><Input id="skills" value={form.skills} onChange={e=>field('skills',e.target.value)} /></div>
      <Button type="submit" disabled={!isVerified || create.isPending} className="w-full sm:w-auto">{create.isPending ? (isRTL ? 'جاري النشر…' : 'Publishing…') : (isRTL ? 'نشر الفرصة' : 'Publish opportunity')}</Button>
    </form>
  </MarketplaceLayout>;
}
