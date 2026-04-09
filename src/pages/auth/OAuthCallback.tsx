import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSessionFromToken, user, isLoading } = useAuth();
  const { isRTL } = useApp();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setSessionFromToken(token);
    } else {
      navigate('/auth/login');
    }
  }, [searchParams, setSessionFromToken, navigate]);

  useEffect(() => {
    if (!isLoading && user) {
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath);
        return;
      }

      // Fallback logic
      const role = user.role.toUpperCase();
      if (role === 'WORKER') {
        navigate('/worker/home');
      } else if (role === 'BUSINESS' || role === 'RECRUITER' || role === 'COMPANY_ADMIN') {
        navigate('/business/dashboard');
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        // Default fallback
        navigate('/worker/home');
      }
    }
  }, [user, isLoading, navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">
          {isRTL ? 'جاري تسجيل الدخول...' : 'Completing sign in...'}
        </p>
      </div>
    </div>
  );
}
