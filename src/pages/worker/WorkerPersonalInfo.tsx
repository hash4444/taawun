import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { STUDENT_JOB_TYPES, splitSkills, studentForm, validateStudentForm, type StudentForm } from '@/lib/student-profile';
import { toast } from 'sonner';

export default function WorkerPersonalInfo() {
  const { isRTL } = useApp();
  const { user, profile, studentData, refreshProfile } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => studentForm(profile, studentData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = <K extends keyof StudentForm>(key: K, value: StudentForm[K]) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async (complete: boolean) => {
    if (!user) return;
    const invalid = complete ? validateStudentForm(form) : null;
    if (invalid) { setError(isRTL ? 'أكمل بيانات الدراسة والتفضيلات وتأكيد الأهلية والعمر (18+).' : invalid); return; }
    setError(''); setSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').update({ full_name: form.fullName.trim(), phone: form.phone.trim() || null, city: form.city || null, country: 'AE' }).eq('id', user.id).select('id').single();
      if (profileError) throw profileError;
      const { error: studentError } = await supabase.from('student_profiles').upsert({
        user_id: user.id, university: form.university.trim() || null, degree: form.degree.trim() || null,
        graduation_year: form.graduationYear ? Number(form.graduationYear) : null,
        academic_status: form.academicStatus || null, city: form.city || null, skills: splitSkills(form.skills),
        preferred_job_types: form.jobTypes, preferred_hours: form.preferredHours.trim() || null,
        work_eligibility: form.eligibility || null, eligibility_confirmed: form.eligibilityConfirmed,
        consent_to_matching: form.matchingConsent,
        adult_consent_at: form.adult ? studentData?.adult_consent_at || new Date().toISOString() : null,
        onboarding_completed_at: complete ? new Date().toISOString() : studentData?.onboarding_completed_at || null,
      }, { onConflict: 'user_id' });
      if (studentError) throw studentError;
      const { error: workerError } = await supabase.from('workers').update({ skills: splitSkills(form.skills), availability: form.preferredHours.trim() || null }).eq('id', user.id).select('id').single();
      if (workerError) throw workerError;
      await refreshProfile();
      toast.success(isRTL ? 'تم حفظ الملف' : complete ? 'Profile completed' : 'Progress saved — you can finish later');
      if (complete) navigate('/worker/home');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save profile.'); }
    finally { setSaving(false); }
  };
  const textField = (key: 'fullName' | 'phone' | 'university' | 'degree' | 'graduationYear' | 'skills' | 'preferredHours', label: string, options: { type?: string; placeholder?: string } = {}) => <div className="space-y-2"><Label htmlFor={`student-${key}`}>{label}</Label><Input id={`student-${key}`} value={String(form[key])} onChange={event => update(key, event.target.value)} type={options.type || 'text'} placeholder={options.placeholder} maxLength={key === 'preferredHours' ? 500 : 160} /></div>;
  const selectField = (key: 'academicStatus' | 'city' | 'eligibility', label: string, options: [string, string][]) => <div className="space-y-2"><Label htmlFor={`student-${key}`}>{label}</Label><select id={`student-${key}`} className="w-full rounded-md border bg-background px-3 py-2 min-h-11" value={form[key]} onChange={event => update(key, event.target.value)}><option value="">{isRTL ? 'اختر' : 'Select an option'}</option>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></div>;
  const body = <div className="max-w-3xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
    <div><h1 className="text-2xl font-bold">{isRTL ? 'ملفك الدراسي والمهني' : 'Your student profile'}</h1><p className="text-muted-foreground mt-2">{isRTL ? 'أضف الأساسيات الآن واحفظ تقدمك. التقويم والسيرة الذاتية اختياريان.' : 'Add the basics in about three minutes. Save progress anytime; your calendar and CV are optional.'}</p></div>
    {error && <p role="alert" className="text-destructive border border-destructive/30 rounded-md p-3">{error}</p>}
    <div className="grid sm:grid-cols-2 gap-5">
      {textField('fullName', isRTL ? 'الاسم الكامل' : 'Full name')}
      <div className="space-y-2"><Label htmlFor="student-email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label><Input id="student-email" value={profile?.email || ''} readOnly /></div>
      {textField('phone', isRTL ? 'الهاتف (اختياري)' : 'Phone (optional)', { type: 'tel', placeholder: '+971 50 123 4567' })}
      {textField('university', isRTL ? 'الجامعة أو آخر مؤسسة تعليمية' : 'University / most recent institution')}
      {textField('degree', isRTL ? 'التخصص أو الدرجة العلمية' : 'Degree / field of study')}
      {textField('graduationYear', isRTL ? 'سنة التخرج' : 'Graduation year', { type: 'number' })}
      {selectField('academicStatus', isRTL ? 'الحالة الأكاديمية' : 'Academic status', [['undergraduate', isRTL ? 'طالب بكالوريوس' : 'Undergraduate'], ['postgraduate', isRTL ? 'دراسات عليا' : 'Postgraduate'], ['graduate', isRTL ? 'خريج' : 'Graduate']])}
      {selectField('city', isRTL ? 'الإمارة' : 'Emirate', [['Dubai', isRTL ? 'دبي' : 'Dubai'], ['Abu Dhabi', isRTL ? 'أبوظبي' : 'Abu Dhabi'], ['Sharjah', isRTL ? 'الشارقة' : 'Sharjah'], ['Ajman', isRTL ? 'عجمان' : 'Ajman'], ['Umm Al Quwain', isRTL ? 'أم القيوين' : 'Umm Al Quwain'], ['Ras Al Khaimah', isRTL ? 'رأس الخيمة' : 'Ras Al Khaimah'], ['Fujairah', isRTL ? 'الفجيرة' : 'Fujairah']])}
    </div>
    <div className="space-y-5 border rounded-xl p-5">
      {textField('skills', isRTL ? 'المهارات (افصل بينها بفواصل)' : 'Skills (separate with commas)', { placeholder: isRTL ? 'التواصل، Excel، التصميم' : 'Communication, Excel, design' })}
      <fieldset><legend className="font-medium text-sm mb-3">{isRTL ? 'أنواع الوظائف المفضلة' : 'Preferred job types'}</legend><div className="flex flex-wrap gap-4">{STUDENT_JOB_TYPES.map(type => <label key={type.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.jobTypes.includes(type.key)} onChange={event => update('jobTypes', event.target.checked ? [...form.jobTypes, type.key] : form.jobTypes.filter(key => key !== type.key))} />{isRTL ? type.ar : type.en}</label>)}</div></fieldset>
      {textField('preferredHours', isRTL ? 'ساعات العمل المفضلة' : 'Preferred working hours', { placeholder: isRTL ? 'مثلاً: مساء الثلاثاء وعطلة نهاية الأسبوع' : 'For example: Tuesday evenings and weekends' })}
      <p className="text-xs text-muted-foreground">{isRTL ? 'يمكنك إضافة أوقات دقيقة واستيراد جدول الجامعة من صفحة التوفر لاحقاً.' : 'Set exact time windows and import your university timetable from Availability after setup.'}</p>
      {selectField('eligibility', isRTL ? 'معلومات أهلية العمل' : 'Work eligibility information', [['uae_citizen', isRTL ? 'مواطن إماراتي' : 'UAE citizen'], ['resident_requires_permit', isRTL ? 'مقيم — يجب تأكيد التصريح المناسب' : 'UAE resident — appropriate permit must be confirmed'], ['needs_confirmation', isRTL ? 'أحتاج إلى تأكيد أهليتي قبل البدء' : 'I need to confirm eligibility before starting work']])}
      <p className="text-xs text-muted-foreground">{isRTL ? 'هذه إفادة منك وليست موافقة على تصريح عمل. يجب تأكيد الأهلية والتصاريح قبل بدء العمل.' : 'This is your declaration, not a work permit approval. Eligibility and required permits must be confirmed before work begins.'}</p>
      <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={form.eligibilityConfirmed} onChange={event => update('eligibilityConfirmed', event.target.checked)} />{isRTL ? 'أؤكد أن معلومات الأهلية التي قدمتها دقيقة.' : 'I confirm the eligibility information I provided is accurate.'}</label>
      <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={form.adult} onChange={event => update('adult', event.target.checked)} />{isRTL ? 'أؤكد أن عمري 18 سنة أو أكثر وأوافق على حفظ ملفي لغرض البحث عن عمل.' : 'I confirm I am 18 or older and consent to storing my profile for my job search.'}</label>
      <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={form.matchingConsent} onChange={event => update('matchingConsent', event.target.checked)} />{isRTL ? 'اختياري: أوافق على استخدام ملفي في المطابقة بالذكاء الاصطناعي. يمكنني إيقاف ذلك لاحقاً.' : 'Optional: use my profile for AI matching. I can disable this later.'}</label>
    </div>
    <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={saving} onClick={() => void save(false)}>{isRTL ? 'حفظ التقدم' : 'Save progress'}</Button><Button disabled={saving} onClick={() => void save(true)}>{saving ? (isRTL ? 'جارٍ الحفظ…' : 'Saving…') : (isRTL ? 'حفظ والمتابعة' : 'Save and continue')}</Button></div>
    {studentData?.onboarding_completed_at && <div className="flex flex-wrap gap-4 text-sm"><Link className="text-primary underline" to="/worker/cv">{isRTL ? 'إضافة سيرة ذاتية (اختياري)' : 'Add a CV (optional)'}</Link><Link className="text-primary underline" to="/worker/availability">{isRTL ? 'إدارة التوفر والتقويم' : 'Manage availability and calendar'}</Link></div>}
  </div>;
  if (!isMobile) return <WorkerDesktopShell>{body}</WorkerDesktopShell>;
  return <MobileLayout header={<PageHeader title={isRTL ? 'ملفي الشخصي' : 'My profile'} showBack backPath="/worker/profile" />}><div className="py-4">{body}</div></MobileLayout>;
}
