import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { accountHome, safeAuthRedirect } from '@/lib/auth';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading, authError } = useAuth();
  const { isRTL } = useApp();
  const [timedOut, setTimedOut] = useState(false);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const providerError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error');

  useEffect(() => {
    // The Supabase client consumes standard implicit/PKCE callbacks; no custom token is required.
    if (!providerError && !isLoading && user) {
      const redirect = user.needsOnboarding ? null : safeAuthRedirect(searchParams.get('redirect'), user.role);
      navigate(redirect || accountHome(user), { replace: true });
    }
  }, [isLoading, user, searchParams, navigate, providerError]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  const error = providerError || authError || (timedOut && !user ? (isRTL ? 'انتهت صلاحية تسجيل الدخول. حاول مرة أخرى.' : 'Sign-in could not be completed. Please try again.') : null);
  return <div className="min-h-screen flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
    <div className="max-w-md text-center space-y-4">
      {error ? <><p role="alert">{error}</p><Link className="text-primary underline" to="/auth/login">{isRTL ? 'العودة لتسجيل الدخول' : 'Back to sign in'}</Link></> : <>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p role="status">{isRTL ? 'جارٍ إكمال تسجيل الدخول…' : 'Completing sign in…'}</p>
      </>}
    </div>
  </div>;
}
