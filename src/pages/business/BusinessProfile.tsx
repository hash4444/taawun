import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { BusinessDesktopShell } from '@/components/layout/BusinessDesktopShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Shield,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  Users
} from 'lucide-react';

export default function BusinessProfile() {
  const { t, isRTL } = useApp();
  const { profile, businessData, verificationStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding/welcome');
  };

  const menuItems = [
    {
      icon: Building2,
      label: isRTL ? 'معلومات المنشأة' : 'Business Information',
      path: '/business/profile/info',
    },
    {
      icon: Shield,
      label: t('verification'),
      path: '/business/verification',
      badge: verificationStatus,
    },
    {
      icon: Users,
      label: isRTL ? 'إدارة العمال' : 'Worker Management',
      path: '/business/workers',
    },
    {
      icon: Star,
      label: isRTL ? 'التقييمات' : 'Ratings',
      path: '/business/ratings',
    },
    {
      icon: CreditCard,
      label: isRTL ? 'طرق الدفع' : 'Payment Methods',
      path: '/business/payment-methods',
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

  if (!isMobile) {
    return (
      <BusinessDesktopShell>
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-page-title text-foreground">{t('profile')}</h1>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                <Building2 size={32} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-card-title font-semibold text-foreground">
                  {(businessData?.trade_name as string | undefined) ||
                    (businessData?.legal_name as string | undefined) ||
                    (isRTL ? 'منشأتك' : 'Your Business')}
                </h2>
                <p className="text-body text-muted-foreground">{profile?.email}</p>
                <StatusBadge status={verificationStatus} size="sm" className="mt-2" />
              </div>
            </div>
          </div>

          <div className="card-elevated divide-y divide-border">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-start"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-primary" />
                </div>
                <span className="flex-1 text-start text-body font-medium text-foreground">
                  {item.label}
                </span>
                {item.badge && <StatusBadge status={item.badge} size="sm" showIcon={false} />}
                <ArrowIcon size={18} className="text-muted-foreground" />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive-light max-w-xs"
          >
            <LogOut size={18} className="me-2" />
            {isRTL ? 'تسجيل الخروج' : 'Log Out'}
          </Button>
        </div>
      </BusinessDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title={t('profile')} />}
      footer={<BottomNav />}
      noPadding
    >
      {/* Profile Card */}
      <div className="px-4 py-4">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
              <Building2 size={32} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {(businessData?.trade_name as string | undefined) || (businessData?.legal_name as string | undefined) || (isRTL ? 'منشأتك' : 'Your Business')}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
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
