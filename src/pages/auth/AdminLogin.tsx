import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { language, setLanguage, isRTL } = useApp();
  const { signIn, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      toast.error(isRTL ? 'فشل تسجيل الدخول' : 'Login failed', {
        description: err?.message || 'Unknown error',
      });
      setLoading(false);
      return;
    }

    setLoading(false);
    // AuthContext will set isAdmin, then the useEffect above redirects
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with language toggle */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          <span className="font-semibold text-sm text-foreground">
            {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
          </span>
        </div>
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-medium">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1.5 transition-colors ${
              language === 'en'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1.5 transition-colors ${
              language === 'ar'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            AR
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'تسجيل دخول المسؤول' : 'Admin Login'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL ? 'الوصول مقصور على المسؤولين فقط' : 'Restricted to authorized administrators'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
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
              <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
