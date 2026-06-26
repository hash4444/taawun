import { useState, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSaveCV, CVPersonalInfo, CVEducation, CVExperience, CVLanguage } from '@/hooks/useCV';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Plus, Trash2, ChevronRight, ChevronLeft, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  { en: 'Personal Info', ar: 'المعلومات الشخصية' },
  { en: 'Experience', ar: 'الخبرة' },
  { en: 'Education', ar: 'التعليم' },
  { en: 'Skills & Languages', ar: 'المهارات واللغات' },
  { en: 'Summary', ar: 'الملخص' },
];

export default function CVBuilder() {
  const { isRTL } = useApp();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const saveCV = useSaveCV();

  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<CVPersonalInfo>({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    city: '',
    country: '',
    linkedIn: '',
  });

  const [experience, setExperience] = useState<CVExperience[]>([
    { company: '', title: '', startDate: '', endDate: '', current: false, description: '' },
  ]);

  const [education, setEducation] = useState<CVEducation[]>([
    { institution: '', degree: '', field: '', startYear: '', endYear: '' },
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [languages, setLanguages] = useState<CVLanguage[]>([
    { name: '', level: 'Intermediate' },
  ]);
  const [summary, setSummary] = useState('');

  const addExperience = () => setExperience(prev => [...prev, { company: '', title: '', startDate: '', endDate: '', current: false, description: '' }]);
  const removeExperience = (i: number) => setExperience(prev => prev.filter((_, idx) => idx !== i));

  const addEducation = () => setEducation(prev => [...prev, { institution: '', degree: '', field: '', startYear: '', endYear: '' }]);
  const removeEducation = (i: number) => setEducation(prev => prev.filter((_, idx) => idx !== i));

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addLanguage = () => setLanguages(prev => [...prev, { name: '', level: 'Intermediate' }]);
  const removeLanguage = (i: number) => setLanguages(prev => prev.filter((_, idx) => idx !== i));

  const generateSummaryWithAI = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cv-ai-summary', {
        body: { personalInfo, experience, education, skills, languages },
      });
      if (error) throw error;
      if (data?.summary) setSummary(data.summary);
    } catch (e) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: isRTL ? 'فشل في إنشاء الملخص' : 'Failed to generate summary', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    saveCV.mutate(
      {
        title: personalInfo.fullName ? `${personalInfo.fullName}'s CV` : 'My CV',
        personal_info: personalInfo,
        education,
        experience,
        skills,
        languages,
        summary,
        is_ai_generated: true,
        file_url: null,
      },
      {
        onSuccess: (data) => {
          toast({ title: isRTL ? 'تم الحفظ' : 'CV Saved!' });
          navigate(`/worker/cv/preview/${(data as { id: string }).id}`);
        },
        onError: () => {
          toast({ title: isRTL ? 'خطأ' : 'Error', variant: 'destructive' });
        },
      }
    );
  };

  const updateExp = (i: number, field: keyof CVExperience, value: string | boolean) => {
    setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const updateEdu = (i: number, field: keyof CVEducation, value: string) => {
    setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const updateLang = (i: number, field: keyof CVLanguage, value: string) => {
    setLanguages(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const progressBar = (
    <div className="px-4 pt-4 pb-2">
      <div className="flex gap-1 mb-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-foreground">
        {STEPS[step][isRTL ? 'ar' : 'en']}
      </p>
    </div>
  );

  const stepsContent = (
    <div className="flex-1 px-4 py-4 overflow-y-auto pb-32">
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input value={personalInfo.fullName} onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input type="email" value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
              <Input value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRTL ? 'المدينة' : 'City'}</Label>
                <Input value={personalInfo.city} onChange={e => setPersonalInfo(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div>
                <Label>{isRTL ? 'الدولة' : 'Country'}</Label>
                <Input value={personalInfo.country} onChange={e => setPersonalInfo(p => ({ ...p, country: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={personalInfo.linkedIn} onChange={e => setPersonalInfo(p => ({ ...p, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        )}

        {/* Step 1: Experience */}
        {step === 1 && (
          <div className="space-y-5">
            {experience.map((exp, i) => (
              <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{isRTL ? `خبرة ${i + 1}` : `Experience ${i + 1}`}</span>
                  {experience.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeExperience(i)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>{isRTL ? 'المسمى الوظيفي' : 'Job Title'}</Label>
                  <Input value={exp.title} onChange={e => updateExp(i, 'title', e.target.value)} />
                </div>
                <div>
                  <Label>{isRTL ? 'الشركة' : 'Company'}</Label>
                  <Input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isRTL ? 'من' : 'From'}</Label>
                    <Input type="month" value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label>{isRTL ? 'إلى' : 'To'}</Label>
                    <Input type="month" value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} disabled={exp.current} placeholder={exp.current ? (isRTL ? 'حالياً' : 'Present') : ''} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={exp.current} onChange={e => updateExp(i, 'current', e.target.checked)} className="rounded" />
                  {isRTL ? 'أعمل حالياً هنا' : 'Currently working here'}
                </label>
                <div>
                  <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
                  <Textarea value={exp.description} onChange={e => updateExp(i, 'description', e.target.value)} rows={3} />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addExperience} className="w-full">
              <Plus size={16} className="me-1" /> {isRTL ? 'إضافة خبرة' : 'Add Experience'}
            </Button>
          </div>
        )}

        {/* Step 2: Education */}
        {step === 2 && (
          <div className="space-y-5">
            {education.map((edu, i) => (
              <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{isRTL ? `تعليم ${i + 1}` : `Education ${i + 1}`}</span>
                  {education.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeEducation(i)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>{isRTL ? 'المؤسسة' : 'Institution'}</Label>
                  <Input value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)} />
                </div>
                <div>
                  <Label>{isRTL ? 'الدرجة' : 'Degree'}</Label>
                  <Input value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder={isRTL ? 'بكالوريوس' : "Bachelor's"} />
                </div>
                <div>
                  <Label>{isRTL ? 'التخصص' : 'Field of Study'}</Label>
                  <Input value={edu.field} onChange={e => updateEdu(i, 'field', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isRTL ? 'سنة البدء' : 'Start Year'}</Label>
                    <Input type="number" value={edu.startYear} onChange={e => updateEdu(i, 'startYear', e.target.value)} placeholder="2020" />
                  </div>
                  <div>
                    <Label>{isRTL ? 'سنة التخرج' : 'End Year'}</Label>
                    <Input type="number" value={edu.endYear} onChange={e => updateEdu(i, 'endYear', e.target.value)} placeholder="2024" />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addEducation} className="w-full">
              <Plus size={16} className="me-1" /> {isRTL ? 'إضافة تعليم' : 'Add Education'}
            </Button>
          </div>
        )}

        {/* Step 3: Skills & Languages */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">{isRTL ? 'المهارات' : 'Skills'}</Label>
              <div className="flex gap-2 mb-2">
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder={isRTL ? 'أضف مهارة...' : 'Add a skill...'} />
                <Button onClick={addSkill} size="sm">{isRTL ? 'إضافة' : 'Add'}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-primary-light text-primary text-sm rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => setSkills(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{isRTL ? 'اللغات' : 'Languages'}</Label>
              {languages.map((lang, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <Input value={lang.name} onChange={e => updateLang(i, 'name', e.target.value)} placeholder={isRTL ? 'اللغة' : 'Language'} />
                  </div>
                  <select
                    value={lang.level}
                    onChange={e => updateLang(i, 'level', e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Beginner">{isRTL ? 'مبتدئ' : 'Beginner'}</option>
                    <option value="Intermediate">{isRTL ? 'متوسط' : 'Intermediate'}</option>
                    <option value="Advanced">{isRTL ? 'متقدم' : 'Advanced'}</option>
                    <option value="Native">{isRTL ? 'لغة أم' : 'Native'}</option>
                  </select>
                  {languages.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeLanguage(i)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLanguage}>
                <Plus size={14} className="me-1" /> {isRTL ? 'إضافة لغة' : 'Add Language'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{isRTL ? 'الملخص المهني' : 'Professional Summary'}</Label>
              <Button size="sm" variant="outline" onClick={generateSummaryWithAI} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={14} className="me-1 animate-spin" /> : <Sparkles size={14} className="me-1" />}
                {isRTL ? 'إنشاء بالذكاء الاصطناعي' : 'AI Generate'}
              </Button>
            </div>
            <Textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={6}
              placeholder={isRTL ? 'اكتب ملخصاً عن نفسك أو اضغط "إنشاء بالذكاء الاصطناعي"' : 'Write a summary or click "AI Generate"'}
            />
          </div>
        )}
    </div>
  );

  const stepNavButtons = (
    <div className="flex gap-3">
      {step > 0 && (
        <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
          {isRTL ? <ChevronRight size={16} className="me-1" /> : <ChevronLeft size={16} className="me-1" />}
          {isRTL ? 'السابق' : 'Back'}
        </Button>
      )}
      {step < STEPS.length - 1 ? (
        <Button onClick={() => setStep(s => s + 1)} className="flex-1">
          {isRTL ? 'التالي' : 'Next'}
          {isRTL ? <ChevronLeft size={16} className="ms-1" /> : <ChevronRight size={16} className="ms-1" />}
        </Button>
      ) : (
        <Button onClick={handleSave} disabled={saveCV.isPending} className="flex-1">
          {saveCV.isPending ? <Loader2 size={16} className="me-1 animate-spin" /> : null}
          {isRTL ? 'حفظ وعرض' : 'Save & Preview'}
        </Button>
      )}
    </div>
  );

  const livePreviewPanel = (
    <div className="card-elevated p-5 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <FileText size={16} />
        <h2 className="text-card-title font-semibold text-foreground">
          {isRTL ? 'معاينة مباشرة' : 'Live Preview'}
        </h2>
      </div>
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-foreground">{personalInfo.fullName || (isRTL ? 'اسمك الكامل' : 'Your Full Name')}</p>
          <p className="text-caption text-muted-foreground">
            {[personalInfo.email, personalInfo.phone].filter(Boolean).join(' • ') || (isRTL ? 'بيانات الاتصال' : 'Contact details')}
          </p>
          <p className="text-caption text-muted-foreground">
            {[personalInfo.city, personalInfo.country].filter(Boolean).join(', ')}
          </p>
        </div>

        {summary && (
          <div>
            <p className="text-caption font-semibold text-foreground uppercase tracking-wide mt-3">
              {isRTL ? 'الملخص' : 'Summary'}
            </p>
            <p className="text-caption text-muted-foreground line-clamp-4">{summary}</p>
          </div>
        )}

        {experience.some(e => e.title || e.company) && (
          <div>
            <p className="text-caption font-semibold text-foreground uppercase tracking-wide mt-3">
              {isRTL ? 'الخبرة' : 'Experience'}
            </p>
            {experience.filter(e => e.title || e.company).map((exp, i) => (
              <p key={i} className="text-caption text-muted-foreground">
                {exp.title}{exp.title && exp.company ? ' — ' : ''}{exp.company}
              </p>
            ))}
          </div>
        )}

        {education.some(e => e.institution) && (
          <div>
            <p className="text-caption font-semibold text-foreground uppercase tracking-wide mt-3">
              {isRTL ? 'التعليم' : 'Education'}
            </p>
            {education.filter(e => e.institution).map((edu, i) => (
              <p key={i} className="text-caption text-muted-foreground">
                {edu.degree}{edu.degree && edu.institution ? ' — ' : ''}{edu.institution}
              </p>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <p className="text-caption font-semibold text-foreground uppercase tracking-wide mt-3">
              {isRTL ? 'المهارات' : 'Skills'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skills.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary-light text-primary text-caption rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="max-w-5xl space-y-6">
          <h1 className="text-page-title text-foreground">
            {isRTL ? 'إنشاء السيرة الذاتية' : 'Build Your CV'}
          </h1>

          <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
            <div className="card-elevated overflow-hidden">
              {progressBar}
              {stepsContent}
              <div className="p-4 border-t border-border">
                {stepNavButtons}
              </div>
            </div>

            {livePreviewPanel}
          </div>
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title={isRTL ? 'إنشاء السيرة الذاتية' : 'Build Your CV'} showBack />}
      noPadding
    >
      {progressBar}
      {stepsContent}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border pb-safe">
        {stepNavButtons}
      </div>
    </MobileLayout>
  );
}
