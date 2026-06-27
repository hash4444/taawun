import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Search,
  Bot,
  Sparkles,
  FileText,
  CalendarDays,
  Bell,
  Wallet,
  User,
  ChevronDown,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/worker/home', label: 'Home', icon: Home },
  { path: '/worker/jobs', label: 'Find Jobs', icon: Search },
  { path: '/worker/job-hunter', label: 'AI Job Hunter', icon: Bot },
  { path: '/worker/assistant', label: 'Career Assistant', icon: Sparkles },
  { path: '/worker/cv', label: 'CV Center', icon: FileText },
  { path: '/worker/events', label: 'Events', icon: CalendarDays },
  { path: '/worker/notifications', label: 'Notifications', icon: Bell },
  { path: '/worker/wallet', label: 'Wallet', icon: Wallet },
  { path: '/worker/profile', label: 'Profile', icon: User },
];

interface WorkerDesktopShellProps {
  children: ReactNode;
}

export function WorkerDesktopShell({ children }: WorkerDesktopShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useApp();
  const { profile, verificationStatus, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding/welcome');
  };

  const displayName = profile?.full_name || profile?.email || (isRTL ? 'حسابك' : 'Your account');

  return (
    <div className="hidden md:flex min-h-screen w-full bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-e border-border bg-card flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border flex-shrink-0">
          <img src={logo} alt="Taawun" className="w-8 h-8 rounded-lg object-contain" />
          <div className="leading-tight">
            <p className="text-card-title font-semibold text-foreground">Taawun</p>
            <p className="text-caption text-muted-foreground">{isRTL ? 'لوحة العامل' : 'Worker'}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body font-medium transition-colors text-start',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-1">
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-start"
          >
            <HelpCircle size={18} className="flex-shrink-0" />
            <span className="truncate">{isRTL ? 'المساعدة والدعم' : 'Help & Support'}</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-card-title font-semibold text-foreground truncate">{displayName}</h1>
            <StatusBadge status={verificationStatus} size="sm" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-primary" />
                </div>
                <span className="text-body font-medium text-foreground max-w-[140px] truncate">
                  {profile?.email}
                </span>
                <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate('/worker/profile')}>
                <User size={16} className="me-2" />
                {isRTL ? 'الملف الشخصي' : 'Profile'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings size={16} className="me-2" />
                {isRTL ? 'الإعدادات' : 'Settings'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut size={16} className="me-2" />
                {isRTL ? 'تسجيل الخروج' : 'Log Out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
