import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { User, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';

type RoleType = 'worker' | 'business' | null;

export default function RoleSelection() {
  const navigate = useNavigate();
  const { t, isRTL } = useApp();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/auth/signup?role=${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-4 pt-safe">
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => navigate('/onboarding/welcome')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon size={20} />
            <span>{t('back')}</span>
          </button>
          <LanguageSwitch />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('selectRole')}</h1>
        <p className="text-muted-foreground mb-8">
          {isRTL ? 'اختر كيف ستستخدم تعاون' : "Choose how you'll use Taawun"}
        </p>

        <div className="space-y-4 flex-1">
          <button
            onClick={() => setSelectedRole('worker')}
            className={cn(
              'w-full p-6 rounded-2xl border-2 transition-all duration-200 text-start',
              selectedRole === 'worker'
                ? 'border-primary bg-primary-light shadow-md'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0', selectedRole === 'worker' ? 'bg-primary' : 'bg-muted')}>
                <User size={28} className={selectedRole === 'worker' ? 'text-primary-foreground' : 'text-muted-foreground'} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t('workerRole')}</h3>
                <p className="text-muted-foreground">{t('workerRoleDesc')}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('business')}
            className={cn(
              'w-full p-6 rounded-2xl border-2 transition-all duration-200 text-start',
              selectedRole === 'business'
                ? 'border-primary bg-primary-light shadow-md'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0', selectedRole === 'business' ? 'bg-primary' : 'bg-muted')}>
                <Building2 size={28} className={selectedRole === 'business' ? 'text-primary-foreground' : 'text-muted-foreground'} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t('businessRole')}</h3>
                <p className="text-muted-foreground">{t('businessRoleDesc')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="px-6 pb-8 pb-safe">
        <Button onClick={handleContinue} disabled={!selectedRole} className="w-full h-14 text-lg font-semibold" size="lg">
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
