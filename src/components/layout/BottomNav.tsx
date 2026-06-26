import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { Home, CalendarDays, Bell, User, LayoutDashboard, Plus, Sparkles, BarChart3 } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  const { t, isRTL } = useApp();
  const { profile } = useAuth();

  const workerNavItems = [
    { path: '/worker/home', icon: Home, label: t('home') },
    { path: '/worker/assistant', icon: Sparkles, label: isRTL ? 'المساعد' : 'Assistant' },
    { path: '/worker/events', icon: CalendarDays, label: isRTL ? 'فعاليات' : 'Events' },
    { path: '/worker/notifications', icon: Bell, label: isRTL ? 'إشعارات' : 'Alerts' },
    { path: '/worker/profile', icon: User, label: t('profile') },
  ];

  const businessNavItems = [
    { path: '/business/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/business/assistant', icon: Sparkles, label: isRTL ? 'المساعد' : 'Assistant' },
    { path: '/business/post-shift', icon: Plus, label: t('postShift') },
    { path: '/business/intelligence', icon: BarChart3, label: isRTL ? 'ذكاء' : 'CI' },
    { path: '/business/profile', icon: User, label: t('profile') },
  ];

  const navItems = profile?.role === 'business' ? businessNavItems : workerNavItems;

  return (
    <nav className="flex items-center justify-around py-2 px-4">
      {navItems.map((item) => {
        const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
              isActive
                ? 'text-primary bg-primary/10 dark:bg-primary/15'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
