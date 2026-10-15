import { Home, Search, ClipboardList, User, LayoutDashboard, Plus, Users, Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  const { isRTL } = useApp();
  const { profile } = useAuth();
  const items = profile?.role === 'business' ? [
    { path: '/business/dashboard', icon: LayoutDashboard, en: 'Jobs', ar: 'الوظائف' },
    { path: '/business/post-job', icon: Plus, en: 'Post a job', ar: 'نشر وظيفة' },
    { path: '/business/workers', icon: Users, en: 'Candidates', ar: 'المرشحون' },
    { path: '/business/profile', icon: Building2, en: 'Profile', ar: 'الملف' },
  ] : [
    { path: '/worker/home', icon: Home, en: 'Home', ar: 'الرئيسية' },
    { path: '/worker/explore', icon: Search, en: 'Explore', ar: 'استكشف' },
    { path: '/worker/applications', icon: ClipboardList, en: 'Applications', ar: 'طلباتي' },
    { path: '/worker/profile', icon: User, en: 'Profile', ar: 'الملف' },
  ];
  return <nav aria-label={isRTL ? 'التنقل الرئيسي' : 'Main navigation'} className="grid grid-cols-4 gap-1 p-2">{items.map(item => {
    const active = currentPath === item.path || currentPath.startsWith(item.path + '/');
    const Icon = item.icon;
    return <button key={item.path} aria-current={active ? 'page' : undefined} onClick={() => navigate(item.path)} className={cn('flex flex-col items-center gap-1 min-w-0 px-1 py-2 rounded-xl', active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground')}><Icon size={21} aria-hidden="true" /><span className="text-xs font-medium">{isRTL ? item.ar : item.en}</span></button>;
  })}</nav>;
}
