import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { OnboardingDesktopFrame } from '@/components/layout/OnboardingDesktopFrame';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { accountHome, signupRole } from '@/lib/auth';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t, isRTL } = useApp();
  const { register, user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const selectedRole = signupRole(params.get('role'));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  useEffect(() => { if (!isLoading && user) navigate(accountHome(user), { replace: true }); }, [isLoading, user, navigate]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
    setBusy(true);
    try {
      const result = await register(email, password, selectedRole, phone, fullName);
      if (result.requiresEmailConfirmation) setConfirmation(true);
      else toast.success(isRTL ? 'تم إنشاء الحساب' : 'Account created');
    } catch (error) { toast.error(isRTL ? 'تعذر إنشاء الحساب' : 'Could not create account', { description: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(false); }
  };
  const body = <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
    <p className="text-muted-foreground">{selectedRole === 'business' ? (isRTL ? 'اعثر على المواهب الطلابية في الإمارات.' : 'Hire student and graduate talent in the UAE.') : (isRTL ? 'فرص عمل تناسب دراستك — للطلاب والخريجين بعمر 18 سنة فأكثر.' : 'Work that fits your studies — for students and graduates aged 18 and above.')}</p>
    {confirmation ? <div role="status" className="rounded-lg bg-primary/5 p-4 space-y-3"><h2 className="font-semibold">{isRTL ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</h2><p>{isRTL ? `أرسلنا رابط تأكيد إلى ${email}. افتحه ثم أكمل ملفك الشخصي.` : `We sent a confirmation link to ${email}. Open it to finish setting up your profile.`}</p><Link to="/auth/login" className="text-primary underline">{t('login')}</Link></div> : <>
      <SocialAuthButtons role={selectedRole} />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="signup-name">{t('fullName')}</Label><Input id="signup-name" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" maxLength={120} required /></div>
        <div className="space-y-2"><Label htmlFor="signup-email">{t('email')}</Label><Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div className="space-y-2"><Label htmlFor="signup-phone">{t('phone')} ({isRTL ? 'اختياري' : 'optional'})</Label><Input id="signup-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="+971 50 123 4567" /></div>
        <div className="space-y-2"><Label htmlFor="signup-password">{t('password')}</Label><Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={12} required /><p className="text-xs text-muted-foreground">{isRTL ? '12 حرفاً على الأقل.' : 'Use at least 12 characters.'}</p></div>
        <div className="space-y-2"><Label htmlFor="signup-confirm">{t('confirmPassword')}</Label><Input id="signup-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></div>
        <Button type="submit" className="w-full h-12" disabled={busy || isLoading || !fullName.trim() || password !== confirmPassword}>{busy ? t('loading') : t('signup')}</Button>
      </form>
    </>}
    <p className="text-sm text-center">{t('hasAccount')} <Link to="/auth/login" className="text-primary underline">{t('login')}</Link></p>
  </div>;
  if (!isMobile) return <OnboardingDesktopFrame topAction={<LanguageSwitch />}><h1 className="text-2xl font-bold mb-4">{t('signup')}</h1>{body}</OnboardingDesktopFrame>;
  return <div className="min-h-screen bg-background"><PageHeader title={t('signup')} showBack backPath="/onboarding/role" action={<LanguageSwitch />} /><div className="px-6 py-6 max-w-md mx-auto">{body}</div></div>;
}
