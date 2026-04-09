import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Shield, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';

export default function AdminDashboard() {
  const { isRTL } = useApp();
  const navigate = useNavigate();
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  const menuItems = [
    { icon: Shield, label: isRTL ? 'طلبات التحقق' : 'Verification Queue', path: '/admin/verifications', count: 0 },
    { icon: AlertTriangle, label: isRTL ? 'النزاعات' : 'Disputes Queue', path: '/admin/disputes', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title={isRTL ? 'لوحة الإدارة' : 'Admin Dashboard'} />
      <div className="px-4 py-4">
        <div className="card-elevated divide-y divide-border">
          {menuItems.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 hover:bg-muted/50">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <item.icon size={20} className="text-primary" />
              </div>
              <span className="flex-1 text-start font-medium">{item.label}</span>
              <Arrow size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
