import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  User,
  Shield,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkerProfile() {
  const { t, isRTL } = useApp();
  const { profile, user, verificationStatus, signOut } = useAuth();
  const navigate = useNavigate();

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding/welcome');
  };

  const menuItems = [
    {
      icon: User,
      label: isRTL ? 'معلوماتي الشخصية' : 'Personal Information',
      path: '/worker/profile/personal-information',
    },
    {
      icon: Shield,
      label: t('verification'),
      path: '/worker/verification',
      badge: verificationStatus,
    },
    {
      icon: FileText,
      label: isRTL ? 'السيرة الذاتية' : 'My CV',
      path: '/worker/cv',
    },
    {
      icon: HelpCircle,
      label: isRTL ? 'المساعدة والدعم' : 'Help & Support',
      path: '/help',
    },
    {
      icon: Settings,
      label: isRTL ? 'الإعدادات' : 'Settings',
      path: '/settings',
    },
  ];

  return (
    <MobileLayout
      footer={<BottomNav />}
      noPadding
    >
      <PageHeader title={t('profile')} />
      {/* Profile Card */}
      <div className="px-4 py-4">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || (isRTL ? 'مستخدم' : 'User'))}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <StatusBadge
                status={verificationStatus}
                size="sm"
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 pb-4">
        <div className="card-elevated divide-y divide-border">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className="text-primary" />
              </div>
              <span className="flex-1 text-start font-medium text-foreground">
                {item.label}
              </span>
              {item.badge && (
                <StatusBadge status={item.badge} size="sm" showIcon={false} />
              )}
              <ArrowIcon size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-6">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive-light"
        >
          <LogOut size={18} className="me-2" />
          {isRTL ? 'تسجيل الخروج' : 'Log Out'}
        </Button>
      </div>
    </MobileLayout>
  );
}
