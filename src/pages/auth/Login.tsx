import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { OnboardingDesktopFrame } from '@/components/layout/OnboardingDesktopFrame';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { t, isRTL } = useApp();
  const { login, isAuthenticated, user, isLoading, signInWithGoogle } = useAuth();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const queryParams = new URLSearchParams(window.location.search);
  const roleIntent = queryParams.get('role');

  const handleGoogleSignIn = () => {
    signInWithGoogle(roleIntent || undefined);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      // Let AuthContext/useEffect handle navigation
      setLoading(false);
    } catch (error: unknown) {
      toast.error(isRTL ? 'فشل تسجيل الدخول' : 'Login failed', {
        description: error instanceof Error ? error.message : String(error),
      });
      setLoading(false);
    }
  };

  const formBody = (
    <>
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
        {isRTL ? 'تسجيل الدخول بجوجل' : 'Continue with Google'}
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

      <form onSubmit={handleLogin} className="space-y-6">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('password')}</Label>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
            >
              {t('forgotPassword')}
            </button>
          </div>
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

        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {loading ? t('loading') : t('login')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          {t('noAccount')}{' '}
          <button
            onClick={() => navigate('/auth/signup')}
            className="text-primary font-medium hover:underline"
          >
            {t('signup')}
          </button>
        </p>
      </div>
    </>
  );

  if (!isMobile) {
    return (
      <OnboardingDesktopFrame topAction={<LanguageSwitch />}>
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('login')}</h1>
        <p className="text-muted-foreground mb-6">{isRTL ? 'مرحباً بعودتك!' : 'Welcome back!'}</p>
        {formBody}
      </OnboardingDesktopFrame>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader
        title={t('login')}
        subtitle={isRTL ? 'مرحباً بعودتك!' : 'Welcome back!'}
        showBack
        backPath="/onboarding/role"
        action={<LanguageSwitch />}
      />

      <div className="flex-1 px-6">{formBody}</div>
    </div>
  );
}
