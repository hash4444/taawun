import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Bell, 
  Shield, 
  Info,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { isRTL, language, setLanguage, theme, setTheme } = useApp();
  const { profile, signOut } = useAuth();

  const backPath = profile?.role === 'business' ? '/business/profile' : '/worker/profile';
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleLanguageToggle = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(isRTL ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
      navigate('/onboarding/welcome', { replace: true });
    } catch (error) {
      toast.error(isRTL ? 'فشل تسجيل الخروج' : 'Logout failed');
    }
  };

  const settingsGroups = [
    {
      title: isRTL ? 'التفضيلات' : 'Preferences',
      items: [
        {
          icon: Globe,
          label: isRTL ? 'اللغة' : 'Language',
          description: language === 'ar' ? 'العربية' : 'English',
          type: 'toggle' as const,
          checked: language === 'ar',
          onToggle: handleLanguageToggle,
        },
        {
          icon: Bell,
          label: isRTL ? 'الإشعارات' : 'Notifications',
          description: isRTL ? 'مفعّلة' : 'Enabled',
          type: 'toggle' as const,
          checked: true,
          onToggle: () => {},
        },
        {
          icon: Moon,
          label: isRTL ? 'الوضع الداكن' : 'Dark Mode',
          description: theme === 'dark' ? (isRTL ? 'مفعّل' : 'On') : (isRTL ? 'معطّل' : 'Off'),
          type: 'toggle' as const,
          checked: theme === 'dark',
          onToggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        },
      ],
    },
    {
      title: isRTL ? 'الخصوصية والأمان' : 'Privacy & Security',
      items: [
        {
          icon: Shield,
          label: isRTL ? 'إعدادات الخصوصية' : 'Privacy Settings',
          type: 'link' as const,
        },
      ],
    },
    {
      title: isRTL ? 'حول التطبيق' : 'About',
      items: [
        {
          icon: Info,
          label: isRTL ? 'عن تعاون' : 'About Taawun',
          description: isRTL ? 'الإصدار 1.0.0' : 'Version 1.0.0',
          type: 'link' as const,
        },
      ],
    },
  ];

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={isRTL ? 'الإعدادات' : 'Settings'} 
          showBack 
          backPath={backPath} 
        />
      }
      noPadding
    >
      <div className="px-4 py-4 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {group.title}
            </h2>
            <div className="card-elevated divide-y divide-border">
              {group.items.map((item, itemIndex) => (
                <div 
                  key={itemIndex}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {item.type === 'toggle' && (
                    <Switch 
                      checked={item.checked} 
                      onCheckedChange={item.onToggle}
                    />
                  )}
                  {item.type === 'link' && (
                    <ArrowIcon size={18} className="text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={18} className="me-2" />
          {isRTL ? 'تسجيل الخروج' : 'Log out'}
        </Button>
      </div>
    </MobileLayout>
  );
}
