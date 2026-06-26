import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminHeaderProps {
  title: string;
  showBack?: boolean;
  backPath?: string;
}

export function AdminHeader({ title, showBack, backPath }: AdminHeaderProps) {
  const { language, setLanguage, isRTL } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    // Redirect to admin login
    const adminOrigin = window.location.hostname === 'admin.skillanything.ai'
      ? 'https://admin.skillanything.ai'
      : window.location.origin;
    window.location.href = `${adminOrigin}/auth/login`;
  };

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-background border-b border-border px-4 py-3">
      {/* Top row: logo + lang toggle + sign out */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          <span className="font-semibold text-sm text-foreground">
            {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
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

          {/* Sign out */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
            >
              <LogOut size={14} />
              {isRTL ? 'خروج' : 'Sign Out'}
            </Button>
          )}
        </div>
      </div>

      {/* Title row with optional back */}
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            {isRTL ? '→' : '←'}
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
    </div>
  );
}
