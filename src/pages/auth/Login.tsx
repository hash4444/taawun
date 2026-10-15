import { useEffect, useState } from 'react';
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
import { accountHome, safeAuthRedirect } from '@/lib/auth';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t, isRTL } = useApp();
  const { login, user, isLoading, authError, refreshProfile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isLoading && user) navigate(user.needsOnboarding ? accountHome(user) : safeAuthRedirect(params.get('redirect'), user.role) || accountHome(user), { replace: true });
  }, [isLoading, user, params, navigate]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await login(email, password); }
    catch (error) { toast.error(isRTL ? 'تعذر تسجيل الدخول' : 'Sign-in failed', { description: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(false); }
  };
  const body = <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
    {authError && <div role="alert" className="p-3 rounded-lg border border-destructive space-y-2"><p>{authError}</p><Button type="button" variant="outline" onClick={() => void refreshProfile()}>{isRTL ? 'إعادة المحاولة' : 'Retry account load'}</Button><Button type="button" variant="ghost" onClick={() => void signOut().catch(error => toast.error(error.message))}>{isRTL ? 'تسجيل الخروج' : 'Sign out'}</Button></div>}
    <SocialAuthButtons role={params.get('role') || undefined} />
    <p className="text-center text-xs text-muted-foreground">{isRTL ? 'أو باستخدام البريد الإلكتروني' : 'Or sign in with email'}</p>
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="email">{t('email')}</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <div className="space-y-2"><div className="flex justify-between gap-3"><Label htmlFor="password">{t('password')}</Label><Link to="/auth/reset-password" className="text-sm text-primary underline">{t('forgotPassword')}</Link></div><Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /><label className="text-xs flex items-center gap-2"><input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />{isRTL ? 'إظهار كلمة المرور' : 'Show password'}</label></div>
      <Button type="submit" className="w-full h-12" disabled={busy || isLoading}>{busy ? t('loading') : t('login')}</Button>
    </form>
    <p className="text-sm text-center">{t('noAccount')} <Link to={`/auth/signup${params.get('role') === 'business' ? '?role=business' : ''}`} className="text-primary underline">{t('signup')}</Link></p>
  </div>;
  if (!isMobile) return <OnboardingDesktopFrame topAction={<LanguageSwitch />}><h1 className="text-2xl font-bold mb-6">{t('login')}</h1>{body}</OnboardingDesktopFrame>;
  return <div className="min-h-screen bg-background"><PageHeader title={t('login')} showBack backPath="/onboarding/role" action={<LanguageSwitch />} /><div className="px-6 py-6 max-w-md mx-auto">{body}</div></div>;
}
