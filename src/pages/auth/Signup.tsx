import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { OnboardingDesktopFrame } from '@/components/layout/OnboardingDesktopFrame';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, isRTL } = useApp();
  const { register, signInWithGoogle, user, isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();

  const roleParam = searchParams.get('role');
  const selectedRole = roleParam === 'business' ? 'business' : 'worker';

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const role = user.role.toUpperCase();
      if (role === 'BUSINESS' || role === 'RECRUITER' || role === 'COMPANY_ADMIN') {
        navigate('/business/dashboard', { replace: true });
      } else {
        navigate('/worker/home', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, selectedRole);
      toast.success(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      setLoading(false);
      // Let AuthContext handle navigation
    } catch (error: unknown) {
      toast.error(isRTL ? 'فشل إنشاء الحساب' : 'Signup failed', {
        description: error instanceof Error ? error.message : String(error),
      });
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle(selectedRole);
  };

  const formBody = (
    <>
      <p className="text-muted-foreground mb-8">
        {isRTL ? 'أنشئ حسابك للبدء' : 'Create your account to get started'}
        {' - '}
        <span className="font-medium text-primary">
          {selectedRole === 'business'
            ? (isRTL ? 'صاحب عمل' : 'Business')
            : (isRTL ? 'عامل' : 'Worker')}
        </span>
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full h-14 text-lg font-medium mb-6 gap-3"
        size="lg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isRTL ? 'التسجيل بجوجل' : 'Continue with Google'}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {isRTL ? 'أو' : 'or'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              className="ps-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('phone')} ({isRTL ? 'اختياري' : 'optional'})</Label>
          <div className="relative">
            <Phone className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isRTL ? '+966 5x xxx xxxx' : '+966 5x xxx xxxx'}
              className="ps-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter password'}
              className="ps-10 pe-10 h-12"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isRTL ? 'أكد كلمة المرور' : 'Confirm password'}
              className="ps-10 h-12"
              required
            />
          </div>
          {password !== confirmPassword && confirmPassword && (
            <p className="text-sm text-destructive">
              {isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !email || !password || password !== confirmPassword}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {loading ? t('loading') : t('signup')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          {t('hasAccount')}{' '}
          <button
            onClick={() => navigate('/auth/login')}
            className="text-primary font-medium hover:underline"
          >
            {t('login')}
          </button>
        </p>
      </div>
    </>
  );

  if (!isMobile) {
    return (
      <OnboardingDesktopFrame topAction={<LanguageSwitch />}>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('signup')}</h1>
        {formBody}
      </OnboardingDesktopFrame>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader
        title={t('signup')}
        showBack
        backPath="/onboarding/role"
        action={<LanguageSwitch />}
      />

      <div className="flex-1 px-6">{formBody}</div>
    </div>
  );
}
